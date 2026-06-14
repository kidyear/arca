'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
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

assertIncludes('html', html, 'id="folder-tabs"');
assertIncludes('css', css, '.folder-tabs');
assertIncludes('css', css, '.folder-tab.active');

assertIncludes('state', app, 'folderTabs: []');
assertIncludes('state', app, 'activeFolderTab: null');

assertIncludes('app', app, 'function ensureFolderTabForCwd');
assertIncludes('app', app, 'function renderFolderTabs');
assertIncludes('app', app, 'function newFolderTab');
assertIncludes('app', app, 'function switchFolderTab');
assertIncludes('app', app, 'function closeFolderTab');
assertIncludes('app', app, 'function stepFolderTab');

const navigate = sliceFunction(app, 'navigate');
assertIncludes('navigate', navigate, 'ensureFolderTabForCwd(data.path)');
assertIncludes('navigate', navigate, 'renderFolderTabs()');

const renderFolderTabs = sliceFunction(app, 'renderFolderTabs');
assertIncludes('renderFolderTabs', renderFolderTabs, "$('#folder-tabs')");
assertIncludes('renderFolderTabs', renderFolderTabs, "button.className = 'folder-tab");
assertIncludes('renderFolderTabs', renderFolderTabs, "close.className = 'folder-tab-close'");
assertIncludes('renderFolderTabs', renderFolderTabs, 'switchFolderTab(tab.id)');
assertIncludes('renderFolderTabs', renderFolderTabs, 'closeFolderTab(tab.id)');

const newFolderTab = sliceFunction(app, 'newFolderTab');
assertIncludes('newFolderTab', newFolderTab, 'state.folderTabs.push');
assertIncludes('newFolderTab', newFolderTab, 'state.activeFolderTab = tab.id');
assertIncludes('newFolderTab', newFolderTab, 'await navigate(path, false)');

const closeFolderTab = sliceFunction(app, 'closeFolderTab');
assertIncludes('closeFolderTab', closeFolderTab, 'state.folderTabs.splice');
assertIncludes('closeFolderTab', closeFolderTab, 'closeCurrentWindow()');
assertIncludes('closeFolderTab', closeFolderTab, 'await switchFolderTab');

const stepFolderTab = sliceFunction(app, 'stepFolderTab');
assertIncludes('stepFolderTab', stepFolderTab, 'direction');
assertIncludes('stepFolderTab', stepFolderTab, 'switchFolderTab');

const bindEvents = sliceFunction(app, 'bindEvents');
assertIncludes('bindEvents', bindEvents, "mod && !e.shiftKey && !e.altKey && (e.key === 't' || e.key === 'T')");
assertIncludes('bindEvents', bindEvents, 'newFolderTab(); return;');
assertIncludes('bindEvents', bindEvents, "mod && e.key === 'Tab'");
assertIncludes('bindEvents', bindEvents, 'stepFolderTab(e.shiftKey ? -1 : 1); return;');
assertIncludes('bindEvents', bindEvents, 'closeFolderTab(state.activeFolderTab); return;');

assertIncludes('docs', docs, '文件夹标签页');

console.log('folder-tabs contract ok');
