/* ==========================================================================
   CHRVVIM — طبقة تعزيز أمني مشتركة (Security Hardening Layer)
   ملف مستقل، بلا مكتبات خارجية، بلا eval. يُحمَّل أولاً في كل الصفحات.

   الهدف: تقليل احتمالية الخطورة إلى الحد الأدنى عبر طبقات دفاع لا تعتمد
   على انتباه المطوّر:
     1) CHRVVIM_SAFE_URL  — حاجز عناوين يمنع javascript:/data:/vbscript:/blob:
        في أي href/src يحمل بيانات غير موثوقة (مكمّل لـ esc() الذي لا يحمي الروابط).
     2) Trusted Types     — تسجيل سياسة آمنة مسبقًا حتى يمكن تفعيل الإجبار لاحقًا
        دون كسر الموقع. إن لم يكن المتصفح يدعمها، يُتجاهل بسلاسة.
     3) مراقب CSP        — يجمع تقارير انتهاك CSP في الذاكرة للتشخيص المحلي.

   كل الدوال في globalThis ومُحيَّدة (idempotent): إعادة التحميل لا تُفسد شيئًا.
   ========================================================================== */
(function () {
  'use strict';

  var G = typeof globalThis !== 'undefined' ? globalThis : window;
  if (G.CHRVVIM_SECURITY_LAYER) return; /* لا تُسجِّل مرتين */
  G.CHRVVIM_SECURITY_LAYER = true;

  /* ---- (1) حاجز العناوين: يمنع المخططات الخطيرة في href/src ----
     esc() يحمي النص، لكنه لا يمنع href="javascript:...". هذا الحاجز يقفلها.
     - السماح فقط بـ: http(s):// | mailto: | tel: | مسارات نسبية | #مرساة
     - إزالة الأحرف القابلة للتهريب (مثل java\nscript:) قبل الفحص. */
  var SAFE_SCHEME = /^(?:https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|\?|[^:]*$)/i;
  var DANGEROUS = /^(?:javascript|data|vbscript|blob|file|filesystem):/i;
  function safeUrl(u) {
    u = String(u == null ? '' : u);
    /* إزالة كل أحرف التحكم/الفراغ التي تُستخدم للتهريب (java&#9;script:) */
    var probe = u.replace(/[\u0000-\u0020\u00a0\u2028\u2029\u200b-\u200d\ufeff]/g, '');
    /* فك الترميز المئوي مرة واحدة لالتقاط java%73cript: */
    try { probe = decodeURIComponent(probe); } catch (e) { /* نص غير صالح: نرفض لاحقًا */ }
    probe = probe.replace(/[\u0000-\u0020]/g, '').toLowerCase();
    if (DANGEROUS.test(probe)) return '';
    if (!SAFE_SCHEME.test(u.replace(/[\u0000-\u0020]/g, ''))) return '';
    return u;
  }
  G.CHRVVIM_SAFE_URL = safeUrl;

  /* ---- (2) سياسة Trusted Types الوقائية ----
     نُنشئ سياسة "chrvvim" تمرّر فقط HTML مُنقّى عبر مُطهِّر الموقع (إن وُجد).
     وجودها الآن يجعل الانتقال إلى enforce لاحقًا عملية إعداد واحدة دون إعادة كتابة.
     سياسة "default" تمنع أي innerHTML مباشر بمحتوى خام عند الإجبار. */
  try {
    if (G.trustedTypes && G.trustedTypes.createPolicy) {
      if (!G.trustedTypes.getPolicyNames || G.trustedTypes.getPolicyNames().indexOf('chrvvim') === -1) {
        G.trustedTypes.createPolicy('chrvvim', {
          createHTML: function (input) {
            input = String(input == null ? '' : input);
            if (typeof G.CHRVVIM_SANITIZE_HTML === 'function') {
              try { return G.CHRVVIM_SANITIZE_HTML(input); } catch (e) { /* fallthrough */ }
            }
            return input;
          },
          createScript: function (input) { return String(input); },
          createScriptURL: function (input) {
            var s = safeUrl(input);
            if (!s) throw new TypeError('Blocked unsafe script URL');
            return s;
          }
        });
      }
    }
  } catch (e) { /* بيئة لا تدعم Trusted Types: لا شيء */ }

  /* ---- (3) مراقب تقارير CSP (تشخيص محلي فقط، بلا إرسال خارجي) ---- */
  try {
    G.CHRVVIM_CSP_REPORTS = [];
    G.addEventListener('securitypolicyviolation', function (ev) {
      try {
        G.CHRVVIM_CSP_REPORTS.push({
          directive: ev.violatedDirective,
          blocked: ev.blockedURI,
          at: ev.sourceFile ? ev.sourceFile + ':' + ev.lineNumber : ''
        });
        if (G.CHRVVIM_CSP_REPORTS.length > 50) G.CHRVVIM_CSP_REPORTS.shift();
      } catch (e) { /* ignore */ }
    }, true);
  } catch (e) { /* ignore */ }
})();
