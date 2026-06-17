'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs', '公司版-工作清单.md'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceObjectMethod(src, name) {
  const start = src.indexOf(`  ${name}(`);
  if (start < 0) throw new Error(`missing chat method ${name}`);
  let depth = 0;
  let seen = false;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '{') { depth += 1; seen = true; }
    if (ch === '}') {
      depth -= 1;
      if (seen && depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`chat method ${name} did not close`);
}

assertIncludes('chat jump button exists', index, 'id="chat-jump-bottom"');
assertIncludes('chat jump button labels new messages', index, '新消息');

assertIncludes('chat has follow output flag', app, 'followOutput: true');

const init = sliceObjectMethod(app, 'initScrollFollow');
assertIncludes('scroll listener tracks user position', init, "m.addEventListener('scroll'");
assertIncludes('scroll listener updates follow flag', init, 'this.followOutput = this.isNearBottom();');
assertIncludes('jump button scrolls forcibly', init, 'this.scroll(true);');

const isNearBottom = sliceObjectMethod(app, 'isNearBottom');
assertIncludes('near bottom uses scroll distance', isNearBottom, 'm.scrollHeight - m.scrollTop - m.clientHeight');

const scroll = sliceObjectMethod(app, 'scroll');
assertIncludes('scroll supports force argument', scroll, 'scroll(force = false)');
assertIncludes('scroll respects follow flag', scroll, 'this.followOutput !== false');
assertIncludes('scroll shows jump when not following', scroll, 'this.setJumpVisible(true);');

const setJumpVisible = sliceObjectMethod(app, 'setJumpVisible');
assertIncludes('jump helper toggles hidden', setJumpVisible, "b.classList.toggle('hidden'");

const openChat = app.slice(app.indexOf('async openChat(id)'), app.indexOf('\n  newChat()', app.indexOf('async openChat(id)')));
assertIncludes('opening another chat restores follow mode', openChat, 'this.followOutput = true;');
assertIncludes('opening another chat hides stale jump button', openChat, 'this.setJumpVisible(false);');

const newChat = app.slice(app.indexOf('  newChat()'), app.indexOf('\n  // 按会话记账', app.indexOf('  newChat()')));
assertIncludes('new chat restores follow mode', newChat, 'this.followOutput = true;');
assertIncludes('new chat hides stale jump button', newChat, 'this.setJumpVisible(false);');

const send = app.slice(app.indexOf('async send(forcedText, displayText)'), app.indexOf('\n  stop()', app.indexOf('async send(forcedText, displayText)')));
assertIncludes('sending a new turn restores follow mode', send, 'this.followOutput = true;');

assertIncludes('chat init wires scroll follow', app, 'this.initScrollFollow();');
assertIncludes('chat main can anchor jump button', css, '#chat-main {');
assertIncludes('jump button style exists', css, '#chat-jump-bottom');
assertIncludes('jump button hidden style exists', css, '#chat-jump-bottom.hidden');
assertIncludes('docs mention chat scroll follow', docs, '对话长回复滚动保护');

console.log('chat-scroll-follow contract ok');
