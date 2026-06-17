'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const CDP_PORT = 9244;

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
  if (!hit) throw new Error('Chrome/Edge not found for selection focus check');
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
  const profileDir = path.join(os.tmpdir(), `arca-selection-focus-profile-${Date.now()}`);
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
        expression: `document.readyState === 'complete' && typeof renderFiles === 'function' && typeof applySelection === 'function'`,
      });
      if (ready.result && ready.result.value) break;
      await wait(100);
    }
    await wait(500);

    const result = await client.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `new Promise((resolve) => {
        localStorage.setItem('fb_guided', '1');
        document.querySelector('.guide-overlay')?.remove();
        const left = { path: 'D:\\\\新人\\\\财务\\\\财务实习生考核_实操试题.docx', name: '财务实习生考核_实操试题.docx', isDir: false, isDrive: false, kind: 'docx', size: 44 * 1024, mtime: Date.now(), btime: Date.now() };
        const right = { path: 'D:\\\\新人\\\\财务\\\\财务实习生考核_实操试题_参考答案.docx', name: '财务实习生考核_实操试题_参考答案.docx', isDir: false, isDrive: false, kind: 'docx', size: 37 * 1024, mtime: Date.now(), btime: Date.now() };
        state.skillsMode = false;
        state.recentMode = false;
        state.searchMode = false;
        state.filter = '';
        state.view = 'grid';
        state.gridSize = 'md';
        state.cwd = 'D:\\\\新人\\\\财务';
        state.entries = [left, right];
        state.visible = [];
        state.multiSel.clear();
        state.selected = null;
        state.selectionAnchor = null;
        state.cursor = -1;
        renderFiles();
        requestAnimationFrame(() => {
          const leftEl = document.querySelector('[data-path="' + CSS.escape(left.path) + '"]');
          const rightEl = document.querySelector('[data-path="' + CSS.escape(right.path) + '"]');
          rightEl.focus({ preventScroll: true });
          const focusedBefore = document.activeElement?.dataset?.path || '';
          applySelection(left.path);
          requestAnimationFrame(() => resolve({
            focusedBefore,
            activePath: document.activeElement?.dataset?.path || '',
            selectedPath: state.selected,
            cursorPath: state.visible[state.cursor]?.path || '',
            leftSelected: leftEl.classList.contains('selected'),
            rightSelected: rightEl.classList.contains('selected'),
            leftCursor: leftEl.classList.contains('cursor'),
            rightCursor: rightEl.classList.contains('cursor'),
            nonSelectedFocus: (() => {
              rightEl.focus({ preventScroll: true });
              const s = getComputedStyle(rightEl);
              const rr = rightEl.getBoundingClientRect();
              return {
                activePath: document.activeElement?.dataset?.path || '',
                selected: rightEl.classList.contains('selected'),
                borderColor: s.borderColor,
                outlineStyle: s.outlineStyle,
                boxShadow: s.boxShadow,
                centerX: Math.round(rr.left + rr.width / 2),
                centerY: Math.round(rr.top + rr.height / 2),
              };
            })(),
          }));
        });
      })`,
    });

    if (result.exceptionDetails) throw new Error(`Chrome selection focus evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    const value = result.result && result.result.value;
    if (!value) throw new Error(`No selection focus result returned: ${JSON.stringify(result)}`);
    if (!/参考答案/.test(value.focusedBefore)) throw new Error(`fixture did not focus the second item first: ${JSON.stringify(value)}`);
    if (!/实操试题\.docx$/.test(value.activePath)) throw new Error(`DOM focus did not follow selected file: ${JSON.stringify(value)}`);
    if (value.activePath !== value.selectedPath) throw new Error(`active file and selected file diverged: ${JSON.stringify(value)}`);
    if (value.cursorPath !== value.selectedPath) throw new Error(`cursor file and selected file diverged: ${JSON.stringify(value)}`);
    if (!value.leftSelected || value.rightSelected) throw new Error(`only the selected file should have selected class: ${JSON.stringify(value)}`);
    if (!value.leftCursor || value.rightCursor) throw new Error(`cursor should follow the selected file: ${JSON.stringify(value)}`);
    if (!/参考答案/.test(value.nonSelectedFocus.activePath) || value.nonSelectedFocus.selected) throw new Error(`fixture did not focus a non-selected file: ${JSON.stringify(value)}`);
    if (value.nonSelectedFocus.borderColor !== 'rgba(0, 0, 0, 0)' || value.nonSelectedFocus.outlineStyle !== 'none' || value.nonSelectedFocus.boxShadow !== 'none') {
      throw new Error(`non-selected focused file still looks active: ${JSON.stringify(value)}`);
    }
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: value.nonSelectedFocus.centerX,
      y: value.nonSelectedFocus.centerY,
    });
    await wait(120);
    const hoverResult = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const rightEl = Array.from(document.querySelectorAll('.item, .row')).find((el) => /参考答案/.test(el.dataset.path || ''));
        const s = getComputedStyle(rightEl);
        return {
          hovered: rightEl.matches(':hover'),
          selected: rightEl.classList.contains('selected'),
          borderColor: s.borderColor,
          outlineStyle: s.outlineStyle,
          boxShadow: s.boxShadow,
        };
      })()`,
    });
    const hover = hoverResult.result && hoverResult.result.value;
    if (!hover || !hover.hovered || hover.selected) throw new Error(`hover fixture did not target the non-selected file: ${JSON.stringify(hover)}`);
    if (hover.borderColor !== 'rgba(0, 0, 0, 0)' || hover.outlineStyle !== 'none' || hover.boxShadow !== 'none') {
      throw new Error(`non-selected hovered file still looks active: ${JSON.stringify(hover)}`);
    }
    const dropVisualResult = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const leftEl = Array.from(document.querySelectorAll('.item, .row')).find((el) => /实操试题\\.docx$/.test(el.dataset.path || ''));
        const rightEl = Array.from(document.querySelectorAll('.item, .row')).find((el) => /参考答案/.test(el.dataset.path || ''));
        rightEl.classList.add('drop-target');
        const s = getComputedStyle(rightEl);
        const rulesText = Array.from(document.styleSheets)
          .flatMap((sheet) => {
            try { return Array.from(sheet.cssRules || []).map((rule) => rule.cssText || ''); }
            catch (_) { return []; }
          })
          .join('\\n');
        return {
          leftSelected: leftEl.classList.contains('selected'),
          rightSelected: rightEl.classList.contains('selected'),
          rightDropTarget: rightEl.classList.contains('drop-target'),
          selectorMatches: rightEl.matches('.item.drop-target:not(.selected), .row.drop-target:not(.selected)'),
          hasDropTargetRule: rulesText.includes('.item.drop-target:not(.selected), .row.drop-target:not(.selected)'),
          className: rightEl.className,
          borderColor: s.borderColor,
          backgroundColor: s.backgroundColor,
          outlineStyle: s.outlineStyle,
          outlineWidth: s.outlineWidth,
        };
      })()`,
    });
    const dropVisual = dropVisualResult.result && dropVisualResult.result.value;
    if (!dropVisual || !dropVisual.leftSelected || dropVisual.rightSelected || !dropVisual.rightDropTarget) {
      throw new Error(`drop-target visual fixture invalid: ${JSON.stringify(dropVisual)}`);
    }
    if (dropVisual.borderColor !== 'rgba(0, 0, 0, 0)' || dropVisual.backgroundColor !== 'rgba(0, 0, 0, 0)' || dropVisual.outlineStyle !== 'dashed') {
      throw new Error(`non-selected drop target still looks like selection: ${JSON.stringify(dropVisual)}`);
    }
    const staleForcePaintResult = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const leftEl = Array.from(document.querySelectorAll('.item, .row')).find((el) => /实操试题\\.docx$/.test(el.dataset.path || ''));
        const rightEl = Array.from(document.querySelectorAll('.item, .row')).find((el) => /参考答案/.test(el.dataset.path || ''));
        state.multiSel.clear();
        state.selected = leftEl.dataset.path;
        state.cursor = state.visible.findIndex((entry) => entry.path === leftEl.dataset.path);
        rightEl.classList.add('selected');
        rightEl.classList.add('cursor');
        paintSelection(true);
        highlightCursor(true);
        return {
          selectedCount: document.querySelectorAll('.item.selected, .row.selected').length,
          cursorCount: document.querySelectorAll('.item.cursor, .row.cursor').length,
          leftSelected: leftEl.classList.contains('selected'),
          rightSelected: rightEl.classList.contains('selected'),
          leftCursor: leftEl.classList.contains('cursor'),
          rightCursor: rightEl.classList.contains('cursor'),
        };
      })()`,
    });
    const staleForcePaint = staleForcePaintResult.result && staleForcePaintResult.result.value;
    if (!staleForcePaint || staleForcePaint.selectedCount !== 1 || staleForcePaint.cursorCount !== 1 || !staleForcePaint.leftSelected || staleForcePaint.rightSelected || !staleForcePaint.leftCursor || staleForcePaint.rightCursor) {
      throw new Error(`force repaint left stale selected/cursor visuals behind: ${JSON.stringify(staleForcePaint)}`);
    }
    const staleApplySelectionResult = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const leftEl = Array.from(document.querySelectorAll('.item, .row')).find((el) => /实操试题\\.docx$/.test(el.dataset.path || ''));
        const rightEl = Array.from(document.querySelectorAll('.item, .row')).find((el) => /参考答案/.test(el.dataset.path || ''));
        state.multiSel.clear();
        state.selected = rightEl.dataset.path;
        state.cursor = state.visible.findIndex((entry) => entry.path === rightEl.dataset.path);
        state.paintedSelected = new Set([leftEl.dataset.path]);
        leftEl.classList.remove('selected');
        rightEl.classList.add('selected');
        applySelection(leftEl.dataset.path);
        return {
          selectedCount: document.querySelectorAll('.item.selected, .row.selected').length,
          cursorCount: document.querySelectorAll('.item.cursor, .row.cursor').length,
          leftSelected: leftEl.classList.contains('selected'),
          rightSelected: rightEl.classList.contains('selected'),
          leftCursor: leftEl.classList.contains('cursor'),
          rightCursor: rightEl.classList.contains('cursor'),
          stateSelected: state.selected,
        };
      })()`,
    });
    const staleApplySelection = staleApplySelectionResult.result && staleApplySelectionResult.result.value;
    if (!staleApplySelection || staleApplySelection.selectedCount !== 1 || staleApplySelection.cursorCount !== 1 || !staleApplySelection.leftSelected || staleApplySelection.rightSelected || !staleApplySelection.leftCursor || staleApplySelection.rightCursor) {
      throw new Error(`single selection left stale selected/cursor visuals behind: ${JSON.stringify(staleApplySelection)}`);
    }
    const cleanupResult = await client.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const area = document.querySelector('#file-area');
        const rightEl = Array.from(document.querySelectorAll('.item, .row')).find((el) => /参考答案/.test(el.dataset.path || ''));
        const mark = () => {
          area.classList.add('drop-in');
          rightEl.classList.add('drop-target');
        };
        const snapshot = () => ({
          areaDropIn: area.classList.contains('drop-in'),
          rightDropTarget: rightEl.classList.contains('drop-target'),
        });
        mark();
        window.dispatchEvent(new Event('dragend'));
        const afterDragEnd = snapshot();
        mark();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        const afterEscape = snapshot();
        mark();
        window.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
        const afterDrop = snapshot();
        mark();
        window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        const afterPointerUp = snapshot();
        mark();
        window.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
        const afterPointerCancel = snapshot();
        mark();
        window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        const afterMouseUp = snapshot();
        mark();
        document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
        const afterVisibilityChange = snapshot();
        return { afterDragEnd, afterEscape, afterDrop, afterPointerUp, afterPointerCancel, afterMouseUp, afterVisibilityChange };
      })()`,
    });
    const cleanup = cleanupResult.result && cleanupResult.result.value;
    if (!cleanup) throw new Error(`No drop cleanup result returned: ${JSON.stringify(cleanupResult)}`);
    for (const [label, state] of Object.entries(cleanup)) {
      if (state.areaDropIn || state.rightDropTarget) throw new Error(`stale file drop hint survived ${label}: ${JSON.stringify(cleanup)}`);
    }
    console.log('selection-focus-real-chrome ok');
    console.log(JSON.stringify({ ...value, nonSelectedHover: hover, dropHintCleanup: cleanup }, null, 2));
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
