'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9240;

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
  if (!hit) throw new Error('Chrome/Edge not found for preview selection chat check');
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
  const profileDir = path.join(os.tmpdir(), `arca-preview-chat-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof bindSelectionToTerminal === 'function' && typeof sendPreviewSelectionToChat === 'function'`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }
    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(() => {
        localStorage.setItem('fb_guided', '1');
        showPreviewPanel();
        const body = document.querySelector('#preview-body');
        body.innerHTML = '<pre id="fixture-text">这是需要让 AI 继续分析的预览片段。</pre>';
        const sourcePath = 'D:\\\\demo\\\\report.txt';
        state.selected = sourcePath;
        bindSelectionToTerminal();
        const textNode = document.querySelector('#fixture-text').firstChild;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent.length);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.dispatchEvent(new Event('selectionchange'));
        return new Promise((resolve) => setTimeout(() => {
          const chatButton = document.querySelector('.sel-send-group [data-act="chat"]');
          const beforeMessages = document.querySelectorAll('#chat-msgs .chat-msg').length;
          state.selected = sourcePath;
          if (chatButton) chatButton.click();
          const input = document.querySelector('#chat-input');
          resolve({
            buttonShown: !!chatButton,
            inputValue: input ? input.value : '',
            attachments: Array.isArray(chat.attachments) ? [...chat.attachments] : [],
            chipTitle: document.querySelector('#chat-chips .chat-chip')?.getAttribute('title') || '',
            chatMode: document.querySelector('#terminal-panel')?.classList.contains('chat-mode'),
            focused: document.activeElement === input,
            messageCount: document.querySelectorAll('#chat-msgs .chat-msg').length,
            beforeMessages,
          });
        }, 80));
      })()`,
    });
    if (result.exceptionDetails) throw new Error(`Chrome preview selection evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No preview selection result returned: ${JSON.stringify(result)}`);
    if (!value.buttonShown) throw new Error(`preview selection chat button not shown: ${JSON.stringify(value)}`);
    if (!value.chatMode) throw new Error(`chat mode was not opened: ${JSON.stringify(value)}`);
    if (!value.focused) throw new Error(`chat input did not receive focus: ${JSON.stringify(value)}`);
    if (!value.inputValue.includes('引用当前预览选中文本')) throw new Error(`missing quote header: ${JSON.stringify(value)}`);
    if (!value.inputValue.includes('D:\\demo\\report.txt')) throw new Error(`missing source path: ${JSON.stringify(value)}`);
    if (!value.inputValue.includes('这是需要让 AI 继续分析的预览片段。')) throw new Error(`missing selected text: ${JSON.stringify(value)}`);
    if (!value.attachments.includes('D:\\demo\\report.txt')) throw new Error(`source path was not attached: ${JSON.stringify(value)}`);
    if (value.chipTitle !== 'D:\\demo\\report.txt') throw new Error(`source path chip missing: ${JSON.stringify(value)}`);
    if (value.messageCount !== value.beforeMessages) throw new Error(`selection should not auto-send chat message: ${JSON.stringify(value)}`);
    const termResult = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(() => {
        window.fanboxPty = window.fanboxPty || {};
        window.Terminal = window.Terminal || function TerminalStub() {};
        window.__noXterm = false;
        showPreviewPanel();
        const panel = document.querySelector('#terminal-panel');
        if (panel) panel.classList.remove('hidden');
        const body = document.querySelector('#preview-body');
        body.innerHTML = '<pre id="fixture-term-text">请把这段内容作为终端上下文。</pre>';
        const sourcePath = 'D:\\\\demo\\\\terminal-source.txt';
        state.selected = sourcePath;
        let captured = '';
        let focused = false;
        term.active = 'stub-session';
        term.sessions = [{ id: 'stub-session', xterm: { focus() { focused = true; } } }];
        term.input = (id, text) => { captured += text; };
        bindSelectionToTerminal();
        const textNode = document.querySelector('#fixture-term-text').firstChild;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent.length);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.dispatchEvent(new Event('selectionchange'));
        return new Promise((resolve) => setTimeout(() => {
          const termButton = document.querySelector('.sel-send-group [data-act="term"]');
          state.selected = sourcePath;
          if (termButton) termButton.click();
          resolve({
            buttonShown: !!termButton,
            captured,
            focused,
            toast: document.querySelector('#toast')?.textContent || '',
          });
        }, 80));
      })()`,
    });
    if (termResult.exceptionDetails) throw new Error(`Chrome preview terminal evaluation failed: ${JSON.stringify(termResult.exceptionDetails)}`);
    const termValue = termResult.result && termResult.result.value;
    if (!termValue) throw new Error(`No preview terminal result returned: ${JSON.stringify(termResult)}`);
    if (!termValue.buttonShown) throw new Error(`preview selection terminal button not shown: ${JSON.stringify(termValue)}`);
    if (termValue.toast !== '已发到终端，确认后再回车') throw new Error(`unexpected terminal toast: ${JSON.stringify(termValue)}`);
    if (!termValue.captured.includes('\x1b[200~') || !termValue.captured.includes('\x1b[201~')) throw new Error(`terminal context should use bracketed paste: ${JSON.stringify(termValue)}`);
    if (!termValue.captured.includes('请把这段内容作为终端上下文。')) throw new Error(`terminal context missing selected text: ${JSON.stringify(termValue)}`);
    if (!termValue.captured.includes('terminal-source.txt')) throw new Error(`terminal context missing source path: ${JSON.stringify(termValue)}`);
    if (termValue.captured.includes('\r')) throw new Error(`terminal context should not auto-execute: ${JSON.stringify(termValue)}`);
    if (!termValue.focused) throw new Error(`terminal session was not focused after context paste: ${JSON.stringify(termValue)}`);
    console.log('preview-selection-to-chat-real-chrome ok');
    console.log(JSON.stringify({ chat: value, terminal: termValue }, null, 2));
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
