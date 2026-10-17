// ==========================================================================
// فحص سلامة المشروع — يتحقق من الملفات وهيكل البيانات دون تبعيات.
// يُستعمل كأمر بناء (netlify) وكاختبار سريع محلي:  node scripts/check.mjs
// ==========================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WEB = path.join(ROOT, 'web');

let errors = 0;
let warnings = 0;
const ok = (msg) => console.log(`  \u2713 ${msg}`);
const fail = (msg) => { errors += 1; console.error(`  \u2717 ${msg}`); };
const warn = (msg) => { warnings += 1; console.warn(`  ! ${msg}`); };

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}
function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch (error) {
    fail(`${rel} — JSON غير صالح: ${error.message}`);
    return null;
  }
}

console.log('CHRVVIM CAMPUS — فحص المشروع\n');

// --- 1) الملفات الأساسية -------------------------------------------------
console.log('[1] الملفات الأساسية');
const REQUIRED = [
  'package.json',
  'netlify.toml',
  'server/index.mjs',
  'server/seed.mjs',
  'server/config.mjs',
  'server/lib/db.mjs',
  'server/lib/http.mjs',
  'server/lib/router.mjs',
  'server/lib/security.mjs',
  'server/lib/session.mjs',
  'server/lib/validate.mjs',
  'server/routes/public.mjs',
  'server/routes/auth.mjs',
  'server/routes/admin.mjs',
  'server/services/audit.mjs',
  'server/services/ai.mjs',
  'web/index.html',
  'web/404.html',
  'web/manifest.webmanifest',
  'web/sw.js',
  'web/assets/css/app.css',
  'web/assets/js/app.js',
  'web/assets/js/views.js',
  'web/assets/js/subjects-engine.js',
  'web/assets/js/subjects-view.js',
  'web/assets/js/data.js',
  'web/assets/js/store.js',
  'web/assets/js/i18n.js',
  'web/assets/js/util.js',
  'web/assets/js/gate.js',
  'web/assets/img/founder.jpeg',
  'web/admin/index.html',
  'web/admin/admin.css',
  'web/admin/admin.js',
];
for (const rel of REQUIRED) {
  if (exists(rel)) ok(rel);
  else fail(`مفقود: ${rel}`);
}

// --- 2) ملفات البيانات ---------------------------------------------------
console.log('\n[2] ملفات البيانات (JSON)');
const guide = readJson('web/data/academic-guide.json');
const docsFile = readJson('web/data/academic-documents.json');
const announcements = readJson('web/data/announcements.json');
const founder = readJson('web/data/founder-profile.json');
const siteConfig = readJson('web/data/site-config.json');
readJson('web/data/academic-guide-public.json');
readJson('web/data/timetable-s3-draft.json');
const subjectsCfg = readJson('web/data/subjects-correspondence.json');
if (subjectsCfg) {
  const subs = Array.isArray(subjectsCfg.subjects) ? subjectsCfg.subjects : [];
  const ids = new Set(subs.map((s) => s.id));
  if (subs.length && ids.size === subs.length) ok(`المواد والمقابلات: ${subs.length} مادة · ${(subjectsCfg.tracks || []).length} مسلك`);
  else if (!subs.length) fail('subjects-correspondence.json بلا مواد');
  else fail('subjects-correspondence.json: معرّفات مكرّرة');
  const badConf = subs.filter((s) => !['confirmed', 'needs_review'].includes(s.confidence));
  if (badConf.length) fail(`confidence غير صالح في ${badConf.length} مادة`);
  else ok('حقل confidence صالح في كل المواد');
}

// --- 3) هيكل الدليل الأكاديمي -------------------------------------------
console.log('\n[3] هيكل الدليل الأكاديمي');
let scheduleCount = 0;
let courseCount = 0;
let rangeCount = 0;
if (guide) {
  if (guide.meta?.academic_year) ok(`الموسم الجامعي: ${guide.meta.academic_year}`);
  else warn('meta.academic_year مفقود.');

  const sections = guide.sections || {};
  if (!sections.private || !sections.public) fail('sections.private / sections.public مفقودان.');
  else ok('الأقسام: private + public');

  if (!Array.isArray(guide.days) || !guide.days.length) fail('days مفقود أو فارغ.');
  else ok(`الأيام: ${guide.days.length}`);

  const semesters = guide.semesters || {};
  const semKeys = Object.keys(semesters);
  if (!semKeys.length) fail('لا توجد سداسيات بمعرّفات (semesters).');
  else ok(`السداسيات: ${semKeys.join(', ')}`);

  for (const [semId, sem] of Object.entries(semesters)) {
    const tracks = sem.tracks || {};
    if (!Object.keys(tracks).length) { warn(`${semId}: لا مسالك.`); continue; }
    for (const [trackId, track] of Object.entries(tracks)) {
      if (track.type === 'schedule') {
        if (Array.isArray(track.schedule)) scheduleCount += track.schedule.length;
        else if (track.schedule_mode === 'per-group' && track.schedule && typeof track.schedule === 'object') {
          for (const list of Object.values(track.schedule)) if (Array.isArray(list)) scheduleCount += list.length;
        } else fail(`${semId}/${trackId}: schedule مفقود.`);
      } else if (track.type === 'pathway') {
        if (!Array.isArray(track.courses) || !track.courses.length) warn(`${semId}/${trackId}: مسار بلا مواد.`);
        else courseCount += track.courses.length;
      } else {
        warn(`${semId}/${trackId}: type غير معروف (${track.type}).`);
      }
      const ranges = Array.isArray(track.ranges) ? track.ranges.length : 0;
      const shared = sem.shared_ranges ? Object.values(sem.shared_ranges).reduce((n, r) => n + (Array.isArray(r) ? r.length : 0), 0) : 0;
      rangeCount += ranges + shared;
    }
  }
  ok(`حصص: ${scheduleCount} · مواد مسارات: ${courseCount} · حدود أفواج: ${rangeCount}`);
  if (!Array.isArray(guide.verification) || !guide.verification.length) warn('verification مفقود (ملاحظات التحقق).');
  else ok(`ملاحظات التحقق: ${guide.verification.length}`);
}

// --- 4) الوثائق: وجود ملفات PDF -----------------------------------------
console.log('\n[4] الوثائق الرسمية');
if (docsFile?.documents) {
  let missing = 0;
  for (const doc of docsFile.documents) {
    const rel = String(doc.file || '').replace(/^\/+/, '');
    if (!rel) { fail('وثيقة بلا مسار file.'); continue; }
    if (!fs.existsSync(path.join(WEB, rel))) { fail(`ملف الوثيقة مفقود: web/${rel}`); missing += 1; }
  }
  if (!missing) ok(`${docsFile.documents.length} وثيقة PDF موجودة.`);
} else {
  fail('academic-documents.json: مصفوفة documents مفقودة.');
}

// --- 5) الإعلانات وصفحة المؤسس ------------------------------------------
console.log('\n[5] الإعلانات وصفحة المؤسس');
if (Array.isArray(announcements?.items)) ok(`الإعلانات المضمّنة: ${announcements.items.length}`);
else warn('announcements.items مفقودة.');
if (founder?.name) ok(`الملف التعريفي: ${founder.name}`);
else warn('founder-profile.json غير مكتمل.');

if (siteConfig) {
  const links = Array.isArray(siteConfig.official_links) ? siteConfig.official_links.length : 0;
  if (links) ok(`الروابط الرسمية في site-config.json: ${links}`);
  else warn('site-config.json: official_links مفقودة.');
  if (siteConfig.gate && typeof siteConfig.gate.enabled === 'boolean') ok(`بوابة المتابعة: ${siteConfig.gate.enabled ? 'مفعّلة' : 'معطّلة'}`);
  else warn('site-config.json: إعداد gate مفقود.');
} else {
  warn('site-config.json غير موجود (تُستعمل القيم الافتراضية).');
}

// --- 6) فحص CSS/JS للمشاكل الشائعة --------------------------------------
console.log('\n[6] فحص الواجهة');
const appHtml = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
if (/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)/i.test(appHtml)) warn('index.html يحتوي على سكربت داخلي (سيحجبه CSP بالخادم).');
else ok('index.html بلا سكربتات داخلية (عدا JSON-LD).');
const adminHtml = fs.readFileSync(path.join(WEB, 'admin/index.html'), 'utf8');
if (/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)/i.test(adminHtml)) warn('admin/index.html يحتوي على سكربت داخلي.');
else ok('admin/index.html بلا سكربتات داخلية.');
if (!/type="module"/.test(appHtml)) warn('index.html لا يستعمل type="module".');
if (!/manifest\.webmanifest/.test(appHtml)) warn('index.html لا يربط manifest PWA.');
else ok('رابط PWA (manifest) موجود.');

// --- 7) تغطية الترجمة (ar/fr/en) ----------------------------------------
console.log('\n[7] تغطية الترجمة');
const i18nSrc = fs.readFileSync(path.join(WEB, 'assets/js/i18n.js'), 'utf8');
function langKeys(lang) {
  const m = i18nSrc.match(new RegExp(`\\n  ${lang}: \\{([\\s\\S]*?)\\n  \\},`));
  if (!m) return null;
  const keys = new Set();
  for (const km of m[1].matchAll(/'([^']+)':/g)) keys.add(km[1]);
  return keys;
}
const langSets = { ar: langKeys('ar'), fr: langKeys('fr'), en: langKeys('en') };
if (!langSets.ar || !langSets.fr || !langSets.en) {
  warn('تعذّر تحليل قاموس الترجمة في i18n.js.');
} else {
  const used = new Set();
  for (const m of appHtml.matchAll(/data-i18n(?:-ph)?="([^"]+)"/g)) used.add(m[1]);
  const jsFiles = ['app.js', 'views.js', 'gate.js']
    .map((f) => fs.readFileSync(path.join(WEB, 'assets/js', f), 'utf8')).join('\n');
  for (const m of jsFiles.matchAll(/\bt\(\s*'([^']+)'\s*\)/g)) used.add(m[1]);
  for (const m of jsFiles.matchAll(/\bt\(\s*"([^"]+)"\s*\)/g)) used.add(m[1]);

  const arMissing = [...used].filter((k) => !langSets.ar.has(k));
  if (arMissing.length) fail(`ar: مفاتيح مستعملة غير معرّفة: ${arMissing.join(', ')}`);
  let frEnMissing = 0;
  for (const lang of ['fr', 'en']) {
    const missing = [...used].filter((k) => !langSets[lang].has(k));
    if (missing.length) {
      frEnMissing += missing.length;
      warn(`${lang}: ${missing.length} مفتاح مفقود (يرجع للعربية): ${missing.slice(0, 8).join(', ')}`);
    }
  }
  if (!arMissing.length && !frEnMissing) ok(`التغطية كاملة: ${used.size} مفتاح مستعمل متوفّر في ar/fr/en.`);
}

// --- 8) تغطية ترجمة لوحة الإدارة + مساعد الصياغة -------------------------
console.log('\n[8] لوحة الإدارة (الترجمة + مساعد الصياغة)');
const adminSrc = fs.readFileSync(path.join(WEB, 'admin/admin.js'), 'utf8');
function adminLangKeys(lang) {
  const m = adminSrc.match(new RegExp(`\\n  ${lang}: \\{([\\s\\S]*?)\\n  \\},`));
  if (!m) return null;
  const keys = new Set();
  for (const km of m[1].matchAll(/'([a-zA-Z0-9_.]+)':/g)) keys.add(km[1]);
  return keys;
}
const adminSets = { ar: adminLangKeys('ar'), fr: adminLangKeys('fr'), en: adminLangKeys('en') };
if (!adminSets.ar || !adminSets.fr || !adminSets.en) {
  warn('تعذّر تحليل قاموس ترجمة لوحة الإدارة في admin.js.');
} else {
  const used = new Set();
  for (const m of adminHtml.matchAll(/data-i18n(?:-ph)?="([^"]+)"/g)) used.add(m[1]);
  for (const m of adminSrc.matchAll(/\bt\(\s*'([^']+)'\s*\)/g)) used.add(m[1]);
  for (const m of adminSrc.matchAll(/\bt\(\s*"([^"]+)"\s*\)/g)) used.add(m[1]);
  // عائلات مفاتيح ديناميكية: t(`st.${...}`) وهكذا.
  const families = [
    ['ai.tone.', ['formal', 'friendly', 'urgent', 'neutral']],
    ['st.', ['draft', 'published', 'archived']],
    ['kind.', ['info', 'warning', 'urgent', 'event']],
    ['roles.', ['admin', 'editor', 'publisher']],
  ];
  for (const [prefix, values] of families) {
    if (adminSrc.includes(`\`${prefix}\${`)) for (const v of values) used.add(prefix + v);
  }
  const arMiss = [...used].filter((k) => !adminSets.ar.has(k));
  if (arMiss.length) fail(`admin ar: مفاتيح مستعملة غير معرّفة: ${arMiss.join(', ')}`);
  let drift = 0;
  for (const key of adminSets.ar) {
    if (!adminSets.fr.has(key) || !adminSets.en.has(key)) drift += 1;
  }
  if (drift) warn(`admin: ${drift} مفتاح غير متطابق بين ar/fr/en.`);
  if (!arMiss.length && !drift) ok(`ترجمة اللوحة متطابقة: ${adminSets.ar.size} مفتاح في ar/fr/en.`);
  if (used.size && !arMiss.length) ok(`مفاتيح اللوحة المستعملة: ${used.size}.`);
}

if (!adminSrc.includes('/api/admin/ai/draft')) fail('admin.js لا يستدعي مسار الصياغة /api/admin/ai/draft.');
else ok('لوحة الإدارة مربوطة بمسار الصياغة /api/admin/ai/draft.');
const aiSrc = fs.readFileSync(path.join(ROOT, 'server/services/ai.mjs'), 'utf8');
if (!/export\s+async\s+function\s+generateDraft/.test(aiSrc) || !/export\s+function\s+localDraft/.test(aiSrc)) {
  fail('server/services/ai.mjs لا يصدّر generateDraft و localDraft.');
} else ok('خدمة الصياغة تصدّر generateDraft و localDraft.');

// --- 9) فحص صياغة (Syntax) كل ملفات JavaScript ---------------------------
console.log('\n[9] فحص صياغة ملفات JavaScript');
const jsFiles = [];
function collect(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const rel = path.posix.join(dir.split(path.sep).join('/'), entry.name);
    if (entry.isDirectory()) collect(path.join(dir, entry.name));
    else if (/\.m?js$/.test(entry.name)) jsFiles.push(rel);
  }
}
for (const dir of ['server', 'scripts', 'tests', 'web']) collect(dir);
let syntaxBad = 0;
for (const rel of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, rel)], { stdio: 'pipe' });
  } catch (error) {
    syntaxBad += 1;
    const detail = String(error.stderr || error.stdout || '').split('\n').slice(0, 2).join(' ').trim();
    fail(`صياغة ${rel}${detail ? ` — ${detail}` : ''}`);
  }
}
if (!syntaxBad) ok(`${jsFiles.length} ملف JS صياغته سليمة.`);

// --- الخلاصة -------------------------------------------------------------
console.log('\n----------------------------------------');
if (errors) {
  console.error(`فشل الفحص: ${errors} خطأ، ${warnings} تحذير.`);
  process.exit(1);
}
console.log(`نجح الفحص: 0 خطأ، ${warnings} تحذير.`);
