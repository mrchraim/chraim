-- ============================================================================
--  CHRVVIM Campus — Portal RLS Hardening Migration
--  Project: https://idpafbyefrywjixskvvu.supabase.co
--
--  This migration hardens the portal/admin Supabase project RLS policies.
--  It mirrors the platform project hardening (20261021_harden_rls_policies.sql)
--  adapted for the portal schema (admins, announcements, exam_files, edu-files bucket).
--
--  SAFE TO RUN: idempotent, does not delete data.
--  REVIEW BEFORE APPLYING TO PRODUCTION.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Force RLS on all tables (prevents table owners from bypassing)
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.admins force row level security;

alter table public.announcements enable row level security;
alter table public.announcements force row level security;

alter table public.exam_files enable row level security;
alter table public.exam_files force row level security;

-- ---------------------------------------------------------------------------
-- 2) Re-create is_admin() with stable search_path (already exists, ensure safety)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- 3) Announcements — tighten policies
-- ---------------------------------------------------------------------------
-- Drop all existing policies
drop policy if exists "ann_read_published" on public.announcements;
drop policy if exists "ann_admin_read" on public.announcements;
drop policy if exists "ann_admin_write" on public.announcements;

-- Public: read published only
create policy "ann_read_published" on public.announcements
  for select to anon, authenticated
  using (status = 'published');

-- Admin: read all
create policy "ann_admin_read" on public.announcements
  for select to authenticated
  using (public.is_admin());

-- Admin: write (insert/update/delete)
create policy "ann_admin_write" on public.announcements
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4) Exam files — tighten policies
-- ---------------------------------------------------------------------------
drop policy if exists "ef_read_approved" on public.exam_files;
drop policy if exists "ef_insert_pending" on public.exam_files;
drop policy if exists "ef_admin" on public.exam_files;

-- Public: read approved only
create policy "ef_read_approved" on public.exam_files
  for select to anon, authenticated
  using (status = 'approved');

-- Anonymous/authenticated: insert pending only (cannot self-approve)
create policy "ef_insert_pending" on public.exam_files
  for insert to anon, authenticated
  with check (status = 'pending' and downloads = 0);

-- Admin: all operations
create policy "ef_admin" on public.exam_files
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5) Download counter guard (prevent tampering)
-- ---------------------------------------------------------------------------
create or replace function public.guard_exam_downloads()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only allow incrementing downloads by exactly 1 for approved files
  if new.downloads is distinct from old.downloads + 1 then
    -- Allow admin to set any value
    if not public.is_admin() then
      new.downloads := old.downloads; -- revert tampering
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_exam_downloads on public.exam_files;
create trigger guard_exam_downloads
  before update on public.exam_files
  for each row
  when (old.downloads is distinct from new.downloads)
  execute function public.guard_exam_downloads();

-- ---------------------------------------------------------------------------
-- 6) Storage: edu-files bucket — tighten read policy
-- ---------------------------------------------------------------------------
-- Drop permissive read policy
drop policy if exists "edu_files_read" on storage.objects;

-- Replace with: only allow reading objects for approved exam files
create policy "edu_files_read" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'edu-files'
    and exists (
      select 1 from public.exam_files ef
      where ef.status = 'approved'
        and (ef.file_path = name or ef.correction_path = name)
    )
  );

-- Keep insert policies (contrib folder for anonymous, admin for all)
-- (already defined in base schema, ensure they exist)
drop policy if exists "edu_files_insert_contrib" on storage.objects;
create policy "edu_files_insert_contrib" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'edu-files'
    and (storage.foldername(name))[1] = 'contrib'
  );

drop policy if exists "edu_files_admin_insert" on storage.objects;
create policy "edu_files_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'edu-files' and public.is_admin());

drop policy if exists "edu_files_admin_update" on storage.objects;
create policy "edu_files_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'edu-files' and public.is_admin());

drop policy if exists "edu_files_admin_delete" on storage.objects;
create policy "edu_files_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'edu-files' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 7) Ensure edu-files bucket has size/mime limits
-- ---------------------------------------------------------------------------
update storage.buckets
set file_size_limit = 26214400, -- 25 MB
    allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
where id = 'edu-files';

-- ---------------------------------------------------------------------------
-- 8) Admins table — ensure proper policies
-- ---------------------------------------------------------------------------
drop policy if exists "admins_read_self" on public.admins;
create policy "admins_read_self" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- Only admins can manage admins (via service role or direct SQL)
-- No insert/update/delete policies for regular users

-- ============================================================================
-- Verification queries (run manually after applying):
-- ============================================================================
-- Check RLS is enabled and forced:
--   select tablename, rowsecurity, forcerowsecurity from pg_tables where schemaname = 'public';
-- Check policies:
--   select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public';
-- Check storage policies:
--   select policyname, cmd, roles from pg_policies where schemaname = 'storage';
-- Check bucket limits:
--   select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'edu-files';
-- ============================================================================