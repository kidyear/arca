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

const renderFolderTabs = sliceFunction(app, 'renderFolderTabs');
assertIncludes('renderFolderTabs', renderFolderTabs, 'button.oncontextmenu');
assertIncludes('renderFolderTabs', renderFolderTabs, 'showFolderTabMenu(ev, tab)');

assertIncludes('app', app, 'function rememberClosedFolderTab');
const rememberClosedFolderTab = sliceFunction(app, 'rememberClosedFolderTab');
assertIncludes('rememberClosedFolderTab', rememberClosedFolderTab, 'state.closedFolderTabs.push');
assertIncludes('rememberClosedFolderTab', rememberClosedFolderTab, 'history: [...(tab.history || [])]');

assertIncludes('app', app, 'function closeOtherFolderTabs');
const closeOtherFolderTabs = sliceFunction(app, 'closeOtherFolderTabs');
assertIncludes('closeOtherFolderTabs', closeOtherFolderTabs, 'syncActiveFolderTabNavigation()');
assertIncludes('closeOtherFolderTabs', closeOtherFolderTabs, 'state.folderTabs.filter');
assertIncludes('closeOtherFolderTabs', closeOtherFolderTabs, 'rememberClosedFolderTab');
assertIncludes('closeOtherFolderTabs', closeOtherFolderTabs, 'await switchFolderTab(id)');

assertIncludes('app', app, 'function closeFolderTabsToRight');
const closeFolderTabsToRight = sliceFunction(app, 'closeFolderTabsToRight');
assertIncludes('closeFolderTabsToRight', closeFolderTabsToRight, 'state.folderTabs.splice(idx + 1)');
assertIncludes('closeFolderTabsToRight', closeFolderTabsToRight, 'rememberClosedFolderTab');
assertIncludes('closeFolderTabsToRight', closeFolderTabsToRight, 'await switchFolderTab');

assertIncludes('app', app, 'function showFolderTabMenu');
const showFolderTabMenu = sliceFunction(app, 'showFolderTabMenu');
assertIncludes('showFolderTabMenu', showFolderTabMenu, 'ev.preventDefault()');
assertIncludes('showFolderTabMenu', showFolderTabMenu, "label: '关闭标签页'");
assertIncludes('showFolderTabMenu', showFolderTabMenu, "label: '关闭其他标签页'");
assertIncludes('showFolderTabMenu', showFolderTabMenu, "label: '关闭右侧标签页'");
assertIncludes('showFolderTabMenu', showFolderTabMenu, "label: '复制路径'");
assertIncludes('showFolderTabMenu', showFolderTabMenu, 'copyPath(tab.path)');
assertIncludes('showFolderTabMenu', showFolderTabMenu, 'popupMenu(ev');

assertIncludes('docs', docs, '标签页右键菜单');

console.log('folder-tab-context-menu contract ok');
