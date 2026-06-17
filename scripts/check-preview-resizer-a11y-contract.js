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

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

assertIncludes('preview resizer is a separator', html, 'id="preview-resizer" class="hidden" role="separator"');
assertIncludes('preview resizer is keyboard focusable', html, 'tabindex="0"');
assertIncludes('preview resizer label explains action', html, 'aria-label="调整预览窗格大小"');
assertIncludes('preview resizer focus affordance', css, '#preview-resizer:focus-visible::after');
assertIncludes('preview resizer has discoverable hit area', css, '#preview-resizer { flex: 0 0 14px;');
assertIncludes('preview resizer default rail is visible', css, '#preview-resizer::after {');
assertIncludes('preview resizer rail is visible before hover', css, 'opacity: 0.55;');
assertIncludes('preview resizer has a grip affordance', css, '#preview-resizer::before {');
assertIncludes('preview resizer grip uses repeated marks', css, 'repeating-linear-gradient');

assertIncludes('preview resize bounds helper exists', app, 'function previewResizeBounds()');
assertIncludes('preview resize apply helper exists', app, 'function applyPreviewResizeValue(value, persist)');
assertIncludes('preview resize aria updater exists', app, 'function updatePreviewResizerA11y()');
assertIncludes('preview resize keyboard handler exists', app, 'function handlePreviewResizerKey(e)');

const applySize = sliceFunction(app, 'applyPreviewSize');
assertIncludes('preview size applies flex shorthand', applySize, 'pv.style.flex = `0 0 ${size}px`;');
assertIncludes('preview size applies inline width in side layout', applySize, 'pv.style.width = `${size}px`;');
assertIncludes('preview size applies inline height in bottom layout', applySize, 'pv.style.height = `${size}px`;');
assertIncludes('preview size locks min width in side layout', applySize, 'pv.style.minWidth = `${size}px`;');
assertIncludes('preview size locks max width in side layout', applySize, 'pv.style.maxWidth = `${size}px`;');
assertIncludes('preview size locks min height in bottom layout', applySize, 'pv.style.minHeight = `${size}px`;');
assertIncludes('preview size locks max height in bottom layout', applySize, 'pv.style.maxHeight = `${size}px`;');

const a11y = sliceFunction(app, 'updatePreviewResizerA11y');
assertIncludes('preview resizer orientation is vertical beside file area', a11y, "term.dock === 'right' ? 'horizontal' : 'vertical'");
assertIncludes('preview resizer aria orientation updates', a11y, "handle.setAttribute('aria-orientation', orientation);");
assertIncludes('preview resizer aria min updates', a11y, "handle.setAttribute('aria-valuemin', String(bounds.min));");
assertIncludes('preview resizer aria max updates', a11y, "handle.setAttribute('aria-valuemax', String(bounds.max));");
assertIncludes('preview resizer aria now updates', a11y, "handle.setAttribute('aria-valuenow', String(value));");

const key = sliceFunction(app, 'handlePreviewResizerKey');
assertIncludes('preview keyboard supports ArrowLeft', key, "if (e.key === 'ArrowLeft')");
assertIncludes('preview keyboard supports ArrowRight', key, "if (e.key === 'ArrowRight')");
assertIncludes('preview keyboard supports ArrowUp', key, "if (e.key === 'ArrowUp')");
assertIncludes('preview keyboard supports ArrowDown', key, "if (e.key === 'ArrowDown')");
assertIncludes('preview keyboard supports Home', key, "if (e.key === 'Home')");
assertIncludes('preview keyboard supports End', key, "if (e.key === 'End')");

const bind = sliceFunction(app, 'bindResizer');
assertIncludes('preview resizer keydown is wired', bind, "handle.addEventListener('keydown', handlePreviewResizerKey);");
assertIncludes('preview drag reuses bounded helper', bind, 'applyPreviewResizeValue(raw, false);');
assertIncludes('preview drag persists through helper', bind, 'applyPreviewResizeValue(null, true);');

console.log('preview-resizer-a11y contract ok');
