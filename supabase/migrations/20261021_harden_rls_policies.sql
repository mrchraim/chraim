-- ==========================================================================
-- Management System / منصة الطلبة — Supabase RLS hardening
-- Date: 2026-10-21
-- Target project: uftqrgpzllvqlaztcjbq  (https://uftqrgpzllvqlaztcjbq.supabase.co)
-- Run with:  Supabase → SQL Editor   (or Management API  POST /v1/projects/<ref>/database/query)
--
-- Goals
--   1. default-deny: every public table gets RLS enabled + forced
--   2. the public site keeps working (anonymous reads + the contribute/contact
--      forms) but can no longer read unpublished content or admin data
--   3. only console users with an admin/editor role can read or write admin data
--   4. private storage buckets with explicit object policies
--
-- Idempotent: safe to run more than once.
-- ==========================================================================


-- --------------------------------------------------------------------------
-- 0) Role helpers
--    The console already has a role model: profiles.role_id → roles.id
--    (roles has: id, name, name_ar, permissions).  We reuse it instead of
--    inventing a second registry.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT lower(COALESCE(r.name, ''))
  FROM public.profiles p
  LEFT JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

-- true for a signed-in console user that may manage content
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.current_role_name() IN ('admin', 'superadmin', 'owner');
$$;

-- true for admins + content editors
CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.current_role_name() IN ('admin', 'superadmin', 'owner', 'editor', 'publisher');
$$;

COMMENT ON FUNCTION public.is_admin()  IS 'True when the signed-in console user has an admin role';
COMMENT ON FUNCTION public.is_editor() IS 'True when the signed-in console user may manage content';


-- --------------------------------------------------------------------------
-- 1) Enable + FORCE RLS on every table of the public schema
--    (service_role / postgres bypass RLS, that is intentional and required
--     for the bootstrap below)
-- --------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- Safety net for the bootstrap: `postgres` runs this file (SQL Editor).
-- It normally carries the BYPASSRLS attribute, but if it does not, FORCE RLS
-- would lock the migration out of its own tables.  This policy guarantees the
-- migration can always write the role catalogue.  (It is created AFTER the
-- cleanup block below, which removes every pre-existing policy.)


-- --------------------------------------------------------------------------
-- 2) Remove every policy that already exists on the public tables
--    (so this file is the single source of truth)
-- --------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Safety net for the bootstrap (see the note above): keep `postgres` able to
-- write the role catalogue even if it has no BYPASSRLS attribute.
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS postgres_bootstrap_access ON public.%I;', tbl);
    EXECUTE format(
      'CREATE POLICY postgres_bootstrap_access ON public.%I FOR ALL TO postgres USING (true) WITH CHECK (true);',
      tbl);
  END LOOP;
END $$;


-- --------------------------------------------------------------------------
-- 3) Public catalogue tables — readable by everybody (site browsing)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS public_read_universities ON public.universities;
CREATE POLICY public_read_universities ON public.universities
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY admin_all_universities ON public.universities
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS public_read_departments ON public.departments;
CREATE POLICY public_read_departments ON public.departments
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY admin_all_departments ON public.departments
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS public_read_semesters ON public.semesters;
CREATE POLICY public_read_semesters ON public.semesters
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY admin_all_semesters ON public.semesters
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS public_read_subjects ON public.subjects;
CREATE POLICY public_read_subjects ON public.subjects
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY admin_all_subjects ON public.subjects
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- --------------------------------------------------------------------------
-- 4) Published content — anonymous visitors only see published/approved rows
--    (before this migration an anonymous client could read drafts, and could
--     mint a signed URL for an unapproved exam file)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS public_read_published_announcements ON public.announcements;
CREATE POLICY public_read_published_announcements ON public.announcements
  FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY admin_all_announcements ON public.announcements
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS public_read_approved_exams ON public.exams;
CREATE POLICY public_read_approved_exams ON public.exams
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');
CREATE POLICY editor_all_exams ON public.exams
  FOR ALL TO authenticated
  USING (public.is_editor()) WITH CHECK (public.is_editor());

-- The public "contribute" form inserts a row with status='pending' (a logged
-- in student, never an anonymous visitor).  A student can NEVER create an
-- 'approved' row: the WITH CHECK refuses anything else, and the console
-- (is_editor) can still insert whatever it wants.
DROP POLICY IF EXISTS student_insert_exams ON public.exams;
CREATE POLICY student_insert_exams ON public.exams
  FOR INSERT TO authenticated
  WITH CHECK (status = 'pending');

-- The download counter (`downloads`) is the only field an anonymous visitor
-- may change.  The table level UPDATE privilege is removed from `anon` and
-- only the `downloads` column is given back, so nobody can touch the rest
-- of an exam row (status, file_path, ...) from the outside.
REVOKE UPDATE ON public.exams FROM anon;
GRANT UPDATE (downloads) ON public.exams TO anon;

DROP POLICY IF EXISTS anon_bump_downloads ON public.exams;
CREATE POLICY anon_bump_downloads ON public.exams
  FOR UPDATE TO anon
  USING (status = 'approved')
  WITH CHECK (status = 'approved');

-- The column grant above still lets anybody write *any* value into
-- `downloads`.  The trigger forces the anonymous counter to be exactly
-- OLD + 1, so the counter can only ever be incremented by one - it can
-- never be reset or inflated.  The console (admin / editor) keeps full
-- control over the column.
DROP TRIGGER IF EXISTS guard_exam_downloads ON public.exams;
CREATE OR REPLACE FUNCTION public.guard_exam_downloads()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- console admins / editors keep full control, maintenance and service
  -- sessions keep it as well - everybody else may only add one download.
  IF public.is_admin()
     OR public.is_editor()
     OR session_user IN ('postgres', 'supabase_admin')
     OR coalesce(current_setting('request.jwt.claims', true), '') LIKE '%service_role%'
  THEN
    RETURN NEW;
  END IF;
  NEW.downloads := COALESCE(OLD.downloads, 0) + 1;
  RETURN NEW;
END $fn$;
CREATE TRIGGER guard_exam_downloads
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.guard_exam_downloads();

DROP POLICY IF EXISTS public_read_published_questions ON public.edu_questions;
CREATE POLICY public_read_published_questions ON public.edu_questions
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Anyone may ask a question (the public "ask" form), but a question can
-- never publish itself: only the console decides what is published.
DROP POLICY IF EXISTS public_insert_questions ON public.edu_questions;
CREATE POLICY public_insert_questions ON public.edu_questions
  FOR INSERT TO anon, authenticated
  WITH CHECK (is_published IS NOT TRUE);

CREATE POLICY admin_all_edu_questions ON public.edu_questions
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- --------------------------------------------------------------------------
-- 5) Public forms (contact + contribute) keep working for anonymous users,
--    but nobody can read what was submitted
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS anon_insert_contact_messages ON public.contact_messages;
CREATE POLICY anon_insert_contact_messages ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (is_read IS NOT TRUE);
DROP POLICY IF EXISTS admin_read_contact_messages ON public.contact_messages;
CREATE POLICY admin_read_contact_messages ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS admin_write_contact_messages ON public.contact_messages;
CREATE POLICY admin_write_contact_messages ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS admin_delete_contact_messages ON public.contact_messages;
CREATE POLICY admin_delete_contact_messages ON public.contact_messages
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- --------------------------------------------------------------------------
-- 6) Console-only tables — admins / editors only
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS admin_all_documents ON public.documents;
CREATE POLICY admin_all_documents ON public.documents
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_all_employees ON public.employees;
CREATE POLICY admin_all_employees ON public.employees
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_all_projects ON public.projects;
CREATE POLICY admin_all_projects ON public.projects
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_all_tasks ON public.tasks;
CREATE POLICY admin_all_tasks ON public.tasks
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_all_settings ON public.settings;
CREATE POLICY admin_all_settings ON public.settings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- activity log: a signed-in console user may append its own trail,
-- only admins may read / change it
DROP POLICY IF EXISTS insert_own_activity_log ON public.activity_log;
CREATE POLICY insert_own_activity_log ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS admin_read_activity_log ON public.activity_log;
CREATE POLICY admin_read_activity_log ON public.activity_log
  FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS admin_write_activity_log ON public.activity_log;
CREATE POLICY admin_write_activity_log ON public.activity_log
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS admin_delete_activity_log ON public.activity_log;
CREATE POLICY admin_delete_activity_log ON public.activity_log
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- --------------------------------------------------------------------------
-- 7) User-owned tables — a signed-in user only touches their own rows
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS profiles_admin_insert ON public.profiles;
CREATE POLICY profiles_admin_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;
CREATE POLICY profiles_admin_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS roles_read_authenticated ON public.roles;
CREATE POLICY roles_read_authenticated ON public.roles
  FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS roles_admin_write ON public.roles;
CREATE POLICY roles_admin_write ON public.roles
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS favorites_own ON public.favorites;
CREATE POLICY favorites_own ON public.favorites
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_own ON public.notifications;
CREATE POLICY notifications_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS notifications_admin_delete ON public.notifications;
CREATE POLICY notifications_admin_delete ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());


-- --------------------------------------------------------------------------
-- 8) Storage — private buckets + object policies
--    The buckets did not exist at all, so uploads / signed downloads were
--    silently broken.  They are created here, private (public = false).
-- --------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'edu-files', 'edu-files', false, 26214400,
  ARRAY['application/pdf','image/png','image/jpeg','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', false, 52428800,
  ARRAY['application/pdf','image/png','image/jpeg','image/webp','text/plain',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- drop any storage policy that already exists for our two buckets
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'msops_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', r.policyname);
  END LOOP;
END $$;

-- ... and drop the DEFAULT Supabase storage policies as well.  They are
-- written for "any bucket" (e.g. "Allow authenticated users to insert"),
-- which would let a normal signed-in student write into the private
-- `documents` bucket of the console.  This project only owns the two
-- buckets created above, so the policies below are the complete list.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname NOT LIKE 'msops_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', r.policyname);
  END LOOP;
END $$;

-- edu-files: anonymous visitors may contribute a file (public contribute form),
-- but a file can only be downloaded when it belongs to a published exam.
DROP POLICY IF EXISTS msops_edu_files_upload ON storage.objects;
CREATE POLICY msops_edu_files_upload ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'edu-files');

DROP POLICY IF EXISTS msops_edu_files_read ON storage.objects;
CREATE POLICY msops_edu_files_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'edu-files'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.exams e
        WHERE (e.file_path = storage.objects.name OR e.correction_path = storage.objects.name)
          AND e.status = 'approved'
      )
    )
  );

DROP POLICY IF EXISTS msops_edu_files_admin_write ON storage.objects;
CREATE POLICY msops_edu_files_admin_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'edu-files' AND public.is_admin())
  WITH CHECK (bucket_id = 'edu-files' AND public.is_admin());

-- documents: console only
DROP POLICY IF EXISTS msops_documents_admin ON storage.objects;
CREATE POLICY msops_documents_admin ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'documents' AND public.is_admin())
  WITH CHECK (bucket_id = 'documents' AND public.is_admin());


-- --------------------------------------------------------------------------
-- 9) Roles catalogue + automatic profile creation on sign-up
-- --------------------------------------------------------------------------
DO $$
DECLARE
  has_name_ar BOOLEAN;
  perm_type   TEXT;
  has_role_id BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'name_ar')
    INTO has_name_ar;
  SELECT data_type INTO perm_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'permissions';
  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role_id')
    INTO has_role_id;

  IF has_name_ar AND perm_type = 'jsonb' THEN
    INSERT INTO public.roles (name, name_ar, permissions)
    VALUES ('admin', 'مدير', '["*"]'::jsonb),
           ('editor', 'محرر', '["content"]'::jsonb),
           ('viewer', 'مشاهد', '[]'::jsonb)
    ON CONFLICT DO NOTHING;
  ELSIF has_name_ar THEN
    INSERT INTO public.roles (name, name_ar, permissions)
    VALUES ('admin', 'مدير', '["*"]'),
           ('editor', 'محرر', '["content"]'),
           ('viewer', 'مشاهد', '[]')
    ON CONFLICT DO NOTHING;
  ELSIF perm_type = 'jsonb' THEN
    INSERT INTO public.roles (name, permissions)
    VALUES ('admin', '["*"]'::jsonb),
           ('editor', '["content"]'::jsonb),
           ('viewer', '[]'::jsonb)
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.roles (name)
    VALUES ('admin'), ('editor'), ('viewer')
    ON CONFLICT DO NOTHING;
  END IF;

  -- profile auto-creation on sign-up (idempotent)
  --
  -- IMPORTANT: the default role is `viewer`, NOT `admin`.  The public site
  -- lets anybody create an account (students), and every sign-up lands in
  -- auth.users -> this trigger.  Giving everybody `admin` would hand the
  -- console to every visitor.  The owner is promoted by hand:
  --   UPDATE public.profiles SET role_id =
  --     (SELECT id FROM public.roles WHERE lower(name) = 'admin')
  --   WHERE email = '<owner email>';
  IF has_role_id THEN
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $fn$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, full_name_ar, role_id)
      SELECT NEW.id, NEW.email,
             COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
             COALESCE(NEW.raw_user_meta_data->>'full_name_ar', NEW.raw_user_meta_data->>'full_name', NEW.email),
             (SELECT id FROM public.roles WHERE lower(name) = 'viewer' LIMIT 1)
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END $fn$;

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;


-- --------------------------------------------------------------------------
-- 10) Verification
-- --------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
  n   INT;
BEGIN
  RAISE NOTICE '--- RLS state ---';
  FOR tbl IN
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public' AND c.relkind = 'r' AND c.relname NOT LIKE 'pg_%'
  LOOP
    SELECT count(*) INTO n FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl;
    RAISE NOTICE '% : rls=% forced=% policies=%',
      tbl,
      (SELECT relrowsecurity FROM pg_class WHERE relname = tbl AND relnamespace = 'public'::regnamespace),
      (SELECT relforcerowsecurity FROM pg_class WHERE relname = tbl AND relnamespace = 'public'::regnamespace),
      n;
  END LOOP;
END $$;

-- ==========================================================================
-- END OF MIGRATION
-- ==========================================================================
