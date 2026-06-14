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

assertIncludes('app', app, 'function folderTabDropKind(');
const folderTabDropKind = sliceFunction(app, 'folderTabDropKind');
assertIncludes('folderTabDropKind', folderTabDropKind, "application/x-arca-folder-tab");
assertIncludes('folderTabDropKind', folderTabDropKind, 'isInternalDrag(dt)');
assertIncludes('folderTabDropKind', folderTabDropKind, "dt.types.includes('Files')");

const renderFolderTabs = sliceFunction(app, 'renderFolderTabs');
assertIncludes('renderFolderTabs dragover', renderFolderTabs, 'folderTabDropKind(ev.dataTransfer)');
assertIncludes('renderFolderTabs dragover', renderFolderTabs, "button.classList.add('drop-target')");
assertIncludes('renderFolderTabs dragleave', renderFolderTabs, 'button.ondragleave');
assertIncludes('renderFolderTabs drop target', renderFolderTabs, 'await switchFolderTab(tab.id)');
assertIncludes('renderFolderTabs internal drop', renderFolderTabs, 'dropInternalPathsToDir(internalDragPaths(ev.dataTransfer), tab.path');
assertIncludes('renderFolderTabs external drop', renderFolderTabs, 'copyExternalFilesToDir(ev.dataTransfer.files, tab.path');
assertIncludes('renderFolderTabs reveal', renderFolderTabs, '{ reveal: true }');

assertIncludes('css', css, '.folder-tab.drop-target');
assertIncludes('docs', docs, '标签页拖放目标');

console.log('folder-tab-drop contract ok');
