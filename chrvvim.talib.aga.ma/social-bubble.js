/* ============================================================
   social-bubble.js — فقاعة "حساباتي" العائمة (تواصل مباشر)
   زر عائم على جانب الشاشة (ليس في الأسفل/الفوتر) يفتح بطاقات
   حسابات المؤسس: Instagram / TikTok / Facebook / WhatsApp.
   الحسابات تجي من window.CHRVVIM.SOCIALS (campus-data.js).
   ============================================================ */
(function () {
  'use strict';

  var S = {
    'sb.accounts': { ar: 'حساباتي', fr: 'Mes comptes', en: 'My accounts' },
    'sb.sub':      { ar: 'تابعني أو تواصل معايا مباشرة 👇', fr: 'Suivez-moi ou contactez-moi 👇', en: 'Follow or reach me 👇' },
    'sb.close':    { ar: 'إغلاق', fr: 'Fermer', en: 'Close' },
    'sb.chat':     { ar: 'تواصل مباشر', fr: 'Contact direct', en: 'Direct contact' }
  };
  function lang() { try { return (typeof UILANG !== 'undefined' && UILANG) ? UILANG : 'ar'; } catch (e) { return 'ar'; } }
  function t(k) { var e = S[k]; return e ? (e[lang()] || e.ar) : k; }

  function build() {
    if (document.getElementById('ccSocialFab')) return;
    var accounts = (window.CHRVVIM && window.CHRVVIM.SOCIALS) || [
      { i: '📷', n: 'Instagram', l: '@chrvvim', u: 'https://www.instagram.com/chrvvim/' },
      { i: '📷', n: 'Instagram · RIQQA', l: '@riqqa.ma', u: 'https://www.instagram.com/riqqa.ma/' },
      { i: '🎵', n: 'TikTok', l: '@chrvvvim', u: 'https://www.tiktok.com/@chrvvvim' },
      { i: 'f', n: 'Facebook', l: 'صفحة المشروع', u: 'https://www.facebook.com/share/1FJFNfzzTQ/' },
      { i: '💬', n: 'WhatsApp', l: '+212 665 366 326', u: 'https://wa.me/212665366326' }
    ];
    if (!accounts.length) return;

    var st = document.createElement('style');
    st.id = 'cc-social-style';
    st.textContent = ''
      + '#ccSocialFab{position:fixed;bottom:18px;left:16px;z-index:960;display:inline-flex;align-items:center;gap:8px;'
      + 'padding:11px 16px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-weight:800;font-size:.85rem;'
      + 'background:linear-gradient(135deg,var(--gold,#B89B5E),#f0c553);color:#0b2a6f;'
      + 'box-shadow:0 8px 24px rgba(9,28,55,.28);transition:transform .15s,box-shadow .15s}'
      + '#ccSocialFab:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(9,28,55,.34)}'
      + '#ccSocialFab .ccs-ic{font-size:1.05rem;line-height:1}'
      + '#ccSocialPanel{position:fixed;bottom:70px;left:16px;z-index:961;width:min(320px,calc(100vw - 32px));'
      + 'background:var(--card,#fff);color:var(--ink,#1B2436);border:1px solid var(--line,#D9DEE7);border-radius:18px;'
      + 'box-shadow:0 18px 50px rgba(9,28,55,.30);padding:14px;animation:ccsPop .18s ease}'
      + '@keyframes ccsPop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'
      + '#ccSocialPanel[hidden]{display:none}'
      + '#ccSocialPanel h3{margin:0 0 2px;font-size:1rem}'
      + '#ccSocialPanel .ccs-sub{margin:0 0 10px;font-size:.78rem;color:var(--muted,#667085);line-height:1.6}'
      + '#ccSocialPanel .ccs-list{display:flex;flex-direction:column;gap:6px}'
      + '#ccSocialPanel a.ccs-acc{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;'
      + 'border:1px solid var(--line,#D9DEE7);background:var(--soft,#F7F5F0);text-decoration:none;color:inherit;transition:transform .12s}'
      + '#ccSocialPanel a.ccs-acc:hover{transform:translateX(-2px)}'
      + '#ccSocialPanel a.ccs-acc i{font-style:normal;font-size:1.15rem;width:26px;text-align:center}'
      + '#ccSocialPanel a.ccs-acc b{display:block;font-size:.85rem}'
      + '#ccSocialPanel a.ccs-acc small{display:block;font-size:.72rem;color:var(--muted,#667085)}'
      + '#ccSocialPanel .ccs-foot{margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px}'
      + '#ccSocialPanel .ccs-close{border:0;background:var(--soft,#F7F5F0);color:inherit;border-radius:10px;padding:8px 14px;cursor:pointer;font:inherit;font-weight:700;font-size:.78rem}';
    document.head.appendChild(st);

    var fab = document.createElement('button');
    fab.id = 'ccSocialFab';
    fab.type = 'button';
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = '<span class="ccs-ic" aria-hidden="true">💬</span><span class="ccs-tx"></span>';

    var panel = document.createElement('div');
    panel.id = 'ccSocialPanel';
    panel.setAttribute('role', 'dialog');
    panel.hidden = true;
    panel.innerHTML = '<h3></h3><p class="ccs-sub"></p><div class="ccs-list">' +
      accounts.map(function (a) {
        return '<a class="ccs-acc" href="' + String(a.u || '#') + '" target="_blank" rel="noopener noreferrer">' +
          '<i aria-hidden="true">' + String(a.i || '🔗') + '</i>' +
          '<span><b>' + String(a.n || '') + '</b><small>' + String(a.l || '') + '</small></span></a>';
      }).join('') +
      '</div><div class="ccs-foot"><button type="button" class="ccs-close"></button></div>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    var tx = fab.querySelector('.ccs-tx');
    var h3 = panel.querySelector('h3');
    var sub = panel.querySelector('.ccs-sub');
    var close = panel.querySelector('.ccs-close');
    function localize() {
      tx.textContent = t('sb.accounts');
      h3.textContent = t('sb.accounts');
      sub.textContent = t('sb.sub');
      close.textContent = t('sb.close');
      fab.title = t('sb.accounts');
      fab.setAttribute('aria-label', t('sb.accounts'));
    }
    localize();

    function open() { panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); }
    function shut() { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); }
    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.hidden) open(); else shut();
    });
    close.addEventListener('click', shut);
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== fab) shut();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { shut(); fab.focus(); }
    });

    /* إعادة الترجمة عند تبديل لغة الواجهة أو الجنس */
    document.addEventListener('cc:lang', localize);
    document.addEventListener('cc:gender', localize);
    try { if (window.CHRVVIM_PAGE) localize(); } catch (e) { }
    document.addEventListener('DOMContentLoaded', localize);
    window.addEventListener('load', localize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
  /* campus-data.js مُحمَّل بـ defer — ننتظر load للتأكد من وجود SOCIALS */
  window.addEventListener('load', build);
})();
