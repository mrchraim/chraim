-- ==========================================================================
-- CHRVVIM SECURITY HARDENING - RLS POLICIES MIGRATION
-- Date: 2026-10-20
-- WARNING: Review and run manually in Supabase SQL Editor
-- ==========================================================================
-- This migration hardens Row Level Security for all tables in public schema
-- Principles: Default deny, Least privilege, Explicit policies per operation
-- ==========================================================================

-- Enable RLS on ALL tables in public schema (idempotent)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    RAISE NOTICE 'Enabled RLS on public.%', tbl;
  END LOOP;
END $$;

-- ==========================================================================
-- ENSURE ADMINS TABLE IS PROPERLY SECURED
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'publisher', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins table: only admins can read, only service_role can write
DROP POLICY IF EXISTS "admins_select_own" ON public.admins;
CREATE POLICY "admins_select_own" ON public.admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_no_insert" ON public.admins;
DROP POLICY IF EXISTS "admins_no_update" ON public.admins;
DROP POLICY IF EXISTS "admins_no_delete" ON public.admins;

-- No INSERT/UPDATE/DELETE for authenticated users - only via service_role

-- ==========================================================================
-- IMPROVED IS_ADMIN FUNCTION (use app_metadata for security)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admins a 
    WHERE a.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_role(required_role TEXT DEFAULT 'editor')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admins a 
    WHERE a.user_id = auth.uid()
      AND (
        a.role = 'admin' OR 
        (required_role = 'publisher' AND a.role IN ('admin', 'publisher')) OR
        (required_role = 'editor')
      )
  );
$$;

-- ==========================================================================
-- ANNOUNCEMENTS (if exists)
-- ==========================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcements') THEN
    -- Public can read published announcements
    DROP POLICY IF EXISTS "public_read_published_announcements" ON public.announcements;
    CREATE POLICY "public_read_published_announcements" ON public.announcements
      FOR SELECT TO anon, authenticated
      USING (status = 'published' OR status = 'publish');
    
    -- Only admins can manage
    DROP POLICY IF EXISTS "admin_all_announcements" ON public.announcements;
    CREATE POLICY "admin_all_announcements" ON public.announcements
      FOR ALL TO authenticated
      USING (public.is_admin_role('publisher'))
      WITH CHECK (public.is_admin_role('publisher'));
  END IF;
END $$;

-- ==========================================================================
-- EXAMS (if exists)
-- ==========================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exams') THEN
    -- Public read? Check if published column exists
    DROP POLICY IF EXISTS "admin_all_exams" ON public.exams;
    CREATE POLICY "admin_all_exams" ON public.exams
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- ==========================================================================
-- AUDIT LOG (append-only, no UPDATE/DELETE)
-- ==========================================================================
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

-- No one can read/write via client - only service_role
DROP POLICY IF EXISTS "audit_no_access" ON public.audit_log;

-- ==========================================================================
-- STORAGE BUCKET POLICIES (run separately if needed)
-- ==========================================================================
-- Note: Storage policies are managed separately in Supabase Storage
-- Recommended:
-- 1. Make bucket 'contributions' or 'uploads' PRIVATE
-- 2. Allow authenticated users to upload only PDF files
-- 3. Limit file size to 10MB
-- 4. Path should be: {user_id}/{filename}
-- 5. Pending state until approval

COMMENT ON FUNCTION public.is_admin() IS 'Check if current user is admin (reads from public.admins)';
COMMENT ON FUNCTION public.is_admin_role(TEXT) IS 'Check if current user has required role or higher';
COMMENT ON TABLE public.audit_log IS 'Append-only audit log for admin actions - no updates/deletes allowed';

-- ==========================================================================
-- END MIGRATION
-- ==========================================================================
