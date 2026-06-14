'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function assertSliceNotIncludes(label, text, fromNeedle, toNeedle, forbidden) {
  const from = text.indexOf(fromNeedle);
  if (from < 0) throw new Error(`${label} missing start: ${fromNeedle}`);
  const to = text.indexOf(toNeedle, from + fromNeedle.length);
  if (to < 0) throw new Error(`${label} missing end: ${toNeedle}`);
  const slice = text.slice(from, to);
  if (slice.includes(forbidden)) throw new Error(`${label} must not include ${forbidden}`);
}

assertIncludes('app', app, 'function isVirtualLocation');
assertIncludes('app', app, "return state.virtualMode === 'this-pc'");
assertIncludes('app', app, 'function thisPcBlankContextItems');
assertIncludes('app', app, "if (isVirtualLocation()) return thisPcBlankContextItems()");
assertIncludes('app', app, "if (isVirtualLocation() && !dstDir) { toast('请先打开一个磁盘或文件夹再粘贴', true); return; }");
assertIncludes('app', app, "if (isVirtualLocation()) { toast('此电脑视图不能新建项目', true); return; }");
assertIncludes('app', app, "if (isVirtualLocation()) return null;");
assertSliceNotIncludes('thisPcBlankContextItems', app, 'function thisPcBlankContextItems', 'function blankContextItems', '新建文件夹');
assertSliceNotIncludes('thisPcBlankContextItems', app, 'function thisPcBlankContextItems', 'function blankContextItems', '粘贴');
assertSliceNotIncludes('thisPcBlankContextItems', app, 'function thisPcBlankContextItems', 'function blankContextItems', '当前文件夹');
assertSliceNotIncludes('thisPcBlankContextItems', app, 'function thisPcBlankContextItems', 'function blankContextItems', 'AI 整理');
assertIncludes('docs', docs, '此电脑空白菜单保护');

console.log('this-pc-blank-actions contract ok');
