'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(__dirname, '..', 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

assertIncludes('app', app, 'function syncPreviewAfterRefresh');
const syncPreviewAfterRefresh = sliceFunction(app, 'syncPreviewAfterRefresh');
assertIncludes('syncPreviewAfterRefresh', syncPreviewAfterRefresh, 'previewVisible()');
assertIncludes('syncPreviewAfterRefresh', syncPreviewAfterRefresh, 'selectedPreviewEntry()');
assertIncludes('syncPreviewAfterRefresh', syncPreviewAfterRefresh, "if (e.isDir) { previewPlaceholder(e");
assertIncludes('syncPreviewAfterRefresh', syncPreviewAfterRefresh, 'openPreview(e)');
assertIncludes('syncPreviewAfterRefresh', syncPreviewAfterRefresh, '未选择文件');
assertIncludes('syncPreviewAfterRefresh', syncPreviewAfterRefresh, 'renderPreviewFoot(null)');
if (syncPreviewAfterRefresh.includes('previewEntry(e)') || syncPreviewAfterRefresh.includes('recordRecent(')) {
  throw new Error('syncPreviewAfterRefresh should not update recent-open history');
}

const refresh = sliceFunction(app, 'refresh');
assertIncludes('refresh', refresh, 'restoreSelectionAfterRefresh(oldSelected, oldMultiSel, oldAnchor, oldCursor)');
assertIncludes('refresh', refresh, 'syncPreviewAfterRefresh();');

assertIncludes('docs', docs, '刷新同步预览窗格且不污染最近记录');

console.log('refresh-preview contract ok');
