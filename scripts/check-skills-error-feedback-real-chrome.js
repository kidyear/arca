'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9297;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chromeCandidates() {
  const env = process.env;
  return [
    path.join(env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean);
}

function findBrowser() {
  const hit = chromeCandidates().find((p) => fs.existsSync(p));
  if (!hit) throw new Error('Chrome/Edge not found for skills error feedback check');
  return hit;
}

function getUrl(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) reject(new Error(`${url} -> ${res.statusCode}`));
        else resolve(data);
      });
    });
    req.on('error', reject);
    req.setTimeout(1000, () => req.destroy(new Error(`${url} timeout`)));
  });
}

async function waitForHttp(url, label) {
  for (let i = 0; i < 70; i += 1) {
    try { return await getUrl(url); } catch (_) { await wait(120); }
  }
  throw new Error(`${label} did not become ready`);
}

async function fetchJson(url) {
  return JSON.parse(await getUrl(url));
}

async function waitForPage(targetUrl) {
  const url = `http://127.0.0.1:${CDP_PORT}/json`;
  for (let i = 0; i < 70; i += 1) {
    try {
      const pages = await fetchJson(url);
      const page = pages.find((p) => p.url === targetUrl) || pages.find((p) => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (_) {
      // Browser is still starting.
    }
    await wait(120);
  }
  throw new Error('Chrome DevTools endpoint did not become ready');
}

function cdp(wsUrl) {
  if (typeof WebSocket !== 'function') throw new Error('This check needs Node with global WebSocket support');
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.id || !pending.has(msg.id)) return;
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result || {});
  };
  const opened = new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  return {
    async send(method, params = {}) {
      await opened;
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
    },
    close() {
      try { ws.close(); } catch (_) {}
    },
  };
}

async function waitForExit(child, timeoutMs = 2500) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function rmRetry(target) {
  for (let i = 0; i < 8; i += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      return;
    } catch (err) {
      if (i === 7) throw err;
      await wait(150);
    }
  }
}

async function main() {
  const profileDir = path.join(os.tmpdir(), `arca-skills-error-profile-${Date.now()}`);
  fs.rmSync(profileDir, { recursive: true, force: true });
  fs.mkdirSync(profileDir, { recursive: true });

  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true,
  });
  let browser;
  let client;
  try {
    await waitForHttp(`http://127.0.0.1:${APP_PORT}/`, 'Arca server');
    const pageUrl = `http://127.0.0.1:${APP_PORT}/`;
    browser = spawn(findBrowser(), [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${profileDir}`,
      pageUrl,
    ], { stdio: 'ignore', windowsHide: true });

    client = cdp(await waitForPage(pageUrl));
    await client.send('Runtime.enable');
    for (let i = 0; i < 70; i += 1) {
      const ready = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `document.readyState === 'complete' && typeof skillsView === 'object' && !!document.querySelector('#skills-entry')`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        localStorage.setItem('fb_guided', '1');
        document.querySelector('.guide-overlay')?.remove();
        window.confirmDialog = async () => true;
        const originalFetch = window.fetch.bind(window);
        const skillPayload = {
          ok: true,
          overview: {
            unique: 1,
            total: 1,
            active: 1,
            dust: 0,
            issues: 0,
            totalHits: 2,
            budgetChars: 120,
            budgetLimit: 10000,
            descCut: 12000,
          },
          items: [{
            name: 'demo-skill',
            label: 'Claude 全局',
            source: 'claude',
            dir: 'C:\\\\Users\\\\123\\\\.claude\\\\skills\\\\demo-skill',
            desc: '用于测试失败反馈',
            descLen: 8,
            hits: 2,
            last: Date.now(),
            disabled: false,
            residue: false,
            issues: [],
            copies: null,
          }],
        };
        window.fetch = (url, options = {}) => {
          const pathname = new URL(String(url || ''), location.href).pathname;
          if (pathname === '/api/skills') {
            return Promise.resolve(new Response(JSON.stringify(skillPayload), { status: 200, headers: { 'Content-Type': 'application/json' } }));
          }
          if (pathname === '/api/skills/toggle' || pathname === '/api/skills/trash') {
            return Promise.resolve(new Response(JSON.stringify({ ok: false }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
          }
          return originalFetch(url, options);
        };
        const waitFor = async (selector, label) => {
          for (let i = 0; i < 20; i += 1) {
            const el = document.querySelector(selector);
            if (el) return el;
            await new Promise((r) => setTimeout(r, 80));
          }
          throw new Error(label + ' missing: ' + selector);
        };
        document.querySelector('#skills-entry').click();
        const toggle = await waitFor('.sk-switch[data-act="toggle"]', 'toggle switch');
        toggle.click();
        await new Promise((r) => setTimeout(r, 160));
        const toggleToast = document.querySelector('#toast')?.textContent || '';
        if (!document.querySelector('.sk-row')) {
          skillsView.render();
        }
        skillsView.open.add(skillPayload.items[0].dir);
        skillsView.render();
        const trash = await waitFor('.sk-detail [data-act="trash"]', 'trash button');
        trash.click();
        await new Promise((r) => setTimeout(r, 160));
        const trashToast = document.querySelector('#toast')?.textContent || '';
        return {
          toggleToast,
          trashToast,
          rows: document.querySelectorAll('.sk-row').length,
          detailOpen: !!document.querySelector('.sk-detail'),
        };
      })()`,
    });
    if (result.exceptionDetails) {
      throw new Error(`Chrome skills evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    }
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No skills result returned: ${JSON.stringify(result)}`);
    if (value.rows !== 1) throw new Error(`expected one rendered skill row, got ${value.rows}`);
    if (value.toggleToast !== '操作失败：未知错误') {
      throw new Error(`unexpected toggle failure toast: ${value.toggleToast}`);
    }
    if (value.trashToast !== '删除失败：未知错误') {
      throw new Error(`unexpected trash failure toast: ${value.trashToast}`);
    }
    console.log('skills-error-feedback-real-chrome ok');
    console.log(JSON.stringify(value, null, 2));
  } finally {
    if (client) client.close();
    if (browser) browser.kill();
    server.kill();
    await waitForExit(browser);
    await waitForExit(server);
    await rmRetry(profileDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
