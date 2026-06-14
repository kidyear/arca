'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(__dirname, '..', 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

assertIncludes('app', app, 'function restoreSelectionAfterRefresh');
const restoreSelectionAfterRefresh = sliceFunction(app, 'restoreSelectionAfterRefresh');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'oldSelected');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'oldMultiSel');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'oldCursor');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'state.entryByPath.has');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'fallbackIdx');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'state.visible[fallbackIdx]');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'state.cursor = state.visible.findIndex');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'state.selectionAnchor');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'paintSelection()');
assertIncludes('restoreSelectionAfterRefresh', restoreSelectionAfterRefresh, 'highlightCursor()');

const refresh = sliceFunction(app, 'refresh');
assertIncludes('refresh', refresh, 'const oldSelected = state.selected');
assertIncludes('refresh', refresh, 'const oldMultiSel = new Set(state.multiSel)');
assertIncludes('refresh', refresh, 'const oldCursor = state.cursor');
assertIncludes('refresh', refresh, 'restoreSelectionAfterRefresh(oldSelected, oldMultiSel, oldAnchor, oldCursor');
assertIncludes('refresh', refresh, 'renderFiles();');

assertIncludes('docs', docs, '刷新保留选择和邻近光标');

console.log('refresh-preserves-selection contract ok');
