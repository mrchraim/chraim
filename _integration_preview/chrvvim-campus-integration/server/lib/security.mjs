// ==========================================================================
// الأمان: تجزئة كلمات المرور (scrypt)، رؤوس الأمان، حدود المعدل، CSRF.
// ==========================================================================
import crypto from 'node:crypto';
import { isProd } from '../config.mjs';

// --- كلمات المرور: scrypt مدمج في Node بدون حاجة إلى bcrypt -----------------
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const derived = crypto.scryptSync(password, salt, expected.length, {
      N: Number(N), r: Number(r), p: Number(p),
    });
    return timingSafeEqualHex(derived, expected);
  } catch {
    return false;
  }
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** مقارنة ثابتة الزمن بين نصّين. */
export function safeCompare(a, b) {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// --- رؤوس الأمان -----------------------------------------------------------
export function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  );
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

// --- حدود المعدل (ذاكرة داخلية كافية لخادم واحد) -----------------------------
const buckets = new Map();

export function rateLimit({ windowMs = 60_000, limit = 100, key = 'global' } = {}) {
  return (ctx, next) => {
    const now = Date.now();
    const ip = ctx.ip;
    const id = `${key}:${ip}`;
    let bucket = buckets.get(id);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(id, bucket);
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      const retry = Math.ceil((bucket.resetAt - now) / 1000);
      const err = new Error('RATE_LIMITED');
      err.status = 429;
      err.extra = { retryAfter: retry };
      throw err;
    }
    return next();
  };
}

/** تنظيف دوري لدلاء حدود المعدل. */
setInterval(() => {
  const now = Date.now();
  for (const [id, bucket] of buckets) if (now > bucket.resetAt) buckets.delete(id);
}, 60_000).unref();
