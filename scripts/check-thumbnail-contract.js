const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'public', 'app.js'), 'utf8');
const docs = fs.readFileSync(path.join(ROOT, 'docs', '公司版-工作清单.md'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(/const\s+ALPHA_IMG_EXT\s*=\s*new Set\([^)]*png[^)]*gif[^)]*webp/s.test(server), 'server.js must classify alpha-capable image extensions');
assert(server.includes('FANBOX_THUMB_FORMAT'), 'Windows thumbnail generation must receive the intended output format');
assert(/\$env:FANBOX_THUMB_FORMAT\s+-eq\s+'png'/.test(server), 'PowerShell thumbnail script must branch on PNG output');
assert(/ImageFormat\]::Png/.test(server), 'PowerShell thumbnail script must save real PNG files for alpha-capable images');
assert(/const\s+jpegOut\s*=\s*isImg\s*&&\s*!ALPHA_IMG_EXT\.has\(e\)/.test(server), 'thumbnail route must keep alpha-capable images on the PNG path');
assert(/Content-Type':\s*type/.test(server), 'thumbnail responses must use the cache file content type');
assert(server.includes('thumbInflight'), 'thumbnail generation should still dedupe concurrent cache misses');

assert(app.includes('IntersectionObserver'), 'frontend must lazy-load thumbnails with IntersectionObserver');
assert(app.includes('data-src=') && app.includes('/api/thumb?path='), 'thumbnail HTML must defer /api/thumb requests through data-src');
assert(app.includes('src="${THUMB_PLACEHOLDER}"'), 'thumbnail HTML must keep a stable placeholder before lazy loading');

assert(docs.includes('缩略图 Windows 真机验收'), 'work checklist must record Windows thumbnail verification');

console.log('thumbnail contract ok');
