'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');

function sliceFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`${name} not found`);
  let depth = 0;
  let seen = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') { depth += 1; seen = true; }
    else if (ch === '}') {
      depth -= 1;
      if (seen && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} did not close`);
}

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

const bindMarqueeSelection = sliceFunction(app, 'bindMarqueeSelection');

assertIncludes('marquee artifact cleanup helper exists', app, 'function clearMarqueeArtifacts()');
assertIncludes('marquee cleanup removes orphan boxes', app, "document.querySelectorAll('.marquee-box').forEach((x) => x.remove());");
assertIncludes('marquee cleanup removes body active class', app, "document.body.classList.remove('marquee-active');");
assertIncludes('marquee setup clears any stale box first', bindMarqueeSelection, 'clearMarqueeArtifacts();');
assertIncludes('marquee cleanup listens for lost window focus', bindMarqueeSelection, "window.addEventListener('blur', cancel, true);");
assertIncludes('marquee cleanup listens for mouse leaving document', bindMarqueeSelection, "document.addEventListener('mouseleave', cancel, true);");
assertIncludes('marquee cleanup listens for pointer up', bindMarqueeSelection, "window.addEventListener('pointerup', cancel, true);");
assertIncludes('marquee cleanup listens for pointer cancel', bindMarqueeSelection, "window.addEventListener('pointercancel', cancel, true);");
assertIncludes('marquee cleanup listens for visibility change', bindMarqueeSelection, "document.addEventListener('visibilitychange', cancel, true);");
assertIncludes('marquee cleanup removes blur listener', bindMarqueeSelection, "window.removeEventListener('blur', cancel, true);");
assertIncludes('marquee cleanup removes mouseleave listener', bindMarqueeSelection, "document.removeEventListener('mouseleave', cancel, true);");
assertIncludes('marquee cleanup removes pointer up listener', bindMarqueeSelection, "window.removeEventListener('pointerup', cancel, true);");
assertIncludes('marquee cleanup removes pointer cancel listener', bindMarqueeSelection, "window.removeEventListener('pointercancel', cancel, true);");
assertIncludes('marquee cleanup removes visibility listener', bindMarqueeSelection, "document.removeEventListener('visibilitychange', cancel, true);");
assertIncludes('marquee cancel can finish without mouse event', bindMarqueeSelection, 'const cancel = () => finish();');
assertIncludes('marquee active class exists', css, '.marquee-active');

const marqueeRule = css.match(/\.marquee-box\s*\{[^}]*\}/);
if (!marqueeRule) throw new Error('marquee box visual rule is missing');
if (/var\(--accent\)|var\(--accent-soft\)/.test(marqueeRule[0])) {
  throw new Error('marquee rectangle must not reuse the selected accent color');
}
assertIncludes('marquee rectangle uses neutral dashed outline', marqueeRule[0], 'border: 1px dashed var(--text-faint);');
assertIncludes('marquee rectangle uses neutral wash', marqueeRule[0], 'background: color-mix(in srgb, var(--text-faint) 10%, transparent);');

console.log('marquee-selection-cleanup contract ok');
