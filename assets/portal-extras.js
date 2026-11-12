/* portal-extras.js — vanilla JS for portal premium components */
(function () {
  'use strict';

  function init() {
    // Lamp toggle
    var lampWrap = document.getElementById('peLampWrap');
    var lampBtn = document.getElementById('peLampBtn');
    if (lampWrap && lampBtn) {
      var stored = null;
      try { stored = localStorage.getItem('pe-lamp'); } catch (e) {}
      var isOn = stored === 'on';
      function sync() {
        lampWrap.classList.toggle('is-on', isOn);
        lampBtn.setAttribute('aria-pressed', String(isOn));
      }
      sync();
      // Apply stored theme on load
      if (isOn) document.documentElement.setAttribute('data-theme', 'dark');
      lampBtn.addEventListener('click', function () {
        isOn = !isOn;
        try { localStorage.setItem('pe-lamp', isOn ? 'on' : 'off'); } catch (e) {}
        sync();
        // Apply theme to document
        if (isOn) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      });
    }

    // Download button (demo: scroll to top / trigger print)
    var dlBtn = document.getElementById('peDownloadBtn');
    if (dlBtn) {
      dlBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();