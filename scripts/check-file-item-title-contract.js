'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

const titleHelper = sliceFunction(app, 'fileItemTitle');
const gridItem = sliceFunction(app, 'gridItem');
const listRow = sliceFunction(app, 'listRow');

assertIncludes('title helper includes visible filename', titleHelper, 'lines.push(e.name);');
assertIncludes('title helper includes full path', titleHelper, 'lines.push(e.path);');
assertIncludes('title helper formats changed file set', titleHelper, 'const changedFiles = Array.from(changed.files || [])');
assertIncludes('title helper keeps changed context label', titleHelper, "lines.unshift('刚变更：', ...changedFiles");
if (titleHelper.includes("...[changed.files]")) {
  throw new Error('title helper must not spread [changed.files]; Set would render as [object Set]');
}
assertIncludes('title helper includes size when available', titleHelper, 'fmtSize(e.size)');
assertIncludes('grid items use unified title helper', gridItem, 'el.title = fileItemTitle(e, chg);');
assertIncludes('list rows use unified title helper', listRow, 'el.title = fileItemTitle(e, chgR);');

console.log('file-item-title contract ok');
