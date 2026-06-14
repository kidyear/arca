'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
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

assertIncludes('html sort controls', html, 'data-sort="btime"');
assertIncludes('css list grid', css, 'var(--list-btime-w, 130px)');

assertIncludes('list column defaults', app, 'const LIST_COL_DEFAULTS = { mtime: 130, btime: 130, kind: 112, size: 90 };');

const visibleEntries = sliceFunction(app, 'visibleEntries');
assertIncludes('visibleEntries', visibleEntries, "state.sort === 'btime'");
assertIncludes('visibleEntries', visibleEntries, "byNum('btime')");

const setSort = sliceFunction(app, 'setSort');
assertIncludes('setSort allow list', setSort, "['name', 'mtime', 'btime', 'kind', 'size']");

const listColText = sliceFunction(app, 'listColText');
assertIncludes('listColText', listColText, "col === 'btime'");
assertIncludes('listColText', listColText, 'fmtTime(e.btime)');

const autoFitListCol = sliceFunction(app, 'autoFitListCol');
assertIncludes('autoFitListCol header', autoFitListCol, "btime: '创建时间'");

const renderFiles = sliceFunction(app, 'renderFiles');
assertIncludes('list header', renderFiles, "sortHeadCell('btime', '创建时间', true)");

const listRow = sliceFunction(app, 'listRow');
assertIncludes('list row created time cell', listRow, 'fmtTime(e.btime)');

assertIncludes('docs', docs, '列表创建时间列');

console.log('created-time-column contract ok');
