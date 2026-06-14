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

assertIncludes('state', app, 'selectionStats:');
assertIncludes('app', app, 'function computeSelectionStats');

const paintSelection = sliceFunction(app, 'paintSelection');
assertIncludes('paintSelection', paintSelection, 'state.selectionStats = computeSelectionStats');

const renderStatusbar = sliceFunction(app, 'renderStatusbar');
assertIncludes('renderStatusbar', renderStatusbar, 'state.selectionStats');
if (renderStatusbar.includes('selEntries()') || renderStatusbar.includes('.filter((e) => e.isDir)') || renderStatusbar.includes('.reduce(')) {
  throw new Error('renderStatusbar should read cached selectionStats instead of recomputing selected entries');
}

console.log('selection-stats contract ok');
