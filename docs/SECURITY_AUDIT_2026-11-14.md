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
| 1 | HTTPS everywhere | ✅ | Cloudflare Pages enforced; HSTS via `_headers` with `preload` — **verified preloaded 2026-11-14** (`hstspreload.org` → `status: preloaded`, inherited from the preloaded `.dev` TLD) |
| 2 | Passwords hashed | ✅ | Supabase Auth (bcrypt/argon2id) |
| 3 | Sessions httpOnly/Secure | ⚠️ | JWT via supabase-js in localStorage (not httpOnly). Mitigate: strict CSP, no `eval()` |
| 4 | Password reset token | ✅ | `platform/reset-password.html`; Supabase single-use/expiring |
| 5 | 2FA for admins | ✅ | **TOTP MFA implemented 2026-11-14** (client): `admin.html` enrols/challenges a TOTP factor after the password and gates the dashboard on `aal2`; `platform/login.html` shows the MFA gate **for admins only** (students are exempt); `platform/js/auth.js checkAuth()` signs out admins whose session is not `aal2`. Remaining: enable MFA in Supabase Auth (Authentication → MFA) on both projects and enforce `auth.jwt() ->> 'aal' = 'aal2'` in the admin write policies (server-side) |
| 6 | Admin Pages server-side | ✅ | Enforced by Postgres RLS; `admin.html` is noindex + `X-Robots-Tag` |
| 7 | Per-user data isolation | ✅ | RLS: `auth.uid()` filters on `profiles`, `favorites`, `notifications`, `exams` |
| 8 | RLS enabled | ✅ | **Verified live 2026-11-14 (direct PostgREST probes):** platform `exams`/`announcements` show only approved/published rows to anon (unpublished → 0 rows); `profiles`/`activity_log`/`admins` → 0 rows for anon; portal `exam_files` rejects `status='approved'` inserts (42501) while allowing `status='pending'` contribution inserts by design (`ef_insert_pending`). Both harden migrations are confirmed applied. |
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
| 26 | DB backups / restore drill | ⚠️ | **Tooling ready 2026-11-14:** `tools/backup-supabase.sh` (roles + schema + data, gzip + AES-256-CBC) and `.github/workflows/backup-supabase.yml` (weekly Mon 03:23 UTC + manual, per-project matrix, encrypted artifact kept 90 days, `backups/` gitignored). **First green run pending** the four secrets `SUPABASE_DB_URL_{PORTAL,PLATFORM,ATLAS}` + `BACKUP_PASSPHRASE` — see `docs/BACKUPS.md`. Supabase Free has no automatic backups, so this must not stay red. |
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
- **2FA (TOTP)**: enrolment + challenge UI in `admin.html`, admin-only MFA gate in `platform/login.html`
  (with QR enrolment), `aal2` re-check in `connect()`/`checkAuth()`; register form now carries an explicit
  **consent checkbox** linked to the privacy notice (Law 09-08 art. 5/8)
- **Privacy notices rebuilt as *mentions d'information***: `platform/privacy.html` (controller, data,
  purposes, sub-processors, cross-border transfer basis, retention, rights, contact, security) and
  `privacy.html` corrected (it wrongly claimed "no data on our servers" while accounts exist)
- **Backups**: `tools/backup-supabase.sh` + weekly encrypted-backup workflow; `backups/` and CLI
  temp state gitignored (repo is public)
- **CNDP**: `docs/CNDP_DECLARATION.md` — field-by-field pre-fill of form **F-211**, concurrent
  **F-118** international-transfer section, sub-processor/DPA table, security-measure mapping (§IX),
  gap list and filing timeline (sources: cndp.ma, checked 2026-11-14)

## D. Remaining open items

1. ~~**RLS migrations not applied**~~ — **RESOLVED 2026-11-14**: live PostgREST probes confirm RLS is enforced on both projects (see check 8).
2. ~~**Admin 2FA**~~ — **CODE DONE 2026-11-14**; still needs two manual steps: (a) enable **MFA → TOTP** in
   Supabase Auth for the portal and platform projects, (b) run the server-side migration requiring
   `auth.jwt() ->> 'aal' = 'aal2'` on admin write policies (draft ready, applies in SQL Editor).
3. **Logout other sessions / session lifetime** — shorten refresh tokens to 90 days in Supabase Auth config.
4. **Backups** — workflow is in place; **blocked on secrets**: create a fresh `SUPABASE_ACCESS_TOKEN`
   or, preferably, set `SUPABASE_DB_URL_PORTAL/PLATFORM/ATLAS` (direct connection, port 5432) and
   `BACKUP_PASSPHRASE` per `docs/BACKUPS.md`, then trigger **Supabase backups** once manually to prove it.
5. ~~**CNDP filings**~~ — **DOSSIER READY 2026-11-14**: `docs/CNDP_DECLARATION.md` (F-211 pre-fill +
   F-118 + pièces jointes). Owner to supply identity/address/GSM fields, confirm the Supabase region,
   print the sub-processor terms, then file at <https://www.cndp.ma/notifier-un-traitement/> — lawyer review first.
6. **The upload allow-list (`media-src`)** — tightened to `'self' blob:` (2026-11-14, no external media found in repo).
7. ~~**`_headers`: HSTS `preload`**~~ — **RESOLVED 2026-11-14**: header carries `preload` and
   `hstspreload.org` reports `chraim.pages.dev` as **preloaded** (inherited from the preloaded `.dev` TLD) — no submission needed.
8. **Self-service account deletion** — rights are documented (30-day reply) but executed manually today;
   a "delete my account" flow would close the loop and simplify the CNDP story.

## E. CI status (most recent push, d00e438)

```
Deploy to Cloudflare Pages     ✅  success
CI & Quality Gates            ✅  success
CHRAIM Quality Gates          ✅  success  (axe, gitleaks replaced by deterministic scan, build-all green)
```
