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

الحالة العامة يُحدّث فقط بعد قائمة الفحص: `git status` نظيف · `npm test` 42/42 · `python tools/build-dist.py` ✅ · `python tools/audit-links.py` 0 كسر · live HTTP 200.
