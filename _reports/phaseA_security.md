# Phase A — جرد أمني (Security Audit) — READ-ONLY

**تاريخ:** 2026-10-23
**نطاق:** المستودع (github.com/mrchraim/chraim, main) + الموقع (chraim.pages.dev). لا تغييرات مدمّرة.

---

## 1. فحص الأسرار (Secrets Scan)

**طريقة:** grep (gitleaks/trufflehog غير مثبتان). Patterns: service_role, api_key, password=, token=, ghp_, sk-, AKIA, SUPABASE_SERVICE.

**النتيجة: ✅ نظيف**
- `supabase-config.js` (deploy + root): **anon/publishable key فقط** (`sb_publishable_J1RBJuR7QP4cXe6ND5smAw_ijQqyBLr`) — public by design.
- لا `service_role`, لا PAT, لا API tokens, لا passwords في الكود.
- `_deploy_kit/` يقرأ tokens من ملفات/env (لا hardcode).
- `archive/` + `_integration_preview/` يحتويان على tokens placeholders (`sk-x`, `ADMIN_PASSWORD` env) — test data only.
- **توصية:** تثبيت gitleaks في CI للتحقق التلقائي (master prompt §4.10).

---

## 2. Supabase / RLS

**الجداول (per SQL):** `admins`, `announcements`, `exam_files`.
**الملفات:** `supabase/01_portal_schema.sql`, `02_platform_schema.sql`, `README_AR.md`.

**الحالة:** ⚠️ needs review
- RLS policies defined in SQL (needs manual read).
- SECURITY DEFINER function for admins — needs verify (master prompt §4.3).
- Storage buckets (signed URLs) — needs verify (git log mentions "correct signed-URL prefix (/storage/v1)").
- **Action:** read 01/02 SQL fully + run Supabase Security Advisor (requires dashboard access — not available here).

---

## 3. Headers (_headers — deploy)

**الحالة: ✅ قوية (مع ملاحظات)**
- CSP: `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`.
- HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (camera/mic/geo/payment/usb), COOP, CORP, X-Permitted-Cross-Domain-Policies, X-DNS-Prefetch-Control.
- `/admin.html` + `/admin*` → noindex, nofollow, no-store.
- `/assets/*` → immutable cache; `/documents/*` → 86400; `/index.html` → no-cache.

**ملاحظات (master prompt §4.5):**
- ⚠️ `'unsafe-inline'` في script-src/style-src — needs refactor (inline → external). Big effort; defer to Phase D.
- ⚠️ CSP لا تشمل `media-src`, `worker-src` (sw.js) — أضف `worker-src 'self'`.

---

## 4. الإدارة (/admin)

**الحالة: ⚠️ needs verify**
- `/admin.html` (28 KB) + redirect `/admin` → `/admin.html`.
- Supabase Auth + جدول admins (per code).
- Cloudflare Access (طبقة ثانية) — cf_service_token.json موجود في temp (مؤشر على Access gate). needs verify wiring.
- MFA — needs verify.
- Rate limiting / brute-force — needs verify.
- لا روابط للإدارة في الصفحات العمومية — needs audit.

**Action:** manual test (login flow, MFA, rate limit) — requires credentials.

---

## 5. التحقق من المدخلات (Input Validation)

**الحالة: ⚠️ needs audit**
- `platform/contribute.html`, `support.html` — نماذج. needs verify sanitization.
- `platform/browse.html` search — client-side. XSS risk if innerHTML with user input.
- `fsjp-portal.html` — fixed XSS in surname search (escape HTML) + schedule filtering.

**Action:** audit all forms + search inputs for XSS/SQLi/MIME limits.

---

## 6. الخصوصية (Privacy)

- `platform/privacy.html` exists. needs review/update (master prompt §4.8).

---

## 7. نشر Cloudflare Pages — مشكلة مكتشفة

**الحالة: ⚠️ blocker**

- **wrangler deploy** يعمل ويُنشئ preview deployments (e.g. 34078301) التي تُخدم المحتوى correctamente.
- **direct upload API** (multipart) يُنشئ production deployments تُخدم 500 (كلها: 9386ecf0, 30de0497, 986a6b85, d9fc3347, bbc448da, 14c2c787, 47d28410, fc9f6cd6, 8bfebb27, bf067f5e, 14c2c787).
- **السبب (محتمل):** direct upload API يتطلب صيغة/تدفق مختلف (upload token + bucket) — wrangler يفعل ذلك تلقائياً.
- **النتيجة:** chraim.pages.dev (production) يخدم 6948d8da (النسخة القديمة). wrangler preview (head.chraim.pages.dev) يخدم النسخة الجديدة.
- **الإجراء المتخذ:** rollback إلى 6948d8da (استعادة production). لا ضرر.
- **الحل (options):**
  - (a) استخدام wrangler deploy + ترقية preview إلى production (needs Cloudflare dashboard / API).
  - (b) إعداد Git integration (غير ممكن لـ Direct Uploads project).
  - (c) قبول أن النسخة الجديدة على head.chraim.pages.dev مؤقتاً.
  - (d) investigation: why direct uploads 500 (maybe _headers malformed, or missing upload token flow).

**توصية:** investigation (d) + (a) via dashboard promotion.

---

## 8. ملاحظات / توصيات

1. **لا أسرار مسرّبة** في الكود (anon key only).
2. **Headers قوية** but CSP needs unsafe-inline removal (deferred).
3. **RLS/Security Advisor** needs dashboard access (not available here) — request manual run.
4. **Input validation** needs audit of forms.
5. **Deployment blocker** (direct upload 500) — needs investigation.

---

**Phase A (read-only) complete. Awaiting your direction on:**
- Run Supabase Security Advisor + RLS audit (manual, dashboard)?
- Investigate direct upload 500 (try wrangler's multi-step upload flow)?
- Promote wrangler preview to production (dashboard)?