/* CHRAIM — unified 'etablissements' section behaviour: theme toggle + Arabic search/filter. */
(function () {
  var KEY = 'chrvvim-theme';
  var btn = document.getElementById('themeBtn');
  function apply(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  apply(localStorage.getItem(KEY));
  if (btn) btn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : (cur === 'light' ? null : 'dark');
    if (next) localStorage.setItem(KEY, next); else localStorage.removeItem(KEY);
    apply(next);
  });

  var grid = document.getElementById('grid');
  if (!grid) return;
  var items = [];
  try { items = JSON.parse(document.getElementById('data').textContent); } catch (e) {}
  var q = document.getElementById('q');
  var chips = document.getElementById('chips');
  var none = document.getElementById('none');
  var types = ['الكل'].concat(items.map(function (i) { return i.type; })
    .filter(function (v, i, a) { return v && a.indexOf(v) === i; }));
  var active = 'الكل';

  function norm(s) {
    return (s || '').toString().toLowerCase()
      .replace(/[\u0640\u064B-\u0652]/g, '')
      .replace(/[\u0621\u0622\u0623\u0625\u0629]/g, function (m) {
        return { '\u0621': '\u0647', '\u0622': '\u0627', '\u0623': '\u0627',
                 '\u0625': '\u0647', '\u0629': '\u0647' }[m];
      })
      .replace(/[\u0649]/g, '\u064A').replace(/[\u0624]/g, '\u0648').replace(/[\u0626]/g, '\u064A');
  }
  function render() {
    var t = norm(q.value.trim());
    var out = items.filter(function (i) {
      var okT = active === 'الكل' || i.type === active;
      var okQ = !t || norm(i.name + ' ' + i.fr + ' ' + i.city).indexOf(t) > -1;
      return okT && okQ;
    });
    grid.innerHTML = out.map(function (i) {
      return '<a class="card" href="/etablissements/' + i.slug + '.html">' +
        '<b>' + i.name + '</b><span class="cfr">' + i.fr + '</span>' +
        '<span class="meta"><span>' + i.type + '</span>' +
        (i.city ? '<span>\uD83D\uDCCD ' + i.city + '</span>' : '') + '</span></a>';
    }).join('');
    if (none) none.hidden = out.length > 0;
  }
  chips.innerHTML = types.map(function (ty, i) {
    return '<button class="chip" aria-pressed="' + (i === 0) + '">' + ty + '</button>';
  }).join('');
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    active = b.textContent;
    [].forEach.call(chips.children, function (c) {
      c.setAttribute('aria-pressed', c === b);
    });
    render();
  });
  q.addEventListener('input', render);
  render();
})();
