'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9291;

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
  if (!found) throw new Error('Chrome/Edge not found for terminal error check');
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
  const profileDir = path.join(os.tmpdir(), `arca-terminal-error-profile-${Date.now()}`);
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
    let pageReady = false;
    for (let i = 0; i < 80; i += 1) {
      const ready = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `document.readyState === 'complete' && typeof term === 'object' && typeof terminalFailureMessage === 'function' && typeof window.Terminal === 'function' && !!document.querySelector('#mode-term')`,
      });
      if (ready.result && ready.result.result && ready.result.result.value) { pageReady = true; break; }
      await wait(100);
    }
    if (!pageReady) {
      const diagnostics = await client.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `({
          readyState: document.readyState,
          termType: typeof term,
          helperType: typeof terminalFailureMessage,
          terminalType: typeof window.Terminal,
          noXterm: !!window.__noXterm,
          hasModeTerm: !!document.querySelector('#mode-term'),
        })`,
      });
      throw new Error(`terminal page API did not become ready: ${JSON.stringify(diagnostics.result && diagnostics.result.result && diagnostics.result.result.value)}`);
    }

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        try {
          localStorage.setItem('fb_guided', '1');
          document.querySelector('.guide-overlay')?.remove();
          window.__noXterm = true;
          term.sendContext('片段', 'D:\\\\终端不可用.txt');
          await new Promise((resolve) => setTimeout(resolve, 80));
          const unavailableContextToast = document.querySelector('#toast')?.textContent || '';
          window.__noXterm = false;
          let spawnCount = 0;
          window.fanboxPty = {
            spawn: async () => {
              spawnCount += 1;
              return spawnCount === 1 ? { ok: false, error: 'pty spawn denied' } : { ok: false };
            },
            input: () => {},
            resize: () => {},
            proc: async () => ({ ok: false }),
            cwd: async () => ({ ok: false }),
            kill: () => {},
          };
          const run = term.runInDir('D:\\\\终端失败测试', 'codex', 'should not run');
          const completed = await Promise.race([
            run.then(() => true),
            new Promise((resolve) => setTimeout(() => resolve(false), 1500)),
          ]);
          await new Promise((resolve) => setTimeout(resolve, 120));
          const sess = term.sessions[term.sessions.length - 1];
          const launchToast = document.querySelector('#toast')?.textContent || '';
          const launchError = sess && sess.error || '';
          const respawnRun = term.respawn(sess);
          const respawnCompleted = await Promise.race([
            respawnRun.then(() => true),
            new Promise((resolve) => setTimeout(() => resolve(false), 1500)),
          ]);
          await new Promise((resolve) => setTimeout(resolve, 120));
          return {
            unavailableContextToast,
            completed,
            respawnCompleted,
            toast: launchToast,
            respawnToast: document.querySelector('#toast')?.textContent || '',
            dead: !!(sess && sess.dead),
            sessionError: launchError,
            respawnError: sess && sess.error || '',
          };
        } catch (err) {
          return { evalError: err && (err.stack || err.message || String(err)) };
        }
      })()`,
    });
    if (result.exceptionDetails) throw new Error(`Chrome terminal error evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.result && result.result.result.value;
    if (value && value.evalError) throw new Error(`terminal error check evaluation failed: ${value.evalError}`);
    if (!value || value.unavailableContextToast !== '内嵌终端不可用，请使用桌面版或检查终端组件') {
      throw new Error(`terminal context unavailable should show shared actionable feedback: ${JSON.stringify(value)}`);
    }
    if (!value || value.completed !== true || !String(value.toast || '').includes('终端启动失败：pty spawn denied')) {
      throw new Error(`terminal launch failure should show concrete spawn reason: ${JSON.stringify(value)}`);
    }
    if (!value.dead || value.sessionError !== 'pty spawn denied') {
      throw new Error(`failed terminal session should keep spawn error: ${JSON.stringify(value)}`);
    }
    if (value.respawnCompleted !== true || !String(value.respawnToast || '').includes('终端重开失败：未知错误')) {
      throw new Error(`terminal respawn failure should show fallback spawn reason: ${JSON.stringify(value)}`);
    }
    if (!value.dead || value.respawnError !== '未知错误') {
      throw new Error(`failed terminal respawn should keep fallback spawn error: ${JSON.stringify(value)}`);
    }
    console.log('terminal-error-feedback-real-chrome ok');
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
