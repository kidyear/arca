'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9258;

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
  if (!hit) throw new Error('Chrome/Edge not found for undo/redo file error check');
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
  const profileDir = path.join(os.tmpdir(), `arca-undo-redo-file-error-profile-${Date.now()}`);
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
        state.cwd = 'D:\\\\undo-redo-error';
        state.entries = [];
        state.visible = [];
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (url, opts) => {
          const urlText = String(url);
          const body = JSON.parse(opts?.body || '{}');
          if (urlText.includes('/api/list?')) {
            return new Response(JSON.stringify({ path: state.cwd, entries: [], breadcrumb: [], parent: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          if (urlText.includes('/api/trash')) {
            if (String(body.path || '').includes('bad-copy-created')) {
              return new Response(JSON.stringify({ ok: false, error: 'undo copy denied' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (String(body.path || '').includes('bad-shortcut')) {
              return new Response(JSON.stringify({ ok: false, error: 'undo shortcut denied' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ ok: true, path: body.path + '.trashed' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          if (urlText.includes('/api/move')) {
            if (String(body.src || '').includes('bad-move-to')) {
              return new Response(JSON.stringify({ ok: false, error: 'undo move denied' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (String(body.src || '').includes('bad-redo-move-from')) {
              return new Response(JSON.stringify({ ok: false, error: 'redo move denied' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ ok: true, path: (body.dstDir || state.cwd) + '\\\\moved-ok.txt' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          if (urlText.includes('/api/copy-in')) {
            if (String(body.src || '').includes('bad-redo-copy')) {
              return new Response(JSON.stringify({ ok: false, error: 'redo copy denied' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ ok: true, path: (body.dstDir || state.cwd) + '\\\\copy-ok.txt' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          if (urlText.includes('/api/shortcut')) {
            if (String(body.path || '').includes('bad-redo-shortcut-target')) {
              return new Response(JSON.stringify({ ok: false, error: 'redo shortcut denied' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ ok: true, path: (body.dstDir || state.cwd) + '\\\\shortcut-ok.lnk', name: 'shortcut-ok.lnk' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          return originalFetch(url, opts);
        };
        const waitToast = () => new Promise((r) => setTimeout(() => r(document.querySelector('#toast')?.textContent || ''), 90));
        const out = {};
        (async () => {
          state.undoStack = [{ type: 'copy', items: [{ path: 'D:\\\\undo-redo-error\\\\copy-ok.txt', from: 'src-ok' }, { path: 'D:\\\\undo-redo-error\\\\bad-copy-created.txt', from: 'src-bad' }] }];
          state.redoStack = [];
          await undoLast(); out.undoCopy = await waitToast(); out.undoCopyKept = state.undoStack.at(-1)?.type || '';

          state.undoStack = [{ type: 'move', items: [{ from: 'D:\\\\undo-redo-error\\\\from-ok.txt', to: 'D:\\\\undo-redo-error\\\\to-ok.txt' }, { from: 'D:\\\\undo-redo-error\\\\bad-move-from.txt', to: 'D:\\\\undo-redo-error\\\\bad-move-to.txt' }] }];
          state.redoStack = [];
          await undoLast(); out.undoMove = await waitToast(); out.undoMoveKept = state.undoStack.at(-1)?.type || '';

          state.undoStack = [{ type: 'shortcut', items: [{ path: 'D:\\\\undo-redo-error\\\\shortcut-ok.lnk' }, { path: 'D:\\\\undo-redo-error\\\\bad-shortcut.lnk' }] }];
          state.redoStack = [];
          await undoLast(); out.undoShortcut = await waitToast(); out.undoShortcutKept = state.undoStack.at(-1)?.type || '';

          state.undoStack = [];
          state.redoStack = [{ type: 'copy', items: [{ from: 'D:\\\\undo-redo-error\\\\src-ok.txt', path: 'D:\\\\undo-redo-error\\\\copy-ok.txt' }, { from: 'D:\\\\undo-redo-error\\\\bad-redo-copy.txt', path: 'D:\\\\undo-redo-error\\\\copy-bad.txt' }] }];
          await redoLast(); out.redoCopy = await waitToast(); out.redoCopyKept = state.redoStack.at(-1)?.type || '';

          state.undoStack = [];
          state.redoStack = [{ type: 'move', items: [{ from: 'D:\\\\undo-redo-error\\\\from-ok.txt', to: 'D:\\\\undo-redo-error\\\\to-ok.txt' }, { from: 'D:\\\\undo-redo-error\\\\bad-redo-move-from.txt', to: 'D:\\\\undo-redo-error\\\\bad-redo-move-to.txt' }] }];
          await redoLast(); out.redoMove = await waitToast(); out.redoMoveKept = state.redoStack.at(-1)?.type || '';

          state.undoStack = [];
          state.redoStack = [{ type: 'shortcut', items: [{ target: 'D:\\\\undo-redo-error\\\\target-ok.txt', dstDir: 'D:\\\\undo-redo-error' }, { target: 'D:\\\\undo-redo-error\\\\bad-redo-shortcut-target.txt', dstDir: 'D:\\\\undo-redo-error' }] }];
          await redoLast(); out.redoShortcut = await waitToast(); out.redoShortcutKept = state.redoStack.at(-1)?.type || '';

          resolve(out);
        })().catch((err) => resolve({ error: err.message || String(err) }));
      })`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome undo/redo file error evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value || value.error) throw new Error(`No undo/redo file error result returned: ${JSON.stringify(value || result)}`);
    const checks = [
      ['undoCopy', '撤销复制完成，1 项失败：undo copy denied', 'copy'],
      ['undoMove', '撤销移动完成，1 项失败：undo move denied', 'move'],
      ['undoShortcut', '撤销快捷方式完成，1 项失败：undo shortcut denied', 'shortcut'],
      ['redoCopy', '重做复制完成，1 项失败：redo copy denied', 'copy'],
      ['redoMove', '重做移动完成，1 项失败：redo move denied', 'move'],
      ['redoShortcut', '重做快捷方式完成，1 项失败：redo shortcut denied', 'shortcut'],
    ];
    for (const [key, expected, type] of checks) {
      if (!String(value[key] || '').includes(expected)) throw new Error(`${key} should show backend reason: ${JSON.stringify(value)}`);
      const kept = value[`${key}Kept`];
      if (kept !== type) throw new Error(`${key} should keep failed operation stack: ${JSON.stringify(value)}`);
    }
    console.log('undo-redo-file-error-real-chrome ok');
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
