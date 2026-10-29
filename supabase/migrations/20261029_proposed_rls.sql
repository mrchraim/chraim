-- ============================================================================
--  CHRVVIM Campus — Proposed RLS Policies (REVIEW REQUIRED)
--  Project: https://idpafbyefrywjixskvvu.supabase.co
--
--  WARNING: These tables may not exist in the production schema.
--  Verify table existence before applying.
--  Tables referenced: institutions, academic_offers, student_resources
--
--  Status: PROPOSED — not applied. Requires review and approval.
-- ============================================================================

-- Check if tables exist before applying
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 1. Enable RLS on relevant tables (if they exist)
-- ALTER TABLE IF EXISTS public.institutions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.academic_offers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.student_resources ENABLE ROW LEVEL SECURITY;

-- 2. Public Read Policy (if tables exist)
-- DROP POLICY IF EXISTS "Public Read Access" ON public.institutions;
-- CREATE POLICY "Public Read Access"
-- ON public.institutions
-- FOR SELECT
-- TO anon, authenticated
-- USING (true);

-- 3. Authenticated Write Policy (if tables exist)
-- DROP POLICY IF EXISTS "Authenticated Manage Access" ON public.institutions;
-- CREATE POLICY "Authenticated Manage Access"
-- ON public.institutions
-- FOR ALL
-- TO authenticated
-- USING (auth.uid() IS NOT NULL);

-- NOTE: The tables 'academic_offers' and 'student_resources' do not exist
-- in the current schema. They need to be created first before RLS can be applied.
-- The 'institutions' table exists in 03_knowledge_atlas_schema.sql (design-only).
--
-- RECOMMENDATION: Review and adapt these policies before applying to production.
-- Do not apply without verifying table existence and data sensitivity.