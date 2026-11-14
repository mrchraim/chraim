-- =============================================================================
--  CHRAIM Campus — PORTAL (project idpafbyefrywjixskvvu)
--  Enforce 2FA at the SERVER for every admin RLS decision.
--
--  Why: admin.html already challenges a TOTP factor and only opens the
--  dashboard on an `aal2` session, but that is client-side.  Every admin
--  policy in 20261028_harden_portal_rls.sql calls public.is_admin(); by ANDing
--  `has_aal2()` into that function a stolen password alone can no longer read
--  or write announcements / exam_files / storage, because the JWT still says
--  `aal1`.
--
--  Idempotent: CREATE OR REPLACE only.  Run in the PORTAL project's SQL Editor.
--  Note: after running this, an admin who has not enrolled TOTP yet loses write
--  access until they enrol (fail closed — that is the point).
-- =============================================================================

-- 1) Has this session completed a second factor? (Supabase Auth puts `aal`
--    in the access token; anonymous/absent sessions coalesce to aal1 = false).
create or replace function public.has_aal2()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

comment on function public.has_aal2() is
  'True only when the current JWT claims an authenticated-assurance level of 2 (2FA/MFA done)';

-- 2) Portal admin check = member of public.admins AND a completed 2FA step.
--    (Body preserved verbatim from 20261028_harden_portal_rls.sql, plus the
--    aal2 conjunct.  All portal admin policies go through this function, so
--    this one change gates announcements, exam_files and edu-files storage.)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
      and public.has_aal2()
  );
$$;

comment on function public.is_admin() is
  'Portal: true when the signed-in user is in public.admins AND the session is aal2 (2FA enforced server-side)';
