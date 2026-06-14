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
assertIncludes('pasteShortcutFromClipboard', pasteShortcutFromClipboard, "clip.op !== 'copy'");
assertIncludes('pasteShortcutFromClipboard', pasteShortcutFromClipboard, "apiPost('/api/shortcut'");
assertIncludes('pasteShortcutFromClipboard', pasteShortcutFromClipboard, "pushUndo({ type: 'shortcut'");
assertIncludes('pasteShortcutFromClipboard', pasteShortcutFromClipboard, 'selectVisiblePaths(created.map((it) => it.path))');

const shortcutClipboard = sliceFunction(app, 'shortcutClipboard');
assertIncludes('shortcutClipboard', shortcutClipboard, 'window.fanboxClipboard.readFiles');
assertIncludes('shortcutClipboard', shortcutClipboard, "r.op === 'cut' ? 'cut' : 'copy'");

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
