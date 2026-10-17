// ==========================================================================
// محرّك «المكتبة القانونية» — منطق صافٍ بلا DOM (ES module).
// لا يُنشئ هذا الملف أي محتوى قانوني؛ يعالج فقط ما تُغذّيه به البيانات.
// ==========================================================================

/** توحيد النص للبحث: إزالة التشكيل/التطويل، توحيد الهمزات، وإسقاط اللواحق اللاتينية. */
export function normalizeText(s) {
  s = String(s == null ? '' : s).toLowerCase();
  s = s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
  s = s.replace(/\u0640/g, '');
  s = s.replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627');
  s = s.replace(/\u0649/g, '\u064A');
  s = s.replace(/\u0624/g, '\u0648');
  s = s.replace(/\u0626/g, '\u064A');
  s = s.replace(/\u0629/g, '\u0647');
  if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^\w\u0600-\u06FF\u0750-\u077F\s]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

export function textOf(o, lang = 'ar') {
  if (o == null) return '';
  if (typeof o === 'string') return o;
  return o[lang] || o.ar || o.fr || o.en || '';
}

function asArray(v) { return Array.isArray(v) ? v : []; }

export function yearOf(d) {
  const m = String(d == null ? '' : d).match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

/** مطابقة مصطلح واحد: يتسامح مع «ال» التعريف في أوّل الكلمة العربية. */
export function termMatches(hay, t) {
  if (!t) return true;
  if (hay.indexOf(t) >= 0) return true;
  if (t.length > 3 && t.slice(0, 2) === '\u0627\u0644' && hay.indexOf(t.slice(2)) >= 0) return true;
  return false;
}

export function searchableText(doc) {
  const parts = [];
  for (const k of ['title', 'summary', 'body']) {
    const o = doc && doc[k];
    if (o && typeof o === 'object') parts.push(o.ar, o.fr, o.en);
    else if (typeof o === 'string') parts.push(o);
  }
  parts.push(doc && doc.reference, doc && doc.type, doc && doc.category, doc && doc.jurisdiction);
  parts.push(asArray(doc && doc.tags).join(' '));
  return normalizeText(parts.filter(Boolean).join(' '));
}

function matchesDoc(doc, o) {
  if (o.type && doc.type !== o.type) return false;
  if (o.category && doc.category !== o.category) return false;
  if (o.jurisdiction && doc.jurisdiction !== o.jurisdiction) return false;
  if (o.sourceId && doc.sourceId !== o.sourceId) return false;
  if (o.verification && doc.verification !== o.verification) return false;
  const y = yearOf(doc.date);
  if (o.yearFrom && (y == null || y < o.yearFrom)) return false;
  if (o.yearTo && (y == null || y > o.yearTo)) return false;
  if (o.q) {
    const terms = normalizeText(o.q).split(' ').filter(Boolean);
    if (terms.length) {
      const hay = searchableText(doc);
      for (const t of terms) if (!termMatches(hay, t)) return false;
    }
  }
  return true;
}

function scoreDoc(doc, q) {
  if (!q) return 0;
  const terms = normalizeText(q).split(' ').filter(Boolean);
  if (!terms.length) return 0;
  const title = normalizeText([textOf(doc.title, 'ar'), textOf(doc.title, 'fr'), textOf(doc.title, 'en'), doc.reference].join(' '));
  let score = 0;
  for (const t of terms) if (termMatches(title, t)) score += 5;
  const hay = searchableText(doc);
  for (const t of terms) if (termMatches(hay, t)) score += 1;
  return score;
}

export function sortDocuments(list, sort, q, lang = 'ar') {
  const arr = list.slice();
  const byDate = (a, b) => (yearOf(b.date) || 0) - (yearOf(a.date) || 0);
  if (sort === 'date_desc') arr.sort(byDate);
  else if (sort === 'date_asc') arr.sort((a, b) => (yearOf(a.date) || 0) - (yearOf(b.date) || 0));
  else if (sort === 'title') arr.sort((a, b) => {
    const ta = normalizeText(textOf(a.title, lang)); const tb = normalizeText(textOf(b.title, lang));
    return ta < tb ? -1 : (ta > tb ? 1 : 0);
  });
  else arr.sort((a, b) => (scoreDoc(b, q) - scoreDoc(a, q)) || byDate(a, b));
  return arr;
}

/** تصفية الوثائق حسب معايير البحث (دالة صافية، قابلة للاختبار). */
export function filterDocuments(data, opts = {}) {
  const docs = asArray(data && data.documents);
  const out = docs.filter((d) => matchesDoc(d, opts));
  return sortDocuments(out, opts.sort || 'relevance', opts.q, opts.lang || 'ar');
}

/** حصر الفئات المتوفرة فعلاً في البيانات (لتفادي حقول فارغة أو مضلّلة). */
export function deriveFacets(data, docs) {
  const list = asArray(docs);
  const count = (key) => {
    const m = {};
    for (const d of list) if (d[key]) m[d[key]] = (m[d[key]] || 0) + 1;
    return m;
  };
  const years = list.map((d) => yearOf(d.date)).filter((y) => y != null);
  return {
    type: count('type'), category: count('category'), jurisdiction: count('jurisdiction'),
    verification: count('verification'),
    yearFrom: years.length ? Math.min(...years) : null,
    yearTo: years.length ? Math.max(...years) : null,
    total: list.length,
  };
}

export function sourceById(data, id) {
  return asArray(data && data.sources).find((s) => s.id === id) || null;
}

/** التحقق الفعّال: لا تُعتبر وثيقة «متحقَّقاً منها» إلا إذا كان مصدرها متحقَّقاً منه أيضاً. */
export function effectiveVerification(doc, src) {
  if (!doc) return 'pending';
  const dv = doc.verification || 'pending';
  const sv = src ? (src.verification || 'unverified') : 'pending';
  if (dv === 'verified' && sv === 'verified') return 'verified';
  if (dv === 'unverified' || sv === 'unverified') return 'unverified';
  return 'pending';
}

/** بناء إسناد (citation) من الحقول الحقيقية فقط؛ لا تُختلق أي مرجع. */
export function buildCitation(doc, src, lang = 'ar') {
  if (!doc) return '';
  const bits = [];
  if (doc.reference) bits.push(doc.reference);
  const title = textOf(doc.title, lang);
  if (title) bits.push(title);
  const y = yearOf(doc.date);
  if (y) bits.push(`(${y})`);
  let cite = bits.join(' — ');
  if (src) cite += ' · ' + textOf(src.name, lang);
  return cite;
}

export function statusInfo(data) {
  const docs = asArray(data && data.documents);
  const srcs = asArray(data && data.sources);
  return {
    status: (data && data.status) || 'pending',
    documents: docs.length,
    sources: srcs.length,
    verifiedSources: srcs.filter((s) => s.verification === 'verified').length,
    hasData: docs.length > 0,
  };
}
