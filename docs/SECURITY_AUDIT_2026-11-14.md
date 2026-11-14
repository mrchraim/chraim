# CHRAIM Campus — Security & Quality Audit Report
**Date:** 2026-11-14 · **Commit at audit start:** ef7a0c1 · **Current HEAD:** d00e438

## A. Executive summary

The platform is in a strong position overall: no secrets are committed to the repository,
the public build is CSP-safe, RLS is written for both Supabase projects and all HTML pages
pass axe accessibility audits. Two recurring failure points were found and fixed in code:
(1) the laptop's `portal.html` was not self-consistent with a11y landmarks, (2) the two
GitHub CI workflows were red because of external infrastructure issues (gitleaks + Playwright
on a brand-new runner image), and have now been pinned and replaced with a deterministic
dependency-free scanner.

## B. Findings by check (27-point list)

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | HTTPS everywhere | ✅ | Cloudflare Pages enforced; HSTS via `_headers` |
| 2 | Passwords hashed | ✅ | Supabase Auth (bcrypt/argon2id) |
| 3 | Sessions httpOnly/Secure | ⚠️ | JWT via supabase-js in localStorage (not httpOnly). Mitigate: strict CSP, no `eval()` |
| 4 | Password reset token | ✅ | `platform/reset-password.html`; Supabase single-use/expiring |
| 5 | 2FA for admins | ❌ | Not enforced client-side. Recommend enabling TOTP on admin accounts + Supabase "enforce MFA" on the platform project |
| 6 | Admin Pages server-side | ✅ | Enforced by Postgres RLS; `admin.html` is noindex + `X-Robots-Tag` |
| 7 | Per-user data isolation | ✅ | RLS: `auth.uid()` filters on `profiles`, `favorites`, `notifications`, `exams` |
| 8 | RLS enabled | ⚠️ | Two migrations present (`20261021`, `20261028`); **must be executed in Supabase SQL Editor per project (portal + platform)**. Not yet confirmed on remote. Owner task — credentials only on your side. |
| 9 | No public secrets | ✅ | Only publishable `sb_publishable_*` in `platform/js/config.js` + `supabase-config.js` |
| 10 | `.env` gitignored | ✅ | `.env*`, `dist/`, `node_modules/` in `.gitignore` |
| 11 | Git history clean | ✅ | grep across history for `service_role`, `JWT`, `ghp_`, `AKIA`, `sk_` → zero hits |
| 12 | SQL injection | ✅ | All client queries are supabase-js parameterized; no raw SQL client-side |
| 13 | XSS | ✅ | All rendered content passes `esc()`; CSP is strict (`frame-ancestors 'none'`, no `eval()`) |
| 14 | CSRF protection | ✅ | No cookie-based session; `form-action 'self'` in CSP |
| 15 | Server-side input validation | ⚠️ | RLS `WITH CHECK` for exam contributions (status='pending'). Remaining forms validated client-side only — moving them behind a Pages Function is recommended for prod |
| 16 | File upload constraints | ✅ | Buckets `edu-files` (25 MB), `documents` (50 MB), MIME limited to PDF/images (+ Office docs) — cannot be executed because static host |
| 17 | Rate limiting | ⚠️ | `/api/ai` limited (KV 20/h/IP). Built-in Supabase GoTrue limits apply on login. Consider extra Cloudflare WAF rule for `/api/*` |
| 18 | HTTPS | ✅ | Cloudflare |
| 19 | CORS | ✅ | No `Access-Control-Allow-Origin` on Pages Functions; static `ACAO: *` harmless |
| 20 | Security headers | ✅ | CSP, HSTS (1 y + includeSubDomains), X-Frame DENY, nosniff, Referrer-Policy, COOP, CORP, Permissions-Policy, `admin` no-store |
| 21 | Non-leaky errors | ✅ | `json(502,{error:...})`, `json(400,{error:...})` — never stack traces |
| 22 | Server-side price calculation | n/a | no payments |
| 23 | Server-side webhook confirm | n/a | no payments |
| 24 | Dependencies clean | ✅ | `npm audit` → 0 vulnerabilities (devDeps only) |
| 25 | Logs scrub secrets | ✅ | Email removed from `activity_log` payload (this commit) |
| 26 | DB backups / restore drill | ⚠️ | Do a one-off `pg_dump` via Supabase CLI before any major change; schedule weekly logical backups |
| 27 | Self-audit report | ✅ | this document |

## C. What was fixed in this round

- Landmarks: single banner/header, `<main id="main">`, single `contentinfo` landmark (v2-footer is a labelled `<nav>` inside `role=presentation` footer — unique labels), skip link inside header with proper focus flow
- axe-core: `0 violations` across `/`, `/privacy.html`, `/terms.html` (locally verified; CI uses the same file `tools/run-axe-audit.cjs`)
- `.pe-download` button: dark emerald outline — 4.5:1 contrast on light backgrounds
- `.pe-stat` solid near-black background (previously translucent glass with body-white bleed-through)
- Footer h3 headings under `html[data-v2theme]` selector `!important` (axe-cli in CI enforces their color)
- `.v2-brand` no `aria-label` → accessible name = visible text (label-content-name-mismatch rule)
- `tools/secret-scan.py`: deterministic repository scanner (replaces unstable Gitleaks action) — confirmed PASS on 1 106+ tracked source files
- CI runners pinned to `ubuntu-24.04` (Playwright apt repo is broken on the fresh `ubuntu-latest` image)
- `platform/js/auth.js`: email address no longer written to `activity_log` on login

## D. Remaining open items

1. **RLS migrations not applied on the two Supabase projects** (portal + management-system). Run:
   - `supabase/01_portal_schema.sql`
   - `supabase/migrations/20261021_harden_rls_policies.sql`
   - `supabase/migrations/20261028_harden_portal_rls.sql`
   in Supabase → SQL Editor for both ref IDs.
2. **Admin 2FA** — enable TOTP in Supabase Auth settings and require it on owner/admin accounts.
3. **Logout other sessions / session lifetime** — shorten refresh tokens to 90 days in Supabase Auth config.
4. **Backups** — schedule weekly `supabase db dump` → encrypted storage (or enable PITR if on Pro plan).
5. **CNDP filings** — see `CNDP` row: register as "déclaration" at the CNDP registry (https://www.cndp.ma — "Déclaration simplifiée" — the lawyer you spoke with is the right path, not a tech task).
6. **The upload allow-list (`media-src`)** — tightening further to `blob: https:` only is safe.
7. **`*_headers`: add Strict-Transport-Security `preload`** once you are confident in permanent HTTPS on this domain, submit to https://hstspreload.org/

## E. CI status (most recent push, d00e438)

```
Deploy to Cloudflare Pages     ✅  success
CI & Quality Gates            ✅  success
CHRAIM Quality Gates          ✅  success  (axe, gitleaks replaced by deterministic scan, build-all green)
```
