# Admin Control Center (design only — Phase 7)

## Roles (RBAC)
- Owner / Super Admin
- Editor
- Reviewer
- Read-only

## Features (design)
- Manage institutions, programs, files, links, announcements, news, sources, schedules.
- Review queue (pending → reviewed → published).
- Audit logs (activity, changes).
- Versioning/rollback.
- Status: draft, published, archived, needs update.

## Security
- Supabase Auth + MFA.
- Cloudflare Access (second layer).
- Rate limiting, brute-force protection.
- RLS on all tables.
- No service_role in client.

## Status
- Design only — not implemented (requires Supabase env).