'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const templates = JSON.parse(fs.readFileSync(path.join(root, 'templates.default.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const departments = templates.departments || [];
assert(departments.includes('财务'), 'templates.default.json must include 财务 department');

const exam = (templates.templates || []).find((tpl) => tpl.id === 'finance-intern-exam');
assert(exam, 'finance-intern-exam template is missing');
assert(exam.dept === '财务', 'finance-intern-exam must belong to 财务');
assert(exam.needsFiles === false, 'finance-intern-exam should work without attachments');
assert(/实习.*考核|考核.*实习/.test(exam.title + exam.desc), 'finance-intern-exam title/desc should expose intern exam use case');
assert((exam.fields || []).some((f) => f.key === 'scenario' && !f.optional), 'finance-intern-exam needs a required scenario field');
assert((exam.fields || []).some((f) => f.key === 'coverage'), 'finance-intern-exam should allow coverage customization');
assert(/应收应付/.test(exam.prompt), 'finance-intern-exam prompt must cover receivables/payables');
assert(/费用报销/.test(exam.prompt), 'finance-intern-exam prompt must cover expense reimbursement');
assert(/试题卷/.test(exam.prompt), 'finance-intern-exam must generate an exam paper');
assert(/参考答案/.test(exam.prompt), 'finance-intern-exam must generate an answer key');
assert(/得分汇总表/.test(exam.prompt), 'finance-intern-exam must include scoring summary table');
assert(/当前目录/.test(exam.prompt), 'finance-intern-exam must save outputs in current directory');

console.log('finance-templates contract ok');
