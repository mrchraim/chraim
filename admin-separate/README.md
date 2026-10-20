# CHRVVIM Admin Panel — مشروع منفصل محمي

لوحة الإدارة ديال CHRVVIM Campus، معزولة تمامًا عن الموقع العمومي.
الموقع العمومي ما فيهاش أي كود ولا رابط ولا مسار لهاد اللوحة.

---

## 1) الملفات

| الملف | الوظيفة |
|---|---|
| `admin.html` | واجهة اللوحة (CSP hash-based، بلا `unsafe-inline`) |
| `admin.js` | منطق اللوحة + تكامل Supabase |
| `_headers` | ترويسات أمان صارمة + `noindex` + `no-store` |
| `_redirects` | سياسة **رفض افتراضي**: غير `admin.html`/`admin.js` → 404 |

---

## 2) النشر على Cloudflare Pages (مشروع منفصل)

1. أنشئ مشروع Pages جديد **باسم غير قابل للتخمين**، مثال:
   `chrvvim-ops-7f3a9c` (ما تستعملش `admin`/`dashboard`/`panel` فـ الاسم).
2. ارفع محتوى هاد المجلد كـ static assets (بلا build command).
3. **لا** تربطو بنفس نطاق الموقع العمومي — استعمل نطاق فرعي مختلف تمامًا،
   مثال: `ops-7f3a9c.chrvvim.internal` أو نطاق `.pages.dev` الخاص بالمشروع.

## 3) حماية Cloudflare Access (إلزامية)

اللوحة **ما كتكونش محمية كفاية بالإخفاء**. لازم Access:

1. Zero Trust → **Access → Applications → Add application → Self-hosted**.
2. ضمّن نطاق المشروع كامل بـ policy واحدة.
3. **Policy 1 (allow)**: `Emails` = بريدك فقط (وأي أدمن آخر بالاسم).
   - زيد `Include → IP ranges` إذا عندك IP ثابت.
4. **MFA**: Zero Trust → Settings → Authentication → فعّل **One-time PIN**
   مع **TOTP** أو **WebAuthn (hardware key)**. امنع أي طريقة بلا MFA.
5. **Session Duration**: 2–4 ساعات (Settings → Session Duration).
6. فعّل **Service Auth / Access logs** وراقبها.

## 4) Supabase (نفس المشروع)

- الواجهة كتستعمل **publishable/anon key** فقط — ممنوع `service_role` هنا.
- الأمان الحقيقي = **Auth + RLS**. تأكد أن:
  - `is_admin()` مبنية على `app_metadata.role` (ماشي `user_metadata`).
  - كل جدول عليه `enable row level security` وسياسات least-privilege.
  - `audit_log` append-only (بلا UPDATE/DELETE).
- في Supabase → Auth → فعّل MFA (TOTP) للأدمن، وحدد JWT expiry قصير.

---

## 5) تصلّح CSP للوحة بعد أي تعديل

الـ CSP كتبنى من هاشات SHA-256 للكتل المضمّنة. أي تعديل فـ `<script>`/`<style>`
داخل `admin.html` كيبطّل الهاشات. عاود التوليد:

```powershell
# من مجلد الموقع الرئيسي
C:\Python315\python.exe tools\build_csp.py --admin --write
```

> ملاحظة: مكتبة Supabase محمّلة من jsDelivr بإصدار **مثبّت** (`@2.118.0`)
> مع **SRI** (`integrity=sha384-...`) و `crossorigin`. متبدّلهاش لإصدار عائم (`@2`).

---

## 6) قائمة تحقق قبل الإطلاق

- [ ] اسم المشروع غير قابل للتخمين
- [ ] Access policy = بريد الأدمن فقط (+ IP إن أمكن)
- [ ] MFA مفعّل وإجباري
- [ ] Session duration 2–4 ساعات
- [ ] لا يوجد أي رابط للوحة من الموقع العمومي
- [ ] `_redirects` = رفض افتراضي يعمل (404 لأي مسار آخر)
- [ ] RLS + `is_admin()` عبر `app_metadata` مطبّقة في Supabase
- [ ] `audit_log` append-only
- [ ] مراقبة Access logs + Supabase auth logs
