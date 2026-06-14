'use strict';

function cleanVersion(v) {
  return String(v || '').trim().replace(/^v/i, '');
}

function cmpVer(a, b) {
  const pa = cleanVersion(a).split('.').map((x) => Number.parseInt(x, 10) || 0);
  const pb = cleanVersion(b).split('.').map((x) => Number.parseInt(x, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function isHttpUrl(value) {
  try {
    const u = new URL(String(value || '').trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseUpdateFeed(payload, feedUrl) {
  const versionRaw = String((payload && payload.version) || '').trim();
  if (!versionRaw) return null;
  const downloadUrl = String((payload && payload.url) || feedUrl || '').trim();
  if (!isHttpUrl(downloadUrl)) return null;
  return {
    tag: versionRaw,
    version: cleanVersion(versionRaw),
    url: downloadUrl,
  };
}

function updateNoticeForFeed(payload, currentVersion, feedUrl) {
  const info = parseUpdateFeed(payload, feedUrl);
  if (!info || cmpVer(info.version, currentVersion) <= 0) return null;
  return { version: info.version, url: info.url, tag: info.tag };
}

module.exports = { cleanVersion, cmpVer, parseUpdateFeed, updateNoticeForFeed };
