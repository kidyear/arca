'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

function sliceFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const next = text.indexOf('\nfunction ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
}

const resolvePath = sliceFunction(server, 'resolvePath');
assertIncludes('resolvePath', resolvePath, 'const fileUrl = new URL(input)');
assertIncludes('resolvePath', resolvePath, 'fileUrl.hostname');
assertIncludes('resolvePath', resolvePath, 'path.win32.normalize');
assertIncludes('resolvePath', resolvePath, "'\\\\\\\\' + fileUrl.hostname");

assertIncludes('server', server, 'function breadcrumbForPath');
const breadcrumbForPath = sliceFunction(server, 'breadcrumbForPath');
assertIncludes('breadcrumbForPath', breadcrumbForPath, 'path.parse(dir)');
assertIncludes('breadcrumbForPath', breadcrumbForPath, 'parsed.root');
assertIncludes('breadcrumbForPath', breadcrumbForPath, 'path.relative(parsed.root, dir)');

assertIncludes('listDir', server, 'breadcrumbForPath(dir)');

const context = {
  path,
  HOME: 'C:\\Users\\tester',
  PLATFORM: 'win32',
  URL,
};
vm.createContext(context);
vm.runInContext(`${resolvePath}\n${breadcrumbForPath}`, context);

function assertEqual(label, actual, expected) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

function assertDeepEqual(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label}: expected ${e}, got ${a}`);
}

assertEqual(
  'file URL UNC host is preserved',
  context.resolvePath('file://nas01/Shared%20Docs/QA/report.docx'),
  '\\\\nas01\\Shared Docs\\QA\\report.docx'
);
assertEqual(
  'quoted UNC path stays UNC',
  context.resolvePath('"\\\\nas01\\Shared Docs\\QA"'),
  '\\\\nas01\\Shared Docs\\QA'
);
assertEqual(
  'drive file URL still works',
  context.resolvePath('file:///C:/Users/tester/Desktop'),
  'C:\\Users\\tester\\Desktop'
);
assertDeepEqual(
  'UNC breadcrumb keeps server share root',
  context.breadcrumbForPath('\\\\nas01\\Shared Docs\\QA\\Reports'),
  [
    { name: '\\\\nas01\\Shared Docs', path: '\\\\nas01\\Shared Docs\\' },
    { name: 'QA', path: '\\\\nas01\\Shared Docs\\QA' },
    { name: 'Reports', path: '\\\\nas01\\Shared Docs\\QA\\Reports' },
  ]
);

console.log('unc-path contract ok');
