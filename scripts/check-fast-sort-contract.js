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

assertIncludes('app', app, 'const NAME_COLLATOR = new Intl.Collator');
assertIncludes('app', app, 'function compareName');
assertIncludes('app', app, 'function compareKind');

const visibleEntries = sliceFunction(app, 'visibleEntries');
if (visibleEntries.includes('localeCompare')) {
  throw new Error('visibleEntries should use cached collators instead of localeCompare');
}

console.log('fast-sort contract ok');
