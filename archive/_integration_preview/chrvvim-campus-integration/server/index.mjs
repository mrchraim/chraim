// ==========================================================================
// CHRVVIM CAMPUS — خادم HTTP بلا تبعيات خارجية.
// يجمع: رؤوس الأمان، الجلسات، حماية CSRF، API العامة والإدارية، والملفات الثابتة.
// ==========================================================================
import http from 'node:http';
import { WEB_DIR, PORT, isProd } from './config.mjs';
import { Router, runChain, HttpError } from './lib/router.mjs';
import { sendJson, sendError, sendFile, readJsonBody } from './lib/http.mjs';
import { securityHeaders } from './lib/security.mjs';
import { loadSession, createSession, setSessionCookie } from './lib/session.mjs';
import { cleanupExpiredSessions } from './lib/db.mjs';
import { registerPublic } from './routes/public.mjs';
import { registerAuth, csrfGuard } from './routes/auth.mjs';
import { registerAdmin } from './routes/admin.mjs';

const router = new Router();

// --- وسيط عام 1: رؤوس الأمان ---------------------------------------------
router.use((ctx, next) => {
  securityHeaders(ctx.res);
  return next();
});

// --- وسيط عام 2: تحميل/إنشاء الجلسة -------------------------------------
router.use((ctx, next) => {
  const existing = loadSession(ctx.req);
  if (existing) {
    ctx.session = existing;
    return next();
  }
  // ننشئ جلسة (ورمز CSRF) لطلبات لوحة الإدارة فقط، تجنّباً لإنشاء جلسات عبثية.
  if (ctx.pathname.startsWith('/api/admin')) {
    const { sid, csrfToken } = createSession(null);
    setSessionCookie(ctx.res, sid);
    ctx.session = { sid, csrfToken, adminId: null };
  } else {
    ctx.session = null;
  }
  return next();
});

// --- وسيط عام 3: قراءة جسم الطلب ------------------------------------------
router.use(async (ctx, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(ctx.method)) {
    try {
      ctx.body = await readJsonBody(ctx.req);
    } catch (error) {
      if (error.code === 'PAYLOAD_TOO_LARGE') throw new HttpError(413, 'حجم الطلب كبير جداً.');
      throw new HttpError(400, 'صيغة JSON غير صالحة.');
    }
  }
  return next();
});

// --- وسيط عام 4: حماية CSRF ----------------------------------------------
router.use(csrfGuard);

registerPublic(router);
registerAuth(router);
registerAdmin(router);

function buildContext(req, res, url) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return {
    req,
    res,
    url,
    method: req.method,
    pathname: decodeURIComponent(url.pathname),
    query: url.searchParams,
    params: {},
    headers: req.headers,
    ip: forwarded || req.socket.remoteAddress || 'unknown',
    session: null,
    admin: null,
    body: null,
  };
}

function handleError(res, error) {
  if (res.headersSent) {
    try { res.end(); } catch { /* ignore */ }
    return;
  }
  if (error instanceof HttpError) {
    sendJson(res, error.status, { error: error.message, ...(error.extra || {}) });
    return;
  }
  if (error && error.status && error.extra) {
    sendJson(res, error.status, { error: error.message || 'خطأ', ...error.extra });
    return;
  }
  if (!isProd) console.error('[chrvvim]', error);
  sendError(res, 500, 'حدث خطأ داخلي. لم يتم عرض تفاصيل الخادم.');
}

const CACHE_RULES = [
  { prefix: '/assets/', value: 'public, max-age=600, must-revalidate' },
  { prefix: '/documents/', value: 'public, max-age=86400' },
  { prefix: '/data/', value: 'public, max-age=600' },
];

function serveStatic(ctx) {
  const { res, pathname } = ctx;
  let rel = pathname;
  if (rel === '/' || rel === '') rel = '/index.html';
  else if (rel === '/admin') rel = '/admin/index.html';
  else if (rel.endsWith('/')) rel += 'index.html';

  const cache = CACHE_RULES.find((rule) => rel.startsWith(rule.prefix))?.value;
  if (sendFile(res, WEB_DIR, rel, { cache })) return true;

  // مسار غير موجود: نعيد صفحة 404 بلغة الموقع مع رمز الحالة الصحيح.
  if (sendFile(res, WEB_DIR, '/404.html', { cache: 'no-store', status: 404 })) return true;
  sendError(res, 404, 'المسار غير موجود.');
  return false;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const ctx = buildContext(req, res, url);
  try {
    if (ctx.pathname.startsWith('/api/')) {
      const match = router.match(req.method, ctx.pathname);
      if (!match) throw new HttpError(404, 'المسار غير موجود.');
      Object.assign(ctx.params, match.params);
      res.setHeader('Cache-Control', 'no-store');
      await runChain(ctx, match.handlers);
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      throw new HttpError(405, 'الطريقة غير مسموحة.');
    }
    serveStatic(ctx);
  } catch (error) {
    handleError(res, error);
  }
});

// تنظيف الجلسات المنتهية كل 15 دقيقة.
const cleanupTimer = setInterval(cleanupExpiredSessions, 15 * 60 * 1000);
cleanupTimer.unref();

server.listen(PORT, () => {
  console.log(`CHRVVIM CAMPUS يعمل على http://localhost:${PORT}`);
});

export { server, router };
