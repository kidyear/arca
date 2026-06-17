'use strict';

const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const JSZip = require('jszip');
const XLSX = require('xlsx');

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

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[ch]));
}

async function writeDocx(file, paragraphs) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.folder('_rels').file('.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  const body = paragraphs.map((p) => `<w:p><w:r><w:t>${escapeXml(p)}</w:t></w:r></w:p>`).join('');
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`);
  await fsp.writeFile(file, await zip.generateAsync({ type: 'nodebuffer' }));
}

function writeXlsx(file) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['项目', '说明'],
    ['应收应付', '费用报销台账需要核对发票合规'],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, '台账');
  XLSX.writeFile(wb, file);
}

async function search(root, term) {
  const raw = await getUrl(`http://127.0.0.1:${APP_PORT}/api/content?q=${encodeURIComponent(term)}&root=${encodeURIComponent(root)}`);
  return JSON.parse(raw);
}

async function main() {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'arca-content-search-office-'));
  const docx = path.join(tmp, '财务实习考核题.docx');
  const xlsx = path.join(tmp, '费用报销台账.xlsx');
  await writeDocx(docx, ['财务实习考核题', '请生成应收应付和费用报销相关题目']);
  writeXlsx(xlsx);

  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true,
  });
  try {
    await waitForHttp(`http://127.0.0.1:${APP_PORT}/`, 'Arca server');
    const docData = await search(tmp, '财务实习考核题');
    assert.strictEqual(docData.engine, 'grep');
    const docHit = (docData.results || []).find((r) => r.name === '财务实习考核题.docx');
    assert(docHit, `docx content should be found: ${JSON.stringify(docData)}`);
    assert(JSON.stringify(docHit.hits || []).includes('财务实习考核题'), `docx hit preview missing decoded text: ${JSON.stringify(docHit)}`);

    const xlsxData = await search(tmp, '发票合规');
    assert.strictEqual(xlsxData.engine, 'grep');
    const xlsxHit = (xlsxData.results || []).find((r) => r.name === '费用报销台账.xlsx');
    assert(xlsxHit, `xlsx content should be found: ${JSON.stringify(xlsxData)}`);
    assert(JSON.stringify(xlsxHit.hits || []).includes('费用报销台账'), `xlsx hit preview missing decoded text: ${JSON.stringify(xlsxHit)}`);

    console.log('content-search-office-api ok');
    console.log(JSON.stringify({ docx: docHit.hits, xlsx: xlsxHit.hits }, null, 2));
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
