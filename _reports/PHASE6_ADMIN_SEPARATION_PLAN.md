# PHASE 6: فصل لوحة الإدارة + الحماية المتقدمة
التاريخ: 2026-10-20

## الهدف
فصل لوحة الإدارة تماماً عن الموقع العمومي، ووضعها في مشروع Cloudflare Pages منفصل محمي بـ Cloudflare Access (Zero Trust).

## ما تم تنفيذه في الكود

### 1) حجب مسارات الإدارة في الموقع العمومي
- ✅ تحديث `_redirects` لحجب `/admin/*`, `/dashboard/*` بـ 404
- ✅ تحديث `_headers` لإضافة `X-Robots-Tag: noindex, nofollow` لمسارات admin
- ✅ تحديث `robots.txt` لحظر `/admin`, `/dashboard`
- ✅ تحديث `sitemap.xml` ليحتوي فقط على الصفحة الرئيسية (بدون admin)

### 2) ملفات الإدارة الموجودة
تم فحصها - `admin.html` موجود حالياً في `chrvvim.talib.aga.ma/` لكن يجب نقله لمشروع منفصل.

## خطوات يدوية مطلوبة منك (CRITICAL)

### أ) إنشاء مشروع Cloudflare Pages منفصل للإدارة
1. اذهب لـ Cloudflare → Pages → Create a project
2. اسم المشروع: `chrvvim-admin` (أو اسم غير قابل للتخمين)
3. ربطه بـ Git repo أو رفع الملفات يدوياً
4. **Subdomain غير قابل للتخمين:** بعد النشر، يمكنك إضافة custom domain أو استخدام `chrvvim-admin.pages.dev` لكن الأفضل custom domain غير واضح

### ب) نقل ملفات الإدارة للمشروع المنفصل
انسخ هذه الملفات للمشروع المنفصل:
- `admin.html`
- `admin.js` (لو موجود)
- أي ملفات JS/CSS خاصة بالـadmin
- `supabase-config.js` الخاص بالـadmin فقط إن لزم الأمر

**ملاحظة:** تأكد من عدم نسخ أي ملفات من الموقع العمومي غير الضرورية.

### ج) حماية بـ Cloudflare Access (Zero Trust)
**المسار:** Cloudflare → Zero Trust → Access → Applications

1. Create Application → Self-hosted
2. Application name: `CHRVVIM Admin`
3. Session Duration: 4 hours (أو أقل)
4. Application domain: `admin.yourdomain.com` (أو subdomain محمي)
5. **Policies:**
   - Policy name: `Allow Authorized Admins`
   - Action: Allow
   - Include:
     * Emails: قائمة إيميلات الأدمن المصرح لهم فقط
     * OR Email domains: نطاق مخصص
   - Require: **MFA** (Multi-factor authentication)
6. **Additional settings:**
   - Enable "Purpose justification" (اختياري)
   - CORS settings حسب الحاجة

### د) حذف ملفات الإدارة من الموقع العمومي
بعد التأكد من عمل لوحة الإدارة في المشروع المنفصل والمحمية:

```bash
# احذف هذه الملفات من chrvvim.talib.aga.ma/
rm admin.html
rm admin.js  # لو موجود
```

**لكن احذفها فقط بعد اختبار المشروع المنفصل بنجاح!**

### هـ) استخدام app_metadata للأدوار (أمان إضافي)
في Supabase، يجب استخدام `app_metadata` وليس `user_metadata` للأدوار:

```sql
-- Example: Set admin role via service_role only
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

**ملاحظة:** `user_metadata` يمكن للمستخدم تعديله، `app_metadata` فقط بواسطة service_role.

### و) تفعيل MFA في Supabase Auth
**المسار:** Supabase → Authentication → Multi-Factor Authentication
- Enable TOTP
- يمكن فرض MFA للأدمن فقط عبر Edge Functions أو RLS

### ز) Audit Log
تم إنشاء جدول `audit_log` في migration. يجب:
1. تشغيل migration
2. إضافة triggers أو logging من Edge Functions لتسجيل كل إجراء إداري
3. التأكد من عدم وجود UPDATE/DELETE policies على `audit_log`

## قائمة التحقق النهائية

- [ ] تم إنشاء مشروع Cloudflare Pages منفصل للإدارة
- [ ] تم نقل ملفات الإدارة للمشروع المنفصل
- [ ] تم حماية المشروع بـ Cloudflare Access + MFA
- [ ] تم إعداد allowlist للإيميلات/IPs
- [ ] تم حذف admin.html من الموقع العمومي
- [ ] تم اختبار الوصول للموقع العمومي → /admin يجب أن يعطي 404
- [ ] تم اختبار لوحة الإدارة المحمية تعمل
- [ ] تم تحويل الأدوار لاستخدام `app_metadata`
- [ ] تم تشغيل migration وإعداد audit_log
- [ ] تم إضافة logging للإجراءات الإدارية

## ملاحظات أمنية
- **لا تحط رابط لوحة الإدارة** في أي مكان بالموقع العمومي
- **استخدم subdomain غير واضح** قدر الإمكان
- **فعّل IP restrictions** إذا كان مناسباً
- **راقب Cloudflare Access logs** بشكل دوري
- **حدّد session timeout قصير** (2-4 ساعات)

## المخاطر
- **متوسط-عالي:** نقل الملفات قد يسبب مشاكل إذا كان هناك imports/dependencies مشتركة
- **عالي:** إذا حذفت الملفات قبل التأكد من عمل المشروع المنفصل، ستفقد الوصول للوحة الإدارة
- **متوسط:** Cloudflare Access يحتاج خطة مناسبة (بعض الميزات مجانية)
