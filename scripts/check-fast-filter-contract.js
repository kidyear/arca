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

assertIncludes('app', app, 'function searchKey');
assertIncludes('app', app, 'function prepareEntries');
assertIncludes('app', app, 'prepareEntries(data.entries)');

const visibleEntries = sliceFunction(app, 'visibleEntries');
if (visibleEntries.includes('String(e.name || \'\').toLocaleLowerCase')) {
  throw new Error('visibleEntries should filter with cached search keys');
}
assertIncludes('visibleEntries', visibleEntries, 'searchKey(e).includes(q)');

console.log('fast-filter contract ok');
