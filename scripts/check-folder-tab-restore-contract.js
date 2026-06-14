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

assertIncludes('state', app, 'closedFolderTabs: []');

const renderFolderTabs = sliceFunction(app, 'renderFolderTabs');
assertIncludes('renderFolderTabs', renderFolderTabs, 'button.onmousedown');
assertIncludes('renderFolderTabs', renderFolderTabs, 'button.onauxclick');
assertIncludes('renderFolderTabs', renderFolderTabs, 'ev.button === 1');
assertIncludes('renderFolderTabs', renderFolderTabs, 'closeFolderTab(tab.id)');

assertIncludes('app', app, 'function restoreClosedFolderTab');
const restoreClosedFolderTab = sliceFunction(app, 'restoreClosedFolderTab');
assertIncludes('restoreClosedFolderTab', restoreClosedFolderTab, 'state.closedFolderTabs.pop()');
assertIncludes('restoreClosedFolderTab', restoreClosedFolderTab, 'state.folderTabs.push');
assertIncludes('restoreClosedFolderTab', restoreClosedFolderTab, 'state.activeFolderTab = tab.id');
assertIncludes('restoreClosedFolderTab', restoreClosedFolderTab, 'await navigate(tab.path, false)');

const closeFolderTab = sliceFunction(app, 'closeFolderTab');
assertIncludes('closeFolderTab', closeFolderTab, 'const closed = state.folderTabs[idx]');
assertIncludes('closeFolderTab', closeFolderTab, 'state.closedFolderTabs.push');

const bindEvents = sliceFunction(app, 'bindEvents');
assertIncludes('bindEvents', bindEvents, "mod && e.shiftKey && !e.altKey && (e.key === 't' || e.key === 'T')");
assertIncludes('bindEvents', bindEvents, 'restoreClosedFolderTab(); return;');

assertIncludes('docs', docs, 'Ctrl+Shift+T 恢复关闭标签');

console.log('folder-tab-restore contract ok');
