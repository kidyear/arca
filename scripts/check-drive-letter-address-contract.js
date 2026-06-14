'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  const nextAsync = text.indexOf('\nasync function ', start + 1);
  const ends = [next, nextAsync].filter((i) => i >= 0);
  return text.slice(start, ends.length ? Math.min(...ends) : undefined);
}

const resolvePath = sliceFunction(server, 'resolvePath');
assertIncludes('resolvePath', resolvePath, "input = input.replace(/^([A-Za-z]):$/, '$1:\\\\')");
assertIncludes('docs', docs, '地址栏裸盘符');

const context = {
  HOME: 'C:\\Users\\tester',
  PLATFORM: 'win32',
  URL,
  path: path.win32,
  process: { env: {} },
};
vm.createContext(context);
vm.runInContext(resolvePath, context);

if (context.resolvePath('D:') !== 'D:\\') {
  throw new Error(`D: should resolve to D:\\, got ${context.resolvePath('D:')}`);
}
if (context.resolvePath('"E:"') !== 'E:\\') {
  throw new Error(`quoted E: should resolve to E:\\, got ${context.resolvePath('"E:"')}`);
}

console.log('drive-letter-address contract ok');
