# CHRVVIM CAMPUS — مراجعة تفصيلية للمخطط (عموداً بعمود)

**التاريخ:** 2026-10-17 · **الحالة:** تحليل فقط — **لم يُطبَّق أي تغيير على قاعدة البيانات**

**الطرفان:**
- **A** = `chrvvim-campus/server/supabase/migrations/0001_multinstitution.sql` + `0002_academic_core.sql`
- **B** = `G:\My Drive\CHRVVIM_schema_draft_v1.sql`

**المنهج:** قراءة كاملة للملفين، استخراج كل جدول وأعمدته وقيوده وسياساته، ثم مقابلة كل جدول مشترك عموداً بعمود، وتحديد الحصري والناقص، وفحص السياسات والدوال. كل نتيجة هنا مبنية على نصّ الملفين (لا تخمين).

---

## 1) تغطية كيانات البرومبت (البند 9)

| الكيان المطلوب | A | B | ملاحظة |
|---|---|---|---|
| الجامعات | ❌ | ✅ `universities` | A يفترض جامعة واحدة |
| المؤسسات (كليات/مدارس/معاهد) | ✅ `institutions` (slug) | ✅ `institutions` (uuid+university) | تعارض PK |
| التخصصات/الشعب/المسالك | ✅ `tracks` + `programs` | ✅ `programs` | A أفصل |
| الأسلاك والمستويات | 🟡 `programs.level` نصّي | ✅ `cycles` + `levels` | B أدقّ |
| الفصول الدراسية | ✅ `semesters` | ✅ `semesters` | متوافق |
| السنوات/الفترات الجامعية | ✅ `academic_years` | ✅ `academic_periods` | تسمية مختلفة |
| الأفواج والمجموعات | ✅ `student_groups` + `group_ranges` | ✅ `groups` | A يخزّن النطاقات، B لا |
| سجلات الطلبة (المحدودة) | ✅ `student_roster` | ✅ `student_group_records` + دالة بحث | B أقوى وظيفياً |
| المواد والوحدات | ✅ `courses` | ✅ `subjects` | تسمية مختلفة |
| الأساتذة | ✅ `professors` | ✅ `teachers` | تسمية مختلفة |
| القاعات والمدرجات | ✅ `rooms` | ✅ `rooms` | متوافق |
| الحصص والجداول | ✅ `timetables` + `sessions` | ✅ `sessions` فقط | A يفصل رأس الجدول |
| الوثائق والملفات | ✅ `documents` | ✅ `documents` + `official_sources` | B أدقّ |
| المصادر الرسمية | 🟡 `source_url` مضمّن + `source_checks` | ✅ `official_sources` (جدول مستقل) | B أقوى |
| قواعد توزيع الأفواج | ✅ `group_distribution_rules` | ✅ `group_distribution_rules` | A يضيف جدول النطاقات |
| عمليات الاستيراد | ✅ `imports` + `extracted_records` | ✅ `import_jobs` (بلا staging) | A أقوى للمراجعة |
| نتائج التحقق والتعارضات | ✅ `conflicts` | ✅ `verification_conflicts` | متكافئ |
| سجل تحديث البيانات | ✅ `data_changes` | ✅ `audit_log` | متكافئ |
| الإعلانات | ❌ لا يمسّها | ✅ يوسّع `announcements` | B يربطها أكاديمياً |

**النتيجة:** B يغطّي كيانات أكثر (الجامعات/الأسلاك/المستويات/المصادر المستقلة). A يتفوّق في **تخزين النطاقات الأبجدية** (`group_ranges`) و**منطقة انتظار الاستيراد** (`extracted_records`).

---

## 2) مقارنة عموداً بعمود (الجداول المشتركة)

### 2.1 `institutions`
| العمود | A | B |
|---|---|---|
| المفتاح | `slug text PK` | `id uuid PK` |
| الأب | — | `university_id uuid FK` |
| code | — | `code text` + unique(uni,code) |
| الاسم | `name_ar, name_fr` | `name_ar, name_fr` |
| النوع | `type` (fac/school/inst/university) | — (يُستنتَج من cycles) |
| المدينة | `city_ar` | `city` |
| العناوين | `address, phone, fax, website, website_alt, uiz_url` | `official_url, own_site_url` |
| وصف | `presentation_ar` | — |
| النشر | `published boolean` | `status item_status` + `data_completeness` |
| المصدر | `source_url` (NOT NULL) + `checked_at` | — (عبر `official_sources`) |
| طوابع | `updated_at` | `created_at, updated_at` |

🔴 **غير قابل للتوافق:** نوع المفتاح (text مقابل uuid). كل جدول يشير إلى `institutions` في A يستعمل `institution_slug`، وفي B يستعمل `institution_id uuid`.

### 2.2 `programs`
| العمود | A | B |
|---|---|---|
| المفتاح | `id bigint identity` | `id uuid` |
| الأب | `institution_slug` (text FK) | `institution_id` (uuid FK) + `cycle_id` |
| الاسم | `name_ar, name_fr` | `name_ar, name_fr, degree_label_fr` |
| المستوى | `level text` | `cycle_id` + `duration_semesters` |
| الرابط | — | `official_url, source_note` |
| النشر | `published` | `status` |
| المصدر | `source_url, checked_at` | — |

🔴 تعارض PK. 🟢 B يربط بالسلك (`cycle_id`) وهو مطلوب في البرومبت.

### 2.3 `documents`
| العمود | A | B |
|---|---|---|
| المفتاح | `id bigint` | `id uuid` |
| الأب | `institution_slug` | `institution_id` + `source_id` (FK official_sources) |
| العنوان | `title` | — (يعتمد `doc_type`) |
| النوع | `kind` | `doc_type` |
| الفصل/المسلك | `semester, track` | `academic_period_id` |
| الرابط | `url` | `file_url` + `file_hash` (كشف التكرار/التغيّر) |
| التواريخ | `created_at, checked_at` | `published_date, extracted_at` |
| الموثوقية | `published` | `trust` + `notes` |

🟢 B يتفوّق: `file_hash` (كشف تغيّر الملفات) و`trust`. 🔴 تعارض PK/الأب.

### 2.4 `rooms`
| العمود | A | B |
|---|---|---|
| المفتاح | `id bigint` | `id uuid` |
| الأب | `institution_slug` | `institution_id` |
| الاسم | `name_ar` | `label` |
| إضافي | `kind, capacity, published` | — |
| قيد | unique(inst, name_ar) | unique(inst, label) |
| المصدر | `source_url, checked_at` | — |

🟠 متقارب دلالياً؛ 🟢 A يضيف `kind` و`capacity`.

### 2.5 `sessions` (الحصص)
| العمود | A | B |
|---|---|---|
| المفتاح | `id bigint` | `id uuid` |
| رأس الجدول | `timetable_id FK` (جدول `timetables` منفصل) | ❌ لا يوجد رأس جدول |
| الفوج | `student_group_id FK` | `group_id FK` |
| المادة | `course_id FK` | `subject_id FK` |
| الأستاذ | `professor_id FK` | `teacher_id FK` |
| القاعة | `room_id FK` | `room_id FK` |
| النوع | `session_type` (lecture/td/tp/**exam**/other) | `session_type` (cours/td/tp/autre — **بلا exam**) |
| اليوم | `day_of_week` (1–7) | `weekday` (1–7) |
| الوقت | `start_time, end_time` + check(end>start) | `start_time, end_time` + check(end>start) |
| الفترة | عبر `timetables.academic_year_id` | `academic_period_id` مباشر |
| التواريخ | `checked_at, needs_review` | `published_at, last_verified_at, created_at, updated_at` |
| الموثوقية | `needs_review boolean` | `trust` |

🟠 A يفصل **رأس الجدول** (`timetables`) وهو ضروري للبرومبت §8 (مقارنة نسخ الجدول واعتماد الأحدث). B يدمج كل شيء في `sessions` → **لا يمكن تمثيل «نسختين متعارضتين من الجدول» بسهولة**. 🟢 B يضيف `published_at` (تاريخ نشر الجدول). 🔴 B بلا `exam` في نوع الحصة (ومع ذلك لدينا برنامج تقويمات حقيقي!).

### 2.6 `group_distribution_rules`
| العمود | A | B |
|---|---|---|
| المفتاح | `id bigint` | `id uuid` |
| الأب | `track_id FK` | `program_id FK` |
| الفصل/الفترة | `semester_id` | `semester_id, academic_period_id` |
| النوع | `rule_type text` (حر) | `rule_type` + **check** بقائمة محددة |
| الشرح | `note_ar, note_fr` | `rule_description_ar` (NOT NULL) |
| الموثوقية | `published` | `trust, last_verified_at` |

🟢 B أفضل: قائمة `rule_type` مضبوطة بقيود + شرح إلزامي. 🔴 الأب مختلف (`track` مقابل `program`).

### 2.7 بيانات الطلبة
| الجانب | A `student_roster` | B `student_group_records` |
|---|---|---|
| المفتاح | `id bigint` | `id uuid` |
| الفوج | `student_group_id FK` | `group_id FK` |
| الاسم الأصلي | `full_name_raw` | `full_name_original` (NOT NULL) |
| الاسم المطبَّع | `full_name_norm` | `full_name_normalized` (NOT NULL) + **GIN trigram** |
| معرّف | `cne_hash` (بصمة) | `registration_ref` (نصّ صريح!) |
| المصدر | `source_url, checked_at` | `source_document_id, imported_at, trust` |
| دالة بحث | ❌ | ✅ `find_student_group(q)` (≥3 أحرف، 20 نتيجة) |

🔴 **فرق خصوصية مهم:** B يخزّن `registration_ref` **صريحاً** (رقم تسجيل)، بينما A يخزّن `cne_hash` (بصمة). البرومبت §16 يمنع جمع المعرّفات إلا للضرورة → **A أسلم هنا**. 🟢 B يوفر فهرس trigram ودالة بحث محدودة (يمنع الجرد الجماعي).

---

## 3) حصري في A (غير موجود في B)

1. **`group_ranges`** — تخزين النطاقات الأبجدية الخام (`range_raw`) مع `from_name`/`to_name` و`needs_review`. **B يفتقدها تماماً** → لا يمكن تمثيل النطاقات المستخرجة فعلاً من وثائقك (A'MIL→AHACHTAR …).
2. **`extracted_records`** — منطقة انتظار لكل سجل مستخرَج (payload jsonb + confidence + status). B لديه `import_jobs.summary` فقط → **لا مراجعة سجل-بسجل**.
3. **`timetables`** (رأس الجدول) — لازم لمقارنة نسخ الجدول الزمني.
4. **`institution_leaders`** (المسؤولون)، **`review_queue`** (طابور مراجعة عام)، **`ai_resources`** (موارد مساعد الطالب الموثّقة).
5. `session_type` يشمل **`exam`**.
6. `cne_hash` بدل رقم التسجيل الصريح.

## 4) حصري في B (غير موجود في A)

1. **`universities`** + **`cycles`** + **`levels`** (الأسلاك والمستويات بشكل صريح).
2. **`official_sources`** كجدول مستقل (ناشر/رابط/robots/آخر فحص/الحالة) — يغطي البرومبت §15 و§3.
3. **`import_jobs`** بحقول مقارنة (`rows_new/rows_updated/rows_conflicting`) — يغطي البرومبت §10 (إظهار الجديد/المعدّل/المحذوف).
4. **`audit_log`** (سجل تدقيق إداري شامل).
5. **`trust_status` enum** موحّد (verified_official/auto_extracted/outdated/unavailable/disputed) — يطبّق لغة البرومبت §15 حرفياً.
6. **`item_status` enum** (draft/published/archived) + `data_completeness` (not_started/partial/active) — يغطي البرومبت §4 (واجهة خاصة بالمؤسسات غير المكتملة).
7. **البحث التقريبي**: `pg_trgm` + `unaccent` + دالة `find_student_group` — يغطي البرومبت §6 (الهمزات/الإملاء/الترتيب) ويمنع الجرد الجماعي.
8. توسيع **`announcements`** وربطها بالمؤسسة/الفترة/الوثيقة.
9. دوال `_ensure_policy` / `_ensure_constraint` (idempotency قوي).

## 5) نواقص في A و B معاً (يجب إضافتها)

1. جدول **التقويمات/الامتحانات** صريح (لدينا برنامج تقويمات S1 حقيقي) — A يمرّره عبر `session_type='exam'` (مقبول)، B لا يملك حتى `exam` في القائمة.
2. جدول **الإبلاغ عن خطأ في البيانات** (صفحة 14 من البرومبت) — غير موجود في الاثنين.
3. **تريغرات `updated_at`**: B يعرّف `set_updated_at()` لكن **لا يربطها بأي تريغر** → الأعمدة لن تُحدَّث. (A يعتمد `default now()` فقط.)
4. **تطبيع الأسماء** كطبقة موثّقة (دالة/جدول) — B يستعمل `unaccent` فقط دون قاعدة همزات/تشكيل صريحة.

## 6) أخطاء ومخاطر في B (مكتشفة بالفحص)

| # | المشكلة | الأثر | الإصلاح |
|---|---|---|---|
| B1 | `set_updated_at()` بلا `create trigger` | `updated_at` لا يتحدّث | إضافة تريغر لكل جدول فيه `updated_at` |
| B2 | سياسات القراءة العامة على `sessions/groups/subjects/teachers/documents/rooms` = `true` **بلا ترشيح `trust`** | عرض بيانات `auto_extracted` على أنها مؤكّدة → يخالف البرومبت §15 | `using (trust = 'verified_official')` أو ربط بـ`published` |
| B3 | `groups` مقروءة للعموم حتى لو برنامجها `status='draft'` | تسريب مجموعات مسالك غير منشورة | ربط بسياسة تفحص برنامج الأب |
| B4 | `registration_ref` صريح | خصوصية | استبداله ببصمة (`hash`) كما في A |
| B5 | `find_student_group` تُرجع `full_name_original` للـ anon | كشف أسماء (محدود لكن حقيقي) | إرجاع رمز الفوج فقط، أو اشتراط رقم تسجيل، أو توثيق القرار |
| B6 | `is_admin()` = `SECURITY INVOKER` تقرأ `admins` | إن كان `admins` محمياً بـRLS → `false` دائماً → قفل الكتابة | `SECURITY DEFINER` + `search_path` + revoke/grant |
| B7 | لا قيد `not null` على `groups.trust`/`created_at`؟ (Trust مُعرَّف NOT NULL ✅) — لكن `rooms` بلا `created_at` | تماسك طفيف | إضافة طوابع زمنية |

## 7) مخاطر في A

| # | الملاحظة |
|---|---|
| A1 | `is_admin()` = `SECURITY DEFINER` — يحتاج `revoke execute from public` + `grant to authenticated` (موجود جزئياً) |
| A2 | لا جدول `universities` (توسّع لجامعات أخرى لاحقاً يتطلّب تعديلاً) |
| A3 | `published boolean` أقل دقّة من `trust` + `item_status` |
| A4 | `student_roster` بلا دالة بحث → لا واجهة بحث آمنة للطالب |

## 8) التوصية النهائية (دمج مُقترح)

اعتماد **B كأساس بنيوي** (UUID + `trust_status` + `item_status` + `universities/cycles/levels/official_sources/import_jobs/audit_log` + دوال البحث)، مع **نقل 4 أجزاء من A**:

1. `group_ranges` — نطاقات الأبجدية الخام (`range_raw`, `from_name`, `to_name`, `needs_review`) مرتبطة بـ`groups`.
2. `extracted_records` — منطقة انتظار سجل-بسجل مرتبطة بـ`import_jobs`.
3. `timetables` — رأس جدول زمني (versioning + `conflict_status`) مع ربط `sessions.timetable_id`.
4. `institution_leaders` + `ai_resources` (اختياري لاحقاً).

مع **إصلاحات أمنية إلزامية**: B1–B6 أعلاه، وقرار خصوصية صريح بشأن `registration_ref` و`find_student_group`.

**الأثر:** مخطط واحد متكامل يغطّي البرومبت كاملاً، بلا تعارض، وبمعالجة خصوصية سليمة.

---

## 9) القرارات النهائية (حُسِمت — 2026-10-17) ✅

| # | السؤال | القرار |
|---|---|---|
| 1 | الأساس | **دمج B+A** (التوصية) — نُفِّذ في `0010_canonical_schema.sql` |
| 2 | `registration_ref` | **بصمة للعام + نصّ إداري مقيّد** (`registration_hash` + `student_identity_admin`) |
| 3 | `find_student_group` | **الفوج عاماً + الاسم بتحقّق** (`find_student_group` / `find_student_group_verified`) |
| 4 | `is_admin()` | **إصلاح إلى DEFINER محصَّن** ✅ |

راجع `CHRVVIM_SCHEMA_RECONCILIATION_2026-10-17.md §7` للتفاصيل وما تم تنفيذه.
