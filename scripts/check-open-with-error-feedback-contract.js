'use strict';

const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

function sliceFunction(source, name) {
  const start = source.indexOf(`async function ${name}`);
  if (start < 0) throw new Error(`${name} not found`);
  const next = source.indexOf('\nasync function ', start + 1);
  return source.slice(start, next > start ? next : undefined);
}

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

const openWith = sliceFunction(app, 'openWith');

assertIncludes('openWith catches api open request failures', openWith, "const r = await apiPost('/api/open', { path: p, with: withApp }).catch((err) => ({ ok: false, error: friendlyErrorText(err) }));");
assertIncludes('openWith reports request failure reason', openWith, "toast('打开失败：' + (r.error || '未知错误'), true);");
assertIncludes('openWith still reports reveal success', openWith, "if (used === 'reveal') toast('已在文件管理器中显示');");
assertIncludes('openWith still reports editor fallback', openWith, "else if (withApp === 'editor' && used === 'default') toast('未找到 code 命令，已用默认应用打开');");

console.log('open-with-error-feedback contract ok');
