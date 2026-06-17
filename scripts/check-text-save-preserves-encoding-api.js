'use strict';

const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { decodeTextPreviewBuffer } = require('../lib/text-preview-decoder');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getUrl(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) reject(new Error(`${url} -> ${res.statusCode}: ${data.slice(0, 200)}`));
        else resolve(data);
      });
    });
    req.on('error', reject);
    req.setTimeout(1000, () => req.destroy(new Error(`${url} timeout`)));
  });
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const raw = Buffer.from(JSON.stringify(body));
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': raw.length,
      },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) reject(new Error(`${url} -> ${res.statusCode}: ${data.slice(0, 200)}`));
        else resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.setTimeout(1000, () => req.destroy(new Error(`${url} timeout`)));
    req.end(raw);
  });
}

async function waitForHttp(url, label) {
  for (let i = 0; i < 60; i += 1) {
    try {
      return await getUrl(url);
    } catch (_) {
      await wait(100);
    }
  }
  throw new Error(`${label} did not become ready`);
}

async function waitForExit(child, timeoutMs = 2000) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function rmRetry(target) {
  for (let i = 0; i < 8; i += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      return;
    } catch (err) {
      if (i === 7) throw err;
      await wait(150);
    }
  }
}

async function main() {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'arca-text-save-gbk-'));
  const file = path.join(tmp, '重要说明.txt');
  // "重要说明\n该参考设计版本" encoded as GBK/CP936 bytes.
  const gbkBytes = Buffer.from([
    0xD6, 0xD8, 0xD2, 0xAA, 0xCB, 0xB5, 0xC3, 0xF7, 0x0A,
    0xB8, 0xC3, 0xB2, 0xCE, 0xBF, 0xBC, 0xC9, 0xE8, 0xBC, 0xC6, 0xB0, 0xE6, 0xB1, 0xBE,
  ]);
  await fsp.writeFile(file, gbkBytes);

  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true,
  });
  try {
    await waitForHttp(`http://127.0.0.1:${APP_PORT}/`, 'Arca server');
    const readRaw = await getUrl(`http://127.0.0.1:${APP_PORT}/api/read?path=${encodeURIComponent(file)}`);
    const readData = JSON.parse(readRaw);
    assert.strictEqual(readData.encoding, 'gbk');
    const nextContent = `${readData.content}\n新增一行：继续保持 ANSI 编码`;
    const write = await postJson(`http://127.0.0.1:${APP_PORT}/api/write`, {
      path: file,
      content: nextContent,
      expectedMtime: readData.mtime,
      encoding: readData.encoding,
    });
    assert.strictEqual(write.ok, true, JSON.stringify(write));
    assert.strictEqual(write.encoding, 'gbk', JSON.stringify(write));
    const raw = await fsp.readFile(file);
    const decoded = decodeTextPreviewBuffer(raw);
    assert.strictEqual(decoded.encoding, 'gbk', `saved file should stay gbk, got ${decoded.encoding}`);
    assert(decoded.text.includes('新增一行'), decoded.text);
    assert(!decoded.text.includes('\uFFFD'), 'saved GBK text should not contain replacement characters');
    console.log('text-save-preserves-encoding-api ok');
    console.log(JSON.stringify({ file, encoding: decoded.encoding, text: decoded.text }, null, 2));
  } finally {
    server.kill();
    await waitForExit(server);
    await rmRetry(tmp);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
