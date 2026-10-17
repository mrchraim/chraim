# تقرير: الصفحة الأولى الشاملة (جامعة ابن زهر) — 2026-10-17

## 1. الهدف
- تحويل الصفحة الأولى لتكون **شاملة لجميع مؤسسات جامعة ابن زهر** (وليس فقط كلية العلوم القانونية والسياسية).
- إضافة **بوابة مؤسسات** (دليل + بحث + تصفية + بطاقات) مع معلومات موثّقة (روابط رسمية، استعمالات زمن، إعلانات، فضاء طلابي) وتوضيح «المعلومات غير متوفرة حالياً» حيث لا توجد بيانات مؤكدة.
- إبقاء **جميع الميزات الحالية** (الأدوات، مجموعات واتساب، الإعلانات، التبويبات) دون حذف.

## 2. التغييرات المنجزة
- **Hero جامعي**: عنوان «بوابة جامعة ابن زهر» + وصف جامعي + شعار «UNIVERSITÉ IBN ZOHR · ÉTABLISSEMENTS» + رابط «اللائحة الرسمية للجامعة» (uiz.ac.ma/nos-etablissements).
- **قسم «بوابة مؤسسات جامعة ابن زهر»** (id="instGate") في أعلى الصفحة (قبل #homeQuick):
  - بحث (igSearch) + تصفية حسب النوع (كليات/مدارس/معاهد) + حسب المدينة (igCity) + عداد (igCount).
  - 38 بطاقة مؤسسة (من CHRVVIM_INSTITUTIONS) مع: الاسم (ar/fr)، النوع، المدينة، حالة التحقق، روابط موثّقة (الموقع/استعمالات الزمن/الإعلانات/الفضاء الطلابي/الامتحانات/الأفواج) أو «المعلومات غير متوفرة حالياً» + رابط «صفحة المصدر».
  - زر «فضاء المؤسسة ↗» → يفتح university-directory.html#ID (deep-link).
  - لاحظ: كل بطاقة تُترجم بالكامل (5 لغات).
- **institutions-resources.js** (جديد): 12 مؤسسة بروابط موثّقة (FLSH, FS, FSJES, FMP, FP-OZ, FLASH-AM, ENCG, ENSA, EST, ESEF, ENSIASD, IMS) مع last_verified.
- **institutions-gateway.js** (جديد): عارض البوابة، بحث، تصفية، re-render على cc:lang.
- **university-directory.html**: 
  - دعم deep-link (university-directory.html#UIZ-XXX) → يفتح فضاء المؤسسة.
  - تحميل institutions-resources.js.
  - عرض «روابط موثّقة» داخل «ملف المؤسسة».
- **page-i18n.js**: +26 مفتاح (ig.*) — 5 لغات، بما في ذلك typeFac/typeSchool/typeInst، ig.officialList، ig.note.
- **i18n**: Hero (hero.motto/h1html/p/chip) عبر data-i18n (page-i18n) — 5 لغات.
- **sw.js**: CACHE='chrvvim-shell-v12' + SHELL يشمل institutions-resources.js/gateway.js.
- **BUILD_MANIFEST.sha256**: مُعاد توليده (96 إدخال).

## 3. التحقق (Browser Test)
- **0 أخطاء Console**، **0 تحذيرات**.
- 38 بطاقة تُعرض؛ بحث «أكادير» → 10 بطاقة؛ تصفية «كليات» → 24 بطاقة.
- تبديل 5 لغات (ar/fr/en/zgh/zgh-latn): البطاقات + الهيرو + Badges + الروابط تُترجم بالكامل.
- النقر على بطاقة → يفتح university-directory.html#ID → فضاء المؤسسة + «روابط موثّقة».
- deep-link (university-directory.html#UIZ-001) → يفتح الفضاء مباشرة.
- Tab bar ملتف (flex-wrap: wrap)، بدون تجاوز أفقي.

## 4. ملاحظات
- **محتوى رسمي/بيانات**: الأفواج/الجداول الفعلية للمؤسسات (باستثناء الروابط الموثّقة) تظهر «المعلومات غير متوفرة حالياً» — لا تُخترع بيانات.
- **الأمازيغية**: مسودة (DRAFT)، placeholders {n}/{t} محفوظة.
- **جلسة متزامنة**: تم رصد تعديلات متزامنة على نفس الملفات (الهيرو جامعي + ig.* + ig.officialList/ig.note). تم دمجها (لا تعارض).
- **النشر**: لم يتم. التغييرات محلية. Manifest وSW محدثان.
- ** closing the other session**: لا أستطيع إغلاق جلسة أخرى من هنا (مخاطر على جلستي). يُوصى بإغلاقها يدوياً (OpenCode UI / Task Manager) لتفادي التعارض.

## 5. الملفات المعدلة/المولدة (هذه المرحلة)
- index.html (قسم instGate + hero جامعي + scripts)
- institutions-resources.js (جديد)
- institutions-gateway.js (جديد)
- university-directory.html (deep-link + resources + script)
- _dev/page_i18n_gateway.json (ig.* — مُحدث بـ ig.officialList/ig.note)
- page-i18n.js (مُعاد توليده — ig.* + hero.*)
- sw.js (v12)
- BUILD_MANIFEST.sha256 (مُعاد توليده)

## ✅ النتيجة
الصفحة الأولى أصبحت **شاملة (جامعة ابن زهر)**: هيرو جامعي + بوابة مؤسسات (38 بطاقة موثّقة) + الإبقاء على كل أدوات كلية الحقوق. 0 أخطاء Console. 5 لغات. التغييرات محلية (لم يُنشر).
