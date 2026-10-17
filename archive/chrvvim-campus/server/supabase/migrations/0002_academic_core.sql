-- ==========================================================================
-- CHRVVIM CAMPUS — الترحيل 0002: النواة الأكاديمية
-- (الأفواج · قواعد التوزيع · المواد · الأساتذة · القاعات · الحصص · الجداول)
-- ==========================================================================
-- 🛑 SUPERSEDED — هذا الملف مُستبدَل بـ 0010_canonical_schema.sql.
--    لا تُشغّله. أُبقي هنا كسجلّ تاريخي فقط (انظر تقرير المواءمة).
--
-- ⚠️ لم يُشغَّل هذا الملف. هو مسوّدة مراجَعة يُنفّذها المالك يدوياً في
--    Supabase → SQL Editor بعد المراجعة. لا تُشغّله تلقائياً.
--    يعتمد على 0001 ويفترض وجود public.institutions و public.programs.
--
-- المبادئ (مطابقة لـ 0001):
--   1) كل صف رسمي يحمل source_url + checked_at.
--   2) القراءة العامة (anon) للمنشور فقط (published = true).
--   3) الكتابة للمسؤولين فقط عبر public.is_admin().
--   4) idempotent (IF NOT EXISTS / drop policy if exists).
--   5) فصل البيانات حسب السنة الجامعية (أرشيف ومقارنة النسخ).
--   6) الخصوصية: لا جدول أسماء طلبة مقروء للعموم إطلاقاً (انظر §13).
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1) السنوات الجامعية
-- --------------------------------------------------------------------------
create table if not exists public.academic_years (
  id          text primary key,                 -- مثل '2025-2026'
  label_ar    text not null,
  label_fr    text,
  starts_on   date,
  ends_on     date,
  is_current  boolean not null default false,
  checked_at  date not null
);

-- --------------------------------------------------------------------------
-- 2) الفصول الدراسية (S1..S6)
-- --------------------------------------------------------------------------
create table if not exists public.semesters (
  id               bigint generated always as identity primary key,
  academic_year_id text not null references public.academic_years(id) on delete cascade,
  number           int  not null check (number between 1 and 8),
  label_ar         text not null,
  label_fr         text,
  unique (academic_year_id, number)
);
create index if not exists idx_semesters_year on public.semesters(academic_year_id);

-- --------------------------------------------------------------------------
-- 3) الشعب/المسالك (تشير إلى المؤسسة وإلى المسلك في 0001 إن وُجد)
-- --------------------------------------------------------------------------
create table if not exists public.tracks (
  id               bigint generated always as identity primary key,
  slug             text unique,
  institution_slug text not null references public.institutions(slug) on delete cascade,
  program_id       bigint references public.programs(id) on delete set null,
  name_ar          text not null,
  name_fr          text,
  level            text check (level in ('licence','master','doctorat','dut','lp','other')),
  census_term      text,                        -- 'جذع مشترك' | 'مسار' …
  published        boolean not null default false,
  source_url       text not null,
  checked_at       date not null
);
create index if not exists idx_tracks_inst on public.tracks(institution_slug);
create index if not exists idx_tracks_prog on public.tracks(program_id);

-- --------------------------------------------------------------------------
-- 4) المواد/الوحدات (تربط المسلك بالفصل)
-- --------------------------------------------------------------------------
create table if not exists public.courses (
  id          bigint generated always as identity primary key,
  track_id    bigint not null references public.tracks(id) on delete cascade,
  semester_id bigint not null references public.semesters(id) on delete cascade,
  code        text,                             -- مثل 'M1' … 'M7'
  name_ar     text not null,
  name_fr     text,
  unit_index  int,                              -- ترتيب الوحدة
  published   boolean not null default false,
  source_url  text not null,
  checked_at  date not null
);
create index if not exists idx_courses_track on public.courses(track_id);
create index if not exists idx_courses_sem on public.courses(semester_id);

-- --------------------------------------------------------------------------
-- 5) الأساتذة (الأسماء المنشورة رسمياً فقط)
-- --------------------------------------------------------------------------
create table if not exists public.professors (
  id               bigint generated always as identity primary key,
  name_ar          text not null,
  name_fr          text,
  institution_slug text references public.institutions(slug) on delete set null,
  published        boolean not null default false,
  source_url       text not null,
  checked_at       date not null
);
create index if not exists idx_professors_inst on public.professors(institution_slug);

-- --------------------------------------------------------------------------
-- 6) القاعات والمدرجات
-- --------------------------------------------------------------------------
create table if not exists public.rooms (
  id               bigint generated always as identity primary key,
  institution_slug text references public.institutions(slug) on delete cascade,
  name_ar          text not null,               -- 'المدرج5' | 'القاعة B' | 'المدرج الكبير'
  kind             text check (kind in ('amphi','room','lab','other')),
  capacity         int,
  published        boolean not null default false,
  source_url       text not null,
  checked_at       date not null,
  unique (institution_slug, name_ar)
);

-- --------------------------------------------------------------------------
-- 7) الأفواج والمجموعات
-- --------------------------------------------------------------------------
create table if not exists public.student_groups (
  id               bigint generated always as identity primary key,
  track_id         bigint not null references public.tracks(id) on delete cascade,
  semester_id      bigint not null references public.semesters(id) on delete cascade,
  code             text not null,               -- 'A' … 'T'
  label_ar         text,                         -- 'الفوج A'
  groups_range     text,                         -- 'المجموعة 1-2-3' (قد تكون فارغة)
  published        boolean not null default false,
  source_url       text not null,
  checked_at       date not null,
  unique (track_id, semester_id, code)
);
create index if not exists idx_groups_track on public.student_groups(track_id);
create index if not exists idx_groups_sem on public.student_groups(semester_id);

-- --------------------------------------------------------------------------
-- 8) نطاقات الأفواج الأبجدية + قاعدة التوزيع الموثّقة
-- --------------------------------------------------------------------------
create table if not exists public.group_ranges (
  id               bigint generated always as identity primary key,
  student_group_id bigint not null references public.student_groups(id) on delete cascade,
  sort             int  not null default 0,
  range_raw        text not null,               -- 'A''MIL AHACHTAR' (كما في الوثيقة)
  from_name        text,                        -- يُملأ بعد المراجعة
  to_name          text,                        -- يُملأ بعد المراجعة
  needs_review     boolean not null default true, -- الحدود الآلية غير مؤكّدة
  source_url       text not null,
  checked_at       date not null
);
create index if not exists idx_group_ranges_group on public.group_ranges(student_group_id);

create table if not exists public.group_distribution_rules (
  id          bigint generated always as identity primary key,
  track_id    bigint not null references public.tracks(id) on delete cascade,
  semester_id bigint references public.semesters(id) on delete set null,
  rule_type   text not null,                    -- 'alphabetical_name_ranges' | 'numbered_lists' | 'registration_ids' | 'unknown'
  note_ar     text,
  note_fr     text,
  published   boolean not null default false,
  source_url  text not null,
  checked_at  date not null
);
create index if not exists idx_rules_track on public.group_distribution_rules(track_id);

-- --------------------------------------------------------------------------
-- 9) الجداول الزمنية (رأس الجدول) والحصص (تفاصيله)
-- --------------------------------------------------------------------------
create table if not exists public.timetables (
  id               bigint generated always as identity primary key,
  institution_slug text references public.institutions(slug) on delete set null,
  track_id         bigint references public.tracks(id) on delete set null,
  semester_id      bigint references public.semesters(id) on delete set null,
  academic_year_id text references public.academic_years(id) on delete set null,
  document_id      bigint references public.documents(id) on delete set null,
  conflict_status  text not null default 'none' check (conflict_status in ('none','suspected','confirmed')),
  published        boolean not null default false,
  source_url       text not null,
  checked_at       date not null,
  created_at       timestamptz not null default now()
);
create index if not exists idx_timetables_track on public.timetables(track_id);
create index if not exists idx_timetables_year on public.timetables(academic_year_id);

create table if not exists public.sessions (
  id               bigint generated always as identity primary key,
  timetable_id     bigint not null references public.timetables(id) on delete cascade,
  student_group_id bigint references public.student_groups(id) on delete set null,
  course_id        bigint references public.courses(id) on delete set null,
  professor_id     bigint references public.professors(id) on delete set null,
  room_id          bigint references public.rooms(id) on delete set null,
  day_of_week      int  not null check (day_of_week between 1 and 7), -- 1=الاثنين … 7=الأحد
  start_time       time not null,
  end_time         time not null,
  session_type     text check (session_type in ('lecture','td','tp','exam','other')),
  needs_review     boolean not null default true,
  source_url       text not null,
  checked_at       date not null,
  check (end_time > start_time)
);
create index if not exists idx_sessions_tt on public.sessions(timetable_id);
create index if not exists idx_sessions_group on public.sessions(student_group_id);
create index if not exists idx_sessions_day on public.sessions(day_of_week);

-- --------------------------------------------------------------------------
-- 10) عمليات الاستيراد
-- --------------------------------------------------------------------------
create table if not exists public.imports (
  id           bigint generated always as identity primary key,
  filename     text not null,
  sha1_text    text,                            -- بصمة النصّ (كشف التكرار)
  kind         text,                            -- 'timetable' | 'group_distribution' | …
  status       text not null default 'running' check (status in ('running','ok','partial','failed')),
  files_seen   int,
  rows_ok      int,
  rows_duplicate int,
  rows_empty   int,
  note         text,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);

-- --------------------------------------------------------------------------
-- 11) السجلات المستخرجة آلياً (منطقة انتظار قبل الاعتماد — لا تُنشَر تلقائياً)
-- --------------------------------------------------------------------------
create table if not exists public.extracted_records (
  id          bigint generated always as identity primary key,
  import_id   bigint references public.imports(id) on delete cascade,
  kind        text not null,
  payload     jsonb not null default '{}'::jsonb,
  confidence  numeric(3,2),
  status      text not null default 'pending' check (status in ('pending','promoted','rejected','conflict')),
  source_file text,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists idx_extracted_status on public.extracted_records(status);

-- --------------------------------------------------------------------------
-- 12) التعارضات وسجلّ التغييرات
-- --------------------------------------------------------------------------
create table if not exists public.conflicts (
  id          bigint generated always as identity primary key,
  entity      text not null,
  entity_id   text not null,
  description text not null,
  source_a    text,
  source_b    text,
  status      text not null default 'open' check (status in ('open','resolved','ignored')),
  created_at  timestamptz not null default now()
);

create table if not exists public.data_changes (
  id         bigint generated always as identity primary key,
  entity     text not null,
  entity_id  text not null,
  action     text not null check (action in ('insert','update','delete','approve','reject')),
  before     jsonb,
  after      jsonb,
  actor      text,
  created_at timestamptz not null default now()
);
create index if not exists idx_changes_entity on public.data_changes(entity, entity_id);

-- --------------------------------------------------------------------------
-- 13) قوائم الطلبة (خصوصية): جدول إداري فقط — لا سياسة قراءة عامة إطلاقاً.
--     لا يُخزَّن إلا ما يلزم لوظيفة البحث، ولا تُتاح القوائم الكاملة للعموم.
-- --------------------------------------------------------------------------
create table if not exists public.student_roster (
  id               bigint generated always as identity primary key,
  student_group_id bigint not null references public.student_groups(id) on delete cascade,
  full_name_norm   text not null,               -- النسخة المطبَّعة للبحث فقط
  full_name_raw    text,                        -- النصّ الأصلي كما ورد (للمراجعة)
  cne_hash         text,                        -- بصمة معرّف إن وُجد (لا يُخزَّن المعرّف صريحاً)
  source_url       text not null,
  checked_at       date not null
);
create index if not exists idx_roster_group on public.student_roster(student_group_id);
create index if not exists idx_roster_name on public.student_roster(full_name_norm);

-- ==========================================================================
-- الأمان: RLS
-- ==========================================================================
alter table public.academic_years            enable row level security;
alter table public.semesters                 enable row level security;
alter table public.tracks                    enable row level security;
alter table public.courses                   enable row level security;
alter table public.professors                enable row level security;
alter table public.rooms                     enable row level security;
alter table public.student_groups            enable row level security;
alter table public.group_ranges              enable row level security;
alter table public.group_distribution_rules  enable row level security;
alter table public.timetables                enable row level security;
alter table public.sessions                  enable row level security;
alter table public.imports                   enable row level security;
alter table public.extracted_records         enable row level security;
alter table public.conflicts                 enable row level security;
alter table public.data_changes              enable row level security;
alter table public.student_roster            enable row level security;

-- قراءة عامة للمنشور فقط
do $$
declare t text;
begin
  foreach t in array array[
    'tracks','courses','professors','rooms','student_groups',
    'group_distribution_rules','timetables'
  ]
  loop
    execute format('drop policy if exists "public read %1$s" on public.%1$I;', t);
    execute format('create policy "public read %1$s" on public.%1$I for select using (published = true);', t);
  end loop;
end $$;

-- السنوات والفصول: قراءة عامة (بيانات مرجعية غير حسّاسة)
drop policy if exists "public read academic_years" on public.academic_years;
create policy "public read academic_years" on public.academic_years for select using (true);
drop policy if exists "public read semesters" on public.semesters;
create policy "public read semesters" on public.semesters for select using (true);

-- البيانات التابعة: تُقرأ فقط إذا كانت تابعة لصفّ منشور
drop policy if exists "public read group_ranges" on public.group_ranges;
create policy "public read group_ranges" on public.group_ranges for select using (
  exists (select 1 from public.student_groups g where g.id = student_group_id and g.published = true)
);
drop policy if exists "public read sessions" on public.sessions;
create policy "public read sessions" on public.sessions for select using (
  exists (select 1 from public.timetables tt where tt.id = timetable_id and tt.published = true)
);

-- لا قراءة عامة إطلاقاً لـ: imports, extracted_records, conflicts, data_changes, student_roster.

-- الكتابة للمسؤولين فقط
do $$
declare t text;
begin
  foreach t in array array[
    'academic_years','semesters','tracks','courses','professors','rooms',
    'student_groups','group_ranges','group_distribution_rules','timetables','sessions',
    'imports','extracted_records','conflicts','data_changes','student_roster'
  ]
  loop
    execute format('drop policy if exists "admin write %1$s" on public.%1$I;', t);
    execute format(
      'create policy "admin write %1$s" on public.%1$I for all to authenticated
         using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- ==========================================================================
-- نهاية 0002. راجعه ثم شغّله يدوياً بعد 0001.
-- لا يمسّ هذا الملف جداول 0001 ولا announcements/admins.
-- ==========================================================================
