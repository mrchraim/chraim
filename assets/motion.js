/* CHRAIM Campus — motion layer.
   Progressive enhancement only: if GSAP is missing, if the browser cannot run
   it, or if the visitor prefers reduced motion, this file returns early and
   the page keeps its original static behaviour. */
(() => {
  'use strict';

  const doc = document;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (reduced) return;
  if (!window.gsap || !window.ScrollTrigger) return;

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  // ---- Smooth scroll: desktop pointers only, synced to the GSAP ticker ----
  let lenis = null;
  try {
    if (window.Lenis && finePointer) {
      lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, autoRaf: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      doc.documentElement.classList.add('has-lenis');
    }
  } catch (_) {
    lenis = null;
  }

  // ---- Scroll reveals ----
  // fromTo + immediateRender:false means nothing is hidden until the trigger
  // actually fires, so a failed trigger can never leave content invisible.
  const reveal = (selector, vars = {}) => {
    const els = gsap.utils.toArray(selector);
    if (!els.length) return;
    gsap.fromTo(
      els,
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.07,
        immediateRender: false,
        overwrite: 'auto',
        scrollTrigger: { trigger: els[0], start: 'top 88%', once: true },
        ...vars,
      }
    );
  };

  try {
    // Hero intro: runs once on load, no scroll trigger.
    gsap.from('.hero .eyebrow', { opacity: 0, y: 12, duration: 0.6, ease: 'power2.out' });
    gsap.from('.hero h1', {
      opacity: 0,
      y: 28,
      filter: 'blur(14px)',
      duration: 1.05,
      delay: 0.08,
      ease: 'power3.out',
      clearProps: 'filter',
    });
    gsap.from('.hero__description', { opacity: 0, y: 16, duration: 0.85, delay: 0.22, ease: 'power2.out' });
    gsap.from('.hero__actions', { opacity: 0, y: 16, duration: 0.85, delay: 0.32, ease: 'power2.out' });
    gsap.from('.hero-art', { opacity: 0, scale: 0.97, duration: 1.05, delay: 0.18, ease: 'power2.out' });

    // Section reveals: container level, so dynamically injected cards are not
    // left in a half-animated state.
    reveal('.box');
    reveal('.card');
    reveal('.hero .pill');

    ScrollTrigger.refresh();
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  } catch (err) {
    // Safety net: never keep content hidden because of an animation error.
    gsap.set(
      ['.hero .eyebrow', '.hero h1', '.hero__description', '.hero__actions', '.hero-art'],
      { clearProps: 'opacity,transform,filter' }
    );
    console.warn('CHRAIM motion layer disabled:', err);
  }
})();
