# CHRVVIM CAMPUS — تقرير مواءمة مخطط قاعدة البيانات (Reconciliation)

**التاريخ:** 2026-10-17 · **الحالة:** تحليل فقط — **لم يُطبَّق أي تغيير على قاعدة البيانات**

الطرفان:
- **A) مخططي:** `chrvvim-campus/server/supabase/migrations/0001_multinstitution.sql` + `0002_academic_core.sql`
- **B) المسودة المرفقة:** `G:\My Drive\CHRVVIM_schema_draft_v1.sql`

---

## 1) ما فُحص فعلياً (دليل)

فحص مباشر عبر Supabase REST (مفتاح publishable، للقراءة فقط):

| الفحص | النتيجة |
|---|---|
| `GET /rest/v1/` (OpenAPI) | 401 — «Secret API key required» (لا يفصح للـ anon) |
| `admins`, `admin_users`, `announcements` | **200 موجودة** (كلها فارغة `[]`) |
| 19 جدولاً أكاديمياً (institutions, programs, groups, sessions, rooms, student_group_records, official_sources, subjects, teachers, universities, cycles, semesters, academic_periods, import_jobs, audit_log, verification_conflicts, group_distribution_rules, student_roster, documents) | **404 — غير موجودة** |

**استنتاج حاسم:** لا يوجد أي جدول أكاديمي في القاعدة الحيّة. **لا تعارض فعلي** في القاعدة؛ التعارض فقط بين ملفيّ A وبين مسودة B، وكلاهما غير مُطبَّق. لذلك يمكن اختيار مرجع واحد قبل أي تطبيق.

---

## 2) تصحيح مؤكّد: أعمدة `announcements` الحقيقية

بفحص كل عمود مباشرةً (`?select=<col>&limit=1`):

| العمود | النتيجة |
|---|---|
| `title`, `body`, `kind`, `status`, `starts_at`, `ends_at`, `created_at`, `updated_at` | ✅ **موجودة** (200) |
| `content`, `image_url`, `is_published`, `publish_at`, `expire_at` | ❌ **غير موجودة** (400 / 42703) |

- **مسودة B محقّة** في وصفها للأعمدة. وسجلّي السابق كان ناقصاً (لم يذكر `starts_at`/`ends_at`).
- **أثر مباشر:** ملف `chrvvim.talib.aga.ma/supabase/schema.sql` (من جولة سابقة) يضيف `content/image_url/is_published/publish_at/expire_at` — أي أنه **يفترض أعمدة غير موجودة**، ويغفل أن **الجدولة (`starts_at`/`ends_at`) موجودة أصلاً**. يجب تصحيحه لاحقاً ليعتمد `starts_at/ends_at`.

---

## 3) التعارض البنيوي بين A و B (جداول متطابقة الأسماء، مختلفة المخطط)

⚠️ كلاهما يستعمل `create table if not exists`، فمن يُشغَّل أولاً «يفوز» ويُتجاهل تعريف الآخر **بصمت** → تطبيق مكسور.

| الجدول | A (0001/0002) | B (المسودة) | التعارض |
|---|---|---|---|
| `institutions` | PK `slug text` | PK `id uuid` + `university_id` | 🔴 جذري (نوع المفتاح) |
| `programs` | `id bigint`, `institution_slug` | `id uuid`, `institution_id`, `cycle_id` | 🔴 جذري |
| `documents` | `id bigint`, `institution_slug`, `url` | `id uuid`, `institution_id`, `source_id`, `file_hash` | 🔴 جذري |
| `rooms` | `id bigint`, `institution_slug`, `name_ar` | `id uuid`, `institution_id`, `label` | 🔴 جذري |
| `sessions` | `id bigint`, `timetable_id`, `course_id`, `professor_id` | `id uuid`, `group_id`, `subject_id`, `teacher_id` | 🔴 جذري (A يفصل timetable عن sessions، B يدمجهما) |
| `group_distribution_rules` | `id bigint`, `track_id` | `id uuid`, `program_id` | 🔴 جذري |
| الأساتذة | `professors` | `teachers` | 🟠 اسم مختلف |
| المواد | `courses` | `subjects` | 🟠 اسم مختلف |
| الأفواج | `student_groups` | `groups` | 🟠 اسم مختلف |
| بيانات الطلبة | `student_roster` (بلا دالة بحث) | `student_group_records` + دالة `find_student_group` | 🟠 B أقوى |
| الفصول/السنوات | `semesters`, `academic_years` | `semesters`, `academic_periods` | 🟠 اسم مختلف |
| تشفير الحالة | `published boolean` | `trust_status` enum + `item_status` enum | 🟠 B أدقّ |
| `is_admin()` | `SECURITY DEFINER` | `SECURITY INVOKER` | 🔴 **تعارض أمني سلوكي** |
| جداول إضافية عند B | — | `universities`, `cycles`, `levels`, `official_sources`, `import_jobs`, `verification_conflicts`, `audit_log`, مهارات `pg_trgm`/`unaccent` | 🟢 B أغنى |

**خلاصة:** A و B **غير قابلين للتشغيل معاً**. B أكمل وأقرب لروح البرومبت الرئيسي (البندان 9 و15: المصادر، الموثوقية، الفصل بين المستخرَج والمعتمد، منع الجرد الجماعي للأسماء).

---

## 4) ملاحظات أمنية/خصوصية تحتاج قراراً (لا أتجاهلها)

1. **`is_admin()` — فرق سلوكي خطير.**
   - في B: `SECURITY INVOKER` تقرأ `public.admins` بصلاحية المُستدعي. إن كان `admins` محمياً بـ RLS بلا سياسة قراءة للمُستدعي → **تعود `false` دائماً** → لا يستطيع أي مسؤول الكتابة (تطبيق مقفل). الحل الشائع: `SECURITY DEFINER` + `set search_path = public` + `revoke execute from public` + `grant execute to authenticated`.
   - في A: `SECURITY DEFINER` (يتفادى المشكلة) لكن يحتاج نفس التحصين.
2. **`find_student_group` تُرجع `full_name_original` للـ anon.** هي محدودة (≥3 أحرف، 20 نتيجة) وهذا يمنع الجرد الجماعي، لكنها **تكشف أسماء طلبة للعموم** عبر البحث. البرومبت يمنع «القوائم الكاملة القابلة للتنزيل» — والبحث المحدود مبرَّر وظيفياً، لكن يجب توثيق القرار صراحةً (وأفضل: إعادة رمز الفوج + المؤسسة دون الاسم الكامل، أو مطالبة برقم تسجيل).
3. **`admins` / `admin_users` مقروءان عبر REST (200).** لا يمكن الجزم إن كان السبب غياب RLS أم سياسة مُمرِّرة، لأن PostgREST يُرجع `[]` في الحالتين. **يجب فحص RLS على هذين الجدولين** (وخاصة أنهما موجودان ومسودة B تعتمد عليهما).
4. **دالة `rls_auto_enable()`** المذكورة في تعليقات المسودة كموجودة في القاعدة بصلاحية تنفيذ غير مقيّدة — **تحتاج تحقّقاً** (لم أستطع فحصها عبر REST).

---

## 5) التوصية

**اعتماد المسودة B (`CHRVVIM_schema_draft_v1.sql`) كمرجع وحيد** (canonical)، مع:
- إيقاف اعتماد `0001_multinstitution.sql` و `0002_academic_core.sql` كملفَّي تطبيق (يبقيان في المستودع كسجلّ فقط) لتجنّب التعارض.
- تصحيح `is_admin()` إلى النمط المحصَّن (`SECURITY DEFINER` + `search_path` + `revoke/grant`).
- توثيق قرار خصوصية `find_student_group` قبل التطبيق.
- فحص RLS على `admins`/`admin_users`.
- تصحيح `chrvvim.talib.aga.ma/supabase/schema.sql` ليعتمد `starts_at/ends_at` بدل الأعمدة غير الموجودة.

> لا أنفّذ أي شيء قبل موافقتك الصريحة (تغيير مخطط قاعدة البيانات = قرار غير قابل للتراجع بسهولة).

---

## 6) خطة العمل المقترحة بعد الموافقة

1. اعتماد A أو B أو دمج محدّد.
2. تعديل ملف المخطط النهائي (نفس الإصلاحات الأمنية أعلاه).
3. تشغيله يدوياً في Supabase SQL Editor (أو أُعِدّ خطوات دقيقة لتشغيله من هنا بموافقتك).
4. ربط `ingest/to_sql.py` ليطابق أسماء الجداول النهائية (مثلاً `groups`/`student_group_records` بدل `student_groups`/`student_roster`).
5. ربط الواجهة بالمخطط النهائي.

---

## 7) القرارات المُعتمَدة والتنفيذ (2026-10-17) ✅

بعد **مراجعة تفصيلية عموداً بعمود** (انظر `CHRVVIM_SCHEMA_DETAILED_REVIEW_2026-10-17.md`)، اتّخذ المالك القرارات التالية ونُفّذت:

| القرار | الاختيار |
|---|---|
| الأساس | **دمج B+A**: أساس B + نقل `group_ranges` و`extracted_records` و`timetables` و`session_type='exam'` من A |
| معرّف الطالب | **بصمة `registration_hash` للعام + نصّ صريح في جدول إداري مقيّد** (`student_identity_admin`) |
| نتيجة البحث | **الفوج عاماً** (`find_student_group`) + **الاسم فقط بتحقّق رقم تسجيل** (`find_student_group_verified`) |
| `is_admin()` | **SECURITY DEFINER محصَّن** (`search_path` + `revoke from public` + `grant to authenticated`) |

### ما تم تنفيذه فعلاً
1. **أُنشئ `chrvvim-campus/server/supabase/migrations/0010_canonical_schema.sql`** — المخطط المرجعي الموحّد (لم يُطبَّق على القاعدة):
   - 24 جدولاً، 5 دوال، 29 سياسة RLS، تريغر `updated_at`، فهارس trigram.
   - إصلاحات B1–B6 مدمجة (تريغرات، ترشيح `trust='verified_official'` في القراءة العامة، قفل برامج `draft`، بصمة بدل نصّ، دالتا بحث منفصلتان، `is_admin` محصَّن).
   - إضافة `data_error_reports` (كان ناقصاً في A و B).
   - بيانات مرجعية مؤكّدة فقط: جامعة ابن زهر، 3 أسلاك، S1–S10، وكلية FSJES-أكادير.
2. **عُلّم `0001_multinstitution.sql` و`0002_academic_core.sql` بـ SUPERSEDED** (بقيان سجلاً، لا يُشغَّلان).
3. **حُدِّث `ingest/to_sql.py`** ليطابق المخطط (`import_jobs` + `extracted_records.import_job_id`)، وأُعيد توليد `out/sql/seed_staging.sql` (6 سجلات `pending`، مُتحقَّق منها).
4. **صُحِّح `chrvvim.talib.aga.ma/supabase/schema.sql`**: كان يخترع أعمدة غير موجودة (`content, image_url, is_published, publish_at, expire_at`) وسياسة RLS تُخفي كل الإعلانات. الآن يعتمد الأعمدة الحقيقية (`status`, `starts_at`, `ends_at`) ويضيف `id` المفقود. كذلك حُسِّن `assets/js/announcements.js` ليستعمل الأعمدة المؤكّدة (فحص مباشر 2026-10-17).

### التحقّق المُنجَز (فعلي)
- **مُحلِّل PostgreSQL (`pglast`)**: الملفات الأربعة (`0010`, `seed_staging`, `0001`, `0002`) + `schema.sql` → كلها تجتاز بلا أخطاء صرفية.
- **`node --check`** على `announcements.js` → سليم.
- **فحص مباشر لـ Supabase REST**: تأكيد أعمدة `announcements` و`admins`.
- **إعادة توليد** `seed_staging.sql` والتحقق من 6 سجلات `pending`.
- ⚠️ لم يُطبَّق أي شيء على قاعدة البيانات الحيّة (بانتظار المالك).

### ما تبقّى (يحتاج المالك)
- **مراجعة `0010_canonical_schema.sql`** ثم تشغيله يدوياً في Supabase SQL Editor.
- تشغيل `ingest/out/sql/seed_staging.sql` بعده (منطقة انتظار المراجعة).
- لاحقاً: واجهة مراجعة إدارية تُرقّي `extracted_records` (approved) إلى الجداول المنشورة بـ`trust='verified_official'`.
- تصحيح `chrvvim.talib.aga.ma/supabase/schema.sql` → `starts_at/ends_at` بدل الأعمدة غير الموجودة.
