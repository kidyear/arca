'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
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

const renderFolderTabs = sliceFunction(app, 'renderFolderTabs');
assertIncludes('renderFolderTabs', renderFolderTabs, "add.className = 'folder-tab-new'");
assertIncludes('renderFolderTabs', renderFolderTabs, "add.title = '新建标签页'");
assertIncludes('renderFolderTabs', renderFolderTabs, "add.setAttribute('aria-label', '新建标签页')");
assertIncludes('renderFolderTabs', renderFolderTabs, 'add.onclick =');
assertIncludes('renderFolderTabs', renderFolderTabs, 'newFolderTab()');
assertIncludes('renderFolderTabs', renderFolderTabs, 'host.ondblclick');
assertIncludes('renderFolderTabs', renderFolderTabs, 'ev.target === host');

assertIncludes('css', css, '.folder-tab-new');
assertIncludes('css', css, '.folder-tab-new:hover');
assertIncludes('docs', docs, '标签栏新建按钮');

console.log('folder-tab-new-button contract ok');
