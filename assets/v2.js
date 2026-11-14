/* CHRAIM CAMPUS v2 — unified chrome (header/footer/theme) */
(function () {
  'use strict';
  if (window.__chraimV2) return;
  window.__chraimV2 = true;

  var SKIP = ['/nexus.html','/admin.html','/admin-dashboard.html','/platform/dashboard.html','/platform/account.html','/portal.html'];
  var path = location.pathname;
  if (SKIP.some(function (p) { return path === p || path.endsWith(p); })) return;

  /* ── Theme ──────────────────────────────────────────────── */
  var DARK_DEFAULT = ['/portal.html','/campus2.html','/ai-assistant.html','/portal-ibn-zohr.html','/portal-v2.html','/portal-simple.html','/portal-tajawal.html','/rafiq-altalib.html','/student.html','/myuiz-guide.html'];
  var saved = null;
  try { saved = localStorage.getItem('chraim-v2-theme'); } catch (e) {}
  var dark = saved ? saved === 'dark'
    : DARK_DEFAULT.some(function (p) { return path === p || path.endsWith(p); });
  document.documentElement.setAttribute('data-v2theme', dark ? 'dark' : 'light');

  /* ── Hide legacy chrome ─────────────────────────────────── */
  ['header','footer','.announcement','#chraimBackHome','#backHomeStyle'].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { el.style.display = 'none'; });
  });

  var body = document.body;

  function svgMark(color) {
    return '<svg viewBox="0 0 48 48" role="img" aria-hidden="true"><g fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linejoin="round"><path d="M24 3 42 24 24 45 6 24Z"/><path d="M24 12.5 34.5 24 24 35.5 13.5 24Z"/><circle cx="24" cy="24" r="2.6" fill="' + color + '" stroke="none"/></g></svg>';
  }

  var NAV = [
    ['/portal.html','البوابة'],
    ['/platform/','المنصة'],
    ['/university-directory.html','دليل ابن زهر'],
    ['/academic-offer.html','التكوينات'],
    ['/sources.html','المصادر']
  ];

  function norm(p) { return p.replace(/\/index\.html$/, '/').replace(/\/$/, ''); }
  var here = norm(path);

  /* ── Skip link ──────────────────────────────────────────── */

  /* ── Header ─────────────────────────────────────────────── */
  var header = document.createElement('header');
  header.className = 'v2-header';
  header.setAttribute('role', 'banner');
  header.setAttribute('aria-label', 'CHRAIM Campus');
  var skip = document.createElement('a');
  skip.className = 'v2-skip';
  skip.href = '#main';
  skip.textContent = 'تخطّي إلى المحتوى';
  header.appendChild(skip);
  var navHtml = NAV.map(function (item) {
    var current = norm(item[0]) === here ? ' aria-current="page"' : '';
    return '<a href="' + item[0] + '"' + current + '>' + item[1] + '</a>';
  }).join('');
  var mobileHtml = NAV.map(function (item) {
    return '<a href="' + item[0] + '"><span>' + item[1] + '</span><small>' + item[0].replace('/', '') + '</small></a>';
  }).join('');

  header.innerHTML =
    '<div class="v2-header__bar">' +
      '<a class="v2-brand" href="/">' +
        '<span class="v2-brand__mark">' + svgMark('#F5EFDD') + '</span>' +
        '<span class="v2-brand__word">CHR<b>AIM</b><small>CAMPUS · AGADIR</small></span>' +
      '</a>' +
      '<nav class="v2-nav" aria-label="CHRAIM — التنقل الرئيسي">' + navHtml + '</nav>' +
      '<div class="v2-header__actions">' +
        '<button class="v2-iconbtn v2-theme" type="button" aria-label="تبديل المظهر" title="تبديل المظهر">☾</button>' +
        '<a class="v2-cta" href="/portal.html">ابدأ البوابة <span aria-hidden="true">↙</span></a>' +
        '<button class="v2-burger" type="button" aria-label="القائمة" aria-expanded="false" aria-controls="v2Mobile"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      '</div>' +
    '</div>' +
    '<div class="v2-mobile" id="v2Mobile" hidden>' + mobileHtml + '</div>';
  body.insertBefore(header, skip.nextSibling);

  /* ── Footer ─────────────────────────────────────────────── */
  var footer = document.createElement('footer');
  footer.className = 'v2-footer';
  footer.setAttribute('role', 'presentation');
  footer.innerHTML =
    '<nav class="v2-footer__inner" aria-label="CHRAIM — معلومات وأقسام">' +
      '<div class="v2-footer__top">' +
        '<div class="v2-footer__brand">' +
          '<span class="v2-footer__mark">' + svgMark('#241207') + '</span>' +
          '<span>' +
            '<span class="v2-footer__wordmark">CHR<span>AIM</span></span>' +
            '<p class="v2-footer__tag">دليل الطلبة المستقل — جامعة ابن زهر، أكادير. معلومة موثوقة، مصادر رسمية، وبوابة واحدة لكل الطالب.</p>' +
          '</span>' +
        '</div>' +
        '<div class="v2-footer__cols">' +
          '<div><h3 class="v2-footer__heading">استكشف</h3><ul>' +
            '<li><a href="/portal.html">بوابة الطالب</a></li>' +
            '<li><a href="/platform/">المنصة — امتحانات وملخصات</a></li>' +
            '<li><a href="/etablissements/">دليل المؤسسات (24)</a></li>' +
            '<li><a href="/orientation.html">مرشد التوجيه</a></li>' +
          '</ul></div>' +
          '<div><h3 class="v2-footer__heading">المصادر</h3><ul>' +
            '<li><a href="/university-directory.html">دليل جامعة ابن زهر</a></li>' +
            '<li><a href="/academic-offer.html">عرض التكوينات</a></li>' +
            '<li><a href="/academic-updates.html">المستجدات الجامعية</a></li>' +
            '<li><a href="/sources.html">المصادر الرسمية</a></li>' +
          '</ul></div>' +
          '<div><h3 class="v2-footer__heading">الدعم</h3><ul>' +
            '<li><a href="/support/">الدعم والمساعدة</a></li>' +
            '<li><a href="/students-guide.html">دليل الطالب</a></li>' +
            '<li><a href="/privacy.html">سياسة الخصوصية</a></li>' +
            '<li><a href="/terms.html">الشروط</a></li>' +
          '</ul></div>' +
        '</div>' +
      '</div>' +
      '<div class="v2-footer__bottom">' +
        '<span>© 2026 <b>CHRAIM CAMPUS</b> — مشروع طلابي مستقل، غير رسمي</span>' +
        '<span>تحقق دائمًا من المصدر الرسمي: <a href="https://www.uiz.ac.ma/" target="_blank" rel="noopener noreferrer" style="color:#E5B267;text-decoration:none">uiz.ac.ma</a></span>' +
      '</div>' +
    '</nav>';
  body.appendChild(footer);

  /* ── Header behaviour ───────────────────────────────────── */
  var burger = header.querySelector('.v2-burger');
  var mobile = header.querySelector('.v2-mobile');
  burger.addEventListener('click', function () {
    var open = !mobile.hidden;
    mobile.hidden = open;
    burger.setAttribute('aria-expanded', String(!open));
  });

  var themeBtn = header.querySelector('.v2-theme');
  function syncThemeIcon() { themeBtn.textContent = document.documentElement.getAttribute('data-v2theme') === 'dark' ? '☀' : '☾'; }
  themeBtn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-v2theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-v2theme', next);
    try { localStorage.setItem('chraim-v2-theme', next); } catch (e) {}
    syncThemeIcon();
  });
  syncThemeIcon();
})();
