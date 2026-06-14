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

assertIncludes('app', app, 'function clearFileFilterFromKeyboard(');
const fn = sliceFunction(app, 'clearFileFilterFromKeyboard');
assertIncludes('clearFileFilterFromKeyboard', fn, 'state.filter');
assertIncludes('clearFileFilterFromKeyboard', fn, "setFileFilter('')");
assertIncludes('clearFileFilterFromKeyboard', fn, "toast('已清空当前目录搜索')");
assertIncludes('clearFileFilterFromKeyboard', fn, 'return true');
assertIncludes('keydown', app, "e.key === 'Escape' && !inInput && clearFileFilterFromKeyboard()");
assertIncludes('docs', docs, 'Esc 清当前目录搜索');

console.log('escape-filter contract ok');
