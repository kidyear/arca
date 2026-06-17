'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9287;

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitForHttp(url, label) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await wait(150);
  }
  throw new Error(`${label} did not become ready`);
}

function findBrowser() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('Chrome/Edge not found for real browser check');
  return found;
}

function httpJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

async function waitForPage(pageUrl) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const pages = await httpJson(`http://127.0.0.1:${CDP_PORT}/json`);
      const page = pages.find((p) => p.type === 'page' && p.url.startsWith(pageUrl));
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await wait(150);
  }
  throw new Error('Chrome page did not become debuggable');
}

function cdp(wsUrl) {
  const WebSocket = global.WebSocket;
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg);
    }
  };
  return {
    ready: new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    }),
    send(method, params = {}) {
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
    },
    close() { ws.close(); },
  };
}

function waitForExit(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) return resolve();
    child.once('exit', resolve);
    setTimeout(resolve, 3000);
  });
}

async function rmRetry(dir) {
  for (let i = 0; i < 6; i += 1) {
    try {
      await fs.promises.rm(dir, { recursive: true, force: true });
      return;
    } catch {
      await wait(250);
    }
  }
}

async function main() {
  const profileDir = path.join(os.tmpdir(), `arca-navigate-error-profile-${Date.now()}`);
  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(APP_PORT) },
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
    await client.ready;
    await client.send('Runtime.enable');
    for (let i = 0; i < 60; i += 1) {
      const ready = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `document.readyState === 'complete' && typeof navigate === 'function' && typeof friendlyNavigateError === 'function'`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `new Promise((resolve) => {
        localStorage.setItem('fb_guided', '1');
        document.querySelector('.guide-overlay')?.remove();
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (url, opts) => {
          if (String(url).includes('/api/list')) throw new TypeError('Failed to fetch');
          return originalFetch(url, opts);
        };
        navigate('D:\\\\离线网络盘').then(() => {
          setTimeout(() => resolve({
            toast: document.querySelector('#toast')?.textContent || '',
            cwd: state.cwd,
          }), 100);
        });
      })`,
    });
    if (result.exceptionDetails) throw new Error(`Chrome navigate error evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.result && result.result.result.value;
    if (!value || !String(value.toast || '').includes('打开失败：文件服务暂时没有响应')) {
      throw new Error(`navigate failure should show friendly concrete reason: ${JSON.stringify(value)}`);
    }
    console.log('navigate-error-feedback-real-chrome ok');
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
