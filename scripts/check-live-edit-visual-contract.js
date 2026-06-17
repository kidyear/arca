'use strict';

const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');

function blockFor(selector) {
  const idx = css.indexOf(selector);
  if (idx < 0) throw new Error(`missing CSS selector: ${selector}`);
  const bodyStart = css.indexOf('{', idx);
  const bodyEnd = css.indexOf('}', bodyStart);
  if (bodyStart < 0 || bodyEnd < 0) throw new Error(`malformed CSS block: ${selector}`);
  return css.slice(idx, bodyEnd + 1);
}

const itemLive = blockFor('.item.live-edit');
const rowLive = blockFor('.row.live-edit');
const ripple = blockFor('.edit-ripple');
const rowZap = blockFor('@keyframes liveZapRow');

if (/var\(--accent-soft\)|var\(--accent\)/.test(itemLive)) {
  throw new Error('grid live-edit animation must not reuse selected accent colors');
}
if (/var\(--accent-soft\)|var\(--accent\)/.test(rowLive)) {
  throw new Error('list live-edit animation must not reuse selected accent colors');
}
if (/border:[^;]*var\(--accent\)|background:[^;]*var\(--accent\)|box-shadow:[^;]*var\(--accent\)/.test(ripple)) {
  throw new Error('live-edit ripple must not use selected accent color');
}
if (/var\(--accent-soft\)|var\(--accent\)/.test(rowZap)) {
  throw new Error('live-edit row keyframes must not reuse selected accent colors');
}
if (!css.includes('.item.live-edit:not(.selected), .row.live-edit:not(.selected)')) {
  throw new Error('live-edit needs an explicit non-selected guard');
}

console.log('live-edit-visual contract ok');
