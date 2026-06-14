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

assertIncludes('state', app, 'domByPath: new Map()');
assertIncludes('app', app, 'function registerEntryElement');

const renderFiles = sliceFunction(app, 'renderFiles');
assertIncludes('renderFiles', renderFiles, 'state.domByPath = new Map()');

const bindItem = sliceFunction(app, 'bindItem');
assertIncludes('bindItem', bindItem, 'registerEntryElement(el, e.path)');

const entryElByPath = sliceFunction(app, 'entryElByPath');
assertIncludes('entryElByPath', entryElByPath, 'state.domByPath.get(path)');
assertIncludes('entryElByPath', entryElByPath, 'isConnected');

console.log('dom-index contract ok');
