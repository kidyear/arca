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
  if (!hit) throw new Error('Chrome/Edge not found for folder preview actions check');
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
  const profileDir = path.join(os.tmpdir(), `arca-folder-preview-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof previewPlaceholder === 'function' && typeof propertiesPanel === 'function'`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }
    await wait(300);

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(() => {
        localStorage.setItem('fb_guided', '1');
        document.querySelector('.guide-overlay')?.remove();
        const dir = {
          path: 'D:\\\\新人\\\\财务',
          name: '财务',
          isDir: true,
          isDrive: false,
          kind: 'dir',
          size: 0,
          mtime: Date.parse('2026-06-17T08:00:00+08:00'),
          btime: Date.parse('2026-06-16T08:00:00+08:00'),
        };
        state.cwd = 'D:\\\\新人';
        previewPlaceholder(dir, '文件夹没有预览，按 Alt+Enter 查看属性');
        const buttons = [...document.querySelectorAll('#preview-actions button')].map((b) => ({
          text: b.textContent.trim(),
          tip: b.dataset.tip || '',
          primary: b.classList.contains('primary'),
        }));
        const propButton = [...document.querySelectorAll('#preview-actions button')].find((b) => b.textContent.trim() === '属性');
        if (propButton) propButton.click();
        const dialogTitle = document.querySelector('.prop-dialog .input-title')?.textContent || '';
        const rowKeys = [...document.querySelectorAll('.prop-row span')].map((x) => x.textContent);
        const fullPath = [...document.querySelectorAll('.prop-row code')].map((x) => x.textContent).find((x) => x.includes('D:\\\\新人\\\\财务')) || '';
        return {
          title: document.querySelector('#preview-title')?.textContent || '',
          bodyText: document.querySelector('#preview-body')?.textContent || '',
          buttons,
          dialogTitle,
          rowKeys,
          fullPath,
        };
      })()`,
    });
    if (result.exceptionDetails) throw new Error(`Chrome folder preview evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No folder preview result returned: ${JSON.stringify(result)}`);
    const texts = value.buttons.map((b) => b.text);
    const tips = value.buttons.map((b) => b.tip);
    if (value.title !== '财务') throw new Error(`preview title mismatch: ${JSON.stringify(value)}`);
    if (!value.bodyText.includes('文件夹没有预览')) throw new Error(`placeholder text missing: ${JSON.stringify(value)}`);
    if (!texts.includes('打开')) throw new Error(`folder preview missing open action: ${JSON.stringify(value)}`);
    if (!texts.includes('属性')) throw new Error(`folder preview missing properties action: ${JSON.stringify(value)}`);
    if (!tips.includes('在文件管理器中显示')) throw new Error(`folder preview missing reveal action: ${JSON.stringify(value)}`);
    if (!tips.includes('复制路径')) throw new Error(`folder preview missing copy path action: ${JSON.stringify(value)}`);
    if (!value.buttons.some((b) => b.text === '打开' && b.primary)) throw new Error(`folder open action should be primary: ${JSON.stringify(value)}`);
    if (value.dialogTitle !== '财务') throw new Error(`properties dialog did not open: ${JSON.stringify(value)}`);
    if (!value.rowKeys.includes('完整路径')) throw new Error(`properties dialog missing full path row: ${JSON.stringify(value)}`);
    if (value.fullPath !== 'D:\\新人\\财务') throw new Error(`properties full path mismatch: ${JSON.stringify(value)}`);
    console.log('folder-preview-actions-real-chrome ok');
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
  console.error(err);
  process.exit(1);
});
