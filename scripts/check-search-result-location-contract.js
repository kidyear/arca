'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(src, name) {
  const start = src.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = src.indexOf('\nfunction ', start + 1);
  return src.slice(start, next < 0 ? src.length : next);
}

const revealEntryInCurrentApp = sliceFunction(app, 'revealEntryInCurrentApp');
const openRecent = sliceFunction(app, 'openRecent');
assertIncludes('openRecent opens parent directory', openRecent, 'await navigate(dirOf(p))');
assertIncludes('openRecent reports navigation failure', openRecent, "toast('打开最近文件失败：' + friendlyOpenLocationError(err), true);");
assertIncludes('openRecent awaits recent folder target navigation', openRecent, 'await navigate(p);');
assertIncludes('openRecent reports recent folder target failure', openRecent, "toast('打开最近文件夹失败：' + friendlyOpenLocationError(err), true);");
if (/navigate\(dirOf\(p\)\)\.catch\(\(\) => \{\}\)/.test(openRecent)) {
  throw new Error('openRecent must not swallow parent directory navigation errors');
}
if (/if \(e\.isDir\) \{\s*navigate\(p\);\s*return;\s*\}/.test(openRecent)) {
  throw new Error('openRecent must await and report recent folder navigation errors');
}

assertIncludes('revealEntryInCurrentApp', revealEntryInCurrentApp, 'const targetDir = dirOf(e.path)');
assertIncludes('revealEntryInCurrentApp', revealEntryInCurrentApp, 'await navigate(targetDir)');
assertIncludes('revealEntryInCurrentApp reports navigation failure', revealEntryInCurrentApp, "toast('打开所在位置失败：' + friendlyOpenLocationError(err), true);");
assertIncludes('revealEntryInCurrentApp', revealEntryInCurrentApp, 'selectVisiblePaths([e.path])');
assertIncludes('revealEntryInCurrentApp', revealEntryInCurrentApp, '已打开所在位置');
assertIncludes('friendly location error helper exists', app, 'function friendlyOpenLocationError(err)');

if (/navigate\(targetDir\)\.catch\(\(\) => \{\}\)/.test(revealEntryInCurrentApp)) {
  throw new Error('revealEntryInCurrentApp must not swallow parent directory navigation errors');
}

const showContextMenu = sliceFunction(app, 'showContextMenu');
assertIncludes('showContextMenu', showContextMenu, 'state.searchMode || state.recentMode');
assertIncludes('showContextMenu', showContextMenu, '打开所在位置');
assertIncludes('showContextMenu', showContextMenu, 'revealEntryInCurrentApp(e)');

assertIncludes('docs', docs, '搜索结果打开所在位置');

console.log('search-result-location contract ok');
