'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = 47037 + Math.floor(Math.random() * 1000);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(child) {
  const url = `http://127.0.0.1:${PORT}/api/roots`;
  for (let i = 0; i < 80; i += 1) {
    if (child.exitCode !== null) throw new Error(`server exited early with code ${child.exitCode}`);
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_) {
      // Server is still starting.
    }
    await wait(100);
  }
  throw new Error('temporary server did not become ready');
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 2500);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function makeStoredZipWithRawName(rawName, data) {
  const local = Buffer.alloc(30);
  let o = 0;
  local.writeUInt32LE(0x04034b50, o); o += 4; // local file header
  local.writeUInt16LE(20, o); o += 2; // version needed
  local.writeUInt16LE(0, o); o += 2; // flags: no UTF-8 bit
  local.writeUInt16LE(0, o); o += 2; // stored
  local.writeUInt16LE(0, o); o += 2; // mtime
  local.writeUInt16LE(0, o); o += 2; // mdate
  local.writeUInt32LE(0, o); o += 4; // crc unused by listing
  local.writeUInt32LE(data.length, o); o += 4;
  local.writeUInt32LE(data.length, o); o += 4;
  local.writeUInt16LE(rawName.length, o); o += 2;
  local.writeUInt16LE(0, o);

  const central = Buffer.alloc(46);
  o = 0;
  central.writeUInt32LE(0x02014b50, o); o += 4; // central directory header
  central.writeUInt16LE(20, o); o += 2; // version made by
  central.writeUInt16LE(20, o); o += 2; // version needed
  central.writeUInt16LE(0, o); o += 2; // flags: no UTF-8 bit
  central.writeUInt16LE(0, o); o += 2; // stored
  central.writeUInt16LE(0, o); o += 2;
  central.writeUInt16LE(0, o); o += 2;
  central.writeUInt32LE(0, o); o += 4;
  central.writeUInt32LE(data.length, o); o += 4;
  central.writeUInt32LE(data.length, o); o += 4;
  central.writeUInt16LE(rawName.length, o); o += 2;
  central.writeUInt16LE(0, o); o += 2; // extra len
  central.writeUInt16LE(0, o); o += 2; // comment len
  central.writeUInt16LE(0, o); o += 2; // disk
  central.writeUInt16LE(0, o); o += 2; // internal attrs
  central.writeUInt32LE(0, o); o += 4; // external attrs
  central.writeUInt32LE(0, o); // local header offset

  const localPart = Buffer.concat([local, rawName, data]);
  const centralPart = Buffer.concat([central, rawName]);
  const eocd = Buffer.alloc(22);
  o = 0;
  eocd.writeUInt32LE(0x06054b50, o); o += 4;
  eocd.writeUInt16LE(0, o); o += 2;
  eocd.writeUInt16LE(0, o); o += 2;
  eocd.writeUInt16LE(1, o); o += 2;
  eocd.writeUInt16LE(1, o); o += 2;
  eocd.writeUInt32LE(centralPart.length, o); o += 4;
  eocd.writeUInt32LE(localPart.length, o); o += 4;
  eocd.writeUInt16LE(0, o);
  return Buffer.concat([localPart, centralPart, eocd]);
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'arca-zip-gbk-'));
  const zipPath = path.join(tmp, 'gbk-name.zip');
  // GBK bytes for "重要说明.txt"; bit 11 is intentionally unset in the ZIP headers.
  const rawName = Buffer.from([0xD6, 0xD8, 0xD2, 0xAA, 0xCB, 0xB5, 0xC3, 0xF7, 0x2E, 0x74, 0x78, 0x74]);
  fs.writeFileSync(zipPath, makeStoredZipWithRawName(rawName, Buffer.from('hello')));

  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, FANBOX_PORT: String(PORT) },
    stdio: 'ignore',
    windowsHide: true,
  });
  try {
    await waitForServer(child);
    const res = await fetch(`http://127.0.0.1:${PORT}/api/archive?path=${encodeURIComponent(zipPath)}`);
    const json = await res.json();
    if (!json.ok) throw new Error(`archive API failed: ${json.error}`);
    const names = (json.entries || []).map((it) => it.name);
    if (!names.includes('重要说明.txt')) {
      throw new Error(`GBK zip filename did not decode correctly: ${JSON.stringify(names)}`);
    }
    if (names.some((name) => name.includes('\uFFFD') || /Ö|Ø|Ë|µ|Ã/.test(name))) {
      throw new Error(`archive list still contains mojibake: ${JSON.stringify(names)}`);
    }
    console.log('archive-gbk-zip contract ok');
  } finally {
    await stop(child);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
