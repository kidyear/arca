'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

assertIncludes('app', app, 'async function pasteShortcutFromClipboard');
const pasteShortcutFromClipboard = sliceFunction(app, 'pasteShortcutFromClipboard');
assertIncludes('pasteShortcutFromClipboard', pasteShortcutFromClipboard, 'await shortcutClipboard()');
assertIncludes('pasteShortcutFromClipboard empty clipboard feedback', pasteShortcutFromClipboard, "if (!clip || !clip.paths?.length) { toast('剪贴板中没有可用于创建快捷方式的文件', true); return; }");
assertIncludes('pasteShortcutFromClipboard', pasteShortcutFromClipboard, "clip.op !== 'copy'");
assertIncludes('pasteShortcutFromClipboard', pasteShortcutFromClipboard, "apiPost('/api/shortcut'");
assertIncludes('pasteShortcutFromClipboard tracks last shortcut error', pasteShortcutFromClipboard, "let fail = 0, lastErr = '';");
assertIncludes('pasteShortcutFromClipboard preserves shortcut error reason', pasteShortcutFromClipboard, "lastErr = friendlyErrorText(r, '创建快捷方式失败');");
assertIncludes('pasteShortcutFromClipboard reports partial failure reason', pasteShortcutFromClipboard, "toast(fail ? `已粘贴 ${created.length} 个快捷方式，${fail} 项失败${lastErr ? `：${lastErr}` : ''}` : `已粘贴 ${created.length} 个快捷方式`);");
assertIncludes('pasteShortcutFromClipboard reports all-failed reason', pasteShortcutFromClipboard, "if (fail && !created.length) toast('粘贴快捷方式失败：' + (lastErr || '未知错误'), true);");
assertIncludes('pasteShortcutFromClipboard', pasteShortcutFromClipboard, "pushUndo({ type: 'shortcut'");
assertIncludes('pasteShortcutFromClipboard', pasteShortcutFromClipboard, 'selectVisiblePaths(created.map((it) => it.path))');

assertIncludes('app', app, 'async function createShortcutForEntries');
const createShortcutForEntries = sliceFunction(app, 'createShortcutForEntries');
assertIncludes('createShortcutForEntries calls shortcut API', createShortcutForEntries, "apiPost('/api/shortcut'");
assertIncludes('createShortcutForEntries tracks last shortcut error', createShortcutForEntries, "let fail = 0, lastErr = '';");
assertIncludes('createShortcutForEntries preserves shortcut error reason', createShortcutForEntries, "lastErr = friendlyErrorText(r, '创建快捷方式失败');");
assertIncludes('createShortcutForEntries reports partial failure reason', createShortcutForEntries, "toast(fail ? `已创建 ${created.length} 个快捷方式，${fail} 项失败${lastErr ? `：${lastErr}` : ''}` : `已创建 ${created.length} 个快捷方式`);");
assertIncludes('createShortcutForEntries reports all-failed reason', createShortcutForEntries, "if (fail && !created.length) toast('创建快捷方式失败：' + (lastErr || '未知错误'), true);");

const shortcutClipboard = sliceFunction(app, 'shortcutClipboard');
assertIncludes('shortcutClipboard', shortcutClipboard, 'window.fanboxClipboard.readFiles');
assertIncludes('shortcutClipboard', shortcutClipboard, "r.op === 'cut' ? 'cut' : 'copy'");
assertIncludes('shortcutClipboard returns read failure for caller feedback', shortcutClipboard, "if (!r.ok || r.error) return { error: friendlyErrorText(r, '读取失败'), paths: [] };");
assertIncludes('pasteShortcutFromClipboard reports clipboard read failure separately', pasteShortcutFromClipboard, "if (clip && clip.error) { toast('读取剪贴板失败：' + friendlyErrorText(clip), true); return; }");

assertIncludes('app', app, 'function canPasteShortcut');
const canPasteShortcut = sliceFunction(app, 'canPasteShortcut');
assertIncludes('canPasteShortcut', canPasteShortcut, "state.fileClip.op === 'copy'");
assertIncludes('canPasteShortcut', canPasteShortcut, 'window.fanboxClipboard?.readFiles');

const showContextMenu = sliceFunction(app, 'showContextMenu');
assertIncludes('showContextMenu', showContextMenu, 'canPasteShortcut() && e.isDir');
assertIncludes('showContextMenu', showContextMenu, '粘贴快捷方式到');
assertIncludes('showContextMenu', showContextMenu, 'pasteShortcutFromClipboard(e.path)');

const blankContextItems = sliceFunction(app, 'blankContextItems');
assertIncludes('blankContextItems', blankContextItems, 'canPasteShortcut()');
assertIncludes('blankContextItems', blankContextItems, "label: '粘贴快捷方式'");
assertIncludes('blankContextItems', blankContextItems, 'pasteShortcutFromClipboard()');

assertIncludes('docs', docs, '粘贴快捷方式');

console.log('paste-shortcut contract ok');
