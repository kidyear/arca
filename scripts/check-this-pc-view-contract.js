'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('index', index, 'id="this-pc-entry"');
assertIncludes('index', index, 'data-virtual="this-pc"');
assertIncludes('app', app, "virtualMode: null");
assertIncludes('app', app, 'function driveToEntry');
assertIncludes('app', app, 'function openThisPcView');
assertIncludes('app', app, "state.virtualMode = 'this-pc'");
assertIncludes('app', app, "state.breadcrumb = [{ name: '此电脑', path: 'this-pc' }]");
assertIncludes('app', app, "state.entries = prepareEntries(state.drives.map(driveToEntry))");
assertIncludes('app', app, "if (state.virtualMode === 'this-pc')");
assertIncludes('app', app, "$('#this-pc-entry')?.addEventListener('click', openThisPcView)");
assertIncludes('app', app, "if (e.isDrive) navigate(e.path)");
assertIncludes('docs', docs, '此电脑主视图');

console.log('this-pc-view contract ok');
