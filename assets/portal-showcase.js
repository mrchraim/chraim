/* portal-showcase.js — interactivity for the UI-kit gallery on portal.html.
   Vanilla conversion of the React reference — no dependencies. */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function $$(sel, root) { return (root || document).querySelectorAll(sel); }

  /* ---------- Lamp login ---------- */
  function initLampLogin() {
    var body = $('pcLampBody');
    var btn = $('pcLampBtn');
    if (!body || !btn) return;
    function sync() {
      var on = body.classList.contains('is-on');
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute(
        'aria-label',
        on ? 'إطفاء المصباح وإخفاء لوحة الدخول'
           : 'إضاءة المصباح لكشف لوحة الدخول'
      );
    }
    btn.addEventListener('click', function () {
      body.classList.toggle('is-on');
      sync();
    });
    sync();
  }

  /* ---------- Basketball upload (local play, files never leave the browser) ---------- */
  function initBasketball() {
    var court = $('pcCourt');
    var zone = $('pcDrop');
    var basket = $('pcBasket');
    var chip = $('pcChip');
    var toast = $('pcToast');
    var basketCount = $('pcBasketCount');
    var dropCount = $('pcDropCount');
    var fileList = $('pcFileList');
    if (!court || !zone || !basket || !chip) return;

    var score = 0;
    var captured = 0;
    var toastTimer = 0;

    function showToast(text, ms) {
      if (!toast) return;
      toast.textContent = text;
      court.classList.add('pc-scored');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { court.classList.remove('pc-scored'); }, ms || 1400);
    }

    function scoreBasket() {
      score++;
      if (basketCount) basketCount.textContent = String(score);
      showToast('في السلة! 🏀', 1400);
    }

    /* drag with pointer events */
    var dragging = false, moved = false, startX = 0, startY = 0;

    chip.addEventListener('pointerdown', function (e) {
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      try { chip.setPointerCapture(e.pointerId); } catch { /* noop */ }
      chip.style.transition = 'none';
    });

    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var nx = e.clientX - startX;
      var ny = e.clientY - startY;
      if (Math.abs(nx) > 4 || Math.abs(ny) > 4) moved = true;
      chip.style.transform = 'translate(' + nx + 'px,' + ny + 'px)';
    }, { passive: true });

    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      chip.style.transition = 'transform .45s cubic-bezier(.2,.9,.3,1.15)';
      if (!moved) {
        // tap => shoot an arc into the basket
        var c = chip.getBoundingClientRect();
        var b = basket.getBoundingClientRect();
        var dx = (b.left + b.width / 2) - (c.left + c.width / 2);
        var dy = (b.top + b.height / 2) - (c.top + c.height / 2);
        var anim = chip.animate([
          { transform: 'translate(0px,0px) rotate(0deg)' },
          { transform: 'translate(' + (dx * 0.5) + 'px,' + (dy - 110) + 'px) rotate(280deg)', offset: 0.55 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(540deg)' }
        ], { duration: 750, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' });
        anim.onfinish = function () {
          scoreBasket();
          chip.getAnimations().forEach(function (a) { try { a.cancel(); } catch { /* noop */ } });
          chip.style.transform = 'translate(0px,0px)';
        };
        return;
      }
      // released: over the basket?
      var cr = chip.getBoundingClientRect();
      var br = basket.getBoundingClientRect();
      var inside = cr.left < br.right && cr.right > br.left && cr.top < br.bottom && cr.bottom > br.top;
      chip.style.transform = 'translate(0px,0px)';
      if (inside) scoreBasket();
    });

    /* real files dropped into the zone — preview only, never uploaded */
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('is-over');
      try { e.dataTransfer.dropEffect = 'copy'; } catch { /* noop */ }
    });
    zone.addEventListener('dragleave', function () { zone.classList.remove('is-over'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('is-over');
      var files = [];
      if (e.dataTransfer) {
        for (var i = 0; i < e.dataTransfer.files.length; i++) files.push(e.dataTransfer.files[i]);
      }
      if (!files.length) return;
      captured += files.length;
      files.slice(0, 3).forEach(function (f) {
        if (!fileList) return;
        var li = document.createElement('li');
        li.textContent = '📄 ' + f.name;
        fileList.appendChild(li);
      });
      while (fileList && fileList.children.length > 4) fileList.removeChild(fileList.firstChild);
      if (dropCount) dropCount.textContent = String(captured);
      showToast('تم الالتقاط (محلي فقط) 📥', 1400);
    });
  }

  /* ---------- OTP (نموذج تفاعلي — لا يُرسَل شيء) ---------- */
  function initOtp() {
    var scope = $('pcOtp');
    if (!scope) return;
    var boxes = $$('.pc-otp-box', scope);
    var progress = $('pcOtpProgress');
    var resendBtn = $('pcOtpResend');
    var resendNote = $('pcOtpResendNote');
    if (!boxes.length) return;

    function filled() {
      var n = 0;
      boxes.forEach(function (b) { if (b.value.trim()) n++; });
      return n;
    }
    function update() {
      boxes.forEach(function (b) { b.classList.toggle('is-filled', !!b.value.trim()); });
      if (progress) progress.style.width = (filled() / boxes.length * 100) + '%';
    }

    boxes.forEach(function (box, i) {
      box.addEventListener('input', function () {
        var v = box.value.replace(/\D/g, '').slice(-1);
        box.value = v;
        update();
        if (v && i < boxes.length - 1) boxes[i + 1].focus();
      });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !box.value && i > 0) {
          e.preventDefault();
          boxes[i - 1].focus();
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          var dir = e.key === 'ArrowRight' ? 1 : -1;
          var next = boxes[i + dir];
          if (next) next.focus();
        }
      });
      box.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = '';
        if (e.clipboardData) text = e.clipboardData.getData('text') || '';
        var digits = text.replace(/\D/g, '').slice(0, boxes.length).split('');
        boxes.forEach(function (b, j) { b.value = digits[j] || ''; });
        update();
        var last = -1;
        boxes.forEach(function (b, j) { if (b.value) last = j; });
        (boxes[Math.min(last + 1, boxes.length - 1)] || boxes[0]).focus();
      });
    });

    var seconds = 16;
    var timer = window.setInterval(tick, 1000);

    function fmt(s) { return '0:' + String(s).padStart(2, '0'); }

    function tick() {
      seconds--;
      if (seconds <= 0) {
        window.clearInterval(timer);
        resendBtn.disabled = false;
        resendBtn.textContent = 'أرسلها الآن';
        if (resendNote) resendNote.textContent = 'يمكنك إعادة الإرسال الآن';
      } else if (resendNote) {
        resendNote.textContent = 'أعد الإرسال خلال ' + fmt(seconds);
      }
    }

    resendBtn.disabled = true;
    resendBtn.textContent = 'إعادة الإرسال خلال ' + fmt(seconds);
    if (resendNote) resendNote.textContent = 'أعد الإرسال خلال ' + fmt(seconds);

    resendBtn.addEventListener('click', function () {
      if (resendBtn.disabled) return;
      seconds = 16;
      resendBtn.disabled = true;
      resendBtn.textContent = 'إعادة الإرسال خلال ' + fmt(seconds);
      window.clearInterval(timer);
      timer = window.setInterval(tick, 1000);
    });
  }

  function init() {
    initLampLogin();
    initBasketball();
    initOtp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
