'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
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

assertIncludes('app', app, 'function addNetworkLocation');
assertIncludes('app', app, 'function networkLocationLi');

const addNetworkLocation = sliceFunction(app, 'addNetworkLocation');
assertIncludes('addNetworkLocation', addNetworkLocation, '添加网络位置');
assertIncludes('addNetworkLocation', addNetworkLocation, '/api/stat?path=');
assertIncludes('addNetworkLocation', addNetworkLocation, '!r.isDir');
assertIncludes('addNetworkLocation', addNetworkLocation, 'isFav(r.path)');
assertIncludes('addNetworkLocation', addNetworkLocation, '/api/favorites');
assertIncludes('addNetworkLocation', addNetworkLocation, 'loadFavorites()');

const networkLocationLi = sliceFunction(app, 'networkLocationLi');
assertIncludes('networkLocationLi', networkLocationLi, '添加网络位置…');
assertIncludes('networkLocationLi', networkLocationLi, "document.createElement('button')");
assertIncludes('networkLocationLi', networkLocationLi, "btn.type = 'button'");
assertIncludes('networkLocationLi', networkLocationLi, "btn.className = 'nav-add-btn'");
assertIncludes('networkLocationLi', networkLocationLi, "btn.dataset.action = 'network-location'");

const loadRoots = sliceFunction(app, 'loadRoots');
assertIncludes('loadRoots', loadRoots, 'networkLocationLi()');

const bindEvents = sliceFunction(app, 'bindEvents');
assertIncludes('bindEvents', bindEvents, "$('#roots-list').addEventListener('click'");
assertIncludes('bindEvents', bindEvents, "e.target.closest('.network-location-add')");
assertIncludes('bindEvents', bindEvents, 'addNetworkLocation()');

console.log('network-location contract ok');
