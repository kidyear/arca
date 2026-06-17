'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9249;

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
  if (!hit) throw new Error('Chrome/Edge not found for chat provider key check');
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
  const profileDir = path.join(os.tmpdir(), `arca-chat-provider-key-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof chat === 'object' && typeof chat.refreshModelLabel === 'function'`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }
    await wait(500);

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `new Promise(async (resolve) => {
        localStorage.setItem('fb_guided', '1');
        document.querySelector('.guide-overlay')?.remove();
        window.__mockActive = 'deepseek';
        window.__mockProviderHasKey = false;
        window.__mockCustomBaseUrl = '';
        window.__mockCustomModel = 'custom-model';
        window.__chatPostCount = 0;
        window.__configPostCount = 0;
        window.__configBodies = [];
        const originalFetch = window.fetch.bind(window);
        window.fetch = (url, options) => {
          const href = String(url || '');
          if (href.includes('/api/ai/providers')) {
            return Promise.resolve(new Response(JSON.stringify({
              active: window.__mockActive,
              approvalMode: 'smart',
              providers: {
                deepseek: { label: 'DeepSeek', model: 'deepseek-v4-flash', hasKey: window.__mockProviderHasKey, models: ['deepseek-v4-flash'] },
                claude: { label: 'Claude Code', model: 'sonnet', hasKey: false, models: ['sonnet'] },
                custom: { label: '自定义中转 (Anthropic 兼容)', model: window.__mockCustomModel, baseUrl: window.__mockCustomBaseUrl, hasKey: true, models: [] },
              },
            }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
          }
          const path = new URL(href, location.href).pathname;
          if (path === '/api/ai/chat') {
            window.__chatPostCount += 1;
            return Promise.resolve(new Response('', { status: 500 }));
          }
          if (path === '/api/ai/config') {
            window.__configPostCount += 1;
            try { window.__configBodies.push(JSON.parse(options?.body || '{}')); } catch { window.__configBodies.push({}); }
            return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
          }
          return originalFetch(url, options);
        };
        chat.open();
        const input = document.querySelector('#chat-input');
        const send = document.querySelector('#chat-send');
        await chat.refreshModelLabel();
        input.value = '你好';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        chat.updateComposer();
        const beforeMessages = document.querySelectorAll('#chat-msgs .chat-msg').length;
        await chat.send();
        await new Promise((r) => setTimeout(r, 120));
        const missing = {
          providerReady: chat.providerReady,
          label: chat.providerMissingKeyLabel,
          model: document.querySelector('#chat-model').textContent,
          disabled: send.disabled,
          title: send.getAttribute('title') || '',
          toast: document.querySelector('#toast')?.textContent || '',
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
          messageDelta: document.querySelectorAll('#chat-msgs .chat-msg').length - beforeMessages,
          chatPostCount: window.__chatPostCount,
        };
        const missingLiveSave = {
          disabled: document.querySelector('#ai-save').disabled,
          title: document.querySelector('#ai-save').getAttribute('title') || '',
          status: document.querySelector('#ai-status').textContent,
        };
        document.querySelector('#ai-key').value = '';
        await aiSettings.save();
        await new Promise((r) => setTimeout(r, 120));
        const saveBlocked = {
          configPostCount: window.__configPostCount,
          status: document.querySelector('#ai-status').textContent,
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
          keyFocused: document.activeElement === document.querySelector('#ai-key'),
        };
        document.querySelector('#ai-key').value = 'sk-test';
        document.querySelector('#ai-key').dispatchEvent(new Event('input', { bubbles: true }));
        const keyFilledLiveSave = {
          disabled: document.querySelector('#ai-save').disabled,
          title: document.querySelector('#ai-save').getAttribute('title') || '',
          status: document.querySelector('#ai-status').textContent,
        };
        await aiSettings.save();
        await new Promise((r) => setTimeout(r, 120));
        const saveWithKey = {
          configPostCount: window.__configPostCount,
          lastBody: window.__configBodies[window.__configBodies.length - 1] || {},
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
        };
        document.querySelector('#ai-settings').classList.add('hidden');
        window.__mockProviderHasKey = true;
        await chat.refreshModelLabel();
        input.value = '你好';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        chat.updateComposer();
        const ready = {
          providerReady: chat.providerReady,
          label: chat.providerMissingKeyLabel,
          model: document.querySelector('#chat-model').textContent,
          disabled: send.disabled,
          title: send.getAttribute('title') || '',
        };
        window.__mockActive = 'custom';
        window.__mockCustomBaseUrl = '';
        window.__mockCustomModel = 'custom-model';
        await chat.refreshModelLabel();
        input.value = '测试自定义中转';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        chat.updateComposer();
        const beforeCustomMessages = document.querySelectorAll('#chat-msgs .chat-msg').length;
        const beforeCustomPosts = window.__chatPostCount;
        await chat.send();
        await new Promise((r) => setTimeout(r, 120));
        const customMissingBase = {
          providerReady: chat.providerReady,
          reason: chat.providerUnavailableReason,
          model: document.querySelector('#chat-model').textContent,
          disabled: send.disabled,
          title: send.getAttribute('title') || '',
          toast: document.querySelector('#toast')?.textContent || '',
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
          messageDelta: document.querySelectorAll('#chat-msgs .chat-msg').length - beforeCustomMessages,
          chatPostDelta: window.__chatPostCount - beforeCustomPosts,
        };
        const customBaseLiveSave = {
          disabled: document.querySelector('#ai-save').disabled,
          title: document.querySelector('#ai-save').getAttribute('title') || '',
          status: document.querySelector('#ai-status').textContent,
        };
        const beforeBaseSavePosts = window.__configPostCount;
        document.querySelector('#ai-baseurl').value = '';
        document.querySelector('#ai-model').value = 'custom-model';
        await aiSettings.save();
        await new Promise((r) => setTimeout(r, 120));
        const customBaseSaveBlocked = {
          configPostDelta: window.__configPostCount - beforeBaseSavePosts,
          status: document.querySelector('#ai-status').textContent,
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
          baseFocused: document.activeElement === document.querySelector('#ai-baseurl'),
        };
        const beforeModelSavePosts = window.__configPostCount;
        document.querySelector('#ai-baseurl').value = 'https://relay.example/anthropic';
        document.querySelector('#ai-model').value = '';
        document.querySelector('#ai-baseurl').dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('#ai-model').dispatchEvent(new Event('input', { bubbles: true }));
        const customModelLiveSave = {
          disabled: document.querySelector('#ai-save').disabled,
          title: document.querySelector('#ai-save').getAttribute('title') || '',
          status: document.querySelector('#ai-status').textContent,
        };
        await aiSettings.save();
        await new Promise((r) => setTimeout(r, 120));
        const customModelSaveBlocked = {
          configPostDelta: window.__configPostCount - beforeModelSavePosts,
          status: document.querySelector('#ai-status').textContent,
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
          modelFocused: document.activeElement === document.querySelector('#ai-model'),
        };
        document.querySelector('#ai-model').value = 'custom-model';
        document.querySelector('#ai-model').dispatchEvent(new Event('input', { bubbles: true }));
        const customCompleteLiveSave = {
          disabled: document.querySelector('#ai-save').disabled,
          title: document.querySelector('#ai-save').getAttribute('title') || '',
          status: document.querySelector('#ai-status').textContent,
        };
        await aiSettings.save();
        await new Promise((r) => setTimeout(r, 120));
        const customSaveReady = {
          configPostCount: window.__configPostCount,
          lastBody: window.__configBodies[window.__configBodies.length - 1] || {},
          settingsOpen: !document.querySelector('#ai-settings').classList.contains('hidden'),
        };
        resolve({ missing, missingLiveSave, saveBlocked, keyFilledLiveSave, saveWithKey, ready, customMissingBase, customBaseLiveSave, customBaseSaveBlocked, customModelLiveSave, customModelSaveBlocked, customCompleteLiveSave, customSaveReady });
      })`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome provider key evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No provider key result returned: ${JSON.stringify(result)}`);
    if (value.missing.providerReady !== false || value.missing.label !== 'DeepSeek') throw new Error(`missing-key provider state is wrong: ${JSON.stringify(value)}`);
    if (!value.missing.model.includes('未配 key')) throw new Error(`missing-key model label should expose status: ${JSON.stringify(value)}`);
    if (!value.missing.disabled || !value.missing.title.includes('DeepSeek 还没配置 API key')) throw new Error(`send should be disabled with clear key title: ${JSON.stringify(value)}`);
    if (!value.missing.toast.includes('DeepSeek 还没配置 API key')) throw new Error(`missing-key send should toast clear guidance: ${JSON.stringify(value)}`);
    if (!value.missing.settingsOpen) throw new Error(`missing-key send should open settings: ${JSON.stringify(value)}`);
    if (value.missing.messageDelta !== 0 || value.missing.chatPostCount !== 0) throw new Error(`missing-key send must not create messages or post chat: ${JSON.stringify(value)}`);
    if (!value.missingLiveSave.disabled || !value.missingLiveSave.status.includes('DeepSeek 需要先填写 API key')) throw new Error(`missing-key settings save button should be disabled with clear live status: ${JSON.stringify(value)}`);
    if (value.saveBlocked.configPostCount !== 0) throw new Error(`missing-key settings save must not post config: ${JSON.stringify(value)}`);
    if (!value.saveBlocked.status.includes('DeepSeek 需要先填写 API key')) throw new Error(`missing-key settings save should explain required key: ${JSON.stringify(value)}`);
    if (!value.saveBlocked.settingsOpen || !value.saveBlocked.keyFocused) throw new Error(`missing-key settings save should keep modal open and focus key: ${JSON.stringify(value)}`);
    if (value.keyFilledLiveSave.disabled || value.keyFilledLiveSave.title !== '保存并启用当前 AI 服务商') throw new Error(`typed key should immediately enable settings save: ${JSON.stringify(value)}`);
    if (value.saveWithKey.configPostCount !== 1 || value.saveWithKey.lastBody.apiKey !== 'sk-test') throw new Error(`settings save with typed key should post config: ${JSON.stringify(value)}`);
    if (value.saveWithKey.settingsOpen) throw new Error(`settings save with typed key should close modal: ${JSON.stringify(value)}`);
    if (value.ready.providerReady !== true || value.ready.label !== '') throw new Error(`ready provider state is wrong: ${JSON.stringify(value)}`);
    if (value.ready.model.includes('未配 key')) throw new Error(`ready model label should not show missing key: ${JSON.stringify(value)}`);
    if (value.ready.disabled || value.ready.title !== '发送给 AI') throw new Error(`configured provider should allow typed send: ${JSON.stringify(value)}`);
    if (value.customMissingBase.providerReady !== false || value.customMissingBase.reason !== '需要填写 Base URL') throw new Error(`custom missing base state is wrong: ${JSON.stringify(value)}`);
    if (!value.customMissingBase.model.includes('缺 Base URL')) throw new Error(`custom missing base model label should expose status: ${JSON.stringify(value)}`);
    if (!value.customMissingBase.disabled || !value.customMissingBase.title.includes('需要填写 Base URL')) throw new Error(`custom missing base should disable send with clear title: ${JSON.stringify(value)}`);
    if (!value.customMissingBase.toast.includes('需要填写 Base URL')) throw new Error(`custom missing base send should toast clear guidance: ${JSON.stringify(value)}`);
    if (!value.customMissingBase.settingsOpen || value.customMissingBase.messageDelta !== 0 || value.customMissingBase.chatPostDelta !== 0) throw new Error(`custom missing base send must not create messages or post chat: ${JSON.stringify(value)}`);
    if (!value.customBaseLiveSave.disabled || !value.customBaseLiveSave.status.includes('需要填写 Base URL')) throw new Error(`custom missing base save button should be disabled with clear live status: ${JSON.stringify(value)}`);
    if (value.customBaseSaveBlocked.configPostDelta !== 0 || !value.customBaseSaveBlocked.status.includes('需要填写 Base URL')) throw new Error(`custom missing base settings save should be blocked: ${JSON.stringify(value)}`);
    if (!value.customBaseSaveBlocked.settingsOpen || !value.customBaseSaveBlocked.baseFocused) throw new Error(`custom missing base save should keep modal open and focus base URL: ${JSON.stringify(value)}`);
    if (!value.customModelLiveSave.disabled || !value.customModelLiveSave.status.includes('需要先选择或填写模型')) throw new Error(`custom missing model save button should be disabled with clear live status: ${JSON.stringify(value)}`);
    if (value.customModelSaveBlocked.configPostDelta !== 0 || !value.customModelSaveBlocked.status.includes('需要先选择或填写模型')) throw new Error(`custom missing model settings save should be blocked: ${JSON.stringify(value)}`);
    if (!value.customModelSaveBlocked.settingsOpen || !value.customModelSaveBlocked.modelFocused) throw new Error(`custom missing model save should keep modal open and focus model: ${JSON.stringify(value)}`);
    if (value.customCompleteLiveSave.disabled || value.customCompleteLiveSave.title !== '保存并启用当前 AI 服务商') throw new Error(`complete custom config should immediately enable settings save: ${JSON.stringify(value)}`);
    if (value.customSaveReady.lastBody.provider !== 'custom' || value.customSaveReady.lastBody.baseUrl !== 'https://relay.example/anthropic' || value.customSaveReady.lastBody.model !== 'custom-model') throw new Error(`custom complete settings save should post usable config: ${JSON.stringify(value)}`);
    if (value.customSaveReady.settingsOpen) throw new Error(`custom complete settings save should close modal: ${JSON.stringify(value)}`);
    console.log('chat-provider-key-real-chrome ok');
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
