# CHRAIM — الدروس (Lessons)

**الحالة:** قوالب + دليل — لا محتوى مختلق.

## 1. الهدف
تنظيم دروس/شروحات/تمارين حسب **المستوى → المادة → الدرس**، مع مصادر وتواريخ.

## 2. هيكل
```
lessons/
├── README.md (هذا الملف)
├── TEMPLATE.html (قالب درس)
├── primary/   (ابتدائي)
├── middle/    (إعدادي)
└── high/      (ثانوي: common + bac)
```

## 3. إضافة درس (خطوات)
1. انسخ `TEMPLATE.html` إلى `lessons/<level>/<subject>/<lesson-slug>.html`.
2. املأ: العنوان، الأهداف، المحتوى، التمارين، المصادر، تاريخ التحيين.
3. أضف إدخالاً في `data/lessons-index.json` (TODO: إنشاء).
4. اربط من `levels/index.html` (أو subjects index).
5. شغّل `tools/audit-links.py` + build.

## 4. مبادئ
- لا محتوى مختلق: كل درس له **مصدر** (كتاب، أكاديمية، MEN) + **تاريخ تحيين**.
- إن لم تتوفر بيانات → «غير متوفر بعد» (لا اختلاق).
- CSP-safe: لا CDN (استخدم أصولاً محلية).
- i18n: ar (أساس) + fr/en (لاحقاً).

## 5. مصادر مقترحة
- وزارة التربية الوطنية (MEN) — مناهج.
- الأكاديميات الجهوية.
- كتب مدرسية (حقوق نشر → احترم).

## 6. TODO
- [ ] `data/lessons-index.json`.
- [ ] subjects index pages.
- [ ] search index update (`tools/make-search-index.py`).
- [ ] AI draft (مسودات «غير مراجعة») — اختياري (Phase 7).