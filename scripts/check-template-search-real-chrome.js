'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9251;

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
  if (!hit) throw new Error('Chrome/Edge not found for template search check');
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
  const profileDir = path.join(os.tmpdir(), `arca-template-search-profile-${Date.now()}`);
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
        localStorage.removeItem('fb_tpl_q');
        document.querySelector('.guide-overlay')?.remove();
        chat.open();
        chat.currentChat = null;
        chat.attachments = [];
        document.querySelector('#chat-msgs').innerHTML = '';
        await tpl.load();
        await tpl.showPicker();
        await new Promise((resolve) => setTimeout(resolve, 120));
        const snapshot = () => ({
          query: document.querySelector('.tpl-search')?.value || '',
          searchFocused: document.activeElement?.classList?.contains('tpl-search') || false,
          caret: document.querySelector('.tpl-search')?.selectionStart ?? -1,
          cards: Array.from(document.querySelectorAll('.tpl-card')).map((el) => el.textContent.trim()),
          depts: Array.from(document.querySelectorAll('.tpl-card .tpl-dept')).map((el) => el.textContent.trim()),
          chips: Array.from(document.querySelectorAll('.tpl-chip')).map((el) => el.textContent.trim()),
          empty: document.querySelector('.tpl-empty')?.textContent || '',
        });
        const search = (value) => {
          const input = document.querySelector('.tpl-search');
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return snapshot();
        };
        const initial = snapshot();
        const initialSearch = document.querySelector('.tpl-search');
        initialSearch.focus();
        initialSearch.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const cardNavStart = document.activeElement?.textContent?.trim() || '';
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const cardNavRight = document.activeElement?.textContent?.trim() || '';
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const cardNavLeft = document.activeElement?.textContent?.trim() || '';
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const cardNavEscape = {
          searchFocused: document.activeElement?.classList?.contains('tpl-search') || false,
          activeTag: document.activeElement?.tagName || '',
        };
        const inputFocus = document.querySelector('.tpl-search');
        inputFocus.focus();
        inputFocus.value = '财';
        inputFocus.dispatchEvent(new Event('input', { bubbles: true }));
        const afterFirstChar = snapshot();
        const inputAfterFirst = document.querySelector('.tpl-search');
        if (document.activeElement === inputAfterFirst) {
          inputAfterFirst.value += '务';
          inputAfterFirst.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const typedFinance = snapshot();
        const finance = search('财务');
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const financeSearch = document.querySelector('.tpl-search');
        financeSearch.focus();
        financeSearch.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const arrowDown = {
          activeTag: document.activeElement?.tagName || '',
          activeClass: document.activeElement?.className || '',
          activeText: document.activeElement?.textContent?.trim() || '',
          query: document.querySelector('.tpl-search')?.value || '',
          cardCount: document.querySelectorAll('.tpl-card').length,
          firstCardText: document.querySelector('.tpl-card')?.textContent?.trim() || '',
          searchFocused: document.activeElement?.classList?.contains('tpl-search') || false,
        };
        const score = search('得分汇总');
        const none = search('完全不存在的模板词');
        document.querySelector('.tpl-empty button')?.click();
        const clearedByButton = snapshot();
        search('完全不存在的模板词');
        const input = document.querySelector('.tpl-search');
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const clearedByEscape = snapshot();
        tpl.clear();
        await tpl.showPicker();
        const reopened = snapshot();
        return { initial, cardNavStart, cardNavRight, cardNavLeft, cardNavEscape, afterFirstChar, typedFinance, finance, arrowDown, score, none, clearedByButton, clearedByEscape, reopened, savedQuery: localStorage.getItem('fb_tpl_q') };
      })()`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome template search evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No template search result returned: ${JSON.stringify(result)}`);
    if (!value.initial.cards.length) throw new Error(`template picker did not render cards: ${JSON.stringify(value)}`);
    if (!value.initial.depts.includes('通用')) throw new Error(`template cards should show department badges: ${JSON.stringify(value.initial)}`);
    if (!value.initial.chips.some((text) => /^全部\s*13$/.test(text)) || !value.initial.chips.some((text) => /^通用\s*6$/.test(text)) || !value.initial.chips.some((text) => /^财务\s*1$/.test(text))) {
      throw new Error(`template department chips should show counts: ${JSON.stringify(value.initial.chips)}`);
    }
    if (!/文档摘要/.test(value.cardNavStart) || !/翻译归档/.test(value.cardNavRight) || !/文档摘要/.test(value.cardNavLeft) || !value.cardNavEscape.searchFocused) {
      throw new Error(`template card keyboard navigation failed: ${JSON.stringify({
        cardNavStart: value.cardNavStart,
        cardNavRight: value.cardNavRight,
        cardNavLeft: value.cardNavLeft,
        cardNavEscape: value.cardNavEscape,
      })}`);
    }
    if (!value.afterFirstChar.searchFocused || value.afterFirstChar.query !== '财' || value.afterFirstChar.caret !== 1) throw new Error(`template search lost focus after first character: ${JSON.stringify(value.afterFirstChar)}`);
    if (value.typedFinance.query !== '财务' || !value.typedFinance.cards.some((text) => /实习考核题/.test(text))) throw new Error(`template search did not support continuous typing: ${JSON.stringify(value.typedFinance)}`);
    if (!value.finance.cards.some((text) => /实习考核题/.test(text))) throw new Error(`finance search did not find finance template: ${JSON.stringify(value.finance)}`);
    if (!value.finance.depts.includes('财务')) throw new Error(`finance search should show finance department badge: ${JSON.stringify(value.finance)}`);
    if (value.finance.cards.some((text) => /合同审阅/.test(text))) throw new Error(`finance search leaked unrelated contract template: ${JSON.stringify(value.finance)}`);
    if (value.arrowDown.activeTag !== 'BUTTON' || value.arrowDown.searchFocused || !/实习考核题/.test(value.arrowDown.activeText)) {
      throw new Error(`ArrowDown from template search did not focus first result card: ${JSON.stringify(value.arrowDown)}`);
    }
    if (!value.score.cards.some((text) => /实习考核题/.test(text))) throw new Error(`prompt keyword search did not find finance template: ${JSON.stringify(value.score)}`);
    if (!/没有找到匹配的模板/.test(value.none.empty) || value.none.cards.length) throw new Error(`empty search state is wrong: ${JSON.stringify(value.none)}`);
    if (value.clearedByButton.query || !value.clearedByButton.cards.length || value.clearedByButton.empty) throw new Error(`clear search button did not restore templates: ${JSON.stringify(value.clearedByButton)}`);
    if (value.clearedByEscape.query || !value.clearedByEscape.searchFocused || !value.clearedByEscape.cards.length || value.clearedByEscape.empty) throw new Error(`Escape did not clear template search: ${JSON.stringify(value.clearedByEscape)}`);
    if (value.reopened.query || !value.reopened.cards.length || value.reopened.empty) throw new Error(`template search query should reset when picker reopens: ${JSON.stringify(value.reopened)}`);
    if (value.savedQuery) throw new Error(`template search query must not persist to localStorage: ${JSON.stringify(value)}`);
    console.log('template-search-real-chrome ok');
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
