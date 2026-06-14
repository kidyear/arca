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

assertIncludes('app', app, 'const KIND_LABELS =');

const kindLabel = sliceFunction(app, 'kindLabel');
assertIncludes('kindLabel', kindLabel, 'KIND_LABELS[e.kind]');
if (kindLabel.includes('const map =') || kindLabel.includes('{ text:')) {
  throw new Error('kindLabel should use module-level KIND_LABELS instead of rebuilding a map');
}

console.log('kind-label contract ok');
