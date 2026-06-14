'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(__dirname, '..', 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

assertIncludes('app', app, 'function setFileView(');
const setView = sliceFunction(app, 'setFileView');
assertIncludes('setFileView', setView, "['grid', 'list']");
assertIncludes('setFileView', setView, "localStorage.setItem('fb_view'");
assertIncludes('setFileView', setView, "b.dataset.view === state.view");
assertIncludes('setFileView', setView, 'updateGridSizeVisibility()');
assertIncludes('setFileView', setView, 'renderFiles()');

assertIncludes('app', app, 'function handleExplorerViewShortcut(');
const shortcut = sliceFunction(app, 'handleExplorerViewShortcut');
assertIncludes('handleExplorerViewShortcut', shortcut, 'e.ctrlKey');
assertIncludes('handleExplorerViewShortcut', shortcut, 'e.shiftKey');
assertIncludes('handleExplorerViewShortcut', shortcut, 'e.code');
assertIncludes('handleExplorerViewShortcut', shortcut, "key === 'Digit1'");
assertIncludes('handleExplorerViewShortcut', shortcut, "e.key === '1'");
assertIncludes('handleExplorerViewShortcut', shortcut, "setGridSize('lg'");
assertIncludes('handleExplorerViewShortcut', shortcut, "key === 'Digit2'");
assertIncludes('handleExplorerViewShortcut', shortcut, "e.key === '2'");
assertIncludes('handleExplorerViewShortcut', shortcut, "setGridSize('md'");
assertIncludes('handleExplorerViewShortcut', shortcut, "key === 'Digit3'");
assertIncludes('handleExplorerViewShortcut', shortcut, "e.key === '3'");
assertIncludes('handleExplorerViewShortcut', shortcut, "setGridSize('sm'");
assertIncludes('handleExplorerViewShortcut', shortcut, "key === 'Digit4'");
assertIncludes('handleExplorerViewShortcut', shortcut, "e.key === '4'");
assertIncludes('handleExplorerViewShortcut', shortcut, "key === 'Digit6'");
assertIncludes('handleExplorerViewShortcut', shortcut, "e.key === '6'");
assertIncludes('handleExplorerViewShortcut', shortcut, "key === 'Digit5'");
assertIncludes('handleExplorerViewShortcut', shortcut, "e.key === '5'");
assertIncludes('handleExplorerViewShortcut', shortcut, "setFileView('list'");
assertIncludes('keydown', app, 'handleExplorerViewShortcut(e)');
assertIncludes('view buttons', app, 'b.onclick = () => setFileView(b.dataset.view)');
assertIncludes('docs', docs, 'Ctrl+Shift+数字视图切换');

console.log('explorer-view-shortcuts contract ok');
