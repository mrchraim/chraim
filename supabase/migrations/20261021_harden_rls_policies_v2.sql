-- ==========================================================================
-- CHRVVIM SECURITY HARDENING — RLS POLICIES (v2, corrected)
-- Date: 2026-10-21
-- Run manually in Supabase → SQL Editor (or via _tools/apply_supabase.py)
-- ==========================================================================
-- Principles: default deny · least privilege · explicit policy per operation
--             append-only audit (enforced by trigger, not only RLS)
-- Idempotent: safe to re-run.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1) Enable RLS on ALL tables in public schema (idempotent)
--    + FORCE so even the table owner is subject to it (except superuser/service_role)
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
    RAISE NOTICE 'RLS enabled + forced on public.%', tbl;
  END LOOP;
END $$;

-- --------------------------------------------------------------------------
-- 2) Admin registry
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'publisher', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins FORCE ROW LEVEL SECURITY;

-- A signed-in admin may read ONLY their own registry row.
-- Nobody may INSERT/UPDATE/DELETE via the client: no policy = deny.
-- (Writes happen through service_role / dashboard only.)
DROP POLICY IF EXISTS "admins_select_own" ON public.admins;
CREATE POLICY "admins_select_own" ON public.admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Defensive: explicitly drop any accidental write policies.
DROP POLICY IF EXISTS "admins_no_insert" ON public.admins;
DROP POLICY IF EXISTS "admins_no_update" ON public.admins;
DROP POLICY IF EXISTS "admins_no_delete" ON public.admins;

-- --------------------------------------------------------------------------
-- 3) is_admin / is_admin_role — role hierarchy enforced, no tautology
--    Hierarchy: admin > publisher > editor
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_role(required_role TEXT DEFAULT 'editor')
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH me AS (
    SELECT a.role FROM public.admins a WHERE a.user_id = auth.uid()
  )
  SELECT EXISTS (
    SELECT 1 FROM me
    WHERE
      -- rank: admin = 3, publisher = 2, editor = 1
      CASE me.role WHEN 'admin' THEN 3 WHEN 'publisher' THEN 2 WHEN 'editor' THEN 1 ELSE 0 END
      >=
      CASE required_role WHEN 'admin' THEN 3 WHEN 'publisher' THEN 2 WHEN 'editor' THEN 1 ELSE 99 END
  );
$$;

-- --------------------------------------------------------------------------
-- 4) Announcements — separate SELECT / INSERT / UPDATE / DELETE policies
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='announcements') THEN
    DROP POLICY IF EXISTS "public_read_published_announcements" ON public.announcements;
    DROP POLICY IF EXISTS "admin_all_announcements" ON public.announcements;
    DROP POLICY IF EXISTS "ann_admin_select" ON public.announcements;
    DROP POLICY IF EXISTS "ann_admin_insert" ON public.announcements;
    DROP POLICY IF EXISTS "ann_admin_update" ON public.announcements;
    DROP POLICY IF EXISTS "ann_admin_delete" ON public.announcements;

    -- public/anon: read only published rows
    CREATE POLICY "public_read_published_announcements" ON public.announcements
      FOR SELECT TO anon, authenticated
      USING (status IN ('published', 'publish'));

    -- admins (publisher+): read everything
    CREATE POLICY "ann_admin_select" ON public.announcements
      FOR SELECT TO authenticated
      USING (public.is_admin_role('publisher'));

    -- admins (publisher+): insert
    CREATE POLICY "ann_admin_insert" ON public.announcements
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin_role('publisher'));

    -- admins (publisher+): update
    CREATE POLICY "ann_admin_update" ON public.announcements
      FOR UPDATE TO authenticated
      USING (public.is_admin_role('publisher'))
      WITH CHECK (public.is_admin_role('publisher'));

    -- admins (admin): delete
    CREATE POLICY "ann_admin_delete" ON public.announcements
      FOR DELETE TO authenticated
      USING (public.is_admin_role('admin'));
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 5) Exam files — public read of approved rows, admin writes (separated)
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='exam_files') THEN
    DROP POLICY IF EXISTS "admin_all_exam_files" ON public.exam_files;
    DROP POLICY IF EXISTS "exam_admin_select" ON public.exam_files;
    DROP POLICY IF EXISTS "exam_admin_insert" ON public.exam_files;
    DROP POLICY IF EXISTS "exam_admin_update" ON public.exam_files;
    DROP POLICY IF EXISTS "exam_admin_delete" ON public.exam_files;
    DROP POLICY IF EXISTS "public_read_approved_exam_files" ON public.exam_files;

    -- public: only approved
    CREATE POLICY "public_read_approved_exam_files" ON public.exam_files
      FOR SELECT TO anon, authenticated
      USING (status = 'approved');

    CREATE POLICY "exam_admin_select" ON public.exam_files
      FOR SELECT TO authenticated
      USING (public.is_admin_role('editor'));

    CREATE POLICY "exam_admin_insert" ON public.exam_files
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin_role('editor'));

    CREATE POLICY "exam_admin_update" ON public.exam_files
      FOR UPDATE TO authenticated
      USING (public.is_admin_role('editor'))
      WITH CHECK (public.is_admin_role('editor'));

    CREATE POLICY "exam_admin_delete" ON public.exam_files
      FOR DELETE TO authenticated
      USING (public.is_admin_role('admin'));
  END IF;
END $$;

-- Generic `exams` table (if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='exams') THEN
    DROP POLICY IF EXISTS "admin_all_exams" ON public.exams;
    DROP POLICY IF EXISTS "exams_admin_select" ON public.exams;
    DROP POLICY IF EXISTS "exams_admin_insert" ON public.exams;
    DROP POLICY IF EXISTS "exams_admin_update" ON public.exams;
    DROP POLICY IF EXISTS "exams_admin_delete" ON public.exams;

    CREATE POLICY "exams_admin_select" ON public.exams
      FOR SELECT TO authenticated USING (public.is_admin_role('editor'));
    CREATE POLICY "exams_admin_insert" ON public.exams
      FOR INSERT TO authenticated WITH CHECK (public.is_admin_role('editor'));
    CREATE POLICY "exams_admin_update" ON public.exams
      FOR UPDATE TO authenticated USING (public.is_admin_role('editor'))
      WITH CHECK (public.is_admin_role('editor'));
    CREATE POLICY "exams_admin_delete" ON public.exams
      FOR DELETE TO authenticated USING (public.is_admin_role('admin'));
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 6) Audit log — append-only enforced by TRIGGER (not just RLS)
--    RLS + FORCE + no policies ⇒ client cannot read/write at all.
--    The trigger additionally blocks UPDATE/DELETE even for privileged roles.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

-- Intentionally NO policies → deny all client access (reads included).
DROP POLICY IF EXISTS "audit_no_access" ON public.audit_log;
DROP POLICY IF EXISTS "audit_read_admin" ON public.audit_log;

-- Optional: allow admins to READ the log (uncomment if you want it in the panel)
-- CREATE POLICY "audit_read_admin" ON public.audit_log
--   FOR SELECT TO authenticated USING (public.is_admin_role('admin'));

-- Append-only guard: block mutation at the table level.
CREATE OR REPLACE FUNCTION public.audit_log_block_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END $$;

DROP TRIGGER IF EXISTS audit_log_no_update ON public.audit_log;
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_block_mutation();

-- --------------------------------------------------------------------------
-- 7) Bootstrap the first admin (⚠️ read carefully)
-- --------------------------------------------------------------------------
-- Because `admins` has FORCE ROW LEVEL SECURITY + no INSERT policy,
-- the SQL Editor's `postgres` role is ALSO blocked from inserting.
-- `service_role` (BYPASSRLS) is the only role that can write here,
-- so bootstrap in ONE of these two ways:
--
--   (A) Dashboard → Table Editor → admins → Insert row
--       user_id = <the UUID from Authentication → Users>
--       role    = 'admin'
--
--   (B) Run this while temporarily lifting FORCE (postgres can then insert):
--
-- ALTER TABLE public.admins NO FORCE ROW LEVEL SECURITY;
-- INSERT INTO public.admins (user_id, email, role)
--   SELECT id, email, 'admin' FROM auth.users WHERE email = 'CHANGE_ME@example.com'
--   ON CONFLICT (user_id) DO NOTHING;
-- ALTER TABLE public.admins FORCE ROW LEVEL SECURITY;
--
-- Verify:
-- SELECT user_id, email, role FROM public.admins;

-- --------------------------------------------------------------------------
-- 8) Comments
-- --------------------------------------------------------------------------
COMMENT ON FUNCTION public.is_admin() IS 'True if current user is a registered admin';
COMMENT ON FUNCTION public.is_admin_role(TEXT) IS 'True if current user meets required role in hierarchy admin>publisher>editor';
COMMENT ON TABLE  public.audit_log IS 'Append-only audit log; UPDATE/DELETE blocked by trigger';
COMMENT ON FUNCTION public.audit_log_block_mutation() IS 'Blocks any UPDATE/DELETE on audit_log';

-- ==========================================================================
-- END MIGRATION
-- ==========================================================================
