# Security Policy

## Supported Versions
This project is actively maintained. Security updates are applied to the latest deployed version.

## Reporting a Vulnerability
If you discover a security vulnerability in CHRVVIM, please report it responsibly.

**Contact:** security@chraim.pages.dev

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

We will respond as quickly as possible.

## Security Measures
- Defense-in-depth: URLs from data are filtered by `CHRVVIM_SAFE_URL()` (`security-hardening.js`),
  which blocks `javascript:`, `data:`, `vbscript:`, `blob:` and obfuscated variants (whitespace/percent-encoding).
- Strict allowlist HTML sanitizer (`CHRVVIM_SANITIZE_HTML`) for any dynamic HTML injection.
- All dynamic text passes through an `esc()` encoder before entering the DOM.
- Content Security Policy enforced with SHA-256 hashes (no `unsafe-inline`, no `unsafe-eval`).
- Trusted Types declared in report-only mode (`chrvvim` + `default` policies registered) for XSS sink monitoring.
- CSP violation reporting wired (`report-uri /cdn-cgi/csp-report`) plus an in-page collector (`CHRVVIM_CSP_REPORTS`).
- All user inputs are validated server-side via Supabase RLS
- HSTS, X-Frame-Options, X-Content-Type-Options, COOP/CORP/COEP, Referrer-Policy, Permissions-Policy enabled
- RLS on all database tables with least privilege
- Regular dependency audits
- No secrets in source code; admin code lives in a separate project (not in this bundle)

## Removing Admin From the Public Bundle
The public site contains **no** admin code, routes, links or hidden shortcuts. Administrative
access is a separate Cloudflare Pages project on a non-guessable subdomain, protected by
Cloudflare Access (Zero Trust) + MFA + email/IP allowlist. Guessable admin paths return 404.

## Data Protection
- Minimal data collection
- RLS enforces data isolation
- Backups with PITR
- GDPR/Privacy principles followed

## Incident Response
1. Assess severity
2. Contain threat
3. Notify affected parties if required
4. Remediate and verify
5. Post-incident review

## Maintenance Checklist (Monthly)
- [ ] Review Supabase logs for anomalies
- [ ] Review Cloudflare Security Events
- [ ] Rotate API keys if compromised
- [ ] Check npm audit / dependencies
- [ ] Review user permissions and admin access
- [ ] Test backup restore
- [ ] Update security headers if needed
