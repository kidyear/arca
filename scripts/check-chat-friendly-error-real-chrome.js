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
  if (!hit) throw new Error('Chrome/Edge not found for friendly chat error check');
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
  const profileDir = path.join(os.tmpdir(), `arca-friendly-chat-error-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && window.chat && typeof chat.send === 'function' && !!document.querySelector('#chat-input')`,
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
        chat.open();
        chat.providerReady = true;
        chat.providerUnavailableLabel = '';
        chat.providerUnavailableReason = '';
        chat.providerMissingKeyLabel = '';
        const input = document.querySelector('#chat-input');
        const originalFetch = window.fetch.bind(window);
        const enc = new TextEncoder();
        const lastError = () => {
          const errors = [...document.querySelectorAll('#chat-msgs .chat-error')];
          return errors.length ? errors[errors.length - 1].textContent : '';
        };
        const sendWithFetch = async (id, text, fetchImpl) => {
          window.fetch = fetchImpl;
          chat.currentChat = id;
          chat.busyChats.delete(id);
          chat.stoppingChats.delete(id);
          chat.attachments = ['D:\\\\demo\\\\retry.docx'];
          chat.renderChips();
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await chat.send();
          return {
            errorText: lastError(),
            restoredInput: input.value,
            restoredAttachments: [...chat.attachments],
          };
        };
        let relayPostCount = 0;
        const relay = await sendWithFetch('friendly-relay-e2e', '请处理附件', (url, opts) => {
          if (new URL(String(url), location.href).pathname === '/api/ai/chat') {
            relayPostCount += 1;
            if (relayPostCount > 1) {
              return Promise.resolve(new Response(new ReadableStream({
                start(controller) {
                  controller.enqueue(enc.encode('data: {"type":"text","delta":"重试成功"}\\n\\n'));
                  controller.enqueue(enc.encode('data: {"type":"done"}\\n\\n'));
                  controller.close();
                },
              }), { headers: { 'Content-Type': 'text/event-stream' } }));
            }
            return Promise.resolve(new Response(new ReadableStream({
              start(controller) {
                controller.enqueue(enc.encode('data: {"type":"error","message":"relay: fetch failed ECONNREFUSED 127.0.0.1:9999"}\\n\\n'));
                controller.close();
              },
            }), { headers: { 'Content-Type': 'text/event-stream' } }));
          }
          return originalFetch(url, opts);
        });
        const relayRetryButton = [...document.querySelectorAll('#chat-msgs .chat-error-action')].find((button) => button.textContent === '重试');
        if (relayRetryButton) relayRetryButton.click();
        await new Promise((r) => setTimeout(r, 220));
        relay.retryButtonText = relayRetryButton ? relayRetryButton.textContent : '';
        relay.retryPostCount = relayPostCount;
        relay.retryAssistantText = [...document.querySelectorAll('#chat-msgs .chat-msg.assistant')].pop()?.textContent || '';
        const auth = await sendWithFetch('friendly-auth-e2e', '请处理附件', (url, opts) => {
          if (new URL(String(url), location.href).pathname === '/api/ai/chat') {
            return Promise.resolve(new Response('{"error":{"message":"invalid api key"}}', { status: 401, statusText: 'Unauthorized' }));
          }
          return originalFetch(url, opts);
        });
        const authSettingsButton = [...document.querySelectorAll('#chat-msgs .chat-error-action')].reverse().find((button) => button.textContent === '打开设置');
        if (authSettingsButton) authSettingsButton.click();
        await new Promise((r) => setTimeout(r, 120));
        auth.settingsButtonText = authSettingsButton ? authSettingsButton.textContent : '';
        auth.settingsOpen = !document.querySelector('#ai-settings')?.classList.contains('hidden');
        document.querySelector('#ai-settings')?.classList.add('hidden');
        const quota = await sendWithFetch('friendly-quota-e2e', '请处理附件', (url, opts) => {
          if (new URL(String(url), location.href).pathname === '/api/ai/chat') {
            return Promise.resolve(new Response(new ReadableStream({
              start(controller) {
                controller.enqueue(enc.encode('data: {"type":"error","message":"Direct API 429: rate limit exceeded insufficient_quota"}\\n\\n'));
                controller.close();
              },
            }), { headers: { 'Content-Type': 'text/event-stream' } }));
          }
          return originalFetch(url, opts);
        });
        window.fetch = originalFetch;
        resolve({ relay, auth, quota });
      })`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome friendly chat error evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No friendly chat error result returned: ${JSON.stringify(result)}`);
    if (!value.relay.errorText.includes('AI 服务暂时没有响应')) throw new Error(`relay error was not friendly: ${JSON.stringify(value)}`);
    if (/relay:|ECONNREFUSED|fetch failed/i.test(value.relay.errorText)) throw new Error(`relay raw detail leaked: ${JSON.stringify(value)}`);
    if (value.relay.retryButtonText !== '重试' || value.relay.retryPostCount < 2 || !value.relay.retryAssistantText.includes('重试成功')) {
      throw new Error(`relay retry action did not resend successfully: ${JSON.stringify(value)}`);
    }
    if (!value.auth.errorText.includes('AI 认证失败')) throw new Error(`auth error was not friendly: ${JSON.stringify(value)}`);
    if (/invalid api key|Unauthorized/i.test(value.auth.errorText)) throw new Error(`auth raw detail leaked: ${JSON.stringify(value)}`);
    if (value.auth.settingsButtonText !== '打开设置' || !value.auth.settingsOpen) throw new Error(`auth settings action did not open settings: ${JSON.stringify(value)}`);
    if (!value.quota.errorText.includes('AI 服务限流或额度不足')) throw new Error(`quota error was not friendly: ${JSON.stringify(value)}`);
    if (/Direct API|insufficient_quota|rate limit/i.test(value.quota.errorText)) throw new Error(`quota raw detail leaked: ${JSON.stringify(value)}`);
    for (const [label, item] of Object.entries(value)) {
      if (item.restoredInput !== '请处理附件') throw new Error(`${label} draft was not restored: ${JSON.stringify(value)}`);
      if (!item.restoredAttachments.includes('D:\\demo\\retry.docx')) throw new Error(`${label} attachment was not restored: ${JSON.stringify(value)}`);
    }
    console.log('chat-friendly-error-real-chrome ok');
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
