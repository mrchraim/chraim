-- =============================================================================
-- CHRVVIM CAMPUS — المخطط المرجعي الموحّد v1  (canonical schema)
-- Canonical relational schema — MERGE of draft B + migrations 0001/0002, with security fixes.
--
-- ⚠️ لم يُطبَّق بعد. يُشغَّل يدوياً في Supabase SQL Editor بعد مراجعة المالك.
-- ملف idempotent: يمكن تشغيله أكثر من مرة بلا خطأ.
--
-- القاعدة:
--   * يبني فوق الجداول الموجودة (admins, admin_users, announcements) ولا يحذف أي شيء.
--   * SUPERSEDES: 0001_multinstitution.sql و 0002_academic_core.sql (يبقيان سجلاً فقط).
--
-- قرارات المالك المطبَّقة هنا:
--   1) أساس B (UUID + trust_status + item_status + universities/cycles/levels/official_sources/
--      import_jobs/audit_log + بحث trigram) مع نقل 4 أجزاء من A:
--      group_ranges، extracted_records، timetables، session_type يشمل exam.
--   2) معرّف الطالب: بصمة (hash) في الجدول العام، والنصّ الصريح في جدول إداري مقيّد فقط.
--   3) find_student_group: تُرجع رمز الفوج للجميع؛ والاسم فقط بعد مطابقة رقم تسجيل صحيح.
--   4) is_admin(): SECURITY DEFINER محصَّن (search_path + revoke/grant) لمنع قفل الكتابة.
--
-- إصلاحات أمنية مدمجة (كانت أخطاء في المسودة B):
--   B1 ربط set_updated_at() بتريغرات فعلية.
--   B2 سياسات القراءة العامة ترشّح trust = 'verified_official'.
--   B3 لا تُقرأ مجموعات/جلسات برنامج status <> 'published'.
--   B4 لا نخزّن رقم التسجيل صريحاً في الجدول العام (بصمة فقط).
--   B5 الاسم لا يُكشف إلا بعد مطابقة رقم تسجيل (دالة منفصلة ومقيّدة).
--   B6 is_admin() DEFINER محصَّن.
-- =============================================================================

begin;

create extension if not exists pgcrypto;
create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- -----------------------------------------------------------------------------
-- 0) الأنواع (ENUMS)
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.trust_status as enum
    ('verified_official','auto_extracted','outdated','unavailable','disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.item_status as enum ('draft','published','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.completeness as enum ('not_started','partial','active');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 1) دوال مساعدة
-- -----------------------------------------------------------------------------

-- طابع تحديث تلقائي (B1: تُربَط بتريغرات في النهاية).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- is_admin: DEFINER محصَّن (B6). يعتمد public.admins(user_id) — مُتحقَّق أنه موجود.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- إنشاء/استبدال سياسة بأمان (idempotent).
create or replace function public._ensure_policy(
  p_name text, p_table text, p_cmd text, p_roles text[], p_using text, p_check text default null
) returns void
language plpgsql
as $$
begin
  execute format('drop policy if exists %I on public.%I', p_name, p_table);
  if p_check is not null then
    execute format('create policy %I on public.%I for %s to %s using (%s) with check (%s)',
                   p_name, p_table, p_cmd, array_to_string(p_roles, ','), p_using, p_check);
  else
    execute format('create policy %I on public.%I for %s to %s using (%s)',
                   p_name, p_table, p_cmd, array_to_string(p_roles, ','), p_using);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2) المرجع الجغرافي/الأكاديمي الأساسي
-- -----------------------------------------------------------------------------
create table if not exists public.universities (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name_ar      text not null,
  name_fr      text,
  website_url  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.institutions (
  id                uuid primary key default gen_random_uuid(),
  university_id     uuid not null references public.universities(id) on delete restrict,
  code              text not null,
  name_ar           text not null,
  name_fr           text,
  type              text,                 -- faculty | school | institute | annex
  city              text,
  region            text,
  official_url      text,
  own_site_url      text,
  data_completeness public.completeness not null default 'not_started',
  status            public.item_status   not null default 'draft',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (university_id, code)
);

create table if not exists public.cycles (
  id       uuid primary key default gen_random_uuid(),
  code     text not null unique,          -- licence | master | doctorat
  name_ar  text not null,
  name_fr  text
);

create table if not exists public.levels (
  id        uuid primary key default gen_random_uuid(),
  cycle_id  uuid not null references public.cycles(id) on delete cascade,
  code      text not null,                -- S1.. / 1A..
  ordinal   int  not null,
  name_ar   text,
  unique (cycle_id, code)
);

create table if not exists public.academic_periods (
  id          uuid primary key default gen_random_uuid(),
  label       text not null unique,       -- 2025-2026
  start_date  date,
  end_date    date,
  is_current  boolean not null default false
);

create table if not exists public.semesters (
  id       uuid primary key default gen_random_uuid(),
  code     text not null unique,          -- S1..S10
  ordinal  int  not null,
  name_ar  text,
  name_fr  text
);

-- -----------------------------------------------------------------------------
-- 3) المسالك والأفواج
-- -----------------------------------------------------------------------------
create table if not exists public.programs (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid not null references public.institutions(id) on delete restrict,
  cycle_id           uuid references public.cycles(id),
  name_ar            text not null,
  name_fr            text,
  degree_label_fr    text,
  duration_semesters int,
  official_url       text,
  source_note        text,
  status             public.item_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.groups (
  id                  uuid primary key default gen_random_uuid(),
  program_id          uuid not null references public.programs(id) on delete cascade,
  level_id            uuid references public.levels(id),
  semester_id         uuid references public.semesters(id),
  academic_period_id  uuid references public.academic_periods(id),
  institution_label   text,               -- التسمية المحلية كما نُشرت ("الفوج A")
  code                text not null,
  track_fr            text,
  source_document_id  uuid,
  trust               public.trust_status not null default 'auto_extracted',
  last_verified_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (program_id, semester_id, academic_period_id, code, track_fr)
);

-- قواعد توزيع الأفواج (B).
create table if not exists public.group_distribution_rules (
  id                    uuid primary key default gen_random_uuid(),
  program_id            uuid not null references public.programs(id) on delete cascade,
  semester_id           uuid references public.semesters(id),
  academic_period_id    uuid references public.academic_periods(id),
  rule_type             text not null check (rule_type in
                          ('alphabetical_name_ranges','registration_order','random_balanced','manual','other')),
  rule_description_ar   text not null,
  source_document_id    uuid,
  trust                 public.trust_status not null default 'auto_extracted',
  last_verified_at      timestamptz,
  created_at            timestamptz not null default now()
);

-- نطاقات الأبجدية الخام — منقولة من A (B كان يفتقدها).
create table if not exists public.group_ranges (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid not null references public.groups(id) on delete cascade,
  sort             int  not null default 0,
  range_raw        text,                  -- النصّ كما استُخرج حرفياً (لا تخمين)
  from_name        text,
  to_name          text,
  needs_review     boolean not null default true,
  trust            public.trust_status not null default 'auto_extracted',
  source_document_id uuid,
  created_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4) سجلات الطلبة (محدودة) + الجدول الإداري المقيّد للمعرّف
-- -----------------------------------------------------------------------------
create table if not exists public.student_group_records (
  id                    uuid primary key default gen_random_uuid(),
  group_id              uuid not null references public.groups(id) on delete cascade,
  full_name_original    text not null,                 -- كما نُشر رسمياً
  full_name_normalized  text not null,                 -- unaccent + تطبيع للبحث
  registration_hash     text,                          -- sha256 — لا نصّ صريح (B4)
  source_document_id    uuid,
  trust                 public.trust_status not null default 'auto_extracted',
  imported_at           timestamptz not null default now()
);
create index if not exists idx_sgr_name_trgm
  on public.student_group_records using gin (full_name_normalized gin_trgm_ops);
create index if not exists idx_sgr_group on public.student_group_records(group_id);

-- الجدول الإداري المقيّد: يحتوي النصّ الصريح لرقم التسجيل. لا قراءة عامة إطلاقاً.
create table if not exists public.student_identity_admin (
  record_id        uuid primary key references public.student_group_records(id) on delete cascade,
  registration_ref text not null,
  created_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5) المواد والأساتذة والقاعات
-- -----------------------------------------------------------------------------
create table if not exists public.subjects (
  id                 uuid primary key default gen_random_uuid(),
  program_id         uuid not null references public.programs(id) on delete cascade,
  semester_id        uuid references public.semesters(id),
  name_ar            text not null,
  name_fr            text,
  code               text,
  unit_index         int,
  trust              public.trust_status not null default 'auto_extracted',
  source_document_id uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.teachers (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid references public.institutions(id) on delete set null,
  full_name          text not null,
  trust              public.trust_status not null default 'auto_extracted',
  source_document_id uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (institution_id, full_name)
);

create table if not exists public.rooms (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  label          text not null,
  kind           text,                    -- amphi | salle | labo
  capacity       int,
  trust          public.trust_status not null default 'auto_extracted',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (institution_id, label)
);

-- -----------------------------------------------------------------------------
-- 6) رأس الجدول الزمني (من A — لازم لمقارنة النسخ) + الحصص (من B)
-- -----------------------------------------------------------------------------
create table if not exists public.timetables (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid references public.institutions(id) on delete set null,
  program_id         uuid references public.programs(id) on delete cascade,
  semester_id        uuid references public.semesters(id),
  academic_period_id uuid references public.academic_periods(id),
  document_id        uuid,
  conflict_status    text not null default 'ok' check (conflict_status in ('ok','conflict','superseded')),
  published_at       timestamptz,
  trust              public.trust_status not null default 'auto_extracted',
  last_verified_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.sessions (
  id                 uuid primary key default gen_random_uuid(),
  timetable_id       uuid references public.timetables(id) on delete cascade,
  group_id           uuid not null references public.groups(id) on delete cascade,
  subject_id         uuid references public.subjects(id) on delete set null,
  teacher_id         uuid references public.teachers(id) on delete set null,
  room_id            uuid references public.rooms(id) on delete set null,
  session_type       text not null default 'cours'
                      check (session_type in ('cours','lecture','td','tp','exam','autre','other')),
  weekday            int  not null check (weekday between 1 and 7),
  start_time         time not null,
  end_time           time not null,
  academic_period_id uuid references public.academic_periods(id),
  trust              public.trust_status not null default 'auto_extracted',
  source_document_id uuid,
  published_at       timestamptz,
  last_verified_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists idx_sessions_group on public.sessions(group_id);
create index if not exists idx_sessions_tt on public.sessions(timetable_id);

-- -----------------------------------------------------------------------------
-- 7) المصادر والوثائق
-- -----------------------------------------------------------------------------
create table if not exists public.official_sources (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid references public.institutions(id) on delete cascade,
  publisher_name  text not null,
  url             text not null,
  source_kind     text,                   -- site | pdf | page | social
  robots_allowed  boolean,
  last_checked_at timestamptz,
  last_status     text,
  created_at      timestamptz not null default now()
);

create table if not exists public.documents (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid references public.institutions(id) on delete cascade,
  source_id          uuid references public.official_sources(id) on delete set null,
  title              text,
  doc_type           text,                -- timetable | group_list | exam_schedule | guide
  file_url           text,
  file_hash          text,
  academic_period_id uuid references public.academic_periods(id),
  published_date     date,
  extracted_at       timestamptz,
  trust              public.trust_status not null default 'auto_extracted',
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 8) الاستيراد والمراجعة والتدقيق
-- -----------------------------------------------------------------------------
create table if not exists public.import_jobs (
  id               uuid primary key default gen_random_uuid(),
  file_name        text,
  file_type        text,
  uploaded_by      uuid,
  status           text not null default 'pending'
                    check (status in ('pending','parsed','reviewed','applied','failed')),
  rows_detected    int not null default 0,
  rows_new         int not null default 0,
  rows_updated     int not null default 0,
  rows_conflicting int not null default 0,
  summary          jsonb,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz
);

-- منطقة انتظار سجل-بسجل — منقولة من A.
create table if not exists public.extracted_records (
  id            uuid primary key default gen_random_uuid(),
  import_job_id uuid references public.import_jobs(id) on delete cascade,
  kind          text not null,            -- group_range | session | subject | exam | teacher
  payload       jsonb not null,
  confidence    numeric(5,4),
  status        text not null default 'pending'
                 check (status in ('pending','approved','rejected','conflict')),
  source_file   text,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);
create index if not exists idx_extracted_status on public.extracted_records(status);

create table if not exists public.verification_conflicts (
  id                     uuid primary key default gen_random_uuid(),
  entity_table           text not null,
  entity_id              uuid,
  description_ar         text not null,
  conflicting_source_ids uuid[],
  status                 text not null default 'open' check (status in ('open','resolved','ignored')),
  detected_at            timestamptz not null default now(),
  resolved_by            uuid,
  resolved_at            timestamptz,
  resolution_note        text
);

create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  table_name  text not null,
  record_id   uuid,
  action      text not null,
  changed_by  uuid,
  changed_at  timestamptz not null default now(),
  before_data jsonb,
  after_data  jsonb
);

-- الإبلاغ عن خطأ في البيانات (صفحة 14 — كان ناقصاً في A و B معاً).
create table if not exists public.data_error_reports (
  id             uuid primary key default gen_random_uuid(),
  page_path      text,
  entity_table   text,
  entity_id      uuid,
  message        text not null,
  reporter_email text,
  status         text not null default 'new' check (status in ('new','triaged','fixed','rejected')),
  created_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 9) توسيع announcements (أعمدة فقط — لا نغيّر سياساته الحيّة)
-- -----------------------------------------------------------------------------
alter table public.announcements
  add column if not exists institution_id     uuid references public.institutions(id) on delete set null,
  add column if not exists academic_period_id uuid references public.academic_periods(id) on delete set null,
  add column if not exists source_document_id uuid references public.documents(id) on delete set null;

-- =============================================================================
-- 10) RLS + سياسات (B2/B3: القراءة العامة ترشّح trust و published)
-- =============================================================================

alter table public.universities             enable row level security;
alter table public.institutions             enable row level security;
alter table public.cycles                   enable row level security;
alter table public.levels                   enable row level security;
alter table public.academic_periods         enable row level security;
alter table public.semesters                enable row level security;
alter table public.programs                 enable row level security;
alter table public.groups                   enable row level security;
alter table public.group_distribution_rules enable row level security;
alter table public.group_ranges             enable row level security;
alter table public.student_group_records    enable row level security;
alter table public.student_identity_admin   enable row level security;
alter table public.subjects                 enable row level security;
alter table public.teachers                 enable row level security;
alter table public.rooms                    enable row level security;
alter table public.timetables               enable row level security;
alter table public.sessions                 enable row level security;
alter table public.official_sources         enable row level security;
alter table public.documents                enable row level security;
alter table public.import_jobs              enable row level security;
alter table public.extracted_records        enable row level security;
alter table public.verification_conflicts   enable row level security;
alter table public.audit_log                enable row level security;
alter table public.data_error_reports       enable row level security;

-- 10.1 مرجع عام (غير حسّاس)
select public._ensure_policy('p_read','universities','select', array['anon','authenticated'], 'true');
select public._ensure_policy('p_read','institutions','select', array['anon','authenticated'], $$status = 'published'$$);
select public._ensure_policy('p_read','cycles','select', array['anon','authenticated'], 'true');
select public._ensure_policy('p_read','levels','select', array['anon','authenticated'], 'true');
select public._ensure_policy('p_read','academic_periods','select', array['anon','authenticated'], 'true');
select public._ensure_policy('p_read','semesters','select', array['anon','authenticated'], 'true');

-- 10.2 برامج: منشورة فقط.
select public._ensure_policy('p_read','programs','select', array['anon','authenticated'], $$status = 'published'$$);

-- 10.3 أفواج: مؤكّدة فقط + برنامجها منشور (B2/B3).
select public._ensure_policy('p_read','groups','select', array['anon','authenticated'],
  $$trust = 'verified_official' and exists (
      select 1 from public.programs p where p.id = groups.program_id and p.status = 'published')
  $$);

select public._ensure_policy('p_read','group_distribution_rules','select', array['anon','authenticated'],
  $$trust = 'verified_official'$$);
select public._ensure_policy('p_read','group_ranges','select', array['anon','authenticated'],
  $$trust = 'verified_official' and needs_review = false$$);

-- 10.4 مواد/أساتذة/قاعات/جلسات: مؤكّدة فقط (B2).
select public._ensure_policy('p_read','subjects','select', array['anon','authenticated'],
  $$trust = 'verified_official'$$);
select public._ensure_policy('p_read','teachers','select', array['anon','authenticated'],
  $$trust = 'verified_official'$$);
select public._ensure_policy('p_read','rooms','select', array['anon','authenticated'],
  $$trust = 'verified_official'$$);
select public._ensure_policy('p_read','timetables','select', array['anon','authenticated'],
  $$trust = 'verified_official' and conflict_status <> 'conflict'$$);
select public._ensure_policy('p_read','sessions','select', array['anon','authenticated'],
  $$trust = 'verified_official'$$);

-- 10.5 مصادر/وثائق.
select public._ensure_policy('p_read','official_sources','select', array['anon','authenticated'], 'true');
select public._ensure_policy('p_read','documents','select', array['anon','authenticated'],
  $$trust = 'verified_official'$$);

-- 10.6 سجلات الطلبة: لا قراءة عامة إطلاقاً. إداري فقط (is_admin).
select public._ensure_policy('p_admin_all','student_group_records','all', array['authenticated'],
  'public.is_admin()', 'public.is_admin()');
select public._ensure_policy('p_admin_all','student_identity_admin','all', array['authenticated'],
  'public.is_admin()', 'public.is_admin()');

-- 10.7 جداول تشغيلية: إداري فقط.
select public._ensure_policy('p_admin_all','import_jobs','all', array['authenticated'],
  'public.is_admin()', 'public.is_admin()');
select public._ensure_policy('p_admin_all','extracted_records','all', array['authenticated'],
  'public.is_admin()', 'public.is_admin()');
select public._ensure_policy('p_admin_all','verification_conflicts','all', array['authenticated'],
  'public.is_admin()', 'public.is_admin()');
select public._ensure_policy('p_admin_read','audit_log','select', array['authenticated'],
  'public.is_admin()', null);

-- 10.8 الإبلاغ عن خطأ: إدخال عام، قراءة إدارية.
select public._ensure_policy('p_public_insert','data_error_reports','insert', array['anon','authenticated'],
  'true', 'true');
select public._ensure_policy('p_admin_read','data_error_reports','select', array['authenticated'],
  'public.is_admin()', null);

-- 10.9 الكتابة الإدارية على الجداول المرجعية (INSERT/UPDATE/DELETE للمسؤولين).
do $$
declare t text;
begin
  foreach t in array array[
    'universities','institutions','cycles','levels','academic_periods','semesters','programs',
    'groups','group_distribution_rules','group_ranges','subjects','teachers','rooms',
    'timetables','sessions','official_sources','documents'
  ] loop
    perform public._ensure_policy('p_admin_write', t, 'insert', array['authenticated'],
      'public.is_admin()', 'public.is_admin()');
    perform public._ensure_policy('p_admin_upd', t, 'update', array['authenticated'],
      'public.is_admin()', 'public.is_admin()');
    perform public._ensure_policy('p_admin_del', t, 'delete', array['authenticated'],
      'public.is_admin()', null);
  end loop;
end $$;

-- =============================================================================
-- 11) تريغرات updated_at (B1)
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'universities','institutions','programs','groups','subjects','teachers','rooms',
    'timetables','sessions','documents'
  ] loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$s', t);
    execute format('create trigger trg_touch_%1$s before update on public.%1$s
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- =============================================================================
-- 12) دالة البحث الآمنة (B5: الفوج عاماً، الاسم بتحقّق)
-- =============================================================================

-- (أ) بحث عام: يُرجع الفوج فقط — لا اسم. الحد الأدنى 3 أحرف، 20 نتيجة.
create or replace function public.find_student_group(q text)
returns table (group_code text, institution text, program_name text, semester text)
language sql
stable
security definer
set search_path = public
as $$
  select g.code, i.name_ar, p.name_ar, s.code
  from public.student_group_records r
  join public.groups g       on g.id = r.group_id
  join public.programs p     on p.id = g.program_id
  left join public.institutions i on i.id = p.institution_id
  left join public.semesters s    on s.id = g.semester_id
  where length(unaccent(trim(q))) >= 3
    and r.full_name_normalized % unaccent(trim(q))
    and g.trust = 'verified_official'
  order by similarity(r.full_name_normalized, unaccent(trim(q))) desc
  limit 20;
$$;
revoke all on function public.find_student_group(text) from public;
grant execute on function public.find_student_group(text) to anon, authenticated;

-- (ب) بحث موثّق: يُرجع الاسم فقط إذا طابق رقم التسجيل (بصمة).
create or replace function public.find_student_group_verified(q text, reg_ref text)
returns table (full_name text, group_code text, institution text, program_name text, semester text)
language sql
stable
security definer
set search_path = public
as $$
  select r.full_name_original, g.code, i.name_ar, p.name_ar, s.code
  from public.student_group_records r
  join public.student_identity_admin si on si.record_id = r.id
  join public.groups g       on g.id = r.group_id
  join public.programs p     on p.id = g.program_id
  left join public.institutions i on i.id = p.institution_id
  left join public.semesters s    on s.id = g.semester_id
  where length(unaccent(trim(q))) >= 3
    and r.full_name_normalized % unaccent(trim(q))
    and r.registration_hash = encode(digest(upper(trim(reg_ref)), 'sha256'), 'hex')
    and g.trust = 'verified_official'
  order by similarity(r.full_name_normalized, unaccent(trim(q))) desc
  limit 5;
$$;
revoke all on function public.find_student_group_verified(text, text) from public;
grant execute on function public.find_student_group_verified(text, text) to anon, authenticated;

-- =============================================================================
-- 13) بيانات مرجعية مؤكّدة (idempotent) — فقط ما تحقّقنا منه رسمياً
-- =============================================================================
insert into public.universities (code, name_ar, name_fr, website_url) values
  ('uiz', 'جامعة ابن زهر', 'Université Ibn Zohr', 'https://www.uiz.ac.ma/')
on conflict (code) do nothing;

insert into public.cycles (code, name_ar, name_fr) values
  ('licence',   'الإجازة',  'Licence'),
  ('master',    'الماستر',  'Master'),
  ('doctorat',  'الدكتوراه','Doctorat')
on conflict (code) do nothing;

insert into public.semesters (code, ordinal, name_ar) values
  ('S1',1,'الفصل 1'),('S2',2,'الفصل 2'),('S3',3,'الفصل 3'),('S4',4,'الفصل 4'),
  ('S5',5,'الفصل 5'),('S6',6,'الفصل 6'),('S7',7,'الفصل 7'),('S8',8,'الفصل 8'),
  ('S9',9,'الفصل 9'),('S10',10,'الفصل 10')
on conflict (code) do nothing;

-- مؤسسة واحدة مؤكّدة رسمياً (زيارة صفحتها الرسمية).
insert into public.institutions (university_id, code, name_ar, name_fr, type, city, official_url, data_completeness, status)
select u.id, 'fsjes-agadir',
       'كلية العلوم القانونية والاقتصادية والاجتماعية - أكادير',
       'Faculté des Sciences Juridiques, Économiques et Sociales - Agadir',
       'faculty', 'أكادير',
       'https://www.uiz.ac.ma/faculte-des-sciences-juridiques-economiques-et-sociales-agadir',
       'partial', 'published'
from public.universities u where u.code = 'uiz'
on conflict (university_id, code) do nothing;

commit;

-- نهاية المخطط المرجعي الموحّد v1
