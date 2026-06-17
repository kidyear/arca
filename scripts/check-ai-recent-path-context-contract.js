'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ai = fs.readFileSync(path.join(__dirname, '..', 'ai.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('recent path extractor exists', ai, 'function recentPathContextForAgent(chat)');
assertIncludes('recent path extractor starts from chat messages', ai, 'const msgs = Array.isArray(chat.messages) ? chat.messages : [];');
assertIncludes('recent path extractor uses attachment paths', ai, 'collectPaths(m.attachments);');
assertIncludes('recent path extractor uses tool detail paths', ai, 'collectPaths(m.detail);');
assertIncludes('recent path extractor uses assistant text paths', ai, 'collectPaths(m.text);');
assertIncludes('recent path extractor de-duplicates paths', ai, 'if (seen.has(key)) return;');
assertIncludes('recent path context labels intent', ai, '最近相关路径');
assertIncludes('recent path context tells agent to resolve references', ai, '用户说“刚生成的文件/这个文件/上面的文件/打开它/修改它”时，优先从这些路径里选择');
assertIncludes('agent prompt prepends recent path context', ai, 'recentPathContextForAgent(chat),');

function sliceFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`${name} not found`);
  let depth = 0;
  let seen = false;
  let quote = '';
  let regex = false;
  let charClass = false;
  let escape = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    const prev = source[i - 1] || '';
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
    if (ch === '/' && /[=(,:?]\s*$/.test(source.slice(Math.max(start, i - 8), i))) { regex = true; continue; }
    if (ch === '{') { depth += 1; seen = true; }
    else if (ch === '}') {
      depth -= 1;
      if (seen && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} did not close`);
}

const recentPathContextForAgent = vm.runInNewContext(`(${sliceFunction(ai, 'recentPathContextForAgent')})`);
const context = recentPathContextForAgent({
  cwd: 'D:\\财务',
  messages: [
    { role: 'user', text: '请处理这个附件', attachments: ['D:\\财务\\原始发票.xlsx'] },
    { role: 'tool', name: 'Write', detail: '参考答案.docx' },
    { role: 'tool', name: 'Write', detail: 'D:\\财务\\输出\\报销汇总.docx' },
    { role: 'assistant', text: '已生成 D:\\财务\\输出\\报销汇总.docx，可直接打印。' },
    { role: 'assistant', text: '共享副本在 "\\\\nas01\\Finance Docs\\报销汇总.docx"。' },
    { role: 'assistant', text: '台账在 D:\\财务\\输出\\付款计划.xlsx 已生成，请检查。' },
    { role: 'assistant', text: '输出目录 D:\\财务\\输出结果 已生成，请检查。' },
  ],
});

if (!context.includes('D:\\财务\\原始发票.xlsx')) throw new Error(`attachment path missing from recent context: ${context}`);
if (!context.includes('D:\\财务\\输出\\报销汇总.docx')) throw new Error(`tool/assistant path missing from recent context: ${context}`);
if (!context.includes('D:\\财务\\输出\\付款计划.xlsx')) throw new Error(`xlsx path missing from recent context: ${context}`);
if (context.includes('D:\\财务\\输出\\付款计划.xlsx 已生成')) throw new Error(`recent context swallowed prose after xlsx path: ${context}`);
if (!context.includes('D:\\财务\\输出结果')) throw new Error(`directory path missing from recent context: ${context}`);
if (context.includes('D:\\财务\\输出结果 已生成')) throw new Error(`recent context swallowed prose after directory path: ${context}`);
if (!context.includes('D:\\财务\\参考答案.docx')) throw new Error(`relative tool path was not resolved from cwd: ${context}`);
if (!context.includes('\\\\nas01\\Finance Docs\\报销汇总.docx')) throw new Error(`UNC path missing from recent context: ${context}`);
if ((context.match(/D:\\财务\\输出\\报销汇总\.docx/g) || []).length !== 1) throw new Error(`recent context should de-duplicate paths: ${context}`);
if (!context.includes('不要重新追问文件是哪一个')) throw new Error(`recent context must guide reference resolution: ${context}`);

console.log('ai-recent-path-context contract ok');
