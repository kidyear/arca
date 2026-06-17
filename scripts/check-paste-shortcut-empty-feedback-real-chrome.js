'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9252;

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
  if (!hit) throw new Error('Chrome/Edge not found for paste shortcut empty feedback check');
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
  const profileDir = path.join(os.tmpdir(), `arca-empty-shortcut-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof blankContextItems === 'function' && typeof pasteShortcutFromClipboard === 'function' && typeof createShortcutForEntries === 'function'`,
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
        state.cwd = 'D:\\\\快捷方式空剪贴板测试';
        state.entries = [];
        state.visible = [];
        state.fileClip = null;
        window.fanboxClipboard = { readFiles: async () => ({ ok: true, paths: [] }) };
        const area = document.querySelector('#file-area');
        area.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 220,
          clientY: 180,
        }));
        const items = [...document.querySelectorAll('#context-menu .ctx-item')].map((el) => el.textContent || '');
        const target = [...document.querySelectorAll('#context-menu .ctx-item')].find((el) => (el.textContent || '') === '粘贴快捷方式');
        if (target) target.click();
        setTimeout(() => {
          const afterToast = document.querySelector('#toast')?.textContent || '';
          window.fanboxClipboard = { readFiles: async () => ({ ok: false, paths: [], error: 'clipboard locked' }) };
          area.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: 220,
            clientY: 180,
          }));
          const errorTarget = [...document.querySelectorAll('#context-menu .ctx-item')].find((el) => (el.textContent || '') === '粘贴快捷方式');
          if (errorTarget) errorTarget.click();
          setTimeout(() => {
            const readErrorToast = document.querySelector('#toast')?.textContent || '';
            const emptyFileClip = state.fileClip;
            const originalFetch = window.fetch.bind(window);
            window.fetch = async (url, opts) => {
              if (String(url).includes('/api/shortcut')) {
                return new Response(JSON.stringify({ ok: false, error: 'access denied' }), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' },
                });
              }
              return originalFetch(url, opts);
            };
            state.fileClip = { op: 'copy', paths: ['D:\\\\源文件\\\\demo.docx'] };
            pasteShortcutFromClipboard('D:\\\\目标目录').then(() => {
              setTimeout(() => {
                const shortcutFailure = document.querySelector('#toast')?.textContent || '';
                createShortcutForEntries([
                  { path: 'D:\\\\源文件\\\\demo.docx', name: 'demo.docx', isDir: false, kind: 'docx' },
                ]).then(() => {
                  setTimeout(() => {
                    const createShortcutFailure = document.querySelector('#toast')?.textContent || '';
                    let shortcutCalls = 0;
                    window.fetch = async (url, opts) => {
                      if (String(url).includes('/api/shortcut')) {
                        shortcutCalls += 1;
                        if (shortcutCalls % 2 === 1) {
                          return new Response(JSON.stringify({ ok: true, path: 'D:\\\\目标目录\\\\ok.lnk', name: 'ok.lnk' }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                          });
                        }
                        return new Response(JSON.stringify({ ok: false, error: 'second denied' }), {
                          status: 200,
                          headers: { 'Content-Type': 'application/json' },
                        });
                      }
                      return originalFetch(url, opts);
                    };
                    state.fileClip = { op: 'copy', paths: ['D:\\\\源文件\\\\ok.docx', 'D:\\\\源文件\\\\locked.docx'] };
                    pasteShortcutFromClipboard('D:\\\\目标目录').then(() => {
                      setTimeout(() => {
                        const partialPasteFailure = document.querySelector('#toast')?.textContent || '';
                        createShortcutForEntries([
                          { path: 'D:\\\\源文件\\\\ok.docx', name: 'ok.docx', isDir: false, kind: 'docx' },
                          { path: 'D:\\\\源文件\\\\locked.docx', name: 'locked.docx', isDir: false, kind: 'docx' },
                        ]).then(() => {
                          setTimeout(() => resolve({
                            items,
                            clicked: !!target,
                            afterToast,
                            readErrorClicked: !!errorTarget,
                            readErrorToast,
                            menuClosed: !document.querySelector('#context-menu'),
                            shortcutFailure,
                            createShortcutFailure,
                            partialPasteFailure,
                            partialCreateFailure: document.querySelector('#toast')?.textContent || '',
                            fileClip: emptyFileClip,
                          }), 80);
                        });
                      }, 80);
                    });
                  }, 80);
                });
              }, 80);
            });
          }, 100);
        }, 100);
      })`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome paste shortcut empty evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No paste shortcut empty result returned: ${JSON.stringify(result)}`);
    if (!value.items.includes('粘贴快捷方式')) throw new Error(`blank menu should expose paste shortcut action when clipboard API exists: ${JSON.stringify(value)}`);
    if (!value.clicked) throw new Error(`paste shortcut menu item was not clicked: ${JSON.stringify(value)}`);
    if (!value.afterToast.includes('剪贴板中没有可用于创建快捷方式的文件')) throw new Error(`empty shortcut paste should show a clear toast: ${JSON.stringify(value)}`);
    if (!value.readErrorClicked) throw new Error(`paste shortcut menu item was not clicked for read error case: ${JSON.stringify(value)}`);
    if (!value.readErrorToast.includes('读取剪贴板失败：clipboard locked')) throw new Error(`shortcut clipboard read failure should show a distinct toast: ${JSON.stringify(value)}`);
    if (!String(value.shortcutFailure || '').includes('粘贴快捷方式失败：access denied')) throw new Error(`all-failed shortcut paste should show backend reason: ${JSON.stringify(value)}`);
    if (!String(value.createShortcutFailure || '').includes('创建快捷方式失败：access denied')) throw new Error(`all-failed create shortcut should show backend reason: ${JSON.stringify(value)}`);
    if (!String(value.partialPasteFailure || '').includes('已粘贴 1 个快捷方式，1 项失败：second denied')) throw new Error(`partial shortcut paste should show backend reason: ${JSON.stringify(value)}`);
    if (!String(value.partialCreateFailure || '').includes('已创建 1 个快捷方式，1 项失败：second denied')) throw new Error(`partial create shortcut should show backend reason: ${JSON.stringify(value)}`);
    if (!value.menuClosed) throw new Error(`context menu should close after clicking paste shortcut: ${JSON.stringify(value)}`);
    if (value.fileClip !== null) throw new Error(`empty shortcut paste should not create internal clipboard state: ${JSON.stringify(value)}`);
    console.log('paste-shortcut-empty-feedback-real-chrome ok');
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
