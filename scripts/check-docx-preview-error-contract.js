'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('docx preview friendly error helper exists', app, 'function friendlyDocxPreviewError(err)');
assertIncludes('docx preview catch uses friendly helper', app, 'friendlyDocxPreviewError(err)');
assertIncludes('docx preview hides raw JS parser errors', app, '文档结构异常，建议用系统应用打开');

const start = app.indexOf('async function openDocxPreview');
const end = app.indexOf('\nasync function openXlsxPreview', start);
if (start < 0 || end < 0) throw new Error('openDocxPreview slice missing');
const body = app.slice(start, end);
if (/Word 预览失败：\$\{escapeHtml\(err\.message\)\}/.test(body)) {
  throw new Error('docx preview must not expose raw err.message to users');
}

console.log('docx-preview-error contract ok');
