# نشر CHRVVIM CAMPUS على Cloudflare Pages — خطوات دقيقة

**الموقع:** `chrvvim.talib.aga.ma` · **المصدر:** مستودع GitHub → نشر تلقائي
**لماذا Cloudflare Pages:** نطاق ترددي غير محدود، SSL مجاني، وتدعم `_headers` و`_redirects` **كما هي** (بلا أي تعديل في الملفات).

---

## 0) جاهز مسبقاً (أنجزتُه أنا)
- المستودع المحلي مُهيّأ في `chrvvim.talib.aga.ma/` — فرع `main`، نظيف.
- آخر التزامين: `d2b08a4` (الموقع) ثم `57981de` (.gitattributes لضمان LF).
- **لا أسرار**: المفتاح الوحيد `sb_publishable_…` (قراءة فقط). فُحص الموقع كاملاً — لا `service_role` ولا مفاتيح خاصة.
- `_headers` (رؤوس أمان كاملة) و`_redirects` موجودان ومخزّنان بـ LF.

---

## 1) أنشئ مستودع GitHub وادفع الكود
افتح PowerShell **جديداً** ونفّذ:

```powershell
# سجّل الدخول مرة واحدة (يفتح المتصفح)
gh auth login

# ادفع المجلد الحالي كمستودع جديد
cd "C:\Users\Mohamed Chraim\OneDrive\المستندات\Default Project\chrvvim.talib.aga.ma"
gh repo create chrvvim-campus-portal --public --source=. --remote=origin --push
```

> استبدل `--public` بـ `--private` إن أردت المستودع خاصاً.
> بعدها يظهر رابط المستودع: `https://github.com/mrchraim/chrvvim-campus-portal`

**تحقّق:** افتح رابط المستودع في المتصفح — يجب أن ترى 69 ملفاً (index.html، assets/، data/، documents/…).

---

## 2) اربط Cloudflare Pages بالمستودع
1. سجّل الدخول: <https://dash.cloudflare.com> → **Workers & Pages**.
2. **Create** → تبويب **Pages** → **Connect to Git**.
3. اختر مستودع `chrvvim-campus-portal` → **Begin setup**.
4. الإعدادات الدقيقة:
   | الحقل | القيمة |
   |---|---|
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | **(اتركه فارغاً)** |
   | Build output directory | `/` (جذر المستودع) |
5. **Save and Deploy** → ينتشر خلال ثوانٍ.
6. تحصل على رابط: `https://chrvvim-campus-portal.pages.dev` ✅

**تحقّق:** افتح الرابط — يجب أن يعمل الموقع. افتح Console في المتصفح: لا أخطاء JS (فقط 404s لمجسّات `/api/public/*` وهي مقصودة).

---

## 3) اربط النطاق `chrvvim.talib.aga.ma`
في مشروع Pages → **Custom domains** → **Set up a domain** → اكتب `chrvvim.talib.aga.ma` → Continue.

### الحالة (أ): نطاق `aga.ma` مُدار على Cloudflare DNS
سيكتمل الربط تلقائياً (سجل CNAME يُضاف نفسه). انتظر ~1–5 دقائق ثم SSL جاهز.

### الحالة (ب): النطاق على مسجّل آخر
أضف في لوحة DNS لدى المسجّل:
```
النوع:  CNAME
الاسم:  chrvvim
القيمة: chrvvim-campus-portal.pages.dev
TTL:    تلقائي
```
ثم ارجع إلى Cloudflare واضغط **Check DNS**. عند التعرّف عليه: SSL مجاني تلقائي.

---

## 4) كل تحديث لاحق = تلقائي
أي `git push` إلى `main` → Cloudflare Pages يُعيد النشر تلقائياً.

```powershell
cd "C:\Users\Mohamed Chraim\OneDrive\المستندات\Default Project\chrvvim.talib.aga.ma"
git add -A
git commit -m "تحديث"
git push
```

---

## ملاحظات وحلول مشاكل
| المشكلة | الحل |
|---|---|
| صفحات فرعية تُرجع 404 عند التحديث | موجود `404.html` + قواعد `_redirects` — تعمل تلقائياً |
| رؤوس الأمان لا تظهر | تأكّد أن `_headers` في **جذر** المستودع (موجود) |
| CSP يحجب Supabase | `_headers` يسمح بـ `https://idpafbyefrywjixskvvu.supabase.co`. **إن استعملت مشروع Supabase آخر، حدّث هذا السطر.** |
| لوحة التحكم لا تعمل | طبيعي حتى تُشغّل ترحيل Supabase (انظر الدليل الآخر) |
| Service Worker يخزّن نسخة قديمة | ارفع رقم `CACHE` في `sw.js` (حالياً `chrvvim-v14`) عند تغييرات كبيرة |
