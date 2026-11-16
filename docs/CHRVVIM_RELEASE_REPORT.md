# CHRVVIM — Release Report: السبرينت 2026-11-15 (PART 22 — First Execution Sprint)

**الفرع:** `main` · **قبل:** `bbbc769` · **بعد:** التزام هذا السبرينت (انظر `git log`)

## 1) ملخص تنفيذي

هذا السبرينت لم يغيّر بنية، ولم يغيّر تصميم، ولم يخترع بيانات. هدفه:

1. فهم المستودع الحقيقي (forensic audit) → `docs/CHRVVIM_FORENSIC_AUDIT.md`
2. تنفيذ أول مجموعة إصلاحات آمنة ذات قيمة ملموسة → انظر §2
3. تثبيت سجل، بحيث لا يُعاد العمل نفس العمل
4. توثيق كل ما تعلّمه مع الأدلة

**النتيجة:** ✅ pipeline خضر (Build + Tests + Audits)، ✅ manifest محدّث، ✅ توثيق كامل، ✅ نفس المواقع حية على `chraim.pages.dev`.

⚠️ **لا يُعتبر المشروع مكتملًا بمعايير PART 20.** أعلى ثلاثة اختناقات متبقية: التوسع الوطني (لا بيانات)، CNDP F-211/F-118 (مالك)، تسجيل TOTP (مالك).

## 2) ما تم (التغييرات + الأدلة)

### A. دمج الصفحات الرسمية لـ FEGA/FSJPA داخل CHRAIM (جزء من الطلب 2026-11-15)

- الصفحات: `/etablissements/fega`, `/etablissements/fsjpa`, `/etablissements/official-content`
- مرتبطة من `/etablissements/index.html`
- Sitemap (`sitemap.xml`) + manifest محدّثان
- live 200 بجميع الاختبارات (headings + no console errors)
- commits: `2d129a9`, `bbbc769` (الفهرسة)

### B. مزامنة assets/search-index.json (55 مدخلاً)

- أُضيفت الصفحات الرسمية لـ 3 من 3 (الصفحات الجديدة قابلة للبحث عبر Ctrl+K)
- `tools/make-search-index.py` يُحدَّث تلقائيًا عبر إعادة توليد عند كل تغيير
  -commit `…search…`; file +3 سطور فقط

### C. اختبار جديد لسلامة البيانات

- `tests/institutions-database.test.mjs` (5 وصف):
  - `count == records.length`
  - كل سجل: `id`, `official_source_url` (https), `last_verified` (ISO), `status` ∈ allowed set
  - ids فريدة عبر CSV/JSON (ترتيب مطابق)
  - `.csv` و`.js` متطابقان في البنية
  - `search-index.json` + `announcements.json` صالحان
- نتيجة: **42/42** ✅ (33 قبل)

### D. إزالة الكود الميت (إثبات عبر بحث git)

- `legal-encyclopedia-data.js` (الجذر، 50 KB، محتوى stale “20 topics”)
  - ✅ لا توجد صفحة/سكربت يستورد/يُشير إليه (Git grep، جميع السياقات)
  - ✅ النسخة الفعّالة تُستعمل `assets/legal-encyclopedia-data.js` (40 موضوع، content_blocks)
- Manifest 300 → **299**؛ `BUILD_MANIFEST.sha256` أُعيد توليده
  -استرجاع ممكن من git history على أي commit سابق (`git show <hash>:legal-encyclopedia-data.js`)

## 3) قبل/بعد — الأرقام

| المقياس                      | قبل (`bbbc769`)               | بعد السبرينت               | Δ            |
| ---------------------------- | ----------------------------- | -------------------------- | ------------ |
| كلمات مرور/`.env` exposure   | 0                             | 0                          | 0            |
| موجهات (`archive/`)          | 775                           | 775                        | ثبتت         |
| `assets/search-index.json`   | 52                            | **55**                     | +3           |
| `tests`                      | 33/33 ✅                      | **42/42 ✅**               | +9           |
| `BUILD_MANIFEST.sha256`      | 300                           | **299**                    | −1 (ملف ميت) |
| `dist`                       | 277                           | **276**                    | −1           |
| روابط مكسورة (`audit-links`) | 0/1324                        | **0/1324**                 | ✅           |
| secret-scan                  | PASS                          | **PASS**                   | ✅           |
| CCIP (new Lighthouse assert) | إلزامية ≥0.8/0.9 على 3 مسارات | نفس السياسة                | ✅           |
| الصفحات الفرعية (الجذر)      | 28                            | 28                         | —            |
| صفحة رسمية FEGA              | ❌                            | ✅ `/etablissements/fega`  | جديد         |
| صفحة رسمية FSJPA             | ❌                            | ✅ `/etablissements/fsjpa` | جديد         |

## 4) حدود ما أُنجز صادقًا

- ✅ لم أُنشئ بيانات جديدة لأي جامعة/تكوين/مؤسسة/مسابقة غير ابن زهر — **لا يوجد** مصدر رسمي يؤيّدها.
- ✅ لم أُغيّر RLS ولا الامتيازات ولا secrets؛ التغييرات الأمنية كانت دورة انتقال مُلغاة على `db_password` ستحتاج مراجعة يدوية للروابط القديمة (تم التنويه عنها في التطبيق).
- ✅ لم أحذف أي ملف تاريخي (archive) — عمليات التطهير فيها تُقرر بيد مستقلة لا بيد هذا السبرينت.
- ⚠️ `sitemap.xml` ما زالت تُحرَّر يدويًا؛ أداة `make-seo.py` موجودة — لم تُشغّل لعدم فقدان `lastmod` التفصيلي أو لإعادة إلباس CF Pages (list → updates كل شيء بتاريخ النهار = false freshness).

## 5) المشترك المستمر

- Push → GitHub Actions → `build-dist.py` → `audit-links` (مسموح: 0 مكسورة) → `secret-scan` → `Lighthouse` (3 مسارات) → Deploy لاحقًا.
- `verify-production.yml` 05:17 UTC يوميًا يقارن `sitemap.xml` بالنسخة المنشورة.

## 6) الخطوة التالية المعقولة (PART: NATIONAL EXPANSION / P2)

1. تنفيذ **P0**: تسجيل TOTP (مالك) ⚠️ وصول admin معلق.
2. تنفيذ **P1**: بدء مراقبة انتهاء صلاحية الإعلانات (banner تلقائي عند الإعادة بعد `ends_at` + إشعار لوحة التحكم).
3. تنفيذ **P1**: تخصيص مسئول بيانات + DPO رسمي (قرار موثق، يوثق في `docs/DECISIONS.md`).
4. تنفيذ **P2**: طباعة PDF إلى R2/CDN + إحلال `portal.html` بـ lazy-loaded modules.

الحالة العامة يُحدّث فقط بعد قائمة الفحص: `git status` نظيف · `npm test` 48/48 · `python tools/build-dist.py` ✅ · `python tools/audit-links.py` 0 كسر · live HTTP 200.

## 7) Phase 2 — 2026-11-16 (مراقبة المصادر + توثيق)

- **فحص المصادر الرسمية** — `tools/verify-official-sources.py` (81 URL: من `sources-register.json` و`institutions-database.json` و`university-formations.json` و`announcements.json` و`official-academic-updates-*.json`)؛ الناتج: `docs/SOURCES_STATUS.md` (68 ✅ OK · 1 FORBIDDEN محليًا · 1 404 على جذر supabase تم إصلاحه بإضافة `/auth/v1/health` · 11 ERROR لروابط مؤسسات ذاتية غير قابلة للحل DNS/SSL).
- **القنوات الحرجة** `uiz.ac.ma/` · `/nos-etablissements` · `preinscription.uiz.ac.ma/institutions` — كلها `200`.
- **`.github/workflows/source-watch.yml`** جديد: مجدول (الأربعاء 05:15 UTC) + يدوي؛ يفشل عند انهيار قناة حرجة (`--strict`)؛ يرفع التقرير artifact.
- **`docs/TOP_INSTITUTIONS_OFFICIAL.md`** جديد: الـ 24 رسمية على الصفحة الرسمية (كل slug فُحص اليوم 200) + روابط جامعة ابن زهر الحقيقية + جدول مواقع فرعية غير موثوقة.
- **الإعلانات المنتهية (`ends_at`) لم تعد تظهر** — `app.js` / `rafiq-altalib.html` / `students-guide.html` + ملف `myuiz-guide.js` لصفحة الـ dead-line (تعرض «انتهى الأجل المذكور …») + إعلانات إعادة التسجيل 2026-2027 الآن مخفية. الاختبار `announcements-live.test.mjs` (6 اختبارات) يثبت السلوك.
- **Bug حرج ثانٍ اكتُشفت تلقائيًا من التحقق الحي:** الاستعلام `?v=20261113e` على `app.js` في `portal.html` — الـ Service Worker يخزّن بالـ URL كاملًا، فظل المستخدمون يرون الكود القديم (إظهار «لا توجد إعلانات» رغم وجود 39 صالحًا). **أُصلح بترقية `?v=` إلى `20261116a`** — مؤكد حيًا: البوابة تعرض 6 إعلانات منشورة و0 منتهي (2026-11-16).
- **Tests: 48** (كانت 42). `sources-register.json` → `updated_on: 2026-11-16` (بوابات Supabase مسجلة بـ health endpoint).
- مشتر الوفر: `Deploy/…` ستُضاف بعد push.

## 8) Phase 3 — 2026-11-16 (إبداع + تكامل الميزات + جودة)

- **`ai-assistant.html` لم تعد صفحة وهمية:** أُعيد بناؤها كمساعد استرداد يعمل بالكامل داخل المتصفح على `assets/search-index.json` (تطبيع/تقسيم/ترتيب، مع مصادر لكل نتيجة؛ بلا backend وبلا «ذكاء مزعوم»). **Bug حرج حقيقي وُجد بالاختبار الحي:** regex الحذف `\u0617-\u0652` كان يمحو كل الحروف العربية المساسية (م، ن، ح…) ويُرجع نتيجة «ما لقيتش» على أي سؤال. أُصلح إلى `[\u0610-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]` — مؤكَّد حيًا: «منح»→1 نتيجة، «طب والصيدلة»→3، «استعمالات الزمن»→1، ولا أخطاء console.
- **`student-rights.html` جديدة:** دليل عملي لطالب جامعة ابن زهر (الوصول إلى ملفّك الشخصي وتصحيحه، مراجعة النقاط/الطعن في الامتحان — مع تحفظ بأن الأجل يختلف حسب الكلية، تغيير الشعبة/المسار، المنح، حماية المعطيات حسب القانون 09-08 وأرقام CNDP 3020، الشكاية بمسطرة من الكلية نحو الرئيس نحو الوزارة). كل الروابط الرسمية مذكورة كما هي، دون ادعاء استشارة قانونية.
- **`index.html`:** quickstart من «أربعة أبواب» إلى «خمسة» مع بطاقة `05 / RIGHTS` (دليل حقوقك كطالب). **`students-guide.html`:** بطاقتان رابطتان للصفحتين الجديدتين.
- **`sw.js`:** SHELL `v27 → v28` وأضاف `student-rights.html` و`ai-assistant.html` للتخزين المسبق (لازم لعمل أوفلاين).
- **`sitemap.xml` + `assets/search-index.json` + `tools/make-search-index.py`:** مداخل الصفحتين الجديدتين مضافة (56 مدخلة، بلا تكرار).
- **BUILD_MANIFEST.sha256:** أُعيد بناؤه (299 → 300 مدخلة).
- **Axe/Lighthouse:** `tools/run-axe-audit.cjs` — `/` و`/privacy.html` و`/terms.html`: **0 انتهاك**. الصفحتان الجديدتان فحصتا حيويًا: لا أخطاء console، نصوص عربية سليمة، H1 موجود، كل الروابط نسبية/رسمية.
- **الاختبارات:** 48/48 ✅. `build-dist.py` ✅ (277 ملف) · `audit-links.py` ✅ (1323 رابط، 0 كسر).
- **التحقق الحي قبل الرفع:** الصفحتان الجديدتان والدليل الجديد كلها تُرجع HTTP 200 محليًا وتعرض المحتوى بصريا صحيحًا (H1 بالعربية RTL).
