-- ============================================================================
--  CHRVVIM Campus — مخطط مشروع نظام الإدارة (/platform/)
--  المشروع:  https://uftqrgpzllvqlaztcjbq.supabase.co
--
--  ⚠️  مهم قبل التشغيل:
--    * هذا مخطط "تركيب جديد" (fresh install). كل الجداول بـ`if not exists`
--      إذن ما غاديش تمس أي بيانات موجودة.
--    * ولكن سياسات RLS كتُحذف وتُعاد إنشاؤها. إلا كان المشروع خدّام من قبل،
--      راجع السياسات قبل ما تشغّل، ولا شغّل غير الأجزاء الناقصة.
--    * الأعمدة مستخرجة من كود platform/js/*.js فهاد المستودع.
--
--  التشغيل: Supabase → SQL Editor → New query → الصق → Run
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) الأدوار (roles)
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  name_ar     text,
  permissions jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

insert into public.roles (name, name_ar, permissions) values
  ('admin',  'مدير النظام', '{"admin":true}'::jsonb),
  ('editor', 'محرّر',       '{}'::jsonb),
  ('viewer', 'مشاهدة',      '{}'::jsonb)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- 2) الملفات الشخصية (profiles)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  full_name_ar text,
  name_ar      text,
  email        text,
  avatar_url   text,
  role_id      uuid references public.roles(id) on delete set null,
  is_active    boolean not null default true,
  last_login   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3) الدوال المساعدة (بعد ما وجدت الجداول اللي كتعتمد عليها)
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles p
      join public.roles r on r.id = p.role_id
     where p.id = auth.uid()
       and (
            lower(coalesce(r.name, '')) in ('admin','administrator','owner')
            or (r.permissions ->> 'admin')::boolean is true
            or (r.permissions ->> 'is_admin')::boolean is true
           )
  );
$$;

grant execute on function public.is_platform_admin() to anon, authenticated;

-- حماية من تصعيد الصلاحيات: مستعمل عادي ما يقدرش يبدّل role_id
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role_id is distinct from old.role_id
     and not public.is_platform_admin() then
    raise exception 'غير مسموح بتغيير الدور (role_id)';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- إنشاء الملف الشخصي تلقائياً عند تسجيل حساب جديد
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, full_name_ar, name_ar, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'full_name_ar',
    new.raw_user_meta_data ->> 'full_name_ar',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4) سياسات RLS: الأدوار والملفات الشخصية
-- ---------------------------------------------------------------------------
alter table public.roles    enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "roles_read" on public.roles;
create policy "roles_read" on public.roles
  for select to authenticated using (true);

drop policy if exists "roles_admin_write" on public.roles;
create policy "roles_admin_write" on public.roles
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 5) الجداول المرجعية: الجامعات · الأقسام · الفصول · المواد
-- ---------------------------------------------------------------------------
create table if not exists public.universities (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique,
  name_ar    text not null,
  name_fr    text,
  city       text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id            uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete cascade,
  slug          text,
  name_ar       text not null,
  name_fr       text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_departments_university on public.departments(university_id);

create table if not exists public.semesters (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique,
  name_ar    text not null,
  name_fr    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete cascade,
  semester_id   uuid references public.semesters(id) on delete set null,
  slug          text unique,
  code          text,
  name_ar       text not null,
  name_fr       text,
  teacher       text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_subjects_department on public.subjects(department_id);
create index if not exists idx_subjects_semester   on public.subjects(semester_id);

do $$
declare t text;
begin
  foreach t in array array['universities','departments','semesters','subjects'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read', t);

    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())',
      t || '_admin_write', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 6) الامتحانات (exams)
-- ---------------------------------------------------------------------------
create table if not exists public.exams (
  id              uuid primary key default gen_random_uuid(),
  subject_id      uuid references public.subjects(id) on delete cascade,
  exam_type       text not null default 'exam'
                  check (exam_type in ('exam','assignment')),
  year            integer,
  session         text not null default 'normal'
                  check (session in ('normal','makeup')),
  has_correction  boolean not null default false,
  file_path       text not null,
  correction_path text,
  downloads       integer not null default 0,
  status          text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
  contributed_by  uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_exams_subject on public.exams(subject_id);
create index if not exists idx_exams_status  on public.exams(status, year desc, created_at desc);

alter table public.exams enable row level security;

drop policy if exists "exams_read" on public.exams;
create policy "exams_read" on public.exams
  for select to anon, authenticated
  using (status = 'approved' or public.is_platform_admin() or contributed_by = auth.uid());

drop policy if exists "exams_insert_pending" on public.exams;
create policy "exams_insert_pending" on public.exams
  for insert to authenticated
  with check (status = 'pending' and contributed_by = auth.uid() and downloads = 0);

-- عدّاد التحميلات للجميع (بدون كشف باقي الأعمدة)
create or replace function public.bump_exam_download(exam_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.exams set downloads = downloads + 1
   where id = exam_id and status = 'approved';
$$;
grant execute on function public.bump_exam_download(uuid) to anon, authenticated;

drop policy if exists "exams_admin" on public.exams;
create policy "exams_admin" on public.exams
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 7) الإعلانات (announcements)
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id            uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete set null,
  title_ar      text not null,
  title_fr      text,
  body          text,
  category      text default 'info',
  link          text,
  is_published  boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_ann_published on public.announcements(is_published, published_at desc);

alter table public.announcements enable row level security;

drop policy if exists "ann_read" on public.announcements;
create policy "ann_read" on public.announcements
  for select to anon, authenticated
  using (is_published or public.is_platform_admin());

drop policy if exists "ann_admin_write" on public.announcements;
create policy "ann_admin_write" on public.announcements
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 8) أسئلة الطلبة (edu_questions)
-- ---------------------------------------------------------------------------
create table if not exists public.edu_questions (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid references public.subjects(id) on delete set null,
  asker_name   text,
  question     text not null,
  answer       text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists idx_questions_subject on public.edu_questions(subject_id, is_published);

alter table public.edu_questions enable row level security;

drop policy if exists "q_read" on public.edu_questions;
create policy "q_read" on public.edu_questions
  for select to anon, authenticated
  using (is_published or public.is_platform_admin());

drop policy if exists "q_insert_any" on public.edu_questions;
create policy "q_insert_any" on public.edu_questions
  for insert to anon, authenticated
  with check (is_published = false and answer is null);

drop policy if exists "q_admin_write" on public.edu_questions;
create policy "q_admin_write" on public.edu_questions
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 9) رسائل التواصل (contact_messages)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "msg_insert_any" on public.contact_messages;
create policy "msg_insert_any" on public.contact_messages
  for insert to anon, authenticated with check (true);

drop policy if exists "msg_admin_read" on public.contact_messages;
create policy "msg_admin_read" on public.contact_messages
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 10) المشاريع والمهام (projects · tasks)
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  name_ar     text,
  description text,
  owner_id    uuid references public.profiles(id) on delete set null,
  status      text not null default 'active',
  created_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  description text,
  priority    text not null default 'medium',
  status      text not null default 'pending',
  due_date    date,
  project_id  uuid references public.projects(id) on delete cascade,
  assigned_to uuid,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint tasks_assigned_to_fkey foreign key (assigned_to)
    references public.profiles(id) on delete set null
);
create index if not exists idx_tasks_project on public.tasks(project_id);

do $$
declare t text;
begin
  foreach t in array array['projects','tasks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_staff_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_staff_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_staff_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())',
      t || '_staff_write', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 11) الموظفون (employees) — بيانات حسّاسة: للمسؤول فقط
-- ---------------------------------------------------------------------------
create table if not exists public.employees (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  full_name_ar  text,
  job_title     text,
  job_title_ar  text,
  department    text,
  department_ar text,
  email         text,
  phone         text,
  salary        numeric,
  hire_date     date,
  created_at    timestamptz not null default now()
);

alter table public.employees enable row level security;

drop policy if exists "emp_admin_only" on public.employees;
create policy "emp_admin_only" on public.employees
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 12) الإشعارات والمفضّلات (notifications · favorites)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  body       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notifications(user_id, is_read);

create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  exam_id    uuid not null references public.exams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, exam_id)
);

alter table public.notifications enable row level security;
alter table public.favorites     enable row level security;

drop policy if exists "notif_own" on public.notifications;
create policy "notif_own" on public.notifications
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "fav_own" on public.favorites;
create policy "fav_own" on public.favorites
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 13) المستندات (documents)
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  path        text not null,
  size        bigint,
  mime_type   text,
  category    text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "doc_staff_read" on public.documents;
create policy "doc_staff_read" on public.documents
  for select to authenticated using (true);

drop policy if exists "doc_admin_write" on public.documents;
create policy "doc_admin_write" on public.documents
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 14) سجل النشاط (activity_log)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  action     text,
  entity     text,
  entity_id  text,
  details    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_created on public.activity_log(created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "log_insert_self" on public.activity_log;
create policy "log_insert_self" on public.activity_log
  for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "log_staff_read" on public.activity_log;
create policy "log_staff_read" on public.activity_log
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 15) الإعدادات (settings)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key         text primary key,
  value       jsonb,
  description text,
  updated_at  timestamptz not null default now()
);

insert into public.settings (key, value, description) values
  ('site_name',     '{"ar":"منصة الطلبة","en":"Students Platform"}'::jsonb, 'اسم الموقع'),
  ('site_language', '{"default":"ar","available":["ar","en"]}'::jsonb,       'اللغة الافتراضية')
on conflict (key) do nothing;

alter table public.settings enable row level security;

drop policy if exists "settings_read" on public.settings;
create policy "settings_read" on public.settings
  for select to anon, authenticated using (true);

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 16) التخزين: حاويتان — documents (داخلية) · edu-files (ملفات الامتحانات)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('documents', 'documents', false),
  ('edu-files', 'edu-files', false)
on conflict (id) do nothing;

-- documents: قراءة ورفع للفريق المسجّل، حذف للمسؤول
drop policy if exists "obj_documents_read" on storage.objects;
create policy "obj_documents_read" on storage.objects
  for select to authenticated using (bucket_id = 'documents');

drop policy if exists "obj_documents_insert" on storage.objects;
create policy "obj_documents_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');

drop policy if exists "obj_documents_delete" on storage.objects;
create policy "obj_documents_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.is_platform_admin());

-- edu-files: قراءة للجميع (تحميل عبر رابط موقّع)، رفع للطلبة المسجّلين، إدارة للمسؤول
drop policy if exists "obj_edufiles_read" on storage.objects;
create policy "obj_edufiles_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'edu-files');

drop policy if exists "obj_edufiles_insert" on storage.objects;
create policy "obj_edufiles_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'edu-files');

drop policy if exists "obj_edufiles_admin" on storage.objects;
create policy "obj_edufiles_admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'edu-files' and public.is_platform_admin())
  with check (bucket_id = 'edu-files' and public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 17) الجرافات (Data API)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.universities, public.departments, public.semesters,
                public.subjects, public.announcements, public.settings,
                public.exams, public.edu_questions
  to anon, authenticated;
grant insert on public.edu_questions, public.contact_messages to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ============================================================================
-- 18) الخطوة الأخيرة: عيّن أول مسؤول
-- ----------------------------------------------------------------------------
--   a) Authentication → Users → Add user (بريد + كلمة مرور)
--   b) ثم هنا:
--   update public.profiles p
--      set role_id = (select id from public.roles where name = 'admin')
--    where p.id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');
--
--   تحقّق:
--   select p.email, r.name from public.profiles p
--     left join public.roles r on r.id = p.role_id;
-- ============================================================================
