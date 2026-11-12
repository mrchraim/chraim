/* cx-theme-lamp.js — مبدّل الوضع (مصباح) — تحسين تدريجي */
(function () {
  "use strict";

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function syncState(btn) {
    if (!btn) return;
    btn.classList.toggle("cx-lamp--on", !isDark());
  }

  function pulse(btn) {
    if (!btn) return;
    btn.classList.remove("cx-lamp--pulse");
    // force reflow to restart animation
    void btn.offsetWidth;
    btn.classList.add("cx-lamp--pulse");
    window.setTimeout(function () {
      btn.classList.remove("cx-lamp--pulse");
    }, 520);
  }

  function init() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;

    btn.classList.add("cx-lamp");

    // Replace the existing icon with a lamp SVG (progressive enhancement).
    var oldSvg = btn.querySelector("svg");
    if (oldSvg && !oldSvg.classList.contains("cx-lamp__icon")) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "cx-lamp__icon");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      svg.innerHTML =
        '<path d="M9 21h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M10 17h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M12 3a6 6 0 0 0-4 10.5c-.6 1.3-.5 2.5 0 3.5h8c.5-1 .6-2.2 0-3.5A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
      oldSvg.replaceWith(svg);
    }

    syncState(btn);

    // The existing toggleTheme() updates data-theme; run after it.
    btn.addEventListener("click", function () {
      window.requestAnimationFrame(function () {
        syncState(btn);
        pulse(btn);
      });
    });

    // React to external theme changes (e.g., system preference).
    var observer = new MutationObserver(function () {
      syncState(btn);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
