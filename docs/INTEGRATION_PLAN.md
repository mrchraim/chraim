# CHRAIM — خطة الدمج (الجامعات + المستويات + الدروس)

**الحالة:** تصميم/هيكل — لا محتوى مختلق.

## 1. الرؤية
منصة واحدة تجمع:
- **الجامعات** (جامعة ابن زهر — كليات/مدارس/معاهد، كلية FSJP أولاً: أفواج، جداول، وثائق، مواعيد).
- **المستويات** (ابتدائي، إعدادي، ثانوي) — دروس، دعم، شروحات، امتحانات.
- **الدروس/الدعم** — محتوى منظم حسب المستوى/المادة/الدرس، مع شروحات (نص/فيديو/تمارين).

## 2. هيكل المقترح
```
/
├── index.html (رئيسية: ماذا تريد اليوم؟ + اختصارات)
├── levels/
│   ├── index.html (اختيار المستوى)
│   ├── primary/   (ابتدائي)
│   ├── middle/    (إعدادي)
│   └── high/      (ثانوي: common + bac branches)
├── lessons/
│   ├── index.html (فهرس الدروس)
│   └── <level>/<subject>/<lesson>.html (قوالب)
├── support/       (دعم: تمارين، امتحانات، شروحات)
├── university/    (الكليات — migrate etablissements + platform)
└── data/
    ├── academic-data.json (موجود)
    ├── levels-curriculum.json (جديد — placeholder)
    └── lessons-index.json (جديد — placeholder)
```

## 3. مبادئ
- لا محتوى مختلق: كل درس/شرح يُربط بمصدر (كتاب مدرسي، الأكاديمية، إلخ) أو يُوسم «غير متوفر بعد».
- CSP-safe: لا CDN (Tailwind/Font Awesome محلي).
- PWA offline: cache الدروس المحفوظة.
- i18n: ar (أساس) + fr + en (لاحقاً).

## 4. المراحل
1. **Scaffold** (الآن): هيكل مجلدات + صفحات placeholder + فهرس.
2. **Data** (لاحقاً): levels-curriculum.json (مستويات/مواد/دروس) من مصادر رسمية (MEN, Akademie).
3. **Content** (تدريجي): دروس/شروحات (نص أولاً، ثم فيديو).
4. **Integration** (لاحقاً): ربط university + levels في navigation + search index.
5. **AI support** (Phase 7): مساعد (تصميم فقط).

## 5. ما نفعله الآن (Scaffold)
- إنشاء `levels/`, `lessons/`, `support/` مع صفحات placeholder.
- تحديث `index.html` اختصارات (إضافة «المستويات»، «الدروس»).
- `data/levels-curriculum.json` (placeholder).
- `tools/make-search-index.py` تحديث (لاحقاً).

## 6. قرارات تحتاج موافقتك
- مصادر المحتوى (MEN vs مناهج).
- لغة التدريس (ar/fr).
- hosting videos (YouTube embed vs local).

**لا ندّعي إنجاز محتوى.** Scaffold فقط.