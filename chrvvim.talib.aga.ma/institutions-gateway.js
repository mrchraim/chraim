/* CHRVVIM Campus — first-page institutions gateway.
   Renders the verified Ibn Zohr institutions directory inside index.html.
   Data: window.CHRVVIM_INSTITUTIONS (base) + window.CHRVVIM_INSTITUTION_RESOURCES (overlay).
   Localisation: window.CHRVVIM_PAGE.t() when present, Arabic fallback otherwise.
   No data is invented: institutions without verified resources show an honest
   "المعلومات غير متوفرة حالياً" state. */
(function () {
  'use strict';
  var BASE = window.CHRVVIM_INSTITUTIONS || [];
  var RES = window.CHRVVIM_INSTITUTION_RESOURCES || {};

  function T(k, fb) { try { if (window.CHRVVIM_PAGE) return window.CHRVVIM_PAGE.t(k); } catch (e) {} return fb; }

  /* حاجز عناوين: يمنع javascript:/data:/vbscript: في الروابط المستمدّة من البيانات. */
  function safeUrl(u) { try { return (typeof window.CHRVVIM_SAFE_URL === 'function') ? window.CHRVVIM_SAFE_URL(u) : u; } catch (e) { return ''; } }

  var FALLBACK = {
    all: 'الكل', typeFac: 'كليات', typeSchool: 'مدارس', typeInst: 'معاهد',
    oneFac: 'كلية', oneSchool: 'مدرسة', oneInst: 'معهد',
    stListed: 'مدرجة في لائحة المؤسسات الرسمية',
    stAnnounced: 'إعلان رسمي — بانتظار استكمال المعلومات',
    stPortal: 'اسم في بوابة التسجيل يحتاج مطابقة',
    allCities: 'كل المدن', count: '{n} من {t}', none: 'لا توجد مؤسسة بهذا الاسم. جرّب كلمة أقصر أو غيّر المدينة.',
    unavailable: 'المعلومات غير متوفرة حالياً',
    sourcePage: 'صفحة المصدر ↗',
    fullDir: 'الدليل الكامل', space: 'فضاء المؤسسة',
    kSite: 'الموقع الرسمي', kSchedules: 'استعمالات الزمن', kNews: 'الإعلانات',
    kStudent: 'الفضاء الطلابي', kExams: 'الامتحانات', kGroups: 'الأفواج',
    cityAria: 'تصفية حسب المدينة'
  };

  var TYPE_LABEL = { fac: 'oneFac', school: 'oneSchool', inst: 'oneInst' };
  var STATUS_KEY = {
    listed_official: 'stListed',
    official_announcement: 'stAnnounced',
    portal_name_needs_reconciliation: 'stPortal'
  };
  var KIND_ORDER = ['site', 'schedules', 'news', 'student', 'exams', 'groups'];
  var KIND_KEY = { site: 'kSite', schedules: 'kSchedules', news: 'kNews', student: 'kStudent', exams: 'kExams', groups: 'kGroups' };

  function statusLabel(r) {
    var key = STATUS_KEY[r.status];
    if (key) return T('ig.' + key, FALLBACK[key]);
    return r.status_label || r.status || '';
  }

  var state = { q: '', type: '', city: '' };

  function lang() { try { return window.CHRVVIM_PAGE ? window.CHRVVIM_PAGE.lang() : 'ar'; } catch (e) { return 'ar'; } }
  function nameOf(r) {
    var l = lang();
    if (l === 'fr' && r.name_fr) return r.name_fr;
    if (l === 'en' && r.name_fr) return r.name_fr;
    return r.name_ar;
  }
  function cityOf(r) { return lang() === 'fr' || lang() === 'en' ? (r.city_fr || r.city_ar) : (r.city_ar || r.city_fr); }
  function typeLabel(r) { return T('ig.' + (TYPE_LABEL[r.type] || 'typeFac'), FALLBACK[TYPE_LABEL[r.type] || 'typeFac']); }

  function resourcesFor(id) { return RES[id] || null; }
  function firstOf(res, kind) { if (!res) return null; var v = res[kind]; if (!v) return null; return Array.isArray(v) ? v[0] : v; }

  function buildCityOptions() {
    var sel = document.getElementById('igCity');
    if (!sel) return;
    var seen = {}, opts = [];
    BASE.forEach(function (r) { var c = r.city_ar; if (c && !seen[c]) { seen[c] = 1; opts.push(c); } });
    opts.sort();
    var keep = sel.value;
    sel.replaceChildren();
    var any = document.createElement('option'); any.value = ''; any.textContent = T('ig.allCities', FALLBACK.allCities); sel.appendChild(any);
    opts.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
    sel.value = keep || '';
  }

  function matches(r) {
    var q = state.q.trim().toLocaleLowerCase();
    var okType = !state.type || r.type === state.type;
    var okCity = !state.city || r.city_ar === state.city;
    var okQ = !q || ((r.name_ar + ' ' + (r.name_fr || '') + ' ' + (r.city_ar || '') + ' ' + (r.city_fr || '') + ' ' + (r.abbreviation || '') + ' ' + (r.status_label || '')).toLocaleLowerCase().indexOf(q) !== -1);
    return okType && okCity && okQ;
  }

  function render() {
    var grid = document.getElementById('igGrid');
    if (!grid) return;
    var list = BASE.filter(matches);
    var count = document.getElementById('igCount');
    if (count) count.textContent = T('ig.count', FALLBACK.count).replace('{n}', list.length).replace('{t}', BASE.length);
    var none = document.getElementById('igNone');
    if (none) none.hidden = list.length > 0;

    grid.replaceChildren();
    list.forEach(function (r) {
      var res = resourcesFor(r.id);
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'ig-card ' + r.type;
      card.setAttribute('data-id', r.id);
      card.setAttribute('aria-label', nameOf(r));

      var strong = document.createElement('strong'); strong.textContent = nameOf(r); card.appendChild(strong);
      var meta = document.createElement('span'); meta.className = 'ig-meta';
      meta.textContent = typeLabel(r) + ' · ' + cityOf(r);
      card.appendChild(meta);

      var badge = document.createElement('span'); badge.className = 'ig-badge ' + (r.status === 'listed_official' ? 'ok' : 'warn');
      badge.textContent = statusLabel(r);
      card.appendChild(badge);

      var links = document.createElement('span'); links.className = 'ig-links';
      var has = false;
      KIND_ORDER.forEach(function (kind) {
        // Always fall back to the verified website stored in the base directory,
        // so a faculty with a known official site never appears "unavailable".
        var url = firstOf(res, kind) || (kind === 'site' ? r.website_url : null);
        if (!url) return;
        url = safeUrl(url);
        if (!url) return;
        has = true;
        var a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = T('ig.' + KIND_KEY[kind], FALLBACK[KIND_KEY[kind]]);
        a.setAttribute('aria-label', T('ig.' + KIND_KEY[kind], FALLBACK[KIND_KEY[kind]]) + ' — ' + nameOf(r));
        links.appendChild(a);
      });
      if (has) {
        var sp = document.createElement('span'); sp.className = 'ig-links-sep'; links.appendChild(sp);
        var space = document.createElement('a');
        space.href = 'university-directory.html#' + r.id;
        space.textContent = T('ig.space', FALLBACK.space) + ' ↗';
        links.appendChild(space);
      } else {
        // No confirmed independent resources: say so honestly and point to the
        // official source page (institutions list / launch announcement) instead
        // of inventing a link.
        var u = document.createElement('span'); u.className = 'ig-none';
        u.textContent = T('ig.unavailable', FALLBACK.unavailable);
        links.appendChild(u);
        if (r.official_source_url) {
          var _su = safeUrl(r.official_source_url);
          var sp2 = document.createElement('a');
          if (_su) { sp2.href = _su; sp2.target = '_blank'; sp2.rel = 'noopener noreferrer'; }
          sp2.textContent = T('ig.sourcePage', FALLBACK.sourcePage);
          sp2.setAttribute('aria-label', T('ig.sourcePage', FALLBACK.sourcePage) + ' — ' + nameOf(r));
          links.appendChild(sp2);
        }
      }
      card.appendChild(links);

      card.addEventListener('click', function (e) {
        if (e.target && e.target.tagName === 'A') return;
        window.location.href = 'university-directory.html#' + r.id;
      });
      grid.appendChild(card);
    });
  }

  function init() {
    if (!document.getElementById('igGrid')) return;
    buildCityOptions();
    var search = document.getElementById('igSearch');
    if (search) search.addEventListener('input', function (e) { state.q = e.target.value; render(); });
    var city = document.getElementById('igCity');
    if (city) city.addEventListener('change', function (e) { state.city = e.target.value; render(); });
    document.querySelectorAll('#igFilters .ig-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        state.type = c.dataset.t || '';
        document.querySelectorAll('#igFilters .ig-chip').forEach(function (x) { x.classList.toggle('on', x === c); });
        render();
      });
    });
    document.addEventListener('cc:lang', function () { buildCityOptions(); render(); });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
