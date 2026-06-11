/**
 * Word 编辑器 vendor 入口（公司版）：docx-editor + React 打成单文件 IIFE，
 * 暴露 window.FanboxDocx 给零框架的 app.js 用。离线可用，文档不出本机。
 * 构建：npm run build:docx
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DocxEditor } from '@eigenpal/docx-editor-react';
import '@eigenpal/docx-editor-react/styles.css';

window.FanboxDocx = {
  /**
   * 把编辑器挂到 el 上。buffer 为 .docx 的 ArrayBuffer。
   * opts: { mode: 'editing'|'suggesting', author, onChange }
   * 返回 { save() → Promise<ArrayBuffer|null>, destroy() }
   */
  mount(el, buffer, opts = {}) {
    const ref = React.createRef();
    const root = createRoot(el);
    root.render(React.createElement(DocxEditor, {
      ref,
      documentBuffer: buffer,
      mode: opts.mode || 'editing',
      author: opts.author || '灵匣用户',
      onChange: opts.onChange,
    }));
    return {
      async save(o) { return ref.current ? await ref.current.save(o) : null; },
      destroy() { try { root.unmount(); } catch { /* */ } },
    };
  },
};
