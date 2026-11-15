# CHRVVIM — Master Execution Ledger

**آخر تحديث:** 2026-11-15 · **الرقم قبل بدء هذا السبرينت:** `bbbc769`

> الحالات: `NOT_STARTED` · `IN_PROGRESS` · `BLOCKED` · `IMPLEMENTED` · `TESTED` · `VERIFIED` · `PUBLISHED`
>
> لا يجوز رفع الحالة دون فحص فعلي (build + audit + live check). هذا الملف هو مرجع الاستئناف بعد أي انقطاع.

## الحالة العامة

| المرحلة         | المهمة                              | الحالة   | الأدلة                           |
| --------------- | ----------------------------------- | -------- | -------------------------------- |
| PART 01         | فحص المستودع + التبعيات             | VERIFIED | `docs/CHRVVIM_FORENSIC_AUDIT.md` |
| PART 22-T01..04 | اكتشاف الوظائف + البيانات + التكرار | VERIFIED | الفحص + تحليل Python/PowerShell  |
| PART 22-T05     | الاختبارات قبل التعديل              | VERIFIED | 33/33 قبل · 42/42 بعد            |
| PART 22-T06     | تقرير التدقيق                       | VERIFIED | `CHRVVIM_FORENSIC_AUDIT.md`      |
| PART 22-T07     | خمسة اختناقات                       | VERIFIED | §7 “نقاط الضعف” + §14            |
| PART 22-T08     | أول إصلاحات آمنة ذات قيمة           | VERIFIED | انظر القائمة أدناه               |
| PART 22-T09     | الاختبارات بعد                      | VERIFIED | `npm test` 42/42 ✅              |
| PART 22-T10     | تقرير قبل/بعد                       | VERIFIED | `CHRVVIM_RELEASE_REPORT.md`      |

## تغييرات هذا السبرينت (2026-11-15)

| التغيير                                     | الملفات                                                                                                                        | الحالة                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| دمج FEGA/FSJPA رسميًا في `/etablissements/` | `official-content.html`, `fega.html`, `fsjpa.html`, `official.css`, `index.html`, `sitemap.xml`                                | PUBLISHED (Deploy `43757955658`؛ live 200)  |
| مزامنة manifest والـ build                  | `BUILD_MANIFEST.sha256` (300→299 بعد الحذف)                                                                                    | PUBLISHED                                   |
| إضافة FEGA/FSJPA لفهرس البحث                | `tools/make-search-index.py` + `assets/search-index.json` (52→55)                                                              | PUBLISHED                                   |
| اختبار سلامة بيانات المؤسسات                | `tests/institutions-database.test.mjs` (+9 اختبارات)                                                                           | TESTED (42/42 ✅)                           |
| إزالة الكود الميت                           | `legal-encyclopedia-data.js` (جذر) — استبدلت بالنسخة assets (الفعّالة)                                                         | VERIFIED (0 مرجع؛ removal موثق في AUDIT §5) |
| توثيق هذا التدقيق                           | `docs/CHRVVIM_FORENSIC_AUDIT.md`, `CHRVVIM_MASTER_EXECUTION_LEDGER.md`, `CHRVVIM_MISSING_DATA.md`, `CHRVVIM_RELEASE_REPORT.md` | IMPLEMENTED                                 |

## قبل هذا السبرينت (2026-11-14/15، `500e3b9`→`bbbc769`)

| التغيير                                                                      | الحالة   | الدليل                                                    |
| ---------------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| خفضياً 2FA (aal2) في RLS للـ portal وplatform (`is_admin()` + `is_editor()`) | VERIFIED | migrations مطبّقة 2026-11-15؛ anon RPC → `false`          |
| تشفير بيانات auth في الباكاب + حظر PII بلال تشفير                            | VERIFIED | run `43752923040`؛ ملفات `*-auth.sql.gz.enc` (`Salted__`) |
| توثيق/ترقية نشاط atlas وفحص 403                                              | VERIFIED | `docs/BACKUPS.md` §1                                      |
| تنظيف خطوط التتبع                                                            | VERIFIED | `git status` نظيف؛ `DIST_VERIFICATION.md` → Temp          |
| تحويل `index.html` إلى صفحات FEGA/FSJPA                                      | VERIFIED | هذا السبرينت                                              |

## المشاريع المستقبلية / لم تُنفَّذ بعد

| المرحلة | المهمة                                                       | الحالة                                                                        |
| ------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| PART 02 | فرع تطوير (بيئة محدودة)                                      | NOT_STARTED — العمل يتم داخل `main` بموافقة ضمنية (public repo + CI gates)    |
| PART 03 | التوسع الوطني — مصدر: `uiz.ac.ma` + `data.gov.ma` + الوزارات | NOT_STARTED — **لا يجوز اختراع بيانات**                                       |
| PART 04 | محرك اكتشاف المصادر                                          | BLOCKED (يحتاج موافقة/مصادر رسمية)                                            |
| PART 05 | خط استخراج كامل                                              | BLOCKED (يحتاج كرابيلر + صلاحية)                                              |
| PART 06 | schema بمشروع جديد (organizations/programs/…)                | ⚠️ صياغة فقط في `supabase/03_knowledge_atlas_schema.sql` — **لم تُطبق**       |
| PART 07 | نظام الحقيقة/التعارض                                         | IN_PROGRESS (by-design عبر RLS + سجل verify)؛ وحدة معينة غير منفذة في الكود   |
| PART 09 | محرك البحث على مستوى قوات                                    | IN_PROGRESS (`assets/search-index.json` يدوّي) — لا typos                     |
| PART 10 | RAG متقدم (multi-stage verifier)                             | IN_PROGRESS (assistant حاليًا grounded + `no_source` refusal)                 |
| PART 11 | توحيد UX عبر كل المنصة                                       | IN_PROGRESS (RTL + v2.css؛ 3 مسارات فقط بـ axe)                               |
| PART 12 | لوحة إدارة متعددة الصلاحيات (SUPER/ADMIN/EDITOR/REVIEWER)    | PARTIAL (`admin.html` + `admin-dashboard.html`؛ الأدوار = 2 فقط؛ لا REVIEWER) |
| PART 13 | تحقق أعمق أمني (SBOM/DAST)                                   | IN_PROGRESS — راجع `docs/SECURITY_AUDIT_2026-11-14.md`                        |
| PART 15 | مراقب المصادر المستمر                                        | NOT_STARTED                                                                   |
| PART 18 | National Coverage Dashboard                                  | NOT_STARTED (لا توجد بيانات لتعرضها)                                          |

## تعليمات الاستئناف (بعد توقف أي وكيل)

1. `cd mrchraim/chraim && git log --oneline -5 && git status --short`.
2. اقرأ `docs/CHRVVIM_MASTER_EXECUTION_LEDGER.md` (هذا الملف).
3. `python tools/audit-links.py --root dist` — إن لم يكن dist جاهزًا نفّذ `python tools/build-dist.py --out dist --clean`.
4. `npm test` — 42 اختبارًا يجب أن تنجح.
5. `gh run list --limit 4` — آخر workflows (deploy/commits).
6. إن رجعت للعمل على البيانات: اقرأ `docs/CHRVVIM_MISSING_DATA.md` وقائمة P0/P1 في `docs/CHRVVIM_FORENSIC_AUDIT.md`.
