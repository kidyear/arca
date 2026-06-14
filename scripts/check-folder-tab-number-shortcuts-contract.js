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

assertIncludes('app', app, 'function jumpFolderTab(');
const jumpFolderTab = sliceFunction(app, 'jumpFolderTab');
assertIncludes('jumpFolderTab', jumpFolderTab, 'state.folderTabs.length');
assertIncludes('jumpFolderTab', jumpFolderTab, 'slot === 9');
assertIncludes('jumpFolderTab', jumpFolderTab, 'state.folderTabs.length - 1');
assertIncludes('jumpFolderTab', jumpFolderTab, 'switchFolderTab(tab.id)');

assertIncludes('app', app, 'function handleFolderTabNumberShortcut(');
const shortcut = sliceFunction(app, 'handleFolderTabNumberShortcut');
assertIncludes('handleFolderTabNumberShortcut', shortcut, 'e.ctrlKey');
assertIncludes('handleFolderTabNumberShortcut', shortcut, '!e.shiftKey');
assertIncludes('handleFolderTabNumberShortcut', shortcut, '!e.altKey');
assertIncludes('handleFolderTabNumberShortcut', shortcut, 'e.code');
assertIncludes('handleFolderTabNumberShortcut', shortcut, "key === 'Digit9'");
assertIncludes('handleFolderTabNumberShortcut', shortcut, 'jumpFolderTab');

const bindEvents = sliceFunction(app, 'bindEvents');
assertIncludes('bindEvents', bindEvents, 'handleFolderTabNumberShortcut(e)');
assertIncludes('bindEvents input guard', bindEvents, 'if (inInput) return;');

assertIncludes('docs', docs, 'Ctrl+1..9 标签页跳转');

console.log('folder-tab-number-shortcuts contract ok');
