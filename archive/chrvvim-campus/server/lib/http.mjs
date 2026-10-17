// ==========================================================================
// أدوات HTTP صغيرة: استجابات JSON، قراءة الأجسام، تقديم الملفات الثابتة.
// بدون أي تبعيات خارجية.
// ==========================================================================
import fs from 'node:fs';
import path from 'node:path';

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

export function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(text);
}

export function sendError(res, status, message, extra = {}) {
  sendJson(res, status, { error: message, ...extra });
}

/** قراءة جسم الطلب مع حد أقصى للحجم لمنع إغراق الخادم. */
export function readJsonBody(req, limitBytes = 100 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(Object.assign(new Error('PAYLOAD_TOO_LARGE'), { code: 'PAYLOAD_TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw.trim() ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error('INVALID_JSON'), { code: 'INVALID_JSON' }));
      }
    });
    req.on('error', reject);
  });
}

/**
 * تقديم ملف من القرص مع حماية من الخروج خارج الجذر (path traversal).
 * @returns {boolean} true إذا تم تقديم الملف.
 */
export function sendFile(res, rootDir, relativePath, { cache, status = 200 } = {}) {
  const safe = path.normalize(decodeURIComponent(relativePath)).replace(/^([/\\])+/, '');
  const abs = path.join(rootDir, safe);
  if (!abs.startsWith(path.resolve(rootDir) + path.sep) && abs !== path.resolve(rootDir)) {
    sendError(res, 403, 'مسار غير مسموح.');
    return true;
  }
  let stat;
  try {
    stat = fs.statSync(abs);
  } catch {
    return false;
  }
  if (stat.isDirectory()) return false;
  const ext = path.extname(abs).toLowerCase();
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'X-Content-Type-Options': 'nosniff',
  };
  if (cache) headers['Cache-Control'] = cache;
  res.writeHead(status, headers);
  fs.createReadStream(abs).pipe(res);
  return true;
}

/** قراءة ملف JSON بأمان. */
export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
