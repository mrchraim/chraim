/* CHRAIM — رمز العودة العائم («الرئيسية» + «رجوع») لكل صفحات الموقع.
   يُحمَّل في كل صفحة، ويحقن نفسه بنفسه (نمط + شريط)، فلا يحتاج أي تعديل في بنية الصفحة.
   الموضع: وسط أسفل الشاشة (الزوايا السفلية مشغولة بالفقاعة الاجتماعية وزر «+»). */
(function () {
  if (window.__chraimBackHome) return;
  window.__chraimBackHome = true;

  var CSS =
    '#chraimBackHome{all:initial;position:fixed!important;inset:auto auto calc(16px + env(safe-area-inset-bottom,0px)) 50%!important;' +
    'transform:translateX(-50%)!important;z-index:900;display:inline-flex!important;flex-direction:row!important;align-items:center!important;' +
    'width:auto!important;height:auto!important;max-height:48px!important;min-height:0!important;margin:0!important;padding:4px!important;gap:4px;' +
    'box-sizing:border-box;background:rgba(11,18,32,.88)!important;color:#fff;border:1px solid rgba(224,192,120,.55)!important;border-radius:999px!important;' +
    'overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);' +
    'font:700 13px/1 system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;direction:rtl}' +
    '#chraimBackHome>*{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex!important;align-items:center;justify-content:center;' +
    'height:38px!important;min-width:0!important;padding:0 16px!important;gap:7px;border-radius:999px!important;color:#fff;' +
    'font:700 13px/1 system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;white-space:nowrap;transition:background .15s,transform .15s}' +
    '#chraimBackHome>.cnb-back{background:rgba(255,255,255,.08)}' +
    '#chraimBackHome>.cnb-back:hover{background:rgba(255,255,255,.18)}' +
    '#chraimBackHome>.cnb-home{background:linear-gradient(135deg,#f0d58a,#c79a3a);color:#0b1220;font-weight:800}' +
    '#chraimBackHome>.cnb-home.is-current{background:rgba(224,192,120,.14);color:#e0c078;box-shadow:inset 0 0 0 1px rgba(224,192,120,.5)}' +
    '#chraimBackHome>*:hover{transform:translateY(-1px)}' +
    '#chraimBackHome>*:focus-visible{outline:2px solid #e0c078;outline-offset:1px}' +
    '#chraimBackHome .cnb-ic{font-size:15px;line-height:1}' +
    '@media(max-width:520px){#chraimBackHome>*{height:36px!important;padding:0 13px!important;font-size:12px}}' +
    '@media print{#chraimBackHome{display:none!important}}';

  function inject() {
    if (document.getElementById('chraimBackHome') || document.getElementById('floatingDock')) return; // الصفحة لديها شريط تنقل خاص بها

    var style = document.createElement('style');
    style.id = 'chraimBackHomeStyle';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);

    var path = location.pathname.replace(/\/index\.html$/, '/');
    var isHome = (path === '/' || path === '');

    var bar = document.createElement('div');
    bar.setAttribute('role', 'navigation');
    bar.id = 'chraimBackHome';
    bar.setAttribute('aria-label', 'تنقّل سريع');

    var home = document.createElement('a');
    home.className = 'cnb-home' + (isHome ? ' is-current' : '');
    home.href = '/';
    home.innerHTML = '<span class="cnb-ic" aria-hidden="true">⌂</span>' +
                     '<span class="cnb-lbl">الرئيسية</span>';
    if (isHome) home.setAttribute('aria-current', 'page');

    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'cnb-back';
    back.setAttribute('aria-label', 'رجوع إلى الصفحة السابقة');
    back.innerHTML = '<span class="cnb-ic" aria-hidden="true">↩</span>' +
                     '<span class="cnb-lbl">رجوع</span>';
    back.addEventListener('click', function () {
      if (window.history && history.length > 1) history.back();
      else location.href = '/';
    });

    bar.appendChild(home);
    bar.appendChild(back);
    (document.body || document.documentElement).appendChild(bar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();