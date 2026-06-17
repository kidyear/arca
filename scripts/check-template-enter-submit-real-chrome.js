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
  if (!hit) throw new Error('Chrome/Edge not found for template Enter submit check');
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
  const profileDir = path.join(os.tmpdir(), `arca-template-enter-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof tpl === 'object' && typeof chat === 'object'`,
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
        chat.currentChat = null;
        chat.attachments = [];
        chat.send = (prompt, title) => { window.__tplSent = { prompt, title }; };
        await tpl.load();
        tpl.dept = '全部';
        await tpl.showPicker();
        const financeCard = Array.from(document.querySelectorAll('.tpl-card')).find((el) => /实习考核题/.test(el.textContent || ''));
        financeCard.click();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const firstInput = document.querySelector('.tpl-field input');
        const autoFocus = {
          activePlaceholder: document.activeElement?.placeholder || '',
          firstPlaceholder: firstInput?.placeholder || '',
          focused: document.activeElement === firstInput,
        };
        firstInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        const emptySubmit = {
          sent: Boolean(window.__tplSent),
          activePlaceholder: document.activeElement?.placeholder || '',
          ariaInvalid: firstInput.getAttribute('aria-invalid'),
          fieldInvalid: firstInput.closest('.tpl-field')?.classList.contains('invalid') || false,
        };
        firstInput.value = '实习费用报销、应收应付、费用归集';
        firstInput.dispatchEvent(new Event('input', { bubbles: true }));
        const afterTyping = {
          ariaInvalid: firstInput.getAttribute('aria-invalid'),
          fieldInvalid: firstInput.closest('.tpl-field')?.classList.contains('invalid') || false,
        };
        firstInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        const enterSubmit = window.__tplSent || null;
        window.__tplSent = null;
        document.querySelector('.tpl-go').click();
        const buttonSubmit = window.__tplSent || null;
        firstInput.focus();
        firstInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const escapeBack = {
          runnerGone: !document.querySelector('.tpl-go'),
          cards: Array.from(document.querySelectorAll('.tpl-card')).map((el) => el.textContent.trim()),
          searchFocused: document.activeElement?.classList?.contains('tpl-search') || false,
          activeTag: document.activeElement?.tagName || '',
          activeClass: document.activeElement?.className || '',
          activeId: document.activeElement?.id || '',
          query: document.querySelector('.tpl-search')?.value || '',
        };
        return { autoFocus, emptySubmit, afterTyping, enterSubmit, buttonSubmit, escapeBack };
      })()`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome template Enter evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No template Enter result returned: ${JSON.stringify(result)}`);
    if (!value.autoFocus.focused || !/财务实习生入职考核/.test(value.autoFocus.activePlaceholder)) {
      throw new Error(`template runner did not autofocus the first field: ${JSON.stringify(value)}`);
    }
    if (value.emptySubmit.sent) throw new Error(`Enter submitted an empty required template field: ${JSON.stringify(value)}`);
    if (value.emptySubmit.ariaInvalid !== 'true' || !value.emptySubmit.fieldInvalid) {
      throw new Error(`empty required template field did not show inline invalid state: ${JSON.stringify(value)}`);
    }
    if (value.afterTyping.ariaInvalid !== 'false' || value.afterTyping.fieldInvalid) {
      throw new Error(`typing in template field did not clear inline invalid state: ${JSON.stringify(value)}`);
    }
    if (!value.enterSubmit || !/实习费用报销/.test(value.enterSubmit.prompt || '')) {
      throw new Error(`Enter did not submit filled template prompt: ${JSON.stringify(value)}`);
    }
    if (!value.enterSubmit.title || !/实习考核题/.test(value.enterSubmit.title)) {
      throw new Error(`Enter submit did not use the template title: ${JSON.stringify(value)}`);
    }
    if (!value.buttonSubmit || value.buttonSubmit.prompt !== value.enterSubmit.prompt || value.buttonSubmit.title !== value.enterSubmit.title) {
      throw new Error(`Enter submit and button submit diverged: ${JSON.stringify(value)}`);
    }
    if (!value.escapeBack.runnerGone || !value.escapeBack.searchFocused || !value.escapeBack.cards.some((text) => /实习考核题/.test(text))) {
      throw new Error(`Escape did not return template runner to the picker with search focus: ${JSON.stringify(value)}`);
    }
    console.log('template-enter-submit-real-chrome ok');
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
