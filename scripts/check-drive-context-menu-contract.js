'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function assertSliceNotIncludes(label, text, fromNeedle, toNeedle, forbidden) {
  const from = text.indexOf(fromNeedle);
  if (from < 0) throw new Error(`${label} missing start: ${fromNeedle}`);
  const to = text.indexOf(toNeedle, from + fromNeedle.length);
  if (to < 0) throw new Error(`${label} missing end: ${toNeedle}`);
  const slice = text.slice(from, to);
  if (slice.includes(forbidden)) throw new Error(`${label} must not include ${forbidden}`);
}

assertIncludes('app', app, 'function driveContextItems');
assertIncludes('app', app, 'function mixedDriveSelectionContextItems');
assertIncludes('app', app, 'if (e.isDrive) { popupMenu(ev, driveContextItems(e, ev)); return; }');
assertIncludes('app', app, 'if (state.multiSel.size > 1 && state.multiSel.has(e.path) && selEntries().some((it) => it.isDrive))');
assertIncludes('app', app, "function mutableSelectedEntries");
assertIncludes('app', app, "if (items.some((it) => it.isDrive)) { toast('不能对盘符执行文件操作', true); return []; }");
assertIncludes('app', app, "if (e.isDrive) { toast('盘符不能重命名', true); return null; }");
assertIncludes('app', app, "if (e.isDrive) { toast('不能删除盘符', true); return; }");
assertIncludes('app', app, "if (e.isDrive) { toast('不能永久删除盘符', true); return; }");
assertIncludes('app', app, "if (it && it.isDrive) return;");
assertIncludes('app', app, "const entries = mutableSelectedEntries();");
assertSliceNotIncludes('driveContextItems', app, 'function driveContextItems', 'function showContextMenu', '重命名');
assertSliceNotIncludes('driveContextItems', app, 'function driveContextItems', 'function showContextMenu', '移到废纸篓');
assertSliceNotIncludes('driveContextItems', app, 'function driveContextItems', 'function showContextMenu', '永久删除');
assertSliceNotIncludes('driveContextItems', app, 'function driveContextItems', 'function showContextMenu', '剪切');
assertSliceNotIncludes('mixedDriveSelectionContextItems', app, 'function mixedDriveSelectionContextItems', 'function driveContextItems', '移到废纸篓');
assertSliceNotIncludes('mixedDriveSelectionContextItems', app, 'function mixedDriveSelectionContextItems', 'function driveContextItems', '永久删除');
assertSliceNotIncludes('mixedDriveSelectionContextItems', app, 'function mixedDriveSelectionContextItems', 'function driveContextItems', '剪切');
assertIncludes('docs', docs, '盘符安全菜单');

console.log('drive-context-menu contract ok');
