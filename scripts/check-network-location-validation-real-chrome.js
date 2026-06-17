'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9252;

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
  if (!hit) throw new Error('Chrome/Edge not found for network location validation check');
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
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
    },
    close() {
      try { ws.close(); } catch (_) {}
    },
  };
}

async function main() {
  const profileDir = path.join(os.tmpdir(), `arca-network-location-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof addNetworkLocation === 'function' && typeof normalizeNetworkLocationInput === 'function'`,
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
        const calls = [];
        const toasts = [];
        const oldInputDialog = inputDialog;
        const oldFetch = window.fetch;
        const oldToast = toast;
        const oldLoadFavorites = loadFavorites;
        try {
          toast = (message, error) => toasts.push({ message, error: !!error });
          window.fetch = async (url, opts = {}) => {
            const method = String(opts.method || 'GET').toUpperCase();
            const body = opts.body ? JSON.parse(opts.body) : null;
            calls.push({ type: method === 'POST' ? 'apiPost' : 'api', url: String(url), body });
            if (String(url).startsWith('/api/stat?')) {
              const statPath = new URL(String(url), location.href).searchParams.get('path');
              if (/README\\.txt$/.test(statPath)) {
                return new Response(JSON.stringify({ ok: true, isDir: false, path: statPath, name: 'README.txt' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
              return new Response(JSON.stringify({ ok: true, isDir: true, path: '\\\\\\\\nas01\\\\Shared Docs', name: 'Shared Docs' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (String(url) === '/api/favorites') {
              return new Response(JSON.stringify({ ok: true, favorites: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          };
          loadFavorites = async () => { calls.push({ type: 'loadFavorites' }); };

          inputDialog = async () => 'nas01/Shared Docs';
          await addNetworkLocation();
          const invalid = { calls: calls.slice(), toasts: toasts.slice() };

          calls.length = 0;
          toasts.length = 0;
          inputDialog = async () => ' "file://nas01/Shared%20Docs" ';
          await addNetworkLocation();
          const fileUrl = { calls: calls.slice(), toasts: toasts.slice() };

          calls.length = 0;
          toasts.length = 0;
          inputDialog = async () => '\\\\\\\\nas01\\\\Shared Docs\\\\README.txt';
          await addNetworkLocation();
          const nonDir = { calls: calls.slice(), toasts: toasts.slice() };

          return { invalid, fileUrl, nonDir };
        } finally {
          inputDialog = oldInputDialog;
          window.fetch = oldFetch;
          toast = oldToast;
          loadFavorites = oldLoadFavorites;
        }
      })()`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome network location validation evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No network location validation result returned: ${JSON.stringify(result)}`);

    if (value.invalid.calls.some((call) => call.type === 'api' || call.type === 'apiPost')) {
      throw new Error(`invalid network location should not call backend: ${JSON.stringify(value.invalid)}`);
    }
    if (!value.invalid.toasts.some((item) => item.error && /例如 \\\\server\\share 或 file:\/\/server\/share/.test(item.message))) {
      throw new Error(`invalid network location should show actionable example: ${JSON.stringify(value.invalid)}`);
    }
    const statCall = value.fileUrl.calls.find((call) => call.type === 'api' && String(call.url).startsWith('/api/stat?'));
    const favoriteCall = value.fileUrl.calls.find((call) => call.type === 'apiPost' && call.url === '/api/favorites');
    if (!statCall || new URL(statCall.url, 'http://127.0.0.1/').searchParams.get('path') !== 'file://nas01/Shared%20Docs') {
      throw new Error(`file URL should be trimmed before stat: ${JSON.stringify(value.fileUrl)}`);
    }
    if (!favoriteCall || favoriteCall.body.path !== '\\\\nas01\\Shared Docs' || favoriteCall.body.name !== 'Shared Docs' || favoriteCall.body.isDir !== true) {
      throw new Error(`valid network location should be saved as backend-confirmed folder: ${JSON.stringify(value.fileUrl)}`);
    }
    if (!value.fileUrl.calls.some((call) => call.type === 'loadFavorites')) {
      throw new Error(`valid network location should refresh favorites: ${JSON.stringify(value.fileUrl)}`);
    }
    if (!value.fileUrl.toasts.some((item) => /已添加网络位置：Shared Docs/.test(item.message))) {
      throw new Error(`valid network location should confirm success: ${JSON.stringify(value.fileUrl)}`);
    }
    if (!value.nonDir.toasts.some((item) => item.error && /网络位置必须是文件夹/.test(item.message))) {
      throw new Error(`file path should be rejected as non-folder: ${JSON.stringify(value.nonDir)}`);
    }
    if (value.nonDir.calls.some((call) => call.type === 'apiPost')) {
      throw new Error(`non-folder network location should not be saved: ${JSON.stringify(value.nonDir)}`);
    }
    console.log('network-location-validation-real-chrome ok');
    console.log(JSON.stringify(value, null, 2));
  } finally {
    if (client) client.close();
    if (browser) {
      browser.kill();
      await waitForExit(browser);
    }
    server.kill();
    await waitForExit(server);
    await rmRetry(profileDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
