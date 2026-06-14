'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('app', app, 'function focusFileFilter()');
assertIncludes('keydown', app, "!inInput && e.key === 'F3'");
assertIncludes('keydown', app, 'focusFileFilter(); return;');
assertIncludes('keydown', app, "['f', 'F', 'e', 'E'].includes(e.key)");
assertIncludes('docs', docs, 'Ctrl+F / Ctrl+E / F3 当前目录搜索');

console.log('search-shortcuts contract ok');
