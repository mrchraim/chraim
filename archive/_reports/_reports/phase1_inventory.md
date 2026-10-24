# Phase 1 — جرد المستودع (Inventory Report)

**المشروع:** CHRAIM Campus — دليل مؤسسات جامعة ابن زهر (أكادير)
**المستودع:** github.com/mrchraim/chraim (branch main)
**الرابط (لا يُغيَّر):** https://chraim.pages.dev
**تاريخ الجرد:** 2026-10-23

---

## 1. بنية المستودع (Architecture)

### 1.1 الاستضافة والنشر
- **Cloudflare Pages**، مشروع `chraim`، دومين `chraim.pages.dev` (أيضاً worker: `chraim.cheraimmohamed20.workers.dev`).
- **مصدر النشر (deploy source):** مجلد `chrvvim.talib.aga.ma/` (مُعرّف في `wrangler.jsonc`).
- **Netlify** مُعدّ también (netlify.toml يشير إلى `chrvvim-campus/web`، لكن هذا المجلد فارغ — نشر Netlify غير فعّال حالياً).
- **لا يوجد `.github/`** → لا CI/CD، لا Dependabot، لا secret scanning (فجوة أمنية).

### 1.2 المجلدات (أعلى مستوى)
| المجلد | الحالة | الملاحظة |
|---|---|---|
| `chrvvim.talib.aga.ma/` | ✅ فعّال | مصدر النشر (170 ملفاً) — يحتوي index.html، portal.html، fsjp-portal.html، assets، documents، etablissements/... |
| `platform/` | ✅ | 13 صفحة (about, account, announcements, browse, contribute, dashboard, index, login, privacy, subject, support) + robots/sitemap |
| `etablissements/` | ✅ | 25 صفحة (24 مؤسسة + index + app.js + style.css) |
| `assets/` | ✅ | fonts, icons, patterns SVG |
| `public/` | ✅ | JSON guides (academic-guide, timetable drafts) |
| `documents/` | ✅ | PDFs مستضافة محلياً (s1/s3/s5 timetables, learn-*) |
| `supabase/` | ✅ | 01_portal_schema.sql, 02_platform_schema.sql, README_AR.md |
| `tools/` | ✅ | audit-links.py, audit-security.py, build-dist.py, deploy-cloudflare.ps1, make-seo.py, scraper.py |
| `management-system/`, `chrvvim-campus/`, `chrvvim-ai-hub/` | ⚠️ فارغة | placeholders — لا محتوى |
| `_dev/`, `_archive/`, `_backups/`, `_deploy_kit/`, `_phase1_audit/`, `_reports/` | ℹ️ | أدوات/نسخ احتياطية/تقارير — مستبعدة من النشر via `.assetsignore` |
| `portal-preview/` | ℹ️ | معاينة محلية (index + etablissements + build) |

### 1.3 الصفحات (الجذر)
- `/` (index.html — 13 KB, variant "دليل مؤسسات ابن زهر")
- `/portal.html` (193 KB — بوابة الطالب الشاملة)
- `/fsjp-portal.html` (974 سطر — بوابة FSJP Agadir (الجديد، مُدمج))
- `/students-guide.html`, `/university-directory.html`, `/academic-offer.html`, `/academic-updates.html`, `/rafiq-altalib.html`
- `/admin.html` (28 KB — لوحة الإدارة)
- `/404.html`, `/offline.html`
- + `app.js` (144 KB), `campus-data.js`, `portal-data.js`, `page-i18n.js`, `gender.js`, `subjects*.js`, `legal*.js`, `institutions-*.js`, `exams.js`, `university-*.js`

### 1.4 المنصّة `/platform/`
13 صفحة: index, about, account, announcements, browse, contribute, dashboard, login, privacy, subject, support + robots/sitemap.

### 1.5 المؤسسات `/etablissements/`
24 صفحة (encg-agadir, encg-dakhla, ensa-agadir, ensiasd-taroudant, esef-agadir, est-dakhla, est-guelmim, est-laayoune, est-ouarzazate, esta-agadir, feg-guelmim, flash-ait-melloul, flsh-agadir, fmp-agadir, fmp-guelmim, fmp-laayoune, fp-smara, fpo-ouarzazate, fpt-taroudant, fsa-agadir, fsa-ait-melloul, fsjes-agadir, fsjes-ait-melloul, chariaa-ait-melloul) + index + app.js + style.css.

---

## 2. التكرار (Duplication) — مُبيّن

| عنصر | التكرار | ملاحظة |
|---|---|---|
| `index.html` (الجذر) vs `chrvvim.talib.aga.ma/index.html` | ❌ مختلفان | الجذر 13 KB، Deploy 183 KB — نسختان divergent. Deploy هو "الحقيقي" (يُخدم على chraim.pages.dev). |
| `_headers` (الجذر) vs `chrvvim.talib.aga.ma/_headers` | ❌ مختلفان | Deploy يحتوي CSP صارمة (inline scripts allowed). الجذر يحتوي headers مختصرة. |
| `_redirects` (الجذر) vs deploy | ⚠️ deploy فقط | الجذر لا يحتوي `_redirects`. |
| `portal.html` | ℹ️ deploy فقط (193 KB) | مُنزَّل من الموقع المباشر (2026-10-23) وحُفظ في deploy. |
| `platform/` vs `/platform/` deploy | — | platform/ (الجذر) likely = deploy platform? à vérifier |
| `_dev/`, `_backups/` | ✅ مستبعدة via `.assetsignore` | تبقى في git (1604 tracked file) — ثقيلة. |

### 2.1 تناقض "المصدر único de verdad"
- لا يوجد "مصدر واحد للحقيقة": index.html (الجذر) ≠ index.html (deploy). التحديثات تُطبَّق على deploy (wrangler) ولا تُزامَن مع الجذر.
- `chrvvim-campus/`, `management-system/`, `chrvvim-ai-hub/` فارغة → "الدمج" لم يُنجز (الـ master prompt يطلب دمج management-system و ms-ops).

---

## 3. المحتوى والبيانات (Content & Data)

- **ملفات بيانات (JSON):** announcements.json (17 KB), documents-index.json (28 KB), institutions-database.json (36 KB), university-formations.json (78 KB), official-academic-updates-2026-2027.json (8 KB), sources-register.json, campus-data.js (102 KB), portal-data.js (57 KB), subjects-data.js, legal-data.js, university-data.js, university-formations.js.
- **مكتبة PDFs:** documents/ (s1/s3/s5 timetables, learn-*) + public/ (academic-guide JSON).
- **البيانات الجامعية:** 24 مؤسسة، 241 مسلكاً، 147,806 طالب (حسب uiz.ac.ma، فُحصت 2026-10-16).
- **التحديث:** "تم تحديث استعمالات الزمن حتى 10 أكتوبر 2026" (banner). صيغة محينة 10-10-2026.
- **لا يوجد script مجدول** (GitHub Action) لفحص المصادر الرسمية — غير منجز (الـ master prompt §3.3).

---

## 4. الأمان (Security) — فحص أولي

### 4.1 الأسرار (Secrets)
- ✅ `supabase-config.js` يستخدم **anon key (publishable)** فقط — صحيح.
- ⚠️ `supabase/` SQL (01/02) يحتوي على project ref `idpafbyefrywjixskvvu` — معرّف بنية تحتية (مقبول في SQL، لكن master prompt §2 يقول "لا تطبعها في صفحات عمومية" — SQL ليس صفحة عمومية، OK).
- ⚠️ تاريخ git: 3 commits (initial + 2). need scan for leaked secrets (git log --all --full-history). أوصي بتشغيل `gitleaks` / `trufflehog`.
- ⚠️ `_deploy_kit/` يحتوي scripts تقرأ tokens من ملفات (`gh_token.txt`, `CLOUDFLARE_API_TOKEN`) — OK (لا hardcode).

### 4.2 RLS / Supabase
- جداول: `admins`, `announcements`, `exam_files` (per SQL comment).
- RLS: cần verify (02_platform_schema.sql). master prompt §4.3 يطلب SECURITY DEFINER لجدول admins + Security Advisor.
- Storage buckets: needs audit (signed URLs mentioned in git log: "correct signed-URL prefix (/storage/v1)").

### 4.3 Headers (_headers deploy)
- ✅ CSP صارمة (default-src 'self', script-src 'self' 'unsafe-inline' cdn.jsdelivr, frame-ancestors 'none', object-src 'none', base-uri 'self', form-action 'self').
- ✅ HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (camera/mic/geo/payment/usb), COOP, CORP, X-Permitted-Cross-Domain-Policies, X-DNS-Prefetch-Control.
- ✅ /admin.html + /admin* → noindex, nofollow, no-store.
- ⚠️ `'unsafe-inline'` في script-src/style-src — master prompt §4.5 wants "بدون inline scripts قدر الإمكان". حالياً many inline scripts. cần refactor (big effort).
- ⚠️ CSP لا تشمل `media-src`, `worker-src` (sw.js). قد تحتاج.

### 4.4 الإدارة /admin
- `/admin.html` (28 KB) + `/admin` redirect. Supabase Auth + جدول admins.
- **Cloudflare Access** (طبقة ثانية) — needs verification (cf_service_token.json existed in temp, مؤشر على Access gate).
- MFA — needs verification.
- Rate limiting / brute-force — needs verification.
- لا روابط للإدارة في الصفحات العمومية — needs audit (master prompt §4.4).

### 4.5 التحقق من المدخلات
- `platform/contribute.html`, `support.html` — نماذج. تعقيم/تحقق — needs audit.
- `platform/browse.html` search — client-side. XSS risk if rendering user input via innerHTML (found in fsjp-portal: fixed).

### 4.6 الخصوصية
- `platform/privacy.html` exists. needs review/update.

---

## 5. التصميم (Design)

- **RTL** كامل (dir="rtl" lang="ar").
- **الوضع فاتح/داكن** (data-theme, prefers-color-scheme).
- **الخطوط:** IBM Plex Sans Arabic (مستضافة locally) + Inter + Alexandria/Cairo (CDN Google) في fsjp-portal. master prompt wants Cairo/Tajawal محلياً — حالياً Google Fonts CDN (مختلط).
- **الأيقونات:** Font Awesome CDN (fsjp-portal) + inline SVG. master prompt wants استضافة محلياً.
- **اللغات:** AR + FR (و EN إن أمكن). page-i18n.js (82 KB) يدير الترجمة. manifest.json (PWA) lang=ar.
- **الوصولية (a11y):** needs audit (WCAG 2.2 AA). `_headers` has focus-visible outline. needs deeper check.
- **Mobile-first:** responsive (media queries). needs Lighthouse.

---

## 6. الفجوات (Gaps) مقابل Master Prompt

| # | المطلوب (Master Prompt) | الحالة |
|---|---|---|
| 1 | دمج management-system-16j.pages.dev تحت /platform/ | ❌ غير منجز (management-system/ فارغ) |
| 2 | دمج لوحة ms-ops-7f3a9c.pages.dev تحت /admin | ❌ غير منجز |
| 3 | 301 redirects للدومينات القديمة via _redirects | ❌ غير منجز (فقط 2 redirect داخلي) |
| 4 | بنية موحّدة (header/footer/nav/theme، CSS واحد بـ tokens) | ⚠️ جزئي (etablissements/style.css مشترك، لكن صفحات متفرقة) |
| 5 | روابط نظيفة بدون .html + canonical + sitemap/robots موحّدان | ⚠️ جزئي (sitemap.xml + robots.txt موجودان؛ canonicals added in commit 2b9a92c) |
| 6 | بحث داخلي client-side (مؤسسات + مسالك + إعلانات + مواد) | ⚠️ جزئي (بحث في fsjp-portal only) |
| 7 | Lighthouse ≥ 90 | ❓ needs measure |
| 8 | PWA (offline للصفحات الثابتة) | ⚠️ manifest.json exists، sw.js exists (170 cached? needs check) |
| 9 | محتوى جامعي محدّث (Offre de formation، ماستر، شروط ولوج، آجال تسجيل، نتائج انتقاء، تقويم، دلائل) | ⚠️ جزئي (documents/ + academic-offer.html) |
| 10 | كل وثيقة: source, published_date, verified_on, version | ❌ غير منجز (عدم توحيد) |
| 11 | ملف بيانات موحّد /data/*.json | ⚠️ جزئي (public/*.json) |
| 12 | Script مجدول (GitHub Action أسبوعي) يفحص المصادر ويفتح PR | ❌ غير منجز (لا .github/) |
| 13 | Security Advisor Supabase + RLS audit | ❓ needs run |
| 14 | Cloudflare Access / MFA / rate limit على /admin | ❓ needs verify |
| 15 | Headers CSP بدون unsafe-inline | ❌ غير منجز |
| 16 | خطوط/أيقونات مستضافة محلياً (Cairo/Tajawal) | ⚠️ جزئي (IBM Plex local، Alexandria/Cairo via Google CDN) |
| 17 | git history scan for leaked secrets | ❓ needs run |
| 18 | Dependabot + secret scanning + lint في CI | ❌ غير منجز |

---

## 7. Commits (آخر 10)
1. `e92c659` feat(portal): add FSJP Agadir student portal (fixed XSS + section filtering); preserve live portal.html
2. `f48b67f` feat(university): embed official portal data (leadership, address, phone, programs, resources) inside the site + UIZ stats strip
3. `4d3df06` fix(exams): gendered strings + correct signed-URL prefix (/storage/v1); bump script versions
4. `d67434b` chore: initial commit of CHRAIM project
5. `7d224e5` Refactor index.html for improved structure and content
6. `2b9a92c` Comprehensive maintenance: fix canonicals, add OG/JSON-LD, complete sitemap, unify branding to CHRAIM
7. `4536b81` seo: add google site verification placeholder + robots/sitemap verified
8. `764a212` docs: mark deployment live (Cloudflare Pages + Supabase)
9. `68c6e49` fix: /admin redirect loop, SEO clean URLs, schema verified against live Supabase
10. `bd1563f` docs: free-tier summary, python build fallback, platform schema steps in deploy guide

---

## 8. Branches
- `main` (origin/main) — HEAD = e92c659
- `security/hardening-2026-10-21` (origin) — hardening branch
- (no local branch — detached HEAD during work)

---

## 9. توصيات (التالي — Phase 2+)

1. **تثبيت Git على main** (تم: push e92c659).
2. **نشر Cloudflare Pages عبر wrangler** (تم: deployment 34078301.chraim.pages.dev — needs verify serve).
3. **Phase 2 — خطة مرحلية** (أنتظر موافقتك):
   - 2a: جرد أمني (gitleaks, RLS, headers, admin access) + تقرير.
   - 2b: خطة الدمج (management-system, ms-ops) + redirects.
   - 2c: خطة المحتوى الجامعي (quelles docs, sources, schedule).
   - 2d: خطة التصميم (tokens, fonts local, a11y).
4. **لا تغييرات مدمّرة** بدون موافقتك (حذف جداول، تغيير RLS، حذف مشاريع).

---

## 10. ما لم يُتحقق (Unknowns)
- Cloudflare Access / MFA / rate-limit على /admin (needs live test).
- Supabase Security Advisor findings (needs run).
- Lighthouse scores (needs run).
- git history secrets (needs gitleaks/trufflehog).
- CSP effectiveness (needs browser test).
- obsolescence of old deployment 6948d8da vs new 34078301 (needs verify serve).

---

**STOP — Phase 1 complete. Awaiting your approval for Phase 2.**
