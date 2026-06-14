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

const renderBreadcrumb = sliceFunction(app, 'renderBreadcrumb');
assertIncludes('renderBreadcrumb', renderBreadcrumb, 'showBreadcrumbContextMenu(ev, c)');
assertIncludes('renderBreadcrumb', renderBreadcrumb, "el.oncontextmenu");

assertIncludes('app', app, 'function breadcrumbContextItems');
const breadcrumbContextItems = sliceFunction(app, 'breadcrumbContextItems');
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, "label: '打开'");
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, 'navigate(crumb.path)');
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, "label: '在新标签页打开'");
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, 'openFolderInNewTab(crumb.path)');
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, "label: '在新窗口打开'");
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, 'openNewWindow(crumb.path)');
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, "label: '复制路径'");
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, 'copyPaths([crumb.path])');
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, "label: '在终端打开'");
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, 'term.openInDir(crumb.path)');
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, "label: '属性'");
assertIncludes('breadcrumbContextItems', breadcrumbContextItems, 'folderEntryForPathFresh(crumb.path)');

const showBreadcrumbContextMenu = sliceFunction(app, 'showBreadcrumbContextMenu');
assertIncludes('showBreadcrumbContextMenu', showBreadcrumbContextMenu, 'popupMenu(ev, breadcrumbContextItems(crumb, ev.shiftKey))');

assertIncludes('docs', docs, '面包屑段右键菜单');

console.log('breadcrumb-context-menu contract ok');
