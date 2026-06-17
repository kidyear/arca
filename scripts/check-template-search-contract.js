'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('template search state starts empty', app, "q: ''");
assertIncludes('template search matcher exists', app, 'templateMatchesQuery(t, q)');
assertIncludes('template search scans title', app, 't.title');
assertIncludes('template search scans description', app, 't.desc');
assertIncludes('template search scans department', app, 't.dept');
assertIncludes('template search scans fields', app, '(t.fields || [])');
assertIncludes('template search scans prompt', app, 't.prompt');
assertIncludes('template picker renders search input', app, 'className = \'tpl-search\'');
assertIncludes('template card renders department badge', app, 'class="tpl-dept"');
assertIncludes('template card badge uses template department', app, "escapeHtml(t.dept || '')");
assertIncludes('template department counts helper exists', app, 'templateDepartmentCount(d)');
assertIncludes('template all chip count uses all templates', app, "if (d === '全部') return this.data.templates.length;");
assertIncludes('template chip renders count span', app, 'class="tpl-chip-count"');
assertIncludes('template search input label', app, "setAttribute('aria-label', '搜索任务模板')");
assertIncludes('template search placeholder', app, "placeholder = '搜索模板 / 部门 / 关键词'");
assertIncludes('template picker resets stale query on open', app, "this.q = '';");
assertIncludes('template picker clears old persisted query', app, "localStorage.removeItem('fb_tpl_q');");
assertIncludes('template search clear helper exists', app, 'clearSearch(box)');
assertIncludes('template search supports escape clear', app, "if (ev.key === 'Escape' && this.q)");
assertIncludes('template search supports ArrowDown to first card', app, "if (ev.key === 'ArrowDown')");
assertIncludes('template search ArrowDown prevents page scroll', app, 'ev.preventDefault();');
assertIncludes('template search ArrowDown stays inside template picker', app, 'ev.stopPropagation();');
assertIncludes('template search ArrowDown stores first result card', app, "const firstCard = box.querySelector('.tpl-card');");
assertIncludes('template search ArrowDown focuses first result card', app, "firstCard?.focus({ preventScroll: true });");
assertIncludes('template search ArrowDown refocuses result after keydown settles', app, "requestAnimationFrame(() => firstCard?.focus({ preventScroll: true }));");
assertIncludes('template card handles keyboard navigation', app, 'c.onkeydown = (ev) => {');
assertIncludes('template card lists focusable template cards', app, "const cards = Array.from(box.querySelectorAll('.tpl-card'));");
assertIncludes('template card navigation stays in picker', app, 'ev.stopPropagation();');
assertIncludes('template card Escape returns focus to search', app, "if (ev.key === 'Escape')");
assertIncludes('template card ArrowRight moves to next card', app, "ev.key === 'ArrowRight'");
assertIncludes('template card ArrowLeft moves to previous card', app, "ev.key === 'ArrowLeft'");
assertIncludes('template search can refocus after rerender', app, 'renderPicker(box, { focusSearch: true })');
assertIncludes('template search restores caret after rerender', app, 'search.setSelectionRange(search.value.length, search.value.length);');
assertIncludes('template empty state has clear button', app, "clear.textContent = '清空搜索';");
assertIncludes('template search ignores department filter', app, 'const pool = this.q ? this.data.templates : this.data.templates.filter');
assertIncludes('template list filters by query', app, 'filter((t) => templateMatchesQuery(t, this.q))');
assertIncludes('template empty search state', app, '没有找到匹配的模板');
assertIncludes('template search style exists', css, '.tpl-search');
assertIncludes('template department badge style exists', css, '.tpl-dept');
assertIncludes('template chip count style exists', css, '.tpl-chip-count');
assertIncludes('template empty style exists', css, '.tpl-empty');
assertIncludes('template empty action style exists', css, '.tpl-empty button');

if (app.includes("localStorage.setItem('fb_tpl_q'")) {
  throw new Error('template search query must not persist across picker opens');
}

console.log('template-search contract ok');
