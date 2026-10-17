// ==========================================================================
// اختبار دخان شامل (Smoke test):
//   1) تهيئة قاعدة بيانات مؤقتة (seed).
//   2) تشغيل الخادم على منفذ مؤقت.
//   3) اختبار الملفات الثابتة + API العامة + API الإدارية (دخول، CRUD، صلاحيات).
//   4) اختبار مساعد صياغة الإعلانات (ai/status + ai/draft).
// التشغيل:  node scripts/smoke.mjs
// ==========================================================================
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = 3400 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const SECRET = 'smoke-test-secret-at-least-32-characters-long';
const ADMIN_EMAIL = 'smoke-admin@chrvvim.local';
const ADMIN_PASSWORD = 'Smoke-Test-Admin-2026!';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrvvim-smoke-'));
const dbPath = path.join(tmpDir, 'smoke.sqlite');

let passed = 0;
let failed = 0;
const check = (name, cond, detail = '') => {
  if (cond) { passed += 1; console.log(`  \u2713 ${name}`); }
  else { failed += 1; console.error(`  \u2717 ${name}${detail ? ` — ${detail}` : ''}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function runNode(args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => resolve({ code, out }));
  });
}

const baseEnv = { DATABASE_PATH: dbPath, SESSION_SECRET: SECRET, PORT: String(PORT) };

// --- عميل HTTP مع إدارة ملف تعريف الارتباط ------------------------------
let cookie = '';
async function request(method, url, { body, headers = {}, raw = false } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (cookie) h.Cookie = cookie;
  const res = await fetch(`${BASE}${url}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  if (raw) return { status: res.status, res };
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

let child = null;
const cleanup = () => {
  if (child && !child.killed) child.kill();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
};

async function main() {
  console.log('CHRVVIM CAMPUS — اختبار الدخان\n');
  console.log(`[0] تهيئة قاعدة بيانات مؤقتة: ${dbPath}`);
  const seed = await runNode(['server/seed.mjs'], { ...baseEnv, ADMIN_EMAIL, ADMIN_PASSWORD });
  check('تهيئة البيانات (seed) نجحت', seed.code === 0, seed.out.slice(-300));
  if (seed.code !== 0) { cleanup(); process.exit(1); }

  // فحص تحميل .env (محمي: لا يُنفَّذ إن وُجد ملف .env حقيقي).
  const envFile = path.join(ROOT, '.env');
  if (fs.existsSync(envFile)) {
    console.log('  • تخطّي فحص .env (يوجد ملف .env حقيقي).');
  } else {
    fs.writeFileSync(envFile, 'CHRVVIM_ENV_PROBE=from-dotenv\n', 'utf8');
    try {
      const cfgUrl = pathToFileURL(path.join(ROOT, 'server/config.mjs')).href;
      const probe = `import(${JSON.stringify(cfgUrl)}).then(() => process.stdout.write(String(process.env.CHRVVIM_ENV_PROBE || '')))`;
      const a = await runNode(['-e', probe]);
      check('.env يُحمَّل تلقائياً', a.code === 0 && a.out.trim() === 'from-dotenv', a.out.slice(-200));
      const b = await runNode(['-e', probe], { CHRVVIM_ENV_PROBE: 'from-env' });
      check('متغيّر البيئة له الأولوية على .env', b.code === 0 && b.out.trim() === 'from-env', b.out.slice(-200));
    } finally {
      try { fs.unlinkSync(envFile); } catch { /* ignore */ }
    }
  }

  console.log(`\n[start] تشغيل الخادم على المنفذ ${PORT}`);
  child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: ROOT, env: { ...process.env, ...baseEnv }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (d) => process.stderr.write(`  [server] ${d}`));

  // انتظار جاهزية الخادم.
  let ready = false;
  for (let i = 0; i < 60; i += 1) {
    await sleep(250);
    try {
      const r = await fetch(`${BASE}/api/public/health`);
      if (r.ok) { ready = true; break; }
    } catch { /* retry */ }
  }
  check('الخادم جاهز', ready);
  if (!ready) { cleanup(); process.exit(1); }

  // --- 1) الملفات الثابتة -------------------------------------------------
  console.log('\n[1] الملفات الثابتة');
  {
    const r = await request('GET', '/', { raw: true });
    const html = await r.res.text();
    check('GET / → 200 HTML', r.status === 200 && /CHRVVIM/.test(html));
  }
  {
    const r = await request('GET', '/assets/css/app.css');
    check('GET /assets/css/app.css → 200', r.status === 200);
  }
  {
    const r = await request('GET', '/admin/', { raw: true });
    const html = await r.res.text();
    check('GET /admin/ → 200', r.status === 200 && /admin\.js/.test(html));
  }
  {
    const r = await request('GET', '/data/academic-guide.json');
    check('GET /data/academic-guide.json → 200', r.status === 200);
  }
  {
    const r = await request('GET', '/data/subjects-correspondence.json');
    check('GET /data/subjects-correspondence.json → 200 + مواد', r.status === 200 && Array.isArray(r.data?.subjects) && r.data.subjects.length > 0);
  }
  {
    const r = await request('GET', '/no-such-page-xyz', { raw: true });
    check('صفحة غير موجودة → 404', r.status === 404);
  }

  // --- 2) API العامة -----------------------------------------------------
  console.log('\n[2] API العامة');
  {
    const r = await request('GET', '/api/public/meta');
    check('meta: api=true', r.status === 200 && r.data?.capabilities?.api === true);
    check('meta: counts موجودة', Boolean(r.data?.counts));
  }
  {
    const r = await request('GET', '/api/public/guide');
    check('guide: يحتوي semesters', r.status === 200 && Boolean(r.data?.semesters));
  }
  {
    const r = await request('GET', '/api/public/documents');
    check('documents: ≥1 وثيقة', r.status === 200 && Array.isArray(r.data?.items) && r.data.items.length >= 1);
    if (r.data?.items?.[0]?.file) {
      const doc = await request('GET', `/${String(r.data.items[0].file).replace(/^\/+/, '')}`, { raw: true });
      check('تحميل أول وثيقة PDF → 200', doc.status === 200);
    }
  }
  {
    const r = await request('GET', '/api/public/schedules?semester=S3');
    check('schedules S3: مصفوفة', r.status === 200 && Array.isArray(r.data?.items));
  }
  {
    const r = await request('GET', '/api/public/courses');
    check('courses: مصفوفة', r.status === 200 && Array.isArray(r.data?.items));
  }

  // --- 3) الحماية والصلاحيات ---------------------------------------------
  console.log('\n[3] الحماية (CSRF/الجلسة/الصلاحيات)');
  {
    const r = await request('GET', '/api/admin/csrf');
    check('csrf: يولّد رمزاً', r.status === 200 && typeof r.data?.csrfToken === 'string' && r.data.csrfToken.length > 0);
  }
  {
    const pre = await request('GET', '/api/admin/csrf');
    const token = pre.data?.csrfToken || '';
    const r = await request('POST', '/api/admin/login', { headers: { 'X-CSRF-Token': token }, body: { email: ADMIN_EMAIL, password: 'wrong-password-000' } });
    check('دخول خاطئ → 401', r.status === 401);
  }
  {
    const r = await request('POST', '/api/admin/schedules', { body: {} });
    check('طلب تعديل بلا رمز CSRF → 403', r.status === 403);
  }
  {
    const pre = await request('GET', '/api/admin/csrf');
    const token = pre.data?.csrfToken || '';
    const r = await request('POST', '/api/admin/ai/draft', { headers: { 'X-CSRF-Token': token }, body: { topic: 'اختبار الصلاحيات' } });
    check('ai/draft بلا جلسة → 401', r.status === 401);
  }
  let csrf = '';
  {
    const r = await request('GET', '/api/admin/csrf');
    csrf = r.data?.csrfToken || '';
    const login = await request('POST', '/api/admin/login', { headers: { 'X-CSRF-Token': csrf }, body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    check('دخول صحيح → 200', login.status === 200 && login.data?.ok === true);
    csrf = login.data?.csrfToken || csrf;
  }
  {
    const r = await request('GET', '/api/admin/me');
    check('me: مصادق عليه', r.status === 200 && r.data?.authenticated === true);
  }
  {
    const r = await request('GET', '/api/admin/users');
    check('users: متاح للمدير', r.status === 200 && Array.isArray(r.data?.items));
  }
  {
    const r = await request('GET', '/api/admin/audit');
    check('audit: متاح للمدير', r.status === 200 && Array.isArray(r.data?.items));
  }

  // --- 4) CRUD مع رمز CSRF ------------------------------------------------
  console.log('\n[4] إدارة المحتوى (CRUD)');
  let createdId = null;
  {
    const r = await request('POST', '/api/admin/rooms', {
      headers: { 'X-CSRF-Token': csrf },
      body: { name: 'قاعة اختبار', building: 'الملحقة', capacity: 40, notes: '', status: 'draft' },
    });
    createdId = r.data?.item?.id ?? null;
    check('إنشاء قاعة → 201', r.status === 201 && createdId != null);
  }
  {
    const r = await request('PUT', `/api/admin/rooms/${createdId}`, {
      headers: { 'X-CSRF-Token': csrf },
      body: { name: 'قاعة اختبار محدّثة', building: 'الملحقة', capacity: 45, notes: '', status: 'published' },
    });
    check('تحديث القاعة → 200', r.status === 200 && r.data?.item?.name === 'قاعة اختبار محدّثة');
  }
  {
    const r = await request('GET', '/api/admin/rooms?q=اختبار');
    check('بحث في السجلات', r.status === 200 && Array.isArray(r.data?.items));
  }
  {
    const r = await request('POST', '/api/admin/rooms', {
      headers: { 'X-CSRF-Token': csrf },
      body: { name: 'x', building: '', capacity: 10, notes: '', status: 'draft', bogus_field: 1 },
    });
    check('حقل غير معروف → 400', r.status === 400);
  }
  {
    const r = await request('DELETE', `/api/admin/rooms/${createdId}`, { headers: { 'X-CSRF-Token': csrf }, body: '{}' });
    check('حذف القاعة → 200', r.status === 200);
  }
  {
    const r = await request('POST', '/api/admin/rooms/publish-all', { headers: { 'X-CSRF-Token': csrf }, body: '{}' });
    check('نشر جماعي → 200', r.status === 200 && r.data?.ok === true);
  }

  // --- 5) مساعد صياغة الإعلانات (ذكاء اصطناعي / صياغة محلية) ------------
  console.log('\n[5] مساعد صياغة الإعلانات');
  {
    const r = await request('GET', '/api/admin/ai/status');
    check('ai/status: 200 + configured منطقي', r.status === 200 && typeof r.data?.configured === 'boolean');
  }
  {
    const r = await request('POST', '/api/admin/ai/draft', {
      headers: { 'X-CSRF-Token': csrf },
      body: { topic: 'تأجيل حصص السداسي الثالث إلى الأسبوع المقبل', kind: 'warning', language: 'ar' },
    });
    check('ai/draft: 200 + عنوان ونص صالحان',
      r.status === 200 && typeof r.data?.title === 'string' && r.data.title.length >= 3
      && typeof r.data?.body === 'string' && r.data.body.length >= 3);
    check('ai/draft: source ∈ {ai, fallback}', ['ai', 'fallback'].includes(r.data?.source));
  }
  {
    const r = await request('POST', '/api/admin/ai/draft', { headers: { 'X-CSRF-Token': csrf }, body: { topic: '' } });
    check('ai/draft بدون موضوع → 400', r.status === 400);
  }
  {
    const r = await request('POST', '/api/admin/ai/draft', { body: { topic: 'اختبار' } });
    check('ai/draft بلا رمز CSRF → 403', r.status === 403);
  }
  {
    const r = await request('POST', '/api/admin/logout', { headers: { 'X-CSRF-Token': csrf }, body: '{}' });
    check('تسجيل الخروج → 200', r.status === 200);
  }

  console.log('\n----------------------------------------');
  if (failed) {
    console.error(`فشل اختبار الدخان: ${passed} نجح، ${failed} فشل.`);
    cleanup();
    process.exit(1);
  }
  console.log(`نجح اختبار الدخان بالكامل: ${passed} اختبار.`);
  cleanup();
  process.exit(0);
}

process.on('SIGINT', () => { cleanup(); process.exit(130); });

main().catch((error) => {
  console.error(error);
  cleanup();
  process.exit(1);
});
