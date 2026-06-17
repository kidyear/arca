'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(ROOT, 'public', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'public', 'style.css'), 'utf8');

function fail(message) {
  throw new Error(message);
}

function cssRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  return m ? m[1] : '';
}

function flexHandleWidth(rule) {
  const m = rule.match(/flex\s*:\s*0\s+0\s+([0-9.]+)px/);
  return m ? Number(m[1]) : 0;
}

if (!html.includes('id="chat-side-resizer"')) fail('chat side resizer element missing');
if (!html.includes('role="separator"')) fail('chat side resizer should be exposed as a separator');
if (!html.includes('aria-label="调整对话列表宽度"')) fail('chat side resizer needs a clear accessible label');
if (!html.includes('tabindex="0"')) fail('chat side resizer should be keyboard focusable');

if (!app.includes('initSideResize()')) fail('chat side resize initializer missing');
if (!app.includes('this.initSideResize();')) fail('chat side resize initializer is not called from chat.init');
if (!app.includes('CHAT_SIDE_WIDTH_KEY')) fail('chat side width should be persisted with a stable storage key');
if (!app.includes("handle.addEventListener('keydown'")) fail('chat side resizer should support keyboard adjustment');
if (!app.includes("handle.addEventListener('pointerdown'")) fail('chat side resizer should support pointer dragging');

const handleRule = cssRule('#chat-side-resizer');
if (!handleRule) fail('chat side resizer CSS rule missing');
if (flexHandleWidth(handleRule) < 12) fail(`chat side resizer hit area too small: ${handleRule.trim()}`);
if (!/cursor\s*:\s*col-resize/.test(handleRule)) fail('chat side resizer should use col-resize cursor');
if (!/touch-action\s*:\s*none/.test(handleRule)) fail('chat side resizer should disable touch-action while dragging');

const afterRule = cssRule('#chat-side-resizer::after');
if (!afterRule) fail('chat side resizer visible rail pseudo-element missing');
if (/opacity\s*:\s*0(?:\.0+)?\s*(?:;|$)/.test(afterRule)) fail('chat side resizer rail should be visible by default, not fully transparent');
if (!/(background|border-left|box-shadow)\s*:/.test(afterRule)) fail('chat side resizer rail needs a visible visual treatment');

const beforeRule = cssRule('#chat-side-resizer::before');
if (!beforeRule) fail('chat side resizer should show a grip cue');
if (!/(background|box-shadow)\s*:/.test(beforeRule)) fail('chat side resizer grip cue needs visible styling');

console.log('chat-side-resizer-affordance contract ok');
