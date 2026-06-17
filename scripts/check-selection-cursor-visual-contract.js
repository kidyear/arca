'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`${name} function missing`);
  let depth = 0;
  let seen = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') { depth += 1; seen = true; }
    if (ch === '}') {
      depth -= 1;
      if (seen && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} function did not close`);
}

const applySelection = sliceFunction(app, 'applySelection');
const selectVisiblePaths = sliceFunction(app, 'selectVisiblePaths');

assertIncludes('grid cursor excludes selected state', css, '.grid .item.cursor:not(.selected)');
assertIncludes('list cursor excludes selected state', css, '.list .row.cursor:not(.selected)');
assertIncludes('non-selected grid cursor is visually silent', css, '.grid .item.cursor:not(.selected) { border-color: transparent; outline: none; box-shadow: none; }');
assertIncludes('non-selected list cursor is visually silent', css, '.list .row.cursor:not(.selected) { border-color: transparent; outline: none; box-shadow: none; }');
assertIncludes('selected cursor keeps selected visual', css, '.grid .item.selected.cursor');
assertIncludes('file area focus is not drawn as accent selection', css, '#file-area:focus-visible { outline: 1px dashed var(--text-faint); outline-offset: -3px; }');
assertIncludes('file area drop-in does not draw a giant selection-like outline', css, '#file-area.drop-in { outline: none; background: color-mix(in srgb, var(--text-faint) 6%, transparent); }');
assertIncludes('non-selected focus ring is separated from selection', css, '.grid .item:focus-visible:not(.selected), .list .row:focus-visible:not(.selected)');
assertIncludes('non-selected focus cannot keep a red selection border', css, '.grid .item:focus:not(.selected), .list .row:focus:not(.selected)');
assertIncludes('non-selected focus border stays transparent', css, 'border-color: transparent;');
assertIncludes('non-selected focus is visually silent in grid/list', css, '.grid .item:focus-visible:not(.selected), .list .row:focus-visible:not(.selected) { outline: none; box-shadow: none; }');
assertIncludes('non-selected hover/focus visual guard exists', css, '.grid .item:not(.selected):not(.drop-target):hover,');
assertIncludes('non-selected hover/focus cannot draw accent border', css, '.list .row:not(.selected):not(.drop-target):focus-visible {');
assertIncludes('non-selected hover/focus guard keeps border transparent', css, 'border-color: transparent; outline: none; box-shadow: none;');
assertIncludes('drop target state is visually distinct from selection', css, '.item.drop-target:not(.selected), .row.drop-target:not(.selected)');
assertIncludes('drop target uses neutral dashed affordance instead of selected card border', css, 'outline: 2px dashed var(--text-faint);');
assertIncludes('changed marker is forced badge-only when not selected', css, '.item.changed:not(.selected), .row.changed:not(.selected) { background: transparent !important; border-color: transparent !important; outline: none !important; box-shadow: none !important; }');
assertIncludes('drop target does not reuse selected background', css, 'background: transparent; background-color: transparent; border-color: transparent;');
assertIncludes('drop target disables background fade from hover', css, 'background-color: transparent;');
assertIncludes('single selection syncs cursor', app, 'state.cursor = state.visible.findIndex((e) => e.path === path);');
assertIncludes('single selection repaints cursor immediately', app, 'highlightCursor();');
assertIncludes('file item can receive programmatic focus', app, 'el.tabIndex = -1;');
assertIncludes('selection focus helper exists', app, 'function focusEntry(path)');
assertIncludes('selection focus uses preventScroll', app, 'el.focus({ preventScroll: true });');
assertIncludes('selection cursor sync helper exists', app, 'function syncSelectionCursor()');
assertIncludes('render syncs selected path before painting', app, 'syncSelectionCursor();');
assertIncludes('force selection repaint clears stale selected DOM classes', app, "area.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));");
assertIncludes('single click selection uses force repaint to clear stale DOM classes', applySelection, 'paintSelection(true);');
assertIncludes('programmatic selection uses force repaint to clear stale DOM classes', selectVisiblePaths, 'paintSelection(true);');
assertIncludes('single selection syncs DOM focus', app, 'focusEntry(path);');
assertIncludes('visible path selection syncs DOM focus', app, 'focusEntry(state.selected);');
assertIncludes('keyboard selection syncs DOM focus', app, 'focusEntry(e.path);');
assertIncludes('late non-selected visual guard exists', css, '焦点/悬停/cursor 不能伪装成第二个选中文件');
assertIncludes('late non-selected visual guard covers grid cursor', css, '.grid .item:not(.selected):not(.drop-target):is(:hover, :focus, :focus-visible, .cursor)');
assertIncludes('late non-selected visual guard covers list cursor', css, '.list .row:not(.selected):not(.drop-target):is(:hover, :focus, :focus-visible, .cursor)');

if (/\.grid \.item\.cursor(?::not\(\.selected\))?\s*\{[^}]*var\(--accent\)[^}]*\}/.test(css)) {
  throw new Error('grid cursor must not look like accent selection');
}
if (/\.list \.row\.cursor(?::not\(\.selected\))?\s*\{[^}]*var\(--accent\)[^}]*\}/.test(css)) {
  throw new Error('list cursor must not look like accent selection');
}
if (/\.grid \.item:focus-visible:not\(\.selected\),\s*\.list \.row:focus-visible:not\(\.selected\)\s*\{[^}]*var\(--accent\)[^}]*\}/.test(css)) {
  throw new Error('non-selected focus ring must not use accent selection color');
}
if (/\.grid \.item:focus-visible:not\(\.selected\),\s*\.list \.row:focus-visible:not\(\.selected\)\s*\{[^}]*outline:\s*1px dashed[^}]*\}/.test(css)) {
  throw new Error('non-selected focus ring must not look like another active file');
}
if (/\.item\.drop-target,\s*\.row\.drop-target\s*\{[^}]*background:\s*var\(--accent-soft\)[^}]*\}/.test(css)) {
  throw new Error('non-selected drop target must not reuse the selected background');
}
if (/\.item\.drop-target,\s*\.row\.drop-target\s*\{[^}]*outline:\s*2px solid var\(--accent\)[^}]*\}/.test(css)) {
  throw new Error('non-selected drop target must not look like selected red outline');
}
const dropTargetRule = css.slice(css.indexOf('.item.drop-target:not(.selected), .row.drop-target:not(.selected)'));
const dropTargetBlock = dropTargetRule.slice(0, dropTargetRule.indexOf('}') + 1);
if (/var\(--accent\)/.test(dropTargetBlock)) {
  throw new Error('non-selected drop target must not use accent color; it reads as a second selected item');
}

console.log('selection-cursor-visual contract ok');
