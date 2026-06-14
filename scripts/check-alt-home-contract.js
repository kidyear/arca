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

assertIncludes('app', app, 'function goHome()');
const goHome = sliceFunction(app, 'goHome');
assertIncludes('goHome', goHome, 'state.home');
assertIncludes('goHome', goHome, 'navigate(state.home');

const bindEvents = sliceFunction(app, 'bindEvents');
assertIncludes('bindEvents', bindEvents, "e.altKey && e.key === 'Home'");
assertIncludes('bindEvents', bindEvents, 'goHome(); return;');

assertIncludes('docs', docs, 'Alt+Home 回主目录');

console.log('alt-home contract ok');
