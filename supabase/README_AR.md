# قاعدة بيانات Supabase — دليل سريع

الموقع الموحّد كيخدم مع **مشروعين** Supabase (كل واحد مستقل):

| التطبيق | المجلّد | مشروع Supabase | الملف المطلوب |
|---|---|---|---|
| البوابة + لوحة التحكم | `/` و `/portal.html` | `https://idpafbyefrywjixskvvu.supabase.co` | `supabase/01_portal_schema.sql` |
| نظام الإدارة | `/platform/` | `https://uftqrgpzllvqlaztcjbq.supabase.co` | `supabase/02_platform_schema.sql` |

> ملاحظة أمنية: المفاتيح المكتوبة فالموقع هي `publishable / anon` — **عامة بطبيعتها**.
> الأمان الحقيقي هو **Auth + RLS**. عمّر ما تدخل `service_role` فكود الواجهة.

---

## 1) تشغيل مخطط البوابة

1. افتح <https://supabase.com/dashboard> → المشروع `idpafbyefrywjixskvvu`
2. **SQL Editor** → `New query`
3. الصق كامل محتوى `supabase/01_portal_schema.sql` → **Run**

هاد الملف كيصنع:

- `admins` — لائحة المسؤولين (الحارس الوحيد للوحة التحكم)
- `announcements` — الإعلانات (`info / warning / urgent / event`)
- `exam_files` — أرشيف الامتحانات
- دالة `bump_exam_download()` — عدّاد التحميلات
- حاوية تخزين `edu-files` (خاصة) + سياسات الرفع/القراءة/الحذف
- سياسات **RLS** لكل جدول

الملف **آمن لإعادة التشغيل**؛ ما كيحيدش شي بيانات.

## 2) إنشاء أول مسؤول

1. Supabase → **Authentication → Users → Add user** (بريد + كلمة مرور، وفعّل الإيميل)
2. رجع لـ **SQL Editor** وشغّل (بدّل البريد):

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'YOUR_EMAIL@example.com'
on conflict (user_id) do nothing;
```

3. تحقّق:

```sql
select * from public.admins;
```

من بعد، دخل من `/admin.html` بنفس البريد وكلمة المرور.

> ⚠️ إذا ما كانش سطر فـ`admins`، لوحة التحكم غادي تكون فارغة/مرفوضة — هادشي مقصود.

## 3) التحقّق من RLS

شغّل هاد الاستعلام باش تتأكد أن RLS مفعّلة على الجداول الحسّاسة:

```sql
select relname, relrowsecurity
from pg_class
where relname in ('admins','announcements','exam_files');
```

خاص `relrowsecurity = true` فالصفوف الثلاثة.

## 4) مخطط نظام الإدارة (`/platform/`)

الملف: **`supabase/02_platform_schema.sql`** — جداول + RLS + حاويات تخزين،
مستخرج مباشرة من كود `platform/js/*.js` (ماشي تخمين).

الجداول: `profiles, roles, projects, tasks, universities, departments, semesters,
subjects, exams, announcements, contact_messages, edu_questions,
notifications, favorites, activity_log, settings, documents`
+ حاويتين: `documents` (داخلية) و `edu-files` (ملفات الامتحانات).

⚠️ **راجع قبل ما تشغّل**: المشروع `uftqrgpzllvqlaztcjbq` كاين من قبل بجداوله.
الملف كيستعمل `create table if not exists` (إذن ما كيمسّش البيانات)، ولكن سياسات
RLS كتُحذف وكُتعاود تُنشأ. إلا كان المشروع خدّام من قبل، شوف السياسات القديمة قبل،
ولا شغّل غير الأجزاء الناقصة.

من بعد ما تشغّل، عيّن أول مسؤول:

```sql
update public.profiles p
   set role_id = (select id from public.roles where name = 'admin')
 where p.id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');
```

(بدّل `YOUR_EMAIL@example.com` بالبريد الحقيقي. غير `admin` هو اللي كيقدر يبدّل
`role_id` — كاين trigger كيمنع تصعيد الصلاحيات.)
