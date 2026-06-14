'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
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

assertIncludes('app', app, 'function openFolderInNewTab');
const openFolderInNewTab = sliceFunction(app, 'openFolderInNewTab');
assertIncludes('openFolderInNewTab', openFolderInNewTab, 'if (!path) return;');
assertIncludes('openFolderInNewTab', openFolderInNewTab, 'await newFolderTab(path)');

const showContextMenu = sliceFunction(app, 'showContextMenu');
assertIncludes('showContextMenu', showContextMenu, "label: '在新标签页打开'");
assertIncludes('showContextMenu', showContextMenu, 'openFolderInNewTab(e.path)');
assertIncludes('showContextMenu', showContextMenu, "label: '在新窗口打开'");

const blankContextItems = sliceFunction(app, 'blankContextItems');
assertIncludes('blankContextItems', blankContextItems, "label: '在新标签页打开当前文件夹'");
assertIncludes('blankContextItems', blankContextItems, 'openFolderInNewTab(state.cwd)');
assertIncludes('blankContextItems', blankContextItems, "label: '在新窗口打开当前文件夹'");

assertIncludes('docs', docs, '文件夹右键在新标签页打开');

console.log('open-folder-tab contract ok');
