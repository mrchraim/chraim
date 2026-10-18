# CHRAIM — منصة الطالب الموحّدة

مشروع واحد يجمع كل مشاريع **CHRVVIM Campus** في مكان واحد: دليل مؤسسات، بوابة طلبة كلية الحقوق، منصة امتحانات متعددة الجامعات، وأدوات الطالب — **بدون حذف أي محتوى قديم**.

🔗 الموقع الموحّد يعمل من جذر المستودع مباشرة. **الصفحة الرئيسية (`/`) هي دليل مؤسسات
جامعة ابن زهر**، وبوابة الطالب الكاملة (18 تبويباً) على `/portal.html`.

---

## 🗂️ هيكل المستودع

```
chraim/
├── index.html ……………… 🏠 الصفحة الرئيسية = دليل مؤسسات جامعة ابن زهر + أقسام المنصة
├── portal.html ……………… بوابة الطالب الكاملة (18 تبويباً: جداول، وثائق، معدّل…)
├── rafiq-altalib.html ……… رفيق الطالب (جدول، معدّل، مواعيد)
├── university-directory.html  دليل جامعة ابن زهر
├── academic-offer.html ………… دليل التكوينات (382 تكوين)
├── academic-updates.html ……… المستجدات الجامعية
│
├── etablissements/ …………… 🆕 دليل المؤسسات التفصيلي (24 مؤسسة)
│   ├── index.html ……………… فهرس قابل للبحث والتصفية
│   ├── flsh-agadir.html ……… صفحة لكل مؤسسة (مسؤولون، اتصال، تكوينات)
│   ├── style.css · app.js …… تصميم موحّد مطابق للموقع الرئيسي
│   └── build/generate.py …… مولّد الصفحات (إعادة توليدها: python etablissements/build/generate.py)
│
├── platform/ ………………… 🆕 منصة الطلبة (امتحانات وفروض وملخصات)
│   ├── index · browse · subject · contribute · announcements · account …
│   ├── login.html · dashboard.html … لوحة تحكّم الإدارة
│   └── js/ · css/ ……………… تكامل Supabase (متعدد الجامعات)
│
├── archive/ ……………………… 📦 كل المشاريع الأصلية كما هي (للحفظ)
│   ├── chrvvim.talib.aga.ma/ · chrvvim-ai-hub/ · chrvvim-campus/
│   ├── management-system/ · portal-preview/
│   ├── _deploy_kit/ · _integration_preview/ · _archive/
│   ├── chrvvim-campus-history.bundle … تاريخ git كامل (لأنه بلا remote)
│   └── PROVENANCE.md ……… أصل ومستودع كل مشروع مؤرشف
│
├── vendor/OpenMausBot/ ……… 🧰 تطبيق خارجي (مِلكية Milind Soni — AI agents)
│
├── docs/ …………………………… التوثيق + `ci/deploy-cloudflare-pages.yml`
├── supabase/ …………………… مخطط قاعدة البيانات + سياسات RLS (`01_portal_schema.sql`)
├── tools/ …………………………… أدوات: audit-links · audit-security · add-back-home · make-seo · build-dist
├── _headers · _redirects …… رؤوس الأمان وإعادة التوجيه
├── robots.txt · sitemap.xml  الفهرسة (تُولَّد بـ `tools/make-seo.py`)
├── 404.html ………………………… صفحة خطأ عربية
└── DEPLOY_AR.md ……………… دليل النشر (GitHub · Cloudflare · Supabase · Google)
```

> `archive/` و`vendor/` و`_dev/` و`tools/` و`supabase/` والوثائق والسكربتات **لا تُنشر علناً** —
> يُستثنيها `tools/build-dist.py` و`.assetsignore`.

---

## 🔗 أقسام الموقع الموحّد

| القسم | الرابط | المصدر |
|-------|--------|--------|
| **دليل المؤسسات (الصفحة الرئيسية 🏠)** | `/` | 🆕 من `portal-preview` |
| بوابة الطالب الكاملة | `/portal.html` | الموقع الرئيسي |
| رفيق الطالب | `/rafiq-altalib.html` | الموقع الرئيسي |
| دليل التكوينات | `/academic-offer.html` | الموقع الرئيسي |
| المستجدات الجامعية | `/academic-updates.html` | الموقع الرئيسي |
| **دليل المؤسسات التفصيلي** | `/etablissements/` | 🆕 من `portal-preview` |
| **منصة الامتحانات** | `/platform/` | 🆕 من `management-system` |

كل أقسامها مربوطة بتنقّل موحّد داخل الموقع. الصفحة الرئيسية تفتح مباشرة على دليل المؤسسات،
وتضمّ بطاقات لكل الأقسام + فهرساً قابلاً للبحث والتصفية (24 مؤسسة).

---

## 🚀 التشغيل محلياً

الموقع ثابت بالكامل (لا build). شغّل أي خادم ملفات من جذر المستودع:

```bash
python -m http.server 8000
# ثم افتح http://127.0.0.1:8000/
```

القسمان الجديدان (`etablissements/` و `platform/`) يعملان مباشرة بلا أي خطوة بناء.

---

## ✨ تحسينات الواجهة المدمجة (بديل حقن البروكسي)

كانت التحسينات البصرية تُحقن سابقاً وقت التشغيل عبر بروكسي `portal.py` (CSS + JS عام
يشمّ DOM + MutationObserver + `!important`). **أُعيدت صياغتها الآن كمكوّن دائم داخل كود الموقع**
في `portal.html` (بوابة الطالب) — بلا حاجة لأي بروكسي، وبتوجيه مباشر للعناصر الحقيقية:

| التحسين | التنفيذ المدمج |
|---------|----------------|
| 1) شريط الأخبار بعرض الشاشة | `.ticker` — خط أوضح وارتفاع أكبر |
| 2) إحصائيات كبيرة متوهجة | `.hero .stats .stat b` — 3rem، وزن 900، توهّج ذهبي |
| 3) زر «ابدئي من هنا» | `.cta-main` — تدرّج ألوان متحرك + نبض |
| 4) قائمة تنقّل متحركة | `.chraim-marquee` + سكربت صغير يحمي `#abnav` |

الكتلة في `<style id="chraim-enhance">` والسكربت في `<script id="chraim-marquee">`.

---

## 🧩 إعادة توليد صفحات المؤسسات
تُولَّد صفحات `etablissements/` من ملف البيانات الموحّد:

```bash
python etablissements/build/generate.py
```

المصدر: `archive/portal-preview/build/data.json` (24 مؤسسة، مُتحقَّق منها بتاريخ 2026-10-16).

---

## 🔎 فحص الروابط

أداة قابلة لإعادة الاستعمال تتحقّق من كل الروابط الداخلية (وسوم HTML
`href`/`src` ومراجع CSS `url(...)`) عبر الموقع كله — بمعزل عن `archive/` و`vendor/`:

```bash
python tools/audit-links.py
```

تُعيد رمز الخروج `1` عند أي رابط مكسور (مناسبة لـ CI). آخر تشغيل: **568 رابطاً، 0 مكسور**.

---

## 🔙 رمز العودة العائم

يُضاف زرّان عائمان («⌂ الرئيسية» و«↩ رجوع») إلى **كل صفحات الموقع** عبر سكربت واحد
`assets/back-home.js` يحقن نفسه (نمط + شريط) بلا أي تعديل في بنية الصفحات. الموضع **وسط
أسفل الشاشة** (الزوايا السفلية محجوزة للفقاعة الاجتماعية وزر «+»).

- «⌂ الرئيسية» → يفتح `/` دائماً، ويكون مميّزاً (`is-current`) في الصفحة الرئيسية نفسها.
- «↩ رجوع» → `history.back()`، وإن لم يوجد تاريخ تنقّل → `/`.

لأي صفحة جديدة تُضاف لاحقاً، شغّل:

```bash
python tools/add-back-home.py
```

---

## ☁️ النشر

الدليل الكامل خطوة بخطوة: [`DEPLOY_AR.md`](DEPLOY_AR.md). باختصار:

```bash
python tools/build-dist.py --out dist --clean   # مجلّد نشر نظيف (بدون archive/vendor/_dev)
wrangler pages deploy dist --project-name=chraim
```

- **GitHub**: `mrchraim/chraim` (خاص — private)، الـpush كيخدم عادي.
- **Cloudflare Pages**: مجلّد الإخراج = `dist` (كيقرا `_headers` + `_redirects` تلقائياً).
- **CI**: `docs/ci/deploy-cloudflare-pages.yml` (انسخو لـ`.github/workflows/`) كينشر أوتوماتيكياً عند كل push لـ`main`
  (خاص `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` كـSecrets).
- **Supabase**: شغّل `supabase/01_portal_schema.sql` (جداول + RLS + حاوية `edu-files` خاصة).
- **Google Search Console**: قدّم `sitemap.xml` (يتولّد بـ `tools/make-seo.py --base https://…`).
- **`platform/`**: كيستعمل مشروع Supabase الخاص به (المفتاح العام في `platform/js/config.js`).

---

## 🔐 الأمان

- **بلا أسرار في الكود**: المفاتيح الموجودة `publishable/anon` عامة بطبيعتها؛ الأمان الحقيقي
  هو **Supabase Auth + RLS** (انظر `supabase/01_portal_schema.sql`). عمّر ما تدخل `service_role`.
- **رؤوس أمان** (`_headers`): `Content-Security-Policy`، `HSTS`، `X-Frame-Options: DENY`،
  `nosniff`، `Referrer-Policy`، `COOP`، `CORP`، `Permissions-Policy`، `X-Permitted-Cross-Domain-Policies`.
- **لا تسريب ملفات داخلية**: `tools/build-dist.py` + `.assetsignore` كيستثنيو
  `archive/`, `vendor/`, `_dev/`, `tools/`, `supabase/`، الوثائق والسكربتات، و`BUILD_MANIFEST.sha256`
  من النشر العام — مع الحفاظ عليها كاملة في Git.
- **`/admin.html`** محمي بـAuth + RLS + `noindex` (وممنوع فـ`robots.txt` + رأس `X-Robots-Tag`).
- **`documents/`** (PDF ديال الطلبة) متاح للتحميل ولكن **ماشي مفهرس** (`robots.txt`).
- **بلا روابط خطيرة**: لا iframes؛ لا `document.write`؛ لا `eval`؛ لا `fetch` خارجي؛
  كل روابط `target="_blank"` فيها `rel="noopener noreferrer"`.

---

## 📌 ملاحظات

- **لا حذف**: كل النسخ القديمة محفوظة كاملة في `archive/`.
- **OpenMausBot** في `vendor/` هو تطبيق خارجي (مِلكية Milind Soni) مُضاف كما هو للحفاظ عليه — ليس جزءاً من كود CHRAIM.
- المعطيات مجمّعة من المصادر الرسمية لجامعة ابن زهر (`uiz.ac.ma`) — منصة مستقلة غير رسمية.
