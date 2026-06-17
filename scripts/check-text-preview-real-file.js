'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APP_PORT = 4567;
const REAL_FILE = process.env.ARCA_TEXT_REAL_FILE || 'D:\\prooject\\S1073\\V00\\S1073-00\\With I2S\\Dumpling2000D_B2_20211108(1)\\重要说明.txt';

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

async function main() {
  if (!fs.existsSync(REAL_FILE)) throw new Error(`real text fixture missing: ${REAL_FILE}`);
  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true,
  });
  try {
    await waitForHttp(`http://127.0.0.1:${APP_PORT}/`, 'Arca server');
    const raw = await getUrl(`http://127.0.0.1:${APP_PORT}/api/read?path=${encodeURIComponent(REAL_FILE)}`);
    const data = JSON.parse(raw);
    assert.strictEqual(data.kind, 'text');
    assert.strictEqual(data.encoding, 'gbk');
    assert(data.content.includes('该参考设计版本'), JSON.stringify(data));
    assert(data.content.includes('change list') || data.content.includes('Change list'), JSON.stringify(data));
    assert(data.content.includes('PCB设计文件'), JSON.stringify(data));
    assert(!data.content.includes('\uFFFD'), 'decoded text should not contain replacement characters');
    assert(!/[锟斤拷]{2,}/.test(data.content), `decoded text still looks garbled: ${data.content}`);
    console.log('text-preview-real-file ok');
    console.log(JSON.stringify({
      file: data.path,
      encoding: data.encoding,
      preview: data.content.slice(0, 180),
    }, null, 2));
  } finally {
    server.kill();
    await waitForExit(server);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
