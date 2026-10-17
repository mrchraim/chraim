/* CHRVVIM Campus — سلوك مشترك (وضع ليلي + بحث/تصفية) */
(function () {
  "use strict";

  var THEME_KEY = "chrvvim-theme";

  function applyTheme(t) {
    var r = document.documentElement;
    if (t) { r.setAttribute("data-theme", t); } else { r.removeAttribute("data-theme"); }
    var dark = t ? t === "dark" : window.matchMedia("(prefers-color-scheme:dark)").matches;
    var b = document.getElementById("theme");
    if (b) {
      b.textContent = dark ? "الوضع الفاتح" : "الوضع الداكن";
      b.setAttribute("aria-pressed", String(dark));
    }
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", dark ? "#08121f" : "#071b32");
  }

  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
  applyTheme(saved);

  var tb = document.getElementById("theme");
  if (tb) {
    tb.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var isDark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme:dark)").matches;
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* تطبيع البحث العربي واللاتيني */
  function norm(s) {
    return String(s == null ? "" : s).toLowerCase()
      .replace(/[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]/g, "")
      .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
      .replace(/\u0649/g, "\u064A")
      .replace(/\u0624/g, "\u0648")
      .replace(/\u0626/g, "\u064A")
      .replace(/\u0629/g, "\u0647")
      .replace(/[\u00AB\u00BB"'.,:;\u060C\u061F]/g, " ")
      .replace(/\s+/g, " ").trim();
  }

  var q = document.getElementById("q");
  var cards = document.getElementById("cards");
  if (!q || !cards) return;

  var city = document.getElementById("city");
  var count = document.getElementById("count");
  var none = document.getElementById("none");
  var type = "";
  var items = Array.prototype.slice.call(cards.querySelectorAll(".card"));

  function render() {
    var query = norm(q.value);
    var c = city ? city.value : "";
    var shown = 0;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var okType = !type || el.getAttribute("data-type") === type;
      var okCity = !c || el.getAttribute("data-city") === c;
      var okQ = !query || norm(el.getAttribute("data-search")).indexOf(query) !== -1;
      var vis = okType && okCity && okQ;
      el.hidden = !vis;
      if (vis) shown++;
    }
    if (count) count.textContent = shown + " من " + items.length;
    if (none) none.hidden = shown > 0;
  }

  q.addEventListener("input", render);
  if (city) city.addEventListener("change", render);

  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      type = c.getAttribute("data-t") || "";
      chips.forEach(function (x) {
        x.setAttribute("aria-pressed", x === c ? "true" : "false");
      });
      render();
    });
  });

  render();
})();
