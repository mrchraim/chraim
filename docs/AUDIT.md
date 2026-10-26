# CHRAIM — تدقيق Phase 1 (AUDIT)

**التاريخ:** 2026-10-27  
**المستودع:** `chraim` (OneDrive/GitHub/chraim) — فرع `main` (`6772513`)  
**النطاق:** استكشاف فقط — لا تغييرات على الكود.

---

## 1. خريطة الصفحات

| المسار                       | الملف                                           | الدور                                                | الحجم |
| ---------------------------- | ----------------------------------------------- | ---------------------------------------------------- | ----- |
| `/`                          | `index.html`                                    | الصفحة الرئيسية: دليل المؤسسات + محرك الأفواج (FSJP) | 13KB  |
| `/portal.html`               | `portal.html`                                   | بوابة الطالب الكاملة (18 تبويباً)                    | 190KB |
| `/orientation.html`          | `orientation.html`                              | مرشد التوجيه (382 تكويناً)                           | 6KB   |
| `/academic-offer.html`       | `academic-offer.html`                           | دليل التكوينات                                       | —     |
| `/academic-updates.html`     | `academic-updates.html`                         | المستجدات                                            | —     |
| `/university-directory.html` | `university-directory.html`                     | دليل المؤسسات                                        | —     |
| `/rafiq-altalib.html`        | `rafiq-altalib.html`                            | رفيق الطالب                                          | —     |
| `/etablissements/`           | 24 صفحة + `index.html` + `app.js` + `style.css` | دليل المؤسسات التفصيلي                               | —     |
| `/platform/`                 | 14 صفحة + `js/` (5 ملفات) + `css/`              | منصة الامتحانات (Supabase)                           | —     |
| `/admin.html`                | `admin.html`                                    | لوحة إدارة (noindex)                                 | —     |
| `/students-guide.html`       | —                                               | دليل الطالب                                          | —     |
| `/offline.html`              | —                                               | صفحة دون اتصال                                       | —     |
| `/404.html`                  | —                                               | خطأ 404                                              | —     |

## 2. خريطة البيانات

| الملف                                                                                                                                                           | المحتوى                         | الحجم |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----- |
| `app.js`                                                                                                                                                        | المنطق (أوقات، معدّل، مساعد، …) | 141KB |
| `campus-data.js`, `institutions-database.js`, `institutions-resources.js`, `institutions-gateway.js`, `subjects-data.js`, `legal-data.js`, `university-data.js` | بيانات المؤسسات/التكوينات       | —     |
| `university-formations.json`                                                                                                                                    | التكوينات (382)                 | —     |
| `assets/search-index.json`                                                                                                                                      | فهرس بحث Cmd+K                  | —     |
| `official-academic-updates-2026-2027.json`                                                                                                                      | مستجدات                         | —     |
| `announcements.json`                                                                                                                                            | إعلانات                         | —     |
| `sources-register.json`                                                                                                                                         | سجل المصادر                     | 7KB   |
| `manifest.json`                                                                                                                                                 | PWA                             | —     |
| `supabase/01_portal_schema.sql`, `02_platform_schema.sql`                                                                                                       | مخطط + RLS                      | —     |

## 3. الاعتماديات (Runtime)

- **لا build** (موقع ثابت). البناء (dist) عبر `tools/build-dist.py`.
- خارجية: خطوط Cairo/IBM Plex (محلية)، Supabase (anon/publishable، RLS)، Cloudflare Pages/Netlify.
- PWA: `sw.js` (v17، SHELL 50+ أصل، تكرار `institutions-database.js`).
- i18n: `page-i18n.js` (موجود، غير مفعل بالكامل).
- أمان: `_headers` (CSP: `script-src 'self' 'unsafe-inline'`، لا jsdelivr).

## 4. المشاكل (مصنّفة)

### 🔴 حرج (Critical)

1. **[cite: …] remnants** — 7 مواضع في `index.html` (سطر 55، 67، 106، 137، 138، 293 + 1) — بقايا توليد.
2. **«الپنفس الخامس»** — 1 موضع (`index.html:55`) — should be «السداسي الخامس».
3. **`searchGroup()` hard-coded** — `index.html:287` يعرض دائماً «الفوج A (المجموعات 1 - 4)» بغض النظر عن الاسم/المسار.
4. **`innerHTML` مع قيم المستخدم/الملفات** — `index.html` (name, selectedPathwayName, groupInfoOutput, scheduleTableBody, tr) — XSS risk.
5. **CSP vs reality** — `_headers` `script-src 'self' 'unsafe-inline'` (لا jsdelivr، OK بعد الإصلاح)، لكن `portal.html`/`index.html` may rely on inline scripts (unsafe-inline still needed).
6. **`sw.js` duplicate** — `institutions-database.js` مدرّج مرتين في SHELL.
7. **README says index.html = institutions guide**, but actual index.html = group finder (تعارض 2.5).
8. **portal.html size** — 190KB single file, app.js 141KB (budget <100KB JS initial not met).

### 🟠 مهم (Major)

9. **لا اختبارات** (لا unit/e2e) — 0 test files.
10. **لا i18n active** — `page-i18n.js` موجود لكن لا تبديل لغة فعلي (ar only).
11. **لا dark/light toggle** في index.html (portal has theme).
12. **لا `data/groups.json`** — بيانات الأفواج مُضمّنة في JS (hard-coded thresholds EL KARZABI/BOUASRY...).
13. **لا `localStorage` try/catch** في index.html (لا حفظ تفضيلات).
14. **لا `.ics` export / print**.
15. **لا calculator معدّل** في index.html (موجود في portal).
16. **SEO gaps** — hreflang? canonical? OG images? (partial in portal.html).
17. **No security.txt** (/.well-known/security.txt) present.
18. **No privacy/terms pages** (ar/fr).

### 🟡 تحسين (Minor)

19. **`_dev/`, `archive/`, `vendor/`, `tools/`, `supabase/`** في الجذر (مستبعدة من النشر — OK).
20. **Large zip files** في `archive/_packages/` (tracked in git — heavy).
21. **No ESLint/Prettier/stylelint config**.
22. **No GitHub Actions** beyond deploy (no tests/lint/a11y).
23. **i18n page-i18n.js** not documented for Tifinagh.
24. **PWA cache version manual** (v17) — should be build-hash.

## 5. خطة (≤10 أسطر)

1. Phase 2: إصلاحات حرجة (§2): [cite:] cleanup (7), «پنفس»→«سداسي» (1), CSP verify, group data JSON + real searchGroup, innerHTML→textContent+escape, README consistency.
2. Phase 3: foundation — design system docs, build/test/CI scaffolding (Vitest, ESLint, Prettier, GitHub Actions).
3. Phase 4: UX core — home «ماذا تريد اليوم؟», unified search Cmd+K, personal schedule, study tools.
4. Phase 5: i18n (ar/fr/en) + a11y WCAG 2.2 AA + security (RLS tests, CSP nonce).
5. Phase 6: community (Supabase RLS) + SEO (hreflang, schema, sitemap).
6. Phase 7: AI assistant design doc only (no code) — docs/AI_ASSISTANT.md.
7. After each phase: run build + audit-links + audit-security + tests; fix failures before next.
8. Branch: `improve/world-class` (not yet created — awaits approval).
9. No academic content changes except obvious typos; no service_role key.
10. Final report: `CHANGES_AR.md`.

---

**انتظار موافقتك** قبل الانتقال إلى Phase 2.
