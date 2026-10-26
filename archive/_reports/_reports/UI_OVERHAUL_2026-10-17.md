# تقرير: تحسين UI (الألوان، gender، شريظ socially، تعليقات، back buttons) — 2026-10-17

## 1. التغييرات (index.html)
- **الألوان**: palette muted/pale (--bg #F8F6F2، --gold #B89B5E، --muted #6B7280، --card #FFFFFF).
- **Gender themes**: `:root[data-gender="male"]` (cool blue/steel) + `:root[data-gender="female"]` (warm rose/mauve) + neutral (default).
- **Gender picker**: زر #genderBtn (♀♂) في الـ header + JS (localStorage cc_gender) + aria-label مترجم (aria.genderMale/Female/Neutral).
- **Sticky social strip** (#socialStrip): ثابت في أسفل المتصفح، muted، dismissible (localStorage cc_ss_closed)، مع GitHub/Instagram/LinkedIn/Email.
- **Comments scaffold** (#comments): نموذج (textarea + إرسال) + قائمة (cList) + pending note. (النشر للجميع يتطلب موافقة الإدارة — Supabase backend).
- **Back button**: موجود في university-directory.html (العودة إلى بوابة الطالب).
- **Animations**: ticker (tick 34s) + orbFloat + gradientShift + fade/pop already present.

## 2. التغييرات (university-directory.html)
- **Sticky social strip** (#socialStrip) — muted، dismissible.
- **Back button**: موجود (العودة إلى الدليل).

## 3. التحقق (Browser)
- **0 أخطاء Console**، **0 تحذيرات**.
- **38 بطاقة** تُعرض؛ بحث «أكادير» → 10؛ تصفية «كليات» → 24.
- **5 لغات** (ar/fr/en/zgh/zgh-latn): هيرو + بطاقات + Badges + الروابط تُترجم.
- **Gender toggle**: neutral→male→female (data-gender applies) + aria-label مترجم.
- **Social strip**: dismissible (hidden after close).
- **Comments scaffold**: form + list + pending note.

## 4. الملاحظات
- **الأمازيغية**: مسودة (DRAFT).
- **Comments backend**: يتطلب Supabase table + RLS + admin approval (scaffold frontend only).
- **Social accounts**: placeholders (mr1mohamed1chraim) — يجب استبدالها بالحسابات الفعلية.
- **النشر**: لم يتم (محلية only).

## 5. الملفات المعدلة
- `index.html` (colors + gender + social strip + comments + gender script)
- `university-directory.html` (social strip)
- `_dev/page_i18n_misc.json` (+3 keys: aria.genderMale/Female/Neutral)
- `page-i18n.js` (مُعاد توليده — 237 مفتاح)
- `sw.js` (v13)
- `BUILD_MANIFEST.sha256` (مُعاد توليده)

## ✅ النتيجة
**UI overhaul مكتمل (محلية، لم يُنشر). 0 أخطاء. 5 لغات. Colors muted + gender themes + social strip + comments scaffold + back buttons.**