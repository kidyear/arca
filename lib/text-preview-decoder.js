'use strict';

const { TextDecoder } = require('util');
const iconv = require('iconv-lite');

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

function encodeTextPreviewBuffer(text, encoding) {
  const value = String(text || '');
  const enc = String(encoding || 'utf-8').toLowerCase();
  if (enc === 'gbk' || enc === 'gb18030' || enc === 'ansi') return iconv.encode(value, 'gbk');
  if (enc === 'utf-16le') return Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(value, 'utf16le')]);
  if (enc === 'utf-16be') {
    const le = Buffer.from(value, 'utf16le');
    for (let i = 0; i + 1 < le.length; i += 2) {
      const a = le[i];
      le[i] = le[i + 1];
      le[i + 1] = a;
    }
    return Buffer.concat([Buffer.from([0xFE, 0xFF]), le]);
  }
  return Buffer.from(value, 'utf8');
}

module.exports = { decodeTextPreviewBuffer, encodeTextPreviewBuffer };
