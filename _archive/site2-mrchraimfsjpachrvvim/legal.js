/* ==========================================================================
   «المكتبة القانونية» — بوابة CHRVVIM (kolchi)
   بنية تحتية لمكتبة قانونية: محرّك بحث/تصفية صافٍ + واجهة عرض.
   ملف مستقل (classic script) بلا مكتبات خارجية وبلا eval (متوافق مع CSP).

   مبدأ أساسي: لا يُنشئ هذا الملف أي محتوى قانوني. البيانات تأتي حصراً من
   legal-data.js (window.CHRVVIM_LEGAL) أو من /api/public/legal.
   إذا لم تكن هناك وثائق، تُعرض حالة «بانتظار البيانات» بوضوح ولا تُختلق نتائج.
   ========================================================================== */
(function () {
  'use strict';

  /* ===================== المحرّك (منطق صافٍ) ===================== */

  // توحيد النص للبحث: إزالة التشكيل والتطويل، وتوحيد الهمزات، وإسقاط اللواحق اللاتينية.
  function normalizeText(s) {
    s = String(s == null ? '' : s).toLowerCase();
    s = s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, ''); // علامات التشكيل
    s = s.replace(/\u0640/g, '');                              // التطويل
    s = s.replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627');    // أ إ آ ٱ → ا
    s = s.replace(/\u0649/g, '\u064A');                        // ى → ي
    s = s.replace(/\u0624/g, '\u0648');                        // ؤ → و
    s = s.replace(/\u0626/g, '\u064A');                        // ئ → ي
    s = s.replace(/\u0629/g, '\u0647');                        // ة → ه
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/[^\w\u0600-\u06FF\u0750-\u077F\s]/g, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }

  function textOf(o, l) {    if (o == null) return '';
    if (typeof o === 'string') return o;
    return o[l] || o.ar || o.fr || o.en || '';
  }
  function asArray(v) { return Array.isArray(v) ? v : []; }
  function yearOf(d) {
    var m = String(d == null ? '' : d).match(/(\d{4})/);
    return m ? parseInt(m[1], 10) : null;
  }

  // مطابقة مصطلح واحد: يتسامح مع «ال» التعريف في أوّل الكلمة العربية.
  function termMatches(hay, t) {
    if (!t) return true;
    if (hay.indexOf(t) >= 0) return true;
    if (t.length > 3 && t.slice(0, 2) === '\u0627\u0644' && hay.indexOf(t.slice(2)) >= 0) return true;
    return false;
  }

  function searchableText(doc) {
    var parts = [];
    ['title', 'summary', 'body'].forEach(function (k) {
      var o = doc && doc[k];
      if (o && typeof o === 'object') parts.push(o.ar, o.fr, o.en);
      else if (typeof o === 'string') parts.push(o);
    });
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
    var y = yearOf(doc.date);
    if (o.yearFrom && (y == null || y < o.yearFrom)) return false;
    if (o.yearTo && (y == null || y > o.yearTo)) return false;
    if (o.q) {
      var terms = normalizeText(o.q).split(' ').filter(Boolean);
      if (terms.length) {
        var hay = searchableText(doc);
        for (var i = 0; i < terms.length; i++) { if (!termMatches(hay, terms[i])) return false; }
      }
    }
    return true;
  }

  function scoreDoc(doc, q) {
    if (!q) return 0;
    var terms = normalizeText(q).split(' ').filter(Boolean);
    if (!terms.length) return 0;
    var title = normalizeText([textOf(doc.title, 'ar'), textOf(doc.title, 'fr'), textOf(doc.title, 'en'), doc.reference].join(' '));
    var score = 0;
    terms.forEach(function (t) { if (termMatches(title, t)) score += 5; });
    var hay = searchableText(doc);
    terms.forEach(function (t) { if (termMatches(hay, t)) score += 1; });
    return score;
  }

  function sortDocuments(list, sort, q) {
    var arr = list.slice();
    var byDate = function (a, b) { return (yearOf(b.date) || 0) - (yearOf(a.date) || 0); };
    if (sort === 'date_desc') arr.sort(byDate);
    else if (sort === 'date_asc') arr.sort(function (a, b) { return (yearOf(a.date) || 0) - (yearOf(b.date) || 0); });
    else if (sort === 'title') arr.sort(function (a, b) {
      var ta = normalizeText(textOf(a.title, curLang())), tb = normalizeText(textOf(b.title, curLang()));
      return ta < tb ? -1 : (ta > tb ? 1 : 0);
    });
    else arr.sort(function (a, b) { return (scoreDoc(b, q) - scoreDoc(a, q)) || byDate(a, b); });
    return arr;
  }

  // تصفية الوثائق حسب معايير البحث (دالة صافية، قابلة للاختبار).
  function filterDocuments(data, opts) {
    opts = opts || {};
    var docs = asArray(data && data.documents);
    var out = docs.filter(function (d) { return matchesDoc(d, opts); });
    return sortDocuments(out, opts.sort || 'relevance', opts.q);
  }

  // حصر الفئات المتوفرة فعلاً في البيانات (لتفادي حقول فارغة أو مضلّلة).
  function deriveFacets(data, docs) {
    var list = asArray(docs);
    var count = function (key) {
      var m = {};
      list.forEach(function (d) { var v = d[key]; if (v) m[v] = (m[v] || 0) + 1; });
      return m;
    };
    var years = list.map(function (d) { return yearOf(d.date); }).filter(function (y) { return y != null; });
    return {
      type: count('type'),
      category: count('category'),
      jurisdiction: count('jurisdiction'),
      verification: count('verification'),
      yearFrom: years.length ? Math.min.apply(null, years) : null,
      yearTo: years.length ? Math.max.apply(null, years) : null,
      total: list.length
    };
  }

  function sourceById(data, id) {
    var arr = asArray(data && data.sources);
    for (var i = 0; i < arr.length; i++) { if (arr[i].id === id) return arr[i]; }
    return null;
  }

  // التحقق الفعّال: لا تُعتبر وثيقة «متحقَّقاً منها» إلا إذا كان مصدرها متحقَّقاً منه أيضاً.
  function effectiveVerification(doc, src) {
    if (!doc) return 'pending';
    var dv = doc.verification || 'pending';
    var sv = src ? (src.verification || 'unverified') : 'pending';
    if (dv === 'verified' && sv === 'verified') return 'verified';
    if (dv === 'unverified' || sv === 'unverified') return 'unverified';
    return 'pending';
  }

  // بناء إسناد (citation) من الحقول الحقيقية فقط؛ لا تُختلق أي مرجع.
  function buildCitation(doc, src, lang) {
    if (!doc) return '';
    var bits = [];
    if (doc.reference) bits.push(doc.reference);
    var title = textOf(doc.title, lang);
    if (title) bits.push(title);
    var y = yearOf(doc.date);
    if (y) bits.push('(' + y + ')');
    var cite = bits.join(' — ');
    if (src) cite += ' · ' + textOf(src.name, lang);
    return cite;
  }

  function statusInfo(data) {
    var docs = asArray(data && data.documents);
    var srcs = asArray(data && data.sources);
    return {
      status: (data && data.status) || 'pending',
      documents: docs.length,
      sources: srcs.length,
      verifiedSources: srcs.filter(function (s) { return s.verification === 'verified'; }).length,
      hasData: docs.length > 0
    };
  }

  /* ===================== نص الواجهة (ar / fr / en) ===================== */
  var TXT = {
    ar: {
      title: 'المكتبة القانونية',
      lead: 'ابحث في الوثائق القانونية الموثّقة (قوانين، مراسيم، قرارات، دراسات). تُعرض كل وثيقة مع مصدرها، ويُميَّز المصدر المتحقَّق منه عن غيره.',
      search: 'بحث', searchPh: 'ابحث في العنوان أو المرجع أو الوسوم…',
      type: 'نوع الوثيقة', category: 'المجال', jurisdiction: 'النطاق', source: 'المصدر', verification: 'حالة التحقق',
      yearFrom: 'من سنة', yearTo: 'إلى سنة', sort: 'الترتيب',
      sortRelevance: 'الأكثر صلة', sortDateDesc: 'الأحدث', sortDateAsc: 'الأقدم', sortTitle: 'أبجدي',
      all: 'الكل', apply: 'تطبيق', reset: 'مسح الفلاتر',
      results: 'النتائج', noResults: 'لا توجد نتائج مطابقة للفلاتر الحالية.',
      pendingTitle: 'المكتبة جاهزة — الوثائق في انتظار التزويد',
      pendingBody: 'تم تجهيز البنية الكاملة للبحث والتصفية والعرض، لكن لم تُضَف بعد أي وثيقة قانونية موثّقة. لن تظهر أي نتيجة حتى تتوفّر مصادر رسمية. لن يتم اختلاق أي محتوى قانوني.',
      sourcesTitle: 'المصادر', sourcesLead: 'سجلّ الجهات المرجعية. حالة التحقق مبنية على فحص فعلي للرابط.',
      verified: 'مصدر متحقَّق منه', unverified: 'مصدر غير متحقَّق منه', pending: 'بانتظار التحقق',
      sourceLink: 'فتح المصدر', reference: 'المرجع', date: 'التاريخ', language: 'اللغة', tags: 'الوسوم',
      citation: 'الإسناد', details: 'تفاصيل الوثيقة', unverifiedWarn: '⚠️ مصدر غير مؤكّد — راجع النص الرسمي قبل الاعتماد.',
      noSource: 'بدون مصدر مرتبط', docCount: 'وثيقة', sourceCount: 'مصدر', checkedAt: 'تاريخ الفحص',
      disclaimer: 'هذا المحتوى لا يُعدّ نصاً رسمياً ولا يُغني عن الجريدة الرسمية.'
    },
    fr: {
      title: 'Bibliothèque juridique',
      lead: 'Recherchez dans des documents juridiques sourcés (lois, décrets, décisions, études). Chaque document indique sa source ; les sources vérifiées sont distinguées des autres.',
      search: 'Rechercher', searchPh: 'Titre, référence ou mots-clés…',
      type: 'Type', category: 'Domaine', jurisdiction: 'Juridiction', source: 'Source', verification: 'Vérification',
      yearFrom: 'De (année)', yearTo: 'À (année)', sort: 'Tri',
      sortRelevance: 'Pertinence', sortDateDesc: 'Plus récent', sortDateAsc: 'Plus ancien', sortTitle: 'A→Z',
      all: 'Tout', apply: 'Appliquer', reset: 'Réinitialiser',
      results: 'Résultats', noResults: 'Aucun résultat pour ces filtres.',
      pendingTitle: "Bibliothèque prête — documents en attente",
      pendingBody: "L'infrastructure complète (recherche, filtres, affichage) est en place, mais aucun document juridique sourcé n'a encore été ajouté. Rien ne s'affichera avant l'ajout de sources officielles. Aucun contenu juridique ne sera inventé.",
      sourcesTitle: 'Sources', sourcesLead: 'Répertoire des autorités. Le statut de vérification repose sur un contrôle réel du lien.',
      verified: 'Source vérifiée', unverified: 'Source non vérifiée', pending: 'En attente',
      sourceLink: 'Ouvrir la source', reference: 'Référence', date: 'Date', language: 'Langue', tags: 'Mots-clés',
      citation: 'Citation', details: 'Détails du document', unverifiedWarn: '⚠️ Source non confirmée — consultez le texte officiel.',
      noSource: 'Aucune source liée', docCount: 'document(s)', sourceCount: 'source(s)', checkedAt: 'Contrôlé le',
      disclaimer: "Ce contenu n'a pas valeur de texte officiel et ne remplace pas le Bulletin Officiel."
    },
    en: {
      title: 'Legal library',
      lead: 'Search sourced legal documents (laws, decrees, decisions, studies). Each document shows its source, and verified sources are distinguished from the rest.',
      search: 'Search', searchPh: 'Title, reference or tags…',
      type: 'Type', category: 'Field', jurisdiction: 'Jurisdiction', source: 'Source', verification: 'Verification',
      yearFrom: 'From (year)', yearTo: 'To (year)', sort: 'Sort',
      sortRelevance: 'Relevance', sortDateDesc: 'Newest', sortDateAsc: 'Oldest', sortTitle: 'A→Z',
      all: 'All', apply: 'Apply', reset: 'Clear filters',
      results: 'Results', noResults: 'No results for the current filters.',
      pendingTitle: 'Library ready — documents pending',
      pendingBody: 'The full infrastructure (search, filters, display) is in place, but no sourced legal document has been added yet. Nothing will be shown until official sources are supplied. No legal content will be invented.',
      sourcesTitle: 'Sources', sourcesLead: 'Registry of authorities. Verification status is based on an actual link check.',
      verified: 'Verified source', unverified: 'Unverified source', pending: 'Pending',
      sourceLink: 'Open source', reference: 'Reference', date: 'Date', language: 'Language', tags: 'Tags',
      citation: 'Citation', details: 'Document details', unverifiedWarn: '⚠️ Unconfirmed source — consult the official text.',
      noSource: 'No linked source', docCount: 'document(s)', sourceCount: 'source(s)', checkedAt: 'Checked on',
      disclaimer: 'This content is not an official text and does not replace the Official Gazette.'
    }
  };

  /* ===================== أدوات الواجهة ===================== */
  function curLang() { try { if (typeof UILANG !== 'undefined' && UILANG && TXT[UILANG]) return UILANG; } catch (e) {} return 'ar'; }
  function tt(k) { var l = curLang(); return (TXT[l] && TXT[l][k]) || TXT.ar[k] || k; }
  function nm(o) { return textOf(o, curLang()); }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); }
  function labelOf(list, id) { var a = asArray(list); for (var i = 0; i < a.length; i++) { if (a[i].id === id) return nm(a[i].label) || id; } return id || ''; }

  var data = window.CHRVVIM_LEGAL || null;
  var ui = { q: '', type: '', category: '', jurisdiction: '', sourceId: '', verification: '', yearFrom: '', yearTo: '', sort: 'relevance' };

  function verificationChip(v) { var cls = v === 'verified' ? 'ok' : (v === 'unverified' ? 'warn' : 'g'); return '<span class="chip ' + cls + '">' + E(tt(v)) + '</span>'; }

  function optionsHtml(list, cur, allLabel) {
    var opts = '<option value="">' + E(allLabel) + '</option>';
    asArray(list).forEach(function (x) { opts += '<option value="' + E(x.id) + '"' + (x.id === cur ? ' selected' : '') + '>' + E(nm(x.label) || x.id) + '</option>'; });
    return opts;
  }

  function controlsHtml() {
    return '' +
      '<div class="grid legal-controls">' +
      '<div class="field legal-q"><label for="legalQ">' + E(tt('search')) + '</label><input id="legalQ" type="search" autocomplete="off" value="' + E(ui.q) + '" placeholder="' + E(tt('searchPh')) + '"></div>' +
      '<div class="field"><label for="legalType">' + E(tt('type')) + '</label><select id="legalType">' + optionsHtml(data && data.documentTypes, ui.type, tt('all')) + '</select></div>' +
      '<div class="field"><label for="legalCat">' + E(tt('category')) + '</label><select id="legalCat">' + optionsHtml(data && data.categories, ui.category, tt('all')) + '</select></div>' +
      '<div class="field"><label for="legalJur">' + E(tt('jurisdiction')) + '</label><select id="legalJur">' + optionsHtml(data && data.jurisdictions, ui.jurisdiction, tt('all')) + '</select></div>' +
      '<div class="field"><label for="legalVer">' + E(tt('verification')) + '</label><select id="legalVer"><option value="">' + E(tt('all')) + '</option><option value="verified"' + (ui.verification === 'verified' ? ' selected' : '') + '>' + E(tt('verified')) + '</option><option value="unverified"' + (ui.verification === 'unverified' ? ' selected' : '') + '>' + E(tt('unverified')) + '</option><option value="pending"' + (ui.verification === 'pending' ? ' selected' : '') + '>' + E(tt('pending')) + '</option></select></div>' +
      '<div class="field"><label for="legalSort">' + E(tt('sort')) + '</label><select id="legalSort">' +
      '<option value="relevance"' + (ui.sort === 'relevance' ? ' selected' : '') + '>' + E(tt('sortRelevance')) + '</option>' +
      '<option value="date_desc"' + (ui.sort === 'date_desc' ? ' selected' : '') + '>' + E(tt('sortDateDesc')) + '</option>' +
      '<option value="date_asc"' + (ui.sort === 'date_asc' ? ' selected' : '') + '>' + E(tt('sortDateAsc')) + '</option>' +
      '<option value="title"' + (ui.sort === 'title' ? ' selected' : '') + '>' + E(tt('sortTitle')) + '</option></select></div>' +
      '</div>' +
      '<div class="row legal-actions"><button class="btn ghost small" id="legalReset" type="button">↻ ' + E(tt('reset')) + '</button></div>';
  }

  function docCardHtml(doc) {
    var src = sourceById(data, doc.sourceId);
    var ver = effectiveVerification(doc, src);
    var tags = asArray(doc.tags).map(function (t) { return '<span class="chip g">' + E(t) + '</span>'; }).join(' ');
    var srcLink = src && src.url
      ? '<a class="btn sec small" href="' + E(src.url) + '" target="_blank" rel="noopener noreferrer">🔗 ' + E(tt('sourceLink')) + '</a>'
      : '<span class="chip warn">' + E(tt('noSource')) + '</span>';
    return '<article class="card mini legal-card">' +
      '<div class="legal-card__head"><h4>' + E(nm(doc.title)) + '</h4>' + verificationChip(ver) + '</div>' +
      '<p class="muted legal-meta">' + E(labelOf(data && data.documentTypes, doc.type)) + ' · ' + E(labelOf(data && data.categories, doc.category)) + (doc.date ? ' · ' + E(doc.date) : '') + '</p>' +
      (nm(doc.summary) ? '<p>' + E(nm(doc.summary)) + '</p>' : '') +
      (tags ? '<div class="legal-tags">' + tags + '</div>' : '') +
      '<details class="legal-details"><summary>' + E(tt('details')) + '</summary>' +
      '<div class="legal-cite"><b>' + E(tt('citation')) + ':</b> ' + E(buildCitation(doc, src, curLang())) + '</div>' +
      '<dl class="legal-dl">' +
      (doc.reference ? '<dt>' + E(tt('reference')) + '</dt><dd>' + E(doc.reference) + '</dd>' : '') +
      (doc.date ? '<dt>' + E(tt('date')) + '</dt><dd>' + E(doc.date) + '</dd>' : '') +
      (doc.language ? '<dt>' + E(tt('language')) + '</dt><dd>' + E(doc.language) + '</dd>' : '') +
      '<dt>' + E(tt('source')) + '</dt><dd>' + E(src ? (nm(src.name) || '') : tt('noSource')) + '</dd>' +
      '</dl>' +
      (ver !== 'verified' ? '<p class="note warn-note">' + E(tt('unverifiedWarn')) + '</p>' : '') +
      '<div class="row">' + srcLink + '</div>' +
      '</details>' +
      '</article>';
  }

  function sourcesHtml() {
    var list = asArray(data && data.sources);
    if (!list.length) return '';
    var rows = list.map(function (s) {
      var link = s.url ? '<a href="' + E(s.url) + '" target="_blank" rel="noopener noreferrer">' + E(tt('sourceLink')) + '</a>' : '';
      var note = nm(s.note);
      return '<li class="legal-source">' + verificationChip(s.verification || 'pending') +
        '<div><b>' + E(nm(s.name)) + '</b>' + (nm(s.authority) && nm(s.authority) !== nm(s.name) ? ' <span class="muted">· ' + E(nm(s.authority)) + '</span>' : '') +
        (note ? '<div class="muted legal-src-note">' + E(note) + '</div>' : '') +
        (s.checkedAt ? '<div class="muted legal-src-note">' + E(tt('checkedAt')) + ': ' + E(s.checkedAt) + '</div>' : '') +
        (link ? ' <span class="legal-src-link">' + link + '</span>' : '') +
        '</div></li>';
    }).join('');
    return '<section class="legal-sources"><h3>' + E(tt('sourcesTitle')) + '</h3><p class="muted">' + E(tt('sourcesLead')) + '</p><ul class="legal-source-list">' + rows + '</ul></section>';
  }

  function bodyHtml() {
    if (!data) return '<p class="empty">' + E(tt('pendingBody')) + '</p>';
    var st = statusInfo(data);
    var docs = filterDocuments(data, ui);
    var head = '' +
      '<div class="row legal-status">' +
      '<span class="chip g">' + st.documents + ' ' + E(tt('docCount')) + '</span>' +
      '<span class="chip g">' + st.sources + ' ' + E(tt('sourceCount')) + '</span>' +
      '</div>';
    if (!st.hasData) {
      return head +
        '<div class="legal-pending"><h3>⏳ ' + E(tt('pendingTitle')) + '</h3><p>' + E(nm(data.notice) || tt('pendingBody')) + '</p></div>' +
        sourcesHtml() +
        '<p class="note">' + E(nm(data.disclaimer) || tt('disclaimer')) + '</p>';
    }
    var results = docs.length
      ? '<div class="grid legal-results">' + docs.map(docCardHtml).join('') + '</div>'
      : '<p class="empty">' + E(tt('noResults')) + '</p>';
    return controlsHtml() + head +
      '<h3 class="legal-results-title">' + E(tt('results')) + ' (' + docs.length + ')</h3>' + results +
      sourcesHtml() +
      '<p class="note">' + E(nm(data.disclaimer) || tt('disclaimer')) + '</p>';
  }

  function render() {
    var host = document.getElementById('legalBody');
    if (!host) return;
    host.innerHTML = bodyHtml();
    wire(host);
  }

  function wire(host) {
    var on = function (sel, ev, fn) { var el = host.querySelector(sel); if (el) el.addEventListener(ev, fn); };
    on('#legalQ', 'input', function (e) { ui.q = e.target.value; render(); var q = document.getElementById('legalQ'); if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (x) {} } });
    on('#legalType', 'change', function (e) { ui.type = e.target.value; render(); });
    on('#legalCat', 'change', function (e) { ui.category = e.target.value; render(); });
    on('#legalJur', 'change', function (e) { ui.jurisdiction = e.target.value; render(); });
    on('#legalVer', 'change', function (e) { ui.verification = e.target.value; render(); });
    on('#legalSort', 'change', function (e) { ui.sort = e.target.value; render(); });
    on('#legalReset', 'click', function () { ui = { q: '', type: '', category: '', jurisdiction: '', sourceId: '', verification: '', yearFrom: '', yearTo: '', sort: 'relevance' }; render(); });
  }

  /* ===================== حقن الأنماط (مرة واحدة) ===================== */
  function injectCss() {
    if (document.getElementById('legal-css')) return;
    var css = '' +
      '.legal-controls{align-items:end}' +
      '.legal-controls .field{margin:0}' +
      '.legal-controls .legal-q{grid-column:1/-1}' +
      '.legal-actions{margin:8px 0 4px}' +
      '.legal-status{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0}' +
      '.legal-pending{border:1px dashed var(--warn);background:var(--warnbg);color:var(--warn);border-radius:14px;padding:14px 16px;margin:12px 0}' +
      '.legal-pending h3{margin:0 0 6px;color:var(--warn)}' +
      '.legal-pending p{margin:0;color:var(--ink)}' +
      ':root[data-theme=dark] .legal-pending p{color:var(--ink)}' +
      '.legal-results-title{margin:14px 0 8px}' +
      '.legal-card__head{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}' +
      '.legal-card__head h4{margin:0;font-size:1rem}' +
      '.legal-meta{margin:4px 0 6px;font-size:.82rem}' +
      '.legal-tags{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}' +
      '.legal-details{margin-top:8px}' +
      '.legal-details summary{cursor:pointer;font-weight:700;color:var(--blue2)}' +
      ':root[data-theme=dark] .legal-details summary{color:var(--gold2)}' +
      '.legal-cite{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin:8px 0;font-size:.85rem;word-break:break-word}' +
      '.legal-dl{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:8px 0;font-size:.86rem}' +
      '.legal-dl dt{color:var(--muted)}' +
      '.legal-dl dd{margin:0}' +
      '.warn-note{color:var(--warn)}' +
      '.legal-sources{margin-top:18px;border-top:1px solid var(--line);padding-top:12px}' +
      '.legal-source-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:8px}' +
      '.legal-source{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--card)}' +
      '.legal-src-note{font-size:.8rem}' +
      '.legal-src-link a{color:var(--blue2)}' +
      ':root[data-theme=dark] .legal-src-link a{color:var(--gold2)}';
    var st = document.createElement('style'); st.id = 'legal-css'; st.textContent = css; document.head.appendChild(st);
  }

  /* ===================== نقطة الدخول ===================== */
  var liveTried = false;
  function tryLive() {
    if (liveTried) return;
    liveTried = true;
    try {
      fetch('/api/public/legal', { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('offline'); return r.json(); })
        .then(function (j) { if (j && Array.isArray(j.documents)) { data = j; if (document.getElementById('legalBody')) render(); } })
        .catch(function () { /* keep bundled static data */ });
    } catch (e) { /* keep bundled static data */ }
  }

  function renderLegal() {
    var host = document.getElementById('p-legal');
    if (!host) return;
    injectCss();
    if (!host.querySelector('#legalBody')) {
      host.innerHTML = '<div class="cat-title"><h2>⚖️ ' + E(tt('title')) + '</h2></div>' +
        '<p class="muted">' + E(tt('lead')) + '</p><div id="legalBody"></div>';
    } else {
      var h = host.querySelector('.cat-title h2'); if (h) h.textContent = '⚖️ ' + tt('title');
      var p = host.querySelector('.muted'); if (p && p.parentNode === host) p.textContent = tt('lead');
    }
    data = window.CHRVVIM_LEGAL || data;
    render();
    tryLive();
  }

  window.Legal = { render: renderLegal };
  // واجهة للاختبارات (بلا DOM)
  window.CHRVVIM_LEGAL_ENGINE = {
    normalizeText: normalizeText, textOf: textOf, yearOf: yearOf, searchableText: searchableText,
    filterDocuments: filterDocuments, deriveFacets: deriveFacets, sortDocuments: sortDocuments,
    buildCitation: buildCitation, effectiveVerification: effectiveVerification, statusInfo: statusInfo,
    sourceById: sourceById
  };
})();
