/* cx-myuiz-guide.js — دليل إعادة التسجيل عبر MY-UIZ — إضافة معزولة، sans stockage */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function initStepper() {
    var heads = document.querySelectorAll(".cx-step__head");
    heads.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var step = btn.closest(".cx-step");
        if (!step) return;
        var expanded = step.getAttribute("aria-expanded") === "true";
        step.setAttribute("aria-expanded", expanded ? "false" : "true");
      });
      // keyboard: Enter/Space handled natively by button
    });
  }

  function initAssistant() {
    var first = $("cx-first");
    var last = $("cx-last");
    var cin2 = $("cx-cin2");
    var out = $("cx-result");
    if (!first || !last || !cin2 || !out) return;

    function compute() {
      var f = (first.value || "").trim();
      var l = (last.value || "").trim();
      var c = (cin2.value || "").trim().replace(/\D/g, "").slice(0, 2);
      if (!f || !l) {
        out.innerHTML = '<span class="cx-muted">' + (document.documentElement.lang === "fr" ? "Saisissez prénom et nom." : "أدخل الاسم الشخصي والعائلي.") + "</span>";
        return;
      }
      // Format 1 (as written in the explanation): prenom.nom.deuxDerniers@edu.uiz.ac.ma
      var email1 = f + "." + l + "." + (c || "XX") + "@edu.uiz.ac.ma";
      // Format 2 (password style): 0000@CIN
      var pwd1 = "0000@" + (c ? (c + "XXXX") : "J112233");
      out.innerHTML =
        '<div><b>البريد (صيغة 1 — prenom.nom.XX):</b> <code>' + esc(email1) + "</code></div>" +
        '<div><b>كلمة المرور (صيغة 1):</b> <code>' + esc(pwd1) + "</code></div>" +
        '<div class="cx-note">ملاحظة: عرض الصيغتين (الشرح والمثال) كما وردتا. إن لم ينجح الولوج، جرّب الصيغة الأخرى أو اطلب المساعدة.</div>';
    }

    first.addEventListener("input", compute);
    last.addEventListener("input", compute);
    cin2.addEventListener("input", compute);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function loadAnnouncements() {
    var helpLink = $("cx-help-link");
    var helpFallback = $("cx-help-fallback");
    var dateEl = $("cx-date");
    var dateFallback = $("cx-date-fallback");
    fetch("announcements.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !Array.isArray(d.items)) {
          if (helpFallback) helpFallback.style.display = "";
          if (dateFallback) dateFallback.style.display = "";
          return;
        }
        // Find MY-UIZ help form announcement
        var helpItem = d.items.find(function (a) {
          var url = String(a.url || "");
          var title = String(a.title || "");
          return url.indexOf("forms.gle") !== -1 || /MY-?UIZ/i.test(title);
        });
        if (helpItem && helpItem.url && helpLink) {
          helpLink.href = helpItem.url;
          helpLink.style.display = "";
          if (helpFallback) helpFallback.style.display = "none";
        } else {
          if (helpLink) helpLink.style.display = "none";
          if (helpFallback) helpFallback.style.display = "";
        }
        // Find re-registration announcement for date
        var reItem = d.items.find(function (a) {
          return /إعادة التسجيل|Réinscription|reinscription/i.test(String(a.title || ""));
        });
        if (reItem && dateEl) {
          var when = reItem.ends_at || reItem.date || reItem.starts_at || "";
          dateEl.textContent = when ? ("الأجل: " + when) : "";
          if (dateFallback) dateFallback.style.display = when ? "none" : "";
        } else {
          if (dateEl) dateEl.textContent = "";
          if (dateFallback) dateFallback.style.display = "";
        }
      })
      .catch(function () {
        if (helpFallback) helpFallback.style.display = "";
        if (dateFallback) dateFallback.style.display = "";
      });
  }

  function initChecklist() {
    // checkboxes live in memory only; nothing to do (no persistence)
  }

  function init() {
    initStepper();
    initAssistant();
    initChecklist();
    loadAnnouncements();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
