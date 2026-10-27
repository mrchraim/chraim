# Security Checklist (Phase 2)

## Supabase
- [ ] RLS enabled on all tables.
- [ ] Default deny policies.
- [ ] No public write.
- [ ] admins table via SECURITY DEFINER.
- [ ] Storage buckets private with policies.
- [ ] Security Advisor clean.

## Secrets
- [ ] No secrets in code (only anon key).
- [ ] GitHub Secrets for CF token/account.
- [ ] Rotate if leaked (check git history).

## Headers (_headers)
- [ ] CSP (unsafe-inline still needed for inline scripts).
- [ ] HSTS.
- [ ] X-Frame-Options: DENY.
- [ ] nosniff.
- [ ] Referrer-Policy.
- [ ] Permissions-Policy.

## Admin
- [ ] Supabase Auth + MFA.
- [ ] Cloudflare Access (second layer).
- [ ] Rate limiting / brute-force protection.
- [ ] No admin links in public pages.

## Privacy
- [ ] privacy/terms pages (ar/fr).
- [ ] Minimal data collection.

## CI
- [ ] Dependabot.
- [ ] Secret scanning (gitleaks).
- [ ] Lint/test/build.

## Redirects 301
- [ ] Old domains → chraim.pages.dev (Cloudflare Redirect Rules, external config).