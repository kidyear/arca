'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

assertIncludes('app', app, 'function currentEntry');
assertIncludes('currentEntry', sliceFunction(app, 'currentEntry'), 'state.entryByPath.get(state.selected)');
assertIncludes('toggleCursorSelection', sliceFunction(app, 'toggleCursorSelection'), 'currentEntry()');
assertIncludes('selectCursorEntry', sliceFunction(app, 'selectCursorEntry'), 'currentEntry()');
assertIncludes('cursorEnter', sliceFunction(app, 'cursorEnter'), 'currentEntry()');
assertIncludes('trashSelection', sliceFunction(app, 'trashSelection'), 'currentEntry()');
assertIncludes('deleteSelectionPermanent', sliceFunction(app, 'deleteSelectionPermanent'), 'currentEntry()');
assertIncludes('showPropertiesSelection', sliceFunction(app, 'showPropertiesSelection'), 'currentEntry()');
assertIncludes('openKeyboardContextMenu', sliceFunction(app, 'openKeyboardContextMenu'), 'currentEntry()');
assertIncludes('keydown', app, 'const it = currentEntry(); if (it && it.isDrive) return; if (it) doRename(it);');

console.log('current-entry contract ok');
