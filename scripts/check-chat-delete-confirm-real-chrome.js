'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9253;

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
  if (!hit) throw new Error('Chrome/Edge not found for chat delete confirm check');
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
  const profileDir = path.join(os.tmpdir(), `arca-chat-delete-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof chat === 'object' && typeof confirmDialog === 'function'`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }
    await wait(300);

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        localStorage.setItem('fb_guided', '1');
        document.querySelector('.guide-overlay')?.remove();
        const originalFetch = window.fetch;
        const deletes = [];
        window.fetch = (url, opts) => {
          if (String(url).includes('/api/ai/chat-delete')) {
            deletes.push({ url: String(url), body: opts && opts.body });
            return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
          }
          return originalFetch(url, opts);
        };
        chat.currentChat = 'chat-a';
        chat.chats = [
          { id: 'chat-a', title: '财务实习题目生成', cwd: 'D:\\\\新人\\\\财务' },
          { id: 'chat-b', title: '发票报销整理', cwd: 'D:\\\\发票' },
        ];
        chat.loadChats = async () => { chat.renderChatList(); };
        chat.renderChatList();
        const firstDelete = document.querySelector('.chat-item .ci-del');
        firstDelete.click();
        await new Promise((resolve) => setTimeout(resolve, 40));
        const cancelTitle = document.querySelector('.input-title')?.textContent || '';
        document.querySelector('[data-act="no"]').click();
        await new Promise((resolve) => setTimeout(resolve, 80));
        const afterCancelDeletes = deletes.length;
        const afterCancelOverlay = !!document.querySelector('.input-overlay');
        document.querySelector('.chat-item .ci-del').click();
        await new Promise((resolve) => setTimeout(resolve, 40));
        const confirmTitle = document.querySelector('.input-title')?.textContent || '';
        document.querySelector('[data-act="yes"]').click();
        await new Promise((resolve) => setTimeout(resolve, 120));
        window.fetch = originalFetch;
        return {
          cancelTitle,
          afterCancelDeletes,
          afterCancelOverlay,
          confirmTitle,
          deleteCount: deletes.length,
          deleteBody: deletes[0] && deletes[0].body,
          currentChat: chat.currentChat,
          emptyText: document.querySelector('#chat-msgs')?.textContent || '',
        };
      })()`,
    });
    if (result.exceptionDetails) throw new Error(`Chrome chat delete evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No chat delete result returned: ${JSON.stringify(result)}`);
    if (!value.cancelTitle.includes('删除这个对话？') || !value.cancelTitle.includes('财务实习题目生成')) {
      throw new Error(`delete confirmation missing chat title: ${JSON.stringify(value)}`);
    }
    if (value.afterCancelDeletes !== 0) throw new Error(`cancel should not call delete API: ${JSON.stringify(value)}`);
    if (value.afterCancelOverlay) throw new Error(`cancel should close confirmation overlay: ${JSON.stringify(value)}`);
    if (!value.confirmTitle.includes('删除这个对话？')) throw new Error(`confirm prompt missing on second delete: ${JSON.stringify(value)}`);
    if (value.deleteCount !== 1) throw new Error(`confirm should call delete API once: ${JSON.stringify(value)}`);
    if (!String(value.deleteBody || '').includes('"id":"chat-a"')) throw new Error(`delete API got wrong body: ${JSON.stringify(value)}`);
    if (value.currentChat !== null) throw new Error(`deleting current chat should open a new chat: ${JSON.stringify(value)}`);
    if (!value.emptyText.includes('新对话')) throw new Error(`new chat placeholder missing after deleting current chat: ${JSON.stringify(value)}`);
    console.log('chat-delete-confirm-real-chrome ok');
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
