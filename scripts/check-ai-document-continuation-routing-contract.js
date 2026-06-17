'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ai = fs.readFileSync(path.join(__dirname, '..', 'ai.js'), 'utf8');

function fail(message) {
  throw new Error(message);
}

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) fail(`${label} missing: ${needle}`);
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

assertIncludes('local document intent helper exists', ai, 'function requiresAgentForLocalDocument');
assertIncludes('direct routing consults local document helper', ai, 'requiresAgentForLocalDocument(s)');
assertIncludes('agent prior context helper exists', ai, 'function priorChatContextForAgent(chat)');
assertIncludes('agent prior context rejects repeat clarification', ai, '不要再次询问用户“要生成什么文档/什么内容”');
assertIncludes('agent prompt prepends prior context before text', ai, 'priorChatContextForAgent(chat),');

const code = [
  sliceFunction(ai, 'shouldEnableDocxTools'),
  sliceFunction(ai, 'requiresAgentForLocalDocument'),
  sliceFunction(ai, 'shouldUseDirectChat'),
  sliceFunction(ai, 'priorChatContextForAgent'),
  '({ shouldUseDirectChat, requiresAgentForLocalDocument, priorChatContextForAgent })',
].join('\n');

const { shouldUseDirectChat, requiresAgentForLocalDocument, priorChatContextForAgent } = vm.runInNewContext(code);
const deepseek = { key: 'deepseek', baseUrl: 'https://api.deepseek.com/anthropic', apiKey: 'sk-test' };
const emptyChat = { id: 'c1', cwd: 'D:\\财务', sessionId: null, messages: [] };

const documentIntents = [
  '本地生成一个可打印文档',
  '把上面的内容生成文档',
  '整理成一个打印版文档',
  '生成一份 word 可打印版',
  '导出成 docx',
];
for (const text of documentIntents) {
  if (!requiresAgentForLocalDocument(text)) fail(`local document intent not detected: ${text}`);
  if (shouldUseDirectChat(deepseek, emptyChat, text, [])) fail(`local document intent must not use direct fast lane: ${text}`);
}

const plainQuestions = [
  'word 和 pdf 有什么区别',
  '什么是本地化',
  '帮我润色一下这句话',
];
for (const text of plainQuestions) {
  if (requiresAgentForLocalDocument(text)) fail(`plain question should not force agent: ${text}`);
}

const prior = priorChatContextForAgent({
  messages: [
    { role: 'user', text: '请帮我出一份财务实习生考核实操题' },
    { role: 'assistant', text: '下面是考核题：一、应收应付；二、费用报销；三、参考答案与评分表。' },
  ],
});
if (!prior.includes('财务实习生考核实操题')) fail(`prior user content missing: ${prior}`);
if (!prior.includes('参考答案与评分表')) fail(`prior assistant content missing: ${prior}`);
if (!prior.includes('不要再次询问用户')) fail(`prior context must forbid redundant clarification: ${prior}`);

console.log('ai-document-continuation-routing contract ok');
