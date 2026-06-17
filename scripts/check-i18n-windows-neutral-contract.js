'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const i18n = fs.readFileSync(path.join(root, 'public', 'i18n-dict.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes(
  'local data line avoids Mac-only wording',
  i18n,
  "'本地运行 · 数据不出本机': 'Runs locally · data never leaves this device'"
);
assertIncludes(
  'skills inventory avoids Mac-only wording',
  i18n,
  "'本机 Claude Code / Codex 的全部 skills：谁在干活、谁在吃灰、谁在静默失效': 'All Claude Code / Codex skills on this computer: which ones pull their weight, which gather dust, which silently fail'"
);
assertIncludes(
  'global search scope label avoids Mac-only wording',
  i18n,
  "'⤢ 全机': '⤢ This computer'"
);
assertIncludes(
  'global search scope detail avoids Mac-only wording',
  i18n,
  "'全机（主目录及以下）': 'This computer (home folder and below)'"
);

const forbidden = [
  "'本地运行 · 数据不出本机': 'Runs locally · data never leaves this Mac'",
  "'⤢ 全机': '⤢ This Mac'",
  "'全机（主目录及以下）': 'This Mac (home folder and below)'",
  'skills on this Mac',
];
for (const needle of forbidden) {
  if (i18n.includes(needle)) throw new Error(`Windows-neutral i18n should not contain: ${needle}`);
}

console.log('i18n-windows-neutral contract ok');
