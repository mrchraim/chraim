# 🚀 خطة الإطلاق الآمنة — CHRVVIM Campus

**التاريخ:** 2026-10-21
**الحالة:** كل ما يمكن تنفيذه برمجيًا **تم**. المتبقّي = تشغيل أمرين + نقرات فـ لوحتين.

---

## 🔎 اكتشاف مهم (من فحص الإنتاج الفعلي)

فحصت `https://chraim.pages.dev` مباشرةً (الموقع الحي الوحيد الموجود):

| الفحص | النتيجة |
|---|---|
| عنوان الصفحة | `CHRAIM` — نسخة **قديمة** (9.6KB) |
| CSP الحي | ❌ `'unsafe-inline'` + `img-src https:` + `connect-src https://*.supabase.co` |
| COEP | ❌ **مفقود** |
| `security-hardening.js` | ❌ غير موجود |
| النطاقات الأخرى | ❌ `chrvvim.pages.dev`, `talib.aga.ma`, `chrvvim.talib.aga.ma` — كلها **غير موجودة** |

> ⚠️ **الخلاصة:** الموقع الجديد (اللي فيه كل التعزيزات) **ما تنتشرش حتى الآن**.
> اللي كاين على الإنترنت نسخة قديمة بترويسات ضعيفة. لهذا خاصنا النشر.

**إصلاح جانبي منجز:** `wrangler.jsonc` كان فيه اسم مشروع تالف (`"efault -roject"`)
بسبب استبدال نصّي خاطئ → صُلّح إلى `chrvvim-campus` (JSON صالح مُتحقَّق منه).

---

## ✅ ما تم تنفيذه الآن (آليًا)

| # | العمل | الملف / النتيجة |
|---|---|---|
| 1 | **فحص الإنتاج الحي** | اكتشفنا أن النسخة الجديدة غير منشورة + CSP ضعيف حيّ |
| 2 | **إصلاح `wrangler.jsonc`** | `efault -roject` → `chrvvim-campus` (JSON صالح) |
| 3 | **سكربت نشر Cloudflare** | `_tools/deploy_cloudflare.py` (يزيل `.map/.bak/.py/.md` + مجلدات حساسة تلقائيًا) |
| 4 | **سكربت تطبيق Supabase** | `_tools/apply_supabase.py` (يتحقق من RLS + يطبّق migration) |
| 5 | **Migration RLS مصحّح** | `supabase/migrations/20261021_harden_rls_policies_v2.sql` |
| 6 | **تحقق من حزمة النشر** | العمومي: 70 ملف، **0 مرجع إدارة، 0 تسريب** · اللوحة: 5 ملفات فقط |

### أخطاء صُلّحت فـ migration الأصلي (كانت ثغرات حقيقية)

| المشكلة | الخطورة | الإصلاح فـ v2 |
|---|---|---|
| `is_admin_role('editor')` كان **صحيحًا دائمًا** (tautology) | 🔴 عالية | سلّم أدوار صريح: admin(3) > publisher(2) > editor(1) |
| `audit_log` بلا trigger — `service_role` يقدر يعدّل/يمسح | 🔴 عالية | Trigger `audit_log_block_mutation` يمنع UPDATE/DELETE دائمًا |
| سياسات `FOR ALL` تجمع كل العمليات | 🟠 متوسطة | فصلها: SELECT / INSERT / UPDATE / DELETE كل واحدة بوحدها |
| لا `FORCE ROW LEVEL SECURITY` | 🟠 متوسطة | مضاف لكل الجداول |
| `exam_files` بلا سياسة قراءة عامة | 🟠 متوسطة | `public_read_approved_exam_files` (status='approved') |

---

## 🎯 خطوات الإطلاق (بالترتيب)

### 1️⃣ Supabase — تطبيق RLS (~3 دقائق)

```powershell
# اعمل Personal Access Token من: https://supabase.com/dashboard/account/tokens
$env:SUPABASE_ACCESS_TOKEN = "sbp_xxxxxxxx"

# 1) شوف حالة RLS الحالية (قراءة فقط، بلا تغيير)
C:\Python315\python.exe _tools\apply_supabase.py --check

# 2) طبّق التعزيزات
C:\Python315\python.exe _tools\apply_supabase.py --apply supabase\migrations\20261021_harden_rls_policies_v2.sql

# 3) تحقق مرة أخرى
C:\Python315\python.exe _tools\apply_supabase.py --check
```

ثم فـ لوحة Supabase:
- **Auth → Providers → Email**: فعّل **MFA (TOTP)**، امنع التسجيل الذاتي إن ما محتاجوش.
- **Auth → Settings**: `JWT expiry` = **3600 ثانية (ساعة)** أو أقل.
- **Database → Backups**: فعّل **PITR** إن كانت الخطة كتسمح.
- **Storage**: خلّي bucket الملفات **private** + سياسة رفع PDF فقط `{user_id}/{filename}`.

---

### 2️⃣ Cloudflare Pages — نشر الموقع العمومي (~2 دقائق)

```powershell
# اعمل API Token من: My Profile → API Tokens → Create → "Cloudflare Pages:Edit"
$env:CLOUDFLARE_API_TOKEN = "xxxxxxxx"

# 1) اعرض المشاريع الموجودة (باش تعرف الاسم الصحيح)
C:\Python315\python.exe _tools\deploy_cloudflare.py --list

# 2) انشر الموقع العمومي
C:\Python315\python.exe _tools\deploy_cloudflare.py --site
```

> إن خرجت رسالة أن المشروع غير موجود، أنشئه أولًا من لوحة Cloudflare
> (Workers & Pages → Create → Pages → Upload assets) باسم `chrvvim-campus`،
> ثم عاود `--site`.

**بعد النشر — تحقق حي:**
```powershell
C:\Python315\python.exe -c "import urllib.request as u; r=u.urlopen('https://chrvvim-campus.pages.dev'); print({k:v for k,v in r.headers.items() if k.lower() in ('content-security-policy','cross-origin-embedder-policy','x-robots-tag')})"
```
يجب أن ترى: `unsafe-inline` **غائب** + `Cross-Origin-Embedder-Policy` **موجود**.

---

### 3️⃣ Cloudflare Pages — نشر اللوحة المنفصلة (~2 دقائق)

```powershell
# اختر اسمًا غير قابل للتخمين (ممنوع: admin/dashboard/panel)
C:\Python315\python.exe _tools\deploy_cloudflare.py --admin chrvvim-ops-7f3a9c
```

ثم **إلزاميًا** — Zero Trust:
1. **Access → Applications → Add → Self-hosted** → نطاق المشروع كامل.
2. **Policy (allow)**: `Emails` = بريدك فقط (+ IP ثابت إن وُجد).
3. **Authentication**: فعّل **One-time PIN** + **TOTP/WebAuthn**، وامنع أي طريقة بلا MFA.
4. **Session Duration**: 2–4 ساعات.
5. فعّل **Access logs** وراقبها.

---

### 4️⃣ Cloudflare — تقوية الحافة (WAF)

| الإعداد | القيمة |
|---|---|
| SSL/TLS | **Full (strict)** |
| Always Use HTTPS | **ON** |
| HSTS | **ON** — `max-age=63072000; includeSubDomains; preload` ⚠️ فقط بعد التأكد من كل النطاقات الفرعية |
| WAF Managed Rules | **ON** (Cloudflare Managed + OWASP) |
| Bot Fight Mode | **ON** |
| Rate Limiting | على `/rest/v1/auth*`, `/auth/v1/*`, وأي رفع ملفات |
| CSP Reporting | **ON** (باش تقارير `report-uri /cdn-cgi/csp-report` تخدم) |
| حساب Cloudflare | **2FA إجباري** |

---

## 🧪 التحقق النهائي (بعد كلشي)

```powershell
# CSP صارم حي؟
C:\Python315\python.exe -c "import urllib.request as u; print([l for l in str(u.urlopen('https://chrvvim-campus.pages.dev').headers).split(chr(10)) if 'csp' in l.lower() or 'security-policy' in l.lower()])"

# المسارات الحساسة كترجع 404؟
foreach ($p in @('/admin','/.env','/.git/config','/admin.html','/tools/site_doctor.py')) {
  try { $r = Invoke-WebRequest "https://chrvvim-campus.pages.dev$p" -UseBasicParsing -TimeoutSec 10; "$p -> $($r.StatusCode)" }
  catch { "$p -> $($_.Exception.Response.StatusCode.value__)" }
}
```

المتوقّع: كولشي **404**.

---

## 📋 قائمة تحقق نهائية

- [ ] `apply_supabase.py --apply` نجح
- [ ] `apply_supabase.py --check` كيبيّن RLS مفعّل + FORCED على كل الجداول
- [ ] `audit_log` trigger موجود
- [ ] Supabase MFA + JWT قصير مفعّلين
- [ ] `deploy_cloudflare.py --site` نجح
- [ ] CSP الحي **بلا `unsafe-inline`** + COEP موجود
- [ ] `deploy_cloudflare.py --admin <name>` نجح
- [ ] Cloudflare Access + MFA + session 2–4h
- [ ] WAF + Bot Fight + Rate limiting
- [ ] SSL Full (strict) + Always HTTPS + HSTS
- [ ] Cloudflare 2FA + Supabase 2FA
- [ ] المسارات الحساسة ترجع 404 على النطاق الحي

---

## 📁 ملفات ذات صلة

| الملف | الوظيفة |
|---|---|
| `_tools/deploy_cloudflare.py` | 🆕 نشر الموقع + اللوحة على Cloudflare Pages |
| `_tools/apply_supabase.py` | 🆕 تطبيق/فحص RLS على Supabase |
| `supabase/migrations/20261021_harden_rls_policies_v2.sql` | 🆕 RLS مصحّح + audit append-only |
| `wrangler.jsonc` | ✏️ اسم المشروع صُلّح |
| `admin-panel-separate.zip` | حزمة اللوحة (رفع يدوي بديل) |
| `_reports/SECURITY_HARDENING_FINAL_2026-10-20.md` | ملخّص كل التعزيزات |
