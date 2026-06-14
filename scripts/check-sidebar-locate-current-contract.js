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

assertIncludes('app', app, 'function locateCurrentInSidebar');
const locateCurrentInSidebar = sliceFunction(app, 'locateCurrentInSidebar');
assertIncludes('locateCurrentInSidebar', locateCurrentInSidebar, 'toggleSidebar(false)');
assertIncludes('locateCurrentInSidebar', locateCurrentInSidebar, 'expandSidebarAncestors(state.cwd)');
assertIncludes('locateCurrentInSidebar', locateCurrentInSidebar, 'renderSidebarActive()');
assertIncludes('locateCurrentInSidebar', locateCurrentInSidebar, "querySelector('#sidebar li.active[data-path]')");
assertIncludes('locateCurrentInSidebar', locateCurrentInSidebar, "scrollIntoView({ block: 'nearest' })");

assertIncludes('app', app, 'function expandSidebarAncestors');
const expandSidebarAncestors = sliceFunction(app, 'expandSidebarAncestors');
assertIncludes('expandSidebarAncestors', expandSidebarAncestors, 'pathContains(row.dataset.path, cwd)');
assertIncludes('expandSidebarAncestors', expandSidebarAncestors, 'toggleNavSub(row, row.dataset.path');

const bindEvents = sliceFunction(app, 'bindEvents');
assertIncludes('bindEvents', bindEvents, "mod && e.shiftKey && (e.key === 'e' || e.key === 'E')");
assertIncludes('bindEvents', bindEvents, 'locateCurrentInSidebar(); return;');

assertIncludes('docs', docs, 'Ctrl+Shift+E 侧栏定位当前目录');

console.log('sidebar-locate-current contract ok');
