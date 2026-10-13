'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');

const AUTH_PREFIX = '/api/v3/admin/auth';
const AUTH_METHODS = Object.freeze({
  [`${AUTH_PREFIX}/login`]: 'POST',
  [`${AUTH_PREFIX}/session`]: 'GET',
  [`${AUTH_PREFIX}/logout`]: 'POST'
});
const PUBLIC_FILES = new Set([
  '/index.html',
  '/css/tokens.css', '/css/shell.css', '/css/modules.css', '/css/connect.css',
  '/js/state.js', '/js/router.js', '/js/shell.js',
  '/modules/music.js', '/modules/music-person-detail-fallback.js',
  '/modules/wrestling.js', '/modules/connect.js', '/modules/admin.js'
]);
const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.vcf': 'text/vcard; charset=utf-8'
});
const ASSET_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif', '.ico', '.mp4', '.webm', '.vcf'
]);
const REQUEST_LIMIT = 4096;
const RESPONSE_LIMIT = 65536;
const TIMEOUT_MS = 15000;
const SENSITIVE_HEADERS = new Set([
  'host', 'origin', 'x-v3-admin-request', 'cookie', 'content-type', 'content-encoding', 'connection',
  'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'sec-fetch-user'
]);

function canonicalHttpsOrigin(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      url.origin === value ? url : null;
  } catch { return null; }
}

function parsePath(requestUrl) {
  if (typeof requestUrl !== 'string' || !requestUrl.startsWith('/') || requestUrl.startsWith('//')) return null;
  const rawPath = requestUrl.split('?')[0];
  if (rawPath.includes('#') || /%2f|%5c/i.test(rawPath)) return null;
  try {
    const decoded = decodeURIComponent(rawPath);
    if (/[:\\\u0000-\u0020\u007f]/.test(decoded) || /%[0-9a-f]{2}/i.test(decoded) ||
      decoded.split('/').some((part) => part.startsWith('.'))) return null;
    return decoded;
  } catch { return null; }
}

function json(res, status, error, extraHeaders = {}) {
  if (res.destroyed || res.writableEnded) return;
  const body = JSON.stringify({ ok: false, error });
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'same-origin',
    ...extraHeaders
  });
  res.end(body);
}

function uniqueBoundedHeaders(req) {
  const seen = new Set();
  const raw = req.rawHeaders || [];
  for (let index = 0; index < raw.length; index += 2) {
    const name = String(raw[index]).toLowerCase();
    if (SENSITIVE_HEADERS.has(name) && seen.has(name)) return false;
    seen.add(name);
  }
  for (const name of SENSITIVE_HEADERS) {
    const value = req.headers[name];
    if (value !== undefined && (typeof value !== 'string' || value.length > REQUEST_LIMIT)) return false;
  }
  return true;
}

function readBody(req, limit, deadlineMs) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('error', onError);
      req.removeListener('aborted', onError);
      if (error) { req.resume(); reject(error); }
      else resolve(Buffer.concat(chunks, size));
    };
    const onData = (chunk) => {
      size += chunk.length;
      if (size > limit) finish('too_large');
      else chunks.push(chunk);
    };
    const onEnd = () => finish();
    const onError = () => finish('unavailable');
    const timer = setTimeout(() => finish('timeout'), deadlineMs);
    req.on('data', onData);
    req.once('end', onEnd);
    req.once('error', onError);
    req.once('aborted', onError);
    if (req.aborted || req.destroyed) finish('unavailable');
  });
}

function proxyAuth(req, res, pathname, upstream, body, requestUpstream) {
  return new Promise((resolve) => {
    let outgoing;
    let settled = false;
    const finish = (status, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.removeListener('aborted', cancel);
      res.removeListener('close', cancel);
      if (status) json(res, status, error);
      if (outgoing) outgoing.destroy();
      resolve();
    };
    const cancel = () => finish();
    const timer = setTimeout(() => finish(504, 'upstream_timeout'), TIMEOUT_MS);
    req.once('aborted', cancel);
    res.once('close', cancel);
    const headers = { Accept: 'application/json' };
    const nominated = new Set((req.headers.connection || '').split(',').map((name) => name.trim().toLowerCase()));
    for (const name of SENSITIVE_HEADERS) {
      if (!['host', 'connection', 'content-encoding'].includes(name) && !nominated.has(name) &&
        req.headers[name] !== undefined) headers[name] = req.headers[name];
    }
    if (req.method === 'POST') headers['content-length'] = String(body.length);
    try {
      outgoing = requestUpstream({
        protocol: 'https:', hostname: upstream.hostname, port: upstream.port || 443,
        method: req.method, path: pathname, headers, rejectUnauthorized: true, maxHeaderSize: 16384
      }, (response) => {
        response.once('error', () => finish(502, 'upstream_unavailable'));
        response.once('aborted', () => finish(502, 'upstream_unavailable'));
        const status = response.statusCode;
        if (!Number.isInteger(status) || status < 200 || status >= 300 && status < 400 || status > 599 ||
          typeof response.headers['content-type'] !== 'string' ||
          !/^application\/json(?:\s*;|$)/i.test(response.headers['content-type'])) {
          response.resume();
          finish(502, 'upstream_unavailable');
          return;
        }
        const chunks = [];
        let size = 0;
        response.on('data', (chunk) => {
          size += chunk.length;
          if (size > RESPONSE_LIMIT) { response.destroy(); finish(502, 'upstream_unavailable'); }
          else chunks.push(chunk);
        });
        response.once('end', () => {
          if (settled) return;
          const payload = Buffer.concat(chunks, size);
          try { JSON.parse(payload.toString('utf8')); }
          catch { finish(502, 'upstream_unavailable'); return; }
          const outputHeaders = {
            'Content-Type': 'application/json; charset=utf-8', 'Content-Length': payload.length,
            'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
            'Cross-Origin-Resource-Policy': 'same-origin'
          };
          const nominatedResponseHeaders = new Set(
            (typeof response.headers.connection === 'string' ? response.headers.connection : '')
              .split(',').map((name) => name.trim().toLowerCase())
          );
          if (nominatedResponseHeaders.has('set-cookie') && response.headers['set-cookie'] !== undefined) {
            finish(502, 'upstream_unavailable'); return;
          }
          for (const name of ['set-cookie', 'retry-after', 'allow']) {
            if (!nominatedResponseHeaders.has(name) && response.headers[name] !== undefined) {
              outputHeaders[name] = response.headers[name];
            }
          }
          try {
            if (!res.destroyed && !res.writableEnded) { res.writeHead(status, outputHeaders); res.end(payload); }
            finish();
          } catch { finish(502, 'upstream_unavailable'); }
        });
      });
      outgoing.once('error', () => finish(502, 'upstream_unavailable'));
      if (settled) outgoing.destroy();
      else outgoing.end(body);
    } catch { finish(502, 'upstream_unavailable'); }
  });
}

function withinRoot(root, file) {
  const relative = path.relative(root, file);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

async function serveStatic(req, res, pathname, rootPromise) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { json(res, 405, 'method_not_allowed', { Allow: 'GET, HEAD' }); return; }
  const extension = path.posix.extname(pathname).toLowerCase();
  const isAsset = pathname.startsWith('/assets/') && ASSET_EXTENSIONS.has(extension);
  const isPublic = PUBLIC_FILES.has(pathname);
  const acceptsHtml = typeof req.headers.accept === 'string' && /(?:^|,)\s*text\/html(?:\s*[;,]|$)/i.test(req.headers.accept);
  const documentRoute = pathname === '/' || !extension && !pathname.startsWith('/assets') && !pathname.startsWith('/css') &&
    !pathname.startsWith('/js') && !pathname.startsWith('/modules') && acceptsHtml;
  if (!isAsset && !isPublic && !documentRoute) { json(res, 404, 'not_found'); return; }
  const publicPath = isAsset || isPublic ? pathname : '/index.html';
  let filename;
  let info;
  try {
    const root = await rootPromise;
    const candidate = path.resolve(root, `.${publicPath}`);
    filename = await fs.promises.realpath(candidate);
    const samePath = process.platform === 'win32' ? filename.toLowerCase() === candidate.toLowerCase() : filename === candidate;
    if (!withinRoot(root, filename) || !samePath) { json(res, 404, 'not_found'); return; }
    info = await fs.promises.stat(filename);
    if (!info.isFile()) { json(res, 404, 'not_found'); return; }
  } catch { json(res, 404, 'not_found'); return; }
  let start = 0;
  let end = info.size - 1;
  let status = 200;
  const headers = {
    'Content-Type': MIME[path.extname(filename).toLowerCase()],
    'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes'
  };
  if (req.headers.range !== undefined) {
    const range = typeof req.headers.range === 'string' && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!range || !range[1] && !range[2] || info.size === 0) {
      json(res, 416, 'invalid_range', { 'Content-Range': `bytes */${info.size}` }); return;
    }
    if (!range[1]) start = Math.max(0, info.size - Number(range[2]));
    else start = Number(range[1]);
    if (range[1] && range[2]) end = Math.min(end, Number(range[2]));
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end) {
      json(res, 416, 'invalid_range', { 'Content-Range': `bytes */${info.size}` }); return;
    }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
  }
  headers['Content-Length'] = info.size === 0 ? 0 : end - start + 1;
  res.writeHead(status, headers);
  if (req.method === 'HEAD' || info.size === 0) { res.end(); return; }
  const stream = fs.createReadStream(filename, { start, end });
  stream.once('error', () => res.destroy());
  res.once('close', () => stream.destroy());
  stream.pipe(res);
}

function createGatewayHandler({ rootDirectory = __dirname, env = process.env, requestUpstream = https.request } = {}) {
  if (typeof rootDirectory !== 'string' || typeof requestUpstream !== 'function' || !env || typeof env !== 'object') {
    throw new TypeError('Invalid gateway configuration');
  }
  const enabled = env.V3_ADMIN_AUTH_ENABLED === 'true';
  const publicOrigin = enabled ? canonicalHttpsOrigin(env.V3_ADMIN_AUTH_ORIGIN) : null;
  const upstream = enabled ? canonicalHttpsOrigin(env.V3_ADMIN_AUTH_UPSTREAM_ORIGIN) : null;
  const rootPromise = fs.promises.realpath(rootDirectory);
  // Avoid an unhandled rejection when an invalid public root has no incoming requests.
  rootPromise.catch(() => {});
  return async function gatewayHandler(req, res) {
    const pathname = parsePath(req.url);
    if (!pathname) { json(res, 400, 'invalid_request'); return; }
    if (!pathname.toLowerCase().startsWith('/api')) {
      try { await serveStatic(req, res, pathname, rootPromise); }
      catch { if (res.headersSent) res.destroy(); else json(res, 500, 'unavailable'); }
      return;
    }
    const method = AUTH_METHODS[pathname];
    if (!method || !enabled) { json(res, 404, 'not_found'); return; }
    if (req.method !== method) { json(res, 405, 'method_not_allowed', { Allow: method }); return; }
    if (!publicOrigin || !upstream) { json(res, 503, 'auth_unavailable'); return; }
    // Render's TLS terminators are deliberately not trusted without verified ingress ownership.
    if (!req.socket || req.socket.encrypted !== true) { json(res, 403, 'request_denied'); return; }
    if (req.url !== pathname || !uniqueBoundedHeaders(req) || req.headers.host !== publicOrigin.host ||
      req.headers['x-v3-admin-request'] !== '1' ||
      req.headers['sec-fetch-site'] !== undefined && req.headers['sec-fetch-site'] !== 'same-origin' ||
      req.headers.origin !== undefined && req.headers.origin !== publicOrigin.origin ||
      method === 'POST' && req.headers.origin !== publicOrigin.origin) {
      json(res, 403, 'request_denied'); return;
    }
    if (req.headers['content-encoding'] !== undefined && req.headers['content-encoding'] !== 'identity' ||
      pathname.endsWith('/login') && (typeof req.headers['content-type'] !== 'string' ||
        !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']))) {
      json(res, 400, 'invalid_request'); return;
    }
    const declaredLength = req.headers['content-length'];
    if (declaredLength !== undefined && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > REQUEST_LIMIT)) {
      json(res, 413, 'request_too_large'); return;
    }
    let body;
    try { body = await readBody(req, method === 'GET' ? 0 : REQUEST_LIMIT, TIMEOUT_MS); }
    catch (error) {
      json(res, error === 'too_large' ? 413 : error === 'timeout' ? 408 : 400,
        error === 'too_large' ? 'request_too_large' : 'invalid_request'); return;
    }
    if (req.aborted || req.destroyed && !req.complete || res.destroyed) return;
    await proxyAuth(req, res, pathname, upstream, body, requestUpstream);
  };
}

function createGatewayServer(options) {
  const server = http.createServer({ maxHeaderSize: 16384 }, createGatewayHandler(options));
  server.headersTimeout = TIMEOUT_MS;
  server.requestTimeout = TIMEOUT_MS;
  server.keepAliveTimeout = 5000;
  return server;
}

module.exports = Object.freeze({ createGatewayHandler, createGatewayServer });

if (require.main === module) {
  const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) process.exitCode = 1;
  else {
    const server = createGatewayServer();
    server.once('error', () => { process.exitCode = 1; });
    server.listen(port, '0.0.0.0');
  }
}
