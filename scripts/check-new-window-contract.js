'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron', 'preload.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

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
assertIncludes('app', app, "e.key === 'n'");
assertIncludes('app', app, "e.key === 'w'");

console.log('window contract ok');
