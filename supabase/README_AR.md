# قاعدة بيانات Supabase — دليل سريع

الموقع الموحّد كيخدم مع **مشروعين** Supabase (كل واحد مستقل):

| التطبيق | المجلّد | مشروع Supabase | الملف المطلوب |
|---|---|---|---|
| البوابة + لوحة التحكم | `/` و `/portal.html` | `https://idpafbyefrywjixskvvu.supabase.co` | `supabase/01_portal_schema.sql` |
| نظام الإدارة | `/platform/` | `https://uftqrgpzllvqlaztcjbq.supabase.co` | مخطط خاص بالمشروع (كاين من قبل) |

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

مشروع `uftqrgpzllvqlaztcjbq` كايخدم من قبل بجداوله الخاصة
(`profiles, roles, projects, tasks, universities, departments, semesters,
subjects, exams, announcements, contact_messages, edu_questions,
notifications, favorites, activity_log, settings, documents`).

إذا بغيتي نولّد ملف SQL كامل لهاد المشروع (نفس المنهج: جداول + RLS + Storage)،
دوّز ليا تأكيد ونولّدو من الكود مباشرة.
