/* FanBox 前端 */
'use strict';

const $ = (s) => document.querySelector(s);
const api = (p) => fetch(p).then((r) => r.json());
const apiPost = (p, body) => fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());

// ---------- SVG 图标系统（替代 emoji，统一矢量审美） ----------
const SVG = {
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  text: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  pdf: '<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/>',
  data: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/>',
  json: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1 2 2 2 2 0 0 1-2 2v5a2 2 0 0 1-2 2h-1"/>',
  archive: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
  // UI 装饰图标（统一矢量，替代散落的 emoji）
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  link: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  term: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  edit3: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  drive: '<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  gitbranch: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  // 高辨识度文件类型图标
  md: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M6 15.5V9l3 3 3-3v6.5"/><path d="M17 9v4.5"/><path d="M14.8 12.5L17 15l2.2-2.5"/>',
  html: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9.3 12.5 7.5 14.5 9.3 16.5"/><polyline points="14.7 12.5 16.5 14.5 14.7 16.5"/>',
  pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M7.6 13.5h1.3a1.2 1.2 0 0 1 0 2.4H7.6zm0 0v4.2"/><path d="M12.4 13.5v4.2h1a1.5 1.5 0 0 0 1.5-1.5v-1.2a1.5 1.5 0 0 0-1.5-1.5z"/>',
};
// 按扩展名优先匹配的专属图标（比按 kind 更精准、辨识度更高）
const ICON_BY_EXT = { md: 'md', markdown: 'md', html: 'html', htm: 'html', pdf: 'pdf' };
// UI 图标快捷函数（默认 currentColor，随主题文字色自适应）
function ic(name, color, size) { return svgWrap(SVG[name], color || 'currentColor', size || 16, false); }
// ext → 类别 + 颜色
const EXT_KIND = {
  js: ['code', '#e8c95b'], mjs: ['code', '#e8c95b'], cjs: ['code', '#e8c95b'], jsx: ['code', '#5bc9e8'],
  ts: ['code', '#5b9ae8'], tsx: ['code', '#5b9ae8'], py: ['code', '#5b90c9'], go: ['code', '#5bc9d6'],
  rs: ['code', '#d68a5b'], swift: ['code', '#e8825b'], java: ['code', '#d68a5b'], rb: ['code', '#e85b5b'],
  c: ['code', '#7b9ae8'], cpp: ['code', '#7b9ae8'], h: ['code', '#7b9ae8'], php: ['code', '#9a7be8'],
  vue: ['code', '#5bd6a0'], sh: ['code', '#9aa3b2'], bash: ['code', '#9aa3b2'], lua: ['code', '#5b9ae8'],
  html: ['code', '#e87b5b'], htm: ['code', '#e87b5b'], css: ['code', '#5b9ae8'], scss: ['code', '#e85b9a'],
  json: ['json', '#e8c95b'], json5: ['json', '#e8c95b'], yml: ['json', '#d65b9a'], yaml: ['json', '#d65b9a'],
  toml: ['json', '#9a7be8'], ini: ['json', '#9aa3b2'], env: ['json', '#e8c95b'], xml: ['code', '#9aa3b2'],
  md: ['text', '#7bc9e8'], markdown: ['text', '#7bc9e8'], txt: ['text', '#9aa3b2'], log: ['text', '#9aa3b2'],
  csv: ['data', '#5bd6a0'], tsv: ['data', '#5bd6a0'], sql: ['data', '#e8a85b'],
  zip: ['archive', '#e8c95b'], rar: ['archive', '#e8c95b'], '7z': ['archive', '#e8c95b'],
  gz: ['archive', '#e8c95b'], tar: ['archive', '#e8c95b'],
};
const KIND_COLOR = { dir: '#6d8bff', image: '#5bd6a0', video: '#9a7be8', audio: '#e85b9a', pdf: '#e85b5b', text: '#9aa3b2', other: '#7a8294' };
// 缩略图加载失败时的回退图标
window.__svgVideo = svgWrap(SVG.video, KIND_COLOR.video, 34);
window.__svgImg = svgWrap(SVG.image, KIND_COLOR.image, 34);

// 图标配色随皮肤变化
function iconColorFor(e) {
  const ex = (e.name.split('.').pop() || '').toLowerCase();
  const t = state.theme;
  if (t === 'warm') {
    if (e.isDir) return '#c0714f';
    if (['md', 'markdown', 'txt', 'pdf'].includes(ex)) return '#a0895c';
    if (['csv', 'tsv', 'sql'].includes(ex)) return '#8a7a48';
    return '#9b8b6e';
  }
  if (t === 'seavo') {
    // 设计稿:文件夹用火焰橘红;文档类走工程石板灰;其余暖墨降饱和
    if (e.isDir) return '#E94A16';
    if (['md', 'markdown', 'txt', 'pdf'].includes(ex)) return '#45576B';
    if (['csv', 'tsv', 'sql'].includes(ex)) return '#3C7D4F';
    return '#595249';
  }
  if (t === 'editorial') {
    if (e.isDir) return '#0a0a0a';
    if (['html', 'htm'].includes(ex)) return '#ff433d';
    if (['md', 'markdown'].includes(ex)) return '#0000ee';
    if (e.kind === 'data' || ['csv', 'tsv'].includes(ex)) return '#00a33e';
    return '#0a0a0a';
  }
  // terminal：暖色多彩，文件夹用中性灰绿不抢 volt
  if (e.isDir) return '#9aa08a';
  if (EXT_KIND[ex]) return EXT_KIND[ex][1];
  return KIND_COLOR[e.kind] || KIND_COLOR.other;
}
function iconSvg(e, size = 22) {
  const rich = richIcon(e, size); // 强色实体字形优先
  if (rich) return rich;
  const color = iconColorFor(e);
  if (e.isDir) return svgWrap(SVG.folder, color, size, true);
  const ex = (e.name.split('.').pop() || '').toLowerCase();
  let shape = SVG[e.kind] || SVG.file;
  if (EXT_KIND[ex]) shape = SVG[EXT_KIND[ex][0]];
  if (ICON_BY_EXT[ex]) shape = SVG[ICON_BY_EXT[ex]]; // 专属图标优先（md/html/pdf）
  return svgWrap(shape, color, size);
}
function svgWrap(inner, color, size, fill) {
  const isCur = color === 'currentColor';
  const fillVal = fill ? (isCur ? 'currentColor' : color + '22') : 'none';
  const fillOp = (fill && isCur) ? ' fill-opacity="0.15"' : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fillVal}"${fillOp} stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

// ---------- 强色实体文件图标（10x 识别度）----------
// 文档族：实色页面 + 折角 + 白色短标签；代码族：品牌色圆角徽章 + 字母；媒体/压缩各有专属形。
// 颜色烧死在图标里，跨三套皮肤都醒目——一眼认出「这是个 PDF / JS / 压缩包」。
function gWrap(size, inner) { return `<svg class="rich-glyph" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">${inner}</svg>`; }
function gDoc(color, fold) {
  return `<path d="M5 3.6A1.6 1.6 0 0 1 6.6 2H14l5 5v11.4A1.6 1.6 0 0 1 17.4 20H6.6A1.6 1.6 0 0 1 5 18.4z" fill="${color}"/>`
    + `<path d="M14 2l5 5h-3.4A1.6 1.6 0 0 1 14 5.4z" fill="${fold}"/>`;
}
function gLabel(t, fs) { return `<text x="11.6" y="16.6" text-anchor="middle" font-family="-apple-system,'Helvetica Neue',Arial,sans-serif" font-weight="800" font-size="${fs}" letter-spacing="0.1" fill="#fff">${t}</text>`; }
function gBadge(color) { return `<rect x="3" y="3" width="18" height="18" rx="5" fill="${color}"/>`; }
function gInit(t, fs, color) { return `<text x="12" y="15.7" text-anchor="middle" font-family="-apple-system,'Helvetica Neue',Arial,sans-serif" font-weight="800" font-size="${fs}" fill="${color}">${t}</text>`; }
// 文档族：[标签, 字号, 主体色, 折角色]
const DOC_TYPES = {
  pdf: ['PDF', 5, '#E64A3B', '#C23E31'],
  md: ['MD', 7, '#3B82F6', '#2E68C8'], markdown: ['MD', 7, '#3B82F6', '#2E68C8'],
  html: ['&lt;&gt;', 7, '#E8662A', '#C4541F'], htm: ['&lt;&gt;', 7, '#E8662A', '#C4541F'],
  css: ['CSS', 5, '#2D6FD6', '#2459AC'], scss: ['SCSS', 4, '#CF649A', '#A94E7C'], less: ['LESS', 4, '#2D5B8A', '#244A70'],
  json: ['{ }', 7, '#A6824C', '#856A3E'], json5: ['{ }', 7, '#A6824C', '#856A3E'],
  yml: ['YML', 5, '#9C5BD6', '#7E49AC'], yaml: ['YAML', 4.2, '#9C5BD6', '#7E49AC'], toml: ['TOML', 4.2, '#9C5BD6', '#7E49AC'],
  xml: ['XML', 5, '#5E8A3E', '#4A6E31'], svg: ['SVG', 5, '#E8923A', '#C4761F'],
  csv: ['CSV', 5, '#1FAE5A', '#188F4A'], tsv: ['TSV', 5, '#1FAE5A', '#188F4A'],
  sql: ['SQL', 5, '#C77D2E', '#A4661F'],
  doc: ['DOC', 5, '#2B579A', '#21457A'], docx: ['DOC', 5, '#2B579A', '#21457A'],
  xls: ['XLS', 5, '#1D6F42', '#155632'], xlsx: ['XLS', 5, '#1D6F42', '#155632'],
  ppt: ['PPT', 5, '#C43E1C', '#9E3216'], pptx: ['PPT', 5, '#C43E1C', '#9E3216'],
  log: ['LOG', 5, '#7A8290', '#626977'], txt: ['TXT', 5, '#7A8290', '#626977'],
};
// 代码族：[字母, 字号, 徽章色, 字色]
const CODE_BADGES = {
  js: ['JS', 8, '#F0DB4F', '#1A1A1A'], mjs: ['JS', 8, '#F0DB4F', '#1A1A1A'], cjs: ['JS', 8, '#F0DB4F', '#1A1A1A'],
  jsx: ['JSX', 6, '#61DAFB', '#1A1A1A'],
  ts: ['TS', 8, '#3178C6', '#fff'], tsx: ['TSX', 6, '#3178C6', '#fff'],
  py: ['PY', 8, '#3776AB', '#FFE05B'],
  go: ['GO', 7.5, '#00ACD7', '#fff'], rs: ['RS', 8, '#CE7B43', '#fff'],
  java: ['JV', 8, '#E7700E', '#fff'], kt: ['KT', 8, '#A97BFF', '#fff'],
  rb: ['RB', 8, '#CC342D', '#fff'], php: ['PHP', 6, '#7A86B8', '#fff'],
  c: ['C', 9, '#5C6BC0', '#fff'], h: ['H', 9, '#5C6BC0', '#fff'], cpp: ['C++', 6, '#5C6BC0', '#fff'], cc: ['C++', 6, '#5C6BC0', '#fff'],
  vue: ['Vue', 6, '#41B883', '#fff'], swift: ['SW', 8, '#F05138', '#fff'], dart: ['DT', 8, '#0A9EDC', '#fff'],
  sh: ['&gt;_', 8, '#33373D', '#3FD46A'], bash: ['&gt;_', 8, '#33373D', '#3FD46A'], zsh: ['&gt;_', 8, '#33373D', '#3FD46A'],
};
const ARCHIVE_EXT = new Set(['zip', 'rar', '7z', 'gz', 'tar', 'tgz', 'bz2', 'xz']);
// 终端裸文件名识别的扩展名白名单：没有它 e.g/node.js/v1.2 这类词全是误报下划线
const TERM_LINK_RE_BARE = /(?<=^|[\s'"`(\[（【>：:=])[\p{L}\p{N}_@][\p{L}\p{N}_.\-@/]*\.(?:md|markdown|txt|pdf|png|jpe?g|gif|webp|svg|avif|heic|icns|ico|mp4|mov|webm|mkv|mp3|wav|m4a|flac|json|jsonl|js|mjs|cjs|ts|tsx|jsx|css|scss|sass|less|html?|xml|ya?ml|toml|ini|conf|lock|log|sh|zsh|bash|py|rb|go|rs|java|kt|swift|c|h|cpp|hpp|cs|php|sql|csv|tsv|xlsx?|docx?|pptx?|key|numbers|pages|zip|tar|gz|tgz|dmg|app|plist|epub|srt|vtt|command)(?=$|[.\s'"`)\],:;。，）】])/gu;
// 文件夹：干净扁平的单色实心文件夹（强色 + 简洁几何，不做作）
function gFolder(size, color) {
  return `<svg class="rich-glyph" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">`
    + `<path d="M3.6 5.5h4.4a1.2 1.2 0 0 1 .85.35l1.3 1.3a1.2 1.2 0 0 0 .85.35H20a1.6 1.6 0 0 1 1.6 1.6v8.45A1.6 1.6 0 0 1 20 19.1H4A1.6 1.6 0 0 1 2.4 17.5V6.7A1.2 1.2 0 0 1 3.6 5.5z" fill="${color}"/>`
    + `</svg>`;
}
function richIcon(e, size) {
  if (e.isDir) return gFolder(size, iconColorFor(e));
  const ex = (e.name.split('.').pop() || '').toLowerCase();
  if (DOC_TYPES[ex]) { const [l, fs, c, f] = DOC_TYPES[ex]; return gWrap(size, gDoc(c, f) + gLabel(l, fs)); }
  if (CODE_BADGES[ex]) { const [l, fs, c, t] = CODE_BADGES[ex]; return gWrap(size, gBadge(c) + gInit(l, fs, t)); }
  if (ARCHIVE_EXT.has(ex)) {
    return gWrap(size, `<rect x="4" y="3.5" width="16" height="17" rx="2.2" fill="#E0A23B"/><rect x="4" y="3.5" width="16" height="17" rx="2.2" fill="#000" opacity="0.06"/>`
      + `<rect x="10.6" y="3.5" width="2.8" height="17" fill="#C8862A"/>`
      + `<rect x="10.6" y="8" width="2.8" height="3" rx="0.5" fill="#fff8e6"/><rect x="11.4" y="11" width="1.2" height="3.4" rx="0.6" fill="#fff8e6"/>`);
  }
  if (e.kind === 'audio') {
    return gWrap(size, gBadge('#E0457B') + `<g stroke="#fff" stroke-width="1.5" stroke-linecap="round"><line x1="8" y1="10" x2="8" y2="14"/><line x1="10.7" y1="8" x2="10.7" y2="16"/><line x1="13.3" y1="9.5" x2="13.3" y2="14.5"/><line x1="16" y1="7.5" x2="16" y2="16.5"/></g>`);
  }
  if (e.kind === 'video') {
    return gWrap(size, gBadge('#7C5CE0') + `<path d="M10 8.5l5 3.5-5 3.5z" fill="#fff"/>`);
  }
  if (e.kind === 'image') {
    return gWrap(size, gBadge('#2BB6A3') + `<circle cx="9" cy="9.5" r="1.6" fill="#fff"/><path d="M5 16l3.5-3.5 2.5 2.5L14.5 11 19 16z" fill="#fff"/>`);
  }
  return null; // 未知类型回退到细线通用图标
}
// 缩略图加载失败时的回退（覆盖前面用细线图标的版本，改用强色实体字形）
window.__svgImg = richIcon({ name: '_.jpg', kind: 'image' }, 40);
window.__svgVideo = richIcon({ name: '_.mp4', kind: 'video' }, 40);

const LIST_COL_DEFAULTS = { mtime: 130, btime: 130, kind: 112, size: 90 };
function loadListCols() {
  try {
    const raw = JSON.parse(localStorage.getItem('fb_list_cols') || '{}');
    return Object.fromEntries(Object.entries(LIST_COL_DEFAULTS).map(([k, v]) => [k, Math.max(64, Math.min(260, Number(raw[k]) || v))]));
  } catch {
    return { ...LIST_COL_DEFAULTS };
  }
}

const state = {
  cwd: null, home: null, platform: 'darwin', sep: '/',
  theme: localStorage.getItem('fb_theme') || 'seavo', // 公司版默认信步皮肤(SEAVO 设计系统)
  entries: [], project: null, history: [], forwardHistory: [],
  view: localStorage.getItem('fb_view') || 'grid',
  gridSize: localStorage.getItem('fb_gridsize') || 'md',
  listCols: loadListCols(),
  sort: localStorage.getItem('fb_sort') || 'name',
  sortDir: localStorage.getItem('fb_sort_dir') || defaultSortDir(localStorage.getItem('fb_sort') || 'name'),
  showHidden: localStorage.getItem('fb_hidden') === '1',
  filter: '', selected: null, cursor: -1, cols: 1, visible: [], entryByPath: new Map(), domByPath: new Map(), visibleStats: null, selectionStats: null,
  renderSeq: 0, // 大目录分片渲染的取消令牌：新渲染开始后旧批次自动失效
  paintedSelected: new Set(), paintedCursor: -1, // 选择/光标增量刷 class，方向键移动不再扫全列表
  paintedCut: new Set(), // Ctrl+X 后给源文件打淡化标记，像资源管理器一样提醒“正在剪切”
  typeAhead: { text: '', ts: 0 }, // 资源管理器习惯：主区直接键入文件名前缀即可定位
  renameClick: { path: null, ts: 0, timer: null }, // 资源管理器慢速二次点击文件名进入重命名
  multiSel: new Set(), // Ctrl/Shift 多选的路径集合;单选时为空
  selectionAnchor: null, // Shift+键盘/点击范围选择的固定锚点路径
  fileClip: null, fileClipSet: new Set(), // 文件剪贴板 {op:'copy'|'cut', paths:[]}; fileClipSet 只缓存剪切项用于淡化标记
  undoStack: [], redoStack: [], // 资源管理器同款 Ctrl+Z/Ctrl+Y：轻量撤销/重做最近文件操作
  folderTabs: [], activeFolderTab: null, folderTabSeq: 0, closedFolderTabs: [], // Windows 11 Explorer 式文件夹标签页
  favorites: [], drives: [], recentOpened: [], recentMode: false, skillsMode: false, virtualMode: null,
  previewW: Number(localStorage.getItem('fb_preview_w')) || 480,
  previewH: Number(localStorage.getItem('fb_preview_h')) || 340,
  sidebarCollapsed: localStorage.getItem('fb_sidebar_collapsed') === '1',
  sidebarW: Math.min(420, Math.max(190, Number(localStorage.getItem('fb_sidebar_w')) || 248)),
  muted: localStorage.getItem('fb_muted') === '1', // WOW4 提示音静音开关
  changeLog: [], // 本会话 agent 改过的文件（跨所有监听目录，按文件去重、最新置顶），供「变更」面板回看
  changeTimeline: [], // 每一次写入事件（不去重，带时间戳），供「会话回放」拖时间轴重现
};

// ---------- 工具 ----------
function fmtSize(n) {
  if (!n) return '';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${u[i]}`;
}
function fmtDriveFree(drive) {
  if (!drive || !drive.free || !drive.total) return '';
  return `可用 ${fmtSize(drive.free)} / 共 ${fmtSize(drive.total)}`;
}
function driveToEntry(drive) {
  return {
    name: drive.name,
    path: drive.path,
    isDir: true,
    isDrive: true,
    kind: 'dir',
    size: 0,
    mtime: 0,
    btime: 0,
    hidden: false,
    total: drive.total,
    free: drive.free,
    used: drive.used,
    usedRatio: drive.usedRatio,
    freeRatio: drive.freeRatio,
  };
}
function fmtTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const diff = Date.now() - ms;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDateTime(ms) {
  if (!ms) return '未知';
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}
const KIND_LABELS = { text: '文本文档', code: '代码文件', image: '图片', video: '视频', audio: '音频', pdf: 'PDF 文档', archive: '压缩包', data: '数据文件' };
function kindLabel(e) {
  if (e.isDir) return '文件夹';
  return KIND_LABELS[e.kind] || '文件';
}
const NAME_COLLATOR = new Intl.Collator('zh', { numeric: true, sensitivity: 'base' });
const KIND_COLLATOR = new Intl.Collator('zh', { numeric: true, sensitivity: 'base' });
function compareName(a, b) {
  return NAME_COLLATOR.compare(a.name || '', b.name || '');
}
function compareKind(a, b) {
  return KIND_COLLATOR.compare(kindLabel(a), kindLabel(b)) || compareName(a, b);
}
function searchKey(e) {
  if (!e) return '';
  if (e._searchNameSrc !== e.name) {
    e._searchNameSrc = e.name;
    e._searchName = String(e.name || '').toLocaleLowerCase('zh');
  }
  return e._searchName || '';
}
function prepareEntries(entries) {
  (entries || []).forEach(searchKey);
  return entries || [];
}
function defaultSortDir(sort) { return (sort === 'name' || sort === 'kind') ? 'asc' : 'desc'; }
const LARGE_RENDER_THRESHOLD = 420;
const FIRST_RENDER_BATCH = 140;
const RENDER_BATCH = 180;
const THUMB_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
let thumbObserver = null;
// 快捷键修饰键标签：mac 显示 ⌘，Windows/Linux 显示 Ctrl+（按键监听本来就同时认 metaKey/ctrlKey）
const IS_MAC = window.fanboxEnv && window.fanboxEnv.platform ? window.fanboxEnv.platform === 'darwin' : /Mac/i.test(navigator.platform);
const MOD = IS_MAC ? '⌘' : 'Ctrl+';
// 跨平台路径处理：同时兼容 / 和 \（Windows 的 fs.watch、终端输出都给反斜杠）
function dirOf(p) { const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\')); return i > 0 ? p.slice(0, i) : p; }
function baseOf(p) { const parts = p.split(/[\\/]/).filter(Boolean); return parts[parts.length - 1] || p; }
function tilde(p) { return state.home && p.startsWith(state.home) ? '~' + p.slice(state.home.length) : p; }
function isFav(path) { return state.favorites.some((f) => f.path === path); }
function toast(msg, isErr) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast' + (isErr ? ' err' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), 2200);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- 未保存守卫 ----------
// 文本/图片编辑期间，离开当前编辑器（点别的文件、跳目录、关预览）都要先确认，
// 否则会静默丢掉改动。dirtyCheck 在进入编辑器时挂上，保存/确认离开后清空。
let dirtyCheck = null; // () => boolean，true=有未保存改动；null=当前没有编辑器
let autosaveFlush = null; // 自动保存编辑器挂上：离开前把未落盘的改动写掉，不弹「放弃？」
async function guardDirty() {
  if (autosaveFlush) {
    const f = autosaveFlush;
    autosaveFlush = null; dirtyCheck = null;
    await f();
    return true;
  }
  if (dirtyCheck && dirtyCheck()) {
    const ok = await confirmDialog('当前编辑有未保存的改动，放弃并离开？');
    if (!ok) return false;
  }
  dirtyCheck = null;
  return true;
}
const isMdName = (n) => /\.(md|markdown)$/i.test(String(n || ''));

// ---------- 导航 ----------
async function navigate(p, pushHistory = true) {
  if (!await guardDirty()) return;
  if (p === 'this-pc') {
    await openThisPcView(pushHistory);
    return;
  }
  try {
    let data = await api('/api/list?path=' + encodeURIComponent(p));
    let revealPath = null;
    if (data.error) {
      const st = await api('/api/stat?path=' + encodeURIComponent(p)).catch(() => null);
      if (!st || !st.ok || st.isDir) { toast('无法打开：' + data.error, true); return; }
      revealPath = st.path;
      data = await api('/api/list?path=' + encodeURIComponent(dirOf(st.path)));
      if (data.error) { toast('无法打开所在目录：' + data.error, true); return; }
    }
    if (pushHistory && state.cwd && state.cwd !== data.path) {
      state.history.push(state.cwd);
      state.forwardHistory = [];
    }
    state.cwd = data.path;
    state.entries = prepareEntries(data.entries);
    state.project = data.project;
    state.breadcrumb = data.breadcrumb;
    state.parent = data.parent;
    state.recentMode = false;
    state.skillsMode = false;
    state.virtualMode = null;
    ensureFolderTabForCwd(data.path);
    state.filter = '';
    syncFilterUi(true);
    state.cursor = -1;
    render();
    renderFolderTabs();
    if (revealPath) {
      selectVisiblePaths([revealPath]);
      toast('已定位文件');
    }
    // 联动：监听此目录 + 各终端项目目录的文件变化（agent 改文件→自动刷新）；终端跟随则 cd 过去
    updateWatches();
    if (typeof term !== 'undefined' && term.followBrowse && term.active) term.syncCd(state.cwd);
  } catch (e) { toast('打开失败', true); }
}
function folderTabTitle(p) { return p === 'this-pc' ? '此电脑' : (baseOf(p || '') || p || '主页'); }
function activeFolderTab() {
  return state.folderTabs.find((t) => t.id === state.activeFolderTab) || null;
}
function syncActiveFolderTabNavigation() {
  const tab = activeFolderTab();
  if (!tab) return;
  tab.history = [...state.history];
  tab.forwardHistory = [...state.forwardHistory];
}
function restoreFolderTabNavigation(tab) {
  state.history = [...(tab.history || [])];
  state.forwardHistory = [...(tab.forwardHistory || [])];
}
function ensureFolderTabForCwd(path) {
  if (!path) return null;
  let tab = state.folderTabs.find((t) => t.id === state.activeFolderTab);
  if (!tab) {
    tab = { id: 'tab-' + (++state.folderTabSeq), path, title: folderTabTitle(path), history: [], forwardHistory: [] };
    state.folderTabs.push(tab);
    state.activeFolderTab = tab.id;
    return tab;
  }
  tab.path = path;
  tab.title = folderTabTitle(path);
  syncActiveFolderTabNavigation();
  return tab;
}
function renderFolderTabs() {
  const host = $('#folder-tabs');
  if (!host) return;
  if (!state.folderTabs.length && state.cwd) ensureFolderTabForCwd(state.cwd);
  host.innerHTML = '';
  host.ondblclick = (ev) => {
    if (ev.target === host) newFolderTab();
  };
  state.folderTabs.forEach((tab) => {
    const button = document.createElement('div');
    button.className = 'folder-tab' + (tab.id === state.activeFolderTab ? ' active' : '');
    button.dataset.tabId = tab.id;
    button.title = tab.path;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', tab.id === state.activeFolderTab ? 'true' : 'false');
    button.tabIndex = 0;
    button.draggable = true;
    button.onclick = () => switchFolderTab(tab.id);
    button.oncontextmenu = (ev) => showFolderTabMenu(ev, tab);
    button.ondragstart = (ev) => {
      ev.dataTransfer.setData('application/x-arca-folder-tab', tab.id);
      ev.dataTransfer.effectAllowed = 'move';
    };
    button.ondragover = (ev) => {
      const draggedId = ev.dataTransfer.getData('application/x-arca-folder-tab');
      if (draggedId) {
        if (draggedId === tab.id) return;
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
        return;
      }
      const kind = folderTabDropKind(ev.dataTransfer);
      if (!kind || state.skillsMode || state.recentMode) return;
      ev.preventDefault();
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = kind === 'external' || ev.ctrlKey || ev.metaKey ? 'copy' : 'move';
      button.classList.add('drop-target');
    };
    button.ondragleave = (ev) => {
      if (!button.contains(ev.relatedTarget)) button.classList.remove('drop-target');
    };
    button.ondrop = async (ev) => {
      const draggedId = ev.dataTransfer.getData('application/x-arca-folder-tab');
      if (draggedId) {
        if (draggedId === tab.id) return;
        ev.preventDefault();
        moveFolderTab(draggedId, tab.id);
        return;
      }
      const kind = folderTabDropKind(ev.dataTransfer);
      if (!kind || state.skillsMode || state.recentMode) return;
      ev.preventDefault();
      ev.stopPropagation();
      button.classList.remove('drop-target');
      await switchFolderTab(tab.id);
      if (kind === 'internal') {
        await dropInternalPathsToDir(internalDragPaths(ev.dataTransfer), tab.path, ev.ctrlKey || ev.metaKey, { reveal: true });
        return;
      }
      await copyExternalFilesToDir(ev.dataTransfer.files, tab.path, { reveal: true });
    };
    button.onmousedown = (ev) => {
      if (ev.button === 1) { ev.preventDefault(); closeFolderTab(tab.id); }
    };
    button.onauxclick = (ev) => {
      if (ev.button === 1) { ev.preventDefault(); closeFolderTab(tab.id); }
    };
    button.onkeydown = (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); switchFolderTab(tab.id); }
    };
    const label = document.createElement('span');
    label.className = 'folder-tab-label';
    label.textContent = tab.title;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'folder-tab-close';
    close.title = '关闭标签页';
    close.textContent = '×';
    close.onclick = (ev) => { ev.stopPropagation(); closeFolderTab(tab.id); };
    button.append(label, close);
    host.appendChild(button);
  });
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'folder-tab-new';
  add.title = '新建标签页';
  add.setAttribute('aria-label', '新建标签页');
  add.textContent = '+';
  add.onclick = (ev) => { ev.stopPropagation(); newFolderTab(); };
  host.appendChild(add);
  const active = host.querySelector('.folder-tab.active');
  if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function folderTabDropKind(dt) {
  if (!dt) return null;
  if (dt.types.includes('application/x-arca-folder-tab')) return 'tab';
  if (isInternalDrag(dt)) return 'internal';
  if (dt.types.includes('Files')) return 'external';
  return null;
}
function moveFolderTab(fromId, toId) {
  const from = state.folderTabs.findIndex((tab) => tab.id === fromId);
  const to = state.folderTabs.findIndex((tab) => tab.id === toId);
  if (from < 0 || to < 0 || from === to) return;
  const [tab] = state.folderTabs.splice(from, 1);
  state.folderTabs.splice(to, 0, tab);
  renderFolderTabs();
}
async function newFolderTab(path = state.cwd || state.home) {
  if (!path) return;
  syncActiveFolderTabNavigation();
  const tab = { id: 'tab-' + (++state.folderTabSeq), path, title: folderTabTitle(path), history: [], forwardHistory: [] };
  state.folderTabs.push(tab);
  state.activeFolderTab = tab.id;
  restoreFolderTabNavigation(tab);
  renderFolderTabs();
  await navigate(path, false);
}
async function openFolderInNewTab(path) {
  if (!path) return;
  await newFolderTab(path);
}
async function switchFolderTab(id) {
  const tab = state.folderTabs.find((t) => t.id === id);
  if (!tab) return;
  syncActiveFolderTabNavigation();
  state.activeFolderTab = tab.id;
  restoreFolderTabNavigation(tab);
  renderFolderTabs();
  syncNavButtons();
  if (tab.path && tab.path !== state.cwd) await navigate(tab.path, false);
}
function rememberClosedFolderTab(tab) {
  if (!tab) return;
  state.closedFolderTabs.push({
    path: tab.path,
    title: tab.title,
    history: [...(tab.history || [])],
    forwardHistory: [...(tab.forwardHistory || [])],
  });
}
async function closeFolderTab(id) {
  const idx = state.folderTabs.findIndex((t) => t.id === id);
  if (idx < 0) return;
  if (state.folderTabs.length <= 1) { closeCurrentWindow(); return; }
  const closed = state.folderTabs[idx];
  const wasActive = closed.id === state.activeFolderTab;
  state.folderTabs.splice(idx, 1);
  rememberClosedFolderTab(closed);
  if (wasActive) {
    const next = state.folderTabs[Math.min(idx, state.folderTabs.length - 1)];
    await switchFolderTab(next.id);
  } else {
    renderFolderTabs();
  }
}
async function closeOtherFolderTabs(id) {
  const keep = state.folderTabs.find((t) => t.id === id);
  if (!keep) return;
  syncActiveFolderTabNavigation();
  state.folderTabs.filter((tab) => tab.id !== id).forEach((tab) => rememberClosedFolderTab(tab));
  state.folderTabs = [keep];
  await switchFolderTab(id);
}
async function closeFolderTabsToRight(id) {
  const idx = state.folderTabs.findIndex((t) => t.id === id);
  if (idx < 0 || idx >= state.folderTabs.length - 1) return;
  syncActiveFolderTabNavigation();
  const removed = state.folderTabs.splice(idx + 1);
  removed.forEach((tab) => rememberClosedFolderTab(tab));
  if (!state.folderTabs.some((tab) => tab.id === state.activeFolderTab)) await switchFolderTab(state.folderTabs[idx].id);
  else { renderFolderTabs(); syncNavButtons(); }
}
function showFolderTabMenu(ev, tab) {
  ev.preventDefault();
  ev.stopPropagation();
  popupMenu(ev, [
    { label: '关闭标签页', fn: () => closeFolderTab(tab.id) },
    { label: '关闭其他标签页', fn: () => closeOtherFolderTabs(tab.id) },
    { label: '关闭右侧标签页', fn: () => closeFolderTabsToRight(tab.id) },
    { sep: true },
    { label: '复制路径', fn: () => copyPath(tab.path) },
  ]);
}
async function restoreClosedFolderTab() {
  const closed = state.closedFolderTabs.pop();
  if (!closed || !closed.path) return;
  syncActiveFolderTabNavigation();
  const tab = {
    id: 'tab-' + (++state.folderTabSeq),
    path: closed.path,
    title: closed.title || folderTabTitle(closed.path),
    history: [...(closed.history || [])],
    forwardHistory: [...(closed.forwardHistory || [])],
  };
  state.folderTabs.push(tab);
  state.activeFolderTab = tab.id;
  restoreFolderTabNavigation(tab);
  renderFolderTabs();
  await navigate(tab.path, false);
}
function stepFolderTab(direction) {
  if (state.folderTabs.length < 2) return;
  const idx = Math.max(0, state.folderTabs.findIndex((t) => t.id === state.activeFolderTab));
  const next = (idx + direction + state.folderTabs.length) % state.folderTabs.length;
  switchFolderTab(state.folderTabs[next].id);
}
function jumpFolderTab(slot) {
  if (!state.folderTabs.length) return false;
  const idx = slot === 9 ? state.folderTabs.length - 1 : slot - 1;
  const tab = state.folderTabs[Math.max(0, Math.min(state.folderTabs.length - 1, idx))];
  if (!tab || tab.id === state.activeFolderTab) return false;
  switchFolderTab(tab.id);
  return true;
}
// 汇总当前要监听的目录：浏览目录 + 每个终端会话的项目目录，发给主进程做增量监听
function updateWatches() {
  if (!window.fanboxFs) return;
  const dirs = new Set();
  if (state.cwd) dirs.add(state.cwd);
  if (typeof term !== 'undefined') term.sessions.forEach((s) => { if (s.startDir) dirs.add(s.startDir); });
  if (window.fanboxFs.watchSet) window.fanboxFs.watchSet([...dirs]);
  else window.fanboxFs.watch(state.cwd); // 旧版主进程兜底
}
// shell 单引号转义（用于把路径塞进终端 cd 命令）
function shQuote(s) { return `'${String(s).replace(/'/g, `'\\''`)}'`; }
function goBack() {
  if (!state.history.length || !state.cwd) return;
  const prev = state.history.pop();
  state.forwardHistory.push(state.cwd);
  navigate(prev, false);
}
function goForward() {
  if (!state.forwardHistory.length || !state.cwd) return;
  const next = state.forwardHistory.pop();
  state.history.push(state.cwd);
  navigate(next, false);
}
function goUp() { if (state.parent && state.parent !== state.cwd) navigate(state.parent); }
function goHome() { if (state.home) navigate(state.home); }
function goBackspace() {
  if (state.history.length) goBack();
  else goUp();
}
function isEditingTarget(el) {
  return !!(el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable || el.closest?.('[contenteditable="true"]')));
}
function toggleHiddenFiles(next) {
  state.showHidden = typeof next === 'boolean' ? next : !state.showHidden;
  localStorage.setItem('fb_hidden', state.showHidden ? '1' : '0');
  const cb = $('#toggle-hidden');
  if (cb) cb.checked = state.showHidden;
  renderFiles();
  toast(state.showHidden ? '已显示隐藏文件' : '已隐藏隐藏文件');
}
function handleMouseHistoryButton(ev) {
  if (ev.button !== 3 && ev.button !== 4) return;
  if (isEditingTarget(ev.target)) return;
  ev.preventDefault();
  ev.stopPropagation();
  ev.button === 3 ? goBack() : goForward();
}
function beginAddressEdit(selectAll = true) {
  if (state.skillsMode || state.recentMode || !state.cwd) return;
  const bc = $('#breadcrumb');
  if (!bc || bc.querySelector('.addr-input')) return;
  bc.classList.add('editing');
  bc.innerHTML = '';
  const input = document.createElement('input');
  input.className = 'addr-input';
  input.value = state.cwd;
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', '地址');
  const leave = () => { bc.classList.remove('editing'); renderBreadcrumb(); };
  const submit = async () => {
    const p = input.value.trim();
    if (!p || p === state.cwd) { leave(); return; }
    await navigate(p);
  };
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); submit(); }
    else if (ev.key === 'Escape') { ev.preventDefault(); leave(); }
  });
  input.addEventListener('blur', leave);
  bc.appendChild(input);
  input.focus();
  if (selectAll) input.select();
}

// ---------- 渲染 ----------
function syncNavButtons() {
  $('#btn-back').disabled = !state.history.length;
  $('#btn-forward').disabled = !state.forwardHistory.length;
}
function render() {
  renderFolderTabs();
  renderBreadcrumb();
  renderFiles();
  syncNavButtons();
  renderSidebarActive();
  syncPreviewPaneButton();
}
function renderBreadcrumb() {
  const bc = $('#breadcrumb');
  bc.innerHTML = '';
  bc.classList.remove('editing');
  bc.title = state.cwd || '';
  if (state.skillsMode) { bc.innerHTML = `<span class="crumb last">Skills 透视</span>`; return; }
  if (state.recentMode) { bc.innerHTML = `<span class="crumb last">${ic('clock', 'currentColor', 15)} 最近修改的文件</span>`; return; }
  if (state.virtualMode === 'this-pc') { bc.innerHTML = `<span class="crumb last">${ic('drive', 'currentColor', 15)} 此电脑</span>`; return; }
  (state.breadcrumb || []).forEach((c, i, arr) => {
    if (i > 0) { const s = document.createElement('span'); s.className = 'sep'; s.textContent = '›'; bc.appendChild(s); }
    const el = document.createElement('span');
    el.className = 'crumb' + (i === arr.length - 1 ? ' last' : '');
    if (c.name === '/') el.innerHTML = ic('monitor', 'currentColor', 15);
    else el.textContent = c.name;
    el.dataset.path = c.path;
    el.onclick = () => navigate(c.path);
    el.addEventListener('dragover', (ev) => {
      const t = ev.dataTransfer.types;
      if ((!isInternalDrag(ev.dataTransfer) && !t.includes('Files')) || state.skillsMode || state.recentMode) return;
      ev.preventDefault(); ev.stopPropagation();
      ev.dataTransfer.dropEffect = isInternalDrag(ev.dataTransfer) && !(ev.ctrlKey || ev.metaKey) ? 'move' : 'copy';
      el.classList.add('drop-target');
    });
    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
    el.addEventListener('drop', async (ev) => {
      const t = ev.dataTransfer.types;
      if ((!isInternalDrag(ev.dataTransfer) && !t.includes('Files')) || state.skillsMode || state.recentMode) return;
      ev.preventDefault(); ev.stopPropagation();
      el.classList.remove('drop-target');
      if (isInternalDrag(ev.dataTransfer)) {
        await dropInternalPathsToDir(internalDragPaths(ev.dataTransfer), c.path, ev.ctrlKey || ev.metaKey, { reveal: true });
        return;
      }
      await copyExternalFilesToDir([...(ev.dataTransfer.files || [])], c.path, { reveal: true });
    });
    bc.appendChild(el);
  });
  // 项目配对色点：当前浏览目录落在某个终端的项目里 → 末级面包屑挂同款色，和终端标签图标呼应
  if (typeof term !== 'undefined' && term.sessions.length) {
    const ts = term.sessions
      // 排掉 / 和家目录这类浅根：它们 startsWith 任何路径都成立，色点会常亮、配对语义失效
      .filter((s) => s.cwd && s.cwd !== '/' && s.cwd !== state.home && (state.cwd === s.cwd || (state.cwd || '').startsWith(s.cwd.replace(/\/$/, '') + '/')))
      .sort((a, b) => b.cwd.length - a.cwd.length)[0];
    if (ts) {
      const d = document.createElement('span');
      d.className = 'crumb-proj';
      d.style.background = `hsl(${term.hueOf(ts.cwd)} 62% 48%)`;
      d.title = '终端「' + (ts.title || '') + '」正在这个项目里干活';
      bc.appendChild(d);
    }
  }
  if (state.project) {
    const b = document.createElement('span');
    b.className = 'proj-badge';
    b.textContent = state.project.toUpperCase() + ' 项目';
    bc.appendChild(b);
  }
  // 滚到末尾，确保被挤压时也能看到当前所在目录（而非根目录）
  requestAnimationFrame(() => { bc.scrollLeft = bc.scrollWidth; });
}
function visibleEntries() {
  let list = state.entries.slice();
  if (!state.showHidden) list = list.filter((e) => !e.hidden);
  const q = String(state.filter || '').trim().toLocaleLowerCase('zh');
  if (q) list = list.filter((e) => searchKey(e).includes(q));
  const dirFirst = (a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : 0);
  const dirMul = state.sortDir === 'desc' ? -1 : 1;
  const byNum = (key) => (a, b) => ((a[key] || 0) - (b[key] || 0)) * dirMul || compareName(a, b);
  const byText = (a, b) => compareName(a, b) * dirMul;
  const byKind = (a, b) => compareKind(a, b) * dirMul;
  // 最近修改视图：以时间为本义，默认按 mtime 倒序（用户可显式切到大小/名称）
  if (state.recentMode && state.sort === 'name') list.sort((a, b) => byText(a, b));
  else if (state.sort === 'mtime') list.sort((a, b) => dirFirst(a, b) || byNum('mtime')(a, b));
  else if (state.sort === 'btime') list.sort((a, b) => dirFirst(a, b) || byNum('btime')(a, b));
  else if (state.sort === 'size') list.sort((a, b) => dirFirst(a, b) || byNum('size')(a, b));
  else if (state.sort === 'kind') list.sort((a, b) => dirFirst(a, b) || byKind(a, b));
  else list.sort((a, b) => dirFirst(a, b) || byText(a, b));
  return list;
}
function sortButtonLabel(sort, label) {
  const active = state.sort === sort;
  const arrow = active ? (state.sortDir === 'asc' ? '↑' : '↓') : '';
  const aria = active ? (state.sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
  return `<button class="list-sort ${active ? 'active' : ''}" data-sort="${sort}" aria-sort="${aria}" title="按${label}排序">${label}<span>${arrow}</span></button>`;
}
function setSort(sort, dir) {
  if (!['name', 'mtime', 'btime', 'kind', 'size'].includes(sort)) sort = 'name';
  const nextDir = dir || (state.sort === sort ? (state.sortDir === 'asc' ? 'desc' : 'asc') : defaultSortDir(sort));
  state.sort = sort;
  state.sortDir = nextDir === 'asc' ? 'asc' : 'desc';
  localStorage.setItem('fb_sort', state.sort);
  localStorage.setItem('fb_sort_dir', state.sortDir);
  syncSortControls();
  renderFiles();
}
function syncSortControls() {
  const seg = $('#sort-seg'); if (!seg) return;
  seg.querySelectorAll('button').forEach((b) => {
    const active = b.dataset.sort === state.sort;
    b.classList.toggle('active', active);
    b.dataset.dir = active ? state.sortDir : '';
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}
function applyListColVars() {
  Object.entries(LIST_COL_DEFAULTS).forEach(([k, v]) => {
    const px = Math.max(64, Math.min(260, Number(state.listCols[k]) || v));
    document.documentElement.style.setProperty(`--list-${k}-w`, `${px}px`);
  });
}
function saveListCols() {
  localStorage.setItem('fb_list_cols', JSON.stringify(state.listCols));
}
function listColText(col, e) {
  if (col === 'mtime') return fmtTime(e.mtime);
  if (col === 'btime') return fmtTime(e.btime);
  if (col === 'kind') return kindLabel(e);
  if (col === 'size') return e.isDir ? '' : fmtSize(e.size);
  return '';
}
function autoFitListCol(col) {
  if (!LIST_COL_DEFAULTS[col]) return;
  const sample = document.querySelector('.list .row .meta') || document.body;
  const st = getComputedStyle(sample);
  const canvas = autoFitListCol.canvas || (autoFitListCol.canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
  const header = ({ mtime: '修改时间', btime: '创建时间', kind: '类型', size: '大小' })[col] || '';
  let w = ctx.measureText(header).width + 34; // 排序箭头 + 拖拽热区
  for (const e of state.visible || []) {
    w = Math.max(w, ctx.measureText(listColText(col, e)).width + 18);
  }
  state.listCols[col] = Math.max(64, Math.min(260, Math.ceil(w)));
  applyListColVars();
  saveListCols();
}
function sortHeadCell(sort, label, resizable = false) {
  return `<div class="list-col list-col-${sort}">${sortButtonLabel(sort, label)}${resizable ? `<span class="col-resize" data-col="${sort}" title="拖动调整列宽"></span>` : ''}</div>`;
}
function bindListColumnResize(head) {
  head.querySelectorAll('.col-resize').forEach((h) => {
    h.ondblclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      autoFitListCol(h.dataset.col);
    };
    h.onmousedown = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const col = h.dataset.col;
      const startX = ev.clientX;
      const startW = Number(state.listCols[col]) || LIST_COL_DEFAULTS[col];
      document.body.classList.add('list-col-resizing');
      const move = (e) => {
        const next = Math.max(64, Math.min(260, startW + e.clientX - startX));
        state.listCols[col] = next;
        applyListColVars();
      };
      const up = () => {
        document.body.classList.remove('list-col-resizing');
        saveListCols();
        document.removeEventListener('mousemove', move, true);
        document.removeEventListener('mouseup', up, true);
      };
      document.addEventListener('mousemove', move, true);
      document.addEventListener('mouseup', up, true);
    };
  });
}
function syncFilterUi(force = false) {
  const inp = $('#file-filter');
  const clear = $('#file-filter-clear');
  if (!inp || !clear) return;
  if (force || document.activeElement !== inp) inp.value = state.filter || '';
  clear.classList.toggle('show', !!state.filter);
}
function setFileFilter(q) {
  state.filter = String(q || '').trim();
  state.selected = null;
  state.multiSel.clear();
  state.selectionAnchor = null;
  state.cursor = -1;
  state.typeAhead = { text: '', ts: 0 };
  syncFilterUi();
  renderFiles();
}
function clearFileFilterFromKeyboard() {
  if (!state.filter) return false;
  setFileFilter('');
  focusFileArea();
  toast('已清空当前目录搜索');
  return true;
}
function focusFileFilter() {
  const inp = $('#file-filter');
  if (!inp || state.skillsMode) return;
  inp.focus();
  inp.select();
}
function focusFileArea() {
  const area = $('#file-area');
  if (!area || state.skillsMode) return;
  if (state.cursor < 0 && state.visible.length) {
    state.cursor = state.selected ? state.visible.findIndex((e) => e.path === state.selected) : 0;
    if (state.cursor < 0) state.cursor = 0;
    highlightCursor(true);
  }
  $('#file-area').focus();
}
function focusPreviewPane() {
  if (!previewVisible()) return false;
  $('#preview-body').focus();
  return true;
}
function focusDockPanel() {
  const panel = $('#terminal-panel');
  if (!panel || panel.classList.contains('hidden')) return false;
  if (panel.classList.contains('chat-mode')) {
    const input = $('#chat-input');
    if (input) { $('#chat-input').focus(); return true; }
  }
  const s = typeof term !== 'undefined' ? term.sessions.find((x) => x.id === term.active) : null;
  if (s && s.xterm) { s.xterm.focus(); return true; }
  const button = panel.querySelector('button:not([disabled])');
  if (button) { button.focus(); return true; }
  return false;
}
function currentFocusZone() {
  const active = document.activeElement;
  if (!active) return 'files';
  if (active.classList && active.classList.contains('addr-input')) return 'address';
  if (active === $('#file-filter') || active.closest('.top-search')) return 'search';
  if (active === $('#file-area') || active.closest('#file-area') || active.closest('#content')) return 'files';
  if (active.closest('#preview')) return 'preview';
  if (active.closest('#terminal-panel')) return 'dock';
  if (active.closest('#breadcrumb')) return 'address';
  return 'files';
}
function focusFileManagerZone(zone) {
  if (zone === 'address') { beginAddressEdit(); return; }
  if (zone === 'search') { focusFileFilter(); return; }
  if (zone === 'preview') { focusPreviewPane(); return; }
  if (zone === 'dock') { focusDockPanel(); return; }
  focusFileArea();
}
function cycleFileManagerFocus(backward = false) {
  const zones = ['address', 'files', 'search'];
  if (previewVisible()) zones.push('preview');
  const dock = $('#terminal-panel');
  if (dock && !dock.classList.contains('hidden')) zones.push('dock');
  const current = currentFocusZone();
  const i = zones.indexOf(current);
  const next = i < 0 ? 0 : (i + (backward ? -1 : 1) + zones.length) % zones.length;
  focusFileManagerZone(zones[next]);
}
// 底部状态条：当前文件夹的基础信息小字常驻，「占用透视」入口也安在这
function renderStatusbar() {
  const sb = $('#statusbar'); if (!sb) return;
  if (state.skillsMode || state.recentMode || !state.cwd) { sb.classList.add('hidden'); return; }
  const stats = state.visibleStats || { count: 0, dirs: 0, files: 0, bytes: 0 };
  const selected = state.selectionStats || { count: 0, dirs: 0, files: 0, bytes: 0 };
  const totalText = `${stats.count} 项${stats.dirs ? ` · ${stats.dirs} 文件夹` : ''}${stats.files ? ` · ${stats.files} 文件 ${fmtSize(stats.bytes)}` : ''}`;
  const selectedText = selected.count
    ? `<b class="sb-selected">已选 ${selected.count} 项${selected.dirs ? ` · ${selected.dirs} 文件夹` : ''}${selected.files ? ` · ${selected.files} 文件 ${fmtSize(selected.bytes)}` : ''}</b><span class="sb-total"> · 共 ${totalText}</span>`
    : totalText;
  sb.classList.remove('hidden');
  sb.innerHTML = `<span class="sb-summary">${selectedText}</span><span class="sb-links">${state.project ? '<a id="sb-rel" title="版本号→CHANGELOG→打包→push→Release 一条龙，在终端跑">发版</a>' : ''}<a id="sb-mem" title="这个文件夹里 AI 干过什么：历史会话、改过的文件、一键续上">项目记忆</a><a id="sb-du" title="算上子目录的真实磁盘占用">占用透视</a></span>`;
  $('#sb-du').onclick = () => diskPanel(state.cwd);
  $('#sb-mem').onclick = () => memoryPanel(state.cwd);
  const rel = $('#sb-rel'); if (rel) rel.onclick = () => releasePanel();
}
function appendEntryRange(parent, list, from, to, makeEl) {
  const frag = document.createDocumentFragment();
  for (let i = from; i < to; i++) frag.appendChild(makeEl(list[i], i));
  parent.appendChild(frag);
}
function loadLazyThumb(img) {
  if (!img || img.dataset.loadedThumb === '1') return;
  const src = img.dataset.src;
  if (!src) return;
  img.src = src;
  img.dataset.loadedThumb = '1';
  delete img.dataset.src;
}
function getThumbObserver() {
  if (!('IntersectionObserver' in window)) return null;
  if (thumbObserver) return thumbObserver;
  thumbObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadLazyThumb(entry.target);
      thumbObserver.unobserve(entry.target);
    });
  }, { root: $('#content'), rootMargin: '520px 0px', threshold: 0.01 });
  return thumbObserver;
}
function hydrateThumbs(root) {
  const imgs = (root || document).querySelectorAll('img[data-src]:not([data-thumb-bound])');
  if (!imgs.length) return;
  const obs = getThumbObserver();
  imgs.forEach((img) => {
    img.dataset.thumbBound = '1';
    if (obs) obs.observe(img);
    else loadLazyThumb(img);
  });
}
function scheduleEntryChunks(parent, list, from, makeEl, seq, onChunk, onDone) {
  if (from >= list.length) { if (onDone) onDone(); return; }
  const schedule = window.requestIdleCallback
    ? (fn) => window.requestIdleCallback(fn, { timeout: 80 })
    : (fn) => window.setTimeout(() => fn(), 16);
  let index = from;
  const run = () => {
    if (seq !== state.renderSeq) return;
    const next = Math.min(list.length, index + RENDER_BATCH);
    appendEntryRange(parent, list, index, next, makeEl);
    hydrateThumbs(parent);
    index = next;
    if (onChunk) onChunk();
    if (index < list.length) schedule(run);
    else if (onDone) onDone();
  };
  schedule(run);
}
function renderFiles() {
  if (state.skillsMode) return; // skills 视图自管 #file-area，文件渲染不要清掉它
  const area = $('#file-area');
  const seq = ++state.renderSeq;
  const list = visibleEntries();
  state.visible = list;
  state.entryByPath = new Map(list.map((e) => [e.path, e]));
  state.domByPath = new Map();
  let dirs = 0, bytes = 0;
  for (const e of list) {
    if (e.isDir) dirs++;
    else bytes += e.size || 0;
  }
  state.visibleStats = { count: list.length, dirs, files: list.length - dirs, bytes };
  state.selectionStats = computeSelectionStats();
  renderStatusbar();
  if (!list.length) {
    const emptyMsg = state.filter ? `没有匹配「${escapeHtml(state.filter)}」的项目` : (state.recentMode ? '没找到最近修改的文件' : '这个文件夹是空的');
    const emptyIc = state.filter ? 'search' : (state.recentMode ? 'clock' : 'inbox');
    area.innerHTML = `<div class="empty-state"><div class="big">${ic(emptyIc, 'currentColor', 48)}</div>${emptyMsg}</div>`;
    return;
  }
  const chunked = list.length > LARGE_RENDER_THRESHOLD;
  const firstBatch = chunked ? Math.min(FIRST_RENDER_BATCH, list.length) : list.length;
  // 最近修改是跨目录平铺列表，强制列表视图并显示来源目录
  if (state.recentMode || state.view === 'list') {
    applyListColVars();
    const wrap = document.createElement('div');
    wrap.className = 'list';
    const head = document.createElement('div');
    head.className = 'row list-head';
    head.innerHTML = `<div></div>${sortHeadCell('name', '名称')}${sortHeadCell('mtime', '修改时间', true)}${sortHeadCell('btime', '创建时间', true)}${sortHeadCell('kind', '类型', true)}${sortHeadCell('size', '大小', true)}<div></div>`;
    head.querySelectorAll('.list-sort').forEach((b) => { b.onclick = () => setSort(b.dataset.sort); });
    bindListColumnResize(head);
    wrap.appendChild(head);
    appendEntryRange(wrap, list, 0, firstBatch, listRow);
    area.replaceChildren(wrap);
    hydrateThumbs(wrap);
    const finishList = () => {
      if (seq !== state.renderSeq) return;
      if (state.recentMode && state.recentTruncated) area.insertAdjacentHTML('beforeend', truncNote());
      paintSelection(true);
      paintCutMarks(true);
      highlightCursor(true);
    };
    if (chunked) scheduleEntryChunks(wrap, list, firstBatch, listRow, seq, () => { paintSelection(true); paintCutMarks(true); highlightCursor(true); }, finishList);
    else finishList();
    state.cols = 1;
    return;
  }
  // 至此只剩网格视图（列表/最近已在上面提前返回）
  const grid = document.createElement('div');
  grid.className = 'grid size-' + state.gridSize;
  appendEntryRange(grid, list, 0, firstBatch, gridItem);
  area.replaceChildren(grid);
  hydrateThumbs(grid);
  measureCols();
  if (chunked) {
    scheduleEntryChunks(grid, list, firstBatch, gridItem, seq, () => {
      paintSelection(true);
      paintCutMarks(true);
      highlightCursor(true);
    }, () => {
      if (seq !== state.renderSeq) return;
      measureCols();
      paintSelection(true);
      paintCutMarks(true);
      highlightCursor(true);
    });
  }
  paintSelection(true);
  paintCutMarks(true);
  highlightCursor(true);
}
function fileScrollTop() {
  const host = $('#content');
  return host ? host.scrollTop : 0;
}
function restoreFileScrollTop(top) {
  const host = $('#content');
  if (host) host.scrollTop = top;
}
function measureCols() {
  const items = $('#file-area').querySelectorAll('.item');
  if (!items.length) { state.cols = 1; return; }
  const top0 = items[0].offsetTop;
  let c = 0;
  for (const it of items) { if (it.offsetTop === top0) c++; else break; }
  state.cols = Math.max(1, c);
}
function favBtn(e) {
  if (e.isDrive) return '<span class="fav-spacer"></span>';
  const on = isFav(e.path);
  return `<span class="fav-btn ${on ? 'on' : ''}" title="收藏">${svgWrap(SVG.star, 'currentColor', 15, on)}</span>`;
}
function thumbHtml(e) {
  if (e.isDrive) {
    const used = Math.round(Math.min(1, Math.max(0, e.usedRatio || 0)) * 100);
    const cap = fmtDriveFree(e);
    return `<span class="svg-icon drive-tile-icon">${ic('drive', 'currentColor', 56)}</span>${cap ? `<span class="drive-tile-capacity">${escapeHtml(cap)}</span><span class="drive-bar" aria-hidden="true"><i class="drive-used" style="width:${used}%"></i></span>` : ''}`;
  }
  // 关键性能修复：用缩略图端点（sips/qlmanage 缓存小图），不再把原图/原视频整文件拉进来解码
  if (e.kind === 'image' || e.kind === 'video') {
    const w = state.gridSize === 'lg' ? 320 : (state.gridSize === 'sm' ? 160 : 240);
    const fb = e.kind === 'video' ? 'window.__svgVideo' : 'window.__svgImg';
    const src = `/api/thumb?path=${encodeURIComponent(e.path)}&w=${w}&v=${e.mtime || 0}`;
    // 照片按原比例呈现（object-fit:contain）+ 柔和投影，像散落的照片；缩略图失败回退强色字形
    const img = `<img class="thumb js-lazy-thumb" loading="lazy" decoding="async" src="${THUMB_PLACEHOLDER}" data-src="${escapeHtml(src)}" alt="" onerror="this.closest('.thumb-wrap').replaceWith(Object.assign(document.createElement('span'),{className:'svg-icon',innerHTML:${fb}}))">`;
    const play = e.kind === 'video' ? '<span class="play-badge"><svg viewBox="0 0 24 24" width="40%" height="40%"><path d="M8 5.5l11 6.5-11 6.5z" fill="#fff"/></svg></span>' : '';
    return `<span class="thumb-wrap${e.kind === 'video' ? ' is-video' : ''}">${img}${play}</span>`;
  }
  const gs = state.gridSize;
  // 文件夹比文件略大，强化「容器」存在感；按网格尺寸分三档
  const sz = e.isDir
    ? (gs === 'lg' ? 84 : gs === 'sm' ? 46 : 64)
    : (gs === 'lg' ? 72 : gs === 'sm' ? 40 : 56);
  return `<span class="svg-icon">${iconSvg(e, sz)}</span>`;
}
// 项目类型徽章：文件夹卡片上标 node/web/py… 一眼认出 AI 起的项目
const PROJ_LABEL = { node: 'node', web: 'web', python: 'py', rust: 'rs', go: 'go', git: 'git' };
function projBadge(e) {
  if (!e.isDir || !e.project || !PROJ_LABEL[e.project]) return '';
  return `<span class="proj-tag proj-${e.project}">${PROJ_LABEL[e.project]}</span>`;
}
function setFileClip(op, paths) {
  const list = (paths || []).filter(Boolean);
  state.fileClip = op && list.length ? { op, paths: list } : null;
  state.fileClipSet = op === 'cut' ? new Set(list) : new Set();
}
function cutPaths() {
  return (state.fileClip && state.fileClip.op === 'cut') ? state.fileClip.paths || [] : [];
}
function isCutPath(path) {
  return state.fileClipSet.has(path);
}
function clearRenameClickTimer() {
  if (state.renameClick.timer) clearTimeout(state.renameClick.timer);
  state.renameClick.timer = null;
}
function maybeRenameBySlowClick(ev, el, e, wasSelected) {
  clearRenameClickTimer();
  if (!wasSelected || ev.detail > 1 || ev.ctrlKey || ev.metaKey || ev.shiftKey || state.skillsMode || state.recentMode) {
    state.renameClick = { path: e.path, ts: Date.now(), timer: null };
    return false;
  }
  if (!ev.target.closest('.fname') || ev.target.closest('.rename-inline')) return false;
  const last = state.renameClick && state.renameClick.path === e.path ? state.renameClick.ts : 0;
  state.renameClick = { path: e.path, ts: Date.now(), timer: null };
  if (!last || Date.now() - last < 420) return false;
  state.renameClick.timer = setTimeout(() => {
    state.renameClick.timer = null;
    if (!document.body.contains(el) || el.classList.contains('renaming')) return;
    if (state.selected !== e.path || state.multiSel.size) return;
    doRename(e);
  }, 260);
  return true;
}
function gridItem(e, i) {
  const el = document.createElement('div');
  const chg = state.changed && state.changed.get(e.name);
  el.className = 'item' + (e.isDir ? ' is-dir' : ' is-file') + (e.hidden ? ' hidden-file' : '') + (state.multiSel.has(e.path) || state.selected === e.path ? ' selected' : '') + (isCutPath(e.path) ? ' cutting' : '') + (chg ? ' changed' : '');
  el.dataset.idx = i;
  el.dataset.path = e.path;
  if (chg) { el.dataset.changed = chg.count > 1 ? '改·' + chg.count : '改'; el.style.setProperty('--heat', Math.min(1, 0.4 + chg.count * 0.12).toFixed(2)); if (chg.files.size) el.title = '刚变更：\n' + [...chg.files].join('\n'); }
  el.innerHTML = `<div class="icon" style="--tint:${iconColorFor(e)}">${thumbHtml(e)}${projBadge(e)}</div><div class="fname">${escapeHtml(e.name)}</div>${favBtn(e)}`;
  bindItem(el, e);
  return el;
}
function listRow(e, i) {
  const el = document.createElement('div');
  const chgR = state.changed && state.changed.get(e.name);
  el.className = 'row' + (e.isDir ? ' is-dir' : ' is-file') + (e.hidden ? ' hidden-file' : '') + (state.multiSel.has(e.path) || state.selected === e.path ? ' selected' : '') + (isCutPath(e.path) ? ' cutting' : '') + (chgR ? ' changed' : '');
  el.dataset.idx = i;
  el.dataset.path = e.path;
  if (chgR) { el.dataset.changed = chgR.count > 1 ? '改·' + chgR.count : '改'; el.style.setProperty('--heat', Math.min(1, 0.4 + chgR.count * 0.12).toFixed(2)); if (chgR.files.size) el.title = '刚变更：\n' + [...chgR.files].join('\n'); }
  // 最近修改是跨目录列表，名称后缀显示来源目录，方便区分同名文件
  const dirHint = state.recentMode ? ` <span class="row-dir">· ${escapeHtml(tilde(e.dir || dirOf(e.path)))}</span>` : '';
  const thumbSrc = `/api/thumb?path=${encodeURIComponent(e.path)}&w=96&v=${e.mtime || 0}`;
  el.innerHTML = `<div class="icon">${(e.kind === 'image' || e.kind === 'video') ? `<img class="thumb-sm js-lazy-thumb" loading="lazy" decoding="async" src="${THUMB_PLACEHOLDER}" data-src="${escapeHtml(thumbSrc)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'svg-icon',innerHTML:this.dataset.fb||''}))" data-fb='${escapeHtml(iconSvg(e, 18))}'>` : `<span class="svg-icon">${iconSvg(e, 18)}</span>`}</div>
    <div class="fname">${escapeHtml(e.name)}${projBadge(e)}${dirHint}</div>
    <div class="meta">${fmtTime(e.mtime)}</div>
    <div class="meta">${fmtTime(e.btime)}</div>
    <div class="meta type-meta">${kindLabel(e)}</div>
    <div class="meta">${e.isDir ? '' : fmtSize(e.size)}</div>
    ${favBtn(e)}`;
  bindItem(el, e);
  return el;
}
function bindItem(el, e) {
  registerEntryElement(el, e.path);
  // 拖拽到终端：把路径作为上下文喂给 coding agent
  el.draggable = true;
  el.addEventListener('dragstart', (ev) => {
    // 拖的是已选中项时整组一起拖(多选)；text/plain 保持单路径(喂终端/编辑器的旧约定不破)
    const group = selPaths().includes(e.path) ? selPaths() : [e.path];
    ev.dataTransfer.setData('text/plain', e.path);
    ev.dataTransfer.setData('application/x-fanbox-path', e.path);
    ev.dataTransfer.setData('application/x-fanbox-paths', JSON.stringify(group));
    // 拖图片进 md 编辑器：插入原文件路径引用。不带这条时浏览器默认抓的是卡片缩略图的
    // /api/thumb?w=160 链接，低清且写进文档发出去就裂
    if (e.kind === 'image') ev.dataTransfer.setData('text/html', `<img src="${escapeHtml(encodeURI(e.path))}" alt="${escapeHtml(e.name)}">`);
    ev.dataTransfer.effectAllowed = 'copyMove';
    if (window.fanboxDrag && window.fanboxDrag.start) window.fanboxDrag.start(group);
  });
  el.onclick = (ev) => {
    if (ev.target.closest('.fav-btn')) { ev.stopPropagation(); toggleFav(e); return; }
    if (ev.altKey) { clearRenameClickTimer(); return; }
    const wasSelected = state.selected === e.path && state.multiSel.size === 0;
    state.cursor = Number(el.dataset.idx);
    if (ev.ctrlKey || ev.metaKey) { toggleMultiSel(e); return; } // Ctrl+点击多选
    if (ev.shiftKey) { rangeSelect(Number(el.dataset.idx)); return; } // Shift+点击范围选
    onItemClick(e);
    maybeRenameBySlowClick(ev, el, e, wasSelected);
  };
  el.ondblclick = (ev) => {
    clearRenameClickTimer();
    if (ev.target.closest('.fav-btn')) return;
    if (ev.altKey) {
      ev.preventDefault();
      propertiesPanel((state.multiSel.has(e.path) ? selEntries() : [e]).filter(Boolean));
      return;
    }
    onItemOpen(e);
  };
  el.addEventListener('auxclick', (ev) => {
    if (ev.button === 1 && e.isDir) {
      ev.preventDefault();
      ev.stopPropagation();
      clearRenameClickTimer();
      openNewWindow(e.path);
    }
  });
  el.oncontextmenu = (ev) => { state.cursor = Number(el.dataset.idx); showContextMenu(ev, e); };
}
// 让任意元素可拖拽出一个路径（侧栏目录/收藏 → 终端）
function makeDraggablePath(el, p) {
  el.draggable = true;
  el.addEventListener('dragstart', (ev) => {
    ev.dataTransfer.setData('text/plain', p);
    ev.dataTransfer.setData('application/x-fanbox-path', p);
    ev.dataTransfer.effectAllowed = 'copy';
    if (window.fanboxDrag && window.fanboxDrag.start) window.fanboxDrag.start([p]);
  });
}
function bindSidebarDropTarget(li, dirPath) {
  li.addEventListener('dragover', (ev) => {
    const t = ev.dataTransfer.types;
    if (!isInternalDrag(ev.dataTransfer) && !t.includes('Files')) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.dataTransfer.dropEffect = isInternalDrag(ev.dataTransfer) && !(ev.ctrlKey || ev.metaKey) ? 'move' : 'copy';
    li.classList.add('drop-target');
  });
  li.addEventListener('dragleave', (ev) => {
    if (!li.contains(ev.relatedTarget)) li.classList.remove('drop-target');
  });
  li.addEventListener('drop', async (ev) => {
    const t = ev.dataTransfer.types;
    if (!isInternalDrag(ev.dataTransfer) && !t.includes('Files')) return;
    ev.preventDefault();
    ev.stopPropagation();
    li.classList.remove('drop-target');
    if (isInternalDrag(ev.dataTransfer)) {
      await dropInternalPathsToDir(internalDragPaths(ev.dataTransfer), dirPath, ev.ctrlKey || ev.metaKey);
      return;
    }
    await copyExternalFilesToDir([...(ev.dataTransfer.files || [])], dirPath, {
      refresh: pathContains(state.cwd, dirPath) || pathContains(dirPath, state.cwd),
    });
  });
}
function registerEntryElement(el, path) {
  if (el && path) state.domByPath.set(path, el);
}
function entryElByPath(path) {
  const area = $('#file-area');
  if (!area || !path) return null;
  const cached = state.domByPath.get(path);
  if (cached && cached.isConnected) return cached;
  const found = area.querySelector(`[data-path="${CSS.escape(path)}"]`);
  if (found) registerEntryElement(found, path);
  return found;
}
// 只切换变化项的 class，绝不重建/全量扫描；大目录方向键移动保持轻快
function paintSelection(force = false) {
  if (force) {
    state.paintedSelected.clear();
  }
  const paths = selPaths();
  const next = new Set(paths);
  state.paintedSelected.forEach((p) => {
    if (!next.has(p)) {
      const el = entryElByPath(p);
      if (el) el.classList.remove('selected');
    }
  });
  next.forEach((p) => {
    if (!state.paintedSelected.has(p)) {
      const el = entryElByPath(p);
      if (el) el.classList.add('selected');
    }
  });
  state.paintedSelected = next;
  state.selectionStats = computeSelectionStats(paths);
  renderStatusbar();
}
function paintCutMarks(force = false) {
  if (force) {
    state.paintedCut.clear();
  }
  const next = new Set(cutPaths());
  state.paintedCut.forEach((p) => {
    if (!next.has(p)) {
      const el = entryElByPath(p);
      if (el) el.classList.remove('cutting');
    }
  });
  next.forEach((p) => {
    if (!state.paintedCut.has(p)) {
      const el = entryElByPath(p);
      if (el) el.classList.add('cutting');
    }
  });
  state.paintedCut = next;
}
function applySelection(path) {
  state.multiSel.clear();
  state.selected = path;
  state.selectionAnchor = path;
  paintSelection();
}
function selectVisiblePaths(paths) {
  const wanted = new Set((paths || []).filter(Boolean));
  const visible = state.visible.filter((e) => wanted.has(e.path)).map((e) => e.path);
  if (!visible.length) return false;
  if (visible.length === 1) {
    state.multiSel.clear();
    state.selected = visible[0];
  } else {
    state.multiSel = new Set(visible);
    state.selected = visible[0];
  }
  state.selectionAnchor = state.selected;
  state.cursor = state.visible.findIndex((e) => e.path === state.selected);
  paintSelection();
  highlightCursor();
  return true;
}
function internalDragPaths(dt) {
  if (!dt) return [];
  let paths = [];
  try { paths = JSON.parse(dt.getData('application/x-fanbox-paths') || '[]'); } catch { /* ignore */ }
  if (!paths.length) {
    const p = dt.getData('application/x-fanbox-path') || dt.getData('text/plain');
    if (p) paths = [p];
  }
  return [...new Set(paths.filter(Boolean))];
}
function isInternalDrag(dt) {
  return !!(dt && (dt.types.includes('application/x-fanbox-paths') || dt.types.includes('application/x-fanbox-path')));
}
async function dropInternalPathsToDir(paths, dstDir, copy, opts = {}) {
  const norm = (p) => String(p || '').replace(/[\\/]+$/, '');
  const target = norm(dstDir);
  let okCount = 0, lastErr = '';
  const undoItems = [];
  for (const src of paths || []) {
    if (norm(src) === target || norm(dirOf(src)) === target) continue;
    const r = await apiPost(copy ? '/api/copy-in' : '/api/move', { src, dstDir }).catch((err) => ({ ok: false, error: err.message }));
    if (r.ok) {
      okCount++;
      if (copy) undoItems.push({ path: r.path, from: src });
      else undoItems.push({ from: src, to: r.path });
    } else lastErr = r.error || (copy ? '复制失败' : '移动失败');
  }
  if (okCount) {
    pushUndo({ type: copy ? 'copy' : 'move', items: undoItems, label: copy ? '复制' : '移动' });
    toast(`已${copy ? '复制' : '移动'} ${okCount} 个到 ${baseOf(dstDir) || dstDir}`);
    state.multiSel.clear();
    const resultPaths = undoItems.map((it) => it.to || it.path);
    if (opts.reveal && norm(state.cwd) !== target) {
      await navigate(dstDir);
    } else {
      await refresh();
    }
    selectVisiblePaths(resultPaths);
  }
  if (lastErr) toast(lastErr, true);
  return okCount;
}
async function copyExternalFilesToDir(files, dstDir, opts = {}) {
  const list = [...(files || [])];
  if (!list.length) return 0;
  const norm = (p) => String(p || '').replace(/[\\/]+$/, '');
  const target = norm(dstDir);
  let okCount = 0, lastErr = '';
  const undoItems = [];
  for (const f of list) {
    const src = window.fanboxDrop && window.fanboxDrop.pathForFile(f);
    if (src) {
      const r = await apiPost('/api/copy-in', { src, dstDir }).catch((err) => ({ ok: false, error: err.message }));
      if (r.ok) { okCount++; undoItems.push({ path: r.path, from: src }); }
      else lastErr = r.error || '复制失败';
    } else if (f.size <= 64 * 1024 * 1024) {
      // 浏览器版拿不到源路径：直接把内容写进目标目录。
      try {
        const buf = await f.arrayBuffer();
        const dest = target + state.sep + f.name;
        const r = await apiPost('/api/write-binary', { path: dest, base64: abToBase64(buf) });
        if (r.ok) { okCount++; undoItems.push({ path: r.path || dest, from: f.name }); }
        else lastErr = r.error || '写入失败';
      } catch (err) { lastErr = err.message; }
    } else {
      lastErr = `${f.name} 超过 64MB，浏览器版无法导入，请用桌面版`;
    }
  }
  if (okCount) {
    pushUndo({ type: 'copy', items: undoItems, label: '复制' });
    toast(`已复制 ${okCount} 个到 ${baseOf(dstDir) || dstDir}`);
    if (opts.reveal && norm(state.cwd) !== target) await navigate(dstDir);
    else if (opts.refresh !== false) await refresh();
    selectVisiblePaths(undoItems.map((it) => it.path).filter(Boolean));
  }
  if (lastErr) toast(lastErr, true);
  return okCount;
}
function selectNearestIndex(idx) {
  if (!state.visible.length) { clearSelection(); return false; }
  const next = Math.max(0, Math.min(state.visible.length - 1, idx));
  const e = state.visible[next];
  state.multiSel.clear();
  state.selected = e.path;
  state.selectionAnchor = e.path;
  state.cursor = next;
  paintSelection();
  highlightCursor();
  return true;
}
function normSidebarPath(p) {
  let s = String(p || '').replace(/\\/g, '/').replace(/\/+$/, '');
  if (/^[A-Za-z]:$/.test(s)) s += '/';
  return state.platform === 'win32' ? s.toLowerCase() : s;
}
function pathContains(base, target) {
  const b = normSidebarPath(base);
  const t = normSidebarPath(target);
  if (!b || !t) return false;
  if (b === t) return true;
  if (/^[A-Za-z]:\/?$/i.test(b)) return t.startsWith(b);
  return t.startsWith(b + '/');
}
// 当前生效的选择集：多选优先，否则单选
function selPaths() {
  if (state.multiSel.size) return [...state.multiSel];
  return state.selected ? [state.selected] : [];
}
function selEntries() {
  return selPaths().map((p) => state.entryByPath.get(p)).filter(Boolean);
}
function currentEntry() {
  if (state.visible[state.cursor]) return state.visible[state.cursor];
  return state.selected ? state.entryByPath.get(state.selected) : null;
}
function selectedOrCurrentEntries() {
  const items = selEntries();
  const cur = currentEntry();
  if (!items.length && cur) items.push(cur);
  return items;
}
function mutableSelectedEntries() {
  const items = selectedOrCurrentEntries();
  if (items.some((it) => it.isDrive)) { toast('不能对盘符执行文件操作', true); return []; }
  return items;
}
function computeSelectionStats(paths = selPaths()) {
  let count = 0; let dirs = 0; let bytes = 0;
  for (const p of paths) {
    const e = state.entryByPath.get(p);
    if (!e) continue;
    count++;
    if (e.isDir) dirs++;
    else bytes += e.size || 0;
  }
  return { count, dirs, files: count - dirs, bytes };
}
function selectAllVisible() {
  state.multiSel = new Set(state.visible.map((x) => x.path));
  state.selected = state.visible[0] ? state.visible[0].path : null;
  state.selectionAnchor = state.selected;
  paintSelection();
}
function clearSelection() {
  state.multiSel.clear();
  state.selected = null;
  state.selectionAnchor = null;
  paintSelection();
  if (previewVisible()) {
    $('#preview-title').textContent = '未选择文件';
    $('#preview-actions').innerHTML = '';
    renderPreviewFoot(null);
    $('#preview-body').innerHTML = `<div class="empty-state"><div class="big">${ic('inbox', 'currentColor', 48)}</div>选择一个文件即可预览</div>`;
  }
}
function restoreSelectionAfterRefresh(oldSelected, oldMultiSel, oldAnchor, oldCursor) {
  const kept = [...oldMultiSel].filter((p) => state.entryByPath.has(p));
  state.multiSel = new Set(kept);
  state.selected = oldSelected && state.entryByPath.has(oldSelected) ? oldSelected : (kept[0] || null);
  if (!state.selected && state.visible.length && oldCursor >= 0) {
    const fallbackIdx = Math.min(oldCursor, state.visible.length - 1);
    state.selected = state.visible[fallbackIdx].path;
  }
  state.selectionAnchor = oldAnchor && state.entryByPath.has(oldAnchor) ? oldAnchor : state.selected;
  state.cursor = state.visible.findIndex((e) => e.path === state.selected);
  paintSelection();
  highlightCursor();
}
function invertSelection() {
  const current = new Set(selPaths());
  const next = state.visible.filter((e) => !current.has(e.path)).map((e) => e.path);
  state.multiSel = new Set(next);
  state.selected = next[0] || null;
  state.selectionAnchor = state.selected;
  paintSelection();
}
function rectsIntersect(a, b) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}
function bindMarqueeSelection() {
  const host = $('#content');
  if (!host) return;
  let drag = null;
  const makeRect = (a, b) => ({
    left: Math.min(a.x, b.x), top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y),
  });
  const draw = () => {
    if (!drag) return;
    const r = makeRect(drag.start, drag.now);
    drag.box.style.left = r.left + 'px';
    drag.box.style.top = r.top + 'px';
    drag.box.style.width = Math.max(1, r.right - r.left) + 'px';
    drag.box.style.height = Math.max(1, r.bottom - r.top) + 'px';
    const hits = new Set();
    $('#file-area').querySelectorAll('.item, .row:not(.list-head)').forEach((el) => {
      if (rectsIntersect(r, el.getBoundingClientRect())) hits.add(el.dataset.path);
    });
    const next = new Set(drag.additive ? drag.base : []);
    hits.forEach((p) => next.add(p));
    state.multiSel = next;
    state.selected = [...hits].pop() || [...next].pop() || null;
    state.selectionAnchor = state.selected;
    paintSelection();
  };
  const schedule = () => {
    if (!drag || drag.raf) return;
    drag.raf = requestAnimationFrame(() => { drag.raf = 0; draw(); });
  };
  const onMove = (ev) => {
    if (!drag) return;
    drag.now = { x: ev.clientX, y: ev.clientY };
    const dx = drag.now.x - drag.start.x;
    const dy = drag.now.y - drag.start.y;
    if (!drag.started && Math.hypot(dx, dy) < 4) return;
    if (!drag.started) {
      drag.started = true;
      drag.box = document.createElement('div');
      drag.box.className = 'marquee-box';
      document.body.appendChild(drag.box);
      document.body.classList.add('marquee-active');
      if (!drag.additive) { state.multiSel.clear(); state.selected = null; state.selectionAnchor = null; }
    }
    ev.preventDefault();
    const cr = host.getBoundingClientRect();
    if (ev.clientY < cr.top + 28) host.scrollTop -= 18;
    else if (ev.clientY > cr.bottom - 28) host.scrollTop += 18;
    schedule();
  };
  const finish = (ev) => {
    if (!drag) return;
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('mouseup', finish, true);
    if (drag.raf) cancelAnimationFrame(drag.raf);
    if (drag.box) drag.box.remove();
    document.body.classList.remove('marquee-active');
    if (!drag.started && !drag.additive) { state.multiSel.clear(); state.selected = null; state.selectionAnchor = null; paintSelection(); }
    drag = null;
    if (ev) ev.preventDefault();
  };
  host.addEventListener('mousedown', (ev) => {
    if (ev.button !== 0 || state.skillsMode) return;
    if (ev.target.closest('.item, .row, button, input, textarea, a, #statusbar, .preview-body')) return;
    if (!ev.target.closest('#file-area') && ev.target.id !== 'content') return;
    drag = {
      start: { x: ev.clientX, y: ev.clientY },
      now: { x: ev.clientX, y: ev.clientY },
      base: new Set(selPaths()),
      additive: ev.ctrlKey || ev.metaKey,
      started: false,
      box: null,
      raf: 0,
    };
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', finish, true);
  }, true);
}
// Ctrl/Cmd+点击：切换该项的选中（资源管理器习惯）
function toggleMultiSel(e) {
  if (!state.multiSel.size && state.selected && state.selected !== e.path) state.multiSel.add(state.selected);
  if (state.multiSel.has(e.path)) state.multiSel.delete(e.path);
  else state.multiSel.add(e.path);
  state.selected = e.path; // 锚点跟到最后点击处
  state.selectionAnchor = e.path;
  paintSelection();
}
function toggleCursorSelection() {
  const e = currentEntry();
  if (!e) return;
  state.cursor = state.visible.findIndex((x) => x.path === e.path);
  if (!state.multiSel.size && state.selected && state.selected !== e.path) state.multiSel.add(state.selected);
  if (state.multiSel.has(e.path)) {
    state.multiSel.delete(e.path);
    state.selected = state.multiSel.size ? [...state.multiSel][state.multiSel.size - 1] : e.path;
  } else {
    state.multiSel.add(e.path);
    state.selected = e.path;
  }
  state.selectionAnchor = e.path;
  paintSelection();
  highlightCursor();
}
// Shift+点击：从锚点到当前项的连续范围
function rangeSelect(idx) {
  const anchorPath = state.selectionAnchor || state.selected;
  const anchorIdx = state.visible.findIndex((x) => x.path === anchorPath);
  const from = anchorIdx >= 0 ? anchorIdx : idx;
  const [a, b] = from <= idx ? [from, idx] : [idx, from];
  state.multiSel = new Set(state.visible.slice(a, b + 1).map((x) => x.path));
  state.selected = state.visible[idx] ? state.visible[idx].path : state.selected;
  paintSelection();
}
function previewVisible() {
  return !$('#preview').classList.contains('hidden');
}
function syncPreviewPaneButton() {
  const b = $('#btn-preview-pane');
  if (!b) return;
  const on = previewVisible();
  b.classList.toggle('active', on);
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.title = on ? '关闭预览窗格 (Alt+P)' : '预览窗格 (Alt+P)';
}
function previewPlaceholder(e, msg = '这个项目没有可用预览') {
  if (!e) return;
  mona.disposeIfAny(); crepe.disposeIfAny(); imgEditState = null;
  showPreviewPanel();
  $('#preview-title').textContent = e.name;
  $('#preview-actions').innerHTML = '';
  renderPreviewFoot(null);
  $('#preview-body').innerHTML = `<div class="empty-state"><div class="big">${iconSvg(e, 48)}</div>${escapeHtml(msg)}</div>`;
}
function previewEntry(e) {
  if (!e) return;
  if (e.isDir) { previewPlaceholder(e, '文件夹没有预览，按 Alt+Enter 查看属性'); return; }
  openPreview(e);
  recordRecent(e.path);
}
function syncPreviewAfterRefresh() {
  if (!previewVisible()) return;
  const e = selectedPreviewEntry();
  if (e) {
    if (e.isDir) { previewPlaceholder(e, '文件夹没有预览，按 Alt+Enter 查看属性'); return; }
    openPreview(e);
    return;
  }
  $('#preview-title').textContent = '未选择文件';
  $('#preview-actions').innerHTML = '';
  renderPreviewFoot(null);
  $('#preview-body').innerHTML = `<div class="empty-state"><div class="big">${ic('inbox', 'currentColor', 48)}</div>选择一个文件即可预览</div>`;
}
// 单击=选中；预览窗格已打开时才随选择刷新。双击/Enter=进入/打开——跟随资源管理器的肌肉记忆
function onItemClick(e) {
  const samePreviewed = state.selected === e.path && !state.multiSel.size && previewVisible();
  applySelection(e.path);
  if (previewVisible() && !samePreviewed) previewEntry(e);
}
function onItemOpen(e) { if (e.isDrive) navigate(e.path); else if (e.isDir) navigate(e.path); else openWith(e.path, 'default'); }

// ---------- 主区键盘导航 ----------
function highlightCursor(force = false) {
  const area = $('#file-area');
  if (force) {
    area.querySelectorAll('.cursor').forEach((x) => x.classList.remove('cursor'));
    state.paintedCursor = -1;
  } else if (state.paintedCursor !== state.cursor && state.paintedCursor >= 0) {
    const prev = area.querySelector(`[data-idx="${state.paintedCursor}"]`);
    if (prev) prev.classList.remove('cursor');
  }
  if (state.cursor < 0) { state.paintedCursor = -1; return; }
  const el = area.querySelector(`[data-idx="${state.cursor}"]`);
  if (el) { el.classList.add('cursor'); el.scrollIntoView({ block: 'nearest' }); }
  state.paintedCursor = state.cursor;
}
function moveCursor(d) {
  if (!state.visible.length) return;
  if (state.cursor < 0) state.cursor = 0;
  else state.cursor = Math.min(state.visible.length - 1, Math.max(0, state.cursor + d));
  selectCursorEntry();
  highlightCursor();
}
function selectCursorEntry() {
  const e = currentEntry();
  if (!e) return;
  state.cursor = state.visible.findIndex((x) => x.path === e.path);
  state.multiSel.clear();
  state.selected = e.path;
  state.selectionAnchor = e.path;
  paintSelection();
}
function visibleItemStep() {
  const host = $('#content');
  const item = $('#file-area .item, #file-area .row:not(.list-head)');
  const h = item ? Math.max(1, item.getBoundingClientRect().height) : 44;
  const rows = Math.max(1, Math.floor(((host && host.clientHeight) || window.innerHeight || 600) / h) - 1);
  return Math.max(1, rows * Math.max(1, state.cols || 1));
}
function moveCursorTo(idx) {
  if (!state.visible.length) return;
  state.cursor = Math.min(state.visible.length - 1, Math.max(0, idx));
  selectCursorEntry();
  highlightCursor();
}
function extendCursorTo(idx) {
  if (!state.visible.length) return;
  const cur = state.cursor >= 0 ? state.cursor : 0;
  const anchorPath = state.selectionAnchor || state.selected || (state.visible[cur] && state.visible[cur].path);
  let anchorIdx = state.visible.findIndex((x) => x.path === anchorPath);
  if (anchorIdx < 0) anchorIdx = cur;
  state.selectionAnchor = state.visible[anchorIdx].path;
  state.cursor = Math.min(state.visible.length - 1, Math.max(0, idx));
  const [a, b] = anchorIdx <= state.cursor ? [anchorIdx, state.cursor] : [state.cursor, anchorIdx];
  state.multiSel = new Set(state.visible.slice(a, b + 1).map((x) => x.path));
  state.selected = state.visible[state.cursor].path;
  paintSelection();
  highlightCursor();
}
function extendCursor(d) {
  const cur = state.cursor >= 0 ? state.cursor : 0;
  extendCursorTo(cur + d);
}
function typeAheadFresh() {
  const last = state.typeAhead || { text: '', ts: 0 };
  return !!(last.text && Date.now() - last.ts < 1000);
}
function findTypeAheadMatch(text, start = 0) {
  if (!text || !state.visible.length) return false;
  const q = text.toLocaleLowerCase('zh');
  for (let n = 0; n < state.visible.length; n++) {
    const idx = (start + n) % state.visible.length;
    const e = state.visible[idx];
    if (String(e.name || '').toLocaleLowerCase('zh').startsWith(q)) {
      state.cursor = idx;
      state.multiSel.clear();
      state.selected = e.path;
      state.selectionAnchor = e.path;
      paintSelection();
      highlightCursor();
      return true;
    }
  }
  return false;
}
function selectByTypeAhead(ch) {
  if (!state.visible.length || state.skillsMode) return false;
  const now = Date.now();
  const last = state.typeAhead || { text: '', ts: 0 };
  const sameCycle = now - last.ts < 1000 && last.text.length === 1 && last.text === ch;
  const text = now - last.ts > 1000 || sameCycle ? ch : (last.text + ch);
  state.typeAhead = { text, ts: now };
  const start = sameCycle || state.cursor >= 0 ? state.cursor + 1 : 0;
  return findTypeAheadMatch(text, start);
}
function trimTypeAhead() {
  if (!typeAheadFresh()) return false;
  const last = state.typeAhead || { text: '', ts: 0 };
  const text = last.text.slice(0, -1);
  if (!text) {
    state.typeAhead = { text: '', ts: 0 };
    return true;
  }
  state.typeAhead = { text, ts: Date.now() };
  findTypeAheadMatch(text, 0);
  return true;
}
function cursorEnter(editor) {
  const e = currentEntry();
  if (!e) return;
  state.cursor = state.visible.findIndex((x) => x.path === e.path);
  if (e.isDir && editor) { openNewWindow(e.path); return; }
  if (editor && !e.isDir) { openWith(e.path, 'editor'); return; }
  if (e.isDir) { state.selected = e.path; navigate(e.path); }
  else { applySelection(e.path); openWith(e.path, 'default'); recordRecent(e.path); }
}
function editableNameRange(e) {
  if (e.isDir) return [0, e.name.length];
  const i = e.name.lastIndexOf('.');
  return i > 0 ? [0, i] : [0, e.name.length];
}
function fileExtension(name) {
  const s = String(name || '');
  const i = s.lastIndexOf('.');
  return i > 0 && i < s.length - 1 ? s.slice(i + 1).toLocaleLowerCase('zh') : '';
}
function renameChangesExtension(e, nextName) {
  if (!e || e.isDir) return false;
  return fileExtension(e.name) !== fileExtension(nextName);
}
function waitForRenderedEntry(path, timeout = 1600) {
  const area = $('#file-area');
  if (area.querySelector(`[data-path="${CSS.escape(path)}"]`)) return Promise.resolve(true);
  const t0 = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (area.querySelector(`[data-path="${CSS.escape(path)}"]`)) { resolve(true); return; }
      if (Date.now() - t0 > timeout) { resolve(false); return; }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

// ---------- 预览 ----------
// ---------- Office 预览（公司版）：Word 原格式编辑保存，Excel 表格预览 ----------
// 组件 vendor 在本地（docx-editor / SheetJS，均 Apache-2.0），离线可用，文件不出本机
const OFFICE_DOCX = /\.docx$/i;
const OFFICE_XLSX = /\.(xlsx|xls|xlsm)$/i;
const isOfficeName = (n) => OFFICE_DOCX.test(n) || OFFICE_XLSX.test(n);
const _vendorOnce = {};
function loadVendor(key, js, css) {
  if (_vendorOnce[key]) return _vendorOnce[key];
  _vendorOnce[key] = new Promise((resolve, reject) => {
    if (css) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = css; document.head.appendChild(l); }
    const s = document.createElement('script');
    s.src = js;
    s.onload = resolve;
    s.onerror = () => { _vendorOnce[key] = null; reject(new Error('组件加载失败')); };
    document.head.appendChild(s);
  });
  return _vendorOnce[key];
}
function abToBase64(ab) {
  const u8 = new Uint8Array(ab);
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
const docxKit = {
  handle: null, dirty: false, mtime: 0,
  dispose() { if (this.handle) { try { this.handle.destroy(); } catch { /* */ } this.handle = null; } this.dirty = false; },
};
async function openDocxPreview(e) {
  const body = $('#preview-body');
  body.innerHTML = '<div class="cmdk-loading">加载 Word 编辑器…</div>';
  try {
    await loadVendor('docx', '/vendor/docx/docx-editor.js', '/vendor/docx/docx-editor.css');
    const r = await fetch(`/api/raw?path=${encodeURIComponent(e.path)}&v=${e.mtime || 0}`);
    if (!r.ok) throw new Error('读取文件失败');
    const buf = await r.arrayBuffer();
    body.innerHTML = '<div class="editor-bar"><button id="docx-save" class="primary">保存</button><button id="docx-sys" class="ghost-btn">用系统应用打开</button><span id="docx-state" class="editor-hint">原格式（OOXML）编辑，改完点保存</span></div><div id="docx-host" class="docx-host"></div>';
    docxKit.mtime = e.mtime || 0;
    docxKit.dirty = false;
    const t0 = Date.now(); // 编辑器装载文档也会触发 onChange，前 1.2 秒不算「用户改动」
    docxKit.handle = window.FanboxDocx.mount($('#docx-host'), buf, {
      onChange: () => {
        if (Date.now() - t0 < 1200 || docxKit.dirty) return;
        docxKit.dirty = true;
        const st = $('#docx-state'); if (st) st.textContent = '● 有未保存的修改';
      },
    });
    dirtyCheck = () => docxKit.dirty;
    $('#docx-sys').onclick = () => openWith(e.path);
    $('#docx-save').onclick = async () => {
      const btn = $('#docx-save');
      btn.disabled = true;
      try {
        const ab = await docxKit.handle.save();
        if (!ab) throw new Error('编辑器没有返回内容');
        const r2 = await apiPost('/api/write-binary', { path: e.path, base64: abToBase64(ab), expectedMtime: docxKit.mtime });
        if (!r2.ok) throw new Error(r2.error || '保存失败');
        docxKit.mtime = r2.mtime; e.mtime = r2.mtime; docxKit.dirty = false;
        const st = $('#docx-state'); if (st) st.textContent = '已保存 ✓';
        toast('已保存（.docx 原格式，Word 可直接打开）');
        recordRecent(e.path);
      } catch (err) { toast('保存失败: ' + err.message, true); }
      btn.disabled = false;
    };
    recordRecent(e.path);
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><div class="big">${iconSvg(e, 48)}</div>Word 预览失败：${escapeHtml(err.message)}<br><br><button class="ghost-btn" id="docx-fallback">用系统应用打开</button></div>`;
    const fb = $('#docx-fallback'); if (fb) fb.onclick = () => openWith(e.path);
  }
}
async function openXlsxPreview(e) {
  const body = $('#preview-body');
  body.innerHTML = '<div class="cmdk-loading">解析表格…</div>';
  try {
    await loadVendor('xlsx', '/vendor/xlsx/xlsx.js');
    const r = await fetch(`/api/raw?path=${encodeURIComponent(e.path)}&v=${e.mtime || 0}`);
    if (!r.ok) throw new Error('读取文件失败');
    const sheets = window.FanboxXlsx.parse(await r.arrayBuffer());
    if (!sheets.length) throw new Error('没有工作表');
    body.innerHTML = '<div class="editor-bar"><span class="xlsx-tabs" id="xlsx-tabs"></span><span class="chat-flex"></span><button id="xlsx-sys" class="ghost-btn">用系统应用编辑</button></div><div id="xlsx-host" class="xlsx-host"></div>';
    const tabs = $('#xlsx-tabs');
    const show = (i) => {
      $('#xlsx-host').innerHTML = sheets[i].html || '<div class="empty-state">空工作表</div>';
      tabs.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', i === j));
    };
    sheets.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'xlsx-tab';
      b.textContent = s.name;
      b.onclick = () => show(i);
      tabs.appendChild(b);
    });
    $('#xlsx-sys').onclick = () => openWith(e.path);
    show(0);
    recordRecent(e.path);
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><div class="big">${iconSvg(e, 48)}</div>表格解析失败：${escapeHtml(err.message)}<br><br><button class="ghost-btn" id="xlsx-fallback">用系统应用打开</button></div>`;
    const fb = $('#xlsx-fallback'); if (fb) fb.onclick = () => openWith(e.path);
  }
}

async function openPreview(e) {
  if (!await guardDirty()) return;
  mona.disposeIfAny(); crepe.disposeIfAny(); docxKit.dispose(); imgEditState = null; // 离开编辑态时回收编辑器（连带 worker），避免泄漏
  showPreviewPanel();
  $('#preview-title').textContent = e.name;
  const body = $('#preview-body');
  body.innerHTML = '<div class="cmdk-loading">加载中…</div>';
  renderPreviewActions(e);
  renderPreviewFoot(e);
  // Office 文件：Word 原格式编辑，Excel 表格预览（按扩展名拦截——.docx 本质是 zip，不能落进压缩包分支）
  if (OFFICE_DOCX.test(e.name)) return openDocxPreview(e);
  if (OFFICE_XLSX.test(e.name)) return openXlsxPreview(e);
  const k = e.kind;
  if (k === 'image') {
    // 预览用中等缩略图（秒开）。heic/heif/tiff 浏览器无法直接渲染原图，统一走 sips 缩略图端点
    const exi = (e.name.split('.').pop() || '').toLowerCase();
    const nativeImg = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(exi);
    const fallback = nativeImg ? `/api/raw?path=${encodeURIComponent(e.path)}&v=${e.mtime || 0}` : `/api/thumb?path=${encodeURIComponent(e.path)}&w=1600&v=${e.mtime || 0}`;
    body.innerHTML = `<img class="pv-img" src="/api/thumb?path=${encodeURIComponent(e.path)}&w=1000&v=${e.mtime || 0}" title="点击放大" onerror="this.onerror=null;this.src='${fallback}'">`;
    body.querySelector('.pv-img').onclick = () => lightbox(e.path, nativeImg, e.mtime);
  } else if (k === 'video') {
    body.innerHTML = `<video controls src="/api/raw?path=${encodeURIComponent(e.path)}"></video>`;
  } else if (k === 'audio') {
    body.innerHTML = `<div class="preview-meta"><span>${fmtSize(e.size)}</span></div><audio controls src="/api/raw?path=${encodeURIComponent(e.path)}"></audio>`;
  } else if (k === 'pdf') {
    body.innerHTML = `<iframe class="iframe-preview" src="/api/raw?path=${encodeURIComponent(e.path)}"></iframe>`;
  } else if (k === 'text') {
    if (isMdName(e.name)) return enterEditMode(e); // md 预览即编辑：打开就是所见即所得，自动保存
    renderTextPreview(await api('/api/read?path=' + encodeURIComponent(e.path)));
  } else if (k === 'archive') {
    const d = await api('/api/archive?path=' + encodeURIComponent(e.path));
    if (!d.ok) {
      body.innerHTML = `<div class="empty-state"><div class="big">${iconSvg(e, 48)}</div>${escapeHtml(d.error || '无法读取')}<br><br>${fmtSize(e.size)}</div>`;
    } else {
      const rows = d.entries.map((en) =>
        `<div class="arch-row${en.name.endsWith('/') ? ' is-dir' : ''}"><span class="arch-name">${escapeHtml(en.name)}</span><span class="arch-size">${en.size != null ? fmtSize(en.size) : ''}</span></div>`).join('');
      body.innerHTML = `<div class="preview-meta"><span>${fmtSize(e.size)}</span><span>${d.entries.length}${d.truncated ? '+' : ''} 项</span></div><div class="arch-list">${rows}</div>`;
    }
  } else {
    body.innerHTML = `<div class="empty-state"><div class="big">${iconSvg(e, 48)}</div>这个文件类型无法预览<br><br>${fmtSize(e.size)}</div>`;
  }
}
function renderTextPreview(data) {
  const body = $('#preview-body');
  const meta = `<div class="preview-meta"><span>${data.ext || 'txt'}</span><span>${fmtSize(data.size)}</span><span>${fmtTime(data.mtime)}</span></div>`;
  const ex = (data.ext || '').toLowerCase();
  if ((ex === 'md' || ex === 'markdown') && !window.__noMarked && window.marked) {
    body.innerHTML = meta + `<div class="md-body">${window.marked.parse(data.content || '')}</div>`;
    if (window.hljs) body.querySelectorAll('pre code').forEach((b) => { try { window.hljs.highlightElement(b); } catch {} });
  } else if (ex === 'csv' || ex === 'tsv') {
    body.innerHTML = meta + csvTable(data.content || '', ex === 'tsv' ? '\t' : ',');
  } else if (ex === 'html' || ex === 'htm') {
    renderHtmlPreview(data, meta);
  } else {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    if (ex) code.className = 'language-' + ex;
    code.textContent = data.content || '';
    pre.appendChild(code);
    body.innerHTML = meta;
    body.appendChild(pre);
    if (window.hljs && !window.__noHljs) { try { window.hljs.highlightElement(code); } catch {} }
  }
}
function csvTable(text, delim) {
  const rows = text.split('\n').filter((r) => r.trim()).slice(0, 500).map((r) => r.split(delim));
  if (!rows.length) return '<div class="empty-state">空表格</div>';
  let h = '<div class="csv-wrap"><table class="csv-table"><thead><tr>';
  rows[0].forEach((c) => { h += `<th>${escapeHtml(c)}</th>`; });
  h += '</tr></thead><tbody>';
  for (let i = 1; i < rows.length; i++) {
    h += '<tr>';
    rows[i].forEach((c) => { h += `<td>${escapeHtml(c)}</td>`; });
    h += '</tr>';
  }
  h += '</tbody></table></div>';
  return h;
}
// 把绝对路径编码成 /fs/ 端点 URL，逐段 encode 以保留目录层级（相对引用按段解析）
function fsUrl(p, mtime) {
  return '/fs/' + p.split(/[\\/]/).filter(Boolean).map(encodeURIComponent).join('/') + '?v=' + (mtime || 0);
}
function renderHtmlPreview(data, meta) {
  const body = $('#preview-body');
  body.innerHTML = meta +
    `<div class="pv-toolbar"><button id="html-toggle" class="ghost-btn">查看源码</button><button id="html-browser" class="ghost-btn">${ic('globe', 'currentColor', 13)} 浏览器打开（看完整交互）</button></div>` +
    // src 指到 /fs/ 路径镜像端点，页面里的相对引用（./img.png、子目录）才能按所在目录解析；
    // srcdoc 没有 base URL，本地图片/CSS 全是裂的。
    // 只给 allow-scripts，不给 allow-same-origin：sandbox 让文档落到 opaque origin，
    // 否则它的脚本可经 window.parent 摸到 preload 暴露的 fanboxPty.spawn → 预览一个文件就能 RCE。
    // 需要完整同源交互的页面走「浏览器打开」按钮。
    `<iframe class="iframe-preview" sandbox="allow-scripts" src="${fsUrl(data.path, data.mtime)}"></iframe>`;
  let src = false;
  $('#html-browser').onclick = () => openWith(data.path, 'default');
  $('#html-toggle').onclick = () => {
    src = !src;
    if (src) {
      const pre = document.createElement('pre');
      pre.innerHTML = `<code class="language-html">${escapeHtml(data.content || '')}</code>`;
      body.querySelector('.iframe-preview').replaceWith(pre);
      if (window.hljs) pre.querySelectorAll('code').forEach((b) => { try { window.hljs.highlightElement(b); } catch {} });
      $('#html-toggle').textContent = '渲染预览';
    } else { renderHtmlPreview(data, meta); }
  };
}
// 查看改动：HEAD 版本 vs 工作区当前内容，用 Monaco 只读 DiffEditor 并排渲染
async function showDiff(e) {
  const data = await api('/api/git-file?path=' + encodeURIComponent(e.path));
  if (!data.isRepo) { toast('该文件不在 git 仓库里', true); return; }
  if (!data.diffable) { toast('该类型不支持 diff', true); return; }
  if (!data.isNew && (data.original || '') === (data.modified || '')) { toast('与 HEAD 无差异'); return; }
  if (!await mona.load()) { toast('编辑器未就绪', true); return; }
  if (!await guardDirty()) return;
  mona.disposeIfAny(); crepe.disposeIfAny(); imgEditState = null;
  showPreviewPanel();
  applySelection(e.path);
  $('#preview-title').textContent = (data.isNew ? '新增 · ' : '改动 · ') + e.name;
  renderPreviewActions(e);
  renderPreviewFoot(e);
  const body = $('#preview-body');
  body.innerHTML =
    `<div class="editor-bar"><span class="editor-hint">${data.isNew ? '新文件（HEAD 中不存在）' : '左：HEAD　·　右：当前工作区'} · 只读</span><button id="diff-close" class="ghost-btn">返回预览</button></div>` +
    `<div id="ed-host" class="mona-host"></div>`;
  mona.openDiff($('#ed-host'), data.original, data.modified, (e.name.split('.').pop() || '').toLowerCase());
  $('#diff-close').onclick = () => openPreview(e);
}
function renderPreviewActions(e) {
  const box = $('#preview-actions');
  box.innerHTML = '';
  const clip = window.fanboxClipboard;
  // 图标为主、文字精简：主操作「打开」留字，其余只留图标 + tooltip
  const acts = [
    { icon: ic('link', 'currentColor', 14), label: '打开', title: '默认应用打开', cls: 'primary', fn: () => openWith(e.path, 'default') },
    ...(e.kind === 'text' && !isMdName(e.name) ? [{ icon: ic('edit3', 'currentColor', 15), title: '编辑文本', fn: () => enterEditMode(e) }] : []), // md 预览即编辑，无需入口
    ...(e.kind === 'text' ? [{ icon: ic('gitbranch', 'currentColor', 15), title: '查看改动（HEAD vs 当前）', fn: () => showDiff(e) }] : []),
    ...(e.kind === 'image' ? [{ icon: ic('edit3', 'currentColor', 15), title: '编辑图片', fn: () => enterImageEdit(e) }] : []),
    { icon: ic('term', 'currentColor', 15), title: '在编辑器打开', fn: () => openWith(e.path, 'editor') },
    { icon: ic('folder', 'currentColor', 15), title: '在文件管理器中显示', fn: () => openWith(e.path, 'reveal') },
    ...(e.kind === 'image' && clip ? [{ icon: ic('image', 'currentColor', 15), title: '复制图片（可粘贴到其它应用）', fn: () => copyImage(e.path) }] : []),
    ...(clip ? [{ icon: ic('copy', 'currentColor', 15), title: '复制文件（系统文件管理器可粘贴）', fn: () => copyFile(e.path) }] : []),
    { icon: ic('clip', 'currentColor', 15), title: '复制路径', fn: () => copyPath(e.path) },
  ];
  acts.forEach((a) => {
    const b = document.createElement('button');
    b.className = (a.cls || '') + (a.label ? '' : ' icon-only');
    // 有可见文字的按钮不需气泡；纯图标按钮用 data-tip 即时气泡（不再用慢吞吞的原生 title）
    if (!a.label && a.title) b.dataset.tip = a.title;
    b.innerHTML = a.label ? `${a.icon}<span>${a.label}</span>` : a.icon;
    b.onclick = a.fn;
    box.appendChild(b);
  });
}
// 预览底部：大小 · 创建 · 修改
function fmtDateTime(ms) {
  if (!ms) return '—';
  const d = new Date(ms); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function renderPreviewFoot(e) {
  const f = $('#preview-foot');
  if (!f) return;
  if (!e || e.isDir) { f.innerHTML = ''; return; }
  f.innerHTML = `<span title="大小">${e.size ? fmtSize(e.size) : '0 B'}</span><span title="创建时间">创建 ${fmtDateTime(e.btime)}</span><span title="修改时间">改 ${fmtDateTime(e.mtime)}</span>`;
}
async function copyImage(p) { const r = await window.fanboxClipboard.copyImage(p); toast(r.ok ? '已复制图片，可粘贴到其它应用' : '复制图片失败：' + (r.error || ''), !r.ok); }
async function copyFile(p) { const r = await window.fanboxClipboard.copyFile(p); toast(r.ok ? '已复制文件，可在系统文件管理器里粘贴' : '复制文件失败', !r.ok); }
async function closePreview(clearSelection = true) {
  if (!await guardDirty()) return;
  mona.disposeIfAny(); crepe.disposeIfAny(); imgEditState = null;
  animateLayout();
  $('#preview').classList.add('hidden');
  $('#preview-resizer').classList.add('hidden');
  syncPreviewPaneButton();
  if (clearSelection) applySelection(null);
  term.fitActive();
}
function selectedPreviewEntry() {
  let e = state.selected ? state.visible.find((x) => x.path === state.selected) : null;
  if (!e && state.cursor >= 0) e = state.visible[state.cursor];
  if (!e && state.multiSel.size) {
    const first = state.visible.find((x) => state.multiSel.has(x.path));
    if (first) e = first;
  }
  return e;
}
async function togglePreviewPane() {
  if (!$('#preview').classList.contains('hidden')) { await closePreview(false); return; }
  const e = selectedPreviewEntry();
  if (!e) { toast('先选中一个文件'); return; }
  applySelection(e.path);
  previewEntry(e);
}
function lightbox(path, nativeImg, mtime) {
  // heic/heif/tiff 无法渲染原图，放大也用大尺寸缩略图
  if (nativeImg === undefined) { const ex = (path.split('.').pop() || '').toLowerCase(); nativeImg = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ex); }
  const src = nativeImg ? `/api/raw?path=${encodeURIComponent(path)}&v=${mtime || 0}` : `/api/thumb?path=${encodeURIComponent(path)}&w=1600&v=${mtime || 0}`;
  const ov = document.createElement('div');
  ov.className = 'lightbox';
  ov.innerHTML = `<img src="${src}"><div class="lb-hint">点击空白处关闭 · 滚轮缩放</div>`;
  let scale = 1;
  const img = ov.querySelector('img');
  ov.onclick = (ev) => { if (ev.target === ov) ov.remove(); };
  ov.onwheel = (ev) => { ev.preventDefault(); scale = Math.min(8, Math.max(0.2, scale - ev.deltaY * 0.002)); img.style.transform = `scale(${scale})`; };
  document.body.appendChild(ov);
}
// 布局：侧栏(可折叠) + 主区；折叠时侧栏 display:none 退出栅格，故改单列 1fr 让主区铺满
function applyLayout() {
  $('#app').style.gridTemplateColumns = state.sidebarCollapsed ? '1fr' : `${state.sidebarW}px 1fr`;
  document.documentElement.style.setProperty('--sidebar-w', state.sidebarW + 'px'); // 供拖拽条 fixed 定位
}
// WOW3：把选中的文字做成一个残影「甩」进终端，落地时终端闪一下——交互本身就是惊喜
function flingToTerminal(text, fromRect) {
  const panel = $('#terminal-panel');
  const tRect = (panel && !panel.classList.contains('hidden')) ? panel.getBoundingClientRect() : null;
  const ghost = document.createElement('div');
  ghost.className = 'fling-ghost';
  ghost.textContent = text.length > 42 ? text.slice(0, 42) + '…' : text;
  const sx = fromRect.left, sy = fromRect.top;
  ghost.style.left = sx + 'px'; ghost.style.top = sy + 'px';
  document.body.appendChild(ghost);
  const tx = tRect ? (tRect.left + tRect.width / 2 - 60) : window.innerWidth - 120;
  const ty = tRect ? (tRect.top + tRect.height / 2) : window.innerHeight - 80;
  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${tx - sx}px, ${ty - sy}px) scale(0.25) rotate(7deg)`;
    ghost.style.opacity = '0';
  });
  ghost.addEventListener('transitionend', () => ghost.remove(), { once: true });
  setTimeout(() => ghost.remove(), 800); // 兜底清理
  if (panel && tRect) { panel.classList.remove('term-catch'); void panel.offsetWidth; panel.classList.add('term-catch'); setTimeout(() => panel.classList.remove('term-catch'), 520); }
}
// 在预览里选中文字 → 浮现「发到终端」按钮，一键把这段作为上下文喂给 agent（md/代码/文本预览生效）
function bindSelectionToTerminal() {
  const body = $('#preview-body');
  if (!body) return;
  let btn = null;
  const hide = () => { if (btn) { btn.remove(); btn = null; } };
  const show = () => {
    const sel = window.getSelection();
    const text = sel && sel.toString().trim();
    if (!text || !term.available()) { hide(); return; }
    const node = sel.anchorNode;
    const host = node && (node.nodeType === 3 ? node.parentNode : node);
    if (!host || !body.contains(host)) { hide(); return; } // 选区必须落在预览正文里
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) { hide(); return; }
    if (!btn) { btn = document.createElement('button'); btn.className = 'sel-send'; document.body.appendChild(btn); }
    btn.innerHTML = `${ic('term', 'currentColor', 13)} 发到终端`;
    const top = Math.min(window.innerHeight - 44, rect.bottom + 8);
    btn.style.top = top + 'px';
    btn.style.left = Math.max(8, Math.min(window.innerWidth - 130, rect.left)) + 'px';
    btn.onmousedown = (ev) => ev.preventDefault(); // 别让点击清掉选区
    btn.onclick = () => { const r = btn.getBoundingClientRect(); flingToTerminal(text, r); term.sendContext(text, state.selected); hide(); toast('已甩进终端，补一句要求再回车'); };
  };
  body.addEventListener('mouseup', () => setTimeout(show, 10));
  body.addEventListener('scroll', hide, true);
  document.addEventListener('mousedown', (ev) => { if (btn && ev.target !== btn && !btn.contains(ev.target)) hide(); });
}
// 给「无可见文字」的图标按钮挂即时气泡标签：把原生 title 转成 data-tip（CSS 气泡），移除 title 防双重提示
function enableTooltips(scope) {
  (scope || document).querySelectorAll('[title]').forEach((el) => {
    const label = el.getAttribute('title');
    if (!label) return;
    if (el.textContent.replace(/\s/g, '').length > 2) return; // 有明确文字标签的按钮就不加气泡
    el.dataset.tip = label;
    el.removeAttribute('title');
  });
}
// 侧边栏右缘拖拽改宽度（折叠态不可拖）
function bindSidebarResizer() {
  const handle = $('#sidebar-resizer');
  if (!handle) return;
  let dragging = false, raf = null, target = null;
  const apply = () => { raf = null; if (target == null) return; state.sidebarW = target; target = null; applyLayout(); if (typeof term !== 'undefined') term.fitActive(); };
  handle.addEventListener('mousedown', (e) => {
    if (state.sidebarCollapsed) return;
    dragging = true; e.preventDefault();
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none'; document.body.style.cursor = 'col-resize';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    target = Math.round(Math.min(420, Math.max(190, e.clientX)));
    if (!raf) raf = requestAnimationFrame(apply);
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false; handle.classList.remove('dragging');
    document.body.style.userSelect = ''; document.body.style.cursor = '';
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    apply();
    localStorage.setItem('fb_sidebar_w', state.sidebarW);
  });
}
// 预览尺寸随 dock 翻转：终端在右→预览在下方用高度，否则用宽度
function applyPreviewSize() {
  const pv = $('#preview');
  if (!pv || pv.classList.contains('hidden')) return;
  pv.style.flexBasis = (term.dock === 'right' ? (state.previewH || 340) : state.previewW) + 'px';
}
// 离散布局切换时短暂开启过渡（拖拽时不开，保证跟手）
function animateLayout() {
  const mb = $('#main-body'); if (!mb) return;
  mb.classList.add('lay-anim');
  clearTimeout(animateLayout._t);
  animateLayout._t = setTimeout(() => mb.classList.remove('lay-anim'), 280);
}
function showPreviewPanel() {
  const wasHidden = $('#preview').classList.contains('hidden');
  $('#preview').classList.remove('hidden');
  $('#preview-resizer').classList.remove('hidden');
  syncPreviewPaneButton();
  if (wasHidden) animateLayout();
  applyPreviewSize();
}
function applyPreviewWidth() { applyPreviewSize(); } // 兼容旧调用名
function toggleSidebar(force) {
  state.sidebarCollapsed = force === undefined ? !state.sidebarCollapsed : force;
  localStorage.setItem('fb_sidebar_collapsed', state.sidebarCollapsed ? '1' : '0');
  $('#app').classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
  $('#btn-sidebar')?.classList.toggle('on', state.sidebarCollapsed);
  applyLayout();
}

// ---------- 图片基础编辑（canvas：标注/打码/转格式/缩放/压缩，原生保存）----------
let imgEditState = null;
async function enterImageEdit(e) {
  if (!await guardDirty()) return;
  recordRecent(e.path);
  mona.disposeIfAny(); crepe.disposeIfAny();
  showPreviewPanel();
  applySelection(e.path);
  $('#preview-title').textContent = '编辑 · ' + e.name;
  $('#preview-actions').innerHTML = '';
  renderPreviewFoot(null);
  const body = $('#preview-body');
  body.innerHTML = '<div class="cmdk-loading">加载图片…</div>';
  const img = new Image();
  img.onload = () => {
    // 大图 OOM 守卫：canvas 按 RGBA 估算，超 60MP（~240MB）拒绝编辑，回退预览
    if (img.naturalWidth * img.naturalHeight > 60e6) { toast('图片过大（>60MP），暂不支持编辑，请先压缩', true); openPreview(e); return; }
    buildImageEditor(e, img);
  };
  img.onerror = () => { toast('图片加载失败', true); openPreview(e); };
  img.src = '/api/raw?path=' + encodeURIComponent(e.path) + '&v=' + (e.mtime || 0);
}
function ieSnapshot(st) { const c = document.createElement('canvas'); c.width = st.canvas.width; c.height = st.canvas.height; c.getContext('2d').drawImage(st.canvas, 0, 0); return c; }
function iePos(st, ev) { const r = st.canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left) * (st.canvas.width / r.width), y: (ev.clientY - r.top) * (st.canvas.height / r.height) }; }
function ieDrawShape(st, x0, y0, x1, y1) {
  const c = st.ctx; c.save();
  c.strokeStyle = st.color; c.fillStyle = st.color; c.lineWidth = st.size; c.lineCap = 'round'; c.lineJoin = 'round';
  if (st.tool === 'rect') c.strokeRect(x0, y0, x1 - x0, y1 - y0);
  else if (st.tool === 'line' || st.tool === 'arrow') {
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    if (st.tool === 'arrow') { const a = Math.atan2(y1 - y0, x1 - x0), h = Math.max(12, st.size * 3.2); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - h * Math.cos(a - 0.4), y1 - h * Math.sin(a - 0.4)); c.lineTo(x1 - h * Math.cos(a + 0.4), y1 - h * Math.sin(a + 0.4)); c.closePath(); c.fill(); }
  }
  c.restore();
}
function iePixelate(st, x0, y0, x1, y1) {
  const x = Math.max(0, Math.min(x0, x1)), y = Math.max(0, Math.min(y0, y1));
  const w = Math.min(st.canvas.width - x, Math.abs(x1 - x0)), h = Math.min(st.canvas.height - y, Math.abs(y1 - y0));
  if (w < 2 || h < 2) return;
  const block = Math.max(6, Math.round(Math.min(w, h) / 12));
  const c = st.ctx, data = c.getImageData(x, y, w, h), d = data.data;
  for (let by = 0; by < h; by += block) for (let bx = 0; bx < w; bx += block) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let yy = by; yy < Math.min(by + block, h); yy++) for (let xx = bx; xx < Math.min(bx + block, w); xx++) { const i = (yy * w + xx) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    r = r / n; g = g / n; b = b / n;
    for (let yy = by; yy < Math.min(by + block, h); yy++) for (let xx = bx; xx < Math.min(bx + block, w); xx++) { const i = (yy * w + xx) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; }
  }
  c.putImageData(data, x, y);
}
function ieToolBtn(tool, title, inner, active) {
  return `<button data-tool="${tool}" title="${title}"${active ? ' class="active"' : ''}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${inner}</svg></button>`;
}
function buildImageEditor(e, img) {
  const origExt = (e.name.split('.').pop() || 'png').toLowerCase();
  const body = $('#preview-body');
  body.innerHTML =
    `<div class="imgedit-tools">
      <div class="ie-seg" id="ie-tools">
        ${ieToolBtn('pen', '自由画笔', '<path d="M3 21c0-3 2-5 5-6 2-.7 3-2 3.5-4M21 3c-1 4-3 7-6 9"/><path d="M11 11l2 2"/>', true)}
        ${ieToolBtn('rect', '矩形框', '<rect x="4" y="6" width="16" height="12" rx="1.5"/>')}
        ${ieToolBtn('line', '直线', '<line x1="5" y1="19" x2="19" y2="5"/>')}
        ${ieToolBtn('arrow', '箭头', '<line x1="5" y1="19" x2="18" y2="6"/><polyline points="10.5 6 18 6 18 13.5"/>')}
        ${ieToolBtn('text', '文字', '<polyline points="5 7 5 5 19 5 19 7"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="9" y1="19" x2="15" y2="19"/>')}
        ${ieToolBtn('mosaic', '打码', '<rect x="4" y="4" width="6.4" height="6.4"/><rect x="13.6" y="4" width="6.4" height="6.4"/><rect x="4" y="13.6" width="6.4" height="6.4"/><rect x="13.6" y="13.6" width="6.4" height="6.4"/>')}
      </div>
      <input type="color" id="ie-color" value="#ff3b30" title="颜色">
      <span class="ie-thick" title="粗细"><input type="range" id="ie-size" min="1" max="60" value="5"><i id="ie-dot"></i></span>
      <button id="ie-undo" class="ghost-btn" title="撤销 ${MOD}Z">撤销</button>
    </div>
    <div class="imgedit-canvas-wrap"><canvas id="ie-canvas"></canvas></div>
    <div class="imgedit-export">
      <label>格式 <select id="ie-format"><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WEBP</option></select></label>
      <label>宽度 <input id="ie-width" type="number" min="16" step="1"></label>
      <label id="ie-quality-wrap" style="display:none">质量 <input id="ie-quality" type="range" min="10" max="100" value="85"></label>
      <span class="ie-spacer"></span>
      <button id="ie-saveas" class="ghost-btn">另存为</button>
      <button id="ie-save" class="primary">保存</button>
    </div>`;
  const canvas = $('#ie-canvas');
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  $('#ie-width').value = img.naturalWidth;
  // 粗细随图分辨率自适应：大图默认更粗，才「看得出」；滑块上限也按图放大
  const defSize = Math.max(3, Math.round(img.naturalWidth / 250));
  const maxSize = Math.max(40, Math.round(img.naturalWidth / 30));
  const st = { e, img, canvas, ctx, tool: 'pen', color: '#ff3b30', size: defSize, undo: [], base: null, dragging: false, sx: 0, sy: 0, lastX: 0, lastY: 0, origExt, dirty: false };
  imgEditState = st;
  // 未保存守卫：图片一旦落过笔（dirty）就拦住离开，避免 Esc/✕ 静默清空画布
  dirtyCheck = () => !!imgEditState && imgEditState.dirty;
  const sizeInput = $('#ie-size'); sizeInput.max = String(maxSize); sizeInput.value = String(defSize);
  const fmtSel = $('#ie-format');
  fmtSel.value = ['jpg', 'jpeg'].includes(origExt) ? 'jpeg' : (origExt === 'webp' ? 'webp' : 'png');
  const toggleQ = () => { $('#ie-quality-wrap').style.display = fmtSel.value === 'png' ? 'none' : ''; };
  toggleQ();
  bindImageEditor(st, toggleQ);
}
function bindImageEditor(st, toggleQ) {
  $('#ie-tools').querySelectorAll('button').forEach((b) => { b.onclick = () => { st.tool = b.dataset.tool; $('#ie-tools').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b)); }; });
  // 粗细可视化：滑块旁的小圆点直观显示当前笔触粗细
  const updateDot = () => { const d = $('#ie-dot'); if (d) { const px = Math.min(22, Math.max(3, st.size)); d.style.width = px + 'px'; d.style.height = px + 'px'; d.style.background = st.color; d.title = st.size + 'px'; } };
  updateDot();
  $('#ie-color').oninput = (ev) => { st.color = ev.target.value; updateDot(); };
  $('#ie-size').oninput = (ev) => { st.size = Number(ev.target.value); updateDot(); };
  $('#ie-format').onchange = toggleQ;
  $('#ie-undo').onclick = () => ieUndo(st);
  const canvas = st.canvas;
  canvas.addEventListener('pointerdown', async (ev) => {
    const { x, y } = iePos(st, ev);
    if (st.tool === 'text') {
      const txt = await inputDialog('添加文字', '', '输入文字');
      if (!txt) return;
      st.undo.push(ieSnapshot(st)); if (st.undo.length > 25) st.undo.shift();
      const c = st.ctx; c.save(); c.fillStyle = st.color; c.textBaseline = 'top';
      c.font = `600 ${Math.max(14, st.size * 6)}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-ui')}`;
      c.fillText(txt, x, y); c.restore();
      st.dirty = true;
      return;
    }
    st.base = ieSnapshot(st); st.dragging = true; st.sx = x; st.sy = y; st.lastX = x; st.lastY = y;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!st.dragging) return;
    const { x, y } = iePos(st, ev);
    if (st.tool === 'pen') {
      // 自由画笔：逐段累加，画任意形状（不还原 base）
      const c = st.ctx; c.save(); c.strokeStyle = st.color; c.lineWidth = st.size; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(st.lastX, st.lastY); c.lineTo(x, y); c.stroke(); c.restore();
      st.lastX = x; st.lastY = y; return;
    }
    st.ctx.drawImage(st.base, 0, 0); // 还原到拖拽前，再画预览
    if (st.tool === 'mosaic') { st.ctx.save(); st.ctx.strokeStyle = st.color; st.ctx.setLineDash([6, 4]); st.ctx.lineWidth = 2; st.ctx.strokeRect(st.sx, st.sy, x - st.sx, y - st.sy); st.ctx.restore(); }
    else ieDrawShape(st, st.sx, st.sy, x, y);
  });
  canvas.addEventListener('pointerup', (ev) => {
    if (!st.dragging) return;
    st.dragging = false;
    const { x, y } = iePos(st, ev);
    if (st.tool !== 'pen') {
      st.ctx.drawImage(st.base, 0, 0);
      if (st.tool === 'mosaic') iePixelate(st, st.sx, st.sy, x, y);
      else ieDrawShape(st, st.sx, st.sy, x, y);
    }
    st.undo.push(st.base); if (st.undo.length > 25) st.undo.shift();
    st.dirty = true;
  });
  $('#ie-save').onclick = () => ieSave(st, false);
  $('#ie-saveas').onclick = () => ieSave(st, true);
}
function ieUndo(st) { const snap = st.undo.pop(); if (!snap) { toast('没有可撤销的'); return; } st.ctx.drawImage(snap, 0, 0); }
function ieExport(st) {
  const fmt = $('#ie-format').value;
  const w = Math.max(16, parseInt($('#ie-width').value, 10) || st.canvas.width);
  let out = st.canvas;
  if (w !== st.canvas.width) { const h = Math.round(st.canvas.height * (w / st.canvas.width)); out = document.createElement('canvas'); out.width = w; out.height = h; out.getContext('2d').drawImage(st.canvas, 0, 0, w, h); }
  const q = (parseInt($('#ie-quality').value, 10) || 85) / 100;
  const mime = fmt === 'jpeg' ? 'image/jpeg' : (fmt === 'webp' ? 'image/webp' : 'image/png');
  return { dataUrl: out.toDataURL(mime, q), ext: fmt === 'jpeg' ? 'jpg' : fmt };
}
async function ieSave(st, asNew) {
  const { dataUrl, ext } = ieExport(st);
  const sameType = st.origExt === ext || (['jpg', 'jpeg'].includes(st.origExt) && ext === 'jpg');
  let newName = null;
  if (asNew || !sameType) {
    const suggest = st.e.name.replace(/\.[^.]+$/, '') + (asNew ? '-编辑' : '') + '.' + ext;
    newName = await inputDialog(asNew ? '另存为' : '格式已变，另存为新文件', suggest, '文件名（含扩展名）');
    if (!newName) return;
  } else {
    // 覆盖原图不可逆且为有损重编码——给一次确认（删除都走废纸篓，覆盖更该拦）
    const ok = await confirmDialog('将覆盖原图、且重新编码（可能轻微降质），此操作不可恢复。确定覆盖？建议用「另存为」。');
    if (!ok) return;
  }
  const r = await apiPost('/api/image-save', { path: st.e.path, dataUrl, newName });
  if (r.error) { toast('保存失败：' + r.error, true); return; }
  toast(newName ? '已另存为 ' + baseOf(r.path) : '已保存（已覆盖原图）');
  imgEditState = null;
  await refresh();
  const saved = state.entries.find((x) => x.path === r.path) || st.e;
  applySelection(saved.path); openPreview(saved);
}

// ---------- 操作 ----------
async function openNewWindow(p = state.cwd) {
  const target = p || state.cwd || state.home || '';
  if (window.fanboxWindow && window.fanboxWindow.open) {
    const r = await window.fanboxWindow.open(target).catch((err) => ({ ok: false, error: err.message }));
    toast(r.ok ? '已在新窗口打开' : '新窗口打开失败：' + (r.error || ''), !r.ok);
    return;
  }
  window.open(target ? `/?targetPath=${encodeURIComponent(target)}` : '/', '_blank', 'noopener');
}
async function closeCurrentWindow() {
  if (window.fanboxWindow && window.fanboxWindow.close) {
    const r = await window.fanboxWindow.close().catch((err) => ({ ok: false, error: err.message }));
    if (!r.ok) toast('关闭窗口失败：' + (r.error || ''), true);
    return;
  }
  window.close();
}
async function openWith(p, withApp) {
  const r = await apiPost('/api/open', { path: p, with: withApp });
  if (r.ok) {
    const used = r.with;
    if (used === 'reveal') toast('已在文件管理器中显示');
    else if (used === 'terminal') toast('已在终端打开此目录');
    else if (used === 'editor') toast('已在编辑器打开');
    else if (withApp === 'editor' && used === 'default') toast('未找到 code 命令，已用默认应用打开');
    else toast('已打开');
    loadFavorites();
  } else toast('打开失败：' + (r.error || ''), true);
}
async function copyPath(p) {
  return copyPaths([p]);
}
function quotePath(p) {
  return `"${String(p).replace(/"/g, '\\"')}"`;
}
async function copyPaths(paths, opts = {}) {
  const list = (paths || []).filter(Boolean);
  if (!list.length) return;
  const text = (opts.quote ? list.map(quotePath) : list).join('\n');
  try {
    if (window.fanboxClipboard && window.fanboxClipboard.copyText) {
      const r = await window.fanboxClipboard.copyText(text);
      if (!r.ok) throw new Error(r.error || '复制失败');
    } else {
      await navigator.clipboard.writeText(text);
    }
    toast(opts.quote ? (list.length > 1 ? `已复制 ${list.length} 个带引号路径` : '已复制为路径') : (list.length > 1 ? `已复制 ${list.length} 个路径` : '已复制路径'));
  } catch {
    toast('复制失败（浏览器限制），路径：' + text, true);
  }
}
async function copyPathsQuoted(paths) {
  return copyPaths(paths, { quote: true });
}
async function refreshDir(showToast = false) {
  await refresh();
  if (showToast) toast('已刷新');
}
function pushUndo(op, opts = {}) {
  state.undoStack.push({ ...op, ts: Date.now() });
  if (state.undoStack.length > 20) state.undoStack.shift();
  if (opts.clearRedo !== false) state.redoStack = [];
}
function pushRedo(op) {
  state.redoStack.push({ ...op, ts: Date.now() });
  if (state.redoStack.length > 20) state.redoStack.shift();
}
async function undoLast() {
  const op = state.undoStack.pop();
  if (!op) { toast('没有可撤销的文件操作'); return; }
  if (op.type === 'rename') {
    const r = await apiPost('/api/rename', { path: op.toPath, newName: op.fromName }).catch((err) => ({ error: err.message }));
    if (r.error) { state.undoStack.push(op); toast('撤销重命名失败：' + r.error, true); return; }
    toast('已撤销重命名');
    await refresh();
    applySelection(r.path);
    pushRedo({ ...op, fromPath: r.path });
    return;
  }
  if (op.type === 'create') {
    const r = await apiPost('/api/trash', { path: op.path }).catch((err) => ({ error: err.message }));
    if (r.error) { state.undoStack.push(op); toast('撤销新建失败：' + r.error, true); return; }
    toast('已撤销新建');
    if (state.selected === op.path) { state.selected = null; state.selectionAnchor = null; }
    await refresh();
    pushRedo(op);
    return;
  }
  if (op.type === 'copy') {
    let fail = 0;
    for (const it of op.items || []) {
      const r = await apiPost('/api/trash', { path: it.path }).catch((err) => ({ error: err.message }));
      if (r.error) fail++;
    }
    toast(fail ? `撤销复制完成，${fail} 项失败` : `已撤销复制 ${op.items.length} 项`);
    await refresh();
    if (!fail) pushRedo(op); else state.undoStack.push(op);
    return;
  }
  if (op.type === 'move') {
    let fail = 0, restored = [], redoItems = [];
    for (const it of [...(op.items || [])].reverse()) {
      const r = await apiPost('/api/move', { src: it.to, dstDir: dirOf(it.from) }).catch((err) => ({ error: err.message }));
      if (r.error) fail++;
      else { restored.push(r.path); redoItems.push({ ...it, from: r.path }); }
    }
    toast(fail ? `撤销移动完成，${fail} 项失败` : `已撤销移动 ${op.items.length} 项`);
    await refresh();
    if (restored[0]) applySelection(restored[0]);
    if (!fail) pushRedo({ ...op, items: redoItems.reverse() }); else state.undoStack.push(op);
    return;
  }
  if (op.type === 'trash') {
    let fail = 0, restored = [];
    for (const it of [...(op.items || [])].reverse()) {
      const r = await apiPost('/api/trash-restore', { trashPath: it.trashPath, path: it.from }).catch((err) => ({ error: err.message }));
      if (r.error) fail++;
      else restored.push({ ...it, from: r.path });
    }
    toast(fail ? `撤销删除完成，${fail} 项恢复失败` : `已恢复 ${restored.length} 项`);
    await refresh();
    selectVisiblePaths(restored.map((it) => it.from));
    if (!fail) pushRedo({ ...op, items: restored.reverse() }); else state.undoStack.push(op);
    return;
  }
  if (op.type === 'archiveCreate' || op.type === 'archiveExtract') {
    const r = await apiPost('/api/trash', { path: op.path }).catch((err) => ({ error: err.message }));
    if (r.error) { state.undoStack.push(op); toast('撤销失败：' + r.error, true); return; }
    toast(op.type === 'archiveCreate' ? '已撤销压缩' : '已撤销解压');
    await refresh();
    pushRedo(op);
    return;
  }
  state.undoStack.push(op);
  toast('这一步暂不支持撤销', true);
}
async function redoLast() {
  const op = state.redoStack.pop();
  if (!op) { toast('没有可重做的文件操作'); return; }
  if (op.type === 'rename') {
    const r = await apiPost('/api/rename', { path: op.fromPath, newName: op.toName }).catch((err) => ({ error: err.message }));
    if (r.error) { state.redoStack.push(op); toast('重做重命名失败：' + r.error, true); return; }
    toast('已重做重命名');
    await refresh();
    applySelection(r.path);
    pushUndo({ ...op, toPath: r.path }, { clearRedo: false });
    return;
  }
  if (op.type === 'create') {
    const r = await apiPost('/api/create', { path: dirOf(op.path), name: op.name || baseOf(op.path), type: op.isDir ? 'dir' : 'file' }).catch((err) => ({ error: err.message }));
    if (r.error) { state.redoStack.push(op); toast('重做新建失败：' + r.error, true); return; }
    toast('已重做新建');
    await refresh();
    applySelection(r.path);
    pushUndo({ ...op, path: r.path, name: baseOf(r.path) }, { clearRedo: false });
    return;
  }
  if (op.type === 'copy') {
    let fail = 0, copied = [];
    for (const it of op.items || []) {
      const r = await apiPost('/api/copy-in', { src: it.from, dstDir: dirOf(it.path) }).catch((err) => ({ error: err.message }));
      if (r.error) fail++;
      else copied.push({ ...it, path: r.path });
    }
    toast(fail ? `重做复制完成，${fail} 项失败` : `已重做复制 ${copied.length} 项`);
    await refresh();
    selectVisiblePaths(copied.map((it) => it.path));
    if (!fail) pushUndo({ ...op, items: copied }, { clearRedo: false }); else state.redoStack.push(op);
    return;
  }
  if (op.type === 'move') {
    let fail = 0, moved = [];
    for (const it of op.items || []) {
      const r = await apiPost('/api/move', { src: it.from, dstDir: dirOf(it.to) }).catch((err) => ({ error: err.message }));
      if (r.error) fail++;
      else moved.push({ ...it, to: r.path });
    }
    toast(fail ? `重做移动完成，${fail} 项失败` : `已重做移动 ${moved.length} 项`);
    await refresh();
    selectVisiblePaths(moved.map((it) => it.to));
    if (!fail) pushUndo({ ...op, items: moved }, { clearRedo: false }); else state.redoStack.push(op);
    return;
  }
  if (op.type === 'trash') {
    let fail = 0, trashed = [];
    for (const it of op.items || []) {
      const r = await apiPost('/api/trash-undoable', { path: it.from }).catch((err) => ({ error: err.message }));
      if (r.error) fail++;
      else trashed.push({ ...it, from: r.originalPath || it.from, trashPath: r.trashPath || r.path, name: r.name || it.name, isDir: !!r.isDir });
    }
    toast(fail ? `重做删除完成，${fail} 项失败` : `已重做删除 ${trashed.length} 项`);
    await refresh();
    if (!fail) pushUndo({ ...op, items: trashed }, { clearRedo: false }); else state.redoStack.push(op);
    return;
  }
  if (op.type === 'archiveCreate') {
    const r = await apiPost('/api/archive/create-zip', { paths: op.paths, dstDir: op.dstDir, name: op.name }).catch((err) => ({ error: err.message }));
    if (r.error || !r.ok) { state.redoStack.push(op); toast('重做压缩失败：' + (r.error || '压缩失败'), true); return; }
    toast('已重做压缩');
    await refresh();
    selectVisiblePaths([r.path]);
    pushUndo({ ...op, path: r.path, name: r.name || baseOf(r.path) }, { clearRedo: false });
    return;
  }
  if (op.type === 'archiveExtract') {
    const r = await apiPost('/api/archive/extract', { path: op.archive }).catch((err) => ({ error: err.message }));
    if (r.error || !r.ok) { state.redoStack.push(op); toast('重做解压失败：' + (r.error || '解压失败'), true); return; }
    toast('已重做解压');
    await refresh();
    selectVisiblePaths([r.path]);
    pushUndo({ ...op, path: r.path, name: r.name || baseOf(r.path) }, { clearRedo: false });
    return;
  }
  state.redoStack.push(op);
  toast('这一步暂不支持重做', true);
}
// 记录最近打开：内部预览/编辑也算「打开过」，本地即时置顶 + 异步落库
function recordRecent(p) {
  if (!p) return;
  state.recentOpened = [p, ...(state.recentOpened || []).filter((x) => x !== p)].slice(0, 30);
  renderRecents();
  apiPost('/api/recent-open', { path: p }).catch(() => {});
}
async function toggleFav(e) {
  const r = await apiPost('/api/favorites', { path: e.path, name: e.name, isDir: e.isDir });
  state.favorites = r.favorites;
  renderFavs();
  if (!$('#preview').classList.contains('hidden') && state.selected === e.path) renderPreviewActions(e);
  // 只更新该项的星标，不重建网格（避免重新解码所有缩略图）
  const on = isFav(e.path);
  const star = $('#file-area').querySelector(`[data-path="${CSS.escape(e.path)}"] .fav-btn`);
  if (star) { star.classList.toggle('on', on); star.innerHTML = svgWrap(SVG.star, 'currentColor', 15, on); }
  toast(on ? '已收藏' : '已取消收藏');
}

// ---------- 文件操作（编辑 / 重命名 / 废纸篓 / 新建）----------
// 重拉当前目录但保留筛选词，操作后刷新视图
async function refresh() {
  if (state.virtualMode === 'this-pc') {
    await loadDrives();
    await openThisPcView(false);
    return;
  }
  if (!state.cwd || state.recentMode) return;
  const oldSelected = state.selected;
  const oldMultiSel = new Set(state.multiSel);
  const oldAnchor = state.selectionAnchor;
  const oldCursor = state.cursor;
  const oldScrollTop = fileScrollTop();
  const data = await api('/api/list?path=' + encodeURIComponent(state.cwd));
  if (data.error) return;
  state.entries = prepareEntries(data.entries);
  state.project = data.project;
  state.breadcrumb = data.breadcrumb;
  renderBreadcrumb();
  renderFiles();
  restoreSelectionAfterRefresh(oldSelected, oldMultiSel, oldAnchor, oldCursor);
  syncPreviewAfterRefresh();
  restoreFileScrollTop(oldScrollTop);
}
// 文本原地编辑：md → Milkdown Crepe 所见即所得；其它 → Monaco；都失败回退 textarea
async function enterEditMode(e) {
  if (!await guardDirty()) return;
  mona.disposeIfAny();
  crepe.disposeIfAny();
  showPreviewPanel();
  state.selected = e.path;
  $('#preview-title').textContent = e.name;
  renderPreviewActions(e);
  renderPreviewFoot(e);
  const body = $('#preview-body');
  body.innerHTML = '<div class="cmdk-loading">加载中…</div>';
  const data = await api('/api/read?path=' + encodeURIComponent(e.path));
  if (data.tooLarge) {
    toast('文件太大，暂不支持原地编辑', true);
    if (isMdName(e.name)) { renderTextPreview(data); return; } // md 预览即编辑，回 openPreview 会循环
    openPreview(e); return;
  }
  if (isMdName(e.name)) return mdEditor(e, data); // md：所见即所得 + 自动保存 + 源码切换
  const ex = (data.ext || '').toLowerCase();
  let baseMtime = data.mtime; // 并发覆盖保护基准
  let getValue, baseline = ''; // baseline：编辑器内的「已保存基准」，用于未保存守卫
  const leave = async () => {
    if (getValue && getValue() !== baseline) {
      const ok = await confirmDialog(`有未保存的改动，放弃并退出？（保存请点取消后按 ${MOD}S）`);
      if (!ok) return;
    }
    dirtyCheck = null; // 已在此确认过，避免 openPreview 的守卫再问一次
    mona.disposeIfAny(); crepe.disposeIfAny(); openPreview(e);
  };
  const save = async (force) => {
    const content = getValue();
    const r = await apiPost('/api/write', { path: e.path, content, expectedMtime: force ? 0 : baseMtime });
    if (r.conflict) {
      const ok = await confirmDialog('文件已被外部修改（可能是 agent 改的）。覆盖会丢掉外部改动，确定覆盖？');
      if (ok) return save(true);
      return;
    }
    if (r.ok === false || r.error) { toast('保存失败：' + (r.error || ''), true); return; }
    baseMtime = r.mtime; baseline = content; // 更新已保存基准
    toast('已保存');
    refresh(); // 后台刷新文件区，不打断编辑（⌘S 留在编辑器里）
  };
  // 挂上未保存守卫：离开编辑器（切文件/跳目录/关预览）前比对当前值与已保存基准
  dirtyCheck = () => !!getValue && getValue() !== baseline;

  if (await mona.load()) {
    const monaco = window.monaco;
    body.innerHTML =
      `<div class="editor-bar"><button id="ed-save" class="primary">保存</button><button id="ed-cancel" class="ghost-btn">完成</button><span class="editor-hint">${MOD}S 保存 · ${MOD}F 查找 · Esc 完成</span></div>` +
      `<div id="ed-host" class="mona-host"></div>`;
    const ed = monaco.editor.create($('#ed-host'), {
      value: data.content || '', language: mona.lang(ex), theme: mona.themeName(),
      fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace',
      fontSize: 13, lineHeight: 1.7, automaticLayout: true, minimap: { enabled: false },
      scrollBeyondLastLine: false, renderWhitespace: 'none', tabSize: 2, wordWrap: mona.wraps(ex) ? 'on' : 'off',
      smoothScrolling: true, padding: { top: 10, bottom: 10 }, fontLigatures: true,
    });
    mona.editor = ed;
    getValue = () => ed.getValue();
    ed.addCommand(monaco.KeyMod.CmdCtrl | monaco.KeyCode.KeyS, () => save());
    // Esc 退出编辑，但查找/建议浮窗打开时让 Esc 先关浮窗
    ed.addCommand(monaco.KeyCode.Escape, () => leave(), '!findWidgetVisible && !suggestWidgetVisible');
    setTimeout(() => ed.focus(), 0);
  } else {
    body.innerHTML =
      `<div class="editor-bar"><button id="ed-save" class="primary">保存</button><button id="ed-cancel" class="ghost-btn">完成</button><span class="editor-hint">${MOD}S 保存 · Esc 完成</span></div>` +
      `<textarea id="ed-host" class="editor-area" spellcheck="false"></textarea>`;
    const ta = $('#ed-host');
    ta.value = data.content || '';
    ta.focus();
    getValue = () => ta.value;
    ta.addEventListener('keydown', (ev) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') { ev.preventDefault(); save(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); leave(); }
      ev.stopPropagation(); // 别冒泡到主区键盘导航
    });
  }
  baseline = getValue ? getValue() : ''; // 以编辑器初始内容（Crepe 已规范化）为基准，避免误报未保存
  $('#ed-save').onclick = () => save();
  $('#ed-cancel').onclick = () => leave();
}
// md 预览即编辑：打开就是 Crepe 所见即所得，停笔 0.8s 自动落盘；「源码」按钮切 Monaco。
// 离开（切文件/跳目录/关预览）由 guardDirty 的 autosaveFlush 把残余改动写掉，不弹确认框。
async function mdEditor(e, data, mode = 'rich') {
  const body = $('#preview-body');
  let baseMtime = data.mtime;
  let content0 = data.content || '';
  let getValue = null, baseline = '';
  let timer = null, paused = false;
  let chain = Promise.resolve(); // 写盘串行化：防抖到点的保存和离开时的 flush 不互相踩
  const setStatus = (t) => { const s = $('#md-status'); if (s) s.textContent = t; };
  const doSave = async (force) => {
    if (!getValue || paused) return;
    const content = getValue();
    if (content === baseline) return;
    setStatus('保存中…');
    const r = await apiPost('/api/write', { path: e.path, content, expectedMtime: force ? 0 : baseMtime });
    if (r.conflict) {
      paused = true;
      const ok = await confirmDialog('文件已被外部修改（可能是 agent 改的）。覆盖会丢掉外部改动，确定覆盖？');
      paused = false;
      if (ok) return doSave(true);
      setStatus('未保存：文件被外部修改');
      return;
    }
    if (r.ok === false || r.error) { setStatus('保存失败'); toast('保存失败：' + (r.error || ''), true); return; }
    baseMtime = r.mtime; baseline = content;
    setStatus('已保存');
  };
  const queue = () => { clearTimeout(timer); timer = setTimeout(() => { chain = chain.then(() => doSave()); }, 800); };
  const flush = () => { clearTimeout(timer); chain = chain.then(() => doSave()); return chain; };
  autosaveFlush = flush;
  dirtyCheck = null;
  const render = async (m) => {
    mode = m;
    mona.disposeIfAny(); crepe.disposeIfAny();
    body.innerHTML =
      `<div class="editor-bar"><button id="md-mode" class="ghost-btn">${m === 'rich' ? '源码' : '富文本'}</button><span id="md-status" class="editor-hint">自动保存 · ${MOD}S 立即保存</span></div>` +
      `<div id="ed-host" class="${m === 'rich' ? 'crepe-host' : 'mona-host'}"></div>`;
    $('#md-mode').onclick = async () => {
      await flush();
      content0 = getValue ? getValue() : content0;
      render(m === 'rich' ? 'code' : 'rich');
    };
    const host = $('#ed-host');
    if (m === 'rich') {
      const C = await crepe.load();
      if (!C) { render('code'); return; } // Crepe 加载失败 → 源码模式兜底
      // 保护 YAML frontmatter：Crepe 不识别会丢掉，剥离后只把正文交给它，保存时再拼回
      const fm = /^(---\r?\n[\s\S]*?\r?\n---\r?\n)/.exec(content0);
      const front = fm ? fm[1] : '';
      const inst = new C.Crepe({ root: host, defaultValue: front ? content0.slice(front.length) : content0 });
      try { inst.on((l) => l.markdownUpdated(() => queue())); } catch { /* 旧版 Crepe 无 .on，靠下面的 input 兜底 */ }
      host.addEventListener('input', () => queue(), true); // 兜底：键入路径一定触发
      await inst.create();
      crepe.editor = inst;
      getValue = () => front + inst.getMarkdown();
      // ⌘S 立即保存：捕获阶段拦在 ProseMirror 与全局键盘导航之前
      host.addEventListener('keydown', (ev) => {
        if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') { ev.preventDefault(); ev.stopPropagation(); flush(); }
      }, true);
    } else if (await mona.load()) {
      const monaco = window.monaco;
      const ed = monaco.editor.create(host, {
        value: content0, language: 'markdown', theme: mona.themeName(),
        fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace',
        fontSize: 13, lineHeight: 1.7, automaticLayout: true, minimap: { enabled: false },
        scrollBeyondLastLine: false, renderWhitespace: 'none', tabSize: 2, wordWrap: 'on',
        smoothScrolling: true, padding: { top: 10, bottom: 10 }, fontLigatures: true,
      });
      mona.editor = ed;
      getValue = () => ed.getValue();
      ed.onDidChangeModelContent(() => queue());
      ed.addCommand(monaco.KeyMod.CmdCtrl | monaco.KeyCode.KeyS, () => flush());
    } else {
      const ta = document.createElement('textarea');
      ta.id = 'ed-host'; ta.className = 'editor-area'; ta.spellcheck = false;
      host.replaceWith(ta);
      ta.value = content0;
      getValue = () => ta.value;
      ta.addEventListener('input', () => queue());
      ta.addEventListener('keydown', (ev) => {
        if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') { ev.preventDefault(); flush(); }
        ev.stopPropagation(); // 别冒泡到主区键盘导航
      });
    }
    baseline = getValue(); // 以编辑器规范化后的内容为基准：打开不编辑就不会触发写盘
  };
  await render(mode);
}
async function doRename(e, opts = {}) {
  if (e.isDrive) { toast('盘符不能重命名', true); return null; }
  const area = $('#file-area');
  const row = area.querySelector(`[data-path="${CSS.escape(e.path)}"]`);
  const nameEl = row && row.querySelector('.fname');
  if (!row || !nameEl) {
    const fallback = await inputDialog('重命名', e.name, '输入新名称');
    if (!fallback || fallback === e.name) return;
    return commitRename(e, fallback, opts);
  }
  row.classList.add('renaming');
  row.draggable = false;
  nameEl.dataset.oldHtml = nameEl.innerHTML;
  nameEl.innerHTML = '';
  const input = document.createElement('input');
  input.className = 'rename-inline';
  input.value = e.name;
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', '重命名');
  nameEl.appendChild(input);
  let done = false;
  const finish = async (commit) => {
    if (done) return;
    done = true;
    const next = input.value.trim();
    row.classList.remove('renaming');
    row.draggable = true;
    nameEl.innerHTML = nameEl.dataset.oldHtml || escapeHtml(e.name);
    delete nameEl.dataset.oldHtml;
    if (!commit || !next || next === e.name) { if (opts.afterCancel) await opts.afterCancel(e); return; }
    const r = await commitRename(e, next, opts);
    if (!r && opts.afterCancel) await opts.afterCancel(e);
  };
  input.addEventListener('click', (ev) => ev.stopPropagation());
  input.addEventListener('dblclick', (ev) => ev.stopPropagation());
  input.addEventListener('keydown', async (ev) => {
    ev.stopPropagation();
    if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
    else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
    else if (ev.key === 'Tab') {
      ev.preventDefault();
      const continueRename = renameAdjacentVisible(e.path, ev);
      await finish(true);
      await continueRename();
    }
  });
  input.addEventListener('blur', () => finish(true));
  input.focus();
  const [from, to] = opts.selectAll ? [0, e.name.length] : editableNameRange(e);
  input.setSelectionRange(from, to);
}
function renameAdjacentVisible(path, ev) {
  const direction = ev.shiftKey ? -1 : 1;
  const idx = state.visible.findIndex((x) => x.path === path);
  const nextEntry = idx >= 0 ? state.visible[idx + direction] : null;
  return async () => {
    if (!nextEntry) return;
    const nextEntryFresh = state.visible.find((x) => x.path === nextEntry.path) || nextEntry;
    const nextIdx = state.visible.findIndex((x) => x.path === nextEntryFresh.path);
    state.selected = nextEntryFresh.path;
    state.cursor = nextIdx >= 0 ? nextIdx : idx + direction;
    state.multiSel.clear();
    renderFiles();
    await doRename(nextEntryFresh);
  };
}
async function commitRename(e, name, opts = {}) {
  if (!opts.skipExtWarning && renameChangesExtension(e, name)) {
    const ok = await confirmDialog(`如果更改文件扩展名，文件可能无法正常打开。\n确定要把「${e.name}」重命名为「${name}」吗？`);
    if (!ok) return null;
  }
  const r = await apiPost('/api/rename', { path: e.path, newName: name });
  if (r.error) { toast('重命名失败：' + r.error, true); return null; }
  toast('已重命名');
  if (!opts.skipUndo) pushUndo({ type: 'rename', fromPath: e.path, toPath: r.path, fromName: e.name, toName: name });
  if (state.selected === e.path) state.selected = r.path;
  if (state.multiSel.has(e.path)) { state.multiSel.delete(e.path); state.multiSel.add(r.path); }
  await refresh();
  if (opts.afterCommit) await opts.afterCommit(r);
  return r;
}
// ---------- 资源管理器化:组删除 / 文件剪贴板(Ctrl+C/X/V) ----------
async function trashSelection() {
  let items = selEntries();
  const cur = currentEntry();
  if (!items.length && cur) items = [cur];
  if (items.some((it) => it.isDrive)) { toast('不能对盘符执行文件操作', true); return []; }
  if (!items.length) return;
  if (items.length === 1) return doTrash(items[0]);
  const nextIdx = Math.min(...items.map((it) => state.visible.findIndex((e) => e.path === it.path)).filter((i) => i >= 0));
  const ok = await confirmDialog(`把选中的 ${items.length} 项移到废纸篓？可从废纸篓恢复。`);
  if (!ok) return;
  let fail = 0;
  const undoItems = [];
  for (const it of items) {
    const r = await apiPost('/api/trash-undoable', { path: it.path });
    if (r.error) fail++;
    else undoItems.push({ from: r.originalPath || it.path, trashPath: r.trashPath || r.path, name: it.name, isDir: it.isDir });
  }
  if (undoItems.length) pushUndo({ type: 'trash', items: undoItems, label: '删除' });
  toast(fail ? `完成，${fail} 项删除失败` : `已把 ${items.length} 项移到废纸篓，Ctrl+Z 可恢复`);
  state.multiSel.clear();
  await refresh();
  if (Number.isFinite(nextIdx)) selectNearestIndex(nextIdx);
}
async function deleteSelectionPermanent() {
  let items = selEntries();
  const cur = currentEntry();
  if (!items.length && cur) items = [cur];
  if (items.some((it) => it.isDrive)) { toast('不能对盘符执行文件操作', true); return []; }
  if (!items.length) return;
  if (items.length === 1) return doDeletePermanent(items[0]);
  const nextIdx = Math.min(...items.map((it) => state.visible.findIndex((e) => e.path === it.path)).filter((i) => i >= 0));
  const ok = await confirmDialog(`永久删除选中的 ${items.length} 项？不会进入废纸篓。`);
  if (!ok) return;
  let fail = 0;
  for (const it of items) {
    const r = await apiPost('/api/delete', { path: it.path });
    if (r.error) fail++;
  }
  toast(fail ? `完成，${fail} 项永久删除失败` : `已永久删除 ${items.length} 项`);
  if (items.some((it) => it.path === state.selected)) closePreview();
  state.selected = null;
  state.multiSel.clear();
  await refresh();
  if (Number.isFinite(nextIdx)) selectNearestIndex(nextIdx);
}
async function clipSet(op) {
  const entries = mutableSelectedEntries();
  const paths = entries.map((e) => e.path);
  if (!paths.length) return;
  setFileClip(op, paths);
  paintCutMarks();
  let sys = false;
  if (window.fanboxClipboard && window.fanboxClipboard.copyFiles) {
    const r = await window.fanboxClipboard.copyFiles(paths, op).catch((err) => ({ ok: false, error: err.message }));
    sys = !!r.ok;
  }
  const extra = sys ? `；也可在系统文件管理器里${op === 'cut' ? '移动' : '粘贴'}` : '';
  toast(`${op === 'cut' ? '已剪切' : '已复制'} ${paths.length} 项，到目标文件夹按 ${IS_MAC ? '⌘' : 'Ctrl+'}V ${op === 'cut' ? '移动' : '粘贴'}${extra}`);
}
async function clipPaste(dstDir) {
  let clip = state.fileClip;
  if ((!clip || !clip.paths.length) && window.fanboxClipboard && window.fanboxClipboard.readFiles) {
    const r = await window.fanboxClipboard.readFiles().catch((err) => ({ ok: false, paths: [], error: err.message }));
    if (r.ok && r.paths && r.paths.length) clip = { op: r.op === 'cut' ? 'cut' : 'copy', paths: r.paths, external: true };
  }
  if (!clip || !clip.paths.length) return;
  const dst = dstDir || state.cwd;
  const norm = (p) => String(p).replace(/[\\/]+$/, '');
  let okCount = 0, lastErr = '';
  const undoItems = [];
  for (const src of clip.paths) {
    if (clip.op === 'cut' && norm(dirOf(src)) === norm(dst)) continue; // 原地剪切粘贴=没动
    const r = await apiPost(clip.op === 'cut' ? '/api/move' : '/api/copy-in', { src, dstDir: dst }).catch((err) => ({ ok: false, error: err.message }));
    if (r.ok) {
      okCount++;
      if (clip.op === 'cut') undoItems.push({ from: src, to: r.path });
      else undoItems.push({ path: r.path, from: src });
    } else lastErr = r.error || '失败';
  }
  if (okCount) {
    pushUndo({ type: clip.op === 'cut' ? 'move' : 'copy', items: undoItems, label: clip.op === 'cut' ? '移动' : '复制' });
    toast(`已${clip.op === 'cut' ? '移动' : '粘贴'} ${okCount} 项`);
    await refresh();
    selectVisiblePaths(undoItems.map((it) => it.to || it.path));
  }
  if (lastErr) toast(lastErr, true);
  if (clip.op === 'cut') {
    setFileClip(null); // 剪切是一次性的(资源管理器同款)
    paintCutMarks();
  }
}

async function doTrash(e) {
  if (e.isDrive) { toast('不能删除盘符', true); return; }
  // 文件秒删（花叔的选择），但删整个文件夹给一次轻确认——误删项目目录代价高
  const nextIdx = state.visible.findIndex((x) => x.path === e.path);
  if (e.isDir) {
    const ok = await confirmDialog(`把文件夹「${e.name}」移到废纸篓？可从废纸篓恢复。`);
    if (!ok) return;
  }
  const r = await apiPost('/api/trash-undoable', { path: e.path });
  if (r.error) { toast('删除失败：' + r.error, true); return; }
  pushUndo({ type: 'trash', items: [{ from: r.originalPath || e.path, trashPath: r.trashPath || r.path, name: e.name, isDir: e.isDir }], label: '删除' });
  toast('已移到废纸篓，Ctrl+Z 可恢复');
  if (state.selected === e.path) closePreview();
  await refresh();
  if (nextIdx >= 0) selectNearestIndex(nextIdx);
}
async function doDeletePermanent(e) {
  if (e.isDrive) { toast('不能永久删除盘符', true); return; }
  const nextIdx = state.visible.findIndex((x) => x.path === e.path);
  const ok = await confirmDialog(`永久删除「${e.name}」？不会进入废纸篓。`);
  if (!ok) return;
  const r = await apiPost('/api/delete', { path: e.path });
  if (r.error) { toast('永久删除失败：' + r.error, true); return; }
  toast('已永久删除');
  if (state.selected === e.path) closePreview();
  state.selected = null;
  state.multiSel.delete(e.path);
  await refresh();
  if (nextIdx >= 0) selectNearestIndex(nextIdx);
}
function uniqueEntryName(base, ext = '') {
  const names = new Set(state.entries.map((x) => x.name.toLocaleLowerCase('zh')));
  let name = base + ext;
  let i = 2;
  while (names.has(name.toLocaleLowerCase('zh'))) name = `${base} (${i++})${ext}`;
  return name;
}
async function doCreate(type) {
  if (!state.cwd || state.recentMode || state.skillsMode) return;
  const name = type === 'dir' ? uniqueEntryName('新建文件夹') : uniqueEntryName('新建文本文档', '.txt');
  const r = await apiPost('/api/create', { path: state.cwd, name, type });
  if (r.error) { toast('新建失败：' + r.error, true); return; }
  await refresh();
  const ne = state.entries.find((x) => x.path === r.path);
  if (!ne) { toast(type === 'dir' ? '已新建文件夹' : '已新建文件'); return; }
  state.selected = ne.path;
  state.multiSel.clear();
  state.cursor = state.visible.findIndex((x) => x.path === ne.path);
  paintSelection();
  highlightCursor();
  await waitForRenderedEntry(ne.path);
  await doRename(ne, {
    selectAll: true,
    skipUndo: true,
    skipExtWarning: true,
    afterCommit: async (renamed) => {
      pushUndo({ type: 'create', path: renamed.path, name: baseOf(renamed.path), isDir: type === 'dir' });
      if (type !== 'file') return;
      const saved = state.entries.find((x) => x.path === renamed.path);
      if (saved && saved.kind === 'text') await enterEditMode(saved);
    },
    afterCancel: async () => {
      pushUndo({ type: 'create', path: ne.path, name: ne.name, isDir: type === 'dir' });
    },
  });
}
// 通用输入弹窗（替代原生 prompt，配合皮肤）
function inputDialog(title, value = '', placeholder = '') {
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'input-overlay';
    ov.innerHTML = `<div class="input-dialog"><div class="input-title">${escapeHtml(title)}</div>
      <input class="input-field" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" spellcheck="false">
      <div class="input-actions"><button class="ghost-btn" data-act="cancel">取消</button><button class="primary" data-act="ok">确定</button></div></div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector('.input-field');
    inp.focus();
    inp.select();
    const done = (v) => { ov.remove(); resolve(v); };
    ov.querySelector('[data-act=ok]').onclick = () => done(inp.value.trim());
    ov.querySelector('[data-act=cancel]').onclick = () => done(null);
    ov.onclick = (ev) => { if (ev.target === ov) done(null); };
    inp.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter') { ev.preventDefault(); done(inp.value.trim()); }
      else if (ev.key === 'Escape') { ev.preventDefault(); done(null); }
    });
  });
}
// 是/否确认弹窗
function confirmDialog(msg) {
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'input-overlay';
    ov.innerHTML = `<div class="input-dialog"><div class="input-title">${escapeHtml(msg)}</div><div class="input-actions"><button class="ghost-btn" data-act="no">取消</button><button class="primary" data-act="yes">确定</button></div></div>`;
    document.body.appendChild(ov);
    const done = (v) => { ov.remove(); document.removeEventListener('keydown', onKey, true); resolve(v); };
    function onKey(ev) { if (ev.key === 'Escape') { ev.preventDefault(); done(false); } else if (ev.key === 'Enter') { ev.preventDefault(); done(true); } }
    ov.querySelector('[data-act=yes]').onclick = () => done(true);
    ov.querySelector('[data-act=no]').onclick = () => done(false);
    ov.onclick = (ev) => { if (ev.target === ov) done(false); };
    document.addEventListener('keydown', onKey, true);
    ov.querySelector('[data-act=yes]').focus();
  });
}
// ---------- 截图直通车：系统截屏落盘 → 右下角浮出直通卡，终端/素材/标注一步到位 ----------
const shotTray = {
  el: null, timer: null,
  init() {
    if (!window.fanboxShot) return; // 浏览器版没有截屏监听
    window.fanboxShot.onNew((m) => this.show(m));
  },
  show(m) {
    this.dismiss();
    const el = document.createElement('div');
    el.className = 'shot-card';
    el.innerHTML = `
      <img class="shot-thumb" draggable="true" src="/api/thumb?path=${encodeURIComponent(m.path)}&w=480&v=${m.size}" title="新截图 · 可拖进终端">
      <div class="shot-info"><div class="shot-name">${escapeHtml(m.name)}</div>
      <div class="shot-acts">
        <button data-act="term" title="把路径喂给终端里的 agent">→ 终端</button>
        <button data-act="save" title="移动到当前文件夹的 素材/ 子目录">收进素材</button>
        <button data-act="edit" title="圈重点再发">标注</button>
        <button data-act="close" title="不理它也会自己走">✕</button>
      </div></div>`;
    document.body.appendChild(el);
    this.el = el;
    const img = el.querySelector('.shot-thumb');
    img.ondragstart = (ev) => ev.dataTransfer.setData('text/plain', m.path);
    img.onclick = () => lightbox(m.path);
    el.querySelector('[data-act=term]').onclick = () => { term.insertPath(m.path); this.dismiss(); };
    el.querySelector('[data-act=save]').onclick = async () => {
      const r = await apiPost('/api/move', { src: m.path, dstDir: state.cwd + '/素材' });
      if (r.ok) toast('已收进 素材/'); else toast(r.error || '移动失败', true);
      this.dismiss();
    };
    el.querySelector('[data-act=edit]').onclick = () => {
      this.dismiss();
      enterImageEdit({ path: m.path, name: m.name, kind: 'image', size: m.size, mtime: Date.now() });
    };
    el.querySelector('[data-act=close]').onclick = () => this.dismiss();
    this.timer = setTimeout(() => this.dismiss(), 45000);
  },
  dismiss() { clearTimeout(this.timer); if (this.el) { this.el.remove(); this.el = null; } },
};

// 项目记忆：这个文件夹里 AI 干过什么——历史会话考古，可展开改过的文件，可一键续上
async function memoryPanel(dirPath) {
  const old = $('.mem-overlay'); if (old) old.remove();
  const ov = document.createElement('div');
  ov.className = 'input-overlay mem-overlay';
  ov.innerHTML = `<div class="input-dialog mem-dialog">
    <div class="input-title">项目记忆 · ${escapeHtml(dirPath.replace(state.home, '~'))}</div>
    <div class="mem-body"><div class="cmdk-loading">翻会话日志中…</div></div></div>`;
  document.body.appendChild(ov);
  const onKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); close(); } };
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
  ov.onclick = (ev) => { if (ev.target === ov) close(); };
  document.addEventListener('keydown', onKey, true);
  const d = await api('/api/project-memory?path=' + encodeURIComponent(dirPath));
  const body = ov.querySelector('.mem-body');
  if (!d.ok || !d.sessions.length) {
    body.innerHTML = '<div class="empty-state">这个文件夹还没有 agent 会话记录<br><br><span class="usage-sub">在这里跑过 Claude Code / Codex 之后，历史会话会出现在这里</span></div>';
    return;
  }
  body.innerHTML = d.sessions.map((s, i) => `
    <div class="mem-sess">
      <div class="mem-head" data-i="${i}">
        <span class="mem-agent${s.agent === 'codex' ? ' codex' : ''}">${s.agent === 'codex' ? '>_' : 'C'}</span>
        <span class="mem-title">${escapeHtml(s.title || '（无标题会话）')}</span>
        <button class="ghost-btn mem-resume" data-i="${i}" title="在内嵌终端里接上这段会话的上下文继续">▶ 续上</button>
      </div>
      <div class="mem-meta">${fmtTime(s.lastT)} · ${s.userMsgs} 条消息${s.files.length ? ` · 改了 ${s.files.length} 个文件` : ''}${s.skills.length ? ' · ' + s.skills.map((k) => `<i class="mem-skill">${escapeHtml(k)}</i>`).join(' ') : ''}</div>
      ${s.files.length ? `<div class="mem-files hidden">${s.files.map((f) => `<div class="mem-file" data-p="${escapeHtml(f)}" title="${escapeHtml(f)}">${escapeHtml(f.startsWith(dirPath + '/') ? f.slice(dirPath.length + 1) : f.replace(state.home, '~'))}</div>`).join('')}</div>` : ''}
    </div>`).join('');
  body.querySelectorAll('.mem-head').forEach((h) => {
    h.onclick = (ev) => {
      if (ev.target.closest('.mem-resume')) return;
      const files = h.parentElement.querySelector('.mem-files');
      if (files) files.classList.toggle('hidden');
    };
  });
  body.querySelectorAll('.mem-resume').forEach((b) => {
    b.onclick = () => {
      const s = d.sessions[Number(b.dataset.i)];
      const cmd = s.agent === 'codex' ? `codex resume ${s.id}` : `claude --dangerously-skip-permissions --resume ${s.id}`;
      close();
      term.runInDir(dirPath, cmd, '已在终端续上会话');
    };
  });
  body.querySelectorAll('.mem-file').forEach((f) => {
    f.onclick = async () => {
      const p = f.dataset.p;
      close();
      await navigate(dirOf(p));
      const e = state.entries.find((x) => x.path === p);
      if (e) { state.selected = p; openPreview(e); renderFiles(); }
    };
  });
}

// AI 整理：一键在内嵌终端拉起交互式 agent（claude/codex）对话式整理。
// 翻箱只备料——把整理偏好、过往整理历史、工作约定写成 brief 文件，agent 读完先摊方案，
// 你在终端里对话确认/调整后它才动手；每批移动写回滚日志，想撤销在对话里说一声就行
async function organizeLaunch(dirPath) {
  const r = await apiPost('/api/organize/launch', { path: dirPath });
  if (!r.ok) { toast(r.error || 'AI 整理启动失败', true); return; }
  term.runInDir(dirPath, r.cmd, `${r.engine === 'codex' ? 'Codex' : 'Claude'} 已开聊——先摊方案，你点头它才动手`);
}
function isExtractableArchive(e) {
  return !!(e && !e.isDir && /\.(zip|jar)$/i.test(e.name || ''));
}
async function createZipFromEntries(items) {
  items = (items || []).filter(Boolean);
  if (!items.length) return;
  const dstDir = state.cwd || dirOf(items[0].path);
  const name = items.length === 1 ? `${items[0].name}.zip` : '压缩包.zip';
  const r = await apiPost('/api/archive/create-zip', { paths: items.map((e) => e.path), dstDir, name }).catch((err) => ({ error: err.message }));
  if (r.error || !r.ok) { toast('压缩失败：' + (r.error || '未知错误'), true); return; }
  toast(`已压缩为 ${r.name || baseOf(r.path)}`);
  pushUndo({ type: 'archiveCreate', paths: items.map((e) => e.path), dstDir, name, path: r.path });
  await refresh();
  selectVisiblePaths([r.path]);
}
async function extractArchiveEntry(e) {
  if (!isExtractableArchive(e)) return;
  const r = await apiPost('/api/archive/extract', { path: e.path }).catch((err) => ({ error: err.message }));
  if (r.error || !r.ok) { toast('解压失败：' + (r.error || '未知错误'), true); return; }
  toast(`已解压到 ${r.name || baseOf(r.path)}`);
  pushUndo({ type: 'archiveExtract', archive: e.path, path: r.path, name: r.name || baseOf(r.path) });
  await refresh();
  selectVisiblePaths([r.path]);
}

// 发版向导：版本号 + 发布说明（预填 CHANGELOG 的 Unreleased 段）→ 命令序列在内嵌终端跑，每步可见可拦
async function releasePanel() {
  const dirPath = state.cwd;
  const old = $('.rel-overlay'); if (old) old.remove();
  const ov = document.createElement('div');
  ov.className = 'input-overlay rel-overlay';
  ov.innerHTML = `<div class="input-dialog rel-dialog"><div class="input-title">发版</div><div class="rel-body"><div class="cmdk-loading">检查项目状态…</div></div></div>`;
  document.body.appendChild(ov);
  const onKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); close(); } };
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
  ov.onclick = (ev) => { if (ev.target === ov) close(); };
  document.addEventListener('keydown', onKey, true);
  const d = await api('/api/release/inspect?path=' + encodeURIComponent(dirPath));
  const body = ov.querySelector('.rel-body');
  if (!d.ok) { body.innerHTML = `<div class="empty-state">${escapeHtml(d.error)}</div>`; return; }
  const bump = d.version.replace(/(\d+)(\D*)$/, (m, n, t) => (Number(n) + 1) + t);
  body.innerHTML = `
    <div class="rel-row"><label>版本号</label><span class="rel-cur">当前 v${escapeHtml(d.version)} →</span><input id="rel-ver" value="${escapeHtml(bump)}" spellcheck="false"></div>
    <div class="rel-row rel-col"><label>发布说明${d.unreleased ? '（预填自 CHANGELOG 的 Unreleased 段）' : ''}</label><textarea id="rel-notes" rows="8" spellcheck="false">${escapeHtml(d.unreleased)}</textarea></div>
    <div class="rel-opts">
      ${d.hasDist ? '<label><input type="checkbox" id="rel-dist" checked> 打包（npm run dist）</label>' : ''}
      ${d.remote ? '<label><input type="checkbox" id="rel-push" checked> 推送（git push）</label>' : ''}
      ${d.gh && d.remote ? '<label><input type="checkbox" id="rel-gh" checked> GitHub Release' + (d.hasDist ? '（附 dmg）' : '') + '</label>' : ''}
    </div>
    ${d.dirty ? '<div class="rel-hint">工作区有未提交改动，会一并进这次发版 commit</div>' : ''}
    ${!d.isRepo ? '<div class="rel-hint">这里不是 git 仓库，只能改版本号</div>' : ''}
    <div class="input-actions"><button class="ghost-btn" id="rel-cancel">取消</button><button class="primary" id="rel-go">在终端开跑</button></div>`;
  $('#rel-cancel').onclick = close;
  $('#rel-go').onclick = async () => {
    const version = $('#rel-ver').value.trim();
    if (!/^\d+\.\d+\.\d+/.test(version)) { toast('版本号要 x.y.z 格式', true); return; }
    $('#rel-go').disabled = true;
    const r = await apiPost('/api/release/prepare', {
      path: dirPath, version,
      notes: $('#rel-notes').value,
      doDist: !!($('#rel-dist') && $('#rel-dist').checked),
      doPush: !!($('#rel-push') && $('#rel-push').checked),
      doRelease: !!($('#rel-gh') && $('#rel-gh').checked),
    });
    if (!r.ok) { toast(r.error || '准备失败', true); $('#rel-go').disabled = false; return; }
    close();
    term.runInDir(dirPath, r.cmd, `v${version} 发版序列已在终端开跑`);
  };
}

function propertiesPanel(items) {
  items = (items || []).filter(Boolean);
  if (!items.length) return;
  const old = $('.prop-overlay'); if (old) old.remove();
  const dirs = items.filter((e) => e.isDir).length;
  const files = items.length - dirs;
  const bytes = items.reduce((a, e) => a + (e.isDir ? 0 : e.size || 0), 0);
  const single = items.length === 1 ? items[0] : null;
  const rows = single
    ? [
      ['类型', kindLabel(single)],
      ['位置', dirOf(single.path)],
      ['大小', single.isDir ? '文件夹大小可用「占用透视」计算' : `${fmtSize(single.size || 0)} (${single.size || 0} 字节)`],
      ...(single.total && single.free ? [
        ['可用空间', `${fmtSize(single.free)} (${single.free} 字节)`],
        ['总容量', `${fmtSize(single.total)} (${single.total} 字节)`],
        ['已用比例', `${Math.round(single.usedRatio * 100)}%`],
      ] : []),
      ['修改时间', fmtDateTime(single.mtime)],
      ['创建时间', fmtDateTime(single.btime)],
      ['完整路径', single.path],
    ]
    : [
      ['项目', `${items.length} 项${dirs ? ` · ${dirs} 文件夹` : ''}${files ? ` · ${files} 文件` : ''}`],
      ['文件总大小', `${fmtSize(bytes)} (${bytes} 字节)`],
      ['位置', state.cwd || dirOf(items[0].path)],
    ];
  const ov = document.createElement('div');
  ov.className = 'input-overlay prop-overlay';
  ov.innerHTML = `<div class="input-dialog prop-dialog">
    <div class="input-title">${single ? escapeHtml(single.name) : `所选 ${items.length} 项`}</div>
    <div class="prop-rows">${rows.map(([k, v]) => `<div class="prop-row"><span>${escapeHtml(k)}</span><code title="${escapeHtml(v)}">${escapeHtml(v)}</code></div>`).join('')}</div>
    <div class="input-actions"><button class="ghost-btn" id="prop-copy">复制路径</button>${single && single.isDir ? '<button class="ghost-btn" id="prop-du">占用透视</button>' : ''}<button class="primary" id="prop-ok">确定</button></div>
  </div>`;
  document.body.appendChild(ov);
  const onKey = (ev) => { if (ev.key === 'Escape' || ev.key === 'Enter') { ev.preventDefault(); close(); } };
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
  document.addEventListener('keydown', onKey, true);
  ov.onclick = (ev) => { if (ev.target === ov) close(); };
  $('#prop-ok').onclick = close;
  $('#prop-copy').onclick = () => copyPaths(items.map((e) => e.path));
  const du = $('#prop-du'); if (du) du.onclick = () => { close(); diskPanel(single.path); };
}
async function showPropertiesSelection() {
  let items = selEntries();
  const cur = currentEntry();
  if (!items.length && cur) items = [cur];
  if (!items.length && state.cwd && !state.recentMode && !state.skillsMode) items = [await currentFolderEntryFresh()];
  propertiesPanel(items);
}

// 磁盘占用透视：du 口径的真实占用条形榜，目录行可下钻
async function diskPanel(dirPath) {
  const old = $('.disk-overlay'); if (old) old.remove();
  const ov = document.createElement('div');
  ov.className = 'input-overlay disk-overlay';
  ov.innerHTML = `<div class="input-dialog disk-dialog">
    <div class="input-title disk-title"></div>
    <div class="disk-body"><div class="cmdk-loading">计算中…（大目录会慢几秒）</div></div></div>`;
  document.body.appendChild(ov);
  const onKey = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); close(); } };
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
  ov.onclick = (ev) => { if (ev.target === ov) close(); };
  document.addEventListener('keydown', onKey, true);
  const load = async (p) => {
    ov.querySelector('.disk-title').textContent = '磁盘占用 · ' + p.replace(state.home, '~');
    const body = ov.querySelector('.disk-body');
    body.innerHTML = '<div class="cmdk-loading">计算中…（大目录会慢几秒）</div>';
    const d = await api('/api/du?path=' + encodeURIComponent(p));
    if (!d.ok) { body.innerHTML = `<div class="empty-state">${escapeHtml(d.error || '读取失败')}</div>`; return; }
    const max = d.items.length ? d.items[0].size : 1;
    const up = p !== '/' ? `<div class="disk-row disk-up" data-dir="${escapeHtml(dirOf(p))}"><span class="disk-name">↑ 上一级</span></div>` : '';
    body.innerHTML = `<div class="disk-total">共 ${fmtSize(d.total)}${d.more ? ` · 只显示前 ${d.items.length} 项` : ''}</div>` + up +
      d.items.map((it) => `<div class="disk-row${it.isDir ? ' is-dir' : ''}" data-dir="${it.isDir ? escapeHtml(p + '/' + it.name) : ''}">
        <i class="disk-bar" style="width:${Math.max(1, Math.round(it.size / max * 100))}%"></i>
        <span class="disk-name">${it.isDir ? '📁 ' : ''}${escapeHtml(it.name)}</span><span class="disk-size">${fmtSize(it.size)}</span></div>`).join('');
    body.querySelectorAll('.disk-row[data-dir]').forEach((r) => {
      if (r.dataset.dir) r.onclick = () => load(r.dataset.dir);
    });
  };
  load(dirPath);
}

// 右键上下文菜单
function closeContextMenu() { const m = $('#context-menu'); if (m) m.remove(); }
function mixedDriveSelectionContextItems(ev) {
  const entries = selEntries();
  const paths = entries.map((it) => it.path);
  const items = [
    { label: `复制 ${paths.length} 个路径`, fn: () => copyPaths(paths) },
  ];
  if (ev.shiftKey) items.push({ label: '复制为路径', fn: () => copyPathsQuoted(paths) });
  items.push(
    { sep: true },
    { label: '属性', fn: () => propertiesPanel(entries) },
    { sep: true },
    { label: '清空选择', fn: () => clearSelection() },
  );
  return items;
}
function driveContextItems(e, ev) {
  const items = [
    { label: '打开', fn: () => navigate(e.path) },
    { label: '在新标签页打开', fn: () => openFolderInNewTab(e.path) },
    { label: '在新窗口打开', fn: () => openNewWindow(e.path) },
    { sep: true },
    { label: '复制路径', fn: () => copyPaths([e.path]) },
  ];
  if (ev.shiftKey) items.push({ label: '复制为路径', fn: () => copyPathsQuoted([e.path]) });
  items.push(
    { label: '在终端打开', fn: () => term.openInDir(e.path) },
    { label: '磁盘占用透视', fn: () => diskPanel(e.path) },
    { sep: true },
    { label: '属性', fn: () => propertiesPanel([e]) },
  );
  return items;
}
function showContextMenu(ev, e) {
  ev.preventDefault();
  closeContextMenu();
  if (e.isDrive) { popupMenu(ev, driveContextItems(e, ev)); return; }
  if (state.multiSel.size > 1 && state.multiSel.has(e.path) && selEntries().some((it) => it.isDrive)) {
    popupMenu(ev, mixedDriveSelectionContextItems(ev));
    return;
  }
  // 右键落在多选集合里 → 组操作菜单;落在选区外 → 选区重置为该项(资源管理器习惯)
  if (state.multiSel.size > 1 && state.multiSel.has(e.path)) {
    const n = state.multiSel.size;
    popupMenu(ev, [
      { label: `复制 ${n} 项`, fn: () => clipSet('copy') },
      { label: `剪切 ${n} 项`, fn: () => clipSet('cut') },
      ...(ev.shiftKey ? [{ label: '复制为路径', fn: () => copyPathsQuoted(selPaths()) }] : []),
      { label: `压缩 ${n} 项为 zip`, fn: () => createZipFromEntries(selEntries()) },
      { sep: true },
      { label: `移到废纸篓 ${n} 项`, danger: true, fn: () => trashSelection() },
      { label: `永久删除 ${n} 项`, danger: true, fn: () => deleteSelectionPermanent() },
      { sep: true },
      { label: '属性', fn: () => propertiesPanel(selEntries()) },
      { sep: true },
      { label: '反向选择', fn: () => invertSelection() },
      { label: '清空选择', fn: () => clearSelection() },
    ]);
    return;
  }
  if (state.multiSel.size && !state.multiSel.has(e.path)) applySelection(e.path);
  const items = [];
  if (e.isDir) items.push({ label: '打开', fn: () => navigate(e.path) });
  else items.push({ label: '预览', fn: () => { state.selected = e.path; openPreview(e); renderFiles(); } });
  if (e.isDir) items.push({ label: '在新标签页打开', fn: () => openFolderInNewTab(e.path) });
  if (e.isDir) items.push({ label: '在新窗口打开', fn: () => openNewWindow(e.path) });
  if (e.isDir) items.push({ label: 'AI 整理…', fn: () => organizeLaunch(e.path) });
  if (e.isDir) items.push({ label: '磁盘占用透视', fn: () => diskPanel(e.path) });
  if (e.isDir) items.push({ label: '在终端打开', fn: () => term.openInDir(e.path) });
  else items.push({ label: '在所在目录开终端', fn: () => term.openInDir(dirOf(e.path)) });
  if (e.kind === 'text') items.push({ label: '编辑文本', fn: () => enterEditMode(e) });
  if (e.kind === 'image') items.push({ label: '编辑图片', fn: () => enterImageEdit(e) });
  if (isExtractableArchive(e)) items.push({ label: '解压到当前目录', fn: () => extractArchiveEntry(e) });
  items.push({ label: '在编辑器打开', fn: () => openWith(e.path, 'editor') });
  items.push({ label: '在文件管理器中显示', fn: () => openWith(e.path, 'reveal') });
  const pathGroup = selPaths().includes(e.path) ? selPaths() : [e.path];
  items.push({ label: pathGroup.length > 1 ? `复制 ${pathGroup.length} 个路径` : '复制路径', fn: () => copyPaths(pathGroup) });
  if (ev.shiftKey) items.push({ label: '复制为路径', fn: () => copyPathsQuoted(pathGroup) });
  items.push({ sep: true });
  items.push({ label: '复制', fn: () => { applySelection(e.path); clipSet('copy'); } });
  items.push({ label: '剪切', fn: () => { applySelection(e.path); clipSet('cut'); } });
  items.push({ label: pathGroup.length > 1 ? `压缩 ${pathGroup.length} 项为 zip` : '压缩为 zip', fn: () => createZipFromEntries(pathGroup.map((p) => state.visible.find((x) => x.path === p)).filter(Boolean)) });
  if ((state.fileClip || window.fanboxClipboard?.readFiles) && e.isDir) items.push({ label: `粘贴到「${e.name}」`, fn: () => clipPaste(e.path) });
  items.push({ sep: true });
  items.push({ label: isFav(e.path) ? '取消收藏' : '收藏', fn: () => toggleFav(e) });
  items.push({ label: '重命名…', fn: () => doRename(e) });
  items.push({ label: '属性', fn: () => propertiesPanel(pathGroup.map((p) => state.visible.find((x) => x.path === p)).filter(Boolean)) });
  items.push({ label: '移到废纸篓', danger: true, fn: () => doTrash(e) });
  items.push({ label: '永久删除', danger: true, fn: () => doDeletePermanent(e) });
  popupMenu(ev, items);
}
// 在鼠标位置弹一个菜单（右键菜单与空白处双击菜单共用）
function popupMenu(ev, items) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.className = 'context-menu';
  items.forEach((it) => {
    if (it.sep) { const s = document.createElement('div'); s.className = 'ctx-sep'; menu.appendChild(s); return; }
    const b = document.createElement('div');
    b.className = 'ctx-item' + (it.danger ? ' danger' : '');
    b.textContent = it.label;
    b.onclick = () => { closeContextMenu(); it.fn(); };
    menu.appendChild(b);
  });
  document.body.appendChild(menu);
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  menu.style.left = Math.min(ev.clientX, window.innerWidth - mw - 8) + 'px';
  menu.style.top = Math.min(ev.clientY, window.innerHeight - mh - 8) + 'px';
}
function menuEventAt(el) {
  const r = el ? el.getBoundingClientRect() : $('#file-area').getBoundingClientRect();
  return {
    clientX: Math.round(r.left + Math.min(Math.max(18, r.width / 2), Math.max(18, r.width - 18))),
    clientY: Math.round(r.top + Math.min(Math.max(18, r.height / 2), Math.max(18, r.height - 18))),
    preventDefault() {},
  };
}
function currentFolderEntry() {
  if (!state.cwd) return null;
  return {
    path: state.cwd,
    name: baseOf(state.cwd) || state.cwd,
    isDir: true,
    kind: 'folder',
    size: 0,
    mtime: 0,
    btime: 0,
  };
}
async function currentFolderEntryFresh() {
  const fallback = currentFolderEntry();
  if (!fallback) return null;
  const r = await api('/api/stat?path=' + encodeURIComponent(state.cwd)).catch(() => null);
  return (r && r.ok) ? r : fallback;
}
function blankContextItems(shiftKey = false) {
  const blank = [
    { label: '新建文件夹…', fn: () => doCreate('dir') },
    { label: '新建文件…', fn: () => doCreate('file') },
  ];
  if (state.fileClip || window.fanboxClipboard?.readFiles) blank.push({ label: state.fileClip ? `粘贴（${state.fileClip.paths.length} 项）` : '粘贴', fn: () => clipPaste() });
  blank.push({ label: '刷新', fn: () => refreshDir(true) });
  blank.push({ label: '全选', fn: () => selectAllVisible() });
  blank.push({ label: '反向选择', fn: () => invertSelection() });
  if (selPaths().length) blank.push({ label: '清空选择', fn: () => clearSelection() });
  blank.push({ sep: true });
  blank.push({ label: '复制当前文件夹路径', fn: () => copyPaths([state.cwd]) });
  if (shiftKey) blank.push({ label: '复制当前文件夹为路径', fn: () => copyPathsQuoted([state.cwd]) });
  blank.push({ label: '在新标签页打开当前文件夹', fn: () => openFolderInNewTab(state.cwd) });
  blank.push({ label: '在新窗口打开当前文件夹', fn: () => openNewWindow(state.cwd) });
  blank.push({ label: '在文件管理器中显示当前文件夹', fn: () => openWith(state.cwd, 'reveal') });
  blank.push({ label: '在终端打开当前文件夹', fn: () => term.openInDir(state.cwd) });
  blank.push({ label: isFav(state.cwd) ? '取消收藏当前文件夹' : '收藏当前文件夹', fn: () => toggleFav(currentFolderEntry()) });
  blank.push({ label: '当前文件夹属性', fn: async () => propertiesPanel([await currentFolderEntryFresh()]) });
  blank.push({ sep: true });
  blank.push({ label: 'AI 整理…', fn: () => organizeLaunch(state.cwd) });
  blank.push({ label: '磁盘占用透视', fn: () => diskPanel(state.cwd) });
  return blank;
}
function openKeyboardContextMenu() {
  const e = currentEntry();
  if (e) state.cursor = state.visible.findIndex((x) => x.path === e.path);
  if (e) {
    const el = $('#file-area').querySelector(`[data-path="${CSS.escape(e.path)}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
      showContextMenu(menuEventAt(el), e);
      return;
    }
  }
  popupMenu(menuEventAt($('#file-area')), blankContextItems());
}

// ---------- 侧边栏 ----------
// 侧栏目录树：目录项带展开箭头，点箭头逐级懒加载子目录（只列文件夹），点行本身仍是跳转
function navDirLi(name, p) {
  const li = document.createElement('li');
  li.dataset.path = p;
  const twirl = document.createElement('span');
  twirl.className = 'twirl';
  twirl.textContent = '▸';
  twirl.title = '展开子文件夹';
  twirl.onclick = (ev) => { ev.stopPropagation(); toggleNavSub(li, p, twirl); };
  const ico = document.createElement('span');
  ico.className = 'ico';
  ico.innerHTML = svgWrap(SVG.folder, 'currentColor', 16, true);
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = name;
  label.title = p;
  li.append(twirl, ico, label);
  li.onclick = () => navigate(p);
  li.oncontextmenu = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    popupMenu(ev, [
      { label: '打开', fn: () => navigate(p) },
      { label: '在文件管理器中显示', fn: () => openWith(p, 'reveal') },
      { label: '复制路径', fn: () => copyPath(p) },
      { label: '在终端打开', fn: () => term.openInDir(p) },
      { sep: true },
      { label: isFav(p) ? '取消收藏' : '收藏', fn: () => toggleFav({ path: p, name, isDir: true }) },
      { label: '磁盘占用透视', fn: () => diskPanel(p) },
    ]);
  };
  makeDraggablePath(li, p);
  bindSidebarDropTarget(li, p);
  return li;
}
function navDriveLi(drive) {
  const li = navDirLi(drive.name, drive.path);
  li.classList.add('drive-root');
  const ico = li.querySelector('.ico');
  if (ico) ico.innerHTML = ic('drive', 'currentColor', 16);
  const label = li.querySelector('.label');
  if (label && drive.free && drive.total) {
    const used = Math.round(Math.min(1, Math.max(0, drive.usedRatio || 0)) * 100);
    label.innerHTML = `<span class="drive-name">${escapeHtml(drive.name)}</span><span class="drive-capacity">${escapeHtml(fmtDriveFree(drive))}</span><span class="drive-bar" aria-hidden="true"><i class="drive-used" style="width:${used}%"></i></span>`;
  }
  return li;
}
async function toggleNavSub(li, dirPath, twirl) {
  const old = li.nextElementSibling;
  if (old && old.classList.contains('nav-sub')) { old.remove(); twirl.textContent = '▸'; return; }
  twirl.textContent = '▾';
  const ul = document.createElement('ul');
  ul.className = 'nav-list nav-sub';
  li.after(ul);
  try {
    const data = await api('/api/list?path=' + encodeURIComponent(dirPath));
    const dirs = (data.entries || []).filter((e) => e.isDir && !e.hidden);
    if (!dirs.length) { ul.innerHTML = '<div class="nav-empty">没有子文件夹</div>'; return; }
    dirs.forEach((e) => ul.appendChild(navDirLi(e.name, e.path)));
  } catch { ul.remove(); twirl.textContent = '▸'; }
}
async function expandSidebarAncestors(cwd) {
  if (!cwd) return;
  for (let guard = 0; guard < 24; guard++) {
    const rows = [...document.querySelectorAll('#sidebar li[data-path]')]
      .filter((row) => pathContains(row.dataset.path, cwd))
      .sort((a, b) => normSidebarPath(a.dataset.path).length - normSidebarPath(b.dataset.path).length);
    const row = rows.find((li) => {
      if (normSidebarPath(li.dataset.path) === normSidebarPath(cwd)) return false;
      const next = li.nextElementSibling;
      return !(next && next.classList.contains('nav-sub'));
    });
    if (!row) return;
    const twirl = row.querySelector('.twirl');
    if (!twirl) return;
    await toggleNavSub(row, row.dataset.path, twirl);
  }
}
async function locateCurrentInSidebar() {
  if (!state.cwd || state.recentMode || state.skillsMode) return;
  toggleSidebar(false);
  await expandSidebarAncestors(state.cwd);
  renderSidebarActive();
  const active = document.querySelector('#sidebar li.active[data-path]');
  if (active) active.scrollIntoView({ block: 'nearest' });
}
function networkLocationLi() {
  const li = document.createElement('li');
  li.className = 'network-location-add';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-add-btn';
  btn.dataset.action = 'network-location';
  btn.innerHTML = `<span class="twirl"></span><span class="ico">${ic('folder', 'currentColor', 16)}</span><span class="label">添加网络位置…</span>`;
  btn.title = '固定 NAS / 共享盘路径，例如 \\\\server\\share';
  li.appendChild(btn);
  return li;
}
async function addNetworkLocation() {
  const input = await inputDialog('添加网络位置', '', '例如 \\\\server\\share 或 file://server/share');
  if (!input) return;
  const r = await api('/api/stat?path=' + encodeURIComponent(input)).catch((err) => ({ ok: false, error: err.message }));
  if (!r || !r.ok) { toast('网络位置不可用：' + ((r && r.error) || '无法访问'), true); return; }
  if (!r.isDir) { toast('网络位置必须是文件夹', true); return; }
  if (isFav(r.path)) { toast('这个位置已在收藏里'); return; }
  const name = r.name || baseOf(r.path) || r.path;
  const saved = await apiPost('/api/favorites', { path: r.path, name, isDir: true }).catch((err) => ({ error: err.message }));
  if (saved.error) { toast('添加失败：' + saved.error, true); return; }
  await loadFavorites();
  toast(`已添加网络位置：${name}`);
}
async function loadRoots() {
  const data = await api('/api/roots');
  state.home = data.home;
  state.platform = data.platform;
  state.sep = data.sep || '/';
  const ul = $('#roots-list');
  ul.innerHTML = '';
  data.roots.forEach((r) => ul.appendChild(navDirLi(r.name, r.path)));
  ul.appendChild(networkLocationLi());
  renderSidebarActive();
}
async function loadDrives() {
  const ul = $('#drives-list');
  if (!ul) return;
  ul.innerHTML = '<div class="nav-empty">正在读取磁盘…</div>';
  try {
    const data = await api('/api/drives');
    state.drives = data.drives || [];
    ul.innerHTML = '';
    if (!state.drives.length) {
      ul.innerHTML = '<div class="nav-empty">未发现可访问磁盘</div>';
      return;
    }
    state.drives.forEach((d) => ul.appendChild(navDriveLi(d)));
    renderSidebarActive();
  } catch {
    state.drives = [];
    ul.innerHTML = '<div class="nav-empty">磁盘读取失败</div>';
  }
}
async function openThisPcView(pushHistory = true) {
  if (!await guardDirty()) return;
  if (!state.drives.length) await loadDrives();
  if (pushHistory && state.cwd && state.cwd !== 'this-pc') {
    state.history.push(state.cwd);
    state.forwardHistory = [];
  }
  state.cwd = 'this-pc';
  state.virtualMode = 'this-pc';
  state.recentMode = false;
  state.skillsMode = false;
  state.project = null;
  state.parent = null;
  state.breadcrumb = [{ name: '此电脑', path: 'this-pc' }];
  state.entries = prepareEntries(state.drives.map(driveToEntry));
  state.filter = '';
  state.cursor = -1;
  ensureFolderTabForCwd('this-pc');
  syncFilterUi(true);
  render();
  renderFolderTabs();
}
function renderSidebarActive() {
  const rows = [...document.querySelectorAll('#sidebar li[data-path]')];
  rows.forEach((li) => li.classList.remove('active'));
  $('#this-pc-entry')?.classList.toggle('active', state.virtualMode === 'this-pc');
  if (!state.cwd || state.recentMode || state.skillsMode) return;
  if (state.virtualMode === 'this-pc') return;
  let best = null, bestLen = -1;
  rows.forEach((li) => {
    const p = li.dataset.path;
    if (!pathContains(p, state.cwd)) return;
    const len = normSidebarPath(p).length;
    if (len > bestLen) { best = li; bestLen = len; }
  });
  if (best) best.classList.add('active');
}
async function loadFavorites() {
  const data = await api('/api/favorites');
  state.favorites = data.favorites || [];
  state.recentOpened = data.recentOpened || [];
  renderFavs();
  renderRecents();
  renderSidebarActive();
}
// ---------- 侧栏「最近打开」（公司版：上游 v1.5.2 移除了该区块，按更顺的交互加回）----------
// 左键：应用内打开（目录跳转、文件原地预览；翻箱预览不了的二进制才交给系统默认应用）
// 右键：在翻箱打开 / 系统打开 / 访达显示 / 复制路径 / 从列表移除
function renderRecents() {
  const ul = $('#recents-list');
  if (!ul) return;
  ul.innerHTML = '';
  const items = (state.recentOpened || []).slice(0, 10);
  if (!items.length) { ul.innerHTML = '<div class="nav-empty">打开过的文件会出现在这里</div>'; return; }
  for (const p of items) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="ico">${svgWrap(SVG.file, 'currentColor', 16)}</span><span class="label" title="${escapeHtml(p)}">${escapeHtml(baseOf(p))}</span>`;
    li.onclick = () => openRecent(p);
    li.oncontextmenu = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      popupMenu(ev, [
        { label: '在灵匣中打开', fn: () => openRecent(p) },
        { label: '用系统默认应用打开', fn: () => openWith(p) },
        { label: '在文件管理器中显示', fn: () => openWith(p, 'reveal') },
        { label: '复制路径', fn: () => copyPath(p) },
        { sep: true },
        { label: '从最近列表移除', danger: true, fn: () => removeRecent(p) },
      ]);
    };
    makeDraggablePath(li, p);
    ul.appendChild(li);
  }
}
async function openRecent(p) {
  await navigate(dirOf(p)).catch(() => {});
  const e = state.entries.find((x) => x.path === p);
  if (!e) { toast('文件不在原位置了（可能被移动或删除）', true); return; }
  if (e.isDir) { navigate(p); return; }
  recordRecent(p);
  // 翻箱预览不了的二进制 → 系统默认应用；Word/Excel 现在能应用内打开了
  if (e.kind === 'other' && !isOfficeName(e.name)) { openWith(p); return; }
  state.selected = p;
  openPreview(e);
  renderFiles();
}
async function removeRecent(p) {
  try {
    const r = await apiPost('/api/recent-open', { path: p, remove: true });
    state.recentOpened = r.recentOpened || state.recentOpened.filter((x) => x !== p);
  } catch { state.recentOpened = (state.recentOpened || []).filter((x) => x !== p); }
  renderRecents();
}
function renderFavs() {
  const ul = $('#favs-list');
  ul.innerHTML = '';
  if (!state.favorites.length) { ul.innerHTML = '<div class="nav-empty">悬停文件点 ☆ 即可收藏</div>'; return; }
  state.favorites.forEach((f) => {
    let li;
    if (f.isDir) {
      li = navDirLi(f.name, f.path);
    } else {
      li = document.createElement('li');
      li.innerHTML = `<span class="ico">${svgWrap(SVG.file, 'currentColor', 16)}</span><span class="label" title="${escapeHtml(f.path)}">${escapeHtml(f.name)}</span>`;
      li.onclick = () => navigate(dirOf(f.path)).then(() => { const e = state.entries.find((x) => x.path === f.path); if (e) { state.selected = f.path; openPreview(e); renderFiles(); } });
      makeDraggablePath(li, f.path);
    }
    const un = document.createElement('span');
    un.className = 'unfav';
    un.title = '移除';
    un.textContent = '✕';
    un.onclick = (ev) => { ev.stopPropagation(); toggleFav(f); };
    li.appendChild(un);
    ul.appendChild(li);
  });
  renderSidebarActive();
}
// Agent 项目：最近被 Claude Code / Codex 处理过的项目文件夹，从两者的本机会话日志扫出来
function agoShort(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 2) return '刚刚';
  if (m < 60) return m + ' 分';
  if (m < 1440) return Math.round(m / 60) + ' 时';
  return Math.round(m / 1440) + ' 天';
}
async function loadAgentProjects() {
  let data;
  try { data = await api('/api/agent-projects'); } catch { return; }
  const list = (data.projects || []).slice(0, 8);
  // 数据没变就不动 DOM，免得定时刷新把用户展开的子树抹掉
  const sig = JSON.stringify(list);
  if (sig === loadAgentProjects._sig) return;
  loadAgentProjects._sig = sig;
  const ul = $('#agent-projects-list');
  ul.innerHTML = '';
  if (!list.length) { ul.innerHTML = '<div class="nav-empty">用 Claude Code / Codex 跑过的项目会出现在这里</div>'; return; }
  list.forEach((pj) => {
    const li = navDirLi(pj.name, pj.path);
    li.querySelector('.label').title = `${pj.path}\n${pj.agents.join(' + ')} · ${agoShort(pj.lastActive)}前活跃`;
    const when = document.createElement('span');
    when.className = 'when';
    pj.agents.forEach((a) => {
      const dot = document.createElement('i');
      dot.className = 'agent-dot ' + a;
      dot.title = a;
      when.appendChild(dot);
    });
    when.append(agoShort(pj.lastActive));
    li.appendChild(when);
    ul.appendChild(li);
  });
  renderSidebarActive();
}

// ---------- 最近修改 ----------
// 结果写进统一数据源 state.entries，交给 renderFiles 渲染——这样筛选 / 排序 / 隐藏开关
// 都能直接作用在最近列表上，不会把视图无声切回上一个目录
async function showRecent() {
  state.recentMode = true;
  state.virtualMode = null;
  state.filter = '';
  syncFilterUi(true);
  state.cursor = -1;
  state.sort = 'mtime';
  state.sortDir = 'desc';
  syncSortControls();
  $('#file-area').innerHTML = '<div class="cmdk-loading">扫描最近修改的文件…</div>';
  renderBreadcrumb();
  const data = await api('/api/recent?root=' + encodeURIComponent(state.cwd || state.home));
  state.entries = prepareEntries((data.results || []).map((e) => ({ ...e, hidden: false })));
  state.recentTruncated = !!data.truncated;
  renderFiles();
  renderSidebarActive();
}
function truncNote() {
  return `<div class="trunc-note">⚠ 文件太多，结果可能不完整。进入更具体的子目录可看到全部。</div>`;
}

// ---------- 命令面板 ----------
const cmdk = {
  results: [], active: 0, timer: null, scopeAll: true,
  open() {
    $('#cmdk').classList.remove('hidden');
    this.updateScopeLabel();
    const inp = $('#cmdk-input');
    inp.value = '';
    inp.focus();
    $('#cmdk-results').innerHTML = '<div class="cmdk-loading">输入开始搜索 · 文件名模糊匹配，「内容:」搜全文（含 PDF、截图里的文字）</div>';
    this.results = [];
    this.active = 0;
  },
  close() { $('#cmdk').classList.add('hidden'); },
  toggleScope() { this.scopeAll = !this.scopeAll; this.updateScopeLabel(); this.search($('#cmdk-input').value); },
  root() { return this.scopeAll ? state.home : (state.cwd || state.home); },
  updateScopeLabel() {
    $('#cmdk-scope').textContent = this.scopeAll ? '全机（主目录及以下）' : '当前目录 ' + tilde(state.cwd || state.home);
    $('#scope-toggle').textContent = this.scopeAll ? '⤢ 全机' : '▢ 当前目录';
    $('#scope-toggle').classList.toggle('on', this.scopeAll);
  },
  search(q) {
    clearTimeout(this.timer);
    if (!q.trim()) { $('#cmdk-results').innerHTML = '<div class="cmdk-loading">输入开始搜索</div>'; return; }
    const isContent = /^(内容[:：]|content:)/i.test(q);
    $('#cmdk-results').innerHTML = '<div class="cmdk-loading">搜索中…</div>';
    this.timer = setTimeout(async () => {
      const root = this.root();
      let data, term;
      if (isContent) {
        term = q.replace(/^(内容[:：]|content:)/i, '').trim();
        data = await api(`/api/content?q=${encodeURIComponent(term)}&root=${encodeURIComponent(root)}`);
        this.results = data.results.map((r) => ({ ...r, content: true }));
      } else {
        term = q.trim();
        data = await api(`/api/search?q=${encodeURIComponent(term)}&root=${encodeURIComponent(root)}`);
        this.results = data.results;
      }
      this.truncated = data.truncated;
      this.isContent = isContent;
      this.term = term;
      this.active = 0;
      this.renderResults();
    }, 150);
  },
  renderResults() {
    const ul = $('#cmdk-results');
    if (!this.results.length) { ul.innerHTML = '<div class="cmdk-loading">没有结果</div>'; return; }
    ul.innerHTML = '';
    this.results.forEach((r, i) => {
      const li = document.createElement('li');
      if (i === this.active) li.className = 'active';
      let hits = '';
      if (r.content && r.hits) hits = r.hits.map((h) => `<div class="r-hit">L${h.line}: ${hlTerm(h.text, this.term)}</div>`).join('');
      li.innerHTML = `<span class="r-icon">${iconSvg(r, 18)}</span>
        <div class="r-main">
          <div class="r-name">${this.isContent ? escapeHtml(r.name) : hlFuzzy(r.name, this.term)}</div>
          <div class="r-path">${escapeHtml(tilde(r.path))}</div>${hits}
        </div>`;
      li.onclick = () => this.choose(i, false);
      ul.appendChild(li);
    });
    if (this.truncated) ul.insertAdjacentHTML('beforeend', `<div class="cmdk-loading">⚠ 结果可能不完整，换更具体的关键词或缩小到当前目录</div>`);
    this.scrollActive();
  },
  move(d) { if (!this.results.length) return; this.active = (this.active + d + this.results.length) % this.results.length; this.renderResults(); },
  scrollActive() { const el = $('#cmdk-results').children[this.active]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); },
  choose(i, editor) {
    const r = this.results[i];
    if (!r) return;
    this.close();
    // ⌘↵ 对文件夹也走编辑器——找到项目名直接在 VS Code/编辑器整包打开（vibe coding 核心流）
    if (editor) { openWith(r.path, 'editor'); return; }
    if (r.isDir) { navigate(r.path); return; }
    recordRecent(r.path);
    navigate(dirOf(r.path)).then(() => {
      const entry = state.entries.find((e) => e.path === r.path) || { ...r };
      state.selected = r.path;
      openPreview(entry);
      renderFiles();
    });
  },
};
function hlFuzzy(name, q) {
  if (!q) return escapeHtml(name);
  const lower = name.toLowerCase(); const ql = q.toLowerCase();
  let qi = 0, out = '';
  for (let i = 0; i < name.length; i++) {
    if (qi < ql.length && lower[i] === ql[qi]) { out += `<mark>${escapeHtml(name[i])}</mark>`; qi++; }
    else out += escapeHtml(name[i]);
  }
  return out;
}
function hlTerm(text, term) {
  if (!term) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return escapeHtml(text);
  return escapeHtml(text.slice(0, idx)) + '<mark>' + escapeHtml(text.slice(idx, idx + term.length)) + '</mark>' + escapeHtml(text.slice(idx + term.length));
}

// ---------- 首次引导 ----------
function maybeShowGuide() {
  if (localStorage.getItem('fb_guided')) return;
  const ov = document.createElement('div');
  ov.className = 'guide-overlay';
  ov.innerHTML = `<div class="guide-card">
    <div class="guide-logo">${svgWrap(SVG.box, 'currentColor', 46, true)}</div>
    <h2>欢迎用 灵匣</h2>
    <p>vibe coding 的驾驶舱——找文件、跑 agent、看它改、随手改，都在一个窗口：</p>
    <ul>
      <li><b>${MOD}K</b> 全局搜文件和文件夹；<b>${MOD}↵</b> 把项目直接在编辑器整包打开；<code>内容:关键词</code> 搜文件里的字</li>
      <li>顶部 <b>终端</b> 按钮开内嵌终端跑 Claude Code 等 agent；<b>把文件/文件夹拖进终端</b> 即插入路径喂给它当上下文</li>
      <li><b>单击</b> 预览，<b>双击</b> 系统打开；预览里 <b>编辑</b> md 走所见即所得、<b>编辑图片</b> 可标注/打码/转格式</li>
      <li>agent 改了哪些文件，列表实时高亮「改·N」，不用切窗口盯着看</li>
    </ul>
    <button id="guide-ok">开始使用</button>
  </div>`;
  document.body.appendChild(ov);
  $('#guide-ok').onclick = () => { localStorage.setItem('fb_guided', '1'); ov.remove(); };
}

// ---------- 预览面板拖拽调宽 ----------
function bindResizer() {
  const handle = $('#preview-resizer');
  let dragging = false;
  handle.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); handle.classList.add('dragging'); document.body.style.userSelect = 'none'; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const fm = $('#filemgmt').getBoundingClientRect();
    if (term.dock === 'right') { // 预览在文件区下方 → 纵向拖
      state.previewH = Math.round(Math.min(fm.height - 120, Math.max(140, fm.bottom - e.clientY)));
    } else { // 预览在文件区右侧 → 横向拖
      state.previewW = Math.round(Math.min(fm.width - 220, Math.max(260, fm.right - e.clientX)));
    }
    applyPreviewSize();
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false; handle.classList.remove('dragging'); document.body.style.userSelect = '';
    localStorage.setItem('fb_preview_w', state.previewW);
    localStorage.setItem('fb_preview_h', state.previewH || 340);
  });
}

// 终端面板拖拽调整大小（底部拖高度 / 右侧拖宽度）
// 丝滑要点：mousemove 只记目标值，用 rAF 每帧最多应用一次（含一次 fit），不再每个事件都 fit 触发重排
function bindTerminalResizer() {
  const handle = $('#terminal-resizer');
  let dragging = false, raf = null, target = null, squeeze = false;
  const SNAP = 48; // 拖到离边缘 48px 内 → 吸附成全铺（fm-squeezed），不再留丑陋的残条
  const fitNow = () => { const s = term.sessions.find((x) => x.id === term.active); if (s && s.fit) { try { s.fit.fit(); } catch { /* */ } } };
  const apply = () => {
    raf = null;
    if (target == null) return;
    const panel = $('#terminal-panel');
    $('#main-body').classList.toggle('fm-squeezed', squeeze);
    if (term.dock === 'bottom') panel.style.height = target + 'px';
    else panel.style.width = target + 'px';
    target = null;
    fitNow();
  };
  handle.addEventListener('mousedown', (e) => {
    dragging = true; e.preventDefault();
    // 铺满态下抓分割条 = 想拖回分屏，直接退出铺满（不走 toggleMax，拖拽中不要过渡动画）
    if (term.maximized) {
      term.maximized = false;
      $('#main-body').classList.remove('term-max');
      const b = $('#term-max'); if (b) { b.classList.remove('on'); b.title = '终端铺满'; }
    }
    squeeze = $('#main-body').classList.contains('fm-squeezed');
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = term.dock === 'bottom' ? 'row-resize' : 'col-resize';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = $('#main-body').getBoundingClientRect();
    if (term.dock === 'bottom') {
      const raw = rect.bottom - e.clientY;
      squeeze = raw >= rect.height - SNAP;
      target = Math.round(Math.min(rect.height - 4, Math.max(60, raw)));
    } else {
      const raw = rect.right - e.clientX;
      squeeze = raw >= rect.width - SNAP;
      target = Math.round(Math.min(rect.width - 4, Math.max(140, raw)));
    }
    if (!raf) raf = requestAnimationFrame(apply);
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false; handle.classList.remove('dragging');
    document.body.style.userSelect = ''; document.body.style.cursor = '';
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    apply(); fitNow();
    const panel = $('#terminal-panel');
    localStorage.setItem('fb_term_squeeze', squeeze ? '1' : '0');
    if (term.dock === 'bottom') localStorage.setItem('fb_term_h', parseInt(panel.style.height, 10) || 280);
    else localStorage.setItem('fb_term_w', parseInt(panel.style.width, 10) || 480);
  });
}

// ---------- 事件绑定 ----------
function bindEvents() {
  // 顶栏窄时分级藏低频控件（观测自身宽度而非视口——侧栏会吃掉一截且可折叠）
  const tb = $('#topbar');
  new ResizeObserver((es) => {
    const w = es[0].contentRect.width;
    tb.classList.toggle('tb-sm', w < 980);
    tb.classList.toggle('tb-xs', w < 880);
    tb.classList.toggle('tb-xxs', w < 790);
    tb.classList.toggle('tb-min', w < 660);
  }).observe(tb);
  $('#btn-back').onclick = goBack;
  $('#btn-forward').onclick = goForward;
  $('#btn-up').onclick = goUp;
  $('#breadcrumb').addEventListener('click', (e) => { if (e.target.id === 'breadcrumb') beginAddressEdit(false); });
  $('#breadcrumb').addEventListener('dblclick', (e) => { if (!e.target.closest('.crumb')) beginAddressEdit(); });
  $('#preview-close').onclick = () => closePreview(false);
  $('#btn-preview-pane').onclick = () => togglePreviewPane();
  $('#cmdk-trigger').onclick = () => cmdk.open();
  $('#btn-recent').onclick = showRecent;
  $('#this-pc-entry')?.addEventListener('click', openThisPcView);
  $('#btn-changes').onclick = () => toggleChangesPanel();
  $('#btn-terminal').onclick = () => term.toggle();
  $('#term-claude').onclick = () => term.launchAgent('claude --dangerously-skip-permissions');
  $('#term-codex').onclick = () => term.launchAgent('codex');
  $('#roots-list').addEventListener('click', (e) => {
    if (!e.target.closest('.network-location-add')) return;
    e.preventDefault();
    addNetworkLocation();
  });
  usagePanel.bind();
  shotTray.init();
  $('#skills-entry').onclick = () => skillsView.show();
  $('#term-newtab').onclick = () => term.newTab();
  $('#term-max').onclick = () => term.toggleMax();
  $('#term-dock').onclick = () => term.setDock(term.dock === 'bottom' ? 'right' : 'bottom');
  const muteBtn = $('#term-mute');
  const syncMute = () => { muteBtn.textContent = state.muted ? '🔕' : '🔔'; muteBtn.title = state.muted ? '提示音已关（点击开启）' : '提示音已开（点击静音）'; };
  syncMute();
  muteBtn.onclick = () => { state.muted = !state.muted; localStorage.setItem('fb_muted', state.muted ? '1' : '0'); syncMute(); if (!state.muted) playChime('tick'); };
  $('#term-close').onclick = () => term.close();
  $('#btn-sidebar').onclick = () => toggleSidebar();
  $('#term-follow').onclick = () => term.setFollow(!term.followBrowse);
  $('#term-locate').onclick = () => term.locateCwd();
  if (term.followBrowse) $('#term-follow').classList.add('on');
  // 终端随窗口尺寸变化重排，避免 TUI 错位
  window.addEventListener('resize', () => term.fitActive());
  if (window.ResizeObserver) new ResizeObserver(() => term.fitActive()).observe($('#xterm-host'));
  bindTerminalResizer();
  // 拖拽文件/文件夹到终端 → 插入路径
  const tp = $('#terminal-panel');
  tp.addEventListener('dragover', (ev) => {
    if (tp.classList.contains('chat-mode')) return; // 对话模式的拖放由 chat 自己处理（变附件）
    const t = ev.dataTransfer.types;
    if (!t.includes('Files') && !t.includes('application/x-fanbox-path') && !t.includes('text/plain')) return;
    ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; tp.classList.add('term-drop');
  });
  tp.addEventListener('dragleave', (ev) => { if (!tp.contains(ev.relatedTarget)) tp.classList.remove('term-drop'); });
  tp.addEventListener('drop', async (ev) => {
    if (tp.classList.contains('chat-mode')) return;
    ev.preventDefault(); tp.classList.remove('term-drop');
    // 系统拖入（Finder 文件 / 截图浮窗缩略图）：有真实路径直接用；file-promise 没路径就落盘临时目录
    const files = ev.dataTransfer.files ? [...ev.dataTransfer.files] : [];
    if (files.length && window.fanboxDrop) {
      for (const f of files) {
        let p = window.fanboxDrop.pathForFile(f);
        if (!p) {
          const r = await window.fanboxDrop.saveTemp(f.name, await f.arrayBuffer()).catch(() => null);
          if (r && r.ok) p = r.path;
        }
        if (p) term.insertPath(p);
      }
      return;
    }
    // skill 行拖进终端：注入 /name 或 $name（按会话里跑的 agent），不是当路径插
    const sk = ev.dataTransfer.getData('application/x-fanbox-skill');
    if (sk) { invokeSkillInTerm(sk); return; }
    const p = ev.dataTransfer.getData('application/x-fanbox-path') || ev.dataTransfer.getData('text/plain');
    if (p) term.insertPath(p);
  });
  // 全局兜底：文件拖到窗口其它区域松手时，阻止 Electron 导航到 file:// 顶掉整个界面
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
  // 文件区空白处双击/右键 → 新建菜单（#7：右键空白是更普遍的肌肉记忆）
  const blankMenu = (e) => {
    if (e.target.closest('.item') || e.target.closest('.row')) return; // 条目自身的菜单不抢
    e.preventDefault();
    popupMenu(e, blankContextItems(e.shiftKey));
  };
  $('#file-area').addEventListener('dblclick', blankMenu);
  $('#file-area').addEventListener('contextmenu', blankMenu);
  $('#content').addEventListener('contextmenu', (e) => { if (!e.target.closest('#file-area')) blankMenu(e); });
  bindMarqueeSelection();
  // 文件区拖放(对标资源管理器)：
  //  - 系统文件(资源管理器/访达/另一个灵匣窗口) → 复制进当前目录
  //  - 应用内/跨窗口条目(x-fanbox-paths) → 移动(按住 Ctrl/⌘ = 复制)
  //  - 悬停在文件夹卡片上 → 放进那个文件夹;否则放进当前目录
  const fileArea = $('#file-area');
  const dragKind = (e) => {
    const t = e.dataTransfer.types;
    if (isInternalDrag(e.dataTransfer)) return 'internal';
    if (t.includes('Files')) return 'external';
    return null;
  };
  const dropFolderEl = (e) => e.target.closest('.item.is-dir, .row.is-dir');
  const clearDropHints = () => {
    fileArea.classList.remove('drop-in');
    fileArea.querySelectorAll('.drop-target').forEach((x) => x.classList.remove('drop-target'));
  };
  fileArea.addEventListener('dragover', (e) => {
    const kind = dragKind(e);
    if (!kind || state.skillsMode || state.recentMode) return;
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = kind === 'external' || e.ctrlKey || e.metaKey ? 'copy' : 'move';
    clearDropHints();
    const folder = dropFolderEl(e);
    if (folder) folder.classList.add('drop-target');
    else fileArea.classList.add('drop-in');
  });
  fileArea.addEventListener('dragleave', (e) => { if (!fileArea.contains(e.relatedTarget)) clearDropHints(); });
  fileArea.addEventListener('drop', async (e) => {
    const kind = dragKind(e);
    if (!kind || state.skillsMode || state.recentMode) return;
    e.preventDefault(); e.stopPropagation();
    const folder = dropFolderEl(e);
    const dstDir = folder ? folder.dataset.path : state.cwd;
    clearDropHints();
    if (kind === 'internal') {
      await dropInternalPathsToDir(internalDragPaths(e.dataTransfer), dstDir, e.ctrlKey || e.metaKey);
      return;
    }
    await copyExternalFilesToDir(e.dataTransfer.files, dstDir);
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('#context-menu')) closeContextMenu(); });
  window.addEventListener('blur', closeContextMenu);
  $('#scope-toggle').onclick = () => cmdk.toggleScope();

  $('#toggle-hidden').checked = state.showHidden;
  $('#toggle-hidden').onchange = (e) => toggleHiddenFiles(e.target.checked);
  $('#file-filter').oninput = (e) => setFileFilter(e.target.value);
  $('#file-filter').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (state.filter) {
        e.target.value = '';
        setFileFilter('');
      }
      $('#file-area').focus?.();
      e.target.blur();
    }
  });
  $('#file-filter-clear').onclick = () => { setFileFilter(''); focusFileFilter(); };
  syncFilterUi();

  $('#sort-seg').querySelectorAll('button').forEach((b) => {
    b.onclick = () => setSort(b.dataset.sort);
  });
  syncSortControls();
  $('#view-seg').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === state.view);
    b.onclick = () => setFileView(b.dataset.view);
  });
  $('#gridsize-seg').querySelectorAll('button').forEach((b) => {
    b.onclick = () => setGridSize(b.dataset.size);
  });
  syncGridSizeControls();
  updateGridSizeVisibility();
  $('#content').addEventListener('wheel', (e) => {
    if (!(e.metaKey || e.ctrlKey) || state.view !== 'grid' || state.recentMode || state.skillsMode) return;
    e.preventDefault();
    stepGridSize(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  $('#cmdk-input').oninput = (e) => cmdk.search(e.target.value);
  $('#cmdk').onclick = (e) => { if (e.target.id === 'cmdk') cmdk.close(); };

  document.addEventListener('mousedown', (e) => {
    if ((e.button === 3 || e.button === 4) && !isEditingTarget(e.target)) e.preventDefault();
  }, true);
  document.addEventListener('mouseup', handleMouseHistoryButton, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#context-menu')) { closeContextMenu(); return; }
    const cmdkOpen = !$('#cmdk').classList.contains('hidden');
    const lbOpen = !!document.querySelector('.lightbox');
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); cmdkOpen ? cmdk.close() : cmdk.open(); return; }
    if (cmdkOpen) {
      if (e.key === 'Escape') cmdk.close();
      else if (e.key === 'ArrowDown') { e.preventDefault(); cmdk.move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cmdk.move(-1); }
      else if (e.key === 'Tab') { e.preventDefault(); cmdk.toggleScope(); }
      else if (e.key === 'Enter') { e.preventDefault(); cmdk.choose(cmdk.active, e.metaKey || e.ctrlKey); }
      return;
    }
    if (lbOpen) { if (e.key === 'Escape') document.querySelector('.lightbox').remove(); return; }
    if (imgEditState && (e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); ieUndo(imgEditState); return; }
    const inInput = isEditingTarget(document.activeElement);
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === 'F6') { e.preventDefault(); cycleFileManagerFocus(e.shiftKey); return; }
    if (!inInput && (e.key === 'BrowserBack' || e.key === 'GoBack')) { e.preventDefault(); goBack(); return; }
    if (!inInput && (e.key === 'BrowserForward' || e.key === 'GoForward')) { e.preventDefault(); goForward(); return; }
    if (!inInput && e.key === 'F3') { e.preventDefault(); focusFileFilter(); return; }
    if (!inInput && mod && e.shiftKey && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); locateCurrentInSidebar(); return; }
    if (!inInput && mod && e.shiftKey && !e.altKey && (e.key === 'h' || e.key === 'H')) { e.preventDefault(); toggleHiddenFiles(); return; }
    if (!inInput && mod && !e.shiftKey && ['f', 'F', 'e', 'E'].includes(e.key)) { e.preventDefault(); focusFileFilter(); return; }
    if (!inInput && ((e.ctrlKey && (e.key === 'l' || e.key === 'L')) || (e.altKey && (e.key === 'd' || e.key === 'D')) || e.key === 'F4')) {
      e.preventDefault(); beginAddressEdit(); return;
    }
    // 输入框里按 Esc 先退出输入，别越级把预览关掉
    if (e.key === 'Escape' && inInput) { document.activeElement.blur(); return; }
    if (e.key === 'Escape' && !inInput && clearFileFilterFromKeyboard()) return;
    // 选择态按 Esc 先清选择，再考虑关闭预览（资源管理器习惯）
    if (e.key === 'Escape' && (state.multiSel.size || state.selected)) { clearSelection(); return; }
    if (e.key === 'Escape' && !$('#preview').classList.contains('hidden')) { closePreview(false); return; }
    if (!inInput && e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goBack(); return; }
    if (!inInput && e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goForward(); return; }
    if (!inInput && e.altKey && e.key === 'ArrowUp') { e.preventDefault(); goUp(); return; }
    if (!inInput && e.altKey && e.key === 'Home') { e.preventDefault(); goHome(); return; }
    if (!inInput && e.altKey && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); togglePreviewPane(); return; }
    if (!inInput && e.altKey && e.key === 'Enter') { e.preventDefault(); showPropertiesSelection(); return; }
    if (!inInput && (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) { e.preventDefault(); openKeyboardContextMenu(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === '[') { e.preventDefault(); goBack(); return; }
    if (!inInput && mod && e.key === 'Tab') { e.preventDefault(); stepFolderTab(e.shiftKey ? -1 : 1); return; }
    if (!inInput && mod && !e.shiftKey && !e.altKey && e.key === 'PageUp') { e.preventDefault(); stepFolderTab(-1); return; }
    if (!inInput && mod && !e.shiftKey && !e.altKey && e.key === 'PageDown') { e.preventDefault(); stepFolderTab(1); return; }
    if (!inInput && mod && e.shiftKey && !e.altKey && (e.key === 't' || e.key === 'T')) { e.preventDefault(); restoreClosedFolderTab(); return; }
    if (!inInput && mod && !e.shiftKey && !e.altKey && (e.key === 't' || e.key === 'T')) { e.preventDefault(); newFolderTab(); return; }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'w' || e.key === 'W') && !inInput) { e.preventDefault(); closeFolderTab(state.activeFolderTab); return; }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B') && !inInput) { e.preventDefault(); toggleSidebar(); return; }
    if (inInput) return;
    if (handleFolderTabNumberShortcut(e)) return;
    if (e.key === 'F5') { e.preventDefault(); refreshDir(true); return; }
    if (mod && !e.shiftKey && !e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); refreshDir(true); return; }
    // 文件剪贴板与全选(资源管理器习惯)
    if (handleExplorerViewShortcut(e)) return;
    if (handleGridSizeShortcut(e)) return;
    if (mod && ((e.key === 'y' || e.key === 'Y') || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) { e.preventDefault(); redoLast(); return; }
    if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undoLast(); return; }
    if (mod && !e.shiftKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); openNewWindow(state.cwd); return; }
    if (mod && e.shiftKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); doCreate('dir'); return; }
    if (mod && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      let paths = selPaths();
      const cur = currentEntry();
      if (!paths.length && cur) paths = [cur.path];
      copyPaths(paths);
      return;
    }
    if (mod && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); selectAllVisible(); return; }
    if (mod && (e.key === 'c' || e.key === 'C') && selPaths().length) { e.preventDefault(); clipSet('copy'); return; }
    if (mod && (e.key === 'd' || e.key === 'D') && selPaths().length) { e.preventDefault(); trashSelection(); return; }
    if (mod && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); invertSelection(); return; }
    if (mod && (e.key === 'x' || e.key === 'X') && selPaths().length) { e.preventDefault(); clipSet('cut'); return; }
    if (mod && (e.key === 'v' || e.key === 'V') && (state.fileClip || window.fanboxClipboard?.readFiles)) { e.preventDefault(); clipPaste(); return; }
    // 主区键盘导航
    if (e.shiftKey && e.key === 'ArrowDown') { e.preventDefault(); extendCursor(state.cols); }
    else if (e.shiftKey && e.key === 'ArrowUp') { e.preventDefault(); extendCursor(-state.cols); }
    else if (e.shiftKey && e.key === 'ArrowRight') { e.preventDefault(); extendCursor(1); }
    else if (e.shiftKey && e.key === 'ArrowLeft') { e.preventDefault(); extendCursor(-1); }
    else if (e.shiftKey && e.key === 'Home') { e.preventDefault(); extendCursorTo(0); }
    else if (e.shiftKey && e.key === 'End') { e.preventDefault(); extendCursorTo(state.visible.length - 1); }
    else if (e.shiftKey && e.key === 'PageDown') { e.preventDefault(); extendCursor(visibleItemStep()); }
    else if (e.shiftKey && e.key === 'PageUp') { e.preventDefault(); extendCursor(-visibleItemStep()); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveCursor(state.cols); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveCursor(-state.cols); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); moveCursor(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); moveCursor(-1); }
    else if (e.key === 'Home') { e.preventDefault(); moveCursorTo(0); }
    else if (e.key === 'End') { e.preventDefault(); moveCursorTo(state.visible.length - 1); }
    else if (e.key === 'PageDown') { e.preventDefault(); moveCursor(visibleItemStep()); }
    else if (e.key === 'PageUp') { e.preventDefault(); moveCursor(-visibleItemStep()); }
    else if (e.key === 'Enter') { e.preventDefault(); cursorEnter(e.metaKey || e.ctrlKey); }
    else if (e.shiftKey && e.key === 'Delete') { e.preventDefault(); deleteSelectionPermanent(); }
    else if (mod && (e.key === 'Backspace' || e.key === 'Delete')) { e.preventDefault(); trashSelection(); }
    else if (e.key === 'Delete') { e.preventDefault(); trashSelection(); } // Windows:Delete=回收站
    else if (e.key === 'Backspace' && trimTypeAhead()) { e.preventDefault(); }
    else if (e.key === 'Backspace') { e.preventDefault(); goBackspace(); }
    else if (e.key === ' ') { e.preventDefault(); if (mod) toggleCursorSelection(); else selectCursorEntry(); }
    else if (e.key === 'F2') { e.preventDefault(); const it = currentEntry(); if (it && it.isDrive) return; if (it) doRename(it); }
    else if (!e.altKey && !mod && !e.isComposing && e.key.length === 1 && e.key !== ' ') {
      if (selectByTypeAhead(e.key.toLocaleLowerCase('zh'))) e.preventDefault();
    }
  });
}
function updateGridSizeVisibility() {
  $('#gridsize-seg').style.display = state.view === 'grid' ? '' : 'none';
}
function setFileView(view, rerender = true) {
  if (!['grid', 'list'].includes(view) || state.view === view) return;
  state.view = view;
  localStorage.setItem('fb_view', state.view);
  $('#view-seg').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));
  updateGridSizeVisibility();
  if (rerender) renderFiles();
}
function syncGridSizeControls() {
  $('#gridsize-seg').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.size === state.gridSize));
}
function setGridSize(size, rerender = true) {
  if (!['sm', 'md', 'lg'].includes(size) || state.gridSize === size) return;
  state.gridSize = size;
  localStorage.setItem('fb_gridsize', state.gridSize);
  syncGridSizeControls();
  if (rerender) renderFiles();
}
function stepGridSize(delta) {
  const sizes = ['sm', 'md', 'lg'];
  const i = Math.max(0, sizes.indexOf(state.gridSize));
  const next = sizes[Math.max(0, Math.min(sizes.length - 1, i + delta))];
  setGridSize(next);
}
function handleGridSizeShortcut(e) {
  if (state.view !== 'grid' || state.recentMode || state.skillsMode) return false;
  if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return false;
  if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    stepGridSize(1);
    return true;
  }
  if (e.key === '-') {
    e.preventDefault();
    stepGridSize(-1);
    return true;
  }
  if (e.key === '0') {
    e.preventDefault();
    setGridSize('md');
    return true;
  }
  return false;
}
function handleExplorerViewShortcut(e) {
  if (!e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey || state.recentMode || state.skillsMode) return false;
  const key = e.code || e.key;
  if (key === 'Digit1' || e.key === '1') {
    e.preventDefault();
    setFileView('grid');
    setGridSize('lg');
    return true;
  }
  if (key === 'Digit2' || e.key === '2') {
    e.preventDefault();
    setFileView('grid');
    setGridSize('md');
    return true;
  }
  if (key === 'Digit3' || e.key === '3' || key === 'Digit4' || e.key === '4') {
    e.preventDefault();
    setFileView('grid');
    setGridSize('sm');
    return true;
  }
  if (key === 'Digit5' || e.key === '5' || key === 'Digit6' || e.key === '6') {
    e.preventDefault();
    setFileView('list');
    return true;
  }
  return false;
}
function handleFolderTabNumberShortcut(e) {
  const plainCtrl = e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
  if (!plainCtrl || state.skillsMode) return false;
  const key = e.code || e.key;
  if (key === 'Digit9' || e.key === '9') {
    e.preventDefault();
    jumpFolderTab(9);
    return true;
  }
  const match = /^Digit([1-9])$/.exec(key) || (/^[1-9]$/.test(e.key) ? [, e.key] : null);
  if (!match) return false;
  e.preventDefault();
  jumpFolderTab(Number(match[1]));
  return true;
}

// ---------- 主题 / 皮肤 ----------
function applyTheme(skin, rerender = true) {
  if (!['seavo', 'terminal', 'warm', 'editorial'].includes(skin)) skin = 'seavo';
  // 信步皮肤是亮色系,代码高亮跟 warm/editorial 一样走 github 亮色主题
  state.theme = skin;
  document.documentElement.dataset.theme = skin;
  localStorage.setItem('fb_theme', skin);
  const link = document.getElementById('hljs-theme');
  if (link) link.href = '/vendor/hljs/styles/' + (skin === 'terminal' ? 'github-dark' : 'github') + '.min.css';
  document.querySelectorAll('#theme-switch .theme-seg button').forEach((b) => b.classList.toggle('active', b.dataset.skin === skin));
  if (typeof term !== 'undefined' && term.sessions.length) term.retheme();
  if (typeof mona !== 'undefined') mona.retheme();
  if (rerender && state.entries.length) {
    renderFiles();
    // 预览里的代码高亮配色随皮肤切换，重渲染当前选中项
    if (state.selected && !$('#preview').classList.contains('hidden')) {
      const e = state.entries.find((x) => x.path === state.selected);
      if (e) openPreview(e);
    }
  }
}

// ---------- 内嵌终端（仅桌面 app；浏览器版优雅降级）----------
// agent「等你拍板」界面特征（claude code 2.1.x / codex 0.13x 实测文案，宁缺勿滥：
// 不命中只是退化成「任务完成」标题，不会漏响）
const TERM_ASK_RE = /(Do you want to (proceed|continue|make this edit|allow|use this)|Would you like to proceed|Ready to code\?|created or one you trust\?|tell (Claude|Codex) what to do differently|Yes, and don't ask again|Allow Codex to (run|apply|create)|Codex wants to|[❯›][ \t]*1\.[ \t]*Yes)/;
const term = {
  sessions: [], seq: 0, active: null, maximized: false,
  dock: localStorage.getItem('fb_term_dock') || 'bottom',
  followBrowse: localStorage.getItem('fb_term_follow') === '1',
  available() { return !!(window.fanboxPty && window.Terminal && !window.__noXterm); },
  // 每套皮肤一整套手调 ANSI 主题——暗皮肤暗终端、亮皮肤亮终端，不再出现「暖纸里嵌黑块」
  themes: {
    terminal: {
      background: '#0b0c0a', foreground: '#d6dac9', cursor: '#cdf24b', cursorAccent: '#0b0c0a', selectionBackground: '#cdf24b40',
      black: '#1c1e17', red: '#e8825b', green: '#cdf24b', yellow: '#e8c95b', blue: '#7bc9e8', magenta: '#d68ad6', cyan: '#5bd6c0', white: '#d6dac9',
      brightBlack: '#62655a', brightRed: '#ff9b73', brightGreen: '#dcff66', brightYellow: '#ffe082', brightBlue: '#9ad8ff', brightMagenta: '#f0a8f0', brightCyan: '#7fffe0', brightWhite: '#f2f2ea',
    },
    warm: {
      background: '#ece2d2', foreground: '#4a3f30', cursor: '#cc785c', cursorAccent: '#ece2d2', selectionBackground: '#cc785c33',
      black: '#3a3025', red: '#b5502f', green: '#5f7a36', yellow: '#9a7b2e', blue: '#3a6a8a', magenta: '#9a5a7a', cyan: '#3a7a70', white: '#6b6355',
      brightBlack: '#8a7d68', brightRed: '#c75f38', brightGreen: '#6f8a40', brightYellow: '#b08a30', brightBlue: '#4a7a9a', brightMagenta: '#aa6a8a', brightCyan: '#4a8a82', brightWhite: '#3a3025',
    },
    editorial: {
      background: '#eae5d8', foreground: '#1a1a1a', cursor: '#ff433d', cursorAccent: '#eae5d8', selectionBackground: '#ff433d22',
      black: '#0a0a0a', red: '#cc1f1a', green: '#00803a', yellow: '#8a6d00', blue: '#0000cc', magenta: '#9a2a8a', cyan: '#007a8a', white: '#57534a',
      brightBlack: '#57534a', brightRed: '#e8302a', brightGreen: '#00a33e', brightYellow: '#a67c00', brightBlue: '#2222dd', brightMagenta: '#b03aa0', brightCyan: '#008a9a', brightWhite: '#0a0a0a',
    },
    // 信步 SEAVO（公司版）：暖纸 × 火焰橘红 × 暖墨，按设计系统 ANSI 映射
    seavo: {
      background: '#F7F4EF', foreground: '#16140F', cursor: '#E94A16', cursorAccent: '#F7F4EF', selectionBackground: '#E94A1622',
      black: '#16140F', red: '#C2401A', green: '#3C7D4F', yellow: '#C2861B', blue: '#3A5A7A', magenta: '#8A4A6A', cyan: '#3A7A70', white: '#595249',
      brightBlack: '#A39B8E', brightRed: '#E94A16', brightGreen: '#4C8D5F', brightYellow: '#D2962B', brightBlue: '#4A6A8A', brightMagenta: '#9A5A7A', brightCyan: '#4A8A80', brightWhite: '#16140F',
    },
  },
  theme() { return this.themes[state.theme] || this.themes.terminal; },
  toggle() {
    if (!this.available()) { if (state.cwd) openWith(state.cwd, 'terminal'); return; } // 浏览器降级到系统终端
    const hidden = $('#terminal-panel').classList.contains('hidden');
    hidden ? this.open() : this.close();
  },
  open() {
    $('#terminal-panel').classList.remove('hidden');
    $('#terminal-resizer').classList.remove('hidden');
    setDockMode('term');
    this.applyDock();
    if (!this.sessions.length) this.newTab();
    else this.fitActive();
    $('#btn-terminal').classList.add('active');
    localStorage.setItem('fb_term_open', '1');
    if (!localStorage.getItem('fb_term_draghint')) { localStorage.setItem('fb_term_draghint', '1'); setTimeout(() => toast('提示：把左侧文件 / 文件夹拖进终端，即插入路径喂给 agent'), 700); }
  },
  close() {
    if (this.maximized) this.toggleMax(false); // 铺满状态下收起终端，term-max 不清会把文件区一起藏没
    $('#terminal-panel').classList.add('hidden');
    $('#terminal-resizer').classList.add('hidden');
    $('#main-body').classList.remove('fm-squeezed'); // 终端收起后文件区必须回来
    $('#btn-terminal').classList.remove('active');
    localStorage.setItem('fb_term_open', '0');
  },
  applyDock() {
    const mb = $('#main-body');
    mb.classList.toggle('dock-bottom', this.dock === 'bottom');
    mb.classList.toggle('dock-right', this.dock === 'right');
    // 全铺状态只在终端可见时恢复，否则文件区会凭空消失
    const termOpen = !$('#terminal-panel').classList.contains('hidden');
    mb.classList.toggle('fm-squeezed', termOpen && localStorage.getItem('fb_term_squeeze') === '1');
    const panel = $('#terminal-panel');
    if (this.dock === 'bottom') { panel.style.height = (Number(localStorage.getItem('fb_term_h')) || 280) + 'px'; panel.style.width = ''; }
    else { panel.style.width = (Number(localStorage.getItem('fb_term_w')) || 480) + 'px'; panel.style.height = ''; }
    applyPreviewSize(); // 预览随 dock 翻转轴向
    this.fitActive();
  },
  setDock(d) {
    if (this.maximized) this.toggleMax(false); // 铺满下切布局看不出任何变化，先退出铺满让分屏可见
    animateLayout(); this.dock = d; localStorage.setItem('fb_term_dock', d); this.applyDock();
  },
  // 终端最大化：铺满整个中区（文件区让位），再点还原
  toggleMax(force) {
    animateLayout();
    this.maximized = force === undefined ? !this.maximized : force;
    $('#main-body').classList.toggle('term-max', this.maximized);
    const b = $('#term-max');
    if (b) { b.classList.toggle('on', this.maximized); b.title = this.maximized ? '还原终端' : '终端铺满'; }
    this.fitActive();
  },
  // 在指定目录开终端（新标签）；浏览器版降级到系统终端。返回新 session（spawn 完成后）
  openInDir(dir) {
    if (!this.available()) { openWith(dir, 'terminal'); return null; }
    $('#terminal-panel').classList.remove('hidden');
    $('#terminal-resizer').classList.remove('hidden');
    this.applyDock();
    $('#btn-terminal').classList.add('active');
    localStorage.setItem('fb_term_open', '1'); // 右键/一键开终端也记住开合，和 open/close 对称
    return this.newTab(dir);
  },
  // 拖拽文件/文件夹进来：把 shell 转义后的路径插入活动终端（作为 agent 上下文）
  insertPath(p) {
    if (!this.available()) { openWith(dirOf(p), 'terminal'); return; }
    const wasHidden = $('#terminal-panel').classList.contains('hidden');
    if (wasHidden) this.open();
    const write = () => { if (this.active) this.input(this.active, shQuote(p) + ' '); const s = this.sessions.find((x) => x.id === this.active); if (s) s.xterm.focus(); };
    if (wasHidden) setTimeout(write, 280); else write();
  },
  // 一键在终端启动 coding agent：当前标签是空闲 shell 就地启动；正跑着东西（claude/codex/任何前台程序）
  // 则新开标签，不打断也不把命令打进别的程序里
  async launchAgent(cmd) {
    if (!this.available()) { openWith(state.cwd, 'terminal'); return; } // 网页版降级到系统终端
    let sess = null;
    if (this.sessions.length) {
      if ($('#terminal-panel').classList.contains('hidden')) this.open();
      const cur = this.sessions.find((x) => x.id === this.active);
      if (cur && !cur.dead && await this.isPlainShell(cur)) sess = cur;
    }
    if (!sess) sess = await this.openInDir(state.cwd); // 等 spawn 完，拿确切 session 写入
    if (sess && !sess.dead) { this.input(sess.id, cmd + '\r'); sess.xterm.focus(); toast('已在终端启动 ' + cmd); }
    else toast('终端启动失败', true);
  },
  // 在指定目录新开标签跑命令（续会话/发版等）：不复用别处的空闲 shell，目录必须对
  async runInDir(dir, cmd, msg) {
    if (!this.available()) { openWith(dir, 'terminal'); return; }
    const sess = await this.openInDir(dir);
    if (sess && !sess.dead) { this.input(sess.id, cmd + '\r'); sess.xterm.focus(); toast(msg || '已在终端启动'); }
    else toast('终端启动失败', true);
  },
  // 该会话前台是不是裸 shell？判断不了一律按「不是」处理——宁可新开标签，也不往运行中的程序里打字
  async isPlainShell(s) {
    try {
      const r = await window.fanboxPty.proc(s.id);
      if (!r || !r.ok || !r.proc) return false;
      const name = String(r.proc).split('/').pop().replace(/^-/, '').toLowerCase();
      return ['zsh', 'bash', 'fish', 'sh', 'dash', 'tcsh', 'nu', 'pwsh', 'powershell.exe', 'cmd.exe'].includes(name);
    } catch { return false; }
  },
  // 把预览里选中的文字作为「上下文」喂给终端 agent：带文件出处 + 围栏，bracketed paste 防逐行误提交
  sendContext(text, srcPath) {
    if (!this.available()) { toast('内嵌终端不可用（网页版没有终端）', true); return; }
    const wasHidden = $('#terminal-panel').classList.contains('hidden');
    if (wasHidden) this.open();
    const rel = srcPath ? srcPath.replace(state.home, '~') : '';
    const head = rel ? `（来自 ${rel} 的片段）` : '（选中的片段）';
    const block = `${head}\n\`\`\`\n${text}\n\`\`\`\n`;
    const write = () => {
      if (!this.active) return;
      // \x1b[200~ … \x1b[201~ 是 bracketed paste：多行内容当作一次粘贴，不会被 shell/TUI agent 逐行执行
      this.input(this.active, '\x1b[200~' + block + '\x1b[201~');
      const s = this.sessions.find((x) => x.id === this.active); if (s) s.xterm.focus();
    };
    if (wasHidden) setTimeout(write, 300); else write();
  },
  // 用户输入统一入口：记 lastInput 供回显过滤（击键/粘贴/拖路径/跟随 cd 引发的重绘不算 agent 干活）
  input(id, d) {
    const s = this.sessions.find((x) => x.id === id);
    if (s) {
      s.lastInput = Date.now();
      // 回车多半提交了条命令（cd 这类被回显过滤、不走 busy 周期），稍后把标题对齐真实目录
      if (d.indexOf('\r') !== -1) { clearTimeout(s._cwdT); s._cwdT = setTimeout(() => this.refreshCwd(s, true), 800); }
    }
    window.fanboxPty.input(id, d);
  },
  // 点终端里的文件名/路径 → 结合 cwd + 回扫 scrollback + 搜索定位真实文件，在翻箱里打开
  // tail：路径在该逻辑行里的后续文本，服务端用它做「空格扩展」stat 验证（带空格的文件名靠它补全）
  // rowHint：点击处逻辑行的末物理行号（buffer 绝对行），回扫 scrollback 的起点
  async openTermPath(id, raw, tail, rowHint) {
    let p = String(raw).replace(/^['"]+/, '').replace(/[)\]'"`,:;]+$/, '');
    let cwd = state.cwd;
    let candidate = p;
    // 相对路径判断兼容 Windows 盘符：C:\ 或 C:/ 开头也是绝对路径
    const isRel = !p.startsWith('/') && !p.startsWith('~') && !/^[A-Za-z]:[\\/]/.test(p);
    if (isRel) {
      try { const r = await window.fanboxPty.cwd(id); if (r && r.ok && r.cwd) cwd = r.cwd; } catch { /* */ }
      candidate = (cwd || '').replace(/[\\/]+$/, '') + state.sep + p.replace(/^\.[\\/]/, '');
    }
    const name = p.split(/[\\/]/).pop();
    // 回扫 scrollback：agent 生成文件时几乎总打印过全路径（裸文件名常常不在 cwd 下），比模糊搜索可信
    const alt = isRel ? this.scanScrollbackFor(id, name, rowHint) : '';
    // 活跃项目根（浏览目录 + 各终端项目目录）作 basename 搜索的额外根
    const roots = [];
    if (state.cwd) roots.push(state.cwd);
    this.sessions.forEach((x) => { const d = x.cwd || x.startDir; if (d && !roots.includes(d)) roots.push(d); });
    const q = encodeURIComponent;
    const r = await api(`/api/locate?path=${q(candidate)}&name=${q(name)}&root=${q(cwd || state.home)}&tail=${q(tail || '')}&alt=${q(alt)}&roots=${q(roots.join('\n'))}`);
    if (!r.found) { toast('没找到「' + name + '」', true); return; }
    if (r.isDir) { navigate(r.path); toast('已跳到该目录'); return; }
    await navigate(dirOf(r.path));
    const e = state.entries.find((x) => x.path === r.path) || { path: r.path, name: baseOf(r.path), kind: 'text', isDir: false };
    applySelection(r.path); openPreview(e); recordRecent(r.path);
    toast(r.viaSearch ? '未精确命中，已打开最接近的「' + baseOf(r.path) + '」' : (r.viaScrollback ? '已按会话里出现过的路径打开' : '已打开'));
  },
  // 从 fromRow 往上回扫 scrollback（最多 2000 物理行），收集含该 basename 的绝对路径（/ 或 ~ 开头，
  // 最近出现在前，≤3 个），交给 /api/locate 逐个 stat 验证。折行沿 isWrapped 拼回逻辑行；
  // 含 … 的截断路径、URL（// 开头或紧跟冒号）跳过，继续往上找干净的
  scanScrollbackFor(id, name, fromRow) {
    const s = this.sessions.find((x) => x.id === id);
    if (!s || !name) return '';
    const buf = s.xterm.buffer.active;
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(?:~|/)(?:[^\\s\'"`()]*/)?' + esc + '(?=$|[\\s\'"`)\\],:;。，）】])', 'gu');
    const hits = [];
    let row = Math.min(fromRow == null ? buf.length - 1 : fromRow, buf.length - 1);
    let budget = 2000;
    while (row >= 0 && budget > 0 && hits.length < 3) {
      let start = row;
      while (start > 0 && buf.getLine(start) && buf.getLine(start).isWrapped) start--;
      budget -= row - start + 1;
      let text = '';
      for (let i = start; i <= row; i++) {
        const ln = buf.getLine(i);
        if (ln) text += ln.translateToString(i === row); // 折行中段保持整行宽（不 trim），仅末行 trim
      }
      if (text.includes(name)) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) { // 行内多候选：跳过被护栏否决的，继续找同行更干净的
          const cand = m[0];
          if (cand && !cand.includes('…') && !cand.startsWith('//') && text[m.index - 1] !== ':' && !hits.includes(cand)) { hits.push(cand); break; }
        }
      }
      row = start - 1;
    }
    return hits.join('\n');
  },
  // 终端跟随浏览：把活动终端 cd 到指定目录
  syncCd(dir) {
    if (!this.active || !dir) return;
    this.input(this.active, 'cd ' + shQuote(dir) + '\r');
  },
  setFollow(on) {
    this.followBrowse = on;
    localStorage.setItem('fb_term_follow', on ? '1' : '0');
    $('#term-follow').classList.toggle('on', on);
    if (on && this.active && state.cwd) this.syncCd(state.cwd);
  },
  // 定位文件区到活动终端的真实目录
  async locateCwd() {
    if (!this.active) return;
    const r = await window.fanboxPty.cwd(this.active);
    if (r && r.ok && r.cwd) navigate(r.cwd);
    else toast('取终端目录失败', true);
  },
  // 项目身份色：路径稳定哈希到色相——同一项目的标签色点永远一个色，扫一眼即配对
  hueOf(p) { let h = 0; for (let i = 0; i < (p || '').length; i++) h = (h * 31 + p.charCodeAt(i)) >>> 0; return h % 360; },
  // 标签标题跟着终端「现在」的目录走（lsof 查真实 cwd），不再停留在创建时的快照；
  // 多标签跑不同项目的 agent 时，标题才认得出谁是谁
  async refreshCwd(s, force) {
    if (!s || s.dead) return;
    const now = Date.now();
    // 轻节流：避免每 3-5 秒打一条日志的后台会话（dev server）在 busy→idle 间无限循环里反复 spawn lsof。
    // cd / 用户主动场景传 force 跳过节流，标题立刻对齐
    if (!force && now - (s._cwdAt || 0) < 4000) return;
    s._cwdAt = now;
    try {
      const r = await window.fanboxPty.cwd(s.id);
      if (r && r.ok && r.cwd && r.cwd !== s.cwd) {
        s.cwd = r.cwd; s.title = baseOf(r.cwd) || s.title;
        this.renderTabs(); renderBreadcrumb(); // 面包屑的项目配对色点也跟着换
      }
    } catch { /* 取不到就保持原标题 */ }
  },
  async newTab(cwdOverride) {
    const startDir = cwdOverride || state.cwd;
    const id = 't' + (++this.seq);
    const host = document.createElement('div');
    host.className = 'xterm-instance';
    $('#xterm-host').appendChild(host);
    host.classList.add('show'); // 先可见再 open/fit：display:none 下 fit 量不出尺寸，PTY 会以 80 列出生
    const FitCtor = window.FitAddon ? (window.FitAddon.FitAddon || window.FitAddon) : null;
    const xterm = new window.Terminal({
      fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace',
      fontSize: 13, lineHeight: 1.2, cursorBlink: true, theme: this.theme(), scrollback: 5000,
      allowProposedApi: true, // unicode11 宽度 API 需要
      // agent 常输出按深色终端设计的 256 色/真彩（如淡蓝路径），在浅色皮肤上几乎隐形；
      // 自动把对比度不足的前景色压暗/提亮到 4.5:1（WCAG AA，VS Code 终端同款默认值）
      minimumContrastRatio: 4.5,
    });
    const fit = FitCtor ? new FitCtor() : null;
    if (fit) xterm.loadAddon(fit);
    // CJK 宽字符正确宽度：没有它，中文目录名会让 zsh 提示符重绘错列（乱码）
    if (!window.__noUnicode11 && window.Unicode11Addon) {
      try { const U = window.Unicode11Addon.Unicode11Addon || window.Unicode11Addon; xterm.loadAddon(new U()); xterm.unicode.activeVersion = '11'; } catch { /* */ }
    }
    xterm.open(host);
    // 滚动失同步自愈：DOM 滚动条已到底但 buffer 没到底，是 5.5.0 旧 Viewport 的 bug 签名
    //（正常跟随输出时两者同步在底、用户上翻时 DOM 不在底，都不会触发），重算滚动区并到底
    const vpEl = host.querySelector('.xterm-viewport');
    if (vpEl) host.addEventListener('wheel', (ev) => {
      if (ev.deltaY <= 0) return; // 只管「向下滚卡住」
      requestAnimationFrame(() => { try {
        const b = xterm.buffer.active;
        if (b.type !== 'normal') return; // vim/htop 的 alt-screen 没有滚动条语义
        const atDomBottom = vpEl.scrollTop + vpEl.clientHeight >= vpEl.scrollHeight - 2;
        if (atDomBottom && b.viewportY < b.baseY) {
          xterm._core.viewport?.syncScrollArea?.(true);
          xterm.scrollToBottom();
        }
      } catch { /* 滚动中关标签：xterm 已 dispose，忽略 */ } });
    }, { passive: true });
    // WebGL 渲染加速（大输出/TUI 不掉帧），失败或上下文丢失回退 DOM
    if (!window.__noWebgl && window.WebglAddon) {
      try {
        const Wg = window.WebglAddon.WebglAddon || window.WebglAddon;
        const wg = new Wg();
        wg.onContextLoss(() => { try { wg.dispose(); } catch { /* */ } });
        xterm.loadAddon(wg);
      } catch { /* 回退默认 DOM renderer */ }
    }
    if (fit) try { fit.fit(); } catch { /* */ }
    const sess = { id, xterm, fit, host, dead: false, status: 'idle', unread: false, startDir, title: baseOf(startDir || '') || 'shell' };
    this.sessions.push(sess);
    this.activate(id);
    updateWatches(); // 新终端的项目目录也纳入监听
    const r = await window.fanboxPty.spawn({ id, cwd: startDir, cols: xterm.cols, rows: xterm.rows });
    if (!r.ok) { sess.dead = true; xterm.write('\r\n  \x1b[31m终端启动失败：' + (r.error || '') + '\x1b[0m\r\n'); }
    else sess.cwd = r.cwd || startDir; // 末尾 renderTabs 统一带上 cwd 重画
    xterm.onData((d) => {
      if (sess.dead) { if (d === '\r' || d === '\n') this.respawn(sess); return; } // 进程退出后回车真重开
      this.input(id, d);
    });
    xterm.onResize(({ cols, rows }) => { sess.lastInput = Date.now(); window.fanboxPty.resize(id, cols, rows); }); // resize 引发的 TUI 重绘不算 agent 干活
    window.fanboxPty.resize(id, xterm.cols, xterm.rows); // spawn 等待期间 fit 过的 resize 事件无人监听会丢：补发一次对齐 PTY
    // 识别终端输出里的文件路径 → hover 高亮 + 点击在翻箱打开
    // 三层匹配：引号串（边界最可靠，文件名可含空格）> 斜杠路径 > 带已知扩展名的裸文件名；
    // 长路径折行用逐 cell 拼回逻辑行（CJK 宽字符占两列，下标→坐标必须按 cell 算才不偏移）
    if (xterm.registerLinkProvider) {
      xterm.registerLinkProvider({
        provideLinks: (lineNo, cb) => {
          const buf = xterm.buffer.active;
          if (!buf.getLine(lineNo - 1)) { cb(undefined); return; }
          let startRow = lineNo - 1;
          while (startRow > 0 && buf.getLine(startRow).isWrapped) startRow--;
          let endRow = startRow;
          while (buf.getLine(endRow + 1) && buf.getLine(endRow + 1).isWrapped) endRow++;
          let text = '';
          const pos = []; // pos[i] = 第 i 个字符的终端坐标 {x, y, w}
          for (let row = startRow; row <= endRow; row++) {
            const ln = buf.getLine(row);
            if (!ln) break;
            for (let col = 0; col < ln.length; col++) {
              const cell = ln.getCell(col);
              if (!cell || cell.getWidth() === 0) continue; // 宽字符的占位列
              const ch = cell.getChars() || ' ';
              for (const c of ch) { text += c; pos.push({ x: col + 1, y: row + 1, w: cell.getWidth() }); }
            }
          }
          const t = text.replace(/\s+$/, '');
          const links = []; const found = [];
          const overlaps = (s, e) => found.some((f) => s < f.e && e > f.s);
          const push = (s, e, cand, tail, act) => {
            if (e - s < 3 || overlaps(s, e)) return;
            const a = pos[s], b = pos[e - 1];
            if (!a || !b) return;
            found.push({ s, e, cand, tail });
            links.push({
              range: { start: { x: a.x, y: a.y }, end: { x: b.x + b.w - 1, y: b.y } },
              text: cand,
              decorations: { pointerCursor: true, underline: true },
              activate: act || (() => this.openTermPath(id, cand, tail, endRow)),
            });
          };
          let m;
          // 0. URL：直接系统浏览器打开（Electron 的 windowOpenHandler 会转 shell.openExternal）
          const reU = /\bhttps?:\/\/[^\s'"`<>）（【】「」]+/g;
          while ((m = reU.exec(t)) !== null) {
            const url = m[0].replace(/[)\],.:;。，？！?!）】>]+$/, '');
            push(m.index, m.index + url.length, url, '', () => window.open(url));
          }
          // 1. 引号串：拖拽插入/agent 输出常用 '…' 包路径，内容像路径或文件名就整体认
          const reQ = /'([^']{3,})'|"([^"]{3,})"/g;
          while ((m = reQ.exec(t)) !== null) {
            const inner = m[1] || m[2];
            if (!inner.includes('/') && !inner.includes('\\') && !/\.[A-Za-z0-9]{1,8}$/.test(inner)) continue;
            push(m.index + 1, m.index + 1 + inner.length, inner, '');
          }
          // 1b. Windows 盘符路径：C:\Users\… 或 C:/Users/…（仅 Windows 启用——上游新正则只认正斜杠，反斜杠路径靠这块）
          if (state.platform === 'win32') {
            const reWin = /(?<![\w])[A-Za-z]:[\\/][^\s'"`()|<>]+/g;
            while ((m = reWin.exec(t)) !== null) {
              const raw = m[0].replace(/[)\],.:;。，]+$/, '');
              if (raw.length < 4) continue;
              const tail = t.slice(m.index + raw.length).split(/['"`]/)[0].slice(0, 160);
              push(m.index, m.index + raw.length, raw, tail);
            }
          }
          // 2. 含斜杠的 token：宽进严出——整个 token 都收（.claude/x、写作/01-xx、/abs、~/x 全覆盖），
          // 配不配下划线交给服务端 stat 验证（散文里的「分发/产品演示——……」会被验证刷掉）
          const reP = /[^\s'"`:()（）「」【】<>]*\/[^\s'"`:()（）「」【】<>]*/g;
          const r2 = [];
          while ((m = reP.exec(t)) !== null) {
            // 全角标点几乎不出现在路径里，却常把路径和后续散文粘成一个 token：切到第一个为止
            const raw = m[0].split(/[，。、？！…—]+/)[0].replace(/[)\],.:;]+$/, '');
            if (raw.length < 3 || !raw.includes('/') || /^https?:\/\//.test(raw)) continue;
            if (overlaps(m.index, m.index + raw.length)) continue;
            const tail = t.slice(m.index + raw.length).split(/['"`]/)[0].slice(0, 160);
            r2.push({ s: m.index, e: m.index + raw.length, cand: raw, tail });
          }
          const finish = () => {
            // 3. 裸文件名：unicode 字符类（调研.md 能点）+ 扩展名白名单（e.g/node.js 不误报）。
            // 紧跟斜杠路径、只隔空格的裸名多半是同一带空格路径的后半段：点哪段都按完整串定位
            //（真分离的如 ls /tmp foo.md，完整串 stat 不中会回落到 basename 搜索，不会开错）
            TERM_LINK_RE_BARE.lastIndex = 0;
            let mm;
            while ((mm = TERM_LINK_RE_BARE.exec(t)) !== null) {
              const end = mm.index + mm[0].length;
              const prev = found.find((f) => f.tail && f.e <= mm.index && /^\s+$/.test(t.slice(f.e, mm.index)));
              if (prev) push(mm.index, end, t.slice(prev.s, end), t.slice(end).split(/['"`]/)[0].slice(0, 160));
              else push(mm.index, end, mm[0], '');
            }
            cb(links.length ? links : undefined);
          };
          if (!r2.length) { finish(); return; }
          const sess0 = this.sessions.find((x) => x.id === id);
          const cwd0 = (sess0 && (sess0.cwd || sess0.startDir)) || state.cwd || '';
          // 验证结果按 (cwd, cand, tail) 缓存：provideLinks 在鼠标移动时反复触发，别反复打接口
          this._vCache = this._vCache || new Map();
          const need = r2.filter((x) => !this._vCache.has(cwd0 + ' ' + x.cand + ' ' + x.tail));
          const apply = () => {
            r2.forEach((x) => { if (this._vCache.get(cwd0 + ' ' + x.cand + ' ' + x.tail)) push(x.s, x.e, x.cand, x.tail); });
            finish();
          };
          if (!need.length) { apply(); return; }
          apiPost('/api/term-verify', { cwd: cwd0, items: need.map((x) => ({ cand: x.cand, tail: x.tail })) }).then((res) => {
            need.forEach((x, i) => this._vCache.set(cwd0 + ' ' + x.cand + ' ' + x.tail, !!(res.results && res.results[i])));
            if (this._vCache.size > 600) { for (const k of this._vCache.keys()) { this._vCache.delete(k); if (this._vCache.size <= 400) break; } }
            apply();
          }).catch(() => finish()); // 验证不可用：宁可不划线，不要误标
        },
      });
    }
    this.renderTabs();
    return sess;
  },
  async respawn(sess) {
    sess.dead = false;
    sess.xterm.reset(); // 清掉死亡残留，新 shell 提示符不和旧画面叠在一起
    const r = await window.fanboxPty.spawn({ id: sess.id, cwd: sess.startDir || state.cwd, cols: sess.xterm.cols, rows: sess.xterm.rows });
    if (!r.ok) { sess.dead = true; sess.xterm.write('\x1b[31m重开失败：' + (r.error || '') + '\x1b[0m\r\n'); }
    else sess.cwd = r.cwd || sess.startDir;
  },
  activate(id) {
    this.active = id;
    this.sessions.forEach((s) => s.host.classList.toggle('show', s.id === id));
    const cur = this.sessions.find((x) => x.id === id);
    if (cur) cur.unread = false; // 切到该标签即清未读
    this.renderTabs();
    const s = this.sessions.find((x) => x.id === id);
    if (s) {
      this.fitActive();
      // xterm 5.5.0 旧 Viewport 在 display:none 期间会把滚动区高度算矮一屏（上游 #5339，6.0 重写才修）；
      // 重新可见后强制同步一次，否则滚轮到不了底部。升级 xterm 6.0 后删掉这行
      requestAnimationFrame(() => { try { s.xterm._core.viewport?.syncScrollArea?.(true); } catch { /* */ } });
      setTimeout(() => s.xterm.focus(), 0);
      // 延迟刷新标题（避开双击窗口：双击的第二下若撞上 renderTabs 重建会丢 dblclick 事件）
      setTimeout(() => this.refreshCwd(s), 600);
    }
  },
  closeTab(id) {
    const i = this.sessions.findIndex((x) => x.id === id);
    if (i < 0) return;
    const s = this.sessions[i];
    try { window.fanboxPty.kill(id); } catch { /* */ }
    try { s.xterm.dispose(); } catch { /* */ }
    s.host.remove();
    this.sessions.splice(i, 1);
    updateWatches(); // 该终端的项目目录不再需要监听
    if (!this.sessions.length) { this.close(); return; }
    if (this.active === id) this.activate(this.sessions[Math.max(0, i - 1)].id);
    else this.renderTabs();
  },
  fitActive() {
    const s = this.sessions.find((x) => x.id === this.active);
    if (!s || !s.fit) return;
    requestAnimationFrame(() => { try { s.fit.fit(); } catch { /* */ } });
  },
  // agent 态势感知：终端有输出→busy；静默 >2.5s→idle；进程退出→dead。
  // 非活动标签产生输出标记未读小点；长任务（busy>4s）完成且窗口失焦/非当前标签时发系统通知。
  markBusy(s) {
    const now = Date.now();
    $('#terminal-panel').classList.remove('term-awaiting'); // 又有动静了，撤掉「轮到你」呼吸
    // 回显过滤：距上次用户输入 <400ms 的输出多半是回显/TUI 重绘，不算 agent 自主干活：
    // 不进入 busy、不推 busyStart；已在 busy 则只续命（agent 干活时排队打字不打断）。
    // 续命只刷新 lastData（推迟评估时机），不刷新 lastReal（任务时长只数自发输出，打字不算工时）
    if (now - (s.lastInput || 0) < 400) { if (s.status === 'busy') s.lastData = now; return; }
    s.lastData = now; s.lastReal = now;
    if (s.status !== 'busy') { s.status = 'busy'; s.busyStart = now; this.renderTabs(); }
    if (s.id !== this.active) { if (!s.unread) { s.unread = true; this.renderTabs(); } }
    this.ensureStatusTick();
  },
  // 取缓冲区末尾 n 行纯文本：确认对话框和忙碌页脚都画在底部
  tailText(s, n = 25) {
    try {
      const buf = s.xterm.buffer.active;
      let t = '';
      for (let i = Math.max(0, buf.length - n); i < buf.length; i++) { const ln = buf.getLine(i); if (ln) t += ln.translateToString(true) + '\n'; }
      return t;
    } catch { return ''; }
  },
  // 轮到你了：终端边缘呼吸几秒，余光可感（agent 干完一段、把球踢回给你）
  awaitGlow() {
    const p = $('#terminal-panel');
    if (!p || p.classList.contains('hidden')) return;
    p.classList.add('term-awaiting');
    clearTimeout(this._awaitT);
    this._awaitT = setTimeout(() => p.classList.remove('term-awaiting'), 6500);
  },
  ensureStatusTick() {
    if (this._statusTimer) return;
    this._statusTimer = setInterval(() => {
      const now = Date.now(); let anyBusy = false;
      this.sessions.forEach((s) => {
        if (s.status !== 'busy') return;
        const quiet = now - (s.lastData || 0);
        if (quiet <= 2500) { anyBusy = true; return; } // claude/codex 忙碌心跳约 1s 一帧，容差太紧会闪断误报
        const tail = this.tailText(s);
        // 假静默护栏：页脚仍挂着「esc to interrupt」说明 agent 还在跑（失焦降频/网络卡顿），30s 内不判收工
        if (quiet < 30000 && /esc to interrupt/i.test(tail)) { anyBusy = true; return; }
        const dur = (s.lastReal || 0) - (s.busyStart || 0); // 工时只数自发输出：回显续命不算，免得打字把琐碎回显养肥成「真任务」
        s.status = 'idle';
        this.renderTabs();
        this.refreshCwd(s); // 干完一段活，标题对齐终端真实目录
        // 阶段性收工不报喜：底部状态行还挂着后台任务（「1 shell, 1 monitor still running」/「· 1 shell ·」），
        // agent 跑完会被自动唤醒接着干——这会儿弹「完成」是误报。圆点照常变空闲，提醒全部按下，等真收工再响
        const foot = this.tailText(s, 8);
        if (/\bstill running\b/i.test(foot) || /·\s*\d+\s+(shells?|monitors?|tasks?|agents?)\b/i.test(foot)) return;
        const ask = dur > 600 && TERM_ASK_RE.test(tail); // 停在审批/确认界面：等你拍板（不设 4s 门槛，审批常来得很快）
        if (ask || dur > 1500) this.awaitGlow();
        if (ask) {
          playChime('ask'); // 非 done → 单音，和「完成」的双音区分开
          if (!document.hasFocus() || s.id !== this.active) this.notify(s, '等待你确认', (s.title || 'shell') + ' 在等你拍板');
        } else if (dur > 4000) { // 跑了一会儿的真任务完成：文件区涟漪 + 极轻提示音 + 必要时系统通知
          rippleFileArea();
          playChime('done');
          if (!document.hasFocus() || s.id !== this.active) this.notify(s, 'agent 任务完成', (s.title || 'shell') + ' 已空闲');
        }
      });
      if (!anyBusy) { clearInterval(this._statusTimer); this._statusTimer = null; }
    }, 600);
  },
  notify(s, title, body) {
    try {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted') { new Notification(title, { body }); }
      else if (Notification.permission !== 'denied') { Notification.requestPermission().then((p) => { if (p === 'granted') new Notification(title, { body }); }); }
    } catch { /* 通知不可用就算了 */ }
  },
  renderTabs() {
    const bar = $('#term-tabs');
    bar.innerHTML = '';
    this.sessions.forEach((s) => {
      const t = document.createElement('div');
      const dotState = s.dead ? 'dead' : (s.status === 'busy' ? 'busy' : 'idle');
      t.className = 'term-tab' + (s.id === this.active ? ' active' : '') + (s.unread ? ' unread' : '');
      const dotTitle = s.dead ? '进程已退出' : (s.status === 'busy' ? 'agent 运行中' : '空闲');
      // 终端图标按项目路径染色：同项目同色，和面包屑的配对色点呼应
      const hue = this.hueOf(s.cwd || s.startDir);
      t.title = '双击：文件区跳到该终端所在目录';
      t.innerHTML = `<span class="tab-dot ${dotState}" title="${dotTitle}"></span>${ic('term', `hsl(${hue} 62% 48%)`, 12)}<span>${escapeHtml(s.title)}</span><span class="tab-x" title="关闭">✕</span>`;
      t.onclick = (e) => { if (e.target.classList.contains('tab-x')) { this.closeTab(s.id); return; } this.activate(s.id); };
      t.ondblclick = (e) => { if (e.target.classList.contains('tab-x')) return; this.locateCwd(); };
      bar.appendChild(t);
    });
  },
  retheme() { const th = this.theme(); this.sessions.forEach((s) => { s.xterm.options.theme = th; }); },
};

// ---------- Agent 用量面板（侧栏常驻，可开合）----------
// Claude Code 是官方限额窗口（5h/周，OAuth 接口）+ 本地 token 统计兜底，Codex 是官方配额快照（来自其会话日志）
const usagePanel = {
  timer: null,
  fmtTok(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(n < 1e10 ? 1 : 0) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(n < 1e7 ? 1 : 0) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
    return String(n);
  },
  fmtReset(sec) {
    if (!sec) return '';
    const d = new Date(sec * 1000);
    const sameDay = d.toDateString() === new Date().toDateString();
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return (sameDay ? '' : '周' + '日一二三四五六'[d.getDay()] + ' ') + hm + ' 重置';
  },
  ago(ms) {
    const m = Math.round((Date.now() - ms) / 60000);
    if (m < 2) return '刚刚';
    if (m < 60) return m + ' 分钟前';
    if (m < 1440) return Math.round(m / 60) + ' 小时前';
    return Math.round(m / 1440) + ' 天前';
  },
  bar(label, pct, extra) {
    const v = Math.max(0, Math.min(100, Math.round(pct)));
    const danger = v >= 85 ? ' danger' : '';
    return `<div class="usage-row"><span class="usage-label">${label}</span>
      <span class="usage-bar"><i class="${danger.trim()}" style="width:${v}%"></i></span>
      <span class="usage-num${danger}">${v}%</span></div>
      ${extra ? `<div class="usage-sub">${extra}</div>` : ''}`;
  },
  render(d) {
    const box = $('#usage-body');
    if (!d || !d.ok) { box.innerHTML = '<div class="usage-sub">读取失败</div>'; return; }
    let h = '';
    if (d.codex) {
      const c = d.codex;
      h += `<div class="usage-agent">Codex${c.planType ? ` <i class="usage-plan">${escapeHtml(c.planType)}</i>` : ''}</div>`;
      if (c.primary) h += this.bar('5h 窗口', c.primary.usedPercent, c.primary.stale ? '窗口已重置，跑一次 Codex 才有新数' : '');
      if (c.secondary) h += this.bar('周配额', c.secondary.usedPercent, c.secondary.stale ? '窗口已重置，跑一次 Codex 才有新数' : this.fmtReset(c.secondary.resetsAt));
      h += `<div class="usage-sub">快照：${this.ago(c.capturedAt)}的 Codex 会话</div>`;
    }
    if (d.claude) {
      const c = d.claude;
      h += `<div class="usage-agent">Claude Code</div>`;
      if (c.official) {
        // 官方限额窗口（和 Claude Code /usage 面板同源）：5h 滚动窗口 + 周配额，优先展示
        if (c.official.fiveHour) h += this.bar('5h 窗口', c.official.fiveHour.usedPercent, this.fmtReset(c.official.fiveHour.resetsAt));
        if (c.official.sevenDay) h += this.bar('周配额', c.official.sevenDay.usedPercent, this.fmtReset(c.official.sevenDay.resetsAt));
      }
      if (c.last5h) {
        // 本地 token 统计照常保留（拿不到官方数据时就只剩这块）
        h += `<div class="usage-trio">
          <span><b>${this.fmtTok(c.last5h.total)}</b>近5h</span>
          <span><b>${this.fmtTok(c.today.total)}</b>今日</span>
          <span><b>${this.fmtTok(c.week.total)}</b>本周</span>
        </div>
        <div class="usage-sub">token 总量 · 本地会话日志统计</div>`;
      }
    }
    if (!d.codex && !d.claude) h = '<div class="usage-sub">没找到 Claude Code / Codex 的本机会话记录</div>';
    box.innerHTML = h;
  },
  async refresh() {
    try { this.render(await api('/api/agent-usage')); }
    catch { this.render(null); }
  },
  open() { return localStorage.getItem('fb_usage_open') === '1'; },
  apply() {
    const on = this.open();
    $('#usage-body').classList.toggle('hidden', !on);
    $('#usage-arrow').textContent = on ? '▾' : '▸';
    clearInterval(this.timer); this.timer = null;
    if (on) { this.refresh(); this.timer = setInterval(() => this.refresh(), 60000); }
  },
  bind() {
    $('#usage-toggle').onclick = () => {
      localStorage.setItem('fb_usage_open', this.open() ? '0' : '1');
      this.apply();
    };
    this.apply();
  },
};

// ---------- Skills 透视（主区全屏视图）----------
const skillsView = {
  data: null, filter: 'all', sort: 'hits', open: new Set(),
  async show() {
    state.skillsMode = true; state.recentMode = false; state.virtualMode = null; state.cursor = -1;
    renderSidebarActive();
    renderBreadcrumb();
    $('#file-area').innerHTML = '<div class="cmdk-loading">扫描本机 skills…</div>';
    try { this.data = await api('/api/skills'); } catch { $('#file-area').innerHTML = '<div class="nav-empty">扫描失败</div>'; return; }
    this.render();
  },
  async reload() {
    try { this.data = await api('/api/skills'); if (state.skillsMode) this.render(); } catch { /* */ }
  },
  srcTag(it) {
    const cls = { claude: '', codex: ' codex', agents: ' codex', plugin: ' plugin', project: ' proj' }[it.source] || '';
    return `<span class="sk-src${cls}">${escapeHtml(it.label)}</span>`;
  },
  ago(t) {
    if (!t) return '—';
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 60) return m < 2 ? '刚刚' : m + ' 分钟前';
    if (m < 1440) return Math.round(m / 60) + ' 小时前';
    return Math.round(m / 1440) + ' 天前';
  },
  rows() {
    let arr = (this.data.items || []).slice();
    const f = this.filter;
    if (f === 'dup') arr = arr.filter((x) => x.copies);
    else if (f === 'bad') arr = arr.filter((x) => x.issues.length);
    else if (f === 'project') arr = arr.filter((x) => x.source === 'project');
    else if (f === 'codex') arr = arr.filter((x) => x.source === 'codex' || x.source === 'agents');
    else if (f !== 'all') arr = arr.filter((x) => x.source === f);
    const ho = (x) => (x.residue || x.issues.length ? 0 : x.disabled ? 1 : 2);
    if (this.sort === 'hits') arr.sort((a, b) => b.hits - a.hits || b.last - a.last || a.name.localeCompare(b.name));
    if (this.sort === 'recent') arr.sort((a, b) => b.last - a.last || b.hits - a.hits);
    if (this.sort === 'health') arr.sort((a, b) => ho(a) - ho(b) || b.hits - a.hits);
    if (this.sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  },
  render() {
    const o = this.data.overview;
    const items = this.data.items || [];
    const cnt = (fn) => items.filter(fn).length;
    const over = o.budgetChars > o.budgetLimit;
    const ratio = (o.budgetChars / o.budgetLimit).toFixed(1);
    let h = `<div class="sk-wrap">
      <div class="sk-stats">
        <div class="sk-stat"><div class="sk-num">${o.unique}<small>/${o.total}</small></div><div class="sk-lbl">全部 skills</div><div class="sk-note">唯一 / 含跨端副本</div></div>
        <div class="sk-stat"><div class="sk-num good">${o.active}</div><div class="sk-lbl">45 天内活跃</div><div class="sk-note">共 ${o.totalHits} 次触发</div></div>
        <div class="sk-stat dust"><div class="sk-num">${o.dust}</div><div class="sk-lbl">在吃灰</div><div class="sk-note">45 天零触发</div></div>
        <div class="sk-stat ${o.issues ? 'alert' : ''}"><div class="sk-num">${o.issues}</div><div class="sk-lbl">有问题</div><div class="sk-note">截断 / 缺 frontmatter / 残留</div></div>
        <div class="sk-budget">
          <div class="sk-lbl" style="display:flex;justify-content:space-between"><span>Claude 常驻预算（描述总量）</span>${over ? `<b class="bad-t">≈超限 ${ratio}×</b>` : ''}</div>
          <div class="sk-bar"><i style="width:${Math.min(100, o.budgetChars / o.budgetLimit * 41)}%"></i><em></em></div>
          <div class="sk-cap"><span>${o.budgetChars.toLocaleString()} 字符 / 预算约 ${o.budgetLimit.toLocaleString()}（估算）</span><span>${over ? '超出部分被静默丢弃，对应 skill 不会触发' : ''}</span></div>
        </div>
      </div>
      <div class="sk-tools">
        <div class="sk-chips">
          ${[['all', '全部', items.length],
             ['claude', 'Claude 全局', cnt((x) => x.source === 'claude')],
             ['project', '项目', cnt((x) => x.source === 'project')],
             ['plugin', '插件', cnt((x) => x.source === 'plugin')],
             ['codex', 'Codex', cnt((x) => x.source === 'codex' || x.source === 'agents')],
             ['dup', '跨端重复', cnt((x) => x.copies)],
             ['bad', '仅看问题', o.issues]]
            .map(([k, lbl, n]) => `<button class="sk-chip ${this.filter === k ? 'on' : ''}" data-f="${k}">${lbl} <i>${n}</i></button>`).join('')}
        </div>
        <select class="sk-sort" id="sk-sort">
          <option value="hits" ${this.sort === 'hits' ? 'selected' : ''}>按触发次数</option>
          <option value="recent" ${this.sort === 'recent' ? 'selected' : ''}>按最后触发</option>
          <option value="health" ${this.sort === 'health' ? 'selected' : ''}>按健康度</option>
          <option value="name" ${this.sort === 'name' ? 'selected' : ''}>按名称</option>
        </select>
      </div>
      <div class="sk-thead"><span></span><span>Skill</span><span>来源</span><span class="r">45 天触发</span><span class="r">最后触发</span><span class="r">启用</span><span></span></div>`;
    let dustMarked = false;
    this.rows().forEach((it) => {
      if (this.sort === 'hits' && this.filter === 'all' && !dustMarked && it.hits === 0) {
        h += `<div class="sk-mark">以下 ${o.dust} 个 45 天零触发——启用中的描述仍在每次会话占用预算</div>`;
        dustMarked = true;
      }
      const key = it.dir;
      const dot = it.issues.length ? (it.residue || it.issues.some((s) => s.includes('缺')) ? 'bad' : 'warn') : 'ok';
      h += `<div class="sk-row ${this.open.has(key) ? 'expanded' : ''} ${it.disabled ? 'off' : ''}" data-dir="${escapeHtml(key)}" draggable="true">
        <span class="sk-dot ${dot}"></span>
        <div class="sk-name">
          <div class="nm">${escapeHtml(it.name)}${it.copies ? ` <i class="sk-dup">${it.copies.length} 处副本</i>` : ''}${it.disabled ? ' <i class="sk-offtag">已停用</i>' : ''}</div>
          <div class="ds">${escapeHtml(it.issues[0] || it.desc || '')}</div>
        </div>
        ${this.srcTag(it)}
        <div class="sk-hits ${it.hits ? '' : 'zero'}">${it.hits || '· 0 ·'}</div>
        <div class="sk-last">${this.ago(it.last)}</div>
        ${it.residue
          ? '<div class="sk-last r">残留</div>'
          : `<label class="sk-switch ${it.disabled ? '' : 'on'}" data-act="toggle" title="${it.disabled ? '启用（移回 skills 目录）' : '停用（移入 _disabled/，不删文件，立即对模型不可见）'}"><i></i></label>`}
        <span class="sk-chev">▸</span>
      </div>`;
      if (this.open.has(key)) {
        const cut = this.data.overview.descCut;
        h += `<div class="sk-detail">
          <div>
            <div class="fd">${escapeHtml(it.desc || '（无 description）')}${it.descLen > 240 ? '…' : ''}</div>
            ${it.descLen > cut ? `<div class="fd-cut">⚠ description 共 ${it.descLen.toLocaleString()} 字符，第 ${cut.toLocaleString()} 字符之后模型看不见——靠后段触发词的场景不会触发</div>` : ''}
            ${it.issues.map((s) => `<div class="fd-cut">⚠ ${escapeHtml(s)}</div>`).join('')}
            <div class="fd-acts">
              ${it.residue ? '' : '<button data-act="invoke" class="primary">▶ 终端调用</button>'}
              <button data-act="reveal">在文件区显示</button>
              ${it.residue ? '' : '<button data-act="edit">编辑 SKILL.md</button>'}
              <button data-act="trash" class="danger">移到废纸篓</button>
            </div>
          </div>
          <dl class="fd-meta">
            <dt>描述体积</dt><dd>${it.descLen.toLocaleString()} 字符${it.descLen > cut ? ' · 超截断线' : ''}</dd>
            <dt>路径</dt><dd class="mono">${escapeHtml(tilde(it.dir))}</dd>
            ${it.copies ? `<dt>全部副本</dt><dd class="mono">${it.copies.map(escapeHtml).join('<br>')}</dd>` : ''}
          </dl>
        </div>`;
      }
    });
    h += '</div>';
    const area = $('#file-area');
    area.innerHTML = h;
    this.bind(area);
  },
  bind(area) {
    area.querySelector('.sk-chips').onclick = (e) => {
      const c = e.target.closest('.sk-chip'); if (!c) return;
      this.filter = c.dataset.f; this.render();
    };
    area.querySelector('#sk-sort').onchange = (e) => { this.sort = e.target.value; this.render(); };
    area.querySelector('.sk-wrap').addEventListener('click', async (e) => {
      const row = e.target.closest('.sk-row');
      const detail = e.target.closest('.sk-detail');
      const act = e.target.closest('[data-act]');
      const dir = row ? row.dataset.dir : detail ? detail.previousElementSibling.dataset.dir : null;
      if (!dir) return;
      const it = this.data.items.find((x) => x.dir === dir);
      if (act && it) {
        e.stopPropagation();
        if (act.dataset.act === 'toggle') {
          const r = await apiPost('/api/skills/toggle', { dir, enable: it.disabled });
          if (r.ok) { toast(it.disabled ? '已启用 ' + it.name : '已停用 ' + it.name + '（文件还在，随时可启用）'); this.reload(); }
          else toast('操作失败：' + (r.error || ''), true);
        } else if (act.dataset.act === 'invoke') {
          invokeSkillInTerm(it.name);
        } else if (act.dataset.act === 'reveal') {
          navigate(dirOf(it.dir));
        } else if (act.dataset.act === 'edit') {
          await navigate(it.dir);
          const e2 = state.entries.find((x) => x.name === 'SKILL.md');
          if (e2) { state.selected = e2.path; openPreview(e2); renderFiles(); }
        } else if (act.dataset.act === 'trash') {
          const ok = await confirmDialog(`把「${it.name}」移到废纸篓？（系统废纸篓里随时可恢复）`);
          if (!ok) return;
          const r = await apiPost('/api/skills/trash', { dir });
          if (r.ok) { toast('已移到废纸篓'); this.open.delete(dir); this.reload(); }
          else toast('删除失败：' + (r.error || ''), true);
        }
        return;
      }
      if (row) { this.open.has(dir) ? this.open.delete(dir) : this.open.add(dir); this.render(); }
    });
    // 拖 skill 行 → 终端：带 skill 名专用类型；text/plain 给外部目标
    area.querySelectorAll('.sk-row').forEach((r) => {
      r.addEventListener('dragstart', (ev) => {
        const it = this.data.items.find((x) => x.dir === r.dataset.dir);
        if (!it) return;
        ev.dataTransfer.setData('application/x-fanbox-skill', it.name);
        ev.dataTransfer.setData('text/plain', '/' + it.name);
        ev.dataTransfer.effectAllowed = 'copy';
      });
    });
  },
};

// 把 skill 注入当前终端：claude 会话用 /name，codex 会话用 $name；裸 shell 提示先启动 agent
async function invokeSkillInTerm(name) {
  if (typeof term === 'undefined' || !term.available()) { toast('需要桌面版的内嵌终端', true); return; }
  if ($('#terminal-panel').classList.contains('hidden')) term.open();
  const s = term.sessions.find((x) => x.id === term.active);
  if (!s || s.dead) { toast('先开一个终端并启动 agent', true); return; }
  let prefix = '/';
  try {
    const r = await window.fanboxPty.proc(s.id);
    const pn = String((r && r.proc) || '').split('/').pop().replace(/^-/, '').toLowerCase();
    if (pn.includes('codex')) prefix = '$';
    else if (['zsh', 'bash', 'fish', 'sh', 'dash', 'tcsh', 'nu'].includes(pn)) {
      toast('终端里还没启动 agent——先点 Claude / Codex 启动按钮', true);
      s.xterm.focus();
      return;
    }
  } catch { /* 判断不了就按 claude 的 / 语法 */ }
  term.input(s.id, prefix + name + ' ');
  s.xterm.focus();
  toast(`已注入 ${prefix}${name}，接着补一句话回车`);
}

// ---------- Monaco 编辑器（本地 vendor，离线可用；加载失败回退 textarea）----------
const mona = {
  editor: null, _p: null,
  themeFor: { terminal: 'fb-dark', warm: 'fb-paper', editorial: 'fb-editorial' },
  themeName() { return this.themeFor[state.theme] || 'fb-dark'; },
  // 散文类（md/txt/字幕）默认软换行，代码不换行
  wraps(ex) { return ['md', 'markdown', 'txt', 'log', 'srt', 'vtt', 'ass'].includes(ex); },
  lang(ex) {
    const m = {
      js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      json: 'json', json5: 'json', jsonc: 'json', md: 'markdown', markdown: 'markdown', html: 'html', htm: 'html', vue: 'html',
      css: 'css', scss: 'scss', less: 'less', py: 'python', go: 'go', rs: 'rust', java: 'java', rb: 'ruby', php: 'php',
      c: 'c', cpp: 'cpp', cc: 'cpp', h: 'cpp', hpp: 'cpp', cs: 'csharp', sh: 'shell', bash: 'shell', zsh: 'shell',
      yml: 'yaml', yaml: 'yaml', toml: 'ini', ini: 'ini', conf: 'ini', xml: 'xml', sql: 'sql', swift: 'swift', lua: 'lua', kt: 'kotlin', dart: 'dart', r: 'r',
    };
    return m[ex] || 'plaintext';
  },
  load() {
    if (this._p) return this._p;
    if (window.__noMonaco) return Promise.resolve(null);
    this._p = new Promise((resolve) => {
      if (window.monaco) { resolve(window.monaco); return; }
      // 语言服务 worker 走 blob 代理（同源），无 worker 也能用基础高亮
      window.MonacoEnvironment = {
        getWorkerUrl() {
          return URL.createObjectURL(new Blob([
            `self.MonacoEnvironment={baseUrl:'${location.origin}/vendor/monaco/'};importScripts('${location.origin}/vendor/monaco/vs/base/worker/workerMain.js');`,
          ], { type: 'text/javascript' }));
        },
      };
      const s = document.createElement('script');
      s.src = '/vendor/monaco/vs/loader.js';
      s.onload = () => {
        try {
          window.require.config({ paths: { vs: '/vendor/monaco/vs' } });
          window.require(['vs/editor/editor.main'], () => { this.defineThemes(window.monaco); resolve(window.monaco); }, () => resolve(null));
        } catch { resolve(null); }
      };
      s.onerror = () => { window.__noMonaco = 1; resolve(null); };
      document.head.appendChild(s);
    });
    return this._p;
  },
  // 三皮肤各配一套编辑器配色，和文件区、终端区同呼吸
  defineThemes(m) {
    m.editor.defineTheme('fb-dark', { base: 'vs-dark', inherit: true, rules: [], colors: { 'editor.background': '#0b0c0a', 'editor.foreground': '#d6dac9', 'editorLineNumber.foreground': '#4a4d42', 'editorCursor.foreground': '#cdf24b', 'editor.selectionBackground': '#cdf24b33', 'editor.lineHighlightBackground': '#ffffff08' } });
    m.editor.defineTheme('fb-paper', { base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#ece2d2', 'editor.foreground': '#4a3f30', 'editorLineNumber.foreground': '#b3a589', 'editorCursor.foreground': '#cc785c', 'editor.selectionBackground': '#cc785c33', 'editor.lineHighlightBackground': '#00000008' } });
    m.editor.defineTheme('fb-editorial', { base: 'vs', inherit: true, rules: [], colors: { 'editor.background': '#eae5d8', 'editor.foreground': '#1a1a1a', 'editorLineNumber.foreground': '#9a958a', 'editorCursor.foreground': '#ff433d', 'editor.selectionBackground': '#ff433d22', 'editor.lineHighlightBackground': '#00000008' } });
  },
  retheme() { if (this.editor && window.monaco) window.monaco.editor.setTheme(this.themeName()); },
  // 只读并排 diff：HEAD 版本 vs 工作区当前内容，复用 editor 槽位让 disposeIfAny 统一回收
  openDiff(host, original, modified, ex) {
    const monaco = window.monaco;
    const lang = this.lang(ex);
    const orig = monaco.editor.createModel(original || '', lang);
    const mod = monaco.editor.createModel(modified || '', lang);
    const de = monaco.editor.createDiffEditor(host, {
      theme: this.themeName(), readOnly: true, automaticLayout: true, renderSideBySide: true,
      fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace',
      fontSize: 12.5, lineHeight: 1.6, minimap: { enabled: false }, scrollBeyondLastLine: false,
    });
    de.setModel({ original: orig, modified: mod });
    this._models = [orig, mod];
    this.editor = de;
    return de;
  },
  disposeIfAny() {
    if (this.editor) { try { this.editor.dispose(); } catch { /* */ } this.editor = null; }
    if (this._models) { this._models.forEach((m) => { try { m.dispose(); } catch { /* */ } }); this._models = null; }
  },
};

// ---------- Milkdown Crepe（Notion 式所见即所得 Markdown；本地 vendor，离线可用）----------
const crepe = {
  editor: null, _p: null,
  load() {
    if (this._p) return this._p;
    if (window.__noCrepe) return Promise.resolve(null);
    this._p = new Promise((resolve) => {
      if (window.FanboxCrepe) { resolve(window.FanboxCrepe); return; }
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/vendor/milkdown/milkdown.css';
      document.head.appendChild(link);
      const s = document.createElement('script'); s.src = '/vendor/milkdown/milkdown.js';
      s.onload = () => resolve(window.FanboxCrepe || null);
      s.onerror = () => { window.__noCrepe = 1; resolve(null); };
      document.head.appendChild(s);
    });
    return this._p;
  },
  disposeIfAny() { if (this.editor) { try { this.editor.destroy(); } catch { /* */ } this.editor = null; } },
};

// ---------- 变更收件箱（本会话 agent 改了哪些文件，可回看 / 看 diff）----------
// 构建/依赖目录 + macOS 系统噪声目录（Library/缓存/废纸篓 后台无时无刻在写，不是 agent 干活，必须过滤）
const CHANGE_IGNORE = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.cache', '.venv', 'venv', '__pycache__', '.DS_Store', 'target', '.turbo', '.expo', 'Library', 'Caches', '.Trash', 'CloudStorage', '.cocoapods', 'DerivedData', 'AppData', '$RECYCLE.BIN', 'System Volume Information']);
// 这次变更是不是该被忽略的系统/构建噪声（高亮、刷新、收件箱共用一套判断）
function isNoisyChange(filename) {
  const segs = String(filename).split(/[\\/]/);
  if (segs.some((s) => CHANGE_IGNORE.has(s))) return true;
  const name = segs[segs.length - 1];
  return !name || name === '.DS_Store' || name === 'Thumbs.db' || name === 'desktop.ini' || name.startsWith('NTUSER.')
    || name.endsWith('~') || name.endsWith('.swp') || name.startsWith('.com.apple.');
}
function recordChange(dir, filename) {
  if (isNoisyChange(filename)) return; // 过滤构建/依赖/系统噪声
  const segs = filename.split(/[\\/]/);
  const name = segs[segs.length - 1];
  const full = dir.replace(/[\\/]+$/, '') + state.sep + filename;
  const now = Date.now();
  state.changeTimeline.push({ path: full, name, ts: now }); // 每次写入都记一笔，供会话回放
  if (state.changeTimeline.length > 3000) state.changeTimeline.shift();
  const existing = state.changeLog.find((c) => c.path === full);
  if (existing) { existing.ts = now; existing.count++; }
  else state.changeLog.unshift({ path: full, name, dir, ts: now, count: 1 });
  // 最新置顶；已存在的移到队首
  state.changeLog.sort((a, b) => b.ts - a.ts);
  if (state.changeLog.length > 100) state.changeLog.length = 100;
  renderChangesBadge();
}
function renderChangesBadge() {
  const b = $('#changes-badge'); if (!b) return;
  b.classList.toggle('hidden', state.changeLog.length === 0);
}
function fmtClock(ms) { const d = new Date(ms); const p = (x) => String(x).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }
function toggleChangesPanel() {
  const existing = $('#changes-pop');
  if (existing) { existing.remove(); return; }
  const pop = document.createElement('div');
  pop.id = 'changes-pop';
  pop.className = 'changes-pop';
  if (!state.changeLog.length) {
    pop.innerHTML = '<div class="cp-head">本会话变更</div><div class="cp-empty">还没有捕捉到文件变更。<br>跑起 agent，它改的文件会实时出现在这里。</div>';
  } else {
    const rows = state.changeLog.slice(0, 60).map((c) => {
      const inRepoHint = '';
      return `<div class="cp-row" data-path="${escapeHtml(c.path)}">
        <span class="cp-name">${escapeHtml(c.name)}${c.count > 1 ? ` <em>×${c.count}</em>` : ''}</span>
        <span class="cp-dir">${escapeHtml(c.dir.replace(state.home, '~'))}</span>
        <span class="cp-time">${fmtClock(c.ts)}</span>
      </div>`;
    }).join('');
    pop.innerHTML = `<div class="cp-head">本会话变更 · ${state.changeLog.length}<span class="cp-head-btns"><button id="cp-replay" class="ghost-btn">▶ 回放</button><button id="cp-clear" class="ghost-btn">清空</button></span></div><div class="cp-list">${rows}</div>`;
  }
  document.body.appendChild(pop);
  const btn = $('#btn-changes'); const r = btn.getBoundingClientRect();
  pop.style.top = (r.bottom + 6) + 'px';
  pop.style.right = (window.innerWidth - r.right) + 'px';
  const clear = $('#cp-clear'); if (clear) clear.onclick = (ev) => { ev.stopPropagation(); state.changeLog = []; state.changeTimeline = []; renderChangesBadge(); pop.remove(); };
  const rep = $('#cp-replay'); if (rep) rep.onclick = (ev) => { ev.stopPropagation(); pop.remove(); openReplay(); };
  pop.querySelectorAll('.cp-row').forEach((row) => {
    row.onclick = async () => {
      const p = row.dataset.path;
      pop.remove();
      await navigate(dirOf(p));
      const e = state.entries.find((x) => x.path === p) || { path: p, name: baseOf(p), kind: kindFromName(p), isDir: false };
      applySelection(p); openPreview(e); recordRecent(p);
    };
  });
  // 点其它地方关闭
  setTimeout(() => {
    const close = (ev) => { if (!ev.target.closest('#changes-pop') && !ev.target.closest('#btn-changes')) { pop.remove(); document.removeEventListener('click', close); } };
    document.addEventListener('click', close);
  }, 0);
}
// WOW2 会话回放：像刷视频一样拖时间轴，重现这段时间 agent 一步步改了哪些文件
function openReplay() {
  const tl = state.changeTimeline.slice();
  if (tl.length < 2) { toast('变更太少，先让 agent 多改几下再回放', true); return; }
  const t0 = tl[0].ts, t1 = tl[tl.length - 1].ts;
  const span = Math.max(1000, t1 - t0);
  const ov = document.createElement('div');
  ov.className = 'replay-ov';
  ov.innerHTML =
    `<div class="replay-panel">
      <div class="replay-head"><span>会话回放 · ${tl.length} 次写入 · 跨 ${fmtDur(span)}</span><button class="replay-close ghost-btn">关闭 (Esc)</button></div>
      <div class="replay-now"><span class="rn-label">此刻 agent 正在改</span><span class="rn-file" id="replay-now">—</span></div>
      <div class="replay-track" id="replay-track"><div class="replay-fill" id="replay-fill"></div><div class="replay-playhead" id="replay-playhead"></div></div>
      <div class="replay-ctl"><button id="replay-play" class="primary">▶ 播放</button><input type="range" id="replay-range" min="0" max="1000" value="1000"><span id="replay-count" class="replay-count"></span></div>
      <div class="replay-list" id="replay-list"></div>
    </div>`;
  document.body.appendChild(ov);
  const track = ov.querySelector('#replay-track');
  tl.forEach((e) => { const t = document.createElement('i'); t.className = 'replay-tick'; t.style.left = ((e.ts - t0) / span * 100) + '%'; track.appendChild(t); });
  const range = ov.querySelector('#replay-range');
  const playBtn = ov.querySelector('#replay-play');
  let raf = null, playing = false, startWall = 0, startFrac = 0;
  const DURATION = Math.min(20000, Math.max(6000, span / 3)); // 把真实时长压缩到 6–20 秒
  const render = (frac) => {
    const at = t0 + span * frac;
    let lastIdx = -1;
    for (let i = 0; i < tl.length; i++) { if (tl[i].ts <= at) lastIdx = i; else break; }
    const done = lastIdx + 1;
    ov.querySelector('#replay-fill').style.width = (frac * 100) + '%';
    ov.querySelector('#replay-playhead').style.left = (frac * 100) + '%';
    ov.querySelector('#replay-now').textContent = lastIdx >= 0 ? tl[lastIdx].name : '—';
    ov.querySelector('#replay-count').textContent = `${done}/${tl.length}`;
    const recent = tl.slice(Math.max(0, lastIdx - 5), lastIdx + 1).reverse();
    ov.querySelector('#replay-list').innerHTML = recent.map((e, i) => `<div class="rl-row${i === 0 ? ' rl-now' : ''}"><span>${escapeHtml(e.name)}</span><span class="rl-t">${fmtClock(e.ts)}</span></div>`).join('');
  };
  const stop = () => { playing = false; if (raf) cancelAnimationFrame(raf); raf = null; playBtn.textContent = '▶ 播放'; };
  const step = () => {
    const elapsed = perfNow() - startWall;
    let frac = startFrac + elapsed / DURATION;
    if (frac >= 1) { frac = 1; render(frac); range.value = 1000; stop(); playBtn.textContent = '↻ 重播'; return; }
    range.value = String(Math.round(frac * 1000));
    render(frac);
    raf = requestAnimationFrame(step);
  };
  playBtn.onclick = () => {
    if (playing) { stop(); return; }
    let frac = Number(range.value) / 1000; if (frac >= 1) frac = 0;
    startFrac = frac; startWall = perfNow(); playing = true; playBtn.textContent = '⏸ 暂停';
    raf = requestAnimationFrame(step);
  };
  range.oninput = () => { stop(); render(Number(range.value) / 1000); };
  const close = () => { stop(); ov.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  ov.querySelector('.replay-close').onclick = close;
  ov.onclick = (e) => { if (e.target === ov) close(); };
  render(1); // 默认停在最终态
}
function fmtDur(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return s + ' 秒';
  const m = Math.round(s / 60);
  return m < 60 ? m + ' 分钟' : (m / 60).toFixed(1) + ' 小时';
}
function perfNow() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
// 从文件名粗判类型（变更项可能不在当前 entries 里）
function kindFromName(p) {
  const e = (p.split('.').pop() || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'heic', 'heif', 'tiff', 'tif'].includes(e)) return 'image';
  if (['mp4', 'webm', 'mov', 'm4v'].includes(e)) return 'video';
  if (e === 'pdf') return 'pdf';
  return 'text';
}

// WOW4 环境感知：完成时文件区荡开一圈大涟漪 + 极轻提示音（Web Audio 当场合成，无需音频文件）
function rippleFileArea() {
  const host = $('#content') || $('#file-area');
  if (!host) return;
  const rect = host.getBoundingClientRect();
  const r = document.createElement('div');
  r.className = 'area-ripple';
  r.style.left = (rect.left + rect.width / 2) + 'px';
  r.style.top = (rect.top + rect.height / 2) + 'px';
  document.body.appendChild(r);
  r.addEventListener('animationend', () => r.remove(), { once: true });
  setTimeout(() => r.remove(), 1400);
}
let _audioCtx = null;
function playChime(type) {
  if (state.muted) return;
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx; const now = ctx.currentTime;
    const notes = type === 'done' ? [659.25, 987.77] : [523.25]; // 完成是 E5→B5 上行小叮，其它单音
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      o.connect(g); g.connect(ctx.destination);
      const t = now + i * 0.11;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.start(t); o.stop(t + 0.45);
    });
  } catch { /* 音频不可用就算了 */ }
}

// WOW1 活的仪表盘：每次写入，让对应文件卡片当场荡开涟漪 + 弹一下 + 按热度发光，agent 写到哪光走到哪
function igniteCard(top, count) {
  const area = $('#file-area');
  if (!area || !state.cwd) return;
  const path = state.cwd.replace(/\/$/, '') + state.sep + top;
  const el = area.querySelector(`[data-path="${CSS.escape(path)}"]`);
  if (!el) return; // 卡片还没渲染（新文件首次出现），等 refresh 后由 renderFiles 接管发光
  el.style.setProperty('--heat', Math.min(1, 0.4 + count * 0.12).toFixed(2));
  el.classList.remove('live-edit'); void el.offsetWidth; el.classList.add('live-edit'); // 重新触发弹跳
  const host = el.querySelector('.icon') || el;
  const ripple = document.createElement('span');
  ripple.className = 'edit-ripple';
  host.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

// pty 数据回流（全局一次）
if (window.fanboxPty) {
  window.fanboxPty.onData(({ id, data }) => { const s = term.sessions.find((x) => x.id === id); if (s) { s.xterm.write(data); term.markBusy(s); } });
  window.fanboxPty.onExit(({ id }) => {
    const s = term.sessions.find((x) => x.id === id);
    if (s) {
      s.dead = true; s.status = 'dead';
      s.xterm.write('\r\n\x1b[90m[进程已退出 — 回车重开，或 ✕ 关闭]\x1b[0m\r\n');
      term.renderTabs();
      term.notify(s, '终端已退出', (s.title || 'shell') + ' 的进程结束了');
    }
  });
}
// 文件变化 → 自动刷新列表（看着 agent 干活）；编辑中不动预览，避免吞掉未保存内容
if (window.fanboxFs) {
  let rt = null;
  state.changed = new Map(); // 顶层名 → { count, files:Set, ts }
  let sweep = null;
  const scheduleSweep = () => {
    if (sweep) return;
    sweep = setInterval(() => {
      const now = Date.now(); let dirty = false;
      for (const [k, v] of state.changed) { if (now - v.ts > 4500) { state.changed.delete(k); dirty = true; } }
      if (!state.changed.size) { clearInterval(sweep); sweep = null; }
      if (dirty) renderFiles();
    }, 1000); // 单一清理定时器，避免大批量变更时堆积成千上万个 timer
  };
  window.fanboxFs.onChanged(({ dir, filename }) => {
    // 系统/构建噪声（~/Library 缓存、node_modules 等 macOS 后台不停写）直接丢弃：
    // 既不点亮卡片、不进收件箱，也不触发列表刷新——否则 Library 会永远显示「被修改」
    if (filename && isNoisyChange(filename)) return;
    // 记进会话级收件箱（跨所有监听目录，不止当前目录），供「变更」面板回看
    if (filename) recordChange(dir, String(filename));
    if (dir !== state.cwd || state.recentMode) return;
    // 高亮被 agent 改动的项：递归监听下 src/foo.js 归到顶层 src，并累计计数 + 记子路径供 tooltip 定位
    if (filename) {
      const sub = String(filename);
      const top = sub.split('/')[0];
      let rec = state.changed.get(top);
      if (!rec) { rec = { count: 0, files: new Set(), ts: 0 }; state.changed.set(top, rec); }
      rec.count++; rec.ts = Date.now();
      if (rec.files.size < 8 && sub !== top) rec.files.add(sub);
      scheduleSweep();
      igniteCard(top, rec.count); // 当场点亮这张卡（不等 250ms 刷新）
    }
    clearTimeout(rt);
    rt = setTimeout(async () => {
      await refresh();
      if (state.selected && !$('#preview').classList.contains('hidden') && !$('#ed-host') && !imgEditState) {
        const e = state.entries.find((x) => x.path === state.selected);
        if (e && (e.kind === 'text' || e.kind === 'image')) openPreview(e);
      }
    }, 250);
  });
}

// ---------- AI 对话面板 ----------
// 终端的「无门槛替身」：右侧 dock 在 对话/终端 两种模式间切换。
// 对话模式走 /api/ai/* 后端（多家模型 + 文件工具 agent 循环），网页版没有内嵌终端时也可用。
function setDockMode(mode) {
  const panel = $('#terminal-panel');
  const isChat = mode === 'chat';
  panel.classList.toggle('chat-mode', isChat);
  $('#mode-chat').classList.toggle('on', isChat);
  $('#mode-term').classList.toggle('on', !isChat);
  localStorage.setItem('fb_dock_mode', mode);
  if (isChat) setTimeout(() => $('#chat-input').focus(), 60);
  else term.fitActive();
}

// Claude Code 引擎的工具集 → 给非技术用户看的中文标签
const AI_TOOL_LABEL = {
  Read: '读取文件', Write: '写入文件', Edit: '修改文件', MultiEdit: '批量修改',
  Bash: '执行命令', Glob: '查找文件', Grep: '搜索内容', WebSearch: '联网搜索',
  WebFetch: '抓取网页', Task: '派出子任务', TodoWrite: '整理待办', NotebookEdit: '编辑笔记本',
};
function aiToolDetail(name, args) {
  const a = args || {};
  return String(a.file_path || a.path || a.command || a.pattern || a.query || a.url || a.description || a.prompt || '').slice(0, 140);
}
function aiApprovalDetail(name, args) {
  const a = args || {};
  if (name === 'Write') return `${a.file_path || ''}\n────────\n${String(a.content || '').slice(0, 800)}${String(a.content || '').length > 800 ? '\n…' : ''}`;
  if (name === 'Edit' || name === 'MultiEdit') return `${a.file_path || ''}\n────────\n替换：${String(a.old_string || '(批量)').slice(0, 300)}\n改为：${String(a.new_string || '').slice(0, 300)}`;
  if (name === 'Bash') return a.command || '';
  return JSON.stringify(a).slice(0, 500);
}

// ---------- 任务模板：把高频场景封装成「卡片 + 填空」，员工不用写提示词 ----------
// 模板是数据：~/.fanbox/templates.json（管理员自定义）> 内置 templates.default.json
const tpl = {
  data: null,
  dept: localStorage.getItem('fb_tpl_dept') || '通用',
  async load() {
    if (this.data) return this.data;
    try { this.data = await api('/api/ai/templates'); } catch { this.data = { templates: [] }; }
    return this.data;
  },
  clear() { const el = $('#tpl-area'); if (el) el.remove(); },
  async showPicker() {
    await this.load();
    this.clear();
    if (!this.data.templates || !this.data.templates.length) return;
    const box = document.createElement('div');
    box.id = 'tpl-area';
    $('#chat-msgs').appendChild(box);
    this.renderPicker(box);
  },
  renderPicker(box) {
    const has = (d) => this.data.templates.some((t) => t.dept === d);
    const depts = ['全部', ...(this.data.departments || []).filter(has)];
    if (!depts.includes(this.dept)) this.dept = depts[1] || '全部';
    // 选部门 = 该部门专属 + 通用（员工视角两类都用得上）；选「全部」看全部
    const list = this.data.templates.filter((t) => this.dept === '全部' || t.dept === this.dept || t.dept === '通用');
    box.innerHTML = '<div class="tpl-head">任务模板 <span class="tpl-sub">选卡片 → 拖文件 → 填一两句 → 开工</span></div>';
    const chips = document.createElement('div');
    chips.className = 'tpl-chips';
    depts.forEach((d) => {
      const b = document.createElement('button');
      b.className = 'tpl-chip' + (d === this.dept ? ' on' : '');
      b.textContent = d;
      b.onclick = () => { this.dept = d; localStorage.setItem('fb_tpl_dept', d); this.renderPicker(box); };
      chips.appendChild(b);
    });
    box.appendChild(chips);
    const grid = document.createElement('div');
    grid.className = 'tpl-grid';
    list.forEach((t) => {
      const c = document.createElement('button');
      c.className = 'tpl-card';
      c.innerHTML = `<span class="tpl-ico">${t.icon || '📋'}</span><span class="tpl-t">${escapeHtml(t.title)}</span><span class="tpl-d">${escapeHtml(t.desc || '')}</span>`;
      c.onclick = () => this.renderRunner(box, t);
      grid.appendChild(c);
    });
    box.appendChild(grid);
    chat.scroll();
  },
  renderRunner(box, t) {
    box.innerHTML = `<div class="tpl-head"><button class="tpl-back">← 返回</button><b>${t.icon || ''} ${escapeHtml(t.title)}</b> <span class="tpl-sub">${escapeHtml(t.desc || '')}</span></div>`;
    box.querySelector('.tpl-back').onclick = () => this.renderPicker(box);
    const form = document.createElement('div');
    form.className = 'tpl-form';
    if (t.needsFiles || t.filesHint) {
      const fh = document.createElement('div');
      fh.className = 'tpl-files';
      fh.textContent = `📎 ${t.filesHint || '把相关文件拖进对话区作为附件'}${t.needsFiles ? '（必需）' : '（可选）'}`;
      form.appendChild(fh);
    }
    const inputs = {};
    (t.fields || []).forEach((f) => {
      const lab = document.createElement('label');
      lab.className = 'tpl-field';
      lab.innerHTML = `<span>${escapeHtml(f.label)}${f.optional ? '' : ' *'}</span>`;
      const inp = document.createElement('input');
      inp.placeholder = f.placeholder || '';
      inputs[f.key] = inp;
      lab.appendChild(inp);
      form.appendChild(lab);
    });
    const go = document.createElement('button');
    go.className = 'chat-send-btn tpl-go';
    go.textContent = '开始执行';
    go.onclick = () => this.run(t, inputs);
    form.appendChild(go);
    box.appendChild(form);
    chat.scroll();
  },
  run(t, inputs) {
    if (t.needsFiles && !chat.attachments.length) { toast('这个模板需要先把文件拖进对话区作为附件', true); return; }
    const vals = {};
    for (const f of (t.fields || [])) {
      const v = (inputs[f.key].value || '').trim();
      if (!v && !f.optional) { toast(`「${f.label}」需要填写`, true); inputs[f.key].focus(); return; }
      vals[f.key] = v;
    }
    const prompt = t.prompt.replace(/\{(\w+)\}/g, (m, k) => (vals[k] !== undefined ? (vals[k] || '无特别要求') : m));
    const filled = Object.values(vals).filter(Boolean);
    chat.send(prompt, `${t.icon || '📋'} ${t.title}${filled.length ? ' · ' + filled.join(' / ') : ''}`);
  },
};

const chat = {
  currentChat: null, // 当前会话 id（对应左侧列表项）；null = 下一句话开新会话
  chats: [],
  attachments: [],
  busy: false,
  open() {
    $('#terminal-panel').classList.remove('hidden');
    $('#terminal-resizer').classList.remove('hidden');
    term.applyDock();
    setDockMode('chat');
    localStorage.setItem('fb_term_open', '1');
    this.refreshModelLabel();
    this.loadChats();
    // 没在任何会话里时展示任务模板（卡片不打扰已有对话）
    if (!this.currentChat && !$('#tpl-area') && !$('#chat-msgs .chat-msg')) tpl.showPicker();
  },
  toggle() {
    const panel = $('#terminal-panel');
    const openAndChat = !panel.classList.contains('hidden') && panel.classList.contains('chat-mode');
    if (openAndChat) term.close(); else this.open();
  },
  scroll() { const m = $('#chat-msgs'); m.scrollTop = m.scrollHeight; },
  msgEl(cls) {
    const empty = $('#chat-empty'); if (empty) empty.classList.add('hidden');
    const d = document.createElement('div');
    d.className = 'chat-msg ' + cls;
    $('#chat-msgs').appendChild(d);
    this.scroll();
    return d;
  },
  addAttachment(p) {
    if (!p || this.attachments.includes(p)) return;
    this.attachments.push(p);
    this.renderChips();
  },
  renderChips() {
    const box = $('#chat-chips');
    box.classList.toggle('hidden', !this.attachments.length);
    box.innerHTML = '';
    this.attachments.forEach((p, i) => {
      const c = document.createElement('span');
      c.className = 'chat-chip';
      c.innerHTML = `📎 ${escapeHtml(baseOf(p))} <i title="移除">✕</i>`;
      c.title = p;
      c.querySelector('i').onclick = () => { this.attachments.splice(i, 1); this.renderChips(); };
      box.appendChild(c);
    });
  },
  async refreshModelLabel() {
    try {
      const r = await api('/api/ai/providers');
      const a = r.providers[r.active];
      $('#chat-model').textContent = a ? `${a.label} · ${a.model}${a.hasKey ? '' : '（未配 key）'}` : '';
    } catch { /* */ }
  },
  // ---------- 会话列表（左栏）----------
  async loadChats() {
    try { this.chats = (await api('/api/ai/chats')).chats || []; } catch { this.chats = []; }
    this.renderChatList();
  },
  renderChatList() {
    const list = $('#chat-list');
    list.innerHTML = '';
    for (const c of this.chats) {
      const row = document.createElement('div');
      const ap = this.hasPendingApproval(c.id);
      row.className = 'chat-item' + (c.id === this.currentChat ? ' sel' : '') + (this.isBusy(c.id) ? ' running' : '') + (ap ? ' approval' : '');
      row.innerHTML = `<span class="ci-title">${escapeHtml(c.title || '未命名')}${ap ? '<i class="ci-appr">待审批</i>' : ''}</span><span class="ci-sub">${escapeHtml(tilde(c.cwd || ''))}</span><button class="ci-del" title="删除会话">✕</button>`;
      row.onclick = () => this.openChat(c.id);
      row.querySelector('.ci-del').onclick = async (e) => {
        e.stopPropagation();
        await fetch('/api/ai/chat-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) }).catch(() => {});
        if (this.currentChat === c.id) this.newChat();
        this.loadChats();
      };
      list.appendChild(row);
    }
  },
  // 打开旧会话：回显引擎侧的历史消息，后续发言自动续聊（resume）
  // 多会话可并行：切换不受别的会话运行影响，发送/停止按钮只反映「当前这个会话」的状态
  async openChat(id) {
    this.currentChat = id;
    this.renderChatList();
    this.updateComposer();
    tpl.clear();
    const box = $('#chat-msgs');
    box.innerHTML = '';
    let r;
    try { r = await api(`/api/ai/chat-history?id=${encodeURIComponent(id)}`); } catch { r = { messages: [] }; }
    if (this.isBusy(id)) {
      const note = document.createElement('div');
      note.className = 'chat-empty';
      note.innerHTML = this.hasPendingApproval(id)
        ? '<p>需要你审批。这个会话已暂停在工具调用前。</p>'
        : '<p>⏳ 这个会话正在后台运行，完成后重新打开可看到本轮结果。</p>';
      box.appendChild(note);
      const pending = this.pendingApprovals.get(id);
      if (pending) pending.forEach((ev, approvalId) => this.appendApprovalCard(box, id, approvalId, ev));
    }
    if (!r.messages.length) {
      if (!this.isBusy(id)) box.innerHTML = '<div class="chat-empty"><p>已接上这个会话的上下文，直接继续说就行。</p></div>';
      return;
    }
    for (const m of r.messages) {
      if (m.role === 'user') { const u = this.msgEl('user'); u.textContent = m.text; }
      else if (m.role === 'assistant') {
        const a = this.msgEl('assistant');
        const md = document.createElement('div');
        md.className = 'md-body chat-md';
        md.innerHTML = window.marked && !window.__noMarked ? window.marked.parse(m.text) : escapeHtml(m.text);
        a.appendChild(md);
      } else if (m.role === 'tool') {
        const a = box.lastElementChild && box.lastElementChild.classList.contains('assistant') ? box.lastElementChild : this.msgEl('assistant');
        const line = document.createElement('div');
        line.className = 'chat-tool';
        line.innerHTML = `<span class="ct-ok">✓</span> ${AI_TOOL_LABEL[m.name] || escapeHtml(m.name)} <code>${escapeHtml(m.detail || '')}</code>`;
        a.appendChild(line);
      }
    }
    this.scroll();
  },
  newChat() {
    this.currentChat = null;
    this.renderChatList();
    this.updateComposer();
    $('#chat-msgs').innerHTML = '<div class="chat-empty"><p>新对话。这次对话会绑定当前浏览的目录：' + escapeHtml(tilde(state.cwd || '~')) + '</p></div>';
    tpl.showPicker();
    $('#chat-input').focus();
  },
  // 按会话记账的运行状态：每个会话各自有发送/停止态，多会话可并行、各停各的
  busyChats: new Set(),
  pendingApprovals: new Map(), // chatId -> Map(approvalId -> {name,args,ts})
  isBusy(id) { return this.busyChats.has(id || '__new__'); },
  hasPendingApproval(id) {
    const m = this.pendingApprovals.get(id || '__new__');
    return !!(m && m.size);
  },
  pendingApprovalCount() {
    let n = 0;
    this.pendingApprovals.forEach((m) => { n += m.size; });
    return n;
  },
  migrateChatState(from, to) {
    if (!from || !to || from === to) return;
    const ap = this.pendingApprovals.get(from);
    if (ap) {
      const dst = this.pendingApprovals.get(to) || new Map();
      ap.forEach((v, k) => dst.set(k, v));
      this.pendingApprovals.set(to, dst);
      this.pendingApprovals.delete(from);
    }
  },
  markApproval(chatId, approvalId, ev) {
    const key = chatId || '__new__';
    const m = this.pendingApprovals.get(key) || new Map();
    m.set(approvalId, { name: ev.name, args: ev.args, ts: Date.now() });
    this.pendingApprovals.set(key, m);
    const chatVisible = !$('#terminal-panel')?.classList.contains('hidden') && $('#terminal-panel')?.classList.contains('chat-mode');
    if (key !== (this.currentChat || '__new__') || !chatVisible) toast('后台对话需要你审批');
    this.renderChatList();
    this.updateAttention();
  },
  clearApproval(chatId, approvalId) {
    const key = chatId || '__new__';
    const m = this.pendingApprovals.get(key);
    if (!m) return;
    if (approvalId) m.delete(approvalId); else m.clear();
    if (!m.size) this.pendingApprovals.delete(key);
    this.renderChatList();
    this.updateAttention();
  },
  appendApprovalCard(parent, chatId, approvalId, ev) {
    const card = document.createElement('div');
    card.className = 'chat-approval';
    const detail = aiApprovalDetail(ev.name, ev.args);
    card.innerHTML =
      `<div class="ap-title">AI 请求：${AI_TOOL_LABEL[ev.name] || escapeHtml(ev.name)}</div>` +
      `<pre class="ap-detail">${escapeHtml(detail)}</pre>` +
      `<div class="ap-btns"><button class="ap-allow">允许</button><button class="ap-deny">拒绝</button></div>`;
    const decide = async (ok) => {
      card.querySelector('.ap-btns').innerHTML = `<span class="ap-state">${ok ? '✓ 已允许' : '✕ 已拒绝'}</span>`;
      card.classList.add(ok ? 'allowed' : 'denied');
      this.clearApproval(chatId, approvalId);
      try { await fetch('/api/ai/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: approvalId, approve: ok }) }); } catch { /* */ }
    };
    card.querySelector('.ap-allow').onclick = () => decide(true);
    card.querySelector('.ap-deny').onclick = () => decide(false);
    parent.appendChild(card);
    this.scroll();
    return card;
  },
  updateAttention() {
    const n = this.pendingApprovalCount();
    const btn = $('#btn-chat');
    if (btn) {
      btn.classList.toggle('attention', n > 0);
      btn.dataset.approvals = n ? String(n) : '';
      btn.title = n ? `有 ${n} 个后台 AI 审批请求待处理` : '打开 AI 对话面板：自然语言指挥 AI 整理/读写文件';
    }
    document.title = n ? `(${n}) 灵匣 Arca` : '灵匣 Arca';
  },
  updateComposer() {
    const b = this.isBusy(this.currentChat);
    $('#chat-send').disabled = b;
    $('#chat-stop').classList.toggle('hidden', !b);
  },
  // forcedText：跳过输入框直接发这段文字（任务模板组装的提示词走这里）
  // displayText：用户气泡里显示的人话摘要（不给非技术用户看大段提示词）
  async send(forcedText, displayText) {
    if (this.isBusy(this.currentChat)) return; // 当前会话有回合在跑；别的会话不受影响
    const input = $('#chat-input');
    const text = (forcedText !== undefined ? forcedText : input.value).trim();
    if (!text && !this.attachments.length) return;
    tpl.clear(); // 发送时收起模板区
    const payload = { chatId: this.currentChat, text, title: (displayText || text).slice(0, 40), attachments: this.attachments.slice(), cwd: state.cwd };
    let busyKey = this.currentChat || '__new__'; // 新会话先用占位 key，拿到正式 id 后置换
    // 用户气泡（附件名一并显示）
    const u = this.msgEl('user');
    u.textContent = displayText || text;
    if (payload.attachments.length) {
      const at = document.createElement('div');
      at.className = 'chat-user-atts';
      at.textContent = '📎 ' + payload.attachments.map(baseOf).join('、');
      u.appendChild(at);
    }
    if (forcedText === undefined) input.value = '';
    this.attachments = [];
    this.renderChips();
    this.busyChats.add(busyKey);
    this.updateComposer();

    // 助手回合容器：text/工具状态/审批卡片按到达顺序追加；文本按段落用 marked 渲染
    const a = this.msgEl('assistant');
    let mdBuf = '', mdDiv = null, thinkBox = null, renderTimer = null;
    const renderMd = () => {
      renderTimer = null;
      if (!mdBuf) return;
      if (!mdDiv) { mdDiv = document.createElement('div'); mdDiv.className = 'md-body chat-md'; a.appendChild(mdDiv); }
      mdDiv.innerHTML = window.marked && !window.__noMarked ? window.marked.parse(mdBuf) : escapeHtml(mdBuf);
      this.scroll();
    };
    const endSegment = () => { if (renderTimer) { clearTimeout(renderTimer); renderMd(); } mdBuf = ''; mdDiv = null; };
    const toolLines = [];
    const onEvent = (ev) => {
      if (ev.type === 'chat') {
        // 占位 key 换成正式会话 id；若用户还停在「新对话」视图则跟进到这个会话
        if (busyKey !== ev.id) { const oldKey = busyKey; this.busyChats.delete(busyKey); busyKey = ev.id; this.busyChats.add(busyKey); this.migrateChatState(oldKey, ev.id); }
        if (!payload.chatId && this.currentChat === null) { this.currentChat = ev.id; this.renderChatList(); }
        this.updateComposer();
        return;
      }
      if (ev.type === 'meta') { $('#chat-model').textContent = `${ev.provider} · ${ev.model}`; return; }
      if (ev.type === 'done') {
        if (ev.cost > 0) {
          const c = document.createElement('div');
          c.className = 'chat-cost';
          c.textContent = `本轮 $${ev.cost.toFixed(4)}${ev.turns ? ` · ${ev.turns} 步` : ''}`;
          a.appendChild(c);
        }
        return;
      }
      if (ev.type === 'think') {
        if (!thinkBox) {
          thinkBox = document.createElement('details');
          thinkBox.className = 'chat-think';
          thinkBox.innerHTML = '<summary>思考过程</summary><pre></pre>';
          a.appendChild(thinkBox);
        }
        thinkBox.querySelector('pre').textContent += ev.delta;
        return;
      }
      if (ev.type === 'text') {
        mdBuf += ev.delta;
        if (!renderTimer) renderTimer = setTimeout(renderMd, 80);
        return;
      }
      if (ev.type === 'tool') {
        endSegment();
        const line = document.createElement('div');
        line.className = 'chat-tool';
        line.innerHTML = `<span class="ct-spin">⏳</span> ${AI_TOOL_LABEL[ev.name] || escapeHtml(ev.name)} <code>${escapeHtml(String(aiToolDetail(ev.name, ev.args)).slice(0, 120))}</code>`;
        a.appendChild(line);
        toolLines.push(line);
        this.scroll();
        return;
      }
      if (ev.type === 'tool_done') {
        const line = toolLines.find((l) => l.querySelector('.ct-spin'));
        if (line) { line.querySelector('.ct-spin').outerHTML = '<span class="ct-ok">✓</span>'; }
        return;
      }
      if (ev.type === 'approval_done') {
        this.clearApproval(busyKey, ev.id);
        return;
      }
      if (ev.type === 'approval') {
        endSegment();
        this.markApproval(busyKey, ev.id, ev);
        this.appendApprovalCard(a, busyKey, ev.id, ev);
        return;
      }
      if (ev.type === 'error') {
        endSegment();
        const er = document.createElement('div');
        er.className = 'chat-error';
        er.textContent = '⚠ ' + ev.message;
        a.appendChild(er);
        this.scroll();
        return;
      }
    };
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line.startsWith('data:')) continue;
          let ev; try { ev = JSON.parse(line.slice(5)); } catch { continue; }
          onEvent(ev);
        }
      }
    } catch (e) {
      onEvent({ type: 'error', message: '连接中断: ' + e.message });
    }
    endSegment();
    if (!a.childNodes.length) a.remove(); // 全程没产出（比如配置错误已在 error 行展示过）就别留空气泡
    this.busyChats.delete(busyKey);
    this.updateComposer();
    this.loadChats(); // 新会话进列表 / 时间戳置顶
  },
  stop() {
    // 只停「当前正在看的会话」——别的会话各跑各的，互不干涉
    if (!this.isBusy(this.currentChat)) return;
    fetch('/api/ai/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: this.currentChat }) }).catch(() => {});
  },
  init() {
    $('#btn-chat').onclick = () => this.toggle();
    $('#mode-chat').onclick = () => setDockMode('chat');
    $('#mode-term').onclick = () => {
      if (!term.available()) { toast('网页版没有内嵌终端，桌面版才有', true); return; }
      if (!term.sessions.length) term.newTab();
      setDockMode('term');
    };
    $('#chat-send').onclick = () => this.send();
    $('#chat-stop').onclick = () => this.stop();
    $('#chat-new').onclick = () => this.newChat();
    $('#chat-tpl').onclick = () => this.newChat(); // 模板挂在新对话的空状态里
    $('#chat-settings').onclick = () => aiSettings.open();
    const input = $('#chat-input');
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); this.send(); }
    });
    // 拦住面板里的按键，别触发全局快捷键（方向键选文件等）
    $('#chat-host').addEventListener('keydown', (e) => e.stopPropagation());
    // 拖文件进对话区 = 附件。内部拖（文件列表）和系统拖（Finder/截图浮窗）都收
    const host = $('#chat-host');
    host.addEventListener('dragover', (e) => {
      const t = e.dataTransfer.types;
      if (t.includes('Files') || t.includes('application/x-fanbox-path') || t.includes('text/plain')) {
        e.preventDefault(); e.stopPropagation(); host.classList.add('chat-drop');
      }
    });
    host.addEventListener('dragleave', () => host.classList.remove('chat-drop'));
    host.addEventListener('drop', async (e) => {
      e.preventDefault(); e.stopPropagation();
      host.classList.remove('chat-drop');
      const files = e.dataTransfer.files ? [...e.dataTransfer.files] : [];
      if (files.length && window.fanboxDrop) {
        for (const f of files) {
          let p = window.fanboxDrop.pathForFile(f);
          if (!p) {
            const r = await window.fanboxDrop.saveTemp(f.name, await f.arrayBuffer()).catch(() => null);
            if (r && r.ok) p = r.path;
          }
          if (p) this.addAttachment(p);
        }
        return;
      }
      const p = e.dataTransfer.getData('application/x-fanbox-path') || e.dataTransfer.getData('text/plain');
      if (p) this.addAttachment(p);
    });
    this.refreshModelLabel();
  },
};

// ---------- AI 模型设置弹窗 ----------
const aiSettings = {
  data: null, sel: null, modelsCache: {},
  async open() {
    try { this.data = await api('/api/ai/providers'); } catch (e) { toast('读取 AI 配置失败: ' + e.message, true); return; }
    this.sel = this.data.active;
    this.render();
    $('#ai-settings').classList.remove('hidden');
  },
  close() { $('#ai-settings').classList.add('hidden'); },
  render() {
    const list = $('#ai-provider-list');
    list.innerHTML = '';
    for (const [k, p] of Object.entries(this.data.providers)) {
      const row = document.createElement('button');
      row.className = 'ai-provider' + (k === this.sel ? ' sel' : '');
      row.innerHTML = `<span>${escapeHtml(p.label)}</span><span class="ai-flags">${p.hasKey ? '<i class="ok">已配 key</i>' : ''}${k === this.data.active ? '<i class="act">使用中</i>' : ''}</span>`;
      row.onclick = () => { this.sel = k; this.render(); };
      list.appendChild(row);
    }
    const p = this.data.providers[this.sel];
    $('#ai-key').value = '';
    $('#ai-key').placeholder = p.hasKey ? '已配置（留空保持不变，粘贴新 key 可替换）' : '粘贴该服务商的 API key';
    $('#ai-baseurl').value = p.baseUrl || '';
    $('#ai-model').value = p.model || '';
    $('#ai-status').textContent = p.note || '';
    // 预设的建议模型先展示出来；有 key 的服务商自动拉一次实时列表（带缓存，不重复打 API）
    this.renderModelPick(this.modelsCache[this.sel] || p.models || []);
    if (p.hasKey && !this.modelsCache[this.sel]) this.fetchModels(true);
  },
  // 模型候选渲染成可点的胶囊列表——datalist 会按输入框现有文字过滤，拉到了也看不见，不用它
  renderModelPick(models) {
    const box = $('#ai-model-pick');
    const cur = $('#ai-model').value.trim();
    box.classList.toggle('hidden', !models.length);
    box.innerHTML = '';
    for (const m of models) {
      const b = document.createElement('button');
      b.className = 'ai-model-opt' + (m === cur ? ' sel' : '');
      b.textContent = m;
      b.onclick = () => { $('#ai-model').value = m; this.renderModelPick(models); };
      box.appendChild(b);
    }
  },
  async fetchModels(silent) {
    if (!silent) $('#ai-status').textContent = '拉取中…';
    try {
      // 表单里刚填的 key / baseUrl 一并带上：不用先保存就能拉
      const r = await fetch('/api/ai/models', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: this.sel, apiKey: $('#ai-key').value.trim(), baseUrl: $('#ai-baseurl').value.trim() }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error);
      this.modelsCache[this.sel] = r.models;
      this.renderModelPick(r.models);
      $('#ai-status').textContent = `拉到 ${r.models.length} 个模型，点下方选择`;
    } catch (e) { if (!silent) $('#ai-status').textContent = '拉取失败: ' + e.message; }
  },
  async save() {
    const body = { provider: this.sel, model: $('#ai-model').value.trim(), baseUrl: $('#ai-baseurl').value.trim(), activate: true };
    const key = $('#ai-key').value.trim();
    if (key) body.apiKey = key;
    try {
      await fetch('/api/ai/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      toast('AI 配置已保存');
      this.close();
      chat.refreshModelLabel();
    } catch (e) { $('#ai-status').textContent = '保存失败: ' + e.message; }
  },
  init() {
    $('#ai-close').onclick = () => this.close();
    $('#ai-save').onclick = () => this.save();
    $('#ai-fetch-models').onclick = () => this.fetchModels();
    $('#ai-settings').onclick = (e) => { if (e.target.id === 'ai-settings') this.close(); };
    $('#ai-settings').addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
      e.stopPropagation();
    });
  },
};

// ---------- 侧栏分组折叠（公司版）：Agent 项目一长就把下面的皮肤/状态区挡没了 ----------
// 点分组标题收起/展开，状态记进 localStorage；带列表的分组都生效
function initNavCollapse() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('fb_nav_collapsed') || '{}'); } catch { /* */ }
  document.querySelectorAll('#sidebar .nav-section').forEach((sec) => {
    const title = sec.querySelector('.nav-title');
    const list = sec.querySelector('.nav-list');
    if (!title || !list || !list.id) return;
    const key = list.id;
    const arrow = document.createElement('span');
    arrow.className = 'nav-arrow';
    title.appendChild(arrow);
    const apply = (c) => { sec.classList.toggle('nav-collapsed', c); arrow.textContent = c ? '▸' : '▾'; };
    apply(!!saved[key]);
    title.classList.add('nav-collapsible');
    title.addEventListener('click', () => {
      const c = !sec.classList.contains('nav-collapsed');
      saved[key] = c;
      apply(c);
      localStorage.setItem('fb_nav_collapsed', JSON.stringify(saved));
    });
  });
}

// ---------- 启动 ----------
async function init() {
  // 桌面 app：标记 body，给顶部交通灯留位、顶部可拖拽（交通灯避让仅 mac 需要，按平台打 class）
  if (window.fanboxEnv && window.fanboxEnv.isDesktopApp) {
    document.documentElement.classList.add('desktop', 'plat-' + (window.fanboxEnv.platform || 'darwin'));
  }
  // 非 mac：把界面静态文案里的 ⌘ 换成 Ctrl+（title 提示和可见文本都换；动态生成的文案用 MOD 常量）
  if (!IS_MAC) {
    const fix = (s) => s.replace(/⌘/g, 'Ctrl+');
    document.querySelectorAll('[title]').forEach((el) => { if (el.title.includes('⌘')) el.title = fix(el.title); });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let tn;
    while ((tn = walker.nextNode())) { if (tn.nodeValue.includes('⌘')) tn.nodeValue = fix(tn.nodeValue); }
  }
  applyTheme(state.theme, false);
  if (state.sidebarCollapsed) { $('#app').classList.add('sidebar-collapsed'); $('#btn-sidebar')?.classList.add('on'); }
  applyLayout();
  term.applyDock(); // 初始就给 #main-body 设好 dock 类，决定预览/文件管理方向
  bindEvents();
  bindResizer();
  bindSidebarResizer();
  bindSelectionToTerminal();
  enableTooltips();
  // md 里直接引用本地文件路径的图片，按页面 URL 解析必 404：加载失败时解析成
  // 绝对路径走 /fs/ 镜像端点兜底显示。文档源码保持干净的文件路径，预览和 Crepe 里都能看图
  $('#preview-body').addEventListener('error', (ev) => {
    const img = ev.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.fsTried) return;
    const src = decodeURI(img.getAttribute('src') || '');
    if (/^(https?:|data:|blob:)/.test(src) || src.startsWith('/api/') || src.startsWith('/fs/')) return;
    let abs = src;
    // 相对路径按当前文档所在目录解析；Windows 盘符路径（C:\…）本身就是绝对的
    if (!abs.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(abs)) {
      const stack = (state.selected || '').split(/[\\/]/).slice(0, -1);
      for (const seg of abs.split(/[\\/]/)) {
        if (seg === '..') stack.pop(); else if (seg && seg !== '.') stack.push(seg);
      }
      abs = (state.platform === 'win32' ? '' : '/') + stack.filter(Boolean).join('/');
    }
    img.dataset.fsTried = '1';
    img.src = '/fs/' + abs.split(/[\\/]/).filter(Boolean).map(encodeURIComponent).join('/');
  }, true);
  document.querySelectorAll('#theme-switch .theme-seg button').forEach((b) => { b.onclick = () => applyTheme(b.dataset.skin); });
  await loadRoots();
  await loadDrives();
  await loadFavorites();
  loadAgentProjects();
  setInterval(loadAgentProjects, 120000); // agent 项目入口保持新鲜（服务端有 60s 缓存，开销很小）
  const targetPath = new URLSearchParams(location.search).get('targetPath');
  await navigate(targetPath || state.home, false);
  chat.init();
  aiSettings.init();
  initNavCollapse();
  // 恢复上次终端开合状态（dock 方位已由 applyDock 自带记忆）；上次停在对话模式则恢复对话
  if (localStorage.getItem('fb_term_open') === '1' && term.available()) term.open();
  if (localStorage.getItem('fb_term_open') === '1' && localStorage.getItem('fb_dock_mode') === 'chat') chat.open();
  maybeShowGuide();
  bindUpdateNotice();
}
// 新版本提示：主进程查到 GitHub 有新 Release 时右下角弹胶囊，引导去下载页（不强更不打扰）
function bindUpdateNotice() {
  if (!window.fanboxUpdate) return;
  const show = ({ version, url }) => {
    if (localStorage.getItem('fb_skip_ver') === version || document.querySelector('.update-pill')) return;
    const bar = document.createElement('div');
    bar.className = 'update-pill';
    bar.innerHTML = `<span>新版本 v${escapeHtml(version)} 已发布</span><button class="up-go">去下载</button><button class="up-x" title="这个版本不再提醒">✕</button>`;
    document.body.appendChild(bar);
    bar.querySelector('.up-go').onclick = () => { window.fanboxUpdate.open(url); bar.remove(); };
    bar.querySelector('.up-x').onclick = () => { localStorage.setItem('fb_skip_ver', version); bar.remove(); };
  };
  window.fanboxUpdate.onAvailable(show);
  // 主进程启动 6 秒就推送，init 加载大目录时这里可能还没注册监听——补拉一次，错过的推送不丢
  if (window.fanboxUpdate.get) window.fanboxUpdate.get().then((m) => { if (m) show(m); }).catch(() => {});
}
init();
