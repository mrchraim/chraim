/* ============================================================
   gender.js — نظام الجنس (محايد / ذكر / أنثى) على مستوى الموقع
   - يحفظ الاختيار في localStorage (cc_gender) ويطبّقه على data-gender
   - يحقن ألوان الذكر/الأنثى في كل الصفحات (نفس لوحة index.html)
   - يحوّل صيغ العربية إلى المؤنّث عند اختيار "أنثى" (نص + ترجمة)
   - يعيد رسم واجهة التطبيق تلقائياً عند تبديل الجنس
   يُحمَّل بعد page-i18n.js وقبل app.js
   ============================================================ */
(function () {
  'use strict';

  var PALETTE = ''
    + ':root[data-gender="male"]{--blue:#1E3A5F;--blue2:#2C5282;--gold:#7EA6C8;--gold2:#BFD6E8;--bg:#F2F5F9;--ink:#1A2535;--card:#FFFFFF;--line:#DCE4EE;--muted:#5A6B82;--soft:#EAEFF5}'
    + ':root[data-gender="female"]{--blue:#5B3A4B;--blue2:#7A4F63;--gold:#C8A0B0;--gold2:#E8D0DB;--bg:#F9F4F6;--ink:#2A1F26;--card:#FFFFFF;--line:#EDE0E5;--muted:#7A6B75;--soft:#F3ECEE}';

  /* ---- الحالة ---- */
  function get() { try { return localStorage.getItem('cc_gender') || 'neutral'; } catch (e) { return 'neutral'; } }
  function set(v) {
    try { localStorage.setItem('cc_gender', v); } catch (e) { }
    document.documentElement.setAttribute('data-gender', v);
    try { document.dispatchEvent(new CustomEvent('cc:gender', { detail: { gender: v } })); } catch (e) { }
  }

  /* ---- خريطة التأنيث (كلمات الواجهة) ---- */
  var PAIRS = [
    /* أفعال أمر — دارجة */
    ['لقا', 'لقي'], ['شوف', 'شوفي'], ['دير', 'ديري'], ['صيفط', 'صيفطي'], ['قول', 'قولي'],
    ['سير', 'سيري'], ['حاول', 'حاولي'], ['جرّب', 'جرّبي'], ['جرب', 'جربي'], ['كمّل', 'كمّلي'],
    ['كمّ', 'كمّلي'], ['دخل', 'دخلي'], ['عاود', 'عاودي'], ['طلب', 'طلبي'], ['سول', 'سولي'],
    ['حط', 'حطي'], ['هز', 'هزّي'], ['صاوب', 'صاوبي'], ['سوّي', 'سوّي'], ['شغّل', 'شغّلي'],
    ['وقّف', 'وقّفي'], ['نزّل', 'نزّلي'], ['صلّح', 'صلّحي'], ['قرر', 'قرّري'], ['بدا', 'بدئي'],
    /* أفعال أمر — فصحى */
    ['اختر', 'اختاري'], ['اكتب', 'اكتبي'], ['احفظ', 'احفظي'], ['حمّل', 'حمّلي'], ['ساهم', 'ساهمي'],
    ['تابع', 'تابعي'], ['أضف', 'أضيفي'], ['اضف', 'اضيفي'], ['سجّل', 'سجّلي'], ['ابدأ', 'ابدئي'],
    ['امسح', 'امسحي'], ['عدّل', 'عدّلي'], ['صحّح', 'صحّحي'], ['راسل', 'راسلي'], ['تواصل', 'تواصلي'],
    ['استعمل', 'استعملي'], ['استخدم', 'استخدمي'], ['ابحث', 'ابحثي'], ['أرسل', 'أرسلي'], ['ارسل', 'ارسلي'],
    ['افتح', 'افتحي'], ['انتقل', 'انتقلي'], ['حوّل', 'حوّلي'], ['قارن', 'قارني'], ['شارك', 'شاركِ'],
    ['سمح', 'سمحي'], ['ثبّت', 'ثبّتي'], ['فعّل', 'فعّلي'], ['عطّل', 'عطّلي'], ['اختبر', 'اختبري'],
    /* أسماء */
    ['الطالب', 'الطالبة'], ['أستاذ', 'أستاذة'], ['المسؤول', 'المسؤولة'], ['مسؤول', 'مسؤولة'],
    ['الزائر', 'الزائرة'], ['زائر', 'زائرة'], ['المشرف', 'المشرفة'], ['مشرف', 'مشرفة'],
    ['الصديق', 'الصديقة'], ['المترشح', 'المترشحة'], ['مترشح', 'مترشحة'], ['المنتقب', 'المنتقبة'],
    /* عبارات */
    ['يمكنك', 'يمكنكِ'], ['مرحبا بك', 'مرحبا بكِ'], ['مرحباً بك', 'مرحباً بكِ'], ['مرحبا بيك', 'مرحبا بيك'],
    ['أهلا بك', 'أهلا بكِ'], ['اهلا بك', 'اهلا بكِ'], ['أهلاً بك', 'أهلاً بكِ'],
    ['كن أول من يساهم', 'كوني أول من تساهم'], ['دير حسابك', 'ديري حسابك'], ['عرف راسك', 'عرفي راسك'],
    ['حط التركيز', 'حطي التركيز'], ['السلام عليكم', 'السلام عليكم']
  ];
  var RX = null;
  function build() {
    var B = '(?<![\\p{L}\\p{N}])', A = '(?![\\p{L}\\p{N}])';
    RX = PAIRS.map(function (p) {
      var w = p[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try { return [new RegExp(B + w + A, 'gu'), p[1]]; }
      catch (e) { return [new RegExp('\\b' + w + '\\b', 'g'), p[1]]; }
    });
  }
  var AR = /[\u0600-\u06FF]/;
  function apply(s) {
    if (get() !== 'female' || !s || typeof s !== 'string' || s.length < 2) return s;
    if (!AR.test(s)) return s;
    if (!RX) build();
    var out = s;
    for (var i = 0; i < RX.length; i++) out = out.replace(RX[i][0], RX[i][1]);
    return out;
  }

  /* ---- تطبيق التأنيث على عناصر data-i18n في الصفحة ---- */
  function applyDom() {
    if (get() !== 'female') return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = apply(el.textContent);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var s = apply(el.innerHTML);
      el.innerHTML = (typeof window.CHRVVIM_SANITIZE_HTML === 'function')
        ? window.CHRVVIM_SANITIZE_HTML(s) : s;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', apply(el.getAttribute('aria-label') || ''));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.setAttribute('title', apply(el.getAttribute('title') || ''));
    });
  }

  /* ---- حقن الألوان (مفيد في الصفحات غير index.html) ---- */
  function injectPalette() {
    if (document.getElementById('cc-gender-palette')) return;
    var st = document.createElement('style');
    st.id = 'cc-gender-palette';
    st.textContent = PALETTE;
    document.head.appendChild(st);
  }

  /* ---- التهيئة المبكرة ---- */
  injectPalette();
  document.documentElement.setAttribute('data-gender', get());

  /* ---- تغليف ترجمة الصفحات (page-i18n) ---- */
  function wrapPageI18n() {
    try {
      var P = window.CHRVVIM_PAGE;
      if (!P || P.__ccGenderWrapped) return;
      P.__ccGenderWrapped = true;
      var origT = P.t;
      P.t = function (k, l) { return apply(origT(k, l)); };
      var origApply = P.apply;
      P.apply = function (l) { var r = origApply(l); try { applyDom(); } catch (e) { } return r; };
    } catch (e) { }
  }
  wrapPageI18n();
  /* قد يُحمَّل page-i18n متأخراً في بعض الصفحات */
  document.addEventListener('DOMContentLoaded', wrapPageI18n);

  /* ---- إعادة رسم الواجهة عند تبديل الجنس ---- */
  var _last = get();
  function rerender() {
    var g = get();
    if (g === _last) return;
    _last = g;
    try { if (window.CHRVVIM_PAGE) window.CHRVVIM_PAGE.apply(window.CHRVVIM_PAGE.lang()); } catch (e) { }
    try { if (typeof setUILang === 'function' && typeof UILANG !== 'undefined') setUILang(UILANG); } catch (e) { }
    try { if (window.Exams) window.Exams.render(); } catch (e) { }
  }
  new MutationObserver(rerender).observe(document.documentElement, { attributes: true, attributeFilter: ['data-gender'] });
  document.addEventListener('cc:gender', function () { setTimeout(rerender, 0); });

  /* ---- API عام ---- */
  window.CHRVVIM_GENDER = { get: get, set: set, apply: apply, applyDom: applyDom };
})();
