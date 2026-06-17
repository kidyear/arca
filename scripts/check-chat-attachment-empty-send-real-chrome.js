'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9241;

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
  if (!hit) throw new Error('Chrome/Edge not found for attachment empty send check');
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
  const profileDir = path.join(os.tmpdir(), `arca-attachment-empty-profile-${Date.now()}`);
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
      expression: `(() => {
        localStorage.setItem('fb_guided', '1');
        chat.open();
        const initialSend = document.querySelector('#chat-send');
        const initialDisabled = !!initialSend.disabled;
        const initialTitle = initialSend.getAttribute('title') || '';
        chat.attachments = ['D:\\\\demo\\\\invoice.pdf'];
        chat.renderChips();
        const hintBeforeSend = document.querySelector('#chat-context-hint')?.textContent || '';
        const input = document.querySelector('#chat-input');
        const send = document.querySelector('#chat-send');
        const sendDisabledBefore = !!send.disabled;
        const sendTitleBefore = send.getAttribute('title') || '';
        input.value = '';
        const beforeMessages = document.querySelectorAll('#chat-msgs .chat-msg').length;
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        return new Promise((resolve) => setTimeout(async () => {
          const messageCountAfterEmpty = document.querySelectorAll('#chat-msgs .chat-msg').length;
          input.value = '请总结这个文件';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const sendReady = !send.disabled;
          const sendTitleReady = send.getAttribute('title') || '';
          const attachmentsAfterEmpty = [...chat.attachments];
          const chipCountAfterEmpty = document.querySelectorAll('#chat-chips .chat-chip').length;
          const toastAfterEmpty = document.querySelector('#toast')?.textContent || '';
          chat.attachments = [];
          chat.renderChips();
          const selectedPath = 'D:\\\\demo\\\\selected-report.docx';
          state.visible = [{ path: selectedPath, name: 'selected-report.docx', isDir: false, isDrive: false, kind: 'docx', size: 12 }];
          state.entryByPath = new Map([[selectedPath, state.visible[0]]]);
          state.multiSel.clear();
          state.selected = selectedPath;
          state.cursor = 0;
          paintSelection(true);
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const selectedEmptyTitle = send.getAttribute('title') || '';
          const beforeSelectedEmptyMessages = document.querySelectorAll('#chat-msgs .chat-msg').length;
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          const selectedEmptyToast = document.querySelector('#toast')?.textContent || '';
          const afterSelectedEmptyMessages = document.querySelectorAll('#chat-msgs .chat-msg').length;
          input.value = '请总结当前选中的文件';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const selectedTextTitle = send.getAttribute('title') || '';
          const beforeSelectedTextMessages = document.querySelectorAll('#chat-msgs .chat-msg').length;
          let selectedTextFetchCount = 0;
          const fetchBeforeSelectedText = window.fetch.bind(window);
          const selectedTextEncoder = new TextEncoder();
          window.fetch = (url, opts) => {
            if (String(url).includes('/api/ai/chat')) {
              selectedTextFetchCount += 1;
              return Promise.resolve(new Response(new ReadableStream({
                start(controller) {
                  controller.enqueue(selectedTextEncoder.encode('data: {"type":"error","message":"should not send"}\\n\\n'));
                  controller.close();
                },
              }), { headers: { 'Content-Type': 'text/event-stream' } }));
            }
            return fetchBeforeSelectedText(url, opts);
          };
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          await new Promise((r) => setTimeout(r, 90));
          window.fetch = fetchBeforeSelectedText;
          const selectedTextToast = document.querySelector('#toast')?.textContent || '';
          const selectedTextMessageDelta = document.querySelectorAll('#chat-msgs .chat-msg').length - beforeSelectedTextMessages;
          const selectedTextStillDraft = input.value;
          const selectedTextAttachments = [...chat.attachments];
          const attachSelected = document.querySelector('#chat-context-hint .chat-use-selected');
          if (attachSelected) attachSelected.click();
          const attachedAfterSelected = [...chat.attachments];
          const titleAfterAttachSelected = send.getAttribute('title') || '';
          const busyKey = chat.currentChat || '__new__';
          chat.busyChats.add(busyKey);
          chat.updateComposer();
          input.value = '继续总结';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const busyTitle = send.getAttribute('title') || '';
          const busyDisabled = !!send.disabled;
          const beforeBusyMessages = document.querySelectorAll('#chat-msgs .chat-msg').length;
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          const busyToast = document.querySelector('#toast')?.textContent || '';
          const busyMessageDelta = document.querySelectorAll('#chat-msgs .chat-msg').length - beforeBusyMessages;
          const busyStillRunning = chat.busyChats.has(busyKey);
          const stop = document.querySelector('#chat-stop');
          stop.click();
          const stopLabelAfterClick = stop.textContent || '';
          const stopDisabledAfterClick = !!stop.disabled;
          const stopTitleAfterClick = stop.getAttribute('title') || '';
          const stopToast = document.querySelector('#toast')?.textContent || '';
          const stoppingTracked = chat.stoppingChats && chat.stoppingChats.has(busyKey);
          chat.busyChats.delete(busyKey);
          chat.stoppingChats.delete(busyKey);
          chat.updateComposer();
          const stopHiddenAfterClear = stop.classList.contains('hidden');
          const originalFetch = window.fetch.bind(window);
          const enc = new TextEncoder();
          window.fetch = (url, opts) => {
            if (String(url).includes('/api/ai/chat')) {
              return Promise.resolve(new Response(new ReadableStream({
                start(controller) {
                  controller.enqueue(enc.encode('data: {"type":"error","message":"API key 无效"}\\n\\n'));
                  controller.close();
                },
              }), { headers: { 'Content-Type': 'text/event-stream' } }));
            }
            return originalFetch(url, opts);
          };
          chat.currentChat = 'draft-error-e2e';
          chat.busyChats.delete(chat.currentChat);
          chat.stoppingChats.delete(chat.currentChat);
          chat.attachments = ['D:\\\\demo\\\\retry-source.docx'];
          chat.renderChips();
          input.value = '请基于附件生成一版可打印文档';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await chat.send();
          window.fetch = originalFetch;
          const draftRestoredInput = input.value;
          const draftRestoredAttachments = [...chat.attachments];
          const draftRestoredChipCount = document.querySelectorAll('#chat-chips .chat-chip').length;
          const draftRestoredSendReady = !send.disabled;
          const draftRestoreToast = document.querySelector('#toast')?.textContent || '';
          window.fetch = (url, opts) => {
            if (String(url).includes('/api/ai/chat')) {
              return Promise.resolve(new Response('upstream unavailable', { status: 502, statusText: 'Bad Gateway' }));
            }
            return originalFetch(url, opts);
          };
          chat.currentChat = 'draft-http-error-e2e';
          chat.busyChats.delete(chat.currentChat);
          chat.stoppingChats.delete(chat.currentChat);
          chat.attachments = ['D:\\\\demo\\\\http-retry.docx'];
          chat.renderChips();
          input.value = '请继续基于附件生成文档';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await chat.send();
          window.fetch = originalFetch;
          const httpErrorRestoredInput = input.value;
          const httpErrorRestoredAttachments = [...chat.attachments];
          const httpErrorRestoredChipCount = document.querySelectorAll('#chat-chips .chat-chip').length;
          const httpErrorRestoredSendReady = !send.disabled;
          const httpErrorToast = document.querySelector('#toast')?.textContent || '';
          window.fetch = (url, opts) => {
            if (String(url).includes('/api/ai/chat')) {
              return Promise.resolve(new Response(new ReadableStream({
                start(controller) { controller.close(); },
              }), { headers: { 'Content-Type': 'text/event-stream' } }));
            }
            return originalFetch(url, opts);
          };
          chat.currentChat = 'draft-empty-stream-e2e';
          chat.busyChats.delete(chat.currentChat);
          chat.stoppingChats.delete(chat.currentChat);
          chat.attachments = ['D:\\\\demo\\\\empty-stream.docx'];
          chat.renderChips();
          input.value = '请继续处理这个附件';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await chat.send();
          window.fetch = originalFetch;
          const emptyStreamRestoredInput = input.value;
          const emptyStreamRestoredAttachments = [...chat.attachments];
          const emptyStreamRestoredChipCount = document.querySelectorAll('#chat-chips .chat-chip').length;
          const emptyStreamRestoredSendReady = !send.disabled;
          const emptyStreamToast = document.querySelector('#toast')?.textContent || '';
          resolve({
            attachmentsAfterEmpty,
            chipCountAfterEmpty,
            initialDisabled,
            initialTitle,
            inputFocused: document.activeElement === input,
            messageCount: messageCountAfterEmpty,
            beforeMessages,
            hintBeforeSend,
            sendDisabledBefore,
            sendTitleBefore,
            sendReady,
            sendTitleReady,
            selectedEmptyTitle,
            selectedEmptyToast,
            selectedEmptyMessageDelta: afterSelectedEmptyMessages - beforeSelectedEmptyMessages,
            selectedTextTitle,
            selectedTextToast,
            selectedTextMessageDelta,
            selectedTextStillDraft,
            selectedTextAttachments,
            selectedTextFetchCount,
            attachedAfterSelected,
            titleAfterAttachSelected,
            busyTitle,
            busyDisabled,
            busyToast,
            busyMessageDelta,
            busyStillRunning,
            stopLabelAfterClick,
            stopDisabledAfterClick,
            stopTitleAfterClick,
            stopToast,
            stoppingTracked,
            stopHiddenAfterClear,
            draftRestoredInput,
            draftRestoredAttachments,
            draftRestoredChipCount,
            draftRestoredSendReady,
            draftRestoreToast,
            httpErrorRestoredInput,
            httpErrorRestoredAttachments,
            httpErrorRestoredChipCount,
            httpErrorRestoredSendReady,
            httpErrorToast,
            emptyStreamRestoredInput,
            emptyStreamRestoredAttachments,
            emptyStreamRestoredChipCount,
            emptyStreamRestoredSendReady,
            emptyStreamToast,
            toastAfterEmpty,
            busy: chat.busyChats && chat.busyChats.size,
          });
        }, 80));
      })()`,
    });
    if (result.exceptionDetails) throw new Error(`Chrome attachment empty send evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No attachment empty send result returned: ${JSON.stringify(result)}`);
    if (!value.initialDisabled) throw new Error(`send button should start disabled when input is empty: ${JSON.stringify(value)}`);
    if (!value.initialTitle.includes('输入要 AI 做的事后发送')) throw new Error(`initial send title should explain empty input: ${JSON.stringify(value)}`);
    if (value.messageCount !== value.beforeMessages) throw new Error(`empty attachment send should not create messages at that point: ${JSON.stringify(value)}`);
    if (!value.attachmentsAfterEmpty.includes('D:\\demo\\invoice.pdf')) throw new Error(`attachment should be kept for retry: ${JSON.stringify(value)}`);
    if (value.chipCountAfterEmpty !== 1) throw new Error(`attachment chip should remain visible: ${JSON.stringify(value)}`);
    if (!value.inputFocused) throw new Error(`chat input should receive focus: ${JSON.stringify(value)}`);
    if (!value.hintBeforeSend.includes('请补一句要 AI 做什么')) throw new Error(`attachment hint should ask for an instruction before send: ${JSON.stringify(value)}`);
    if (!value.sendDisabledBefore) throw new Error(`send button should be disabled until the user types an instruction: ${JSON.stringify(value)}`);
    if (!value.sendTitleBefore.includes('已附加路径，请补一句要 AI 做什么')) throw new Error(`send button title should explain why it is disabled: ${JSON.stringify(value)}`);
    if (!value.sendReady) throw new Error(`send button should become enabled after typing an instruction: ${JSON.stringify(value)}`);
    if (value.sendTitleReady !== '发送给 AI') throw new Error(`send button ready title should be concise: ${JSON.stringify(value)}`);
    if (!value.selectedEmptyTitle.includes('当前选中文件不会自动发送')) throw new Error(`empty selected-file title should explain selection is not attached: ${JSON.stringify(value)}`);
    if (!value.selectedEmptyToast.includes('当前选中文件不会自动发送，请输入任务并点“附加选中”')) throw new Error(`empty selected-file Enter should show a clear toast: ${JSON.stringify(value)}`);
    if (value.selectedEmptyMessageDelta !== 0) throw new Error(`empty selected-file Enter should not create messages: ${JSON.stringify(value)}`);
    if (!value.selectedTextTitle.includes('当前选中文件不会自动发送')) throw new Error(`typed selected-file title should warn selection is not attached: ${JSON.stringify(value)}`);
    if (!value.selectedTextToast.includes('当前选中文件不会自动发送；请先点“附加选中”，或取消选中后再发送纯文本')) throw new Error(`typed selected-file Enter should explain how to avoid losing file context: ${JSON.stringify(value)}`);
    if (value.selectedTextMessageDelta !== 0) throw new Error(`typed selected-file Enter should not create messages before attaching the selected path: ${JSON.stringify(value)}`);
    if (value.selectedTextStillDraft !== '请总结当前选中的文件') throw new Error(`typed selected-file Enter should keep the draft in the input: ${JSON.stringify(value)}`);
    if (value.selectedTextAttachments.length) throw new Error(`typed selected-file Enter should not auto-attach paths: ${JSON.stringify(value)}`);
    if (value.selectedTextFetchCount !== 0) throw new Error(`typed selected-file Enter should not call /api/ai/chat: ${JSON.stringify(value)}`);
    if (!value.attachedAfterSelected.includes('D:\\demo\\selected-report.docx')) throw new Error(`attach selected should add selected path: ${JSON.stringify(value)}`);
    if (value.titleAfterAttachSelected !== '发送给 AI') throw new Error(`title should return to normal after attaching selected file: ${JSON.stringify(value)}`);
    if (!value.busyDisabled) throw new Error(`busy chat should disable send button: ${JSON.stringify(value)}`);
    if (!value.busyTitle.includes('当前对话正在运行')) throw new Error(`busy send title should explain current chat is running: ${JSON.stringify(value)}`);
    if (!value.busyToast.includes('当前对话正在运行，可先停止或切到其它会话')) throw new Error(`busy Enter should show a clear toast: ${JSON.stringify(value)}`);
    if (value.busyMessageDelta !== 0) throw new Error(`busy Enter should not create messages: ${JSON.stringify(value)}`);
    if (!value.busyStillRunning) throw new Error(`busy Enter should not clear busy state: ${JSON.stringify(value)}`);
    if (!value.stopLabelAfterClick.includes('停止中')) throw new Error(`stop button should show stopping feedback immediately: ${JSON.stringify(value)}`);
    if (!value.stopDisabledAfterClick) throw new Error(`stop button should disable while stop is pending: ${JSON.stringify(value)}`);
    if (!value.stopTitleAfterClick.includes('正在停止')) throw new Error(`stop button title should explain pending stop: ${JSON.stringify(value)}`);
    if (!value.stopToast.includes('正在停止当前对话')) throw new Error(`stop click should toast immediate feedback: ${JSON.stringify(value)}`);
    if (!value.stoppingTracked) throw new Error(`stop click should track stopping state for the current conversation: ${JSON.stringify(value)}`);
    if (!value.stopHiddenAfterClear) throw new Error(`stop button should hide after busy state clears: ${JSON.stringify(value)}`);
    if (value.draftRestoredInput !== '请基于附件生成一版可打印文档') throw new Error(`early chat error should restore input draft: ${JSON.stringify(value)}`);
    if (!value.draftRestoredAttachments.includes('D:\\demo\\retry-source.docx')) throw new Error(`early chat error should restore attachments: ${JSON.stringify(value)}`);
    if (value.draftRestoredChipCount !== 1) throw new Error(`early chat error should restore attachment chips: ${JSON.stringify(value)}`);
    if (!value.draftRestoredSendReady) throw new Error(`restored draft should be ready to resend: ${JSON.stringify(value)}`);
    if (!value.draftRestoreToast.includes('已恢复输入和附件')) throw new Error(`early chat error should explain restored draft: ${JSON.stringify(value)}`);
    if (value.httpErrorRestoredInput !== '请继续基于附件生成文档') throw new Error(`HTTP chat error should restore input draft: ${JSON.stringify(value)}`);
    if (!value.httpErrorRestoredAttachments.includes('D:\\demo\\http-retry.docx')) throw new Error(`HTTP chat error should restore attachments: ${JSON.stringify(value)}`);
    if (value.httpErrorRestoredChipCount !== 1) throw new Error(`HTTP chat error should restore attachment chips: ${JSON.stringify(value)}`);
    if (!value.httpErrorRestoredSendReady) throw new Error(`HTTP error restored draft should be ready to resend: ${JSON.stringify(value)}`);
    if (!value.httpErrorToast.includes('已恢复输入和附件')) throw new Error(`HTTP chat error should explain restored draft: ${JSON.stringify(value)}`);
    if (value.emptyStreamRestoredInput !== '请继续处理这个附件') throw new Error(`empty chat stream should restore input draft: ${JSON.stringify(value)}`);
    if (!value.emptyStreamRestoredAttachments.includes('D:\\demo\\empty-stream.docx')) throw new Error(`empty chat stream should restore attachments: ${JSON.stringify(value)}`);
    if (value.emptyStreamRestoredChipCount !== 1) throw new Error(`empty chat stream should restore attachment chips: ${JSON.stringify(value)}`);
    if (!value.emptyStreamRestoredSendReady) throw new Error(`empty stream restored draft should be ready to resend: ${JSON.stringify(value)}`);
    if (!value.emptyStreamToast.includes('已恢复输入和附件')) throw new Error(`empty chat stream should explain restored draft: ${JSON.stringify(value)}`);
    if (!value.toastAfterEmpty.includes('已附加路径，请补一句要 AI 做什么')) throw new Error(`missing instruction toast: ${JSON.stringify(value)}`);
    if (value.busy) throw new Error(`empty attachment send should not start a chat turn: ${JSON.stringify(value)}`);
    console.log('chat-attachment-empty-send-real-chrome ok');
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
