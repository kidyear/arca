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

assertIncludes('app', app, 'function typeAheadFresh(');
assertIncludes('typeAheadFresh', sliceFunction(app, 'typeAheadFresh'), 'Date.now() - last.ts < 1000');
assertIncludes('app', app, 'function findTypeAheadMatch(');
assertIncludes('findTypeAheadMatch', sliceFunction(app, 'findTypeAheadMatch'), 'startsWith(q)');
assertIncludes('selectByTypeAhead', sliceFunction(app, 'selectByTypeAhead'), 'findTypeAheadMatch(text');
assertIncludes('app', app, 'function trimTypeAhead(');
const trim = sliceFunction(app, 'trimTypeAhead');
assertIncludes('trimTypeAhead', trim, 'typeAheadFresh()');
assertIncludes('trimTypeAhead', trim, 'last.text.slice(0, -1)');
assertIncludes('trimTypeAhead', trim, 'state.typeAhead = { text, ts: Date.now() }');
assertIncludes('trimTypeAhead', trim, 'findTypeAheadMatch(text');
assertIncludes('trimTypeAhead', trim, "state.typeAhead = { text: '', ts: 0 }");
assertIncludes('keydown', app, "e.key === 'Backspace' && trimTypeAhead()");
assertIncludes('docs', docs, 'Backspace 修正文件名快速定位');

console.log('typeahead-backspace contract ok');
