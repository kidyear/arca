'use strict';

const http = require('http');
const { spawn } = require('child_process');

const APP_PORT = 4567;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) reject(new Error(`${url} -> ${res.statusCode}`));
        else {
          try { resolve(JSON.parse(data)); } catch (err) { reject(err); }
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(1000, () => req.destroy(new Error(`${url} timeout`)));
  });
}

async function waitForTemplates() {
  const url = `http://127.0.0.1:${APP_PORT}/api/ai/templates`;
  for (let i = 0; i < 60; i += 1) {
    try {
      return await getJson(url);
    } catch (_) {
      await wait(100);
    }
  }
  throw new Error('Arca templates API did not become ready');
}

async function main() {
  const server = spawn(process.execPath, ['server.js'], {
    cwd: require('path').join(__dirname, '..'),
    stdio: 'ignore',
    windowsHide: true,
  });
  try {
    const json = await waitForTemplates();
    if (json.source !== 'builtin' && json.source !== 'user') throw new Error(`unexpected template source: ${JSON.stringify(json)}`);
    const tpl = (json.templates || []).find((item) => item.id === 'finance-intern-exam');
    if (!tpl) throw new Error(`finance template missing from API: ${JSON.stringify(json).slice(0, 500)}`);
    if (tpl.dept !== '财务') throw new Error(`finance template dept mismatch: ${JSON.stringify(tpl)}`);
    if (!/试题卷/.test(tpl.prompt) || !/参考答案/.test(tpl.prompt) || !/得分汇总表/.test(tpl.prompt)) {
      throw new Error(`finance template prompt missing required outputs: ${JSON.stringify(tpl)}`);
    }
    console.log('finance-templates-api ok');
    console.log(JSON.stringify({ source: json.source, id: tpl.id, dept: tpl.dept, title: tpl.title }, null, 2));
  } finally {
    server.kill();
    await waitForExit(server);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
