'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

assertIncludes('index file-area', html, 'id="file-area" tabindex="0"');
assertIncludes('index preview-body', html, 'id="preview-body" tabindex="0"');

assertIncludes('app', app, 'function focusFileArea(');
assertIncludes('app', app, 'function focusPreviewPane(');
assertIncludes('app', app, 'function focusDockPanel(');
assertIncludes('app', app, 'function currentFocusZone(');
assertIncludes('app', app, 'function cycleFileManagerFocus(');

assertIncludes('focusFileArea', sliceFunction(app, 'focusFileArea'), "$('#file-area').focus()");
assertIncludes('focusPreviewPane', sliceFunction(app, 'focusPreviewPane'), "$('#preview-body').focus()");
assertIncludes('focusDockPanel', sliceFunction(app, 'focusDockPanel'), "$('#chat-input').focus()");
assertIncludes('focusDockPanel', sliceFunction(app, 'focusDockPanel'), 's.xterm.focus()');
assertIncludes('currentFocusZone', sliceFunction(app, 'currentFocusZone'), "active.closest('#terminal-panel')");
assertIncludes('cycleFileManagerFocus', sliceFunction(app, 'cycleFileManagerFocus'), "['address', 'files', 'search']");
assertIncludes('cycleFileManagerFocus', sliceFunction(app, 'cycleFileManagerFocus'), "zones.push('preview')");
assertIncludes('cycleFileManagerFocus', sliceFunction(app, 'cycleFileManagerFocus'), "zones.push('dock')");
assertIncludes('keydown', app, "e.key === 'F6'");
assertIncludes('keydown', app, 'cycleFileManagerFocus(e.shiftKey)');
assertIncludes('style focus file-area', css, '#file-area:focus-visible');
assertIncludes('style focus preview-body', css, '.preview-body:focus-visible');

console.log('focus-cycle contract ok');
