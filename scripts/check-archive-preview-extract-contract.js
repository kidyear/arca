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

const renderPreviewActions = sliceFunction(app, 'renderPreviewActions');

assertIncludes('archive preview toolbar reuses archive predicate', renderPreviewActions, 'isExtractableArchive(e)');
assertIncludes('archive preview toolbar has visible extract action', renderPreviewActions, "label: '解压'");
assertIncludes('archive preview toolbar has extract tooltip', renderPreviewActions, "title: '解压到当前目录'");
assertIncludes('archive preview toolbar reuses existing extract flow', renderPreviewActions, 'fn: () => extractArchiveEntry(e)');

console.log('archive-preview-extract contract ok');
