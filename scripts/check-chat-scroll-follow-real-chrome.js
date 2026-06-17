'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9275;

function browserCandidates() {
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
  const hit = browserCandidates().find((p) => fs.existsSync(p));
  if (!hit) throw new Error('Chrome/Edge not found for chat scroll follow check');
  return hit;
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function waitForExit(child, timeoutMs = 2000) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
  });
}

async function rmRetry(target) {
  for (let i = 0; i < 8; i += 1) {
    try { fs.rmSync(target, { recursive: true, force: true }); return; } catch (err) {
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
    try { return await getUrl(url); } catch (_) { await wait(100); }
  }
  throw new Error(`${label} did not become ready`);
}

async function fetchJson(url) { return JSON.parse(await getUrl(url)); }

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
  const opened = new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  return {
    async send(method, params = {}) {
      await opened;
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
    },
    close() { try { ws.close(); } catch (_) {} },
  };
}

async function main() {
  const profileDir = path.join(os.tmpdir(), `arca-chat-scroll-profile-${Date.now()}`);
  fs.rmSync(profileDir, { recursive: true, force: true });
  fs.mkdirSync(profileDir, { recursive: true });

  const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, stdio: 'ignore', windowsHide: true });
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
      '--window-size=1280,900',
      pageUrl,
    ], { stdio: 'ignore', windowsHide: true });

    client = cdp(await waitForPage(pageUrl));
    await client.send('Runtime.enable');
    for (let i = 0; i < 60; i += 1) {
      const ready = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `document.readyState === 'complete' && typeof chat === 'object' && !!document.querySelector('#chat-msgs')`,
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
        chat.open();
        const box = document.querySelector('#chat-msgs');
        const jump = document.querySelector('#chat-jump-bottom');
        box.innerHTML = '';
        for (let i = 0; i < 90; i += 1) {
          const row = document.createElement('div');
          row.className = 'chat-msg assistant';
          row.innerHTML = '<div class="md-body chat-md">历史长回复第 ' + i + ' 行：用于撑开滚动区域。</div>';
          box.appendChild(row);
        }
        chat.scroll(true);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const bottomScroll = box.scrollTop;
        const readPosition = Math.max(0, box.scrollHeight - box.clientHeight - 700);
        box.scrollTop = readPosition;
        box.dispatchEvent(new Event('scroll'));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const beforeAppend = box.scrollTop;
        const msg = chat.msgEl('assistant');
        msg.innerHTML = '<div class="md-body chat-md">新流式输出，不应该抢走阅读位置。</div>';
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const afterAppend = box.scrollTop;
        const jumpVisible = !jump.classList.contains('hidden');
        jump.click();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const afterClick = box.scrollTop;
        const maxScroll = box.scrollHeight - box.clientHeight;
        return {
          bottomScroll,
          beforeAppend,
          afterAppend,
          afterClick,
          maxScroll,
          jumpVisible,
          jumpHiddenAfterClick: jump.classList.contains('hidden'),
          followOutput: chat.followOutput,
        };
      })()`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome chat scroll evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No chat scroll result returned: ${JSON.stringify(result)}`);
    if (value.bottomScroll <= 0) throw new Error(`chat did not create scrollable history: ${JSON.stringify(value)}`);
    if (value.beforeAppend <= 0 || value.beforeAppend >= value.maxScroll - 80) throw new Error(`chat did not move to a reading position above bottom: ${JSON.stringify(value)}`);
    if (Math.abs(value.afterAppend - value.beforeAppend) > 24) throw new Error(`chat auto-scrolled while user was reading above: ${JSON.stringify(value)}`);
    if (!value.jumpVisible) throw new Error(`new message jump button not visible: ${JSON.stringify(value)}`);
    if (Math.abs(value.afterClick - value.maxScroll) > 4) throw new Error(`jump button did not scroll to bottom: ${JSON.stringify(value)}`);
    if (!value.jumpHiddenAfterClick || !value.followOutput) throw new Error(`jump button did not restore follow state: ${JSON.stringify(value)}`);
    console.log('chat-scroll-follow-real-chrome ok');
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
