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

const cursorEnter = sliceFunction(app, 'cursorEnter');
assertIncludes('cursorEnter', cursorEnter, 'if (e.isDir && editor)');
assertIncludes('cursorEnter', cursorEnter, 'openNewWindow(e.path)');
assertIncludes('cursorEnter', cursorEnter, 'if (e.isDir) { state.selected = e.path; navigate(e.path); }');
assertIncludes('cursorEnter', cursorEnter, "openWith(e.path, 'editor')");

console.log('ctrl-enter-window contract ok');
