'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ai = fs.readFileSync(path.join(__dirname, '..', 'ai.js'), 'utf8');

function fail(message) {
  throw new Error(message);
}

function sliceFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) fail(`${name} not found`);
  let depth = 0;
  let seen = false;
  let quote = '';
  let regex = false;
  let charClass = false;
  let escape = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (quote) {
      if (ch === quote) quote = '';
      continue;
    }
    if (regex) {
      if (ch === '[') charClass = true;
      else if (ch === ']') charClass = false;
      else if (ch === '/' && !charClass) regex = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '/' && /[=(,:?!|&]\s*$/.test(source.slice(Math.max(start, i - 12), i))) { regex = true; continue; }
    if (ch === '{') { depth += 1; seen = true; }
    else if (ch === '}') {
      depth -= 1;
      if (seen && depth === 0) return source.slice(start, i + 1);
    }
  }
  fail(`${name} did not close`);
}

const code = [
  sliceFunction(ai, 'shouldEnableDocxTools'),
  sliceFunction(ai, 'requiresAgentForLocalDocument'),
  sliceFunction(ai, 'shouldUseDirectChat'),
  '({ shouldEnableDocxTools, shouldUseDirectChat })',
].join('\n');

const { shouldEnableDocxTools, shouldUseDirectChat } = vm.runInNewContext(code);
const deepseek = { key: 'deepseek', baseUrl: 'https://api.deepseek.com/anthropic', apiKey: 'sk-test' };
const freshChat = { id: 'c1', sessionId: null, messages: [] };

const fastQuestions = [
  'Word 和 PDF 有什么区别',
  'word 里怎么设置页眉',
  'docx 是什么格式',
];
for (const text of fastQuestions) {
  if (shouldEnableDocxTools(text, [])) fail(`plain Word/docx question should not enable docx tools: ${text}`);
  if (!shouldUseDirectChat(deepseek, freshChat, text, [])) fail(`plain Word/docx question should use direct fast lane: ${text}`);
}

const reviewIntents = [
  '帮我审阅这个 Word 文档',
  '给合同.docx 加批注',
  '检查一下这个文档的规范',
  '把这个 docx 做修订',
];
for (const text of reviewIntents) {
  if (!shouldEnableDocxTools(text, [])) fail(`review intent should enable docx tools: ${text}`);
  if (shouldUseDirectChat(deepseek, freshChat, text, [])) fail(`review intent must not use direct fast lane: ${text}`);
}

if (!shouldEnableDocxTools('总结一下', ['D:\\财务\\合同.docx'])) fail('docx attachment should enable docx tools');
if (shouldUseDirectChat(deepseek, freshChat, '总结一下', ['D:\\财务\\合同.docx'])) fail('docx attachment must not use direct fast lane');

console.log('ai-word-fastlane-routing contract ok');
