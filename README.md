# CHRAIM — منصة الطالب الموحّدة

مشروع واحد يجمع كل مشاريع **CHRVVIM Campus** في مكان واحد: دليل مؤسسات، بوابة طلبة كلية الحقوق، منصة امتحانات متعددة الجامعات، وأدوات الطالب — **بدون حذف أي محتوى قديم**.

🔗 الموقع الموحّد يعمل من جذر المستودع مباشرة (صفحة `index.html`).

---

## 🗂️ هيكل المستودع

```
chraim/
├── index.html ……………… الموقع الموحّد الرئيسي (بوابة الطالب + 18 تبويب)
├── rafiq-altalib.html ……… رفيق الطالب (جدول، معدّل، مواعيد)
├── university-directory.html  دليل جامعة ابن زهر
├── academic-offer.html ………… دليل التكوينات (382 تكوين)
├── academic-updates.html ……… المستجدات الجامعية
│
├── etablissements/ …………… 🆕 دليل المؤسسات التفصيلي (24 مؤسسة)
│   ├── index.html ……………… فهرس قابل للبحث والتصفية
│   ├── flsh-agadir.html ……… صفحة لكل مؤسسة (مسؤولون، اتصال، تكوينات)
│   ├── style.css · app.js …… تصميم موحّد مطابق للموقع الرئيسي
│   └── build/generate.py …… مولّد الصفحات (إعادة توليدها: python etablissements/build/generate.py)
│
├── platform/ ………………… 🆕 منصة الطلبة (امتحانات وفروض وملخصات)
│   ├── index · browse · subject · contribute · announcements · account …
│   ├── login.html · dashboard.html … لوحة تحكّم الإدارة
│   └── js/ · css/ ……………… تكامل Supabase (متعدد الجامعات)
│
├── archive/ ……………………… 📦 كل المشاريع الأصلية كما هي (للحفظ)
│   ├── chrvvim.talib.aga.ma/ · chrvvim-ai-hub/ · chrvvim-campus/
│   ├── management-system/ · portal-preview/
│   ├── _deploy_kit/ · _integration_preview/ · _archive/
│   ├── chrvvim-campus-history.bundle … تاريخ git كامل (لأنه بلا remote)
│   └── PROVENANCE.md ……… أصل ومستودع كل مشروع مؤرشف
│
├── vendor/OpenMausBot/ ……… 🧰 تطبيق خارجي (مِلكية Milind Soni — AI agents)
│
└── docs/ …………………………… التوثيق
```

---

## 🔗 أقسام الموقع الموحّد

| القسم | الرابط | المصدر |
|-------|--------|--------|
| بوابة الطالب الرئيسية | `/` | الموقع الرئيسي |
| رفيق الطالب | `/rafiq-altalib.html` | الموقع الرئيسي |
| دليل التكوينات | `/academic-offer.html` | الموقع الرئيسي |
| المستجدات الجامعية | `/academic-updates.html` | الموقع الرئيسي |
| **دليل المؤسسات التفصيلي** | `/etablissements/` | 🆕 من `portal-preview` |
| **منصة الامتحانات** | `/platform/` | 🆕 من `management-system` |

كل أقسامها مربوطة بتنقّل موحّد داخل الموقع.

---

## 🚀 التشغيل محلياً

الموقع ثابت بالكامل (لا build). شغّل أي خادم ملفات من جذر المستودع:

```bash
python -m http.server 8000
# ثم افتح http://127.0.0.1:8000/
```

القسمان الجديدان (`etablissements/` و `platform/`) يعملان مباشرة بلا أي خطوة بناء.

---

## ✨ تحسينات الواجهة المدمجة (بديل حقن البروكسي)

كانت التحسينات البصرية تُحقن سابقاً وقت التشغيل عبر بروكسي `portal.py` (CSS + JS عام
يشمّ DOM + MutationObserver + `!important`). **أُعيدت صياغتها الآن كمكوّن دائم داخل كود الموقع**
في `index.html` — بلا حاجة لأي بروكسي، وبتوجيه مباشر للعناصر الحقيقية:

| التحسين | التنفيذ المدمج |
|---------|----------------|
| 1) شريط الأخبار بعرض الشاشة | `.ticker` — خط أوضح وارتفاع أكبر |
| 2) إحصائيات كبيرة متوهجة | `.hero .stats .stat b` — 3rem، وزن 900، توهّج ذهبي |
| 3) زر «ابدئي من هنا» | `.cta-main` — تدرّج ألوان متحرك + نبض |
| 4) قائمة تنقّل متحركة | `.chraim-marquee` + سكربت صغير يحمي `#abnav` |

الكتلة في `<style id="chraim-enhance">` والسكربت في `<script id="chraim-marquee">`.

---

## 🧩 إعادة توليد صفحات المؤسسات
تُولَّد صفحات `etablissements/` من ملف البيانات الموحّد:

```bash
python etablissements/build/generate.py
```

المصدر: `archive/portal-preview/build/data.json` (24 مؤسسة، مُتحقَّق منها بتاريخ 2026-10-16).

---

## ☁️ النشر

- **الموقع الرئيسي**: Cloudflare Pages (من جذر المستودع).
- **`platform/`**: يستخدم Supabase (المفتاح العام في `platform/js/config.js`).

---

## 📌 ملاحظات

- **لا حذف**: كل النسخ القديمة محفوظة كاملة في `archive/`.
- **OpenMausBot** في `vendor/` هو تطبيق خارجي (مِلكية Milind Soni) مُضاف كما هو للحفاظ عليه — ليس جزءاً من كود CHRAIM.
- المعطيات مجمّعة من المصادر الرسمية لجامعة ابن زهر (`uiz.ac.ma`) — منصة مستقلة غير رسمية.
