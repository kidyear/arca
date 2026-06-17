'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron', 'preload.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');
const dict = fs.readFileSync(path.join(root, 'public', 'i18n-dict.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('main', main, "ipcMain.handle('window:new'");
assertIncludes('main', main, "ipcMain.handle('window:close'");
assertIncludes('main', main, 'function createWindow(initialPath');
assertIncludes('main', main, 'targetPath=');
assertIncludes('main', main, 'closeCurrentWindow');
assertIncludes('preload', preload, "contextBridge.exposeInMainWorld('fanboxWindow'");
assertIncludes('preload', preload, 'open: (path)');
assertIncludes('preload', preload, 'close: ()');
assertIncludes('app', app, 'function openNewWindow');
assertIncludes('app', app, 'function closeCurrentWindow');
assertIncludes('app', app, 'window.fanboxWindow.open');
assertIncludes('app', app, 'window.fanboxWindow.close');
assertIncludes('app', app, "toast(r.ok ? '已在新窗口打开' : '新窗口打开失败：' + (r.error || '未知错误'), !r.ok);");
assertIncludes('app', app, "if (!r.ok) toast('关闭窗口失败：' + (r.error || '未知错误'), true);");
assertIncludes('app', app, "e.key === 'n'");
assertIncludes('app', app, "e.key === 'w'");
assertIncludes('i18n new window failure', dict, '/^新窗口打开失败：([\\s\\S]*)$/');
assertIncludes('i18n close window failure', dict, '/^关闭窗口失败：([\\s\\S]*)$/');

console.log('window contract ok');
