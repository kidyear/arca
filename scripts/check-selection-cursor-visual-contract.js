'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('grid cursor excludes selected state', css, '.grid .item.cursor:not(.selected)');
assertIncludes('list cursor excludes selected state', css, '.list .row.cursor:not(.selected)');
assertIncludes('non-selected grid cursor is visually silent', css, '.grid .item.cursor:not(.selected) { outline: none; box-shadow: none; }');
assertIncludes('non-selected list cursor is visually silent', css, '.list .row.cursor:not(.selected) { outline: none; box-shadow: none; }');
assertIncludes('selected cursor keeps selected visual', css, '.grid .item.selected.cursor');
assertIncludes('single selection syncs cursor', app, 'state.cursor = state.visible.findIndex((e) => e.path === path);');
assertIncludes('single selection repaints cursor immediately', app, 'highlightCursor();');

if (/\.grid \.item\.cursor(?::not\(\.selected\))?\s*\{[^}]*var\(--accent\)[^}]*\}/.test(css)) {
  throw new Error('grid cursor must not look like accent selection');
}
if (/\.list \.row\.cursor(?::not\(\.selected\))?\s*\{[^}]*var\(--accent\)[^}]*\}/.test(css)) {
  throw new Error('list cursor must not look like accent selection');
}

console.log('selection-cursor-visual contract ok');
