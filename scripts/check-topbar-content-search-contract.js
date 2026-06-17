'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(src, name) {
  const start = src.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`missing function ${name}`);
  let depth = 0;
  let seen = false;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '{') { depth += 1; seen = true; }
    if (ch === '}') {
      depth -= 1;
      if (seen && depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`function ${name} did not close`);
}

assertIncludes('state', app, 'searchContentMode: false');
assertIncludes('topbar has discoverable content search button', index, 'id="file-search-content"');
assertIncludes('content search button title explains body search', index, '搜索文件正文');

const syncFilterUi = sliceFunction(app, 'syncFilterUi');
assertIncludes('syncFilterUi keeps content prefix visible', syncFilterUi, "state.searchContentMode ? `内容:${state.searchQuery}` : state.searchQuery");

const exitSearchMode = sliceFunction(app, 'exitSearchMode');
assertIncludes('exitSearchMode clears content search mode', exitSearchMode, 'state.searchContentMode = false');

const searchCurrentTree = sliceFunction(app, 'searchCurrentTree');
assertIncludes('searchCurrentTree detects content prefix', searchCurrentTree, 'isContentSearchQuery(rawTerm)');
assertIncludes('searchCurrentTree strips content prefix', searchCurrentTree, 'contentSearchTerm(rawTerm)');
assertIncludes('topbar content search uses api content', searchCurrentTree, "'/api/content?q='");
assertIncludes('topbar filename search still uses api search', searchCurrentTree, "'/api/search?q='");
assertIncludes('content search entries keep hit metadata', searchCurrentTree, 'content: isContent');
assertIncludes('search mode stores content flag', searchCurrentTree, 'state.searchContentMode = isContent');

assertIncludes('content search button handler exists', app, 'function triggerTopbarContentSearch');
const triggerTopbarContentSearch = sliceFunction(app, 'triggerTopbarContentSearch');
assertIncludes('content search button inserts content prefix', triggerTopbarContentSearch, '内容:');
assertIncludes('content search button runs tree search', triggerTopbarContentSearch, 'searchCurrentTree()');
assertIncludes('content search button is wired', app, "$('#file-search-content').onclick = () => triggerTopbarContentSearch();");

const renderStatusbar = sliceFunction(app, 'renderStatusbar');
assertIncludes('statusbar labels content search', renderStatusbar, '内容搜索');
assertIncludes('statusbar branches on content search mode', renderStatusbar, 'state.searchContentMode');

const renderSearchFailure = sliceFunction(app, 'renderSearchFailure');
assertIncludes('content search failures keep mode label', renderSearchFailure, 'state.searchContentMode ? \'内容搜索失败\'');
assertIncludes('content search failures show content hint', renderSearchFailure, '文件正文');

const renderFiles = sliceFunction(app, 'renderFiles');
assertIncludes('empty content search has specific message', renderFiles, '没有在文件内容中搜索到');
assertIncludes('empty content search explains filename search alternative', renderFiles, '不带“内容:”则按文件名搜索');

const listRow = sliceFunction(app, 'listRow');
assertIncludes('list row renders hit snippets', listRow, 'rowHitHtml(e)');
assertIncludes('hit snippet helper exists', app, 'function rowHitHtml(e)');

const rowHitHtml = sliceFunction(app, 'rowHitHtml');
assertIncludes('content hit label says body', rowHitHtml, '正文');

assertIncludes('row hit css exists', css, '.list .row .row-hit');
assertIncludes('row hit css wraps long snippets', css, 'overflow-wrap: anywhere;');

assertIncludes('docs mention topbar content search', docs, '顶部搜索框输入 `内容:关键词`');

console.log('topbar-content-search contract ok');
