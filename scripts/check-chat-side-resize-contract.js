'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('chat side resize handle exists', html, 'id="chat-side-resizer"');
assertIncludes('chat side resize handle is keyboard focusable', html, 'tabindex="0"');
assertIncludes('chat side resize handle declares orientation', html, 'aria-orientation="vertical"');
assertIncludes('chat side width uses css variable', css, 'var(--chat-side-w');
assertIncludes('chat side has minimum width', css, 'min-width: 132px');
assertIncludes('chat side has maximum width', css, 'max-width: min(42vw, 420px)');
assertIncludes('resize handle uses col-resize cursor', css, 'cursor: col-resize');
assertIncludes('resize handle has focus affordance', css, '#chat-side-resizer:focus-visible::after');
assertIncludes('dragging class prevents selection', css, 'body.chat-side-resizing');
assertIncludes('chat resize storage key exists', app, "const CHAT_SIDE_WIDTH_KEY = 'arca_chat_side_width'");
assertIncludes('chat resize init is wired', app, 'this.initSideResize();');
assertIncludes('chat side width is persisted', app, 'localStorage.setItem(CHAT_SIDE_WIDTH_KEY');
assertIncludes('chat side drag uses pointer events', app, "handle.addEventListener('pointerdown'");
assertIncludes('chat side drag updates css variable', app, "document.documentElement.style.setProperty('--chat-side-w'");
assertIncludes('chat side aria value is updated', app, "handle.setAttribute('aria-valuenow', String(width));");
assertIncludes('chat side keyboard resize is wired', app, "handle.addEventListener('keydown'");
assertIncludes('chat side keyboard supports left arrow', app, "if (e.key === 'ArrowLeft')");
assertIncludes('chat side keyboard supports right arrow', app, "if (e.key === 'ArrowRight')");
assertIncludes('chat side keyboard supports home', app, "if (e.key === 'Home')");
assertIncludes('chat side keyboard supports end', app, "if (e.key === 'End')");

console.log('chat-side-resize contract ok');
