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

assertIncludes('app', app, 'function copyExternalFilesToDir');
const copyExternalFilesToDir = sliceFunction(app, 'copyExternalFilesToDir');
assertIncludes('copyExternalFilesToDir', copyExternalFilesToDir, 'window.fanboxDrop.pathForFile');
assertIncludes('copyExternalFilesToDir', copyExternalFilesToDir, "/api/copy-in");
assertIncludes('copyExternalFilesToDir', copyExternalFilesToDir, "/api/write-binary");
assertIncludes('copyExternalFilesToDir', copyExternalFilesToDir, 'pushUndo({ type: \'copy\'');
assertIncludes('copyExternalFilesToDir', copyExternalFilesToDir, 'selectVisiblePaths');

const renderBreadcrumb = sliceFunction(app, 'renderBreadcrumb');
assertIncludes('renderBreadcrumb', renderBreadcrumb, "t.includes('Files')");
assertIncludes('renderBreadcrumb', renderBreadcrumb, "copyExternalFilesToDir([...(ev.dataTransfer.files || [])], c.path");
assertIncludes('renderBreadcrumb', renderBreadcrumb, 'reveal: true');

const bindSidebarDropTarget = sliceFunction(app, 'bindSidebarDropTarget');
assertIncludes('bindSidebarDropTarget', bindSidebarDropTarget, "copyExternalFilesToDir([...(ev.dataTransfer.files || [])], dirPath");

assertIncludes('docs', docs, '面包屑接收系统文件拖入');

console.log('breadcrumb-external-drop contract ok');
