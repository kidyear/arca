'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('file drop cleanup helper exists', app, 'function clearFileDropHints()');
assertIncludes('file drop cleanup removes area hint', app, "fileArea.classList.remove('drop-in');");
assertIncludes('file drop cleanup removes target hints', app, "fileArea.querySelectorAll('.drop-target').forEach((x) => x.classList.remove('drop-target'));");
assertIncludes('global drop clears stale file hints', app, "window.addEventListener('drop', (e) => { e.preventDefault(); clearFileDropHints(); });");
assertIncludes('global dragend clears stale file hints', app, "window.addEventListener('dragend', clearFileDropHints);");
assertIncludes('window blur clears stale file hints', app, "window.addEventListener('blur', clearFileDropHints);");
assertIncludes('pointerup clears stale file hints', app, "window.addEventListener('pointerup', clearFileDropHints, true);");
assertIncludes('pointercancel clears stale file hints', app, "window.addEventListener('pointercancel', clearFileDropHints, true);");
assertIncludes('mouseup clears stale file hints', app, "window.addEventListener('mouseup', clearFileDropHints, true);");
assertIncludes('visibilitychange clears stale file hints', app, "document.addEventListener('visibilitychange', clearFileDropHints);");
assertIncludes('escape clears stale file hints', app, "if (e.key === 'Escape') clearFileDropHints();");
assertIncludes('file area drop hint exists', css, '#file-area.drop-in');

const dropInMatch = css.match(/#file-area\.drop-in\s*\{[^}]*\}/);
if (!dropInMatch) throw new Error('file area drop-in visual rule is missing');
const dropInRule = dropInMatch[0];
if (/var\(--accent\)/.test(dropInRule) || /var\(--accent-soft\)/.test(dropInRule)) {
  throw new Error('file area drop-in must not use accent selection colors; it reads as a giant selected area');
}
if (/outline:\s*[^;]*(solid|dashed|var\(--accent\)|var\(--text-faint\))/.test(dropInRule)) {
  throw new Error('file area drop-in must not draw a giant outline; it reads as another selection area');
}
if (!/background:\s*color-mix\(in srgb,\s*var\(--text-faint\)\s*6%,\s*transparent\)/.test(dropInRule)) {
  throw new Error('file area drop-in should use only a subtle neutral wash');
}

console.log('file-drop-hint-cleanup contract ok');
