const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const updateFeed = require(path.join(ROOT, 'electron', 'update-feed.js'));
const main = fs.readFileSync(path.join(ROOT, 'electron', 'main.js'), 'utf8');
const docs = fs.readFileSync(path.join(ROOT, 'docs', '公司版-工作清单.md'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(updateFeed.cmpVer('v1.0.19', '1.0.18') > 0, 'cmpVer must detect newer v-prefixed versions');
assert(updateFeed.cmpVer('1.0.18', 'v1.0.18') === 0, 'cmpVer must treat v-prefix as cosmetic');
assert(updateFeed.cmpVer('1.0.17', '1.0.18') < 0, 'cmpVer must detect older versions');

const parsed = updateFeed.parseUpdateFeed(
  { version: ' v1.0.19 ', url: ' http://intra/arca/Arca-Setup-1.0.19.exe ' },
  'http://intra/arca/latest.json',
);
assert(parsed && parsed.tag === 'v1.0.19', 'feed parser must preserve normalized tag');
assert(parsed.version === '1.0.19', 'feed parser must expose a clean version without v-prefix');
assert(parsed.url === 'http://intra/arca/Arca-Setup-1.0.19.exe', 'feed parser must trim the download URL');

const fallback = updateFeed.parseUpdateFeed({ version: '1.0.20' }, 'http://intra/arca/latest.json');
assert(fallback && fallback.url === 'http://intra/arca/latest.json', 'feed parser must fall back to feed URL when package URL is omitted');

assert(updateFeed.parseUpdateFeed({ version: '' }, 'http://intra/arca/latest.json') === null, 'feed parser must reject missing versions');
assert(updateFeed.parseUpdateFeed({ version: '1.0.20', url: 'javascript:alert(1)' }, 'http://intra/arca/latest.json') === null, 'feed parser must reject non-http download URLs');
assert(updateFeed.updateNoticeForFeed({ version: '1.0.19', url: 'http://intra/arca/Arca-Setup-1.0.19.exe' }, '1.0.18', 'http://intra/arca/latest.json').version === '1.0.19', 'newer feed must produce an update notice');
assert(updateFeed.updateNoticeForFeed({ version: '1.0.18', url: 'http://intra/arca/Arca-Setup-1.0.18.exe' }, '1.0.18', 'http://intra/arca/latest.json') === null, 'same-version feed must not produce an update notice');

assert(main.includes("require('./update-feed.js')"), 'electron/main.js must use the shared update-feed parser');
assert(main.includes('parseUpdateFeed'), 'electron/main.js must parse internal feed JSON through update-feed.js');
assert(main.includes('updateNoticeForFeed'), 'electron/main.js must compare internal feed versions through update-feed.js');

assert(docs.includes('内网更新检测本地 feed 验收'), 'work checklist must record internal update feed verification');

console.log('update feed contract ok');
