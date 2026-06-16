'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const { decodeTextPreviewBuffer } = require('../lib/text-preview-decoder');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

const gbkBytes = Buffer.from([
  0xB8, 0xC3, 0xB2, 0xCE, 0xBF, 0xBC, 0xC9, 0xE8, 0xBC, 0xC6, 0xB0, 0xE6, 0xB1, 0xBE,
]);
const gbk = decodeTextPreviewBuffer(gbkBytes);
assert.strictEqual(gbk.encoding, 'gbk');
assert.strictEqual(gbk.text, '该参考设计版本');
assert(!gbk.text.includes('\uFFFD'), 'GBK text should not contain replacement characters');

const utf8 = decodeTextPreviewBuffer(Buffer.from('该参考设计版本', 'utf8'));
assert.strictEqual(utf8.encoding, 'utf-8');
assert.strictEqual(utf8.text, '该参考设计版本');

assert(server.includes("const { decodeTextPreviewBuffer } = require('./lib/text-preview-decoder');"));
assert(server.includes('decodeTextPreviewBuffer(buf.subarray(0, end))'));
assert(server.includes('decodeTextPreviewBuffer(await fsp.readFile(file))'));
assert(app.includes("data.encoding ? `<span>${escapeHtml(data.encoding.toUpperCase())}</span>` : ''"));
assert(docs.includes('文本预览 GBK/ANSI 自动识别'));

console.log('text-preview-encoding contract ok');
