'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
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

assertIncludes('html', html, 'id="toggle-hidden"');
assertIncludes('app', app, 'function toggleHiddenFiles(');

const toggleHiddenFiles = sliceFunction(app, 'toggleHiddenFiles');
assertIncludes('toggleHiddenFiles', toggleHiddenFiles, 'state.showHidden =');
assertIncludes('toggleHiddenFiles', toggleHiddenFiles, "localStorage.setItem('fb_hidden'");
assertIncludes('toggleHiddenFiles', toggleHiddenFiles, "$('#toggle-hidden')");
assertIncludes('toggleHiddenFiles', toggleHiddenFiles, 'renderFiles()');
assertIncludes('toggleHiddenFiles', toggleHiddenFiles, "toast(state.showHidden ? '已显示隐藏文件' : '已隐藏隐藏文件')");

const bindEvents = sliceFunction(app, 'bindEvents');
assertIncludes('bindEvents checkbox', bindEvents, "$('#toggle-hidden').onchange = (e) => toggleHiddenFiles(e.target.checked)");
assertIncludes('bindEvents shortcut', bindEvents, "mod && e.shiftKey && !e.altKey && (e.key === 'h' || e.key === 'H')");
assertIncludes('bindEvents shortcut', bindEvents, 'toggleHiddenFiles(); return;');
assertIncludes('bindEvents input guard', bindEvents, '!inInput');

assertIncludes('docs', docs, 'Ctrl+Shift+H 隐藏文件切换');

console.log('hidden-files-shortcut contract ok');
