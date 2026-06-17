'use strict';

const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

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
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'arca-text-preview-gbk-'));
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
    const raw = await getUrl(`http://127.0.0.1:${APP_PORT}/api/read?path=${encodeURIComponent(file)}`);
    const data = JSON.parse(raw);
    assert.strictEqual(data.kind, 'text');
    assert.strictEqual(data.encoding, 'gbk');
    assert(data.content.includes('重要说明'), JSON.stringify(data));
    assert(data.content.includes('该参考设计版本'), JSON.stringify(data));
    assert(!data.content.includes('\uFFFD'), 'decoded text should not contain replacement characters');
    console.log('text-preview-encoding-real-api ok');
    console.log(JSON.stringify({ file: data.name, encoding: data.encoding, content: data.content }, null, 2));
  } finally {
    server.kill();
    await waitForExit(server);
    await rmRetry(tmp);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
