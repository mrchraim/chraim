// ==========================================================================
// طبقة بيانات المؤسسات (متعدّدة المؤسسات).
// المصدر: API الخادم إن توفّر، ثم جدول Supabase (قراءة فقط)، ثم الملف الثابت.
// لا تُختلق أي مؤسسة: عند غياب المصدر تعود قائمة فارغة.
// ==========================================================================
import { norm, squeeze } from './util.js';
import { liveSelect, isLiveEnabled } from './supabase.js';

export const TYPE_AR = { fac: 'كلية', school: 'مدرسة وطنية / عليا', inst: 'معهد' };
export const TYPE_FR = { fac: 'Faculté', school: 'École supérieure / nationale', inst: 'Institut' };

async function tryJson(path) {
  try {
    const res = await fetch(path, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** يحدّ أي وعد بمهلة زمنية حتى لا يعلّق العرض على شبكة بطيئة. */
function withTimeout(promise, ms) {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => { if (!done) { done = true; resolve(null); } }, ms);
    Promise.resolve(promise)
      .then((v) => { if (!done) { done = true; clearTimeout(t); resolve(v); } })
      .catch(() => { if (!done) { done = true; clearTimeout(t); resolve(null); } });
  });
}

/** تطبيع عربي: إزالة التشكيل وتوحيد الهمزات والألف والتاء المربوطة. */
export function arabicNorm(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]/g, '')
    .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/[^\w\u0600-\u06FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** نص البحث الموحّد لمؤسسة. */
export function searchText(e) {
  const lead = (e.leadership || []).map((l) => l.name || '').join(' ');
  const progs = (e.programs_ar || []).join(' ');
  return arabicNorm([
    e.name_ar, e.name_fr, e.city_ar,
    TYPE_AR[e.type] || '', lead, progs,
  ].filter(Boolean).join(' '));
}

/** يحمّل كل بيانات المؤسسات من أفضل مصدر متاح. */
export async function loadInstitutions() {
  const empty = { establishments: [], outside: [], university: null, checked: '', source: 'none' };

  // الملف الثابت (نسخة موثّقة) يُجلب بالتوازي؛ و API الخادم بمهلة قصيرة.
  // لا يعلّق أيٌّ منهما العرض على شبكة بطيئة، ولا يمنع Supabase ظهورَ البيانات المحلية.
  const staticP = tryJson('data/institutions.json');
  const apiData = await withTimeout(tryJson('/api/public/institutions'), 2500);

  let data = null;
  let source = 'none';
  if (apiData && Array.isArray(apiData.establishments) && apiData.establishments.length) {
    data = apiData; source = 'api';
  } else {
    data = await staticP;
    if (data) source = 'static';
  }

  // آخر ملاذ: جدول Supabase (قراءة فقط) بمهلة محدودة.
  if (!data && await isLiveEnabled()) {
    const rows = await withTimeout(liveSelect('institutions', { order: 'name_ar.asc', limit: 200 }), 4000);
    if (rows && rows.length) { data = { establishments: rows }; source = 'supabase'; }
  }

  if (!data) return empty;

  const checked = data.checked || '';
  const establishments = Array.isArray(data.establishments) ? data.establishments : [];
  for (const e of establishments) {
    // يضمن لكل سجل مصدراً وتاريخ فحص صريحين (قاعدة الدقة: لا معلومة بلا مصدر وتاريخ).
    if (!e.checked_at) e.checked_at = checked;
    if (!e.source_url) e.source_url = e.uiz_url || data.university?.directory || '';
    e._search = searchText(e);
  }
  return {
    establishments,
    outside: Array.isArray(data.outside_directory) ? data.outside_directory : [],
    university: data.university || null,
    checked: data.checked || '',
    source,
  };
}

/**
 * بحث في المؤسسات. يعيد النتائج مرتّبة (تطابق الاسم أولاً).
 * @returns {Array<{item:object, score:number}>}
 */
export function searchInstitutions(query, list = []) {
  const q = arabicNorm(query);
  if (!q) return list.map((item) => ({ item, score: 0 }));
  const qs = squeeze(query);
  const out = [];
  for (const item of list) {
    const hay = item._search || searchText(item);
    let score = 0;
    if (hay.startsWith(q)) score = 3;
    else if (hay.includes(` ${q}`)) score = 2;
    else if (hay.includes(q)) score = 1;
    else if (qs && squeeze(hay).includes(qs)) score = 1;
    if (score) out.push({ item, score });
  }
  return out.sort((a, b) => b.score - a.score || (a.item.name_ar || '').localeCompare(b.item.name_ar || '', 'ar'));
}

export function citiesOf(list = []) {
  const seen = [];
  for (const e of list) if (e.city_ar && !seen.includes(e.city_ar)) seen.push(e.city_ar);
  return seen;
}

export function bySlug(slug, list = []) {
  return list.find((e) => e.slug === slug) || null;
}

/** رابط آمن للخارج (يضيف https إن غاب البروتوكول). */
export function safeHref(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  return /^(https?:)?\/\//i.test(s) ? s : `https://${s}`;
}

export { norm, squeeze };
