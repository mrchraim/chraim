# تفعيل قاعدة البيانات (Supabase) — خطوات دقيقة

**الهدف:** تفعيل لوحة التحكم والبيانات الحيّة عبر تشغيل المخطط المرجعي الموحّد.
**المشروع المستهدف:** `https://idpafbyefrywjixskvvu.supabase.co` (المستخدم في `data/live-config.json`).

> ⚠️ الملفات idempotent (آمنة لإعادة التشغيل) لكن **شغّلها كاملةً في استعلام واحد** لأن كل ملف داخل معاملة (begin/commit): إن فشل سطر، لا يُطبَّق أي شيء — وهذا أفضل من تطبيق جزئي.
> ⚠️ لا تشغّل `0001_multinstitution.sql` و`0002_academic_core.sql` — **مُستبدَلان** بـ 0010.

---

## المتطلبات المسبقة
امتلك 3 ملفات نصية جاهزة (على جهازك):
1. `chrvvim-campus/server/supabase/migrations/0010_canonical_schema.sql`
2. `chrvvim-campus/ingest/out/sql/seed_staging.sql`
3. `chrvvim.talib.aga.ma/supabase/schema.sql`

---

## الخطوة 1 — المخطط المرجعي (0010)
1. افتح <https://supabase.com/dashboard> → اختر مشروعك.
2. **SQL Editor** → **New query**.
3. افتح `0010_canonical_schema.sql`، انسخ **كل** محتواه والصقه.
4. اضغط **Run**.
5. المتوقّع: `Success. No rows returned` (أو رسائل `select _ensure_policy`).

**تحقّق** (استعلام جديد):
```sql
select count(*) as universities from public.universities;          -- 1
select code, name_ar from public.institutions;                     -- fsjes-agadir
select count(*) as tables_created from information_schema.tables
  where table_schema='public' and table_name in
  ('universities','institutions','cycles','levels','academic_periods','semesters',
   'programs','groups','group_distribution_rules','group_ranges','student_group_records',
   'student_identity_admin','subjects','teachers','rooms','timetables','sessions',
   'official_sources','documents','import_jobs','extracted_records',
   'verification_conflicts','audit_log','data_error_reports');     -- 24
```

---

## الخطوة 2 — منطقة انتظار المراجعة (البيانات المستخرَجة)
1. **SQL Editor** → **New query**.
2. الصق محتوى `ingest/out/sql/seed_staging.sql` → **Run**.
3. المتوقّع: إدخال 6 سجلات في `extracted_records` بحالة `pending`.

**تحقّق:**
```sql
select kind, status, count(*) from public.extracted_records group by 1,2 order by 1;
-- group_distribution | pending | 2
-- exam_schedule      | pending | 1
-- timetable          | pending | 3
```
> هذه **لا تُنشر** حتى يعتمدها مسؤول (طابور المراجعة) — حسب قاعدة المشروع.

---

## الخطوة 3 — ترحيل الإعلانات (أعمدة موجودة أصلاً)
1. الصق محتوى `chrvvim.talib.aga.ma/supabase/schema.sql` → **Run**.
2. يضيف عمود `id` المفقود + سياسة قراءة عامة تعتمد `status` و`starts_at`/`ends_at` الحقيقية.

**تحقّق:**
```sql
select column_name from information_schema.columns
 where table_schema='public' and table_name='announcements'
 order by ordinal_position;
-- يجب أن يظهر id ضمنها
```

---

## الخطوة 4 — التحقّق من الواجهة
1. افتح الموقع (محلياً أو بعد النشر).
2. في Console: يجب أن تختفي أخطاء 404 الخاصة بـ`announcements` (أو تعود مصفوفة فارغة `[]` بدل خطأ).
3. لوحة التحكم `/admin/`: سجّل الدخول عبر Supabase Auth بحساب مسؤول موجود في `public.admins`.

---

## ملاحظات مهمة
- **مفتاح `service_role` ممنوع في الواجهة.** الواجهة تستعمل `publishable` (قراءة فقط) — لا تُضِف غيره في `data/live-config.json`.
- **GDPR/خصوصية:** `student_group_records` و`student_identity_admin` إداريان فقط (لا سياسة قراءة عامة). البحث العام يُرجع **رمز الفوج** فقط؛ والاسم لا يُكشف إلا بمطابقة رقم تسجيل صحيح عبر `find_student_group_verified`.
- **إن ظهر خطأ `function is_admin() already exists`:** نفّذ `drop function if exists public.is_admin();` ثم أعد تشغيل 0010.
- **إن رُفض `create extension pg_trgm`:** شغّله منفصلاً أولاً: `create extension if not exists pg_trgm;`
- **بيانات الطلبة الفعلية غير مضمنة إطلاقاً** — الجداول فارغة بانتظار استيراد موثّق من وثائق رسمية ومراجعة بشرية.

---

## بعد التفعيل — الخطوة التالية المنطقية
بناء **واجهة المراجعة الإدارية** التي تُرقّي `extracted_records` (pending → approved) إلى الجداول المنشورة بـ`trust='verified_official'`، ثم ربط صفحة «البحث عن الفوج» بدالة `find_student_group`.
