# Admin Console (private)

لوحة الإدارة ديال Management System — **مشروع منفصل ومحمي**.

> ⚠️ هذا المجلد **ما كيتنشرش** مع الموقع العمومي.
> الموقع العمومي كينشر من `public/` فقط.

---

## 1) النشر

كينشر أوتوماتيكيًا عبر `.github/workflows/deploy-admin.yml` لمشروع
Cloudflare Pages مستقل: **`ms-ops-7f3a9c`**.

النطاق كيكون شيء بحال: `ms-ops-7f3a9c.pages.dev` (غير قابل للتخمين).

---

## 2) الحماية الإلزامية — Cloudflare Access

> ✅ **مفعّلة ومرفوعة.** اللوحة ما كتحلّش بلا تسجيل دخول.

| العنصر | القيمة |
|---|---|
| حساب Zero Trust | `lingering-tree-508e.cloudflareaccess.com` |
| بوابة الدخول | `https://lingering-tree-508e.cloudflareaccess.com` |
| IdP | One-time PIN |
| Session | 24 ساعة |
| Apps | `ms-ops-7f3a9c.pages.dev` + `*.ms-ops-7f3a9c.pages.dev` |
| Policy | "Owner only" → `include: email = cheraimmohamed20@gmail.com` |

الـ wildcard ضروري باش يغطي حتى نشرات الـ preview
(`https://<hash>.ms-ops-7f3a9c.pages.dev`).

للتحقق:

```bash
python _tools/audit_admin.py
# كل أصول اللوحة (13) خاصهم يرجعو 302 -> Access login  =  gated
```

> 🔒 **مهم:** بعد تفعيل Access، كل الطلبات كتبوح لـ 302 نحو صفحة الدخول ديال
> Access. الـ smoke test ديال الـ workflow كيقبل هاد الحالة (2xx/3xx/401/403)
> وخايع كيعتبر غير الـ 404 الحقيقية فشل.

---

## 3) ترويسات الأمان المطبَّقة

| الترويسة | القيمة |
|---|---|
| `Content-Security-Policy` | بلا `'unsafe-inline'` للسكريبت · بلا `img-src https:` · connect محدّد |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Embedder-Policy` | `require-corp` |
| `Referrer-Policy` | `no-referrer` |
| `Permissions-Policy` | 18 ميزة ممنوعة |
| `X-Robots-Tag` | `noindex, nofollow, noarchive, nosnippet, noimageindex` |
| `Cache-Control` | `no-store` (للأصول كاملين) |

> الترويسات ديال `_headers` **ما كتطبّقش** على الردود اللي كيمرّو من Pages
> Function. ولهذا `admin-console/functions/_middleware.js` كيعاود يطبّقهم.

---

## 4) ملاحظات أمنية

- **لا توكنز فـ الكود.** الدخول = Supabase Auth (بريد + كلمة مرور) + RLS.
- `js/config.js` فيه غير المفتاح **العمومي** (`sb_publishable_...`) — آمن للنشر.
- **ممنوع** تحط `service_role` هنا نهائيًا.
- **صلاحيات اللوحة كتها RLS** فـ Supabase، ماشي الكود ديال الواجهة:
  `profiles.role_id → roles.name` (`admin` / `editor` / `viewer`).
  - `admin` = كلشي (المحتوى، الإعدادات، الملفات، الموظفون، سجل التدقيق).
  - `editor` = المحتوى (الامتحانات، الإعلانات، الأسئلة، الملفات).
  - `viewer` = القراءة فقط.
  - الحساب الجديد كيتولّد تلقائيًا برتبة `viewer` — **ما كيتولّدش `admin`**
    (الموقع العمومي كيسمح للجميع باش يسجل). الترقية للـ `admin` يدوية:
    ```sql
    UPDATE public.profiles
       SET role_id = (SELECT id FROM public.roles WHERE lower(name) = 'admin')
     WHERE email = '<بريدك>';
    ```
  - الملف الكامل ديال السياسات: `supabase/migrations/20261021_harden_rls_policies.sql`
    والتفاصيل فـ `SECURITY.md`.
- السكريبتات كلها **خارجية** (0 inline) باش CSP يبقى صارم.
- `_redirects` فيه ترقية HTTPS فقط. Cloudflare Pages **ما كيقراش** رموز
  غير 3xx فـ `_redirects` (404/410 كيتجاهلهم بصمت)، فالحماية الحقيقية
  ديال اللوحة هي **Cloudflare Access**، ماشي هاد الملف.
- **`functions/_middleware.js` خاص باللوحة** (ماشي ديال الموقع العام):
  `wrangler pages deploy` كيدور على مجلد `functions/` ديال جذر المشروع
  (جذر الريبو)، فكان كيحمل معاه الـ middleware ديال الموقع العام — وهداك
  كيحجب أصول اللوحة نفسها (`/js/app.js`, `/css/style.css`, `/login.html` …)
  وكيرجّع 404 ديال الموقع العام. الحل: كل مشروع عندو middleware خاص بيه،
  والـ middleware ديال الموقع العام بقا مربوط بالمضيف.
- كل ملف فيه **build marker** (`<!-- build: 2026-10-21.1 -->`). هادشي مقصود:
  Cloudflare Pages كيخزن الأصول فمخزن عام مفتاحو (المسار + hash المحتوى).
  إلا تجلّب مسار واحد بـ hash قديم (مثلاً من رفع يدوي)،URL ديالو كيبقى
  كيرجع **404** حتى بعد إعادة النشر، حيت Pages كيعتبر الملف "مرفوع مسبقًا"
  وكيطبلّفو. تغيير الـ marker كيبدّل الـ hash وكيصلح المسار.
  (السكريبت: `_tools/add_build_marker.py`.)

---

## 5) بعد كل نشر: تأكّد

الـ workflow فيه خطوة **smoke test** كتفحص كل المسارات وتوقف الـ workflow
إلا واحد رجع 404. إلا تظهر هاد المشكلة:

```bash
npx wrangler pages deploy admin-console --project-name=ms-ops-7f3a9c --branch main --commit-dirty=true
```

وإلا استعمل الدالة `add_build_marker.py` باش تبدّل الـ hashes.

الفحص المحلي:

```bash
python _tools/audit_admin.py     # كل الأصول + كل الترويسات
```

---

## 6) مجلد الإدارة

```
admin-console/
├── index.html           لوحة التحكم (كان dashboard.html)
├── login.html           تسجيل الدخول
├── 404.html             صفحة غير موجودة
├── robots.txt           Disallow: /
├── _headers             ترويسات أمان صارمة
├── _redirects           ترقية HTTPS فقط
├── functions/
│   └── _middleware.js   middleware خاص باللوحة (ترويسات فقط، بلا حجب)
├── css/style.css
└── js/
    ├── app.js            منطق اللوحة (بلا inline)
    ├── auth.js           Supabase Auth
    ├── config.js         إعداد Supabase (مفتاح عمومي فقط)
    ├── i18n.js           ترجمة اللوحة
    ├── dashboard-inline.js   (كان inline فـ index.html)
    └── login-inline.js       (كان inline فـ login.html)
```
<!-- build: 2026-10-21.1 -->
