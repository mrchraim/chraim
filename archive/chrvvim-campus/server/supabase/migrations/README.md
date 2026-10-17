# CHRVVIM CAMPUS — ترحيلات قاعدة البيانات (Supabase / PostgreSQL)

> ⚠️ **لا يُشغّل أي ملف هنا تلقائياً.** كلها مسوّدات يراجعها المالك ثم ينفّذها يدوياً في
> Supabase → SQL Editor. لا كتابة مباشرة على القاعدة المعتمدة من أي عملية آلية.

## المرجع الوحيد (Canonical)

**`0010_canonical_schema.sql`** هو المخطط المرجعي الوحيد المعتمد.
يجمع مسودة المالك (`CHRVVIM_schema_draft_v1.sql`) مع الترحيلات القديمة (0001/0002)
مع إصلاحات أمنية، بناءً على قرارات المالك في 2026-10-17.

| الملف | الحالة | ملاحظة |
|---|---|---|
| `0001_multinstitution.sql` | 🛑 **مُستبدَل (SUPERSEDED)** | سجلّ تاريخي فقط — لا تشغّله |
| `0002_academic_core.sql`   | 🛑 **مُستبدَل (SUPERSEDED)** | سجلّ تاريخي فقط — لا تشغّله |
| **`0010_canonical_schema.sql`** | ✅ **المرجع الوحيد** | شغّله أولاً |
| `../../ingest/out/sql/seed_staging.sql` | ✅ مُولَّد | شغّله **بعد** 0010 |

### سبب الاستبدال
`0001`/`0002` عرّفا جداول بنفس أسماء المسودة لكن بمخططات متعارضة
(PK نصّي مقابل UUID، جداول متطابقة الأسماء) — تشغيلهما معاً يسبب تجاهلاً صامتاً
لأحد التعريفين وتطبيقاً مكسوراً.

## ترتيب التنفيذ (يدوياً)

```sql
-- 1) المخطط المرجعي (24 جدولاً + RLS + دوال البحث + بيانات مرجعية مؤكّدة)
--    شغّل محتوى: server/supabase/migrations/0010_canonical_schema.sql

-- 2) منطقة انتظار المراجعة (مُولَّدة من الاستخراج — status='pending')
--    شغّل محتوى: ingest/out/sql/seed_staging.sql
```

## المخطط المرجعي — نظرة عامة

**مرجع أكاديمي:** `universities`, `institutions`, `cycles`, `levels`,
`academic_periods`, `semesters`.

**مسالك وأفواج:** `programs`, `groups`, `group_distribution_rules`, `group_ranges`.

**طلبة (محدود/مقيّد):** `student_group_records` (بصمة، بلا نصّ صريح)،
`student_identity_admin` (نصّ رقم التسجيل — إداري فقط).

**جدولة:** `timetables` (رأس الجدول/النسخ), `sessions`, `subjects`, `teachers`, `rooms`.

**مصادر واستيراد:** `official_sources`, `documents`, `import_jobs`,
`extracted_records`, `verification_conflicts`, `audit_log`, `data_error_reports`.

**موسّع:** `announcements` (أعمدة ربط إضافية فقط — لا تُغيَّر سياساته الحيّة).

### حالات الموثوقية (`trust_status`)
`verified_official` · `auto_extracted` · `outdated` · `unavailable` · `disputed`

> القراءة العامة (`anon`) مقصورة على `verified_official` + العناصر المنشورة فقط.
> لا يُنشر أي شيء مُستخرَج آلياً قبل اعتماد المسؤول.

### دوال البحث الآمن
- `find_student_group(q)` → رمز الفوج + المؤسسة + المسلك + الفصل (بلا اسم). ≥3 أحرف، 20 نتيجة.
- `find_student_group_verified(q, reg_ref)` → الاسم **فقط** عند مطابقة رقم التسجيل (بصمة SHA-256).

### إصلاحات أمنية مدمجة (كانت أخطاء في المسودة)
| # | الإصلاح |
|---|---|
| B1 | `set_updated_at()` مربوط بتريغرات فعلية (`updated_at` يتحدّث) |
| B2 | سياسات القراءة العامة ترشّح `trust='verified_official'` |
| B3 | لا تُقرأ أفواج/جلسات برنامج `status <> 'published'` |
| B4 | لا يُخزَّن رقم التسجيل صريحاً في الجدول العام (بصمة فقط) |
| B5 | الاسم لا يُكشف إلا بتحقّق رقم تسجيل |
| B6 | `is_admin()` = `SECURITY DEFINER` + `search_path` + `revoke/grant` |

## ملاحظات تنفيذية
- الملفات **idempotent**: إعادة التشغيل آمنة (`create ... if not exists`، `drop policy if exists`).
- إن كان `public.is_admin()` موجوداً بتوقيع مختلف، احذفه أولاً (`drop function public.is_admin();`).
- الجدول المرجعي للمسؤولين هو **`public.admins`** (يوجد أيضاً `admin_users` — يُفضّل توحيدهما لاحقاً).
- تحقّق صرفي: الملفات الأربعة اجتازت مُحلِّل PostgreSQL (`pglast`). لم تُنفَّذ على قاعدة حيّة بعد.
