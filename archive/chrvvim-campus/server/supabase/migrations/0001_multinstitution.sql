-- ==========================================================================
-- CHRVVIM CAMPUS — مخطط قاعدة البيانات متعدّد المؤسسات (Supabase / PostgreSQL)
-- ==========================================================================
-- 🛑 SUPERSEDED — هذا الملف مُستبدَل بـ 0010_canonical_schema.sql.
--    لا تُشغّله على قاعدة جديدة. أُبقي هنا كسجلّ تاريخي فقط.
--    السبب: كان يتعارض مع المسودة المرجعية (PK نصّي مقابل UUID، جداول متطابقة
--    الأسماء بمخططات مختلفة). المرجع الوحيد الآن هو 0010_canonical_schema.sql.
--
-- ⚠️ لم يُشغَّل هذا الملف. هو مسوّدة مراجَعة يُنفّذها المالك يدوياً في
--    Supabase → SQL Editor بعد المراجعة. لا تُشغّله تلقائياً.
--
-- المبادئ:
--   1) كل صف رسمي يحمل source_url + checked_at (لا معلومة بلا مصدر وتاريخ فحص).
--   2) القراءة العامة (anon) مقصورة على الجداول المنشورة فقط.
--   3) الكتابة مقصورة على المسؤولين المصرّح لهم (RLS) — لا كتابة مجهولة.
--   4) الجداول idempotent (IF NOT EXISTS) حتى يمكن إعادة التشغيل بأمان.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1) المؤسسات (الجامعات/الكليات/المدارس/المعاهد)
-- --------------------------------------------------------------------------
create table if not exists public.institutions (
  slug            text primary key,
  name_ar         text not null,
  name_fr         text,
  type            text not null check (type in ('fac','school','inst','university')),
  city_ar         text,
  address         text,
  phone           text,
  fax             text,
  website         text,
  website_alt     text,
  uiz_url         text,
  presentation_ar text,
  published       boolean not null default false,
  source_url      text not null,
  checked_at      date not null,
  updated_at      timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 2) المسؤولون عن كل مؤسسة (عميد/مدير/كاتب عام …)
-- --------------------------------------------------------------------------
create table if not exists public.institution_leaders (
  id               bigint generated always as identity primary key,
  institution_slug text not null references public.institutions(slug) on delete cascade,
  role_ar          text not null,
  role_fr          text,
  name             text not null,
  sort             int  not null default 0,
  source_url       text not null,
  checked_at       date not null
);
create index if not exists idx_leaders_inst on public.institution_leaders(institution_slug);

-- --------------------------------------------------------------------------
-- 3) التكوينات/المسالك لكل مؤسسة
-- --------------------------------------------------------------------------
create table if not exists public.programs (
  id               bigint generated always as identity primary key,
  institution_slug text not null references public.institutions(slug) on delete cascade,
  name_ar          text not null,
  name_fr          text,
  level            text,
  published        boolean not null default false,
  source_url       text not null,
  checked_at       date not null
);
create index if not exists idx_programs_inst on public.programs(institution_slug);

-- --------------------------------------------------------------------------
-- 4) الوثائق الرقمية (استعمال الزمن، توزيع الأفواج، ملفات PDF …)
-- --------------------------------------------------------------------------
create table if not exists public.documents (
  id               bigint generated always as identity primary key,
  institution_slug text references public.institutions(slug) on delete set null,
  title            text not null,
  kind             text,
  semester         text,
  track            text,
  url              text not null,
  published        boolean not null default false,
  source_url       text not null,
  checked_at       date not null,
  created_at       timestamptz not null default now()
);
create index if not exists idx_documents_inst on public.documents(institution_slug);

-- --------------------------------------------------------------------------
-- 5) سجلّ فحوصات المصادر (كل معلومة لها أثر تحقّق)
-- --------------------------------------------------------------------------
create table if not exists public.source_checks (
  id          bigint generated always as identity primary key,
  entity      text not null,           -- 'institution' | 'program' | 'document' | …
  entity_id   text not null,
  source_url  text not null,
  status      text not null check (status in ('ok','changed','missing','error')),
  notes       text,
  checked_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 6) طابور المراجعة (أي تغيير مُكتشَف ينتظر موافقة بشرية قبل النشر)
-- --------------------------------------------------------------------------
create table if not exists public.review_queue (
  id          bigint generated always as identity primary key,
  entity      text not null,
  entity_id   text not null,
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

-- --------------------------------------------------------------------------
-- 7) موارد مساعد الطالب (كل مورد موثّق: نص/درس/فيديو رسمي فقط)
--     ملاحظة: لا يُضاف أي youtube_id غير مؤكَّد من القناة الرسمية (verified=false).
-- --------------------------------------------------------------------------
create table if not exists public.ai_resources (
  id               bigint generated always as identity primary key,
  scope            text,                 -- 'institution:<slug>' | 'track:<id>' …
  lesson           text,
  title            text not null,
  url              text,
  youtube_id       text,
  verified         boolean not null default false,
  source_url       text not null,
  checked_at       date not null
);

-- ==========================================================================
-- الأمان: تفعيل RLS + سياسات القراءة العامة والكتابة للمسؤولين
-- ==========================================================================
alter table public.institutions        enable row level security;
alter table public.institution_leaders enable row level security;
alter table public.programs            enable row level security;
alter table public.documents           enable row level security;
alter table public.source_checks       enable row level security;
alter table public.review_queue        enable row level security;
alter table public.ai_resources        enable row level security;

-- قراءة عامة للمحتوى المنشور فقط
drop policy if exists "public read institutions" on public.institutions;
create policy "public read institutions" on public.institutions
  for select using (published = true);

drop policy if exists "public read leaders" on public.institution_leaders;
create policy "public read leaders" on public.institution_leaders
  for select using (
    exists (select 1 from public.institutions i where i.slug = institution_slug and i.published = true)
  );

drop policy if exists "public read programs" on public.programs;
create policy "public read programs" on public.programs
  for select using (published = true);

drop policy if exists "public read documents" on public.documents;
create policy "public read documents" on public.documents
  for select using (published = true);

drop policy if exists "public read ai_resources" on public.ai_resources;
create policy "public read ai_resources" on public.ai_resources
  for select using (verified = true);

-- لا قراءة عامة إطلاقاً لسجلّ الفحص ولا طابور المراجعة.
-- (لا سياسة select = لا وصول لغير المسؤولين.)

-- الكتابة للمسؤولين فقط.
-- ⚠️ راجع اسم عمود المستخدم في جدول public.admins لديك؛ هنا نفترض user_id = auth.uid().
--    إن كان الجدول يستعمل عموداً آخر، عدّل الدالة التالية قبل التشغيل.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'institutions','institution_leaders','programs','documents','ai_resources'
  ]
  loop
    execute format('drop policy if exists "admin write %1$s" on public.%1$I;', t);
    execute format(
      'create policy "admin write %1$s" on public.%1$I for all to authenticated
         using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- سجلّ الفحص وطابور المراجعة: قراءة/كتابة للمسؤولين فقط.
drop policy if exists "admin all source_checks" on public.source_checks;
create policy "admin all source_checks" on public.source_checks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all review_queue" on public.review_queue;
create policy "admin all review_queue" on public.review_queue
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ==========================================================================
-- نهاية المخطط. راجعه ثم شغّله يدوياً. لا يمسّ هذا الملف جدولَي
-- announcements / admins الموجودين.
-- ==========================================================================
