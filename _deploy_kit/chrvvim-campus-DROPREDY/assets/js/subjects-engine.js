// ==========================================================================
// محرّك حساب المواد والمقابلات — منطق صافٍ بلا DOM (قابل للاختبار مستقلاً).
// لا يُصدر أي قرار إعفاء/رسوب ما لم تكن القاعدة الأكاديمية مؤكّدة.
// ==========================================================================

export const SEMESTERS_ALL = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

export const STATUS = Object.freeze({
  passed: 'passed',   // ✅ اجتزت
  failed: 'failed',   // ❌ لم أنجح / لم أستوفِ
  pending: 'pending', // ⏳ لم أجتز بعد
  na: 'na',           // ➖ غير معني
  unset: 'unset',     // لم يُحدَّد
});

export const STATUS_LIST = [STATUS.passed, STATUS.failed, STATUS.pending, STATUS.na];

/** القواعد التي تسمح باعتبار مادة مقابلة مستوفاة. */
const EXEMPTING_RULES = new Set(['equivalence', 'compensation', 'exemption']);

function cfgOf(cfg) {
  return cfg && typeof cfg === 'object' ? cfg : { subjects: [], tracks: [], pairings: [] };
}

export function listTracks(cfg, system) {
  const c = cfgOf(cfg);
  return (c.tracks || []).filter((t) => !system || t.system === system);
}

export function listSystems(cfg) {
  const c = cfgOf(cfg);
  if (Array.isArray(c.systems) && c.systems.length) return c.systems.slice();
  return [...new Set((c.tracks || []).map((t) => t.system).filter(Boolean))];
}

export function trackSystem(cfg, trackId) {
  const t = (cfgOf(cfg).tracks || []).find((x) => x.id === trackId);
  return t ? t.system : '';
}

/** المواد المتوفّرة لسداسٍ ومسلك ونظام محدّدين. */
export function subjectsOf(cfg, { semester, track, system } = {}) {
  return (cfgOf(cfg).subjects || []).filter((s) => (
    s.semester === semester
    && (!track || s.track === track)
    && (!system || !s.system || s.system === system)
  ));
}

/** المسالك المتوفّرة لسداسٍ معيّن. */
export function tracksWithSemester(cfg, semester, system) {
  const c = cfgOf(cfg);
  const ids = new Set(subjectsOf(c, { semester, system }).map((s) => s.track));
  return listTracks(c, system).filter((t) => ids.has(t.id));
}

/** السداسي المقابل (المُقرَن) حسب جدول pairings، مع مراعاة المسلك. */
export function pairedSemester(cfg, semester, track) {
  const list = (cfgOf(cfg).pairings || []).filter((x) => (x.track || '') === (track || ''));
  const p = list.find((x) => x.from === semester);
  return p ? p.to : null;
}

export function subjectById(cfg, id) {
  return (cfgOf(cfg).subjects || []).find((s) => s.id === id) || null;
}

/** ترتيب السداسيات تصاعدياً. */
export function sortSemesters(list) {
  return [...new Set(list)].sort((a, b) => SEMESTERS_ALL.indexOf(a) - SEMESTERS_ALL.indexOf(b));
}

/**
 * حساب وضعية الطالب.
 * @returns {{
 *   semester, targetSemester, track, system,
 *   passed, failed, pending, na, unset, from,
 *   nextSubjects: Array<{subject, reason, state, needsReview, sources}>,
 *   noCounterpart, review, warnings, uncertain, hasTarget
 * }}
 */
export function computeResult(cfg, { semester, track, statuses = {} } = {}) {
  const c = cfgOf(cfg);
  const from = subjectsOf(c, { semester, track });
  const targetSemester = pairedSemester(c, semester, track);
  const to = targetSemester ? subjectsOf(c, { semester: targetSemester, track }) : [];
  const system = (from[0] && from[0].system) || (to[0] && to[0].system) || '';

  const passed = [];
  const failed = [];
  const pending = [];
  const na = [];
  const unset = [];
  for (const s of from) {
    const st = statuses[s.id] || STATUS.unset;
    if (st === STATUS.passed) passed.push(s);
    else if (st === STATUS.failed) failed.push(s);
    else if (st === STATUS.pending) pending.push(s);
    else if (st === STATUS.na) na.push(s);
    else unset.push(s);
  }

  const nextSubjects = to.map((subject) => {
    const sources = from.filter((f) => Array.isArray(f.correspondsTo) && f.correspondsTo.includes(subject.id));
    let reason = 'new';
    let state = 'required';
    let needsReview = subject.confidence === 'needs_review';
    if (sources.length) reason = 'corresponds';
    for (const src of sources) {
      const st = statuses[src.id] || STATUS.unset;
      const rule = subject.rule || c.rules?.default || 'unknown';
      if (st === STATUS.passed && EXEMPTING_RULES.has(rule)) {
        state = 'eligible';
      } else if (st === STATUS.passed && rule === 'none') {
        state = 'required';
      } else if (st === STATUS.passed) {
        // نجح في المادة الأصلية لكن القاعدة غير مؤكّدة: لا قرار.
        state = 'review';
        needsReview = true;
      }
    }
    if (reason === 'new' && Array.isArray(subject.correspondsTo) && subject.correspondsTo.length) {
      // المادة نفسها ترتبط بمادة في السداسي الحالي بشكل عكسي.
      reason = 'corresponds';
    }
    return { subject, reason, state, needsReview, sources: sources.map((x) => x.id) };
  });

  const noCounterpart = from.filter((s) => !Array.isArray(s.correspondsTo) || !s.correspondsTo.length);

  const review = (c.review || []).filter((r) => (
    (!r.track || r.track === track) && (!r.semester || r.semester === semester || r.semester === targetSemester)
  ));

  const warnings = [];
  if (!targetSemester) warnings.push('no-target');
  if (!to.length && targetSemester) warnings.push('target-empty');
  if (unset.length) warnings.push('unset');
  const uncertain = nextSubjects.some((n) => n.state === 'review') || review.length > 0;

  return {
    semester,
    targetSemester,
    track,
    system,
    from,
    passed,
    failed,
    pending,
    na,
    unset,
    nextSubjects,
    noCounterpart,
    review,
    warnings,
    uncertain,
    hasTarget: Boolean(targetSemester && to.length),
  };
}

/** نسبة إدخال الطالب لحالات المواد. */
export function progressOf(result) {
  const total = result.from.length;
  const done = STATUS_LIST.filter((k) => result[k] && result[k].length)
    .reduce((acc, k) => acc + result[k].length, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/**
 * بناء رسالة SMS/WhatsApp من النتيجة.
 * @param result نتيجة computeResult
 * @param {(s:object)=>string} nameOf دالة تُرجع اسم المادة باللغة الحالية
 * @param {object} L نصوص (title, current, next, passed, remaining, nextSubjects, review, note)
 */
export function buildSms(result, nameOf, L = {}) {
  const name = typeof nameOf === 'function' ? nameOf : (s) => (s && s.name) || '';
  const list = (arr) => (arr.length ? arr.map((s) => `• ${name(s)}`).join('\n') : (L.none || '—'));
  const nextList = (result.nextSubjects || []).length
    ? result.nextSubjects.map((n) => `• ${name(n.subject)}${n.needsReview ? ' (؟)' : ''}`).join('\n')
    : (L.none || '—');
  const reviewList = (result.review || []).length
    ? result.review.map((r) => `• ${r.note || r.ocr || ''}`).join('\n')
    : (L.none || '—');

  const lines = [
    L.title || 'نتيجة وضعيتي الجامعية',
    `${L.current || 'السداسي الحالي'}: ${result.semester}`,
    `${L.next || 'السداسي المقبل'}: ${result.targetSemester || '—'}`,
    '',
    `${L.passed || 'المواد المستوفاة'}:`,
    list(result.passed),
    '',
    `${L.remaining || 'المواد المتبقية'}:`,
    list([...result.failed, ...result.pending]),
    '',
    `${L.nextSubjects || 'مواد السداسي المقبل'}:`,
    nextList,
    '',
    `${L.review || 'تحتاج مراجعة'}:`,
    reviewList,
    '',
    L.note || 'ملاحظة: يجب التأكد من قواعد التعويض والمعادلات المعتمدة قبل اعتبار أي مادة معفاة.',
  ];
  return lines.join('\n');
}
