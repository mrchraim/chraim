# تقرير إنشاء الموقع الجديد — chrvvim.talib.aga.ma

**التاريخ:** 2026-10-17
**المُخرَج:** مشروع جديد `chrvvim.talib.aga.ma/` (68 ملفاً، 10 ملفات PDF رسمية)
**حالة التحقق:** TESTED LOCALLY (خادم ثابت محلي + فحص DOM/شبكة عبر متصفح حقيقي)

---

## 1) ماذا أُنجز

أُنشئ مشروع مستقل مبني على التطبيق **المُدقَّق** `chrvvim-campus/web` (لا على القالب
المرفق `CHRVVIM_Campus_Ultimate_Student_Portal.html`، لأن ذلك القالب يحتوي بيانات
مُختلقة وتسجيل دخول وهمي وثغرة حقن HTML). حُفظت كل الوظائف والبيانات الحقيقية،
وأُضيفت تحسينات:

- **إعلانات حيّة من Supabase** (قراءة فقط) مع احتياط ثابت `data/announcements.json`.
- **دعم الصور + نوافذ النشر/الانتهاء** (`image_url`, `publish_at`, `expire_at`) — يُفعَّل
  تلقائياً بعد تنفيذ الترحيل، دون أي تعديل في الكود.
- **مركز تنبيهات**: جرس + عدّاد غير المقروء + قائمة آخر 12 إعلاناً (محفوظ محلياً).
- **طبقة تصميم premium**: زجاجية البطاقات، حركة دخول الأقسام، تفاعلات لطيفة،
  احترام `prefers-reduced-motion`، وطباعة أنيقة.
- تحديث النطاق في: `canonical`, `og:url`, `og:image`, `twitter:image`, JSON-LD,
  `robots.txt`, `sitemap.xml`, `security.txt`.
- رفع نسخة الـService Worker إلى `chrvvim-v14` وإضافة الملفات الجديدة للتخزين المسبق.

## 2) أدلة التحقق (محلياً)

| الفحص | النتيجة |
|---|---|
| `canonical` | `https://chrvvim.talib.aga.ma/` ✅ |
| لغات/اتجاه | `lang=ar`, `dir=rtl` ✅ |
| عدد اللوحات | 15 لوحة ✅ |
| إحصاء البطل | 12 مسلكاً/مساراً ✅ |
| الإعلانات | عنصران (احتياط ثابت — جدول Supabase فارغ) ✅ |
| جرس التنبيهات | موجود، الشارة «2»، عنصران في القائمة ✅ |
| `premium.css` | مُحمَّل، `backdrop-filter: blur(10px) saturate(1.05)` ✅ |
| طلب Supabase | `GET …/rest/v1/announcements…` → **200** ✅ |
| 404s | فقط `/api/public/meta` و `/api/public/institutions` — استكشاف قدرات **مقصود** على الاستضافة الثابتة، ويُستبدل بالملفات الثابتة ✅ |

> ملاحظة: تعذّر التقاط لقطة شاشة لأن أداة اللقطة تتطلّب نافذة سطح مكتب مرئية (غير متاحة الآن).

## 3) اكتشافات مهمة (أمنية/تقنية)

1. **عدم تطابق مخطط قاعدة البيانات:** الجدول الحيّ `public.announcements` يحوي فعلياً:
   `title, body, status, kind, created_at, updated_at` — **لا** يحوي
   `id` ولا `content` ولا `image_url` ولا `publish_at`/`expire_at`/`is_published`.
   ⇒ لوحة التحكم المرفقة `admin_images_dates.html` **ستفشل** ضد هذا الجدول كما هو.
   الحل: نفّذ `supabase/schema.sql` (آمن وغير مُدمِّر، يضيف الناقص + سياسة قراءة عامة).

2. **القالب المرفق `CHRVVIM_Campus_Ultimate_Student_Portal.html` غير آمن/غير حقيقي:**
   - تسجيل دخول وهمي: `if (email === 'admin@chrvvim.ma' && pass.length >= 6)`.
   - علامة إدارة قابلة للتزوير في `localStorage`.
   - حقن HTML غير مُهرَّب (`${ann.title}`).
   - بيانات أكاديمية مُختلقة (أساتذة/قاعات/نطاقات ألقاب).
   ⇒ لم يُستَخدم؛ بُني الموقع على البيانات الحقيقية بدلاً منه.

3. مفتاح Supabase المستعمل هو `publishable` عام (قراءة فقط) — ليس سرّاً مسرَّباً.

## 4) ما تبقّى (يتطلّب قراراً/صلاحية منك)

| # | المطلوب | السبب |
|---|---|---|
| 1 | ضبط DNS للنطاق `chrvvim.talib.aga.ma` لدى مسجّل النطاق | النطاق ملكك؛ لا يمكن تسجيله/توجيهه من هنا |
| 2 | تنفيذ `supabase/schema.sql` في SQL Editor | تشغيل الصور والجدولة وتطابق لوحة التحكم |
| 3 | اختيار وجهة النشر: مستودع GitHub Pages جديد **أو** سحب وإفلات على Netlify | لا خادم Node مطلوب؛ الموقع ثابت |
| 4 | (اختياري) رمز Bing + معرّفات GA4/Clarity | فحوص سابقة معلّقة |

## 5) أوامر النشر الجاهزة

**أ) Netlify (سحب وإفلات):** اسحب مجلد `chrvvim.talib.aga.ma` إلى Netlify Drop.
(**ب) GitHub Pages:**
```powershell
# من مجلد المشروع الجديد
git init; git add -A; git commit -m "chrvvim.talib.aga.ma: premium portal"
git branch -M main
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

## 6) الملفات الرئيسية

- `chrvvim.talib.aga.ma/index.html` — إضافة: رابط `premium.css` + مضيف الجرس `#notifyHost`.
- `chrvvim.talib.aga.ma/assets/js/announcements.js` — وحدة الإعلانات الحيّة (جديد).
- `chrvvim.talib.aga.ma/assets/js/notify.js` — مركز التنبيهات (جديد).
- `chrvvim.talib.aga.ma/assets/css/premium.css` — الطبقة البصرية (جديد).
- `chrvvim.talib.aga.ma/assets/js/data.js` — دمج الحيّ + الثابت.
- `chrvvim.talib.aga.ma/assets/js/app.js` — تهيئة التنبيهات.
- `chrvvim.talib.aga.ma/assets/js/views.js` — عرض صور الإعلانات (اختياري).
- `chrvvim.talib.aga.ma/supabase/schema.sql` — ترحيل الإعلانات (جديد).
- `chrvvim.talib.aga.ma/_headers` — CSP مضبوط بـ`connect-src` لـSupabase.
- `chrvvim.talib.aga.ma/sw.js` — `chrvvim-v14`.
- `chrvvim.talib.aga.ma/README.md` — دليل مختصر (جديد).

## 7) التراجع

المشروع **جديد ومستقل** تماماً: حذف مجلد `chrvvim.talib.aga.ma/` يعيد الحالة لما قبلها.
لم يُعدَّل المشروع الأصلي `chrvvim-campus` إطلاقاً.
