'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const dict = fs.readFileSync(path.join(root, 'public', 'i18n-dict.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceObjectMethod(text, objectName, methodName) {
  const obj = text.indexOf(`const ${objectName} = {`);
  if (obj < 0) throw new Error(`missing object ${objectName}`);
  let start = text.indexOf(`\n  ${methodName}(`, obj);
  if (start < 0) start = text.indexOf(`\n  async ${methodName}(`, obj);
  if (start < 0) throw new Error(`missing method ${objectName}.${methodName}`);
  const open = text.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated method ${objectName}.${methodName}`);
}

assertIncludes('app has terminal failure helper', app, 'function terminalFailureMessage(sess)');
const helperStart = app.indexOf('function terminalFailureMessage(sess)');
const helper = app.slice(helperStart, app.indexOf('\nconst term =', helperStart));
assertIncludes('terminal failure helper uses safe missing-session fallback', helper, "(sess && sess.error) || '未知错误'");
assertIncludes('terminal failure helper formats message', helper, "return '终端启动失败：' + reason;");
assertIncludes('terminal respawn failure helper formats message', helper, "return '终端重开失败：' + reason;");
assertIncludes('app has terminal unavailable helper', helper, 'function terminalUnavailableMessage()');
assertIncludes('terminal unavailable helper avoids web-only diagnosis', helper, "return '内嵌终端不可用，请使用桌面版或检查终端组件';");
if (app.includes('网页版没有内嵌终端') || app.includes('网页版没有终端')) {
  throw new Error('terminal unavailable feedback should not assume the web version is the only cause');
}

const launchAgent = sliceObjectMethod(app, 'term', 'launchAgent');
assertIncludes('launchAgent reports concrete terminal failure', launchAgent, 'toast(terminalFailureMessage(sess), true);');

const runInDir = sliceObjectMethod(app, 'term', 'runInDir');
assertIncludes('runInDir reports concrete terminal failure', runInDir, 'toast(terminalFailureMessage(sess), true);');

const newTab = sliceObjectMethod(app, 'term', 'newTab');
assertIncludes('newTab stores terminal spawn error on session', newTab, "sess.error = r.error || '未知错误';");
assertIncludes('newTab writes same fallback reason inside terminal', newTab, "终端启动失败：' + sess.error");
assertIncludes('newTab clears terminal spawn error after success', newTab, 'sess.error = \'\';');

const respawn = sliceObjectMethod(app, 'term', 'respawn');
assertIncludes('respawn stores terminal spawn error on session', respawn, "sess.error = r.error || '未知错误';");
assertIncludes('respawn writes same fallback reason inside terminal', respawn, "重开失败：' + sess.error");
assertIncludes('respawn reports concrete terminal failure', respawn, 'toast(terminalRespawnFailureMessage(sess), true);');
assertIncludes('respawn clears terminal spawn error after success', respawn, "sess.error = '';");

const sendContext = sliceObjectMethod(app, 'term', 'sendContext');
assertIncludes('sendContext uses shared terminal unavailable feedback', sendContext, 'toast(terminalUnavailableMessage(), true);');
assertIncludes('skill terminal invoke uses shared terminal unavailable feedback', app, "toast(terminalUnavailableMessage(), true); return; }");
assertIncludes('chat terminal tab uses shared terminal unavailable feedback', app, "if (!term.available()) { toast(terminalUnavailableMessage(), true); return; }");

assertIncludes('docs records terminal startup error feedback', docs, '终端启动失败原因');
assertIncludes('docs records terminal respawn error feedback', docs, '终端重开失败原因');
assertIncludes('i18n translates terminal startup failure toast', dict, '/^终端启动失败：([\\s\\S]*)$/');
assertIncludes('i18n translates terminal respawn failure toast', dict, '/^终端重开失败：([\\s\\S]*)$/');
assertIncludes('i18n translates terminal unavailable feedback', dict, "'内嵌终端不可用，请使用桌面版或检查终端组件': 'Embedded terminal unavailable. Use the desktop app or check terminal components'");

console.log('terminal-error-feedback contract ok');
