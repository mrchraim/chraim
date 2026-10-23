# Security Policy

## الإبلاغ عن ثغرة

إلا لقيت ثغرة أمنية، **ما تفتحش issue عمومي**. تواصل مباشرة:

- **Email:** mrchraim@users.noreply.github.com
- إلا كان متاح: GitHub **Private vulnerability reporting**

كنجاوبو فـ أقرب وقت، ونعطيوك تقدير بعد الإصلاح إلا بغيت.

---

## النطاق

| الأصل | ملاحظات |
|---|---|
| `management-system-16j.pages.dev` | الموقع العمومي |
| `ms-ops-7f3a9c.pages.dev` | لوحة الإدارة (محمية بـ Cloudflare Access) |

---

## المبادئ المتبعة

1. **لا أسرار فـ الكود.** المفتاح الوحيد المنشور هو **المفتاح العمومي** لـ Supabase
   (`sb_publishable_...`) — وهذا مصمَّم يكون عموميًا. الأمان الحقيقي = Supabase Auth + RLS.
2. **لوحة الإدارة معزولة:** مشروع Cloudflare Pages مستقل + Cloudflare Access + MFA.
   الموقع العمومي ما فيهش أي كود ولا رابط ولا مسار للوحة.
3. **CSP صارم:** بلا `'unsafe-inline'` للسكريبت، بلا `img-src https:`، و`connect-src` محدّد.
4. **ترويسات أمان:** HSTS preload، COOP/CORP/COEP، nosniff، Permissions-Policy واسعة.
5. **رفض افتراضي:** مسارات حساسة / إدارة / فحص → 404.
   - على الموقع العمومي: `public/functions/`… لا — الحجب الحقيقي هو
     `functions/_middleware.js` (Pages Function) حيت `_redirects` **ما كيقراش**
     رموز غير 3xx (404/410 كيتجاهلهم بصمت).
   - على لوحة الإدارة: Cloudflare Access هو البوابة.
6. **RLS على كل الجداول** مع سياسات منفصلة لكل عملية (SELECT/INSERT/UPDATE/DELETE).
7. **سجل تدقيق append-only** (UPDATE/DELETE ممنوعين بـ trigger).

---

## فخاخ Cloudflare Pages (مهمة قبل أي نشر)

| الفخ | النتيجة | الحل |
|---|---|---|
| `_redirects` برمز غير 3xx | القاعدة **ما كتنفّذش** بصمت | استعمل Pages Function (middleware) للـ 404 |
| `functions/` داخل مجلد الأصول | **ما كتشتغلش** أبدًا | حطها في **جذر المشروع** |
| `functions/` ديال الموقع العام كيتحمل مع نشر اللوحة | الـ middleware العام كيحجب أصول اللوحة نفسها | كل مشروع عندو `functions/_middleware.js` خاص بيه، والحجب مربوط بالمضيف |
| hash قديم مرتبط بمسار | الرابط كيرجع **404** حتى بعد إعادة النشر | بدّل الـ hash (build marker) أو أنشئ مشروع جديد |
| `.assetsignore` داخل المجلد المنشور | Pages **كيتخطى المجلد كامل** | حيّدها من مجلد النشر |
| كتابة inline scripts | CSP لازم `'unsafe-inline'` | خارجها لملفات `js/*-inline.js` |
| `Cache-Control` فـ catch-all + قاعدة خاصة | Cloudflare **كيجمع** القيمتين (`no-store, max-age=0, public, max-age=3600`) | حط `Cache-Control` غير فـ القواعد المتخصصة |

التفاصيل الكاملة: `admin-console/README.md`.

---

## ملاحظة مهمة: نفس الـ middleware فـ مشروعين

`wrangler pages deploy` كيدور على مجلد `functions/` ديال **جذر المشروع** (جذر الريبو).
حيت جذر الريبو فيه `functions/_middleware.js` ديال الموقع العام، **نشر اللوحة كان
كيحمل معاه** الـ middleware ديال الموقع العام — وهداك كيحجب
`/js/app.js`, `/js/auth.js`, `/js/i18n.js`, `/css/style.css`, `/login.html` …
(board = 404 ديال الموقع العام).

الحل المعتمد:

1. `functions/_middleware.js` (الموقع العام) بقا **مربوط بالمضيف**: الحجب كيتنفّذ
   غير على الموقع العمومي (`SITE_ROLE` متغير المشروع، وإلا قائمة المضيفين).
2. `admin-console/functions/_middleware.js` (اللوحة): كيطبّق ترويسات أمان اللوحة
   وما كيحجب والو — البوابة الحقيقية هي **Cloudflare Access**.

> ⚠️ إلا زدت دومين مخصص للموقع العمومي، حدّث `PUBLIC_HOSTS` فـ
> `functions/_middleware.js`، أو ضبط متغير المشروع `SITE_ROLE=public`.

---

## Cloudflare Access (البوابة ديال اللوحة)

| العنصر | القيمة |
|---|---|
| حساب Zero Trust | `lingering-tree-508e.cloudflareaccess.com` (اسمه "Cheraim Management") |
| بوابة الدخول | `https://lingering-tree-508e.cloudflareaccess.com` |
| طريقة الدخول | One-time PIN (بريد + كود لمرة وحدة) |
| Session | 24 ساعة |
| App 1 | `ms-ops-7f3a9c.pages.dev` |
| App 2 | `*.ms-ops-7f3a9c.pages.dev` (wildcard — كيغطي الـ preview) |
| Policy | "Owner only" → `include: email = cheraimmohamed20@gmail.com` |
| unmatched | `deny_unmatched_requests = false` (ال-Allow ديال الـ policy كافي) |

كل طلب على اللوحة كيرجع **302** نحو `lingering-tree-508e.cloudflareaccess.com`
مع `Www-Authenticate: Cloudflare-Access`. الموقع العمومي
(`management-system-16j.pages.dev`) **ما كيتأثرش** — كيرجع 200 عادي.

> للتحقق: `python _tools/audit_admin.py` → كيأكد أن 13 أصول كلهم محجوبين.

---

## خطوات مطلوبة من مالك الحساب

| # | الخطوة | الحالة |
|---|---|---|
| 1 | نشر اللوحة فـ مشروع Pages مستقل | ✅ تم |
| 2 | GitHub secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) | ✅ تم والتحقق منه |
| 3 | **Cloudflare Zero Trust + Access** للوحة (owner only + wildcard) | ✅ تم والتحقق منه |
| 4 | حذف الـ preview deployments ديال اللوحة | ✅ تم (6 نشرات محيّدين) |
| 5 | **Supabase**: تطبيق `supabase/migrations/20261021_harden_rls_policies.sql` | ✅ تم (عبر Management API) والتحقق منه |
| 6 | حساب المالك فاللوحة (Supabase Auth) | ✅ تم — `cheraimmohamed20@gmail.com` → رتبة `admin` |

> ملاحظة: باش تعاود تطبّق المigration (هي idempotent — تقدر تعاودها بلا خوف):
> `supabase db push` ولا الـ SQL Editor فـ Dashboard → New query → لصق الملف → Run.

---

## طبقة Supabase: RLS + Storage

المشروع: `uftqrgpzllvqlaztcjbq` — الملف:
`supabase/migrations/20261021_harden_rls_policies.sql`

### الوضع الحالي

| البند | الحالة |
|---|---|
| RLS مفعّل **و** مُجبَر (FORCE) | ✅ 18/18 جدول |
| سياسات `public` | ✅ 59 |
| سياسات `storage.objects` | ✅ 4 (افتراضية Cloudflare/Supabase محيّدين) |
| Buckets خدومية (`edu-files`, `documents`) | ✅ خاصّين (0 عام) |
| Trigger `on_auth_user_created` | ✅ (كيمنح رتبة `viewer` فقط) |
| Trigger `guard_exam_downloads` | ✅ (العداد العام +1 بالضبط، ما يمكنش يتبدّل) |

### من كيقدر يدير شنو

| الدور | القراءات | الكتابات |
|---|---|---|
| `anon` (زائر) | الكتالوج العام + الامتحانات **المعتمدة** + الإعلانات المنشورة | إرسال رسالة/سؤال، رفع ملف فـ `edu-files`، ++عداد التحميل |
| `authenticated` بلا رتبة (طالب) | مثل الزائر | رفع امتحان بـ `status='pending'` (المساهمة) |
| `viewer` | + إشعاراته ومفضلاته | — |
| `editor` | كل المحتوى | كل المحتوى |
| `admin` | كلشي | كلشي + `settings`/`documents`/`employees`/سجل التدقيق |

### قرارات مهمة

1. **الزائر ما يمكنش يقرا** الرسائل، الأسئلة غير المنشورة، الملفات الشخصية،
   سجل التدقيق، ولا جداول الإدارة — policy منفصلة لكل عملية.
2. **`anon` ما عندوش `UPDATE` كامل على `exams`**: ت(Update) على الجدول مُلغى،
   غير العمود `downloads` راجع له — وtrigger كيقفل باش يزيد **+1 بالضبط**.
3. **الرفع ديال الملفات**: `edu-files` مفتوح للرفع (المساهمة) ولكن القراءة
   غير للملفات ديال امتحان **معتمد** — الامتحانات اللي مازال `pending` ملفاتهم
   محجوبين (ولا حتى signed URL).
4. **تسجيل حساب جديد** كياخد رتبة `viewer` بحال — **ما كياخدش `admin`**،
   حيت الموقع العمومي كيسمح للجميع باش يسجل. الترقية للـ `admin` يدوية.
5. **`contact_messages` / `edu_questions`**: الإرسال مفتوح للزائر، القراءة
   للمشرف فقط (وكيعتمد على `return=minimal` — الموقع ما كيرجعش بالـ SELECT).
6. `documents` ما كيتقراش من الموقع العمومي إطلاقًا (غير اللوحة).

> للتحقق: `python _tools/audit_supabase_rls.py` → 39 فحص، 0 فشل.

---

## أدوات الفحص

| الأداة | شنو كتفحص |
|---|---|
| `python _tools/audit_final.py` | الموقع العمودي: الترويسات، CSP، المسارات المحجوبة، الأصول |
| `python _tools/audit_admin.py` | بوابة Cloudflare Access (كل أصول اللوحة خاصها ترجع 302) |
| `python _tools/audit_supabase_rls.py` | RLS + Storage: شنو كيدير الزائر وشنو ما كيديرش |

الثلاثة كيقراو من الكود والـ secrets ديال المستودع — ما كيحتاجوش إلا
مفتاح Supabase (اختياري) فـ `~/.supabase/access-token`.

---

## خارج النطاق

- هجمات DoS/DDoS
- الهندسة الاجتماعية
- ثغرات فـ خدمات طرف ثالث (Cloudflare, Supabase, jsDelivr)
