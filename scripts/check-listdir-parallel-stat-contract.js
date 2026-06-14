'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function assertNotIncludes(label, text, needle) {
  if (text.includes(needle)) throw new Error(`${label} must not include: ${needle}`);
}

function sliceAsyncFunction(text, name) {
  const start = text.indexOf(`async function ${name}(`);
  if (start < 0) throw new Error(`missing async function ${name}`);
  const next = text.indexOf('\nasync function ', start + 1);
  const nextPlain = text.indexOf('\nfunction ', start + 1);
  const ends = [next, nextPlain].filter((i) => i >= 0);
  return text.slice(start, ends.length ? Math.min(...ends) : undefined);
}

const listDir = sliceAsyncFunction(server, 'listDir');

assertIncludes('server', server, 'const LISTDIR_STAT_CONCURRENCY');
assertIncludes('server', server, 'async function mapLimit');
assertIncludes('listDir', listDir, 'await mapLimit(dirents');
assertIncludes('listDir', listDir, 'LISTDIR_STAT_CONCURRENCY');
assertNotIncludes('listDir', listDir, 'for (const d of dirents)');
assertIncludes('docs', docs, '大目录 listDir 并发 stat');

console.log('listdir-parallel-stat contract ok');
