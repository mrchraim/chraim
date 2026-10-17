// ==========================================================================
// مسارات المصادقة: رمز CSRF، تسجيل الدخول/الخروج، وحالة الحساب.
// الجلسات مخزّنة في SQLite ومعرّفها موقّع بـ HMAC في ملف تعريف ارتباط HttpOnly.
// ==========================================================================
import { HttpError } from '../lib/router.mjs';
import { get, run } from '../lib/db.mjs';
import { verifyPassword, safeCompare, rateLimit } from '../lib/security.mjs';
import {
  createSession,
  setSessionCookie,
  destroySession,
  clearSessionCookie,
} from '../lib/session.mjs';
import { schema } from '../lib/validate.mjs';
import { sendJson } from '../lib/http.mjs';
import { audit } from '../services/audit.mjs';

const loginSchema = schema({
  email: (f) => f.email({ required: true }),
  password: (f) => f.string({ min: 1, max: 200, required: true }),
});

/** يمنع قصف تسجيل الدخول: 8 محاولات لكل 15 دقيقة لكل عنوان. */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, key: 'login' });

/** حماية CSRF: تتحقق من الرمز في كل الطلبات المُعدِّلة. */
export function csrfGuard(ctx, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.method)) return next();
  const supplied = ctx.req.headers['x-csrf-token'];
  const expected = ctx.session?.csrfToken;
  if (!supplied || !expected || !safeCompare(supplied, expected)) {
    throw new HttpError(403, 'تعذر التحقق من الطلب. حدّث الصفحة وحاول مجدداً.');
  }
  return next();
}

/**
 * وسيط التحقق من الصلاحيات. يتحقق دائماً من الحساب الحالي في قاعدة البيانات
 * بدلاً من الاعتماد على نسخة مخزّنة داخل الجلسة.
 */
export function requireRole(...roles) {
  return (ctx, next) => {
    const adminId = ctx.session?.adminId;
    if (!adminId) throw new HttpError(401, 'يلزم تسجيل الدخول.');
    const current = get('SELECT id,email,role,active FROM admins WHERE id=?', adminId);
    if (!current || current.active !== 1) {
      destroySession(ctx.req);
      clearSessionCookie(ctx.res);
      throw new HttpError(401, 'انتهت صلاحية الحساب الإداري أو تم تعطيله. سجّل الدخول مجدداً.');
    }
    if (!roles.includes(current.role)) {
      throw new HttpError(403, 'ليست لديك صلاحية لتنفيذ هذا الإجراء.');
    }
    ctx.admin = { id: current.id, email: current.email, role: current.role };
    return next();
  };
}

export const requireLogin = requireRole('admin', 'editor', 'publisher');
export const requireAdmin = requireRole('admin');

export function registerAuth(router) {
  router.get('/api/admin/csrf', (ctx) => {
    sendJson(ctx.res, 200, { csrfToken: ctx.session?.csrfToken || '' });
  });

  router.get('/api/admin/me', (ctx) => {
    let admin = null;
    if (ctx.session?.adminId) {
      const row = get('SELECT id,email,role,active FROM admins WHERE id=?', ctx.session.adminId);
      if (row && row.active === 1) admin = { id: row.id, email: row.email, role: row.role };
    }
    sendJson(ctx.res, 200, { authenticated: Boolean(admin), admin });
  });

  router.post('/api/admin/login', loginLimiter, (ctx) => {
    const { email, password } = loginSchema.parse(ctx.body || {});
    const user = get('SELECT id,email,password_hash,role,active FROM admins WHERE email=?', email);
    const ok = Boolean(user) && user.active === 1 && verifyPassword(password, user.password_hash);
    if (!ok) {
      audit(ctx, 'login_failed', 'admin', null, 'Rejected login attempt');
      throw new HttpError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
    // تدوير الجلسة لمنع تثبيت الجلسة (session fixation).
    destroySession(ctx.req);
    const { sid, csrfToken } = createSession(user.id);
    setSessionCookie(ctx.res, sid);
    ctx.session = { sid, csrfToken, adminId: user.id, role: user.role };
    ctx.admin = { id: user.id, email: user.email, role: user.role };
    run("UPDATE admins SET last_login_at=datetime('now') WHERE id=?", user.id);
    audit(ctx, 'login', 'admin', user.id, 'Successful login');
    sendJson(ctx.res, 200, { ok: true, admin: ctx.admin, csrfToken });
  });

  router.post('/api/admin/logout', requireLogin, (ctx) => {
    audit(ctx, 'logout', 'admin', ctx.admin.id, 'Session ended');
    destroySession(ctx.req);
    clearSessionCookie(ctx.res);
    sendJson(ctx.res, 200, { ok: true });
  });
}
