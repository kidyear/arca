'use strict';

const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { encodeTextPreviewBuffer } = require('../lib/text-preview-decoder');

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
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'arca-content-search-gbk-'));
  const file = path.join(tmp, '重要说明.txt');
  await fsp.writeFile(file, encodeTextPreviewBuffer('重要说明\n该参考设计版本\nPCB设计文件需要确认阻抗控制', 'gbk'));

  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true,
  });
  try {
    await waitForHttp(`http://127.0.0.1:${APP_PORT}/`, 'Arca server');
    const raw = await getUrl(`http://127.0.0.1:${APP_PORT}/api/content?q=${encodeURIComponent('参考设计')}&root=${encodeURIComponent(tmp)}`);
    const data = JSON.parse(raw);
    assert.strictEqual(data.engine, 'grep');
    const hit = (data.results || []).find((r) => r.name === '重要说明.txt');
    assert(hit, `GBK text file should be found by content search: ${JSON.stringify(data)}`);
    const joined = JSON.stringify(hit.hits || []);
    assert(joined.includes('该参考设计版本'), `hit preview should be decoded Chinese: ${joined}`);
    assert(!joined.includes('\uFFFD'), `hit preview should not contain replacement chars: ${joined}`);
    assert(!/[锟斤拷]{2,}/.test(joined), `hit preview should not look garbled: ${joined}`);
    console.log('content-search-gbk-real-api ok');
    console.log(JSON.stringify({ file: hit.path, hits: hit.hits, engine: data.engine }, null, 2));
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
