'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9239;

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
  if (!hit) throw new Error('Chrome/Edge not found for preview resizer check');
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
      const body = await getUrl(url);
      return body;
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
  const profileDir = path.join(os.tmpdir(), `arca-preview-resizer-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof showPreviewPanel === 'function' && !!document.querySelector('#preview-resizer')`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }
    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(() => {
        localStorage.setItem('fb_guided', '1');
        localStorage.removeItem('fb_preview_w');
        showPreviewPanel();
        const handle = document.querySelector('#preview-resizer');
        const preview = document.querySelector('#preview');
        const before = preview.style.flexBasis;
        handle.focus();
        handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        const afterLeft = preview.style.flexBasis;
        const storedLeft = localStorage.getItem('fb_preview_w');
        const ariaLeft = handle.getAttribute('aria-valuenow');
        handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
        const afterHome = preview.style.flexBasis;
        return {
          active: document.activeElement === handle,
          activeId: document.activeElement && document.activeElement.id,
          before,
          afterLeft,
          storedLeft,
          ariaLeft,
          afterHome,
          cssText: preview.style.cssText,
          computedWidth: getComputedStyle(preview).width,
          filemgmtDisplay: getComputedStyle(document.querySelector('#filemgmt')).display,
          filemgmtFlexDirection: getComputedStyle(document.querySelector('#filemgmt')).flexDirection,
          filemgmtWidth: document.querySelector('#filemgmt').getBoundingClientRect().width,
          offsetHome: preview.getBoundingClientRect().width,
          ariaHome: handle.getAttribute('aria-valuenow'),
          orientation: handle.getAttribute('aria-orientation'),
          hidden: document.querySelector('#preview').classList.contains('hidden'),
        };
      })()`,
    });
    if (result.exceptionDetails) {
      throw new Error(`Chrome preview resize evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    }
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No preview resize result returned: ${JSON.stringify(result)}`);
    if (value.hidden) throw new Error(`preview panel stayed hidden: ${JSON.stringify(value)}`);
    if (!value.active) throw new Error(`preview resizer did not receive focus: ${JSON.stringify(value)}`);
    if (value.orientation !== 'vertical') throw new Error(`expected vertical preview separator, got ${value.orientation}`);
    if (!/px$/.test(value.afterLeft || '')) throw new Error(`ArrowLeft did not set px flex-basis: ${value.afterLeft}`);
    if (value.storedLeft !== value.ariaLeft) throw new Error(`stored width ${value.storedLeft} != aria ${value.ariaLeft}`);
    if (value.afterHome !== '260px' || value.ariaHome !== '260') {
      throw new Error(`Home did not clamp preview to 260px: ${JSON.stringify(value)}`);
    }
    if (value.offsetHome > 270) {
      throw new Error(`Home updated state but not the rendered preview width: ${JSON.stringify(value)}`);
    }
    console.log('preview-resizer-real-chrome ok');
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
