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

assertIncludes('app', app, 'function fileScrollTop');
assertIncludes('app', app, 'function restoreFileScrollTop');

const fileScrollTop = sliceFunction(app, 'fileScrollTop');
assertIncludes('fileScrollTop', fileScrollTop, "$('#content')");
assertIncludes('fileScrollTop', fileScrollTop, 'scrollTop');

const restoreFileScrollTop = sliceFunction(app, 'restoreFileScrollTop');
assertIncludes('restoreFileScrollTop', restoreFileScrollTop, "$('#content')");
assertIncludes('restoreFileScrollTop', restoreFileScrollTop, 'scrollTop = top');

const refresh = sliceFunction(app, 'refresh');
assertIncludes('refresh', refresh, 'const oldScrollTop = fileScrollTop()');
assertIncludes('refresh', refresh, 'syncPreviewAfterRefresh();');
assertIncludes('refresh', refresh, 'restoreFileScrollTop(oldScrollTop);');

assertIncludes('docs', docs, '刷新保留滚动位置');

console.log('refresh-scroll contract ok');
