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

assertIncludes('app', app, 'function activeFolderTab');
assertIncludes('app', app, 'function syncNavButtons');
assertIncludes('app', app, 'function syncActiveFolderTabNavigation');
assertIncludes('app', app, 'function restoreFolderTabNavigation');

const ensureFolderTabForCwd = sliceFunction(app, 'ensureFolderTabForCwd');
assertIncludes('ensureFolderTabForCwd', ensureFolderTabForCwd, 'history: []');
assertIncludes('ensureFolderTabForCwd', ensureFolderTabForCwd, 'forwardHistory: []');
assertIncludes('ensureFolderTabForCwd', ensureFolderTabForCwd, 'syncActiveFolderTabNavigation()');

const syncActive = sliceFunction(app, 'syncActiveFolderTabNavigation');
assertIncludes('syncActiveFolderTabNavigation', syncActive, 'activeFolderTab()');
assertIncludes('syncActiveFolderTabNavigation', syncActive, 'tab.history = [...state.history]');
assertIncludes('syncActiveFolderTabNavigation', syncActive, 'tab.forwardHistory = [...state.forwardHistory]');

const restore = sliceFunction(app, 'restoreFolderTabNavigation');
assertIncludes('restoreFolderTabNavigation', restore, 'state.history = [...(tab.history || [])]');
assertIncludes('restoreFolderTabNavigation', restore, 'state.forwardHistory = [...(tab.forwardHistory || [])]');

const newFolderTab = sliceFunction(app, 'newFolderTab');
assertIncludes('newFolderTab', newFolderTab, 'history: []');
assertIncludes('newFolderTab', newFolderTab, 'forwardHistory: []');

const switchFolderTab = sliceFunction(app, 'switchFolderTab');
assertIncludes('switchFolderTab', switchFolderTab, 'syncActiveFolderTabNavigation()');
assertIncludes('switchFolderTab', switchFolderTab, 'restoreFolderTabNavigation(tab)');
assertIncludes('switchFolderTab', switchFolderTab, 'syncNavButtons()');

const render = sliceFunction(app, 'render');
assertIncludes('render', render, 'syncNavButtons()');

const closeFolderTab = sliceFunction(app, 'closeFolderTab');
assertIncludes('closeFolderTab', closeFolderTab, 'history: [...(closed.history || [])]');
assertIncludes('closeFolderTab', closeFolderTab, 'forwardHistory: [...(closed.forwardHistory || [])]');

const restoreClosedFolderTab = sliceFunction(app, 'restoreClosedFolderTab');
assertIncludes('restoreClosedFolderTab', restoreClosedFolderTab, 'history: [...(closed.history || [])]');
assertIncludes('restoreClosedFolderTab', restoreClosedFolderTab, 'forwardHistory: [...(closed.forwardHistory || [])]');
assertIncludes('restoreClosedFolderTab', restoreClosedFolderTab, 'restoreFolderTabNavigation(tab)');

assertIncludes('docs', docs, '标签页独立后退/前进历史');

console.log('folder-tab-history contract ok');
