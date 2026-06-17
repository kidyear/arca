'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9257;

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
  if (!hit) throw new Error('Chrome/Edge not found for trash undo/redo error check');
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
  const profileDir = path.join(os.tmpdir(), `arca-trash-undo-redo-error-profile-${Date.now()}`);
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
      pageUrl,
    ], { stdio: 'ignore', windowsHide: true });

    client = cdp(await waitForPage(pageUrl));
    await client.send('Runtime.enable');
    for (let i = 0; i < 60; i += 1) {
      const ready = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `document.readyState === 'complete' && typeof undoLast === 'function' && typeof redoLast === 'function'`,
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
        state.skillsMode = false;
        state.recentMode = false;
        state.searchMode = false;
        state.cwd = 'D:\\\\撤销删除失败测试';
        state.entries = [];
        state.visible = [];
        state.undoStack = [{
          type: 'trash',
          items: [
            { from: 'D:\\\\撤销删除失败测试\\\\ok.txt', trashPath: 'D:\\\\$Recycle.Bin\\\\ok.txt', trashKind: 'app', name: 'ok.txt', isDir: false },
            { from: 'D:\\\\撤销删除失败测试\\\\locked.txt', trashPath: 'D:\\\\$Recycle.Bin\\\\locked.txt', trashKind: 'app', name: 'locked.txt', isDir: false },
          ],
        }];
        state.redoStack = [];
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (url, opts) => {
          const urlText = String(url);
          if (urlText.includes('/api/trash-restore')) {
            const body = JSON.parse(opts?.body || '{}');
            if (String(body.path || '').includes('locked.txt')) {
              return new Response(JSON.stringify({ ok: false, error: 'restore denied' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ ok: true, path: body.path }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          if (urlText.includes('/api/trash-undoable')) {
            const body = JSON.parse(opts?.body || '{}');
            if (String(body.path || '').includes('locked.txt')) {
              return new Response(JSON.stringify({ ok: false, error: 'delete denied' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ ok: true, path: body.path + '.trashed', trashPath: body.path + '.trashed', trashKind: 'app' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          if (urlText.includes('/api/list?')) {
            return new Response(JSON.stringify({ path: state.cwd, entries: [], breadcrumb: [], parent: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          return originalFetch(url, opts);
        };
        undoLast().then(() => setTimeout(() => {
          const undoToast = document.querySelector('#toast')?.textContent || '';
          const undoKept = state.undoStack[state.undoStack.length - 1]?.type || '';
          state.undoStack = [];
          state.redoStack = [{
            type: 'trash',
            items: [
              { from: 'D:\\\\撤销删除失败测试\\\\ok.txt', trashPath: 'D:\\\\$Recycle.Bin\\\\ok.txt', trashKind: 'app', name: 'ok.txt', isDir: false },
              { from: 'D:\\\\撤销删除失败测试\\\\locked.txt', trashPath: 'D:\\\\$Recycle.Bin\\\\locked.txt', trashKind: 'app', name: 'locked.txt', isDir: false },
            ],
          }];
          redoLast().then(() => setTimeout(() => resolve({
            undoToast,
            undoKept,
            redoToast: document.querySelector('#toast')?.textContent || '',
            redoKept: state.redoStack[state.redoStack.length - 1]?.type || '',
          }), 120));
        }, 120));
      })`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome trash undo/redo error evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No trash undo/redo error result returned: ${JSON.stringify(result)}`);
    if (!value.undoToast.includes('撤销删除完成，1 项恢复失败：restore denied')) throw new Error(`undo trash failure should show backend reason: ${JSON.stringify(value)}`);
    if (value.undoKept !== 'trash') throw new Error(`failed undo trash operation should remain undoable: ${JSON.stringify(value)}`);
    if (!value.redoToast.includes('重做删除完成，1 项失败：delete denied')) throw new Error(`redo trash failure should show backend reason: ${JSON.stringify(value)}`);
    if (value.redoKept !== 'trash') throw new Error(`failed redo trash operation should remain redoable: ${JSON.stringify(value)}`);
    console.log('trash-undo-redo-error-real-chrome ok');
    console.log(JSON.stringify(value, null, 2));
  } finally {
    if (client) client.close();
    if (browser) { browser.kill(); await waitForExit(browser); }
    server.kill();
    await waitForExit(server);
    await rmRetry(profileDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
