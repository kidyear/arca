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

assertIncludes('app', app, 'function bindSidebarDropTarget');
const bindSidebarDropTarget = sliceFunction(app, 'bindSidebarDropTarget');
assertIncludes('bindSidebarDropTarget', bindSidebarDropTarget, "addEventListener('dragover'");
assertIncludes('bindSidebarDropTarget', bindSidebarDropTarget, "addEventListener('drop'");
assertIncludes('bindSidebarDropTarget', bindSidebarDropTarget, 'isInternalDrag(ev.dataTransfer)');
assertIncludes('bindSidebarDropTarget', bindSidebarDropTarget, 'dropInternalPathsToDir(internalDragPaths(ev.dataTransfer), dirPath');
assertIncludes('bindSidebarDropTarget', bindSidebarDropTarget, "t.includes('Files')");
assertIncludes('bindSidebarDropTarget', bindSidebarDropTarget, "copyExternalFilesToDir([...(ev.dataTransfer.files || [])], dirPath");
assertIncludes('bindSidebarDropTarget', bindSidebarDropTarget, "li.classList.add('drop-target')");

const navDirLi = sliceFunction(app, 'navDirLi');
assertIncludes('navDirLi', navDirLi, 'bindSidebarDropTarget(li, p)');
assertIncludes('docs', docs, '侧栏目录拖放目标');

console.log('sidebar-drop contract ok');
