# 🛡️ تعزيز أمان CHRVVIM Campus — الملخّص النهائي

**التاريخ:** 2026-10-20
**النطاق:** الموقع العمومي (Cloudflare Pages) + لوحة الإدارة المنفصلة + Supabase
**الأداة:** `tools/site_doctor.py` (فحص محلي شامل: زحف + متصفح + روابط)

---

## 📊 النتيجة

| | قبل | بعد |
|---|---|---|
| **تقييم Site Doctor** | 20/100 | **96/100** ✅ |
| **حرج (Critical)** | 0 | **0** ✅ |
| **عالٍ (High)** | 12 | **0** ✅ |
| **متوسط (Medium)** | 5 | **0** ✅ |
| **مشاكل** | 38 | **9** (كلها آثار الخادم المحلي) |

> المتبقّي 9 = `SEC_HEADER`×5 + `NO_COMPRESSION` + `INFO_LEAK` + `LONG_TITLE`×2
> كلها **ليست مشاكل حقيقية**: الترويسات والضغط معرّفين فـ `_headers` و Cloudflare
> كيطبّقهم فـ الإنتاج. `python -m http.server` ما كيقراش `_headers`.

---

## ✅ ما تم إنجازه

### 1) CSP صارم بلا `unsafe-inline` (الأهم)
- تحويل كامل من `'unsafe-inline'` إلى **هاشات SHA-256**:
  - الموقع العمومي: **12 هاش سكربت + 14 هاش نمط**
  - لوحة الإدارة: **2 سكربت + 1 نمط**
- أداة `tools/build_csp.py [--write] [--admin]` كتولّد الهاشات وكتحدّث `_headers` تلقائيًا.
- `img-src 'self' data: blob:` (تحقّقنا: ما كايناش صور خارجية محمّلة).
- `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`.

### 2) ترويسات أمان (المقرر `_headers`)
| الترويسة | القيمة |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | 18 ميزة مقفولة صراحةً |
| `Cross-Origin-*` | `Opener: same-origin`, `Resource: same-origin`, `Embedder: require-corp` |
| `X-DNS-Prefetch-Control` | `off` |

### 3) حجب المسارات الحساسة (`_redirects` — 70 قاعدة → 404)
- أسرار وإعدادات: `.env`, `.env.*`, `.git`, `.svn`, `.hg`, `*.sql`, `*.bak`, `*.log`, `*.map`, `*.old`, `*.orig`, `*.swp`, `*.zip`, `*.tar.gz`
- ملفات البناء: `package.json`, `wrangler.*`, `netlify.toml`, `Dockerfile`, `BUILD_MANIFEST.sha256`
- إدارة/CMS: `/admin`, `/administrator`, `/dashboard`, `/login`, `/wp-*`, `/xmlrpc.php`, `/phpmyadmin`, `/pma`, `/adminer.php`
- استطلاع: `/actuator/*`, `/console`, `/manager/*`, `/config.*`, `/.htaccess`, `/.htpasswd`, `/.DS_Store`

### 4) عزل لوحة الإدارة (`admin-separate/`)
- **صفر** مرجع للوحة فـ الموقع العمومي (0 نتيجة).
- `_redirects`: **رفض افتراضي** — غير `admin.html`/`admin.js` → 404.
- `_headers`: `noindex, nofollow, noarchive, nosnippet, noimageindex` + `no-store`.
- Supabase JS من jsDelivr بإصدار **مثبّت `@2.118.0`** + **SRI sha384** + `crossorigin`.
- CSP خاص باللوحة: hash-based، `base-uri 'none'`, `form-action 'self'`.
- الحزمة: `admin-panel-separate.zip` (جاهزة لـ Cloudflare Access + MFA).

### 5) إصلاحات الواجهة والوصول
- **DOM-XSS defense-in-depth**: مُطهِّر صارم `window.CHRVVIM_SANITIZE_HTML()`
  (allowlist: `b/strong/i/em/u/br/span/a/small/sup/sub`؛ يمنع `on*=`, `javascript:`, `data:`)
  مطبّق على `page-i18n.js` و `gender.js`.
- **روابط GitHub مكسورة (404)**: حُذفت من 6 صفحات.
- **favicon.ico حقيقي**: multi-size (16/24/32/48/64) مولّد بأداة `tools/build_favicon.py` بلا مكتبات خارجية.
- **أهداف اللمس (WCAG 2.2)**: 0 عنصر صغير متبقّي — عبر `@media (pointer: coarse)`.
- **SEO/robots**: `robots.txt` نظيف (بلا كشف مسارات الإدارة)، `sitemap.xml` بستّ صفحات.

### 6) Supabase (جاهز للتطبيق اليدوي)
- `supabase/migrations/20261020_harden_rls_policies.sql`:
  RLS على كل الجداول، سياسات least-privilege منفصلة، `audit_log` append-only،
  و`is_admin()` بـ `security definer` + `search_path` ثابت.
- الواجهة كتستعمل **publishable key فقط** — لا `service_role`.

---

## 🔧 أدوات جديدة

| الأداة | الوظيفة |
|---|---|
| `tools/build_csp.py` | توليد هاشات CSP للموقع (`--write`) وللوحة (`--admin --write`) |
| `tools/build_favicon.py` | توليد `favicon.ico` متعدّد الأحجام بلا مكتبات |
| `tools/site_doctor.py` | السكانر (زحف + متصفح حقيقي + روابط) |
| `tools/add_favicon_links.py` | إدراج روابط الأيقونة |
| `tools/remove_github_link.py` | إزالة الروابط المكسورة |

---

## ⚠️ خطوات يدوية متبقّية (لوحات خارجية)

### Cloudflare
1. **Access (Zero Trust)**: احمِ مشروع الإدارة — بريد الأدمن فقط + IP إن أمكن.
2. **MFA إجباري**: TOTP/WebAuthn، Session 2–4 ساعات.
3. **WAF Managed Rules** + **Bot Fight Mode**.
4. **Rate Limiting** على `/auth`, `/upload`, ونقاط الـ API.
5. **SSL/TLS = Full (strict)** + Always Use HTTPS + HSTS.
6. **2FA على حساب Cloudflare** نفسه.

### Supabase
1. نفّذ `20261020_harden_rls_policies.sql` فـ SQL Editor.
2. Auth: فعّل MFA (TOTP) للأدمن، JWT expiry قصير.
3. Storage: buckets خاصة + سياسات least-privilege.
4. Backups: فعّل PITR إن كان متاحًا على الخطة.

---

## 🔁 إعادة التحقّق

```powershell
# فحص محلي شامل
cd chrvvim.talib.aga.ma
C:\Python315\python.exe -m http.server 8765 --bind 127.0.0.1   # نافذة منفصلة
C:\Python315\python.exe tools\site_doctor.py scan http://127.0.0.1:8765 --browser --external --out site_doctor_report

# على الموقع الحقيقي (بعد إصلاح DNS)
C:\Python315\python.exe tools\site_doctor.py scan https://chraim.pages.dev --browser --external

# بعد أي تعديل على inline <script>/<style>
C:\Python315\python.exe tools\build_csp.py --write
C:\Python315\python.exe tools\build_csp.py --admin --write
```

---

## 🔒 الجلسة 2 — تقليل احتمالية الخطورة إلى الحد الأدنى (2026-10-20)

**الهدف:** جعل احتمالية الخطورة شبه منعدمة عبر طبقات دفاع لا تعتمد على انتباه المطوّر.

### 1) إزالة كل مسارات الدخول للإدارة من الحزمة العمومية
كان فـ `app.js` كود **دخول مسؤول مخفي** بثلاث طرق (كانت سطح هجوم + كشف وجود لوحة):
- `Ctrl/Cmd+Shift+A`
- 3 نقرات على التذييل (`#siteFooter`)
- فتح الهاش `#admin` → `location.href='admin.html'`

✅ **حُذف بالكامل**. تأكّدنا: `typeof window.ownerAccess === "undefined"`، صفر مرجع لـ `admin.html`/`#admin` فـ الموقع.
كما حُذف سطر `sw.js` الذي كان يشير لـ `/admin.html`.

### 2) طبقة تعزيز أمني مشتركة: `security-hardening.js` (جديدة)
تُحمَّل **أولاً فـ `<head>`** ديال 7 صفحات عمومية + لوحة الإدارة. ثلاث قدرات:

1. **`CHRVVIM_SAFE_URL()` — حاجز عناوين** (مكمّل لـ `esc()` الذي لا يحمي الـ `href`):
   - يمنع: `javascript:`, `data:`, `vbscript:`, `blob:`, `file:`, `filesystem:`
   - يقاوم التهريب: مسافات/أسطر جديدة/أحرف تحكّم + ترميز مئوي (`java%73cript:`)
   - ✅ 14/14 اختبار مرّ (وحدة Node + متصفح حقيقي)

2. **سياسة Trusted Types وقائية** (`chrvvim` + `default`):
   - `createHTML` كيمرّ عبر مُطهِّر الموقع
   - `createScriptURL` كيرفض أي URL خطير
   - جاهزة للإجبار لاحقًا بلا إعادة كتابة

3. **مراقب تقارير CSP** (`CHRVVIM_CSP_REPORTS`، محلي، بلا إرسال خارجي).

### 3) تطبيق حاجز العناوين على **كل** مصارف `href` المستمدّة من البيانات
`app.js` (`surl()`): الإعلانات، المصادر الرسمية، دليل الجامعات، البوابة، الوثائق، الشبكات الاجتماعية.
`institutions-gateway.js`، `legal.js` (`SU()`)، `social-bubble.js` (كانت **بلا escape أصلاً** → أُصلحت).
> النتيجة: حتى لو حقن مهاجم `javascript:` فـ بيانات Supabase، الرابط كيتحوّل لـ `` (بلا تنفيذ).

### 4) Trusted Types Report-Only في `_headers`
```http
Content-Security-Policy-Report-Only: require-trusted-types-for 'script'; trusted-types default; report-uri /cdn-cgi/csp-report
Content-Security-Policy: ...; report-uri /cdn-cgi/csp-report
```
- `report-uri` مضمّن دابا فـ `build_csp.py` (ثابت بعد كل توليد).
- مُوثَّق: إن لم يُفعَّل CSP Reporting فـ Cloudflare، التقارير كتُهمَل بصمت (لا ضرر، لا إرسال خارجي).

### 5) تحقّق فعلي (متصفح حقيقي + سكانر)
| الفحص | النتيجة |
|---|---|
| Site Doctor | **96/100** (0 حرج/عالٍ/متوسط) |
| أخطاء console (7 صفحات) | **0** |
| `security-hardening.js` محمّل | ✅ لكل الصفحات |
| `safeUrl` (14 حالة) | ✅ 14/14 يمنع التخطيطات الخطيرة |
| تقارير CSP مخالَفة | 0 |
| مراجع الإدارة فـ العمومي | 0 |

### 6) لوحة الإدارة
- زيد `security-hardening.js` + CSP مُحدَّث + `no-store` للملف الجديد.
- أُعيد توليد `admin-panel-separate.zip` (28002 بايت).

### 7) تعقيم حزم النشر القديمة (كانت خطرًا خفيًا)
اكتشفنا حزمتي نشر قديمتين فيهما **لوحة إدارة كاملة + كود دخول مخفي + CSP ضعيف**:
- `_deploy_kit/chrvvim-campus-DROPREDY/` (مرتبطة بـ `deploy-to-netlify.ps1`)
- `_integration_preview/chrvvim-campus-integration/web/`

✅ الإجراء المطبّق على كلتيهما:
- حذف مجلد `admin/` بالكامل (+ إعادة بناء `chrvvim-campus-DROPREDY.zip` بلا أي مدخل إدارة).
- حذف دالة `ownerAccess()` ونداءها + مخفي `Ctrl/Cmd+Shift+A`/`#admin`/3-نقرات من `assets/js/app.js`.
- حذف مفاتيح `tool.admin` من `i18n.js`.
- استبدال CSP الضعيف (`unsafe-inline`, `img-src https:`) بـ CSP صارم.
- `_redirects`: 404 لكل مسارات الإدارة والأسرار بدل توجيه `/admin → /admin/index.html`.
- إصلاح خطأ ترويسة `Cross-Origin-Opoper-Policy` → `Cross-Origin-Opener-Policy` فـ المعاينة.

> النتيجة: **كل** حزمة قابلة للنشر (الحالية + القديمة) ولا فيها أي كود إدارة ولا CSP ضعيف.

---

> **الخلاصة النهائية:** ما بقاتش ثغرة معروفة قابلة للاستغلال. احتمالية الخطورة مبنية على:
> (أ) طبقات آلية (CSP صارم + SRI + حاجز عناوين + مُطهِّر)،
> (ب) تقليل سطح الهجوم (صفر كود إدارة فـ أي حزمة + 404 للمسارات الحساسة)،
> (ج) ضبط خارجي (Cloudflare Access/WAF/MFA + RLS).
> المتبقّي = خطوات يدوية فـ اللوحات (مذكورة أعلاه) — بلا أي كود محلي مفتوح.
