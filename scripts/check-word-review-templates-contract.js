'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const templates = JSON.parse(fs.readFileSync(path.join(root, 'templates.default.json'), 'utf8'));
const worklist = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function templateById(id) {
  return (templates.templates || []).find((t) => t.id === id);
}

const contractReview = templateById('contract-review');
assert(contractReview, 'missing contract-review template');
assert(contractReview.dept === '采购', 'contract-review should be visible under 采购');
assert(contractReview.needsFiles === true, 'contract-review must require a Word attachment');
assert(/docx 工具/.test(contractReview.prompt), 'contract-review must route the user toward docx tools');
assert(/review 一次性提交/.test(contractReview.prompt), 'contract-review should use batch review to avoid repeated approvals');
assert(/不要直接改写正文/.test(contractReview.prompt), 'contract-review should preserve Word review semantics');

const standardCheck = templateById('doc-standard-check');
assert(standardCheck, 'missing doc-standard-check template');
assert(standardCheck.dept === '文控', 'doc-standard-check should be visible under 文控');
assert(standardCheck.needsFiles === true, 'doc-standard-check must require a Word attachment');
assert(/docx 工具/.test(standardCheck.prompt), 'doc-standard-check must route the user toward docx tools');
assert(/只打批注/.test(standardCheck.prompt), 'doc-standard-check should avoid direct body edits');
assert(/需人工核对/.test(standardCheck.prompt), 'doc-standard-check should flag visual-format limits for humans');

assert(worklist.includes('- [x] Word 审阅延伸'), 'worklist should mark Word review template extension as complete');
assert(!worklist.includes('- [ ] Word 审阅延伸'), 'worklist must not leave completed Word review templates as pending');

console.log('word-review-templates contract ok');
