'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9261;

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
  if (!hit) throw new Error('Chrome/Edge not found for AI settings friendly error check');
  return hit;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    try { return await getUrl(url); } catch (_) { await wait(100); }
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
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
    },
    close() {
      try { ws.close(); } catch (_) {}
    },
  };
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

async function main() {
  const profileDir = path.join(os.tmpdir(), `arca-ai-settings-friendly-profile-${Date.now()}`);
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
    for (let i = 0; i < 60; i += 1) {
      const ready = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `document.readyState === 'complete' && typeof aiSettings === 'object' && typeof aiSettings.open === 'function'`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `new Promise(async (resolve) => {
        localStorage.setItem('fb_guided', '1');
        document.querySelector('.guide-overlay')?.remove();
        let phase = 'providers-fail';
        const originalFetch = window.fetch.bind(window);
        const providerPayload = {
          active: 'deepseek',
          approvalMode: 'smart',
          providers: {
            deepseek: { label: 'DeepSeek', model: 'deepseek-v4-flash', hasKey: true, models: ['deepseek-v4-flash'] },
            claude: { label: 'Claude Code', model: 'sonnet', hasKey: false, models: ['sonnet'] },
          },
        };
        window.fetch = (url, options) => {
          const path = new URL(String(url || ''), location.href).pathname;
          if (path === '/api/ai/providers') {
            if (phase === 'providers-fail') return Promise.reject(new TypeError('Failed to fetch'));
            return Promise.resolve(new Response(JSON.stringify(providerPayload), { status: 200, headers: { 'Content-Type': 'application/json' } }));
          }
          if (path === '/api/ai/models') {
            if (phase === 'models-fail') return Promise.resolve(new Response(JSON.stringify({ ok: false, error: 'invalid api key' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
            return Promise.resolve(new Response(JSON.stringify({ ok: true, models: ['deepseek-v4-flash'] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
          }
          if (path === '/api/ai/config') {
            return Promise.resolve(new Response(JSON.stringify({ ok: false, error: 'Direct API 429 insufficient_quota' }), { status: 429, headers: { 'Content-Type': 'application/json' } }));
          }
          return originalFetch(url, options);
        };
        await aiSettings.open();
        await new Promise((r) => setTimeout(r, 120));
        const providersFail = {
          toast: document.querySelector('#toast')?.textContent || '',
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
        };
        phase = 'ok';
        await aiSettings.open();
        await new Promise((r) => setTimeout(r, 120));
        phase = 'models-fail';
        await aiSettings.fetchModels(false);
        await new Promise((r) => setTimeout(r, 120));
        const modelsFail = {
          status: document.querySelector('#ai-status').textContent,
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
        };
        phase = 'save-fail';
        document.querySelector('#ai-key').value = '';
        document.querySelector('#ai-model').value = 'deepseek-v4-flash';
        document.querySelector('#ai-model').dispatchEvent(new Event('input', { bubbles: true }));
        await aiSettings.save();
        await new Promise((r) => setTimeout(r, 120));
        const saveFail = {
          status: document.querySelector('#ai-status').textContent,
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
        };
        resolve({ providersFail, modelsFail, saveFail });
      })`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome AI settings friendly error evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No AI settings friendly error result returned: ${JSON.stringify(result)}`);
    if (!value.providersFail.toast.includes('读取 AI 配置失败：AI 设置暂时无法连接，请稍后重试')) throw new Error(`provider failure should be friendly: ${JSON.stringify(value)}`);
    if (value.providersFail.toast.includes('Failed to fetch') || value.providersFail.settingsOpen) throw new Error(`provider failure leaked raw error or opened modal: ${JSON.stringify(value)}`);
    if (!value.modelsFail.status.includes('拉取失败：AI 认证失败，请检查 API key')) throw new Error(`model fetch failure should be friendly: ${JSON.stringify(value)}`);
    if (value.modelsFail.status.includes('invalid api key') || !value.modelsFail.settingsOpen) throw new Error(`model fetch failure leaked raw error or closed modal: ${JSON.stringify(value)}`);
    if (!value.saveFail.status.includes('保存失败：AI 服务限流或额度不足，请稍后重试')) throw new Error(`save failure should be friendly: ${JSON.stringify(value)}`);
    if (value.saveFail.status.includes('429') || value.saveFail.status.includes('insufficient_quota') || !value.saveFail.settingsOpen) throw new Error(`save failure leaked raw error or closed modal: ${JSON.stringify(value)}`);
    console.log('ai-settings-friendly-error-real-chrome ok');
    console.log(JSON.stringify(value, null, 2));
  } finally {
    if (client) client.close();
    if (browser) {
      browser.kill();
      await waitForExit(browser);
    }
    if (server) {
      server.kill();
      await waitForExit(server);
    }
    await rmRetry(profileDir);
  }
}

main().catch((err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
