'use strict';

const { TextDecoder } = require('util');

const utf8Strict = new TextDecoder('utf-8', { fatal: true });
const utf8Loose = new TextDecoder('utf-8');
let gbkDecoder = null;
try { gbkDecoder = new TextDecoder('gbk'); } catch { /* Node without full ICU */ }

function decodeTextPreviewBuffer(buf) {
  const input = Buffer.isBuffer(buf) ? buf : Buffer.from(buf || []);
  if (input.length >= 3 && input[0] === 0xEF && input[1] === 0xBB && input[2] === 0xBF) {
    return { text: utf8Loose.decode(input.subarray(3)), encoding: 'utf-8' };
  }
  if (input.length >= 2 && input[0] === 0xFF && input[1] === 0xFE) {
    return { text: new TextDecoder('utf-16le').decode(input.subarray(2)), encoding: 'utf-16le' };
  }
  if (input.length >= 2 && input[0] === 0xFE && input[1] === 0xFF) {
    return { text: new TextDecoder('utf-16be').decode(input.subarray(2)), encoding: 'utf-16be' };
  }
  try {
    return { text: utf8Strict.decode(input), encoding: 'utf-8' };
  } catch {
    if (gbkDecoder) return { text: gbkDecoder.decode(input), encoding: 'gbk' };
    return { text: utf8Loose.decode(input), encoding: 'utf-8' };
  }
}

module.exports = { decodeTextPreviewBuffer };
