'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(src, name) {
  const start = src.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = src.indexOf('\nfunction ', start + 1);
  return src.slice(start, next < 0 ? src.length : next);
}

const renderStatusbar = sliceFunction(app, 'renderStatusbar');
assertIncludes('renderStatusbar', renderStatusbar, 'state.searchMode');
assertIncludes('renderStatusbar', renderStatusbar, 'state.searchQuery');
assertIncludes('renderStatusbar', renderStatusbar, 'state.searchRoot');
assertIncludes('renderStatusbar', renderStatusbar, '搜索「');
assertIncludes('renderStatusbar', renderStatusbar, 'sb-clear-search');
assertIncludes('renderStatusbar', renderStatusbar, 'clearFileFilterFromKeyboard()');
assertIncludes('renderStatusbar', renderStatusbar, 'title="清空搜索结果并回到原目录列表"');

if (renderStatusbar.includes('selEntries()') || renderStatusbar.includes('.filter((e) => e.isDir)') || renderStatusbar.includes('.reduce(')) {
  throw new Error('renderStatusbar should keep using cached visibleStats/selectionStats');
}

assertIncludes('docs', docs, '搜索状态栏');

console.log('search-statusbar contract ok');
