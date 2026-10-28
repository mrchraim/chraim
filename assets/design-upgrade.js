/* chrvvim Campus — dependency-free progressive UI enhancements. */
(() => {
  'use strict';
  const doc = document, root = doc.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k,v) { try { localStorage.setItem(k,v); } catch (_) {} }
  };

  // Honor explicit preference first, then system preference on first visit.
  const savedTheme = storage.get('chrvvim-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;
  else if (!root.dataset.theme) root.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  function applyTheme(theme) {
    const change = () => { root.dataset.theme = theme; storage.set('chrvvim-theme', theme); };
    const active = doc.activeElement;
    if (!reduced && document.startViewTransition) {
      try { doc.startViewTransition(change); } catch (_) { change(); }
    } else change();
    doc.querySelectorAll('#themeToggle, [data-theme-toggle], #darkToggle').forEach(el => {
      el.setAttribute('aria-pressed', String(theme === 'dark'));
      const label = theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي';
      if (!el.hasAttribute('data-preserve-label')) el.setAttribute('aria-label', label);
    });
    if (active && active.isConnected) active.focus({preventScroll:true});
  }
  doc.querySelectorAll('#themeToggle, [data-theme-toggle], #darkToggle').forEach(el => {
    if (el.dataset.designThemeBound) return;
    el.dataset.designThemeBound = '1';
    el.addEventListener('click', e => {
      // Existing theme handler may also be attached. Prevent double-toggle by using one source of truth.
      e.preventDefault();
      e.stopImmediatePropagation();
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    }, true);
  });

  // Font-size control is intentionally independent of theme toggles.
  const fontButton = doc.querySelector('#fontToggle, [data-font-toggle]');
  const savedFont = storage.get('chrvvim-font-scale');
  let largeFont = savedFont === 'large';
  function applyFont() {
    root.classList.toggle('design-font-large', largeFont);
    if (fontButton) {
      fontButton.setAttribute('aria-pressed', String(largeFont));
      fontButton.setAttribute('aria-label', largeFont ? 'تصغير حجم الخط' : 'تكبير حجم الخط');
      fontButton.textContent = largeFont ? 'A−' : 'A+';
    }
    storage.set('chrvvim-font-scale', largeFont ? 'large' : 'normal');
  }
  if (fontButton) {
    applyFont();
    fontButton.addEventListener('click', () => { largeFont = !largeFont; applyFont(); });
  }

  // Reveal content gently, with a no-animation fallback.
  const revealTargets = doc.querySelectorAll('.hero h1, .hero h2, .hero-title, .service-card, .feature-card, .tool-card, .stat-card, [data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    }), {threshold: .12});
    revealTargets.forEach(el => { el.classList.add('design-reveal'); revealObserver.observe(el); });
  } else revealTargets.forEach(el => el.classList.add('is-visible'));

  // Animate only numeric labels explicitly marked for counters; no data is invented.
  const counters = doc.querySelectorAll('[data-count-to]');
  if ('IntersectionObserver' in window && !reduced) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target, end = Number(el.dataset.countTo);
      if (!Number.isFinite(end) || end < 0) { counterObserver.unobserve(el); return; }
      const start = performance.now(), duration = 900;
      const tick = now => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))).toLocaleString(el.lang || 'ar');
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick); counterObserver.unobserve(el);
    }), {threshold: .5});
    counters.forEach(el => counterObserver.observe(el));
  } else counters.forEach(el => { el.textContent = Number(el.dataset.countTo).toLocaleString(el.lang || 'ar'); });

  // Restrained pointer tilt on cards; disabled on touch and reduced motion.
  if (!reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    doc.querySelectorAll('.service-card, .feature-card, .tool-card, [data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect(), x = (e.clientX-r.left)/r.width, y = (e.clientY-r.top)/r.height;
        card.style.transform = `perspective(900px) rotateX(${(0.5-y)*2.4}deg) rotateY(${(x-0.5)*2.4}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // If the shared back/home widget exists, constrain it without depending on its markup.
  const nav = doc.querySelector('#abnav, .back-home-nav, [data-back-home]');
  if (nav) {
    nav.classList.add('design-floating-nav');
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'التنقل الرئيسي');
    let lastY = window.scrollY, raf = false;
    window.addEventListener('scroll', () => {
      if (raf) return; raf = true;
      requestAnimationFrame(() => {
        const y = window.scrollY, delta = y - lastY;
        if (y < 80 || delta < -4) nav.classList.remove('is-hidden');
        else if (delta > 6) nav.classList.add('is-hidden');
        lastY = y; raf = false;
      });
    }, {passive:true});
  }

  // Slow ticker on hover/focus/scroll interaction; preserve existing ticker animation.
  doc.querySelectorAll('.ticker').forEach(ticker => {
    ticker.addEventListener('pointerenter', () => ticker.style.setProperty('--ticker-duration-factor', '1.8'));
    ticker.addEventListener('pointerleave', () => ticker.style.removeProperty('--ticker-duration-factor'));
    ticker.addEventListener('focusin', () => ticker.style.setProperty('--ticker-duration-factor', '1.8'));
    ticker.addEventListener('focusout', () => ticker.style.removeProperty('--ticker-duration-factor'));
  });

  // Provide a keyboard fallback to the site's existing command palette if present.
  doc.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      const palette = doc.querySelector('[data-cmdk], #commandPalette, #cmdk, [role="dialog"][aria-label*="بحث"]');
      if (palette) {
        e.preventDefault();
        palette.hidden = false;
        palette.classList.add('is-open');
        const input = palette.querySelector('input, [type="search"], [contenteditable="true"]');
        if (input) input.focus();
      }
    }
    if (e.key === 'Escape') {
      const palette = doc.querySelector('[data-cmdk].is-open, #commandPalette.is-open, #cmdk.is-open');
      if (palette) { palette.classList.remove('is-open'); palette.hidden = true; }
    }
  });
})();
