'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const match = app.match(/const CHAT_PATH_RE = (\/.+?\/gi);/);
if (!match) throw new Error('CHAT_PATH_RE declaration not found');

const CHAT_PATH_RE = vm.runInNewContext(match[1]);

function assertMatches(label, text, expected) {
  CHAT_PATH_RE.lastIndex = 0;
  const hits = [...text.matchAll(CHAT_PATH_RE)].map((m) => m[0]);
  if (!hits.includes(expected)) {
    throw new Error(`${label} did not match ${expected}; got ${JSON.stringify(hits)}`);
  }
}

function assertNotMatches(label, text, unexpected) {
  CHAT_PATH_RE.lastIndex = 0;
  const hits = [...text.matchAll(CHAT_PATH_RE)].map((m) => m[0]);
  if (hits.includes(unexpected)) {
    throw new Error(`${label} should not match ${unexpected}; got ${JSON.stringify(hits)}`);
  }
}

assertMatches('legacy Word document path', '已生成 D:\\财务\\实习考核\\试题卷.doc', 'D:\\财务\\实习考核\\试题卷.doc');
assertMatches('legacy Excel workbook path', '请核对 D:\\财务\\发票清单.xls', 'D:\\财务\\发票清单.xls');
assertMatches('PowerPoint path', '输出在 D:\\培训\\新人课件.ppt', 'D:\\培训\\新人课件.ppt');
assertMatches('archive rar path', '压缩包 D:\\项目\\资料包.rar', 'D:\\项目\\资料包.rar');
assertMatches('archive 7z path', '压缩包 D:\\项目\\资料包.7z', 'D:\\项目\\资料包.7z');
assertMatches('tar gz path', '备份 D:\\项目\\release.tar.gz', 'D:\\项目\\release.tar.gz');
assertMatches('json report path', '结果 D:\\项目\\summary.json', 'D:\\项目\\summary.json');
assertMatches('UNC archive path', '共享盘 \\\\nas\\文控\\归档.zip', '\\\\nas\\文控\\归档.zip');
assertMatches('file url office path', '链接 file:///D:/财务/发票清单.xls', 'file:///D:/财务/发票清单.xls');
assertMatches('absolute Windows folder path', '输出目录：D:\\新人\\财务\\结果', 'D:\\新人\\财务\\结果');
assertMatches('UNC folder path', '共享目录 \\\\nas\\文控\\发布清单', '\\\\nas\\文控\\发布清单');
assertMatches('file URL folder path', '目录 file://nas01/Shared%20Docs/QA', 'file://nas01/Shared%20Docs/QA');
assertMatches('Windows folder path with spaces', '输出目录：D:\\New Project\\Output Folder，请打开检查', 'D:\\New Project\\Output Folder');
assertMatches('UNC folder path with spaces', '共享目录 \\\\nas01\\Shared Docs\\QA Reports，已完成', '\\\\nas01\\Shared Docs\\QA Reports');
assertMatches('quoted Windows folder path with spaces', '输出目录："D:\\New Project\\Output Folder"', 'D:\\New Project\\Output Folder');
assertMatches('quoted UNC folder path with spaces', '共享目录 "\\\\nas01\\Shared Docs\\QA Reports"', '\\\\nas01\\Shared Docs\\QA Reports');
assertMatches('inline code absolute path still matches', '`D:\\财务\\报告.docx`', 'D:\\财务\\报告.docx');
assertMatches('inline code relative path still matches', '`./报告.docx`', './报告.docx');
assertMatches('dot slash relative Word path', '已保存到 ./财务实习生考核.docx', './财务实习生考核.docx');
assertMatches('dot backslash relative Excel path', '已保存到 .\\输出\\发票清单.xlsx', '.\\输出\\发票清单.xlsx');
assertMatches('relative subdirectory report path', '输出在 结果/summary.json', '结果/summary.json');
assertNotMatches('bare filename stays plain text', '参考 report.docx 这个名字即可', 'report.docx');
assertNotMatches('https document url stays plain link text', '参考 https://example.com/report.docx', 'https://example.com/report.docx');
assertNotMatches('markdown https document url stays plain link text', '[下载报告](https://example.com/report.docx)', 'https://example.com/report.docx');
assertNotMatches('drive root alone stays plain text', '进入 D:\\ 后再操作', 'D:\\');

console.log('chat-path-extensions contract ok');
