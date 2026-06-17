'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9259;

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
  if (!hit) throw new Error('Chrome/Edge not found for chat copy answer check');
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
  const profileDir = path.join(os.tmpdir(), `arca-chat-copy-answer-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof appendAssistantCopyAction === 'function' && typeof updateAssistantCopyActionState === 'function' && typeof enhanceChatCodeBlocks === 'function'`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `new Promise(async (resolve) => {
        localStorage.setItem('fb_guided', '1');
        document.querySelector('.guide-overlay')?.remove();
        let answer = '';
        window.__copiedAnswer = '';
        window.fanboxClipboard = {
          copyText: async (text) => {
            window.__copiedAnswer = text;
            return { ok: true };
          },
        };
        window.__sentTerminal = null;
        term.available = () => true;
        term.sendContext = (text, srcPath) => {
          window.__sentTerminal = { text, srcPath };
        };
        const box = document.createElement('div');
        box.className = 'chat-msg assistant';
        document.body.appendChild(box);
        const btn = appendAssistantCopyAction(box, () => answer);
        const before = { disabled: btn.disabled, title: btn.title };
        answer = '第一行\\n\\n- 项目 A\\n- 项目 B';
        updateAssistantCopyActionState(btn, () => answer);
        const after = { disabled: btn.disabled, title: btn.title };
        btn.click();
        const replyCopied = window.__copiedAnswer;
        const md = document.createElement('div');
        md.className = 'md-body chat-md';
        md.innerHTML = '<pre><code>npm run build\\nnode server.js</code></pre><table><thead><tr><th>项目</th><th>金额</th></tr></thead><tbody><tr><td>住宿</td><td>1500</td></tr><tr><td>交通</td><td>230</td></tr></tbody></table>';
        document.body.appendChild(md);
        enhanceChatCodeBlocks(md);
        enhanceChatTables(md);
        const codeBtn = md.querySelector('.chat-code-copy');
        const termBtn = md.querySelector('.chat-code-send-term');
        const tableBtn = md.querySelector('.chat-table-copy');
        const codeEnhanced = md.querySelector('pre')?.dataset?.copyEnhanced || '';
        const tableEnhanced = md.querySelector('table')?.dataset?.copyEnhanced || '';
        const codeBtnText = codeBtn?.textContent || '';
        const termBtnText = termBtn?.textContent || '';
        const tableBtnText = tableBtn?.textContent || '';
        codeBtn?.click();
        const codeCopied = window.__copiedAnswer;
        termBtn?.click();
        const sentTerminal = window.__sentTerminal;
        tableBtn?.click();
        window.fanboxClipboard.copyText = async () => ({ ok: false, error: 'clipboard locked' });
        await copyText('D:\\\\demo\\\\report.docx', '已复制测试');
        setTimeout(() => resolve({
          before,
          after,
          replyCopied,
          codeCopied,
          tableCopied: window.__copiedAnswer,
          toast: document.querySelector('#toast')?.textContent || '',
          failureToast: document.querySelector('#toast')?.textContent || '',
          codeEnhanced,
          tableEnhanced,
          codeBtnText,
          termBtnText,
          tableBtnText,
          codeBtnCount: md.querySelectorAll('.chat-code-copy').length,
          termBtnCount: md.querySelectorAll('.chat-code-send-term').length,
          tableBtnCount: md.querySelectorAll('.chat-table-copy').length,
          tableWrapCount: md.querySelectorAll('.chat-table-wrap').length,
          sentTerminal,
        }), 100);
      })`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome chat copy answer evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No chat copy answer result returned: ${JSON.stringify(result)}`);
    if (!value.before.disabled || value.before.title !== '回复生成后可复制') throw new Error(`blank reply copy button should be disabled: ${JSON.stringify(value)}`);
    if (value.after.disabled || value.after.title !== '复制这条 AI 回复') throw new Error(`reply copy button should enable after text arrives: ${JSON.stringify(value)}`);
    if (value.replyCopied !== '第一行\n\n- 项目 A\n- 项目 B') throw new Error(`copy button should copy raw answer text: ${JSON.stringify(value)}`);
    if (value.codeEnhanced !== '1' || value.codeBtnText !== '复制代码' || value.codeBtnCount !== 1) throw new Error(`code block copy button missing: ${JSON.stringify(value)}`);
    if (value.codeCopied !== 'npm run build\nnode server.js') throw new Error(`code block copy should copy only raw code text: ${JSON.stringify(value)}`);
    if (value.termBtnText !== '发到终端' || value.termBtnCount !== 1) throw new Error(`code block terminal button missing: ${JSON.stringify(value)}`);
    if (!value.sentTerminal || value.sentTerminal.text !== 'npm run build\nnode server.js' || value.sentTerminal.srcPath !== 'AI 回复代码块') {
      throw new Error(`code block terminal button should send safe context text: ${JSON.stringify(value)}`);
    }
    if (value.tableEnhanced !== '1' || value.tableBtnText !== '复制表格' || value.tableBtnCount !== 1 || value.tableWrapCount !== 1) throw new Error(`table copy button missing: ${JSON.stringify(value)}`);
    if (value.tableCopied !== '项目\t金额\n住宿\t1500\n交通\t230') throw new Error(`table copy should copy tsv text: ${JSON.stringify(value)}`);
    if (!String(value.failureToast || '').includes('复制失败：clipboard locked')) throw new Error(`copy failure should show concrete clipboard reason without blaming browser limitations: ${JSON.stringify(value)}`);
    console.log('chat-copy-answer-real-chrome ok');
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
