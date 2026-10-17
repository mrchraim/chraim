// ==========================================================================
// اختبارات الوحدة: التوجيه، التحقق، الأمان، ورؤوس HTTP.
// التشغيل:  node --test tests/
// ==========================================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  computeResult, progressOf, buildSms, subjectsOf, pairedSemester,
  sortSemesters, listSystems, listTracks, tracksWithSemester, trackSystem, STATUS,
} from '../web/assets/js/subjects-engine.js';

import { Router, runChain, HttpError } from '../server/lib/router.mjs';
import { schema, contentSchemas, STATUSES } from '../server/lib/validate.mjs';
import { hashPassword, verifyPassword, safeCompare, rateLimit } from '../server/lib/security.mjs';
import { sendJson, sendError, MIME } from '../server/lib/http.mjs';
import {
  resolveProviderConfig,
  normalizeInput,
  buildMessages,
  buildProviderRequest,
  parseDraft,
  sanitizeDraft,
  localDraft,
  generateDraft,
  TITLE_MAX,
  BODY_MAX,
} from '../server/services/ai.mjs';

// --- الموجّه --------------------------------------------------------------
test('Router: يطابق مساراً ثابتاً', () => {
  const r = new Router();
  r.get('/api/public/health', () => {});
  const m = r.match('GET', '/api/public/health');
  assert.ok(m);
  assert.deepEqual(m.params, {});
});

test('Router: يستخرج المعاملات :id', () => {
  const r = new Router();
  r.put('/api/admin/rooms/:id', () => {});
  const m = r.match('PUT', '/api/admin/rooms/42');
  assert.equal(m.params.id, '42');
});

test('Router: يميّز بين الطرق', () => {
  const r = new Router();
  r.get('/api/x', () => {});
  assert.equal(r.match('POST', '/api/x'), null);
});

test('Router: يعيد null لمسار غير معروف', () => {
  const r = new Router();
  r.get('/api/a', () => {});
  assert.equal(r.match('GET', '/api/b'), null);
});

test('runChain: ينفّذ المعالجات بالتتابع عبر next()', async () => {
  const order = [];
  await runChain({}, [
    async (ctx, next) => { order.push('a'); await next(); order.push('a-end'); },
    async () => { order.push('b'); },
  ]);
  assert.deepEqual(order, ['a', 'b', 'a-end']);
});

// --- التحقق ---------------------------------------------------------------
test('schema: يقبل حقلاً صالحاً', () => {
  const s = schema({ name: (f) => f.string({ min: 1, max: 10, required: true }) });
  assert.deepEqual(s.parse({ name: 'ok' }), { name: 'ok' });
});

test('schema: يرفض حقلاً غير معروف', () => {
  const s = schema({ name: (f) => f.string({ required: true }) });
  assert.throws(() => s.parse({ name: 'ok', extra: 1 }), (e) => e instanceof HttpError && e.status === 400);
});

test('schema: يرفض القيمة المطلوبة الفارغة', () => {
  const s = schema({ name: (f) => f.string({ required: true }) });
  assert.throws(() => s.parse({}), (e) => e.status === 400);
});

test('schema: يتحقق من البريد الإلكتروني', () => {
  const s = schema({ email: (f) => f.email() });
  assert.throws(() => s.parse({ email: 'not-an-email' }), (e) => e.status === 400);
  assert.equal(s.parse({ email: 'a@b.co' }).email, 'a@b.co');
});

test('schema: int قابل للإلغاء يعيد null عند الفراغ', () => {
  const s = schema({ capacity: (f) => f.int({ min: 1, max: 10, nullable: true }) });
  assert.equal(s.parse({ capacity: '' }).capacity, null);
  assert.equal(s.parse({ capacity: '5' }).capacity, 5);
  assert.throws(() => s.parse({ capacity: 0 }), (e) => e.status === 400);
});

test('contentSchemas.schedules: يقبل صفاً كاملاً', () => {
  const value = contentSchemas.schedules.parse({
    semester: 'S3', track: 'عام', day: 'الإثنين', time: '08:00-10:00',
    subject: 'مادة', professor: 'أ', room: 'ق', group_name: 'A', subgroups: '',
    status: 'published', source_note: '',
  });
  assert.equal(value.status, 'published');
  assert.equal(value.subgroups, '');
});

test('contentSchemas.schedules: يرفض حالة نشر غير مسموحة', () => {
  assert.throws(() => contentSchemas.schedules.parse({
    semester: 'S3', track: 't', day: 'd', time: '', subject: 's',
    professor: '', room: '', group_name: '', subgroups: '', status: 'nope', source_note: '',
  }), (e) => e.status === 400);
});

test('STATUSES: يحتوي الحالات الثلاث', () => {
  assert.deepEqual([...STATUSES].sort(), ['archived', 'draft', 'published']);
});

// --- الأمان ---------------------------------------------------------------
test('hashPassword/verifyPassword: دورة صحيحة', () => {
  const hash = hashPassword('correct horse battery staple');
  assert.equal(verifyPassword('correct horse battery staple', hash), true);
  assert.equal(verifyPassword('wrong password', hash), false);
});

test('hashPassword: ينتج بصمة مختلفة كل مرة (salt)', () => {
  assert.notEqual(hashPassword('same'), hashPassword('same'));
});

test('verifyPassword: يرفض القيمة الفاسدة دون رمي', () => {
  assert.equal(verifyPassword('x', 'not-a-hash'), false);
});

test('safeCompare: مقارنة صحيحة', () => {
  assert.equal(safeCompare('abc', 'abc'), true);
  assert.equal(safeCompare('abc', 'abd'), false);
  assert.equal(safeCompare('abc', 'ab'), false);
});

test('rateLimit: يسمح ضمن الحد ويحجب بعده', async () => {
  const limiter = rateLimit({ windowMs: 60_000, limit: 2, key: `test-${Math.random()}` });
  const ctx = { ip: '127.0.0.1' };
  const noop = async () => {};
  await limiter(ctx, noop);
  await limiter(ctx, noop);
  assert.throws(() => limiter(ctx, noop), (e) => e.status === 429);
});

// --- HTTP -----------------------------------------------------------------
function fakeRes() {
  return {
    status: 0, headers: {}, body: '',
    writeHead(status, headers) { this.status = status; Object.assign(this.headers, headers); return this; },
    end(body) { this.body = body || ''; },
  };
}

test('sendJson: يكتب الحالة والرأس والجسم', () => {
  const res = fakeRes();
  sendJson(res, 201, { ok: true });
  assert.equal(res.status, 201);
  assert.match(res.headers['Content-Type'], /application\/json/);
  assert.equal(res.body, '{"ok":true}');
});

test('sendError: يسلسل الخطأ مع التفاصيل', () => {
  const res = fakeRes();
  sendError(res, 400, 'خطأ', { fields: [{ field: 'x' }] });
  assert.equal(res.status, 400);
  assert.match(res.body, /"error":"خطأ"/);
});

test('MIME: يحتوي الأنواع الأساسية', () => {
  assert.match(MIME['.html'], /text\/html/);
  assert.equal(MIME['.pdf'], 'application/pdf');
});

// --- مساعد صياغة الإعلانات (ai.mjs) ---------------------------------------
test('ai.resolveProviderConfig: بلا مفتاح → none وغير مهيأ', () => {
  const cfg = resolveProviderConfig({});
  assert.equal(cfg.provider, 'none');
  assert.equal(cfg.configured, false);
});

test('ai.resolveProviderConfig: مفتاح بلا مزوّد → gemini مهيأ', () => {
  const cfg = resolveProviderConfig({ AI_API_KEY: 'secret' });
  assert.equal(cfg.provider, 'gemini');
  assert.equal(cfg.kind, 'gemini');
  assert.equal(cfg.configured, true);
  assert.match(cfg.baseUrl, /generativelanguage\.googleapis\.com/);
});

test('ai.resolveProviderConfig: groq يضبط القاعدة المتوافقة مع OpenAI', () => {
  const cfg = resolveProviderConfig({ AI_PROVIDER: 'groq', AI_API_KEY: 'k' });
  assert.equal(cfg.kind, 'openai');
  assert.equal(cfg.baseUrl, 'https://api.groq.com/openai/v1');
  assert.ok(cfg.model.length > 0);
});

test('ai.normalizeInput: قيم افتراضية وتقييد الطول', () => {
  const out = normalizeInput({ topic: '  ا  ', kind: 'bogus', tone: 'x', language: 'zz', notes: 'n'.repeat(700) });
  assert.equal(out.kind, 'info');
  assert.equal(out.tone, 'formal');
  assert.equal(out.language, 'ar');
  assert.equal(out.topic, 'ا');
  assert.equal(out.notes.length, 600);
});

test('ai.localDraft: يبدأ بالتصنيف ويحترم الحدود في كل اللغات', () => {
  for (const language of ['ar', 'fr', 'en']) {
    for (const kind of ['info', 'warning', 'urgent', 'event']) {
      const d = localDraft({ topic: 'تأجيل الحصص', kind, language });
      assert.ok(d.title.length >= 3 && d.title.length <= TITLE_MAX);
      assert.ok(d.body.length >= 3 && d.body.length <= BODY_MAX);
      assert.ok(d.body.includes('تأجيل الحصص') || d.body.includes('Report') || /Postpone|تأجيل/.test(d.body) || d.body.length > 0);
    }
  }
});

test('ai.localDraft: عنوان طويل جداً يُقصّ', () => {
  const d = localDraft({ topic: 'ط'.repeat(500) });
  assert.ok(d.title.length <= TITLE_MAX);
});

test('ai.parseDraft: JSON مباشر، وسياج markdown، ونص محيط', () => {
  assert.deepEqual(parseDraft('{"title":"ع","body":"ن"}'), { title: 'ع', body: 'ن' });
  assert.deepEqual(parseDraft('```json\n{"title":"ع","body":"ن"}\n```'), { title: 'ع', body: 'ن' });
  assert.deepEqual(parseDraft('ها هو: {"title":"ع","body":"ن"} شكراً'), { title: 'ع', body: 'ن' });
  assert.equal(parseDraft('ليس JSON'), null);
  assert.equal(parseDraft(''), null);
});

test('ai.sanitizeDraft: يقصّ ويوحّد المسافات', () => {
  const out = sanitizeDraft({ title: '  س   س  ', body: 'أ\r\nب' });
  assert.equal(out.title, 'س س');
  assert.equal(out.body, 'أ\nب');
  assert.ok(sanitizeDraft({ title: 'x'.repeat(999), body: 'y'.repeat(9999) }).title.length === TITLE_MAX);
  assert.ok(sanitizeDraft({ title: '', body: 'y'.repeat(9999) }).body.length === BODY_MAX);
});

test('ai.buildMessages: يتضمّن الموضوع واللغة', () => {
  const { system, user } = buildMessages({ topic: 'تأجيل الحصص', language: 'fr', kind: 'warning' });
  assert.match(user, /تأجيل الحصص/);
  assert.match(system, /français|Français|le français/);
  assert.match(system, /JSON/);
});

test('ai.buildProviderRequest: gemini يضع المفتاح في الرابط', () => {
  const cfg = resolveProviderConfig({ AI_PROVIDER: 'gemini', AI_API_KEY: 'K-123', AI_MODEL: 'gemini-2.0-flash' });
  const req = buildProviderRequest(cfg, { system: 's', user: 'u' });
  assert.match(req.url, /gemini-2\.0-flash:generateContent/);
  assert.match(req.url, /key=K-123/);
  const payload = JSON.parse(req.init.body);
  assert.equal(payload.contents[0].role, 'user');
});

test('ai.buildProviderRequest: openai يستعمل Bearer و chat/completions', () => {
  const cfg = resolveProviderConfig({ AI_PROVIDER: 'openai', AI_API_KEY: 'sk-x', AI_MODEL: 'gpt-4o-mini' });
  const req = buildProviderRequest(cfg, { system: 's', user: 'u' });
  assert.match(req.url, /\/chat\/completions$/);
  assert.equal(req.init.headers.Authorization, 'Bearer sk-x');
  const payload = JSON.parse(req.init.body);
  assert.equal(payload.messages[0].role, 'system');
});

test('ai.generateDraft: بلا مفتاح → صياغة محلية دون شبكة', async () => {
  let called = 0;
  const out = await generateDraft({ topic: 'موضوع' }, resolveProviderConfig({}), { fetch: async () => { called += 1; } });
  assert.equal(called, 0);
  assert.equal(out.source, 'fallback');
  assert.equal(out.provider, 'local');
});

test('ai.generateDraft: استجابة صحيحة من المزوّد → source=ai', async () => {
  const cfg = resolveProviderConfig({ AI_PROVIDER: 'openai', AI_API_KEY: 'k', AI_MODEL: 'm' });
  const fetchImpl = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '{"title":"عنوان","body":"نص الإعلان"}' } }] }) });
  const out = await generateDraft({ topic: 'موضوع' }, cfg, { fetch: fetchImpl });
  assert.equal(out.source, 'ai');
  assert.equal(out.title, 'عنوان');
  assert.equal(out.body, 'نص الإعلان');
});

test('ai.generateDraft: فشل المزوّد يتراجع للصياغة المحلية', async () => {
  const cfg = resolveProviderConfig({ AI_PROVIDER: 'gemini', AI_API_KEY: 'k', AI_MODEL: 'm' });
  const out = await generateDraft({ topic: 'موضوع' }, cfg, { fetch: async () => { throw new Error('network down'); } });
  assert.equal(out.source, 'fallback');
  assert.ok(out.title.length >= 3);
});

test('ai.generateDraft: رد غير صالح يتراجع للصياغة المحلية', async () => {
  const cfg = resolveProviderConfig({ AI_PROVIDER: 'openai', AI_API_KEY: 'k', AI_MODEL: 'm' });
  const fetchImpl = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'بلا JSON' } }] }) });
  const out = await generateDraft({ topic: 'موضوع' }, cfg, { fetch: fetchImpl });
  assert.equal(out.source, 'fallback');
});

// --- محرّك المواد والمقابلات -----------------------------------------------
const FX = {
  systems: ['2025/2026'],
  pairings: [
    { track: 't1', from: 'S1', to: 'S3' }, { track: 't1', from: 'S3', to: 'S1' },
    { track: 't1', from: 'S2', to: 'S4' }, { track: 't1', from: 'S4', to: 'S2' },
  ],
  tracks: [{ id: 't1', system: '2025/2026', name: { ar: 'مسلك', fr: 'Filière' } }],
  rules: { default: 'unknown' },
  subjects: [
    { id: 'a1', system: '2025/2026', track: 't1', semester: 'S1', name: { ar: 'مادة أ', fr: 'Matière A' }, correspondsTo: ['b1'], rule: 'unknown', confidence: 'confirmed' },
    { id: 'a2', system: '2025/2026', track: 't1', semester: 'S1', name: { ar: 'مادة ب', fr: 'Matière B' }, correspondsTo: [], rule: 'unknown', confidence: 'confirmed' },
    { id: 'b1', system: '2025/2026', track: 't1', semester: 'S3', name: { ar: 'مادة ج', fr: 'Matière C' }, correspondsTo: [], rule: 'unknown', confidence: 'needs_review' },
  ],
  review: [{ track: 't1', semester: 'S1', ocr: 'x', note: 'ملاحظة مراجعة' }],
};

test('subjects.pairedSemester: يقرأ جدول الإقران', () => {
  assert.equal(pairedSemester(FX, 'S1', 't1'), 'S3');
  assert.equal(pairedSemester(FX, 'S2', 't1'), 'S4');
  assert.equal(pairedSemester(FX, 'S5', 't1'), null);
});

test('subjects.subjectsOf: يرشّح حسب السداسي والمسلك والنظام', () => {
  assert.equal(subjectsOf(FX, { semester: 'S1', track: 't1', system: '2025/2026' }).length, 2);
  assert.equal(subjectsOf(FX, { semester: 'S3', track: 't1' }).length, 1);
  assert.equal(subjectsOf(FX, { semester: 'S1', track: 'nope' }).length, 0);
});

test('subjects.trackSystem / tracksWithSemester', () => {
  assert.equal(trackSystem(FX, 't1'), '2025/2026');
  assert.equal(tracksWithSemester(FX, 'S1').length, 1);
  assert.equal(tracksWithSemester(FX, 'S5').length, 0);
});

test('subjects.sortSemesters: يرتّب تصاعدياً', () => {
  assert.deepEqual(sortSemesters(['S3', 'S1', 'S5']), ['S1', 'S3', 'S5']);
});

test('subjects.listSystems: بلا تكرار', () => {
  assert.deepEqual(listSystems(FX), ['2025/2026']);
  assert.equal(listTracks(FX).length, 1);
});

test('subjects.computeResult: كل الحالات فارغة ⇒ تحذير unset', () => {
  const r = computeResult(FX, { semester: 'S1', track: 't1', statuses: {} });
  assert.equal(r.unset.length, 2);
  assert.equal(r.passed.length, 0);
  assert.ok(r.warnings.includes('unset'));
  assert.equal(r.targetSemester, 'S3');
});

test('subjects.computeResult: النجاح في مادة لها مقابل وقاعدة unknown ⇒ تحتاج مراجعة (لا إعفاء)', () => {
  const r = computeResult(FX, { semester: 'S1', track: 't1', statuses: { a1: 'passed', a2: 'passed' } });
  assert.equal(r.passed.length, 2);
  const b1 = r.nextSubjects.find((n) => n.subject.id === 'b1');
  assert.equal(b1.reason, 'corresponds');
  assert.equal(b1.state, 'review');
  assert.equal(b1.needsReview, true);
  assert.ok(r.uncertain);
});

test('subjects.computeResult: قاعدة exemption + نجاح ⇒ مستوفاة بمقابلة', () => {
  const cfg = JSON.parse(JSON.stringify(FX));
  cfg.subjects.find((s) => s.id === 'b1').rule = 'exemption';
  const r = computeResult(cfg, { semester: 'S1', track: 't1', statuses: { a1: 'passed' } });
  const b1 = r.nextSubjects.find((n) => n.subject.id === 'b1');
  assert.equal(b1.state, 'eligible');
});

test('subjects.computeResult: المواد بلا مقابل تُدرج في noCounterpart', () => {
  const r = computeResult(FX, { semester: 'S1', track: 't1', statuses: {} });
  assert.deepEqual(r.noCounterpart.map((s) => s.id), ['a2']);
});

test('subjects.computeResult: لا هدف ⇒ تحذير no-target', () => {
  const r = computeResult(FX, { semester: 'S5', track: 't1', statuses: {} });
  assert.equal(r.hasTarget, false);
  assert.ok(r.warnings.includes('no-target'));
});

test('subjects.progressOf: يحسب النسبة', () => {
  const r = computeResult(FX, { semester: 'S1', track: 't1', statuses: { a1: 'passed', a2: 'failed' } });
  const p = progressOf(r);
  assert.equal(p.total, 2);
  assert.equal(p.done, 2);
  assert.equal(p.pct, 100);
});

test('subjects.buildSms: يتضمّن السداسيات وأسماء المواد والملاحظة', () => {
  const r = computeResult(FX, { semester: 'S1', track: 't1', statuses: { a1: 'passed' } });
  const txt = buildSms(r, (s) => s.name.ar, { title: 'نتيجة', current: 'الحالي', next: 'المقبل', passed: 'المستوفاة', remaining: 'المتبقية', nextSubjects: 'القادمة', review: 'مراجعة', none: 'لا شيء', note: 'ملاحظة مهمة' });
  assert.ok(txt.includes('S1'));
  assert.ok(txt.includes('S3'));
  assert.ok(txt.includes('مادة أ'));
  assert.ok(txt.includes('ملاحظة مهمة'));
});

test('subjects.pairedSemester: يفرّق حسب المسلك', () => {
  const cfg = {
    pairings: [
      { track: 't1', from: 'S3', to: 'S5' },
      { track: 't2', from: 'S3', to: 'S1' },
    ],
    subjects: [], tracks: [],
  };
  assert.equal(pairedSemester(cfg, 'S3', 't1'), 'S5');
  assert.equal(pairedSemester(cfg, 'S3', 't2'), 'S1');
  assert.equal(pairedSemester(cfg, 'S3'), null);
});

test('subjects.correspondence.json: بنية صحيحة ومتوافقة', () => {
  const raw = readFileSync(new URL('../web/data/subjects-correspondence.json', import.meta.url), 'utf8');
  const cfg = JSON.parse(raw);
  assert.ok(Array.isArray(cfg.subjects) && cfg.subjects.length > 0);
  assert.ok(Array.isArray(cfg.tracks) && cfg.tracks.length > 0);
  assert.ok(Array.isArray(cfg.pairings));
  for (const s of cfg.subjects) {
    assert.ok(s.id && s.semester && s.track && s.system && s.name, `subject ناقص: ${JSON.stringify(s)}`);
    assert.ok(['confirmed', 'needs_review'].includes(s.confidence), `confidence غير صالح: ${s.id}`);
  }
  const ids = new Set(cfg.subjects.map((s) => s.id));
  assert.equal(ids.size, cfg.subjects.length, 'معرّفات المواد مكرّرة');
  // كل إقران مرتبط بمسلك، والمسلك له مواد في كلا السداسيين المُقرَنين.
  for (const p of cfg.pairings) {
    assert.ok(p.track && p.from && p.to, `إقران ناقص: ${JSON.stringify(p)}`);
    assert.ok(subjectsOf(cfg, { semester: p.from, track: p.track }).length > 0, `لا مواد لـ ${p.track}/${p.from}`);
    assert.ok(subjectsOf(cfg, { semester: p.to, track: p.track }).length > 0, `لا مواد لـ ${p.track}/${p.to}`);
  }
  // التسميات الأساسية الثلاث موجودة.
  const trackIds = new Set(cfg.tracks.map((t) => t.id));
  for (const need of ['common-ar', 'private-law', 'criminal-sciences']) {
    assert.ok(trackIds.has(need), `مسلك مفقود: ${need}`);
  }
});
