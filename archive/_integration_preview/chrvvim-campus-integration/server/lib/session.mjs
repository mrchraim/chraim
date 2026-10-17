// ==========================================================================
// إدارة الجلسات: معرّف عشوائي + توقيع HMAC، ومخزن دائم داخل SQLite.
// ==========================================================================
import crypto from 'node:crypto';
import { run, get } from './db.mjs';
import {
  SESSION_SECRET,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  SESSION_COOKIE_MS,
  isProd,
} from '../config.mjs';
import { randomToken } from './security.mjs';

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function pack(sid) {
  return `${sid}.${sign(sid)}`;
}

function unpack(cookieValue) {
  if (!cookieValue || !cookieValue.includes('.')) return null;
  const idx = cookieValue.lastIndexOf('.');
  const sid = cookieValue.slice(0, idx);
  const sig = cookieValue.slice(idx + 1);
  const expected = sign(sid);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return sid;
}

export function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

export function createSession(adminId = null) {
  const sid = randomToken(32);
  const csrfToken = randomToken(32);
  const now = Date.now();
  run(
    'INSERT INTO sessions (id, admin_id, csrf_token, created_at, expires_at) VALUES (?,?,?,?,?)',
    sid, adminId, csrfToken, now, now + SESSION_TTL_SECONDS * 1000,
  );
  return { sid, csrfToken };
}

export function setSessionCookie(res, sid) {
  const cookie = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(pack(sid))}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(SESSION_COOKIE_MS / 1000)}`,
  ];
  if (isProd) cookie.push('Secure');
  res.setHeader('Set-Cookie', cookie.join('; '));
}

export function clearSessionCookie(res) {
  const cookie = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (isProd) cookie.push('Secure');
  res.setHeader('Set-Cookie', cookie.join('; '));
}

/** إعادة تحميل الجلسة من قاعدة البيانات؛ يحذف الجلسات المنتهية. */
export function loadSession(req) {
  const sid = unpack(parseCookies(req)[SESSION_COOKIE_NAME]);
  if (!sid) return null;
  const row = get('SELECT * FROM sessions WHERE id = ?', sid);
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    run('DELETE FROM sessions WHERE id = ?', sid);
    return null;
  }
  // تمديد الجلسة (sliding expiration)
  run('UPDATE sessions SET expires_at = ? WHERE id = ?', Date.now() + SESSION_TTL_SECONDS * 1000, sid);
  return { sid, csrfToken: row.csrf_token, adminId: row.admin_id };
}

export function destroySession(req) {
  const sid = unpack(parseCookies(req)[SESSION_COOKIE_NAME]);
  if (sid) run('DELETE FROM sessions WHERE id = ?', sid);
}

export function updateSessionAdmin(sid, adminId) {
  run('UPDATE sessions SET admin_id = ? WHERE id = ?', adminId, sid);
}

export function rotateSession(req, res) {
  destroySession(req);
  const { sid, csrfToken } = createSession(null);
  setSessionCookie(res, sid);
  return { sid, csrfToken };
}
