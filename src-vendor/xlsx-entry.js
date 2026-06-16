/**
 * Excel 预览 vendor 入口（公司版）：SheetJS 社区版打成单文件 IIFE，
 * 暴露 window.FanboxXlsx。只做解析→HTML 表格预览，编辑走系统应用。
 * 构建：npm run build:xlsx
 */
import * as XLSX from 'xlsx';

window.FanboxXlsx = {
  /** buf: ArrayBuffer → [{ name, html }] 每个工作表一段 <table> HTML */
  parse(buf) {
    const wb = XLSX.read(buf, { type: 'array' });
    return (wb.SheetNames || []).map((name) => ({
      name,
      ...safeSheetToHtml(wb.Sheets[name]),
    }));
  },
};

function safeSheetToHtml(sheet) {
  if (!sheet || !sheet['!ref']) {
    return { html: '<div class="empty-state">空工作表</div>', isEmpty: true };
  }
  try {
    return { html: XLSX.utils.sheet_to_html(sheet, { header: '', footer: '' }) };
  } catch (err) {
    return {
      html: `<div class="empty-state">此工作表暂无法预览：${escapeHtml(err && err.message ? err.message : '解析失败')}</div>`,
      error: err && err.message ? err.message : '解析失败',
    };
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}
