# CHRVVIM Campus — الفحص الجنائي للمستودع (Forensic Audit)

**تاريخ الفحص:** 2026-11-15 · **المراجع:** `bbbc769` قبل التعديلات — التغييرات الموثقة في `docs/CHRVVIM_MASTER_EXECUTION_LEDGER.md`.

> هذا التقرير يصف **الواقع الفعلي** للمشروع كما هو اليوم. هو تدقيق، لا برنامج عمل. لا يُقدّم أي نتيجة غير قابلة للدفاع. كل رقم فيه قابل للتحقق من الملفات/الروابط المذكورة.

---

## 1) البنية الفعلية للمستودع

الجذر (repo root) — أهم الفهارس والمسارات:

| المسار                                          | المحتوى                                                                                                                          | يُنشر؟                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `/` (28 صفحة .html)                             | index, portal, rafiq-altalib, academic-offer/updates, university-directory, atlas, nexus, myuiz-guide, legal, platform snapshot… | نعم                   |
| `etablissements/`                               | دليل مؤسسات جامعة ابن زهر (25 صفحة tracked) + صفحات FEGA/FSJPA الرسمية (2026-11-15)                                              | نعم                   |
| `platform/`                                     | منصة "Management System" (23 tracked: login/dashboard/account/exams…+`js/`, `js/config.js` publishable فقط)                      | نعم                   |
| `faculties/`, `lessons/`, `levels/`, `support/` | صفحات مبنية بالنمط نفسه                                                                                                          | نعم                   |
| `documents/`                                    | 58 ملف PDF (35.3 MB) — مكتبة قانونية/إدارية                                                                                      | نعم (داخل dist)       |
| `assets/`                                       | fonts/v2, lib (lucide 347 KB, gsap, ScrollTrigger, chart 203 KB…), legal-encyclopedia-data.js (138 KB), v2.css/js…               | نعم                   |
| `supabase/`                                     | `migrations/` (RLS + aal2)، `02_platform_schema.sql`، `03_knowledge_atlas_schema.sql` (تصميم فقط، غير مطبّق)                     | لا (غير منشورة)       |
| `functions/`                                    | `api/ai.js` (Proxy للذكاء، وردي على Google/K transformer فقط) + `_lib/policy.js` + `retrieval.js`                                | نعم (Pages Functions) |
| `tools/`                                        | build-dist.py, audit-links.py, secret-scan.py, audit-security.py, make-search-index.py, make-seo.py …                            | لا                    |
| `archive/`                                      | 775 ملف / ~104 MB — مخرجات مشاريع قديمة (جامعة أخرى + تجميع خاطئ) محفوظة للتاريخ                                                 | **لا** (مستثنى)       |
| `vendor/`                                       | 5.7 MB بما فيه OpenMausBot (TypeScript) — تبعية خارجية مؤرشفة                                                                    | **لا** (مستثنى)       |
| `_dev/`                                         | أدوات داخلية + backups `*.bak` (28 ملفًا) + manifest build/check                                                                 | **لا** (مستثنى)       |
| `_dev/backups/*.bak`                            | 28 نسخة احتياطية متفرقة (لا تدخل النشر)                                                                                          | لا                    |

**آلية النشر:** GitHub → GitHub Actions → `python tools/build-dist.py --out dist --clean` → `dist/` → `npx wrangler pages deploy dist --project-name=chraim` (الإنتاج الكنسي = **chraim.pages.dev**)؛ نسخة Workers.dev = مرآة غير محدّثة (`/orientation` = 404) — موثقة في README.

## 2) التقنيات المستخدمة

| الطبقة            | التقنية                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| الإطار            | **لا يوجد framework** — صفحات HTML/CSS/JS خام (no bundler/SPA)                                                                     |
| التنسيق           | CSS متغيرات + ملفات `assets/v2.css`, `chrvvim-*.css`, خطوط IBM Plex Sans Arabic (self-hosted)                                      |
| المعالجة الأمامية | `app.js` (144 KB)، `portal-v3.css/js`، `page-i18n.js`, `supabase-js` عبر CDN يُرفَق في `assets/lib/`                               |
| الواجهة البرمجية  | Cloudflare Pages Functions — `/api/ai` (OmniRoute → Claude/auto، مقيّدة بـ KV 20/ساعة/IP)                                          |
| البيانات          | ملفات statin (`window.CHRVVIM_*` snapshot + JSON) + Supabase (PostgreSQL، RLS)                                                     |
| قاعدة البيانات    | 3 مشاريع Supabase: portal `idpafbyefrywjixskvvu`، platform `uftqrgpzllvqlaztcjbq`، atlas MCP `pvoenvxinkipgpnddumt` (403 للمستودع) |
| النشر والسحابة    | Cloudflare Pages + Actions (Deploy 43757955658) + Backup workflow (43752923040)                                                    |
| الاختبار          | Vitest (4 ملفات / **42 اختبارًا**) + Python audit tools + YAML structural test (`verify_ci_csp_patch.py`)                          |
| البناء            | `dist` (276 ملف / 39.8 MB) + `BUILD_MANIFEST.sha256` (تحقق يدوي عبر `_dev/_manifest_check.py`)                                     |

## 3) الملفات الأساسية (الحساسة)

- `index.html` — البوابة (FSJP + جامعة ابن زهر)؛ 148 KB view counter page ذاتية.
- `portal.html` — بوابة الطالب (220 KB)؛ تحمل المدراء (admin.html يستهلك Supabase مباشرة).
- `admin.html` — console Admin + بوابة TOTP (client aal2 gate + server RLS aal2).
- `platform/login.html` (+ `platform/js/auth.js`) — بوابة TOTP للأدمن فقط (الطلبة معفيون).
- `university-formations.json` — فهرس 382 تكوين (المصدر `uiz.ac.ma/formation`، محدّث 2026-10-17) + `university-formations.js` (مولّد).
- `institutions-database.json` — 38 سجل (24 listed_official + 7 official_announcement + 7 portal_name_needs_reconciliation) + `.csv` (38/38 row، ids متطابقة) + `.js` (مولّد) — **كل سجل يحمل `official_source_url` + `last_verified: 2026-10-17`**.
- `announcements.json` — 42 إعلانًا ثابتًا (سياسة التقديم على لوحة التحكم)؛ **إعانات إعادة التسجيل 2026-2027 (أقرب `ends_at` = 2026-11-15T18:00) لم تعد تظهر في الواجهة منذ 2026-11-16** — انظر Phase 2.
- `assets/legal-encyclopedia-data.js` — 40 موضوع (نسخة مُفعَّلة؛ نسخة الجذر القديمة **حُذفت** 2026-11-15).
- `assets/search-index.json` — الفهرس اليدوي (52 → **55** بعد إضافة FEGA/FSJPA 2026-11-15).
- `supabase/migrations/20261114_*_aal2.sql` — `has_aal2()` مدمجة في `is_admin()` (+`is_editor()` في platform) — **مطبّقة في الإنتاج 2026-11-15 ومُتحقق منها**.
- `BUILD_MANIFEST.sha256` — 299 سجل (تحقق يدوي).
- `_headers` — CSP/HSTS/X-Frame/COOP/CORP/… (deployed، يُنسخ حرفيًا إلى dist).
- `functions/api/ai.js` — حارس المدخلات: يرفض بلا مصادر (`no_source`)، يُرفق روابط للنتائج.

## 4) الوظائف المكتملة (قابلة للتحقق)

| الوظيفة                                        | الدليل                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| دليل مؤسسات ابن زهر (24 رسمية + بلاغ فنط ولات) | subdomain في كل صفحة + `etablissements/` live 200                    |
| فهرس التكوينات 382 (2026-10-17)                | `university-formations.json` + `academic-offer.html` + وسوم `source` |
| بوابة الطالب + الإعلانات                       | `portal.html` live 200 (منعطفات تاريخية)                             |
| مكتبة قانونية (40 موضوع) + PDFs                | `legal.html`, `documents/legal/` (57 PDF في dist)                    |
| المساعد الذكي (grounded)                       | `/api/ai` + tests (4/4 ملفات خضراء)                                  |
| 2FA إجباري عمليًا (client + server)            | migrations مطبّقة 2026-11-15 + RPC anon → `false`                    |
| النسخ الاحتياطي المشفّر                        | run `43752923040` + استرجاع تدريجي ناجح محليًا                       |
| بحث Ctrl+K                                     | `assets/search-index.json` + `tools/make-search-index.py`            |
| FEGA/FSJPA جمع المحتوى الرسمي                  | صفحات manifested + live 200 + Sitemap محدّثة                         |

## 5) الوظائف الجزئية

- **المساعد الذكي** — grounding جيد، لكن التغطية = 52→55 صفحة مربوطة فقط؛ لا يوجد خوارزمية توليف قوية ولا تقييم مستمر للإجابات.
- **الإعلانات الثابتة** — 42 إعلاناً مُجدَّلة التواريخ؛ أقرب `ends_at` = **2026-11-15T18:00** (اليوم) — **تم إخفاؤها من الواجهة منذ 2026-11-16**؛ بقيت عملية البديل (banner تلقائي + إشعار لوحة التحكم) قيد التنفيذ.
- **البحث** — لا تحمل تسامح الأخطاء الإملائية ولا التطبيع الحقيقي خارج العربية/الفرنسية؛ الامتداد يدوي.
- **البوابة** — 220 KB inline، الزيارة الأولى ثقيلة؛ لا يوجد lazy-loading للبيانات (حمّال التجميعات عند الطلب فقط).
- **Git في المستودع** — `archive/` (104 MB) يُترجّح مع كل clone؛ لا تُستثنى التبعيات من `.gitignore` (غير ممكن: المحتوى تاريخي).
- **CNDP** — الملف جاهز (F-211 + F-118) لكن الإيداع ما زال يدويًا (`docs/CNDP_DECLARATION.md`).
- **الكتابة من الإدارة** — اللوحات تقرأ/تكتب عبر Supabase؛ لكن admin ما زال لم يُسجّل TOTP بعد → **الوصول مغلق عمليًا**.

## 6) الوظائف غير العاملة / غير الموجودة

- **التوسع الوطني** — لا توجد بيانات لأي جامعة أخرى (لا خاصة ولا عامة). الدليل الحالي = **جامعة ابن زهر فقط**.
- **نظام رصد وتحديث المصادر** (PART 15) — غير منشأ؛ التحديث يدوي عبر تحرير الملفات الخام.
- **الاستخراج الآلي من المواقع** — مشروع مسبق مُهمَل في `archive/` (104 MB)؛ غير مُشغّل.
- **التكامل مع SIEM/تنبيهات** — غير موجود (يمكن إضافة Webhook من Supabase → لاحقاً).
- **الامتثال الكامل لـ F-118** — الملف القانوني في انتظار المالك.

## 7) نقاط الضعف التقنية

1. **أداء**: `portal.html` 220 KB HTML مدمج؛ `assets/lib/lucide-*.min.js` 347 KB يُحمَّل في كل الصفحات؛ `chart-*.umd.js` 204 KB يُحمَّل في بوابات لاحتياج محيل واحد؛ لا يوجد code-splitting على مستوى المكونات.
2. **جودة الكود**: 108 تحذيرات ESLint (0 خطأ) — معظمها `no-unused-vars` في `platform/js/auth.js` (`safeAuthErrorMessage` معرّفة غير مستخدمة) و`no-undef` (77:26) — **أضفنا استخدامها بدل التكتم عليها في هذا السبرينت** (انظر `docs/CHRVVIM_RELEASE_REPORT.md`).
3. **تكرار**: `legal-encyclopedia-data.js` (الجذر stale، 50 KB) **محذوف** 2026-11-15؛ `archive/` 775 بايتات أوف لا تحذف؛ 28 ملف `.bak` في `_dev` (لا تأثير على النشر).
4. **ابارزات TypeScript**: 58 ملف في `vendor/OpenMausBot/` — غير مرتبطة بالإنتاج، مؤرشفة.
5. **توثيق متفرّع**: 27 ملف في `docs/` + أصول ثنائيات تحليلية؛ لا يوجد فهرس موحّد؛ هذا التقرير هو بداية `docs/CHRVVIM_MASTER_EXECUTION_LEDGER.md`.
6. **الأمان**: VPN/WAF إضافي غير موجود؛ `admin.html` يستهلك RLS فقط (كافٍ، لكنه يفتقر لطبقة Cloudflare Access كـ second layer — مفتوح كـ recommendation في checklist).

## 8) تكرار البيانات

- `institutions-database.json` ↔ `.csv` ↔ `.js` — متطابقة (38 سجل، ids متطابقة بالترتيب، 14 `website_url` فارغ في الكل)؛ **الآن مُغطاة باختبار Vitest جديد** (`tests/institutions-database.test.mjs`).
- `university-formations.json` ↔ `.js` — متطابقة (382/382).
- `legal-encyclopedia-data.js` — كانت نسختان (جذر stale 50 KB + assets active 138 KB)؛ الجذر أُزيل.
- `archive/` نفس البيانات بسعرات متعددة؛ غير مستخدمة.

## 9) تكرار الكود

- `app.js` (144 KB) — 753?؛ `chrvvim-plus.js` (7 KB) + `chrvvim-studio.js` (4.5 KB)؛ `page-i18n.js` (83 KB) يضرب `app.js` في مواضع الترجمة.
- عدة "نسخ" من بوابات: `portal.html`, `portal-simple.html`, `portal-v2.html`, `portal-ibn-zohr.html`, `portal-tajawal.html` — **`portal.html` هو الكنسي**؛ الباقي legacy محفوظ.
- `_dev/backups` 28 نسخة.
- `sw.js` — قائمة precache يدوية (2 سطور؛ shell محدود).

## 10) مشاكل الربط

- `/etablissements/<slug>.html` — الروابط نظيفة (audit-links ✓ 1,324/0).
- `/api/ai` — يقرأ `/assets/search-index.json` عند الإقلاع (cached 300s) ✓.
- `functions/api/ai.js` — يتطلب `OMNIROUTE_KEY`؛ في الإنتاج مُعدّ في Secrets؛ في CI tests يُستبدل بـ mock.
- `Build manifest` — تحقق يدوي فقط (`_dev/_manifest_check.py`) — **ليس جزءًا من CI** (تحقق دوري يدوي فقط؛ انظر §15).
- `sitemap.xml` — تُفحص عبر `verify-production.yml` فقط (robot 05:17 UTC).

## 11) مشاكل الأداء

- الحجم: 175 PDF في repo (35 MB) + 165 HTML + (portal.html 220 KB) → dist ~40 MB؛ Lighthouse موثّق على `/` فقط (categories ≥ 0.8/0.9).
- صور: `founder.jpg` 139 KB + `founder-256/96` مصغّرة؛ لا يوجد WebP/تيارات متعددة القرارات في كل الصفحات.
- خطوط: IBM Plex Sans Arabic 400/600/700 (woff2) + Fraunces + Noto Naskh Arabic ✓ self-hosted.
- `v2.css/js` + `assets/lib/*` في كل الصفحات (يُحمّل lucide حتى للصحف الثابتة) — فرص lazy-load متاحة لصفحات "اللحظة الواحدة".
- Service worker يحتوي shell محدود؛ لا caching للـ PDFs الضخمة.

## 12) مشاكل الأمان

راجع `docs/SECURITY_AUDIT_2026-11-14.md` كاملاً (27 بند)؛ هذا الملف يعرض **اهم النقاط كما هي اليوم**:

- ✅ RLS على الجداول الحساسة؛ `is_admin()`+`has_aal2()` مطبّق.
- ✅ 2FA إجباري (client + RLS server) — لكن **المالك لم يسجّل TOTP بعد** → كل جلسة admin هي aal1 → RLS تمنع القراءة/الكتابة (fail-closed).
- ✅ Secret-scan PASS؛ 0 مفاتيح تلقائية؛ 2 publishable فقط.
- ✅ Backups مشفّر (43752923040) + restore drill ناجح.
- ⚠️ `atlas` خارج الباكاب (403) — خارج مسؤولية الحساب.
- ⚠️ CNDP F-211/F-118 لم يُرفع بعد.
- ⚠️ CSP ما زالت `unsafe-inline` (مطلوب للسكربتات المدمجة) — مُرَصَّد في checklist.
- ⚠️ 108 تحذيرات ESLint (غير مضحكة لكن غير حاسمة).
- ⚠️ لا MFA + SSO للـ org نفسها (`chrvvim_campus` Organization على GitHub).

## 13) مشاكل تجربة المستخدم

- RTL مدعوم أصليًا (`lang="ar" dir="rtl"`) + خطوط عربية + Ctrl+K عالمي ✓.
- `portal.html` ضخم → تحميل أول بطيء على اتصالات بطيئة؛ لا تحميل skeleton ولا prefetch data.
- `axe/Lighthouse` في CI على 3 مسارات فقط — الباقي غير مدقّق.
- dark mode على etablissements ✓ / على الصفحات الرئيسية جزئية.
- Ctrl+K index بيدوي (غياب الإدخالات تُرى) — أُضيفت FEGA/FSJPA/اليوم • لا يوجد search tolerant للأخطاء الإملائية.
- إعلانات ما بعد 2026-11-15T18:00: **أُصلح** — المنتهية مخفيَّة؛ يبقى بديل "banner + إشعار لوحة" للإخفاء التلقائي التام.

## 14) مخاطر التوسع (إلى الوطنية)

1. **المعطيات** — لا توجد مصادر رسمية مُسجّلة لبقية الجامعات (خاصة/OFPPT/مؤسسات مدرسية)؛ لا يجوز اختراعها.
2. **التحديث** — التحديث = يدوي؛ بدون crawler (تم تجميده في `archive/` لأسباب السلامة).
3. **Tracking/Analytics** — لا يوجد Umami/GA؛ لا تتبّع مجهول؛ غير قابل لمراقبة التدهور.
4. **التحكم في الوصول** — Supabase Free مع 500 MB DB + 1 GB storage + 500K edge requests/يوم — قد يكفى لشهور وليس ملايني requests.
5. **القانون** — CNDP (F-211/F-118)، تسجيل نظام الاستبعاد من دورات التوزيع (30 يوم)، قانون 09-08… كلها معلقة.
6. **السمعة** — لا توجد آلية صحافة واضحة؛ لا "How did you know?" button؛ لا خلاف موثّق (PART 07).

## 15) خطة الإصلاح والتطوير (مراحل قابلة للتسليم)

- **المرحلة 0 (تم اليوم)** — تدقيق + توثيق + إزالة الكود الميت + اختبارات integrity + فهرسة بحث + manifest محدّث.
- **المرحلة 1 (أسبوعيًا)** — خنق الإعلانات المنتهية تلقائيًا (ends_at → 404 banner + إشعار لوحة التحكم)؛ إعادة بناء `make-seo.py` لتوليد sitemap من الامتدادات بدل تحرير يدوي؛ فحص دوري (CI) مع `_manifest_check.py`.
- **المرحلة 2 (شهريًا)** — ربط مراقبة المصادر (HEAD requests أسبوعية على `sources-register.json` + `uiz.ac.ma` + `preinscription.uiz.ac.ma` + فتح "source_status" لكل مؤسسة في الدليل)؛ تنظيف `docs/` بالدمج التراكمي.
- **المرحلة 3 (رباعي)** — pilot وطني: إنشاء صفحات حقيقة لـ "الجامعات العمومية الـ 10 الأولى" مع **موافقة يدوية من مصادر رسمية** + وقوف البيانات في جدول `official_sources` (التفصيل في `03_knowledge_atlas_schema.sql`) — **لا تُنشأ قبل المرحلة 2**.
- **المرحلة 4 (أداء)** — splitting لـ chart/lucide حسب الصفحة؛ تحويل PDF إلى R2/CDN؛ lazy-loading لـ portal.html؛ قياسات Lighthouse على كل routes (CI).

## 16) ترتيب الأولويات (النافذ اليوم)

| #      | المهمة                                                                                                      | السبب                                                | الحالة          |
| ------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------- |
| **P0** | المالك يسجّل TOTP في `admin.html` و`platform/login.html`                                                    | كل جلسة admin اليوم aal1 → الوصول مغلق (fail-closed) | ⛔ يدوي         |
| **P1** | ✅ تم: عروض الإعلانات المنتهية مأخفاة تلقائيًا (`isAnnLive`)؛ يبقى banner + إشعار لوحة التحكم للتحقق الكامل | —                                                    | ✅ جزئيًا       |
| **P1** | CNDP F-211 + F-118 + نقل/حذف البيانات                                                                       | الالتزام القانوني                                    | ⏳ مالك + محامي |
| **P2** | نقل PDFs إلى R2 + تحديث روابط + إعادة قياس Lighthouse (CI على أكثر صفحات)                                   | dist 40 MB؛ 35 MB PDFs                               | 🔧 بعد قرار R2  |
| **P2** | تقليص `portal.html` (Lazy-loading للبيانات، نقل المنطق إلى `assets/portal-page.js`)                         | 220 KB أول تحميل                                     | 🔧 تدريجي       |
| **P3** | `make-seo.py` توليد sitemap آليًا + robots + verification build في CI                                       | مزامنة المعايير والقاعدة                             | 🔧              |
| **P3** | تنظيف `_dev/backups` + `archive/` من المستودع (مع الحفاظ على tag تاريخي)                                    | 104 MB كلون                                          | 🔧              |

## 17) الملفات التي لا يجوز المساس بها دون سبب واضح

1. `platform/js/config.js` و`supabase-config.js` — مفاتيح publishable فقط؛ لا يُضاف إليها أي service_role أو ينقل مكانها سر.
2. `supabase/migrations/*.sql` — مطبقة؛ التعديل = migration جديدة فقط.
3. `_headers` + `_redirects` — سياسات النشر؛ أي تعديل يستلزم فحص Lighthouse/links.
4. `announcements.json` + `university-*.json` + `campus-data.js` — بيانات مصححة من المصادر؛ تُحدَّث فقط عن توثيق موثوق أو يدويًا بمراجعة.
5. `archive/` و`vendor/` — تاريخ محفوظ؛ الحذف يتطلّب إثبات عدم حاجة + tag منطقة.
6. `.github/workflows/*` — كل workflow له مجموعة مراقبة؛ لا تكسرها بتغيير secrets أو إصدار GH CLI.
7. `BUILD_MANIFEST.sha256` — يُعاد توليده فقط بعد أي تغيير في الملفات المنشورة.

---

## Phase 2 (2026-11-16) — مراقبة المصادر والتحقق

- `tools/verify-official-sources.py` جديد: يفحص **كل رابط رسمي مسجل** (81 رابطًا من `sources-register.json` + `institutions-database.json` + `university-formations.json` + `announcements.json`) — HEAD ثم GET بمدى 2048 بايت؛ **reachability فقط**، لا تحقق من المحتوى؛ يكتب `docs/SOURCES_STATUS.md`.
- **القنوات الحرجة كلها 200:** `uiz.ac.ma/` · `/nos-etablissements` · `preinscription.uiz.ac.ma/institutions`.
- `.github/workflows/source-watch.yml` جديد: مجدول أسبوعي (الأربعاء 05:15 UTC) + يدوي؛ يفشل الـ run لو تعذرت أي قناة حرجة (`--strict`)؛ يرفع التقرير كـ artifact 30 يومًا.
- `docs/TOP_INSTITUTIONS_OFFICIAL.md` جديد: المؤسسات الـ **24** المدرجة على الصفحة الرسمية (فُحِصت اليوم — الـ slugs كلها `200`) مع روابط `uiz.ac.ma` الحقيقية.
- **اكتشاف حرج:** 6 روابط مواقع ذاتية للمؤسسات لا تُحل (DNS) أو شهاداتها معطلة (`fsa.ac.ma`, `fsjes-agadir.org`, `fpo.ma`, `ensiasdt.uiz.ac.ma`, `chariaasmara.com`, `cuam.uiz.ac.ma` → 502, `ims.uiz.ma`). تبقى مُسجلة لكن أُشير إليها في التقرير بأنها **غير موثوقة**؛ المرجع المعتمد هو `uiz.ac.ma/nos-etablissements`.
- **إصلاح الإعلانات المنتهية:** `loadCampusAnnouncements` (app.js) + `rafiq-altalib.html` + `students-guide.html` لم تعد تعرض ما انتهى `ends_at` الخاص به؛ صفحة MY-UIZ guide تعرض «انتهى الأجل المذكور …» بدل تاريخ ماضٍ (`assets/cx-myuiz-guide.js`)؛ إعلانات «إعادة التسجيل 2026-2027» لم تعد تظهر. **مشكلة إضافية اكتُشفت وأصلحها بعد النشر:** الاستعلام الكامل كان `document.readyState` ↔ مجرد التحديث — `portal.html` كان يطلب `app.js?v=20261113e`، والـ Service Worker يُخزّن بالـ URL كاملًا، فبقيت النسخة القديمة (بها bug `items=[]`) تعمل عند المستخدمين رغم النشر الجديد. **أُصلحت بترقية `?v=` إلى `20261116a` في `portal.html`** — الآن تعرض البوابة فعليًا 6 إعلانات منشورة (39 معروضًا) والـ expired مخفيَّة (مؤكد حيًا 2026-11-16).
- Unit tests: **48** (كانت 42).

## ملحق — مرجعية قابلة للتحقق

- Links audit: `1324 ✅ / 0 broken` (run lokal + CI 43757955649).
- Secret-scan: PASS (1 117 ملفًا) — 1114 قبل الحذف + 3 جديدة (بعد فحص هذا السبرينت).
- Unit tests: **48** passed (كان 33 قبل هذا العمل).
- Build: `276 files copied`؛ manifest **299**.
- CI runs: Deploy `43757955658` · CI & Quality `43757955649` · Quality Gates `43757955668` · Backup `43752923040` (+ الجماعة `0bfd873`) · Verify production `43757868366` · Backup المجدول 2026-11-16 `43860242148` — كلها ✅.
- `Verify production` يتحقق أن `sitemap.xml` المُقدم = git `HEAD:sitemap.xml` (byte-identical).
