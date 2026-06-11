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
    return wb.SheetNames.map((name) => ({
      name,
      html: XLSX.utils.sheet_to_html(wb.Sheets[name], { header: '', footer: '' }),
    }));
  },
};
