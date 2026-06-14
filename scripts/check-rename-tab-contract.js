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

assertIncludes('app', app, 'function renameAdjacentVisible');
const renameAdjacentVisible = sliceFunction(app, 'renameAdjacentVisible');
assertIncludes('renameAdjacentVisible', renameAdjacentVisible, 'state.visible.findIndex');
assertIncludes('renameAdjacentVisible', renameAdjacentVisible, 'ev.shiftKey ? -1 : 1');
assertIncludes('renameAdjacentVisible', renameAdjacentVisible, 'const nextEntry = idx >= 0 ? state.visible[idx + direction] : null');
assertIncludes('renameAdjacentVisible', renameAdjacentVisible, 'nextEntryFresh');
assertIncludes('renameAdjacentVisible', renameAdjacentVisible, 'doRename(nextEntryFresh');

const doRename = sliceFunction(app, 'doRename');
assertIncludes('doRename', doRename, "ev.key === 'Tab'");
assertIncludes('doRename', doRename, 'ev.preventDefault();');
assertIncludes('doRename', doRename, 'await finish(true);');
assertIncludes('doRename', doRename, 'renameAdjacentVisible(e.path, ev)');

assertIncludes('docs', docs, 'Tab/Shift+Tab 连续重命名');

console.log('rename-tab contract ok');
