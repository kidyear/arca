'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

const normalizeNetworkLocationInput = sliceFunction(app, 'normalizeNetworkLocationInput');
assertIncludes('network input trims whitespace', normalizeNetworkLocationInput, '.trim()');
assertIncludes('network input removes wrapping quotes', normalizeNetworkLocationInput, "replace(/^['\\\"]|['\\\"]$/g, '')");
assertIncludes('network input accepts UNC paths', normalizeNetworkLocationInput, "value.startsWith('\\\\\\\\')");
assertIncludes('network input accepts file URL shares', normalizeNetworkLocationInput, "/^file:\\/\\//i.test(value)");
assertIncludes('network input accepts mapped drive folders', normalizeNetworkLocationInput, '/^[A-Za-z]:[\\\\/]/.test(value)');
assertIncludes('network input rejects other text before stat', normalizeNetworkLocationInput, "return { ok: false, path: '', error: '请输入网络位置路径，例如 \\\\\\\\server\\\\share 或 file://server/share' };");

const addNetworkLocation = sliceFunction(app, 'addNetworkLocation');
assertIncludes('network add uses normalized input', addNetworkLocation, 'const normalized = normalizeNetworkLocationInput(input);');
assertIncludes('network add stops before stat on invalid input', addNetworkLocation, 'if (!normalized.ok) { toast(normalized.error, true); return; }');
assertIncludes('network add stats normalized path', addNetworkLocation, "encodeURIComponent(normalized.path)");
assertIncludes('network add stores backend-confirmed path', addNetworkLocation, "apiPost('/api/favorites', { path: r.path, name, isDir: true })");

console.log('network-location-validation contract ok');
