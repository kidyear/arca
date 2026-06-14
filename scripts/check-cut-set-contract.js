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

assertIncludes('state', app, 'fileClipSet: new Set()');
assertIncludes('app', app, 'function setFileClip');

const isCutPath = sliceFunction(app, 'isCutPath');
assertIncludes('isCutPath', isCutPath, 'state.fileClipSet.has(path)');
if (isCutPath.includes('.includes(')) throw new Error('isCutPath should use Set.has, not Array.includes');

const paintCutMarks = sliceFunction(app, 'paintCutMarks');
assertIncludes('paintCutMarks', paintCutMarks, 'new Set(cutPaths())');

console.log('cut-set contract ok');
