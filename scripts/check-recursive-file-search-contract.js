'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
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

assertIncludes('html', html, 'id="file-search-recursive"');
assertIncludes('html', html, '搜索子文件夹');

assertIncludes('state', app, 'searchMode: false');
assertIncludes('state', app, 'searchQuery:');
assertIncludes('state', app, 'searchRoot:');
assertIncludes('state', app, 'searchTruncated:');

const searchCurrentTree = sliceFunction(app, 'searchCurrentTree');
assertIncludes('searchCurrentTree', searchCurrentTree, '/api/search?q=');
assertIncludes('searchCurrentTree', searchCurrentTree, 'state.searchMode = true');
assertIncludes('searchCurrentTree', searchCurrentTree, 'state.searchQuery = term');
assertIncludes('searchCurrentTree', searchCurrentTree, 'state.searchRoot = root');
assertIncludes('searchCurrentTree', searchCurrentTree, 'prepareEntries');
assertIncludes('searchCurrentTree', searchCurrentTree, '搜索子文件夹');

const exitSearchMode = sliceFunction(app, 'exitSearchMode');
assertIncludes('exitSearchMode', exitSearchMode, 'state.searchMode = false');
assertIncludes('exitSearchMode', exitSearchMode, "state.searchQuery = ''");

assertIncludes('visibleEntries', sliceFunction(app, 'visibleEntries'), '!state.searchMode');
assertIncludes('listRow', sliceFunction(app, 'listRow'), 'state.searchMode');
assertIncludes('renderFiles', sliceFunction(app, 'renderFiles'), 'searchTruncated');
assertIncludes('syncFilterUi', sliceFunction(app, 'syncFilterUi'), 'state.searchMode ? state.searchQuery');
assertIncludes('setFileFilter', sliceFunction(app, 'setFileFilter'), 'exitSearchMode(false)');
assertIncludes('navigate', sliceFunction(app, 'navigate'), 'exitSearchMode(false)');
assertIncludes('openThisPcView', sliceFunction(app, 'openThisPcView'), 'exitSearchMode(false)');
assertIncludes('showRecent', sliceFunction(app, 'showRecent'), 'exitSearchMode(false)');
assertIncludes('bindEvents', app, "$('#file-search-recursive').onclick");
assertIncludes('bindEvents', app, "e.key === 'Enter'");

assertIncludes('docs', docs, '搜索子文件夹');

console.log('recursive-file-search contract ok');
