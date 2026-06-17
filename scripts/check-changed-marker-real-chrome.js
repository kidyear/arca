'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const STYLE_PATH = path.join(ROOT, 'public', 'style.css');
const PORT = 9237;

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
  if (!hit) throw new Error('Chrome/Edge not found for real CSS visual check');
  return hit;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForExit(child, timeoutMs = 2000) {
  if (child.exitCode !== null || child.signalCode) return;
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

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function waitForPage(targetUrl) {
  const url = `http://127.0.0.1:${PORT}/json`;
  for (let i = 0; i < 50; i += 1) {
    try {
      const pages = await fetchJson(url);
      const page = pages.find((p) => p.url === targetUrl) || pages.find((p) => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (_) {
      // Chrome is still starting.
    }
    await wait(100);
  }
  throw new Error('Chrome DevTools endpoint did not become ready');
}

function cdp(wsUrl) {
  if (typeof WebSocket !== 'function') {
    throw new Error('This check needs Node with global WebSocket support');
  }
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
  const htmlPath = path.join(os.tmpdir(), 'arca-changed-marker-real-chrome.html');
  const styleUrl = `file:///${STYLE_PATH.replace(/\\/g, '/')}`;
  fs.writeFileSync(htmlPath, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${styleUrl}">
  <style>body{margin:0;padding:24px}.grid{display:flex;gap:16px}</style>
</head>
<body>
  <div class="grid">
    <div id="changed" class="item changed" data-changed="改"><div class="icon">DOC</div><div class="fname">刚变更.docx</div></div>
    <div id="selected" class="item selected"><div class="icon">DOC</div><div class="fname">当前选中.docx</div></div>
  </div>
</body>
</html>`, 'utf8');
  const pageUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

  const profileDir = path.join(os.tmpdir(), `arca-chrome-profile-${Date.now()}`);
  fs.rmSync(profileDir, { recursive: true, force: true });
  fs.mkdirSync(profileDir, { recursive: true });

  const browser = spawn(findBrowser(), [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    pageUrl,
  ], { stdio: 'ignore', windowsHide: true });

  let client;
  try {
    client = cdp(await waitForPage(pageUrl));
    await client.send('Runtime.enable');
    for (let i = 0; i < 40; i += 1) {
      const ready = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `document.readyState === 'complete' && !!document.querySelector('#changed') && document.styleSheets.length > 0`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }
    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(() => {
        const changed = document.querySelector('#changed');
        const selected = document.querySelector('#selected');
        const changedStyle = getComputedStyle(changed);
        const selectedStyle = getComputedStyle(selected);
        const badge = getComputedStyle(changed, '::after');
        return {
          changedBg: changedStyle.backgroundColor,
          changedBorder: changedStyle.borderColor,
          changedBoxShadow: changedStyle.boxShadow,
          selectedBg: selectedStyle.backgroundColor,
          selectedBorder: selectedStyle.borderColor,
          badgeContent: badge.content,
          changedSelected: changed.classList.contains('selected'),
        };
      })()`,
    });
    if (result.exceptionDetails) {
      throw new Error(`Chrome style evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    }
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No computed style result returned: ${JSON.stringify(result)}`);
    if (value.changedSelected) throw new Error('changed fixture must not also be selected');
    if (value.changedBg !== 'rgba(0, 0, 0, 0)') {
      throw new Error(`changed marker background should be transparent, got ${value.changedBg}`);
    }
    if (value.changedBoxShadow !== 'none') {
      throw new Error(`changed marker box-shadow should be none, got ${value.changedBoxShadow}`);
    }
    if (value.changedBg === value.selectedBg && value.changedBorder === value.selectedBorder) {
      throw new Error('changed marker computed style matches selected item too closely');
    }
    if (!/改/.test(value.badgeContent || '')) {
      throw new Error(`changed marker badge content missing, got ${value.badgeContent}`);
    }
    console.log('changed-marker-real-chrome ok');
    console.log(JSON.stringify(value, null, 2));
  } finally {
    if (client) client.close();
    browser.kill();
    await waitForExit(browser);
    await rmRetry(profileDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
