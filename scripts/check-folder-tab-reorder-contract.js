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

assertIncludes('app', app, 'function moveFolderTab');
const moveFolderTab = sliceFunction(app, 'moveFolderTab');
assertIncludes('moveFolderTab', moveFolderTab, 'fromId');
assertIncludes('moveFolderTab', moveFolderTab, 'toId');
assertIncludes('moveFolderTab', moveFolderTab, 'state.folderTabs.splice');
assertIncludes('moveFolderTab', moveFolderTab, 'renderFolderTabs()');

const renderFolderTabs = sliceFunction(app, 'renderFolderTabs');
assertIncludes('renderFolderTabs', renderFolderTabs, 'button.draggable = true');
assertIncludes('renderFolderTabs', renderFolderTabs, 'button.ondragstart');
assertIncludes('renderFolderTabs', renderFolderTabs, "application/x-arca-folder-tab");
assertIncludes('renderFolderTabs', renderFolderTabs, 'button.ondragover');
assertIncludes('renderFolderTabs', renderFolderTabs, 'button.ondrop');
assertIncludes('renderFolderTabs', renderFolderTabs, 'moveFolderTab(draggedId, tab.id)');

assertIncludes('docs', docs, '标签页拖拽重排');

console.log('folder-tab-reorder contract ok');
