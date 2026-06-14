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

const bindItem = sliceFunction(app, 'bindItem');
assertIncludes('bindItem', bindItem, "addEventListener('auxclick'");
assertIncludes('bindItem', bindItem, 'ev.button === 1');
assertIncludes('bindItem', bindItem, 'e.isDir');
assertIncludes('bindItem', bindItem, 'openNewWindow(e.path)');

console.log('middle-click-window contract ok');
