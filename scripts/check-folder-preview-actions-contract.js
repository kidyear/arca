'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function sliceFunction(name) {
  const start = app.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`${name} missing`);
  const next = app.indexOf('\nfunction ', start + 1);
  return app.slice(start, next < 0 ? app.length : next);
}

const placeholder = sliceFunction('previewPlaceholder');
if (!placeholder.includes('renderPreviewActions(e);')) {
  throw new Error('folder/placeholder preview must keep the preview action bar available');
}

const renderActions = sliceFunction('renderPreviewActions');
if (!renderActions.includes('if (e.isDir)')) {
  throw new Error('renderPreviewActions must have a directory-specific action set');
}

if (!renderActions.includes('fn: () => navigate(e.path)')) {
  throw new Error('directory preview primary action should enter the folder in Arca');
}

if (!renderActions.includes('fn: () => propertiesPanel([e])')) {
  throw new Error('directory preview should expose properties without requiring Alt+Enter');
}

const dirBranchStart = renderActions.indexOf('if (e.isDir)');
const dirBranchEnd = renderActions.indexOf('const clip = window.fanboxClipboard', dirBranchStart);
const dirBranch = renderActions.slice(dirBranchStart, dirBranchEnd < 0 ? renderActions.length : dirBranchEnd);
if (dirBranch.includes("openWith(e.path, 'editor')")) {
  throw new Error('directory preview actions must not include file-only editor open');
}

console.log('folder-preview-actions contract ok');
