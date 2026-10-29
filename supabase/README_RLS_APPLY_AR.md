# تطبيق Supabase RLS بأمان — CHRAIM

هذه الحزمة لا تنفّذ تغييرات على قاعدة بيانات الإنتاج تلقائيًا، لأن أسماء الجداول والسياسات وصلاحيات Supabase الفعلية يجب مراجعتها قبل التطبيق. لا تضع مفاتيح `service_role` في المستودع أو GitHub Actions.

## قبل التطبيق
1. حدّد ملف migration المقصود في `supabase/migrations/`.
2. خذ نسخة احتياطية مناسبة لبيئة الإنتاج.
3. اختبر migration على مشروع Supabase تجريبي.
4. راجع كل جدول في `public` وتأكد من وجود سياسات ملائمة لكل عملية مطلوبة.
5. طبّق migration من SQL Editor بعد مراجعتها واعتمادها.

## استعلام تشخيصي للـ RLS
شغّل الاستعلام التالي في SQL Editor للقراءة فقط:

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;
```

## تحقق السياسات
```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

لا تعتبر تفعيل RLS وحده كافيًا: اختبر وصول `anon` و`authenticated`، وتأكد أن المستخدم لا يستطيع قراءة أو تعديل صفوف مستخدم آخر. لا تنشئ سياسة عامة `using (true)` أو `with check (true)` إلا إذا كان ذلك مقصودًا ومبررًا.
