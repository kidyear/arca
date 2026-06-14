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

assertIncludes('app', app, 'function handleGridSizeShortcut(');
const fn = sliceFunction(app, 'handleGridSizeShortcut');
assertIncludes('handleGridSizeShortcut', fn, "state.view !== 'grid'");
assertIncludes('handleGridSizeShortcut', fn, "e.key === '+'");
assertIncludes('handleGridSizeShortcut', fn, "e.key === '='");
assertIncludes('handleGridSizeShortcut', fn, "e.key === '-'");
assertIncludes('handleGridSizeShortcut', fn, "e.key === '0'");
assertIncludes('handleGridSizeShortcut', fn, 'stepGridSize(1)');
assertIncludes('handleGridSizeShortcut', fn, 'stepGridSize(-1)');
assertIncludes('handleGridSizeShortcut', fn, "setGridSize('md')");
assertIncludes('handleGridSizeShortcut', fn, 'return true');
assertIncludes('keydown', app, 'handleGridSizeShortcut(e)');
assertIncludes('docs', docs, 'Ctrl+加减/0 缩略图大小');

console.log('grid-size-shortcut contract ok');
