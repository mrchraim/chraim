# دليل النشر — CHRAIM / CHRVVIM Campus

هاد الدليل كيشرح كيفاش تنشر الموقع الموحّد على **GitHub** و**Cloudflare Pages**
و**Supabase** و**Google Search Console**، مع الأمان.

> ✅ المستودع `mrchraim/chraim` **خاص (private)** من قبل، والعمل كامل مدفوع (push).

---

## 0) قبل ما تبدا — الملفات الجاهزة

| الملف | الدور |
|---|---|
| `_headers` | رؤوس أمان (CSP, HSTS, X-Frame-Options...) + كاش |
| `_redirects` | إعادة توجيه مسارات قديمة |
| `robots.txt` + `sitemap.xml` | الفهرسة (Google) — كيتولّدو بـ`tools/make-seo.py` |
| `404.html` | صفحة خطأ عربية |
| `.assetsignore` | استثناء الملفات الداخلية من نشر Cloudflare Pages |
| `tools/build-dist.py` | كيبني `dist/` نظيف (بدون `archive/`, `vendor/`, `_dev/`, سكربتات) |
| `.github/workflows/deploy-cloudflare-pages.yml` | نشر تلقائي عند كل push |
| `supabase/01_portal_schema.sql` | جداول + RLS + Storage ديال البوابة |

⚠️ **مهم:** ما تنشرش المستودع كامل مباشرة — فيه `archive/` و`vendor/` و`_dev/`
وسكربتات. استعمل `dist/` (`python tools/build-dist.py`).

---

## 1) GitHub

✅ مكمّل. للتأكد:

```bash
git remote -v          # https://github.com/mrchraim/chraim.git
git push origin main
```

المستودع خاص، إذن **GitHub Pages ما كايناش** (خاصة = ما كتخدمش مجاناً).
الحل: Cloudflare Pages (التالي) — كيخدم من مستودع خاص بلا مشكل.

---

## 2) Cloudflare Pages (الاستضافة المقترحة)

كيخدم مع مستودع خاص، وكيقرا `_headers` و`_redirects` تلقائياً.

### الطريقة أ — من اللوحة (بلا سطر أوامر)

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages**
2. **Connect to Git** → اختار `mrchraim/chraim`
3. الإعدادات:
   - **Framework preset**: `None`
   - **Build command**: `python tools/build-dist.py --out dist --clean`
   - **Build output directory**: `dist`
4. **Save and Deploy**
5. زيد الدومين: **Custom domains** → `your-domain.ma`

### الطريقة ب — من الطرفية (wrangler)

> **مستحسن (Windows)**: سكريبت جاهز كيدير كلشي بوحدو — بناء `dist` على نظيف،
> فحص الروابط، ثم النشر (كيستعمل `npx wrangler`، ما محتاجش installation global):
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File tools\deploy-cloudflare.ps1
> ```
>
> أول مرة غير، سجّل الدخول:
> ```powershell
> npx.cmd --yes wrangler@latest login
> ```

أو يدوياً:

```bash
npm i -g wrangler
wrangler login
python tools/build-dist.py --out dist --clean
wrangler pages project create chraim
wrangler pages deploy dist --project-name=chraim
```

### الطريقة ج — GitHub Actions (تلقائي)

الملف موجود ديجا فالمستودع: `.github/workflows/deploy-cloudflare-pages.yml`.
فكل `git push origin main` كيبني `dist`، كيدير فحص الروابط، ثم كينشر — كامل مجاناً.

زيد **Secrets** فالمستودع (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — من Cloudflare → My Profile → API Tokens → *Edit Cloudflare Workers* (وفيه صلاحية Pages)
- `CLOUDFLARE_ACCOUNT_ID` — من Cloudflare → Workers & Pages → Overview (Account ID)

من بعد، كل `git push origin main` كينشر أوتوماتيكياً.

### بعد ما تنشر

```bash
# بدّل الدومين فـ robots.txt و sitemap.xml
python tools/make-seo.py --base https://your-domain.example
git add robots.txt sitemap.xml && git commit -m "seo: update base domain" && git push
```

---

## 3) Supabase

التفاصيل الكاملة فـ [`supabase/README_AR.md`](supabase/README_AR.md). باختصار:

1. Supabase → المشروع `idpafbyefrywjixskvvu` → **SQL Editor**
2. الصق `supabase/01_portal_schema.sql` → **Run**
3. **Authentication → Users → Add user** (بريد المسؤول)
4. غيث شغّل:

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'YOUR_EMAIL@example.com'
on conflict (user_id) do nothing;
```

النتيجة: `/admin.html` كيخدم بـAuth + RLS، وأرشيف الامتحانات بحاوية `edu-files` خاصة.

---

## 4) Google Search Console

1. <https://search.google.com/search-console> → **Add property**
2. اختار **URL prefix** وحط الدومين بعد النشر (مثلاً `https://your-domain.example/`)
3. تحقّق:
   - **HTML tag**: زيد `<meta name="google-site-verification" content="...">` فـ`<head>` ديال `index.html`، ولا
   - **DNS**: زيد سجل TXT فـCloudflare DNS (أسهل بزاف وكيدوم)
4. من بعد التحقّق → **Sitemaps** → زيد `sitemap.xml` → **Submit**
5. استعمل **URL Inspection** → `Request indexing` للصفحات الأساسية (`/`, `/portal.html`, `/etablissements/`)

`robots.txt` كيمنع فهرسة `/admin.html`, `/archive/`, `/vendor/`, `/documents/` — هادشي مقصود
(ملفات PDF ديال الطلبة كتبقى متاحة للتحميل ولكن ماشي مفهرسة).

---

## 5) شنو خاصني منك (credentials)

هاد الحوايج ما نقدرش نديرهم بوحدي — خاصني وحدة من هادو:

| الهدف | المطلوب |
|---|---|
| نشر Cloudflare من الطرفية | `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (ولا ربط المستودع من اللوحة) |
| GitHub Actions | نفس الـsecrets فوق (كتزاد فإعدادات المستودع، ماشي فالكود) |
| Supabase | تنفيذ `01_portal_schema.sql` من حسابك (ولا `SUPABASE_ACCESS_TOKEN` + `supabase link`) |
| Google Search Console | حساب Google ديالك + ملكية الدومين |

> 🔐 **عمّر ما تصيفط ليا `service_role` ولا `SUPABASE_ACCESS_TOKEN` فالرسائل.** إلا بغيتي ننشر
> من GitHub Actions، زيدهم غير كـ**Repository Secrets**.
