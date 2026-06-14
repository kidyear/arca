'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

function assertNoBroadQuery(fnName, needle) {
  const body = sliceFunction(app, fnName);
  if (body.includes(needle)) throw new Error(`${fnName} should not broad-query ${needle} during force repaint`);
}

assertNoBroadQuery('paintSelection', '.item.selected, .row.selected');
assertNoBroadQuery('paintCutMarks', '.item.cutting, .row.cutting');

console.log('force-paint contract ok');
