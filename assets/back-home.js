/* CHRAIM — رمز العودة العائم («الرئيسية» + «رجوع») لكل صفحات الموقع.
   يُحمَّل في كل صفحة، ويحقن نفسه بنفسه (نمط + شريط)، فلا يحتاج أي تعديل في بنية الصفحة.
   الموضع: وسط أسفل الشاشة (الزوايا السفلية مشغولة بالفقاعة الاجتماعية وزر «+»). */
(function () {
  if (window.__chraimBackHome) return;
  window.__chraimBackHome = true;

  var CSS =
    '#chraimBackHome{position:fixed;left:50%;transform:translateX(-50%);' +
    'bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:900;' +
    'display:inline-flex;align-items:stretch;background:rgba(11,18,32,.93);color:#fff;' +
    'border:1px solid rgba(215,180,106,.5);border-radius:999px;overflow:hidden;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.35);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
    'font:700 13px/1 system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;direction:rtl}' +
    '#chraimBackHome>*{appearance:none;box-sizing:border-box;border:0;background:none;color:inherit;' +
    'cursor:pointer;text-decoration:none;padding:10px 16px;display:inline-flex;align-items:center;' +
    'gap:7px;font:inherit;white-space:nowrap}' +
    '#chraimBackHome>.cnb-back{border-inline-start:1px solid rgba(255,255,255,.16)}' +
    '#chraimBackHome>.cnb-home{background:linear-gradient(135deg,#e0c078,#c79a3a);color:#0b1220;font-weight:800}' +
    '#chraimBackHome>.cnb-home.is-current{background:none;color:#e0c078;' +
    'box-shadow:inset 0 0 0 1px rgba(224,192,120,.5)}' +
    '#chraimBackHome>*:hover{filter:brightness(1.12)}' +
    '#chraimBackHome>*:focus-visible{outline:2px solid #e0c078;outline-offset:-2px}' +
    '#chraimBackHome .cnb-ic{font-size:15px;line-height:1}' +
    '@media(max-width:520px){#chraimBackHome{font-size:12px}#chraimBackHome>*{padding:9px 13px}}';

  function inject() {
    if (document.getElementById('chraimBackHome')) return;

    var style = document.createElement('style');
    style.id = 'chraimBackHomeStyle';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);

    var path = location.pathname.replace(/\/index\.html$/, '/');
    var isHome = (path === '/' || path === '');

    var bar = document.createElement('nav');
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
