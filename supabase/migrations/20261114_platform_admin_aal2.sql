-- =============================================================================
--  CHRAIM Campus — PLATFORM (project uftqrgpzllvqlaztcjbq)
--  Enforce 2FA at the SERVER for every admin AND editor RLS decision.
--
--  Why: platform/login.html shows an MFA gate for admins and
--  platform/js/auth.js checkAuth() signs non-aal2 admins out, but both are
--  client-side.  Every console policy in 20261021_harden_rls_policies.sql
--  calls public.is_admin() / public.is_editor(); ANDing `has_aal2()` into both
--  closes the bypass where an admin's role also appears in is_editor() and
--  could therefore still write exams through `editor_all_exams`.
--
--  Students are NOT affected: they never pass is_admin()/is_editor(), so their
--  login (single factor) keeps working exactly as before.
--
--  Idempotent: CREATE OR REPLACE only.  Run in the PLATFORM project's SQL
--  Editor.  Note: an admin/editor who has not enrolled TOTP yet loses write
--  access until they enrol (fail closed — that is the point).
-- =============================================================================

-- 1) Has this session completed a second factor?
create or replace function public.has_aal2()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  SELECT COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

COMMENT ON FUNCTION public.has_aal2() IS
  'True only when the current JWT claims an authenticated-assurance level of 2 (2FA/MFA done)';

-- 2) Platform admin check = console admin role AND completed 2FA.
--    Body preserved verbatim from 20261021_harden_rls_policies.sql plus the
--    aal2 conjunct (gates admin_all_announcements and every is_admin() policy).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.current_role_name() IN ('admin', 'superadmin', 'owner')
     AND public.has_aal2();
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Platform: true when the signed-in console user has an admin role AND the session is aal2 (2FA enforced server-side)';

-- 3) Editors are privileged console users too — same 2FA requirement, otherwise
--    `editor_all_exams` (USING public.is_editor()) would remain a password-only
--    write path for admins, whose role is listed here as well.
CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.current_role_name() IN ('admin', 'superadmin', 'owner', 'editor', 'publisher')
     AND public.has_aal2();
$$;

COMMENT ON FUNCTION public.is_editor() IS
  'Platform: true when the signed-in console user may manage content AND the session is aal2 (2FA enforced server-side)';
