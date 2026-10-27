# External Integration (Phase 9)

## 1. Redirects 301 (Cloudflare Redirect Rules — external config)
- `management-system-16j.pages.dev/*` → `https://chraim.pages.dev/platform/*`
- `ms-ops-7f3a9c.pages.dev/*` → `https://chraim.pages.dev/admin`

## 2. Cloudflare Access (second layer for /admin)
- Configure in Cloudflare Zero Trust → Applications.
- Policy: allow owner email only (cheraimmohamed20@gmail.com).
- MFA required.

## 3. Supabase RLS review
- Run `supabase/03_knowledge_atlas_schema.sql` (design only).
- Review `supabase/01_portal_schema.sql`, `02_platform_schema.sql`.
- Add tests in `supabase/tests/`.

## 4. Secrets
- GitHub Secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID.
- Supabase: only anon key in client; service_role never.

## 5. Status
- Documented only — external config required (cannot be done from repo).