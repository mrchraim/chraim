/* creative.js — micro-interactions for CHRAIM (vanilla, dependency-free) */
(function () {
  'use strict';

  var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ====== 1. Scroll reveal (IntersectionObserver) ====== */
  function initReveal() {
    if (!('IntersectionObserver' in window) || RM) {
      document.querySelectorAll('.card, .pill, .hero .stat, .quick-card, .box').forEach(function (el) {
        el.classList.add('is-revealed');
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.card, .pill, .hero .stat, .quick-card, .box').forEach(function (el) {
      io.observe(el);
    });
  }

  /* ====== 2. Magnetic buttons (subtle pull toward cursor) ====== */
  function initMagnetic() {
    if (RM || !('PointerEvent' in window)) return;
    var targets = document.querySelectorAll('.btn, .cta-main, .hero-action, .hero-action.primary, .pe-download');
    targets.forEach(function (el) {
      var strength = 0.18;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (x * strength) + 'px,' + (y * strength) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* ====== 3. Hero spotlight cursor tracking ====== */
  function initSpotlight() {
    if (RM) return;
    var hero = document.querySelector('.hero');
    if (!hero) return;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width) * 100;
      var y = ((e.clientY - r.top) / r.height) * 100;
      hero.style.setProperty('--spot-x', x + '%');
      hero.style.setProperty('--spot-y', y + '%');
    }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      hero.style.removeProperty('--spot-x');
      hero.style.removeProperty('--spot-y');
    });
  }

  /* ====== 4. Smooth anchor scroll with offset ====== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  function init() {
    initReveal();
    initMagnetic();
    initSpotlight();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
