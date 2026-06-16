'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const xlsxEntry = fs.readFileSync(path.join(root, 'src-vendor', 'xlsx-entry.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('docx compact class', app, 'preview-body office-body docx-body');
assertIncludes('xlsx compact class', app, 'preview-body office-body xlsx-body');
assertIncludes('docx compact save bar', app, '<div class="editor-bar docx-save-bar">');
assertIncludes('docx system open button', app, 'id="docx-sys"');
assertIncludes('compact office header css', css, '.office-body');
assertIncludes('compact docx editor bar css', css, '.docx-save-bar');
assertIncludes('compact docx host css', css, '.docx-host');

assertIncludes('safe xlsx html helper', xlsxEntry, 'function safeSheetToHtml');
assertIncludes('empty xlsx sheet handling', xlsxEntry, "if (!sheet || !sheet['!ref'])");
assertIncludes('per-sheet fallback handling', xlsxEntry, 'catch (err)');
assertIncludes('empty sheet marker', xlsxEntry, 'isEmpty: true');
assertIncludes('xlsx empty sheet ui', app, 's.isEmpty ?');

console.log('office-preview-density contract ok');
