/* CHRAIM — البحث السريع (Ctrl+K أو «/»). يحقن نفسه في أي صفحة دون تعديل بنيتها.
   يبحث في صفحات الموقع والمؤسسات (assets/search-index.json) بتطبيع عربي ذكي:
   يتجاهل التشكيل والتطويل، ويوحّد (أ إ آ ا) و(ة ه) و(ى ي)، ويقبل العربية والفرنسية معاً. */
(function () {
  if (window.__chraimCmdk) return;
  window.__chraimCmdk = true;

  var CSS =
    '#cmdkBtn{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));inset-inline-start:12px;z-index:900;' +
    'display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;cursor:pointer;' +
    'background:rgba(11,18,32,.9);color:#f3e5ab;border:1px solid rgba(215,180,106,.45);' +
    'font:700 12px/1 system-ui,"Segoe UI",Tahoma,sans-serif;backdrop-filter:blur(8px)}' +
    '#cmdkBtn kbd{font:600 11px/1 ui-monospace,monospace;padding:2px 6px;border-radius:5px;background:rgba(255,255,255,.12)}' +
    '#cmdkBtn:focus-visible,#cmdkIn:focus-visible{outline:2px solid #e0c078;outline-offset:2px}' +
    '#cmdk{position:fixed;inset:0;z-index:1000;display:none;align-items:flex-start;justify-content:center;' +
    'padding:12vh 12px 0;background:rgba(3,7,18,.6);backdrop-filter:blur(4px);direction:rtl;' +
    'font-family:system-ui,"Segoe UI",Tahoma,sans-serif}' +
    '#cmdk.on{display:flex}' +
    '#cmdk .bx{width:min(560px,100%);background:#0b1220;color:#fff;border:1px solid rgba(215,180,106,.5);' +
    'border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.5);overflow:hidden}' +
    '#cmdkIn{width:100%;box-sizing:border-box;padding:16px 18px;font:600 16px system-ui,"Segoe UI",Tahoma,sans-serif;' +
    'background:transparent;color:#fff;border:0;border-bottom:1px solid rgba(255,255,255,.12)}' +
    '#cmdkIn::placeholder{color:rgba(255,255,255,.5)}' +
    '#cmdkList{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto}' +
    '#cmdkList a{display:flex;justify-content:space-between;gap:12px;padding:11px 12px;border-radius:10px;' +
    'color:#fff;text-decoration:none;font-weight:600;font-size:14px}' +
    '#cmdkList a small{color:#e0c078;font-weight:700;white-space:nowrap}' +
    '#cmdkList a[aria-selected=true]{background:rgba(224,192,120,.16);box-shadow:inset 0 0 0 1px rgba(224,192,120,.5)}' +
    '#cmdkEmpty{padding:18px;text-align:center;color:rgba(255,255,255,.6);font-size:14px}' +
    '@media(prefers-reduced-motion:no-preference){#cmdk.on .bx{animation:cmdkIn .14s ease-out}}' +
    '@keyframes cmdkIn{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}' +
    '@media(max-width:520px){#cmdkBtn kbd{display:none}}';

  var data = null, sel = 0, shown = [], loading = null;
  var box, input, list, empty, btn, lastFocus;

  function norm(s) {
    return (s || '').toString().toLowerCase()
      .replace(/[\u0640\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  function load() {
    if (data) return Promise.resolve(data);
    if (loading) return loading;
    loading = fetch('/assets/search-index.json', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; })
      .then(function (arr) {
        data = arr.map(function (x) { x._n = norm(x.t + ' ' + x.k); x._t = norm(x.t); return x; });
        return data;
      });
    return loading;
  }

  function score(item, terms) {
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i], at = item._n.indexOf(t);
      if (at < 0) return -1;                       // كل الكلمات مطلوبة
      s += item._t.indexOf(t) === 0 ? 30 : item._t.indexOf(t) > 0 ? 20 : 8;
      s -= Math.min(at, 40) / 10;
    }
    return s;
  }

  function render() {
    var q = norm(input.value), terms = q ? q.split(' ') : [];
    var res = (data || []).map(function (x) { return { x: x, s: terms.length ? score(x, terms) : 0 }; })
      .filter(function (r) { return r.s >= 0; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
    shown = res.map(function (r) { return r.x; });
    sel = 0;
    list.innerHTML = '';
    shown.forEach(function (it, i) {
      var li = document.createElement('li'), a = document.createElement('a'), sm = document.createElement('small');
      a.href = '/' + it.u; a.id = 'cmdk-' + i; a.setAttribute('role', 'option');
      a.appendChild(document.createTextNode(it.t));
      sm.textContent = it.g; a.appendChild(sm); li.appendChild(a); list.appendChild(li);
    });
    empty.style.display = shown.length ? 'none' : 'block';
    mark();
  }

  function mark() {
    var as = list.querySelectorAll('a');
    for (var i = 0; i < as.length; i++) as[i].setAttribute('aria-selected', i === sel ? 'true' : 'false');
    if (as[sel]) { input.setAttribute('aria-activedescendant', as[sel].id); if (as[sel].scrollIntoView) as[sel].scrollIntoView({ block: 'nearest' }); }
  }

  function open() {
    lastFocus = document.activeElement;
    box.classList.add('on'); input.value = ''; input.focus();
    load().then(render);
  }
  function close() { box.classList.remove('on'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function go() { if (shown[sel]) location.href = '/' + shown[sel].u; }

  function build() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    btn = document.createElement('button');
    btn.id = 'cmdkBtn'; btn.type = 'button'; btn.setAttribute('aria-label', 'بحث سريع');
    btn.innerHTML = '🔎 <span>بحث</span> <kbd>Ctrl K</kbd>';
    btn.addEventListener('click', open);

    box = document.createElement('div');
    box.id = 'cmdk'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'البحث في الموقع');
    box.innerHTML = '<div class="bx"><input id="cmdkIn" type="search" autocomplete="off" spellcheck="false" ' +
      'placeholder="ابحث عن كلية، مدرسة، أو صفحة…" role="combobox" aria-expanded="true" aria-controls="cmdkList">' +
      '<ul id="cmdkList" role="listbox"></ul><div id="cmdkEmpty" style="display:none">لا نتائج — جرّب كلمة أخرى (مثلاً: «طب» أو «FSJES»)</div></div>';
    document.body.appendChild(btn); document.body.appendChild(box);
    input = box.querySelector('#cmdkIn'); list = box.querySelector('#cmdkList'); empty = box.querySelector('#cmdkEmpty');

    input.addEventListener('input', render);
    box.addEventListener('mousedown', function (e) { if (e.target === box) close(); });
    list.addEventListener('mousemove', function (e) {
      var a = e.target.closest && e.target.closest('a'); if (!a) return;
      var i = Array.prototype.indexOf.call(list.querySelectorAll('a'), a); if (i >= 0 && i !== sel) { sel = i; mark(); }
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(); }
      else if (e.key === 'Tab') { e.preventDefault(); }   // يبقي التركيز داخل النافذة
    });
    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '') ||
                   (document.activeElement && document.activeElement.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.classList.contains('on') ? close() : open(); }
      else if (e.key === '/' && !typing && !box.classList.contains('on')) { e.preventDefault(); open(); }
      else if (e.key === 'Escape' && box.classList.contains('on')) { close(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
