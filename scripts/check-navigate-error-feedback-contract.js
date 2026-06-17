'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const marker = `function ${name}(`;
  let start = text.indexOf(marker);
  if (start < 0) {
    const asyncMarker = `async function ${name}(`;
    start = text.indexOf(asyncMarker);
  }
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  const nextAsync = text.indexOf('\nasync function ', start + 1);
  const ends = [next, nextAsync].filter((n) => n >= 0);
  const end = ends.length ? Math.min(...ends) : undefined;
  return text.slice(start, end);
}

const navigate = sliceFunction(app, 'navigate');
assertIncludes('navigate reports concrete catch reason', navigate, "toast('打开失败：' + friendlyNavigateError(e), true);");

assertIncludes('app has friendly navigate error helper', app, 'function friendlyNavigateError(err)');
const helper = sliceFunction(app, 'friendlyNavigateError');
assertIncludes('friendlyNavigateError uses generic friendly text', helper, 'friendlyErrorText(err)');
assertIncludes('app has generic friendly error helper', app, 'function friendlyErrorText(err');
assertIncludes('friendlyNavigateError maps network failure', helper, '文件服务暂时没有响应');
assertIncludes('friendlyNavigateError maps permission failure', helper, '没有权限访问这个位置');
assertIncludes('friendlyNavigateError maps missing path', helper, '这个位置已不存在');

assertIncludes('docs records navigate error feedback', docs, '目录打开失败原因');

console.log('navigate-error-feedback contract ok');
