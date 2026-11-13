/* CHRAIM CAMPUS — Portal dashboard behaviour (لا بيانات وهمية) */
(function () {
  'use strict';
  if (window.__chraimPD) return;
  window.__chraimPD = true;

  var root = document.querySelector('.pd-shell');
  if (!root) return;

  /* ── 1. Theme (نفس سمة الموقع: light افتراضياً) ─────────── */
  var saved = null;
  try { saved = localStorage.getItem('chraim-v2-theme'); } catch (e) { /* ignore */ }
  document.documentElement.setAttribute('data-v2theme', saved === 'dark' ? 'dark' : 'light');
  var pdTheme = document.getElementById('pdTheme');
  function syncIcon() {
    if (!pdTheme) return;
    pdTheme.textContent = document.documentElement.getAttribute('data-v2theme') === 'dark' ? '☀' : '☾';
  }
  if (pdTheme) pdTheme.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-v2theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-v2theme', next);
    try { localStorage.setItem('chraim-v2-theme', next); } catch (e) { /* ignore */ }
    syncIcon();
  });
  syncIcon();

  /* ── 2. Drawer للهاتف ───────────────────────────────────── */
  var burger = document.getElementById('pdBurger');
  var backdrop = root.querySelector('.pd-backdrop');
  function setSide(open) {
    root.classList.toggle('side-open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) burger.addEventListener('click', function () { setSide(!root.classList.contains('side-open')); });
  if (backdrop) backdrop.addEventListener('click', function () { setSide(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSide(false); });

  /* ── 3. التوجيه الفعلي: تفعيل التبويب + التركيز + تأكيد مرئي ── */
  var ROUTES = {
    smart:    { label: 'لوحة التحكم',          focus: '#sname' },
    search:   { label: 'البحث عن فوجك',        focus: '#q' },
    rooms:    { label: 'قاعات الأفواج',        focus: null },
    prof:     { label: 'الدكاترة والأساتذة',   focus: '#pq' },
    tt:       { label: 'استعمال الزمن',        focus: '#ttg' },
    dist:     { label: 'توزيع الأفواج',        focus: null },
    subjects: { label: 'المواد والوحدات',      focus: '#subjSemester' },
    exams:    { label: 'الامتحانات والفروض',   focus: null },
    docs:     { label: 'وثائق المسلك',         focus: '#dsem' },
    legal:    { label: 'الموسوعة القانونية',   focus: null },
    learn:    { label: 'الدروس والملخصات',     focus: null },
    gpa:      { label: 'النقط والمعدّل',       focus: '.grow input[type="text"]' },
    mytt:     { label: 'جدولتي الشخصي',        focus: '#myttSubj' },
    deadlines:{ label: 'مواعيدي',              focus: '#dlTitle' },
    university:{ label: 'الجامعة والتكوينات',  focus: null },
    comments: { label: 'التعليقات',            focus: '#ctext' },
    stats:    { label: 'الإحصائيات',           focus: null },
    about:    { label: 'عن CHRAIM',            focus: null }
  };

  var toastEl = null;
  var toastTimer = null;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'pd-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }

  function activate(p) {
    var tab = document.querySelector('.tab[data-p="' + p + '"]');
    if (tab) { tab.click(); return true; }
    return false;
  }
  function activateLaunch(btn) {
    var p = btn.getAttribute('data-p');
    if (!p) return;
    var route = ROUTES[p] || { label: p, focus: null };
    var ok = activate(p);
    if (!ok) return;
    setSide(false);
    markCurrent(btn);
    showToast('فُتح — ' + route.label);
    var panel = document.getElementById('p-' + p);
    if (panel) {
      panel.classList.remove('pd-flash');
      void panel.offsetWidth; // restart animation
      panel.classList.add('pd-flash');
      window.setTimeout(function () { panel.classList.remove('pd-flash'); }, 1600);
    }
    var main = document.getElementById('main');
    var scrollTarget = panel || main;
    if (route.focus) {
      window.setTimeout(function () {
        var el = document.querySelector(route.focus);
        if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        else if (scrollTarget) scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else if (scrollTarget) {
      scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function markCurrent(btn) {
    root.querySelectorAll('.pd-nav [aria-current]').forEach(function (b) { b.removeAttribute('aria-current'); });
    if (!btn || !btn.closest) return;
    var navBtn = btn.closest('.pd-nav button[data-p]');
    if (navBtn) navBtn.setAttribute('aria-current', 'page');
  }
  var sideButtons = Array.prototype.slice.call(root.querySelectorAll('.pd-nav button[data-p], .pd-ajid button[data-p]'));
  sideButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { activateLaunch(btn); });
  });
  root.querySelectorAll('.pd-nav a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () { setSide(false); });
  });
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('.tab[data-p]') : null;
    if (t) {
      var btn = root.querySelector('.pd-nav button[data-p="' + t.getAttribute('data-p') + '"]');
      markCurrent(btn);
    }
  });
  markCurrent(root.querySelector('.pd-nav button[data-p="smart"]'));

  /* ── 4. البحث في الـ Topbar → البحث الحقيقي في الصفحة ──── */
  function gotoSearch() {
    var ig = document.getElementById('igSearch');
    if (ig) {
      ig.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(function () { ig.focus(); }, 260);
    }
  }
  var searchBtn = document.getElementById('pdSearch');
  if (searchBtn) searchBtn.addEventListener('click', gotoSearch);
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      gotoSearch();
    }
  });

  /* ── 5. تحية + تاريخ اليوم ──────────────────────────────── */
  var word = document.getElementById('pdGreetWord');
  if (word) {
    var hr = new Date().getHours();
    word.textContent = hr < 12 ? 'صباح الخير' : 'مساء الخير';
  }
  var dEl = document.getElementById('pdDate');
  if (dEl) {
    try {
      dEl.textContent = new Intl.DateTimeFormat('ar-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    } catch (e) {
      dEl.textContent = new Date().toLocaleDateString();
    }
  }

  /* ── 6. شريط المؤسس → تبويب «نبذة» ─────────────────────── */
  var founderBtn = document.getElementById('pdFounder');
  if (founderBtn) founderBtn.addEventListener('click', function () {
    var tab = document.querySelector('.tab[data-p="about"]');
    if (tab) {
      tab.click();
      var panel = document.getElementById('p-about');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      markCurrent(null);
    }
  });

  /* ── 7. Scrollspy: تمييز روابط الأقسام بالـ Sidebar أثناء التمرير ── */
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          var link = root.querySelector('.pd-nav a[href="#' + id + '"]');
          if (link) {
            root.querySelectorAll('.pd-nav [aria-current]').forEach(function (b) { b.removeAttribute('aria-current'); });
            link.setAttribute('aria-current', 'page');
          }
        }
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
    ['instGate', 'campus-announcements'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ── 8. «اليوم» — العدّ التنازلي لأقرب أجل رسمي ────────── */
  (function deadlineCountdown() {
    var dlText = document.getElementById('pdDeadlineText');
    var cd = document.getElementById('pdCountdown');
    if (!dlText || !cd) return;
    var link = document.getElementById('pdDeadlineLink');
    function units(el, key, v) { var n = el.querySelector('[data-u="' + key + '"]'); if (n) n.textContent = String(v).padStart(2, '0'); }
    function tickParts(target) {
      var diff = Math.max(0, target - Date.now());
      return {
        d: Math.floor(diff / 864e5),
        h: Math.floor((diff % 864e5) / 36e5),
        m: Math.floor((diff % 36e5) / 60e3),
        s: Math.floor((diff % 60e3) / 1e3)
      };
    }
    function paint(p) { units(cd, 'd', p.d); units(cd, 'h', p.h); units(cd, 'm', p.m); units(cd, 's', p.s); }
    function fallback() {
      dlText.textContent = 'لا توجد آجال رسمية معلنة حالياً — تابع المستجدات الجامعية للبقاء على اطلاع.';
      cd.style.opacity = '.35';
    }
    fetch('announcements.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var items = (data && Array.isArray(data.items)) ? data.items : [];
        var now = Date.now();
        var events = [];
        items.forEach(function (a) {
          var endStr = a.ends_at || a.starts_at || a.date;
          if (!endStr) return;
          var end = new Date(endStr);
          if (isNaN(end.getTime())) return;
          if (end.getTime() >= now) events.push({ title: a.title || '', end: end });
        });
        events.sort(function (a, b) { return a.end - b.end; });
        var next = events[0];
        if (!next) { fallback(); return; }
        dlText.textContent = next.title;
        if (link && next.title) { link.setAttribute('href', '/academic-updates.html'); }
        paint(tickParts(next.end.getTime()));
        window.setInterval(function () {
          var p = tickParts(next.end.getTime());
          paint(p);
          if (p.d + p.h + p.m + p.s === 0) { dlText.textContent = 'لقد انتهى هذا الأجل.'; }
        }, 1000);
      })
      .catch(fallback);
  })();

  /* ── 9. «معلومة قانونية اليوم» — من الموسوعة (تاريخية يومياً) ── */
  (function dailyFact() {
    var titleEl = document.getElementById('pdFactTitle');
    var textEl = document.getElementById('pdFactText');
    var moreBtn = document.getElementById('pdFactMore');
    if (!titleEl || !textEl || !moreBtn) return;
    var data = window.LEGAL_ENCYCLOPEDIA;
    if (!Array.isArray(data) || !data.length) {
      titleEl.textContent = 'الموسوعة القانونية';
      textEl.textContent = 'افتح الموسوعة للاطلاع على 40 موضوعاً قانونياً بكلمات بسيطة.';
      return;
    }
    var daySeed = Math.floor(Date.now() / 86400000);
    var topic = data[daySeed % data.length];
    var blocks = Array.isArray(topic.content_blocks) ? topic.content_blocks : [];
    var longest = blocks.reduce(function (acc, b) {
      return (b && b.text && b.text.length > (acc ? acc.length : 0)) ? b.text : acc;
    }, '');
    titleEl.textContent = topic.title;
    textEl.textContent = longest ? String(longest).slice(0, 240) + (String(longest).length > 240 ? '…' : '') : '';
    moreBtn.addEventListener('click', function () {
      var tab = document.querySelector('.tab[data-p="legal"]');
      if (tab) {
        tab.click();
        var panel = document.getElementById('p-legal');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  })();

  /* ── 6. مواعيد قادمة من announcements.json (بيانات رسمية) ── */
  var rail = document.getElementById('pdEvents');
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function renderEvents(list) {
    if (!rail) return;
    if (!list.length) {
      rail.innerHTML = '<p class="pd-events-empty">لا توجد مواعيد رسمية قادمة مسجلة حالياً. تابع <a href="/academic-updates.html">المستجدات الجامعية</a> للاطلاع على كل الإعلانات الرسمية.</p>';
      return;
    }
    var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    rail.innerHTML = list.map(function (ev) {
      var day = String(ev.d.getDate()).padStart(2, '0');
      var mon = months[ev.d.getMonth()];
      var title = escapeHtml(String(ev.title).slice(0, 160));
      var href = ev.url ? escapeHtml(ev.url) : '/academic-updates.html';
      return '<li class="pd-event"><div class="pd-event__date"><b>' + day + '</b><span>' + mon + '</span></div><div><a href="' + href + '" target="_blank" rel="noopener noreferrer">' + title + '</a></div></li>';
    }).join('');
  }
  if (rail) {
    fetch('announcements.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var items = data && Array.isArray(data.items) ? data.items : [];
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var upcoming = items.map(function (a) {
          var startStr = a.starts_at || a.date || a.updated_at;
          var endStr = a.ends_at || startStr;
          if (!endStr) return null;
          var end = new Date(endStr);
          if (isNaN(end.getTime()) || end < today) return null;
          var start = startStr ? new Date(startStr) : end;
          if (isNaN(start.getTime())) start = end;
          return { d: start >= today ? start : end, title: a.title || '', url: a.url || '' };
        }).filter(Boolean).sort(function (a, b) { return a.d - b.d; }).slice(0, 4);
        renderEvents(upcoming);
      })
      .catch(function () { renderEvents([]); });
  }
})();
