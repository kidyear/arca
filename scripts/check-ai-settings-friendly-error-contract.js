'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const dict = fs.readFileSync(path.join(root, 'public', 'i18n-dict.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceObject(source, name) {
  const start = source.indexOf(`const ${name} = {`);
  if (start < 0) throw new Error(`${name} object missing`);
  let depth = 0;
  let seen = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') { depth += 1; seen = true; }
    if (ch === '}') {
      depth -= 1;
      if (seen && depth === 0) return source.slice(start, i + 2);
    }
  }
  throw new Error(`${name} object did not close`);
}

const aiSettings = sliceObject(app, 'aiSettings');

assertIncludes('AI settings friendly error helper exists', app, 'function friendlyAiSettingsError(err)');
assertIncludes('AI settings helper handles fetch failure', app, 'AI 设置暂时无法连接，请稍后重试');
assertIncludes('AI settings helper handles auth failure', app, 'AI 认证失败，请检查 API key');
assertIncludes('AI settings helper handles rate limit', app, 'AI 服务限流或额度不足，请稍后重试');
assertIncludes('AI settings open uses friendly helper', aiSettings, "toast('读取 AI 配置失败：' + friendlyAiSettingsError(e), true);");
assertIncludes('AI settings model fetch uses friendly helper', aiSettings, "$('#ai-status').textContent = '拉取失败：' + friendlyAiSettingsError(e);");
assertIncludes('AI settings save uses friendly helper', aiSettings, "$('#ai-status').textContent = '保存失败：' + friendlyAiSettingsError(e);");

for (const raw of [
  "toast('读取 AI 配置失败: ' + e.message",
  "$('#ai-status').textContent = '拉取失败: ' + e.message",
  "$('#ai-status').textContent = '保存失败: ' + e.message",
]) {
  if (aiSettings.includes(raw)) throw new Error(`raw AI settings error leaked: ${raw}`);
}

for (const key of [
  'AI 设置暂时无法连接，请稍后重试',
  'AI 认证失败，请检查 API key',
  'AI 服务限流或额度不足，请稍后重试',
]) {
  assertIncludes(`i18n contains ${key}`, dict, `'${key}':`);
}

console.log('ai-settings-friendly-error contract ok');
