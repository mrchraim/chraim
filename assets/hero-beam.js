/* hero-beam.js — بوابات ضوئية متحركة (AnimatedBeam port من Magic UI / MIT إلى Vanilla).
   يرسم مسارات بيزيه من مصدر الشعاع (زاوية الضياء الذهبية للـHero) إلى كل .pill.
   استخدام SMIL animateMotion — لا يحتاج أي مكتبة. */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  var pills = hero ? hero.querySelectorAll('.pill') : [];
  if (!hero || !pills.length) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  var svg = el('svg', {
    'class': 'hero-beams',
    'aria-hidden': 'true',
    'focusable': 'false',
    'role': 'presentation'
  });
  hero.insertBefore(svg, hero.firstChild);

  function layout() {
    var rect = hero.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));

    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'none');

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var gold = '#facc15';

    /* ===== Defs: شريط الضياء المتحرك (userSpaceOnUse لكل المسار) ===== */
    var defs = el('defs', null, svg);
    var grad = el('linearGradient', {
      id: 'beamGrad',
      gradientUnits: 'userSpaceOnUse',
      x1: -w, y1: 0,
      x2: 0, y2: 0
    }, defs);
    el('stop', { offset: '0%', 'stop-color': gold, 'stop-opacity': 0 }, grad);
    el('stop', { offset: '45%', 'stop-color': '#fff7c8', 'stop-opacity': 0.95 }, grad);
    el('stop', { offset: '55%', 'stop-color': '#fff7c8', 'stop-opacity': 0.95 }, grad);
    el('stop', { offset: '100%', 'stop-color': gold, 'stop-opacity': 0 }, grad);

    if (!RM) {
      el('animate', { attributeName: 'x1', values: (-w) + ';' + w, dur: '2.8s', repeatCount: 'indefinite', begin: '0s' }, grad);
      el('animate', { attributeName: 'x2', values: '0;' + (2 * w), dur: '2.8s', repeatCount: 'indefinite', begin: '0s' }, grad);
    }

    /* ===== مصدر الشعاع: النقطة الذهبية للضياء (top-right) ===== */
    var srcX = Math.round(w * 0.82);
    var srcY = Math.round(h * 0.10);

    /* ===== أسلاك بسيطة (ثابتة) + ضياء متحرك + نقاط ===== */
    var pillEls = Array.prototype.slice.call(pills);
    for (var i = 0; i < pillEls.length; i++) {
      var pr = pillEls[i].getBoundingClientRect();
      var ex = Math.round(pr.left - rect.left + pr.width / 2);
      var ey = Math.round(pr.top - rect.top + pr.height / 2);
      var midX = Math.round((srcX + ex) / 2);
      var controlY = Math.round(Math.min(srcY, ey) - Math.abs(ex - srcX) * 0.18 - 14);
      var d = 'M ' + srcX + ',' + srcY + ' Q ' + midX + ',' + controlY + ' ' + ex + ',' + ey;

      el('path', {
        d: d, stroke: gold, 'stroke-width': 1.3, 'stroke-opacity': 0.2,
        'stroke-linecap': 'round', fill: 'none'
      }, svg);

      el('path', {
        d: d, stroke: 'url(#beamGrad)', 'stroke-width': 1.7,
        'stroke-linecap': 'round', fill: 'none'
      }, svg);

      if (!RM) {
        var dot = el('circle', { r: 2.2, fill: '#ffe066' }, svg);
        el('animateMotion', {
          dur: (2.3 + (i % 3) * 0.7) + 's',
          begin: (-i * 0.5) + 's',
          repeatCount: 'indefinite',
          path: d
        }, dot);
      }
    }

    /* ===== المركز النابض: نقطة الضوء ===== */
    var core = el('circle', { cx: srcX, cy: srcY, r: 3.1, fill: '#ffe066', opacity: 0.95 }, svg);
    if (!RM) {
      var pulse = el('animate', {
        attributeName: 'r', values: '2.4;4.2;2.4', dur: '2.4s', repeatCount: 'indefinite', begin: '0s'
      }, core);
      el('animate', { attributeName: 'opacity', values: '1;0.55;1', dur: '2.4s', repeatCount: 'indefinite', begin: '0s' }, core);
      // keep reference for setIDs (avoid lint no-unused-vars)
      void pulse;
    }
  }

  layout();

  if ('ResizeObserver' in window) {
    var timer = 0;
    new ResizeObserver(function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(layout, 140);
    }).observe(hero);
  } else {
    window.addEventListener('resize', layout, { passive: true });
  }
})();
