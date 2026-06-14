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

const bindEvents = sliceFunction(app, 'bindEvents');
assertIncludes('bindEvents', bindEvents, "e.key === 'F5'");
assertIncludes('bindEvents', bindEvents, "refreshDir(true); return;");
assertIncludes('bindEvents', bindEvents, "mod && !e.shiftKey && !e.altKey && (e.key === 'r' || e.key === 'R')");
assertIncludes('bindEvents', bindEvents, "e.preventDefault(); refreshDir(true); return;");

assertIncludes('docs', docs, 'Ctrl+R 刷新当前目录');

console.log('refresh-shortcuts contract ok');
