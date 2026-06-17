'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9254;

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
  if (!hit) throw new Error('Chrome/Edge not found for chat side resizer check');
  return hit;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForExit(child, timeoutMs = 2000) {
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
  for (let i = 0; i < 60; i += 1) {
    try {
      return await getUrl(url);
    } catch (_) {
      await wait(100);
    }
  }
  throw new Error(`${label} did not become ready`);
}

async function fetchJson(url) {
  return JSON.parse(await getUrl(url));
}

async function waitForPage(targetUrl) {
  const url = `http://127.0.0.1:${CDP_PORT}/json`;
  for (let i = 0; i < 60; i += 1) {
    try {
      const pages = await fetchJson(url);
      const page = pages.find((p) => p.url === targetUrl) || pages.find((p) => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (_) {
      // Browser is still starting.
    }
    await wait(100);
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
      const msgId = ++id;
      ws.send(JSON.stringify({ id: msgId, method, params }));
      return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
    },
    close() { try { ws.close(); } catch (_) { /* noop */ } },
  };
}

async function main() {
  let server;
  let browser;
  let client;
  const profile = path.join(os.tmpdir(), `arca-chat-side-resizer-${Date.now()}`);
  try {
    server = spawn(process.execPath, ['server.js'], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(APP_PORT), NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', () => {});
    server.stderr.on('data', () => {});
    await waitForHttp(`http://127.0.0.1:${APP_PORT}/`, 'Arca server');

    const pageUrl = `http://127.0.0.1:${APP_PORT}/`;
    browser = spawn(findBrowser(), [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${profile}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1600,1000',
      pageUrl,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    browser.stdout.on('data', () => {});
    browser.stderr.on('data', () => {});

    client = cdp(await waitForPage(pageUrl));
    await client.send('Runtime.enable');
    for (let i = 0; i < 60; i += 1) {
      const ready = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `document.readyState === 'complete' && typeof chat === 'object' && !!document.querySelector('#chat-side-resizer')`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }
    await wait(300);

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        localStorage.removeItem('arca_chat_side_width');
        chat.open();
        await new Promise((resolve) => setTimeout(resolve, 120));
        const side = document.querySelector('#chat-side');
        const handle = document.querySelector('#chat-side-resizer');
        const before = side.getBoundingClientRect().width;
        const handleRect = handle.getBoundingClientRect();
        const handleWidth = handleRect.width;
        const railOpacity = getComputedStyle(handle, '::after').opacity;
        const gripDisplay = getComputedStyle(handle, '::before').content;
        handle.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 11,
          pointerType: 'mouse',
          button: 0,
          clientX: handleRect.left + handleRect.width / 2,
          clientY: handleRect.top + handleRect.height / 2,
        }));
        window.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true,
          pointerId: 11,
          pointerType: 'mouse',
          button: 0,
          clientX: handleRect.left + 120,
          clientY: handleRect.top + handleRect.height / 2,
        }));
        window.dispatchEvent(new PointerEvent('pointerup', {
          bubbles: true,
          pointerId: 11,
          pointerType: 'mouse',
          button: 0,
          clientX: handleRect.left + 120,
          clientY: handleRect.top + handleRect.height / 2,
        }));
        await new Promise((resolve) => setTimeout(resolve, 80));
        const after = side.getBoundingClientRect().width;
        return {
          before,
          after,
          handleWidth,
          railOpacity,
          gripDisplay,
          stored: localStorage.getItem('arca_chat_side_width'),
          ariaNow: handle.getAttribute('aria-valuenow'),
          bodyResizing: document.body.classList.contains('chat-side-resizing'),
        };
      })()`,
    });
    if (result.exceptionDetails) throw new Error(`Chrome chat side resizer evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No chat side resizer result returned: ${JSON.stringify(result)}`);
    if (value.handleWidth < 12) throw new Error(`chat side resize handle is too narrow: ${JSON.stringify(value)}`);
    if (Number(value.railOpacity) <= 0) throw new Error(`chat side resize rail should be visible by default: ${JSON.stringify(value)}`);
    if (!value.gripDisplay || value.gripDisplay === 'none' || value.gripDisplay === 'normal') throw new Error(`chat side resize grip cue missing: ${JSON.stringify(value)}`);
    if (value.after <= value.before + 40) throw new Error(`dragging should noticeably widen chat side list: ${JSON.stringify(value)}`);
    if (!value.stored || Number(value.stored) !== Number(value.ariaNow)) throw new Error(`dragging should persist width and sync aria-valuenow: ${JSON.stringify(value)}`);
    if (value.bodyResizing) throw new Error(`drag end should clear resizing body state: ${JSON.stringify(value)}`);
    console.log('chat-side-resizer-real-chrome ok');
    console.log(JSON.stringify(value, null, 2));
  } finally {
    if (client) client.close();
    if (browser && browser.exitCode === null) browser.kill();
    await waitForExit(browser);
    if (server && server.exitCode === null) server.kill();
    await waitForExit(server);
    await rmRetry(profile);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
