'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const xlsxEntry = fs.readFileSync(path.join(root, 'src-vendor', 'xlsx-entry.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('xlsx preview friendly error helper exists', app, 'function friendlyXlsxPreviewError(err)');
assertIncludes('xlsx preview catch uses friendly helper', app, 'friendlyXlsxPreviewError(err)');
assertIncludes('xlsx preview hides raw JS TypeError', app, '表格结构异常，建议用系统应用打开');
assertIncludes('xlsx vendor friendly error helper exists', xlsxEntry, 'function friendlyXlsxError(err)');
assertIncludes('xlsx vendor parse wraps workbook read', xlsxEntry, 'throw new Error(friendlyXlsxError(err));');
assertIncludes('xlsx vendor sheet fallback hides raw JS TypeError', xlsxEntry, 'friendlyXlsxError(err)');

const previewCatch = app.slice(app.indexOf('async function openXlsxPreview'), app.indexOf('\nasync function openPreview', app.indexOf('async function openXlsxPreview')));
if (/表格解析失败：\$\{escapeHtml\(err\.message\)\}/.test(previewCatch)) {
  throw new Error('xlsx preview must not expose raw err.message to users');
}

console.log('xlsx-preview-error contract ok');
