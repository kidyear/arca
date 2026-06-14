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

assertIncludes('app', app, 'function fileExtension');
assertIncludes('app', app, 'function renameChangesExtension');
assertIncludes('app', app, 'skipExtWarning');
assertIncludes('app', app, '文件扩展名');

const commitRename = sliceFunction(app, 'commitRename');
assertIncludes('commitRename', commitRename, 'renameChangesExtension(e, name)');
assertIncludes('commitRename', commitRename, 'confirmDialog');
assertIncludes('commitRename', commitRename, 'if (!ok) return null');

console.log('rename-extension contract ok');
