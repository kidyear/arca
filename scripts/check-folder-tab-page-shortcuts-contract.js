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

const bindEvents = sliceFunction(app, 'bindEvents');
assertIncludes('bindEvents', bindEvents, "mod && !e.shiftKey && !e.altKey && e.key === 'PageUp'");
assertIncludes('bindEvents', bindEvents, 'stepFolderTab(-1); return;');
assertIncludes('bindEvents', bindEvents, "mod && !e.shiftKey && !e.altKey && e.key === 'PageDown'");
assertIncludes('bindEvents', bindEvents, 'stepFolderTab(1); return;');
assertIncludes('bindEvents input guard', bindEvents, '!inInput');

assertIncludes('docs', docs, 'Ctrl+PageUp/PageDown 标签页切换');

console.log('folder-tab-page-shortcuts contract ok');
