# CHRVVIM CAMPUS — fase 1: التدقيق والنسخ الاحتياطي (Audit & Backup)

**المشروع:** CHRVVIM CAMPUS — بوابة جامعية موحّدة (Ibn Zohr University, Morocco)
**تاريخ التدقيق:** 16 أكتوبر 2026
**النطاق:** المرحلة 1 فقط — التدقيق والنسخ الاحتياطي. لا تعديل على ملفات الإنتاج. لا نشر.
**الحالة:** مكتمل — في انتظار قرار المؤسس للمرحلة 2.

---

## الفهرس

| رقم | التقرير | الوصف |
|-----|---------|-------|
| 01 | `REPORT_WEBSITE_1_CHRVVIM0K0L0A0K0.md` | موقع 1 — `chrvvim0k0l0a0k0.netlify.app` (غير متاح — 503) |
| 02 | `REPORT_WEBSITE_2_MRCHRAIMFSJPACHRVVIM.md` | موقع 2 — `mrchraimfsjpachrvvim.netlify.app` (غير متاح — 503) |
| 03 | `REPORT_WEBSITE_3_MR1MOHAMED1CHRAIM.md` | موقع 3 — `mr1mohamed1chraim.netlify.app` (متاح — 200) |
| 04 | `REPORT_COMBINED_COMPARISON.md` | تقرير المقارنة المجمّع بين المواقع الثلاثة |
| 05 | `FEATURES_TO_PRESERVE.md` | قائمة الميزات الموجودة التي يجب الحفاظ عليها |
| 06 | `DUPLICATES_AND_INTEGRATIONS.md` | الميزات المكرّرة وفرص التكامل |
| 07 | `MISSING_FILES_AND_ACCESS.md` | الملفات المفقودة والموارد غير المتاحة |
| 08 | `DEPENDENCIES_AND_SECURITY.md` | التبعيات والمخاوف الأمنية |
| 09 | `BACKUP_AND_RECOVERY_PLAN.md` | خطة النسخ الاحتياطي والاستعادة الموثّقة |
| 10 | `ROADMAP_PHASE2.md` | خارطة طريق أولويّة للمرحلة 2 |
| 11 | `FILE_PROJECT_LINKAGE.md` | ربط كل الملفات والمجلدات بالمشاريع السابقة (تكميلة Phase 1) |
| 12 | `REPORT_MCP_SERVER_AND_SINGLEFILE.md` | خادم MCP (`chrvvim-campus-mcp`) + النسخة أحادية الملف — ربط ومخاطر |

---

## خلفية تنفيذية

### ما تم فعلياً (أدلة وليس افتراضاً)

| ما فُحص | الطريقة | النتيجة |
|---------|---------|---------|
| مجلد العمل المحلي | قراءة كاملة للملفات والمجلدات | يوجد مشروع فعلي في `chrvvim-campus/` + مشاريع فرعية + نسخ احتياطية |
| موقع 1 (`chrvvim0k0l0a0k0.netlify.app`) | طلب HTTP مباشر | **503 Service Unavailable** — لا استجابة |
| موقع 2 (`mrchraimfsjpachrvvim.netlify.app`) | طلب HTTP مباشر | **503 Service Unavailable** — لا استجابة |
| موقع 3 (`mr1mohamed1chraim.netlify.app`) | طلب HTTP مباشر | **200 OK** — بوابة قانونية للعربية RTl تعمل فعلياً |
| صفحة مؤسسات جامعة ابن زهر (`uiz.ac.ma/nos-etablissements`) | طلب HTTP مباشر | متاح — 24 مؤسسة مدرجة |
| النسخة الاحتياطية الحالية | فحص ملفي | `_backups/CHRVVIM_backup_2026-10-16.zip` (6.2 ميغابايت، 96 عنصر) |

### الاستنتاج الرئيسي

المشروع الموحّد (`chrvvim-campus/`) **مكتمل وجاهز تقنياً** (خادم Node + SQLite + لوحة إدارة + 3 لغات + PWA + اختبارات) لكنه **لم يُنشر بعد**. الموقع المنشور حالياً (`mr1mohamed1chraim.netlify.app`) هو النسخة القديمة القائمة على Supabase. هذا يتوافق مع قاعدة "لا نشر دون موافقة المؤسس".

### تكميلة لاحقة (انظر `FILE_PROJECT_LINKAGE.md`)

- ✅ **`dist-ultra.zip` هي حزمة نشر الموقع 2 `mrchraimfsjpachrvvim.netlify.app` (المعطّل 503)** — دليل برمجي: العنوان `دليل الطلبة أكادير — دليل الطالب بكلية الحقوق` و`og:url` يشير إلى ذلك النطاق ونفس مفتاح Supabase. مصدر الموقع 2 **قابل للاسترجاع محلياً** (33 وثيقة PDF، منها 31 فريدة عن المشروع الموحد) وقد فُكّ إلى `_archive/site2-mrchraimfsjpachrvvim/`.
- ✅ `_integration_preview/chrvvim-campus-integration/` نسخة طبق الأصل **100%** من `chrvvim-campus/` (97/97 ملفاً ببصمة MD5 متطابقة) — ليست دمجاً جديداً.
- ✅ `OpenMausBot/` مشروع مفتوح المصدر مستقل (Milind Soni, MIT) — صفر ارتباط بمنظومة CHRVVIM.
- 🔴 **مشروع سابق خارج مساحة العمل** (`C:\...\3D Objects\chrvvim-campus-mcp\`): خادم **MCP** لـ Claude يوفر أداة **نشر على Netlify مباشرة** (`publish_staged_update`) يخالف قاعدة "لا نشر دون موافقة". ينشر `/index.html` فقط، لكن الملف المرافق `chrvvim_campus_founder_updated (1).html` يعتمد على 24 وثيقة PDF خارجية → **خطر كسر الوثائق**. التفاصيل في `REPORT_MCP_SERVER_AND_SINGLEFILE.md`.
- ✅ **نُسخا احتياطياً** (2026-10-16) إلى `_archive/mcp-chrvvim-campus-mcp/` و`_archive/chrvvim_campus_founder_updated-1.html` (متطابقان MD5، مع جرد في `_archive/MANIFEST_external_sources.txt`).

### القرارات المطلوبة من المؤسس ( phase 1 → phase 2 )

1. اعتماد `chrvvim-campus/` كأساس للمشروع الموحّد (التوصية: نعم).
2. تأكيد الحفاظ على المواقع الثلاثة كمداخل مستقلة أو استبدال واحد منها بالمشروع الموحّد.
3. إذن بفحص سياسات RLS للكتابة في Supabase للموقع الحيّ (requires session/admin approval).
4. إذن بالانتقال إلى المرحلة 2 (بنية التكامل).

---

## تكوين المجلدات المقترح (للتطوير الآمن)

```
Default Project/
├─ _backups/                     # نسخ احتياطية أصلية (لا تُلمس)
│   └─ CHRVVIM_backup_2026-10-16.zip
├─ _archive/                     # أرشيف قراءة فقط لمصادر المواقع (لا يُنشر)
│   └─ site2-mrchraimfsjpachrvvim/   # مصدر الموقع 2 (مستخرج من dist-ultra.zip)
├─ _phase1_audit/                # تقارير هذه المرحلة (هذا الملف ومجلداته)
├─ _development/                 # بيئة التطوير المنفصلة (تُنشأ للمرحلة 2)
│   └─ chrvvim-campus/           # نسخة مكررة من المشروع للعمل عليها
├─ _tests/                       # نتائج الاختبارات
├─ _releases/                    # الإصدارات المعتمدة للنشر
├─ chrvvim-campus/               # المشروع الأصلي (يُحفظ كما هو)
├─ _integration_preview/         # معاينة التكامل الحالية
├─ portal-preview/               # معاينة دليل المؤسسات
├─ OpenMausBot/                  # مشروع فرعي (غير مرتبط مباشرة)
├─ netlify.toml                  # إعداد النشر الجذري
└─ .netlify/state.json           # معرف الموقع المرتبط في Netlify
```

---

## إشعار مهم

لم يُعدّل أي ملف إنتاجي خلال هذه المرحلة. لم تُنفَّذ أي عملية نشر أو تغيير إعدادات إنتاج أو DNS. لم يُحذف أي محتوى أو رابط. جميع التقارير تستند إلى أدلة فعلية تم جلبها من الملفات المحلية والمواقع عبر الشبكة.
