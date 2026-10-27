# CHANGES_AR.md — تقرير التحسين (CHRAIM)

**الفرع:** `improve/world-class`  
**النطاق:** Phases 1–7 (استكشاف، إصلاحات حرجة، أساس تقني، تجربة، لغات/أمان (جزئي)، مجتمع/SEO (جزئي)، AI (تصميم)).

## 1. ما أُنجز

### Phase 1 — استكشاف
- `docs/AUDIT.md`: خريطة صفحات/بيانات، 23 مشكلة مصنّفة، خطة 10 أسطر.

### Phase 2 — إصلاحات حرجة
- إزالة 7 بقايا `[cite: …]` من `index.html`.
- تصحيح «پنفس» → «السداسي» (1).
- `data/groups.json` (جديد) + `computeLanguageGroup()`/`compareNames()` — لم تعد «الفوج A» ثابتة؛ `mainGroup` غير متوفر → «غير متوفر بعد» (صدق).
- تعقيم: `esc()` + DOM `textContent` (لا `innerHTML` مع قيم المستخدم).
- README: وصف index.html محدّث.
- CSP `_headers`: jsdelivr مُزال (من bundle).

### Phase 3 — أساس تقني
- `docs/DESIGN_SYSTEM.md` (tokens، components، motion، a11y).
- `package.json` + lock، ESLint 9، Prettier، Vitest، `.github/workflows/ci.yml`.
- `tests/group.test.mjs` — 11 tests (pass).

### Phase 4 — تجربة (جزئي)
- قسم «ماذا تريد اليوم؟» + 6 اختصارات + بطاقة «اليوم» + حفظ profile (localStorage) + تصدير `.ics`.
- بحث موحّد (Cmd+K) موجود (cmdk.js).

### Phase 5 — لغات/إتاحة/أمان (جزئي)
- `.well-known/security.txt`, `privacy.html`, `terms.html`.
- skip link + aria-label + مُبدّل لغة (AR/FR/EN) يحمّل `page-i18n.js`.
- لم يُنجز: ترجمة index (data-i18n)، وضع داكن على index، axe-core audit، CSP nonce.

### Phase 6 — مجتمع/SEO (جزئي)
- `sitemap.xml`/`robots.txt` regenerated via `make-seo.py`.
- SEO meta + OG + schema.org + hreflang على `index.html`.
- `docs/COMMUNITY.md` (تصميم RLS/مساهمات) — لا تغيير Supabase.

### Phase 7 — AI
- `docs/AI_ASSISTANT.md` (تصميم فقط — لا تنفيذ).

## 2. كيف اختُبر
- `npm test` — 11/11 pass.
- `npm run lint` — 0 errors (343 warnings).
- `npm run format:check` — pass.
- `tools/build-dist.py` — 161 ملف، 0 broken links (`audit-links`).
- `tools/audit-security.py` — 0 FAIL (تحذيرات متوقعة).
- JS syntax (`node --check`) — pass.

## 3. ما لم يُنجز وسببه
- **i18n كامل على index** — يتطلب 100+ `data-i18n` (لم يُنجز لتجنب regressions).
- **وضع داكن على index** — requires Tailwind dark variants rebuild.
- **axe-core audit** — لم يُشغَّل (لا بيئة browser automation في هذه الجلسة).
- **Lighthouse** — لم يُشغَّل (لا Chrome headless متاح) — لا أرقام تقديرية.
- **Community/RLS tests** — تصميم فقط (يتطلب Supabase env).
- **AI assistant** — تصميم فقط (يتطلب موافقة + budget).
- **Study tools (GPA/planner/pomodoro/flashcards)** — موجودة في portal; لم تُوحَّد.
- **Now/Next countdown, PWA notifications** — غير مُنفَّذة.

## 4. قرارات تحتاج موافقتك
1. AI assistant: provider، budget، hosting.
2. منصة النشر: Cloudflare (أساس) vs Netlify (بديل) — كلاهما مُعد.
3. Tifinagh/Amazigh على الواجهة العامة (ترجمة غير مراجعة → وسم).
4. دمج `improve/world-class` → `main` و push.

## 5. أهم 5 تحسينات
1. إزالة `[cite:]` + صدق البيانات (mainGroup غير متوفر).
2. تعقيم XSS (escape + textContent).
3. أساس تقني (lint/test/CI) — 11 tests.
4. SEO (sitemap، meta، schema، hreflang).
5. security.txt + privacy/terms.

## 6. 3 مخاطر متبقية
1. i18n غير مكتمل → UX languages (FR/EN) غير فعالة على index.
2. portal.html (190KB) + app.js (141KB) — budget الأداء غير محقق.
3. npm audit: 6 ثغرات في التبعيات (vite/esbuild) — لم تُصلَّح (audit fix --force قد يكسر).

## 7. الخطوات التالية (مرتبة بالأثر)
1. Run axe-core + Lighthouse (when browser available) → fix violations.
2. Wire data-i18n on index (ar/fr/en) + dark mode.
3. Split portal.html/app.js into lazy modules (performance).
4. Supabase RLS tests (`supabase/tests/`).
5. AI assistant prototype (after approval).
6. Merge `improve/world-class` → `main` + push.

---

**لا تدّعِ إنجاز شيء لم يُتحقق منه.** All claims above are backed by commands run in this session.

## Update 2026-10-27 (post-Phase 8)
- Added legal library (24 PDFs + index).
- Added Knowledge Atlas (scaffold + crawl runner + small crawl 100 links).
- Added atlas.html (search/export).
- Added source-registry (9 sources).
- Added DB schema (design only).
- Added assets/config.js shim (console error fix).
- Added AI assistant placeholder.
- Added creative greeting + legal term of the day.
- Added levels/lessons/support scaffold + integration plan.
- Added directory + resources (links only).
- CI: gitleaks + Lighthouse + axe (non-blocking).
