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

const maybeShowGuide = sliceFunction(app, 'maybeShowGuide');
assertIncludes('guide close helper', maybeShowGuide, 'const closeGuide = () =>');
assertIncludes('guide persists dismissal', maybeShowGuide, "localStorage.setItem('fb_guided', '1')");
assertIncludes('guide ok uses helper', maybeShowGuide, "$('#guide-ok').onclick = closeGuide;");
assertIncludes('guide overlay click dismisses', maybeShowGuide, 'if (ev.target === ov) closeGuide();');
assertIncludes('guide escape dismisses', maybeShowGuide, "if (ev.key === 'Escape')");
assertIncludes('guide removes key listener', maybeShowGuide, "document.removeEventListener('keydown', onGuideKey, true)");

console.log('guide-dismiss contract ok');
