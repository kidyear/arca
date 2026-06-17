'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`${name} function missing`);
  let depth = 0;
  let seen = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') { depth += 1; seen = true; }
    if (ch === '}') {
      depth -= 1;
      if (seen && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} function did not close`);
}

const helper = sliceFunction(app, 'friendlyErrorText');
const friendlyErrorText = Function(`${helper}; return friendlyErrorText;`)();

const cases = [
  [null, '未知错误'],
  [undefined, '未知错误'],
  ['', '未知错误'],
  ['  access denied  ', 'access denied'],
  [new Error('network down'), 'network down'],
  [{ error: 'shortcut denied' }, 'shortcut denied'],
  [{ message: 'bridge crashed' }, 'bridge crashed'],
  [{ reason: 'clipboard locked' }, 'clipboard locked'],
  [{}, '未知错误'],
  [{ a: 1 }, '未知错误'],
];

for (const [input, expected] of cases) {
  const actual = friendlyErrorText(input);
  if (actual !== expected) {
    throw new Error(`friendlyErrorText(${JSON.stringify(input)}) -> ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

if (friendlyErrorText({}, '读取失败') !== '读取失败') {
  throw new Error('friendlyErrorText should honor custom fallback text');
}

[
  "toast('打开快捷方式失败：' + friendlyErrorText(err), true);",
  "toast('打开目标位置失败：' + friendlyErrorText(err), true);",
  "const value = '读取失败：' + friendlyErrorText(err);",
  "toast('打开最新输出失败：' + friendlyErrorText(err), true)",
  "toast('打开变更文件失败：' + friendlyErrorText(err), true)",
  "error: friendlyErrorText(err)",
].forEach((needle) => assertIncludes('friendly error usage', app, needle));

[
  "toast('打开快捷方式失败：' + (err.message || err), true)",
  "toast('打开目标位置失败：' + (err.message || err), true)",
  "const value = '读取失败：' + (err.message || err)",
  "toast('打开最新输出失败：' + (err.message || err), true)",
  "toast('打开变更文件失败：' + (err.message || err), true)",
].forEach((bad) => {
  if (app.includes(bad)) throw new Error(`raw object-prone error text remains: ${bad}`);
});

console.log('friendly-error-text contract ok');
