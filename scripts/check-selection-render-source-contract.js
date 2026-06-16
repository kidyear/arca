'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('selection render predicate', app, 'function isSelectedPath(path)');
assertIncludes('selection render predicate uses multi selection as source of truth', app, 'return state.multiSel.size ? state.multiSel.has(path) : state.selected === path;');
assertIncludes('grid item uses selection render predicate', app, "(isSelectedPath(e.path) ? ' selected' : '')");
assertIncludes('list row uses selection render predicate', app, "(isSelectedPath(e.path) ? ' selected' : '')");

if (app.includes("state.multiSel.has(e.path) || state.selected === e.path ? ' selected' : ''")) {
  throw new Error('file item render must not OR multiSel with selected; selected can be a focus anchor after Ctrl deselect');
}

console.log('selection-render-source contract ok');
