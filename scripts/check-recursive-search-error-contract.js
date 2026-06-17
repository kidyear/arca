'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(src, name) {
  const start = src.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = src.indexOf('\nfunction ', start + 1);
  return src.slice(start, next < 0 ? src.length : next);
}

const searchCurrentTree = sliceFunction(app, 'searchCurrentTree');

assertIncludes('search failure renderer exists', app, 'function renderSearchFailure(term, root, err)');
assertIncludes('search failure keeps user context visible', app, '搜索子文件夹失败');
assertIncludes('search failure offers retry', app, 'id="search-retry"');
assertIncludes('search failure offers return', app, 'id="search-back"');
assertIncludes('search catch renders failure page', searchCurrentTree, 'renderSearchFailure(term, root, err);');
assertIncludes('search catch restores filter text', searchCurrentTree, "$('#file-filter').value = term;");
assertIncludes('search retry reruns search', app, "retry.onclick = () => searchCurrentTree();");
assertIncludes('search back returns current directory', app, "back.onclick = () => { exitSearchMode(false); renderFiles(); };");

if (/catch \(err\) \{\s*toast\('搜索子文件夹失败：' \+ err\.message, true\);\s*\}/.test(searchCurrentTree)) {
  throw new Error('recursive search failure must not leave file area stuck on loading toast only');
}

console.log('recursive-search-error contract ok');
