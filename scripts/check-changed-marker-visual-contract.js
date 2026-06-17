'use strict';

const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'style.css'), 'utf8');

if (!css.includes('.item.changed::after, .row.changed::after')) {
  throw new Error('changed marker badge is missing');
}

const changedBlocks = [...css.matchAll(/\.item\.changed,\s*\.row\.changed\s*\{[^}]*\}/g)].map((m) => m[0]);
if (!changedBlocks.length) throw new Error('changed marker block is missing');

for (const block of changedBlocks) {
  if (/box-shadow:[^;}]*var\(--accent\)/.test(block)) {
    throw new Error('changed marker must not use accent box-shadow; it reads as a second selection');
  }
  if (/animation:\s*changedBreath/.test(block)) {
    throw new Error('changed marker must not breathe like an active selection');
  }
}

if (!/\.item\.changed:not\(\.selected\),\s*\.row\.changed:not\(\.selected\)/.test(css)) {
  throw new Error('changed marker needs a non-selected visual rule');
}

if (!css.includes('.item.changed:not(.selected), .row.changed:not(.selected) { background: transparent !important; border-color: transparent !important; outline: none !important; box-shadow: none !important; }')) {
  throw new Error('changed marker must be badge-only on unselected entries, not a second card selection');
}

const changedBadgeBlocks = [...css.matchAll(/\.item\.changed::after,\s*\.row\.changed::after\s*\{[^}]*\}/g)].map((m) => m[0]);
if (!changedBadgeBlocks.length) throw new Error('changed marker badge block is missing');

for (const block of changedBadgeBlocks) {
  if (/background:\s*var\(--accent\)/.test(block) || /border[^;}]*var\(--accent\)/.test(block) || /color[^;}]*var\(--accent\)/.test(block)) {
    throw new Error('changed marker badge must not use accent orange; users read accent as selected');
  }
}

console.log('changed-marker-visual contract ok');
