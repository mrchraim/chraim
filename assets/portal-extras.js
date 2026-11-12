/* portal-extras.js — lamp (theme) toggle shared by every CHRAIM page.
   Reads and writes the SAME theme keys as assets/design-upgrade.js so the lamp
   and any header theme button always agree — one source of truth, no fighting. */
(function () {
  'use strict';

  var KEYS = ['chrvvim-theme', 'chraim_theme', 'cc_theme'];
  var root = document.documentElement;
  var store = (typeof localStorage === 'undefined') ? null : localStorage;

  function readTheme() {
    if (!store) return null;
    for (var i = 0; i < KEYS.length; i++) {
      var v = store.getItem(KEYS[i]);
      if (v === 'light' || v === 'dark') return v;
    }
    return null;
  }

  function writeTheme(t) {
    if (!store) return;
    for (var i = 0; i < KEYS.length; i++) store.setItem(KEYS[i], t);
  }

  function current() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return readTheme() || 'light';
  }

  function sync(btn, wrap) {
    var dark = current() === 'dark';
    wrap.classList.toggle('is-on', dark);
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute(
      'aria-label',
      dark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'
    );
  }

  function init() {
    var wrap = document.getElementById('peLampWrap');
    var btn = document.getElementById('peLampBtn');
    if (!wrap || !btn) return;

    sync(btn, wrap);

    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      writeTheme(next);
      sync(btn, wrap);
    });

    // Follow any other control that changes the theme (header button, system).
    if ('MutationObserver' in window) {
      new MutationObserver(function () { sync(btn, wrap); })
        .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
