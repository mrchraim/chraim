# Phase 1 — Audit & Baseline Report

**Date:** 2026-10-28
**Branch:** design-upgrade
**Status:** Completed — awaiting approval to proceed

---

## 1. Project Structure

### Scale
| Metric | Count |
|--------|-------|
| HTML files (total) | 228 |
| HTML files (root) | 24 |
| JS files (total) | 1,117 (913 node_modules) |
| CSS files (total) | 49 |
| Directories (total) | 508 (312 node_modules) |
| Git commits | 152 |
| Supabase projects | 2 (portal + platform) |

### Root-level HTML (24 files)
| File | Size | Purpose |
|------|------|---------|
| index.html | 58,081 | Main hub page |
| portal.html | 195,511 | Student portal (largest) |
| rafiq-altalib.html | 37,694 | Student companion |
| university-directory.html | 37,781 | Institution directory |
| students-guide.html | 13,970 | Student guide |
| orientation.html | 12,039 | Orientation |
| academic-offer.html | 11,361 | Academic offers |
| academic-updates.html | 9,842 | Academic updates |
| admin.html | 28,936 | Admin console |
| portal-simple.html | 23,614 | Simple portal (design upgrade) |
| 404.html | 3,323 | Error page |
| atlas.html | 3,617 | Knowledge atlas |
| campus2.html | 1,152 | Campus page |
| directory.html | 6,437 | Directory |
| resources.html | 1,752 | Resources |
| sources.html | 1,595 | Sources |
| student.html | 1,902 | Student page |
| terms.html | 1,187 | Terms |
| privacy.html | 1,904 | Privacy |
| ai-assistant.html | 864 | AI assistant (placeholder) |
| offline.html | 911 | Offline page |
| portal-ibn-zohr.html | 943 | Ibn Zohr portal (placeholder) |
| portal-tajawal.html | 940 | Tajawal portal (placeholder) |
| portal-v2.html | 931 | Portal v2 (placeholder) |

### Subdirectories
- `etablissements/` (25 files) — 24 institution pages + style.css
- `platform/` (11 files) — management system (about, announcements, browse, contribute, privacy, subject, support, login)
- `faculties/` (7 files) — FSJP + 4 placeholders + template
- `assets/` — CSS, JS, fonts, libs
- `data/` — JSON data files
- `docs/` — documentation
- `tools/` — build/audit scripts
- `supabase/` — SQL schemas + migrations
- `archive/` — legacy snapshots (113 dirs, 7.3 MB)
- `vendor/` — OpenMausBot (23 dirs)
- `_dev/` — development scripts

---

## 2. Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Static HTML/CSS/JS (no framework) |
| Styling | Tailwind (pre-built CSS) + custom CSS |
| i18n | page-i18n.js (ar/fr/en/zgh) — 4 languages |
| Backend | Supabase (2 projects: portal + platform) |
| Auth | Supabase Auth + admins table + RLS |
| Hosting | Cloudflare Pages (primary), Netlify (backup) |
| Build | Python (build-dist.py) |
| Testing | Vitest (11 tests) |
| CI | GitHub Actions (lint, test, build, links, security, gitleaks, lighthouse, axe) |
| Fonts | Local (Cairo, Tajawal, Inter) — CSP-safe |
| Icons | Lucide (local) |

---

## 3. CDN References

**Active codebase: ZERO external CDN references.** All libraries are vendored locally under `assets/lib/`. CDN references exist only in archived/legacy files.

---

## 4. Supabase Configuration

### Two Projects
1. **Portal project** (`idpafbyefrywjixskvvu.supabase.co`) — admins, announcements, exam_files
2. **Platform project** (`uftqrgpzllvqlaztcjbq.supabase.co`) — profiles, roles, universities, departments, etc.

### Keys
- Only publishable/anon keys in code (by design)
- No service_role, no secret keys, no API tokens
- `service_role` never present (enforced by docs + audit-security.py)

### Schema Files
- `01_portal_schema.sql` — portal/admin schema
- `02_platform_schema.sql` — management system schema
- `03_knowledge_atlas_schema.sql` — design-only (not deployed)
- `migrations/20261021_harden_rls_policies.sql` — RLS hardening (platform only)

---

## 5. Cloudflare Configuration

### _headers
- CSP: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`
- HSTS: `max-age=31536000; includeSubDomains`
- X-Frame-Options: DENY
- Permissions-Policy: camera, microphone, geolocation, payment, usb all disabled
- Cache-Control rules for assets, documents, index, admin

### _redirects
```
/public/documents/* /documents/:splat 200
/public/assets/* /assets/:splat 200
```

### wrangler.jsonc
- Deploys from `dist/` directory
- Observability enabled

---

## 6. Security Concerns (from Supabase/Cloudflare audit)

### Critical
1. **Permissive storage READ in portal schema** — `edu_files_read` policy allows anon to SELECT any object in `edu-files` bucket. Migration fixes this for platform only.
2. **Missing FORCE RLS** — Both base schemas use `enable row level security` but not `FORCE ROW LEVEL SECURITY`. Table owners could bypass RLS.
3. **CSP 'unsafe-inline'** — `script-src 'self' 'unsafe-inline'` weakens XSS protection.

### Medium
4. **contact_messages insert policy too loose** — `msg_insert_any` allows `with check (true)`, allowing anon to insert with `is_read = true`.
5. **Role model inconsistency** — `handle_new_user()` in platform schema doesn't assign role_id; migration assigns `viewer`. Two definitions disagree.
6. **admin.html allows sessionStorage override** of Supabase URL/key — low risk (publishable key only) but worth noting.
7. **Stale `.netlify/netlify.toml`** points at wrong project path.

### Low
8. `is_admin()`/`is_platform_admin()` granted to `anon` — standard for RLS helpers, returns false for anon.
9. `edu-files` bucket size/mime limits set by migration only; base schema creates bucket without limits.

---

## 7. i18n Status

- **page-i18n.js**: 4 languages (ar/fr/en/zgh) with 1000+ keys
- **Pages with i18n**: 15/24 (index, portal, portal-simple, rafiq-altalib, directory, resources, students-guide, orientation, academic-offer, academic-updates, atlas, campus2, sources, student, university-directory)
- **Pages without i18n**: 404, admin, ai-assistant, offline, portal-ibn-zohr, portal-tajawal, portal-v2, privacy, terms
- **data-i18n attributes**: Full on index.html, partial on others

---

## 8. Dark Mode Status

- **CSS variables**: Defined in design-tokens.css + inline styles
- **Toggle**: `#themeToggle` button exists on most pages
- **Storage**: `localStorage` key `chrvvim-theme` or `uiz_theme`
- **System preference**: `prefers-color-scheme` respected on first visit
- **View Transitions**: Used in design-upgrade.js
- **Gap**: Full `dark:` Tailwind variants not generated (no Tailwind build step)

---

## 9. Educational Content

- **Legal library**: 24 PDFs + index (user-provided)
- **Knowledge Atlas**: Scaffold + crawl runner + small crawl (100 links)
- **Directory + resources**: Links only (no fabrication)
- **Faculties**: FSJP + 4 placeholders + template
- **Gap**: No verified lessons/content from official sources (MEN, UIZ)

---

## 10. CI/CD

### GitHub Actions (ci.yml)
- test: lint + format:check + vitest
- links-and-security: build-dist + audit-links + audit-security + gitleaks
- lighthouse: Lighthouse CI (continue-on-error)
- axe: axe-core accessibility (continue-on-error)

### Scripts
- `npm run lint` — eslint
- `npm run format:check` — prettier
- `npm test` — vitest (11 tests)
- `npm run build` — build-dist.py
- `npm run audit:links` — audit-links.py
- `npm run audit:security` — audit-security.py

---

## 11. Git Status

- **Branch:** design-upgrade
- **Working tree:** clean
- **Remote:** https://github.com/mrchraim/chraim.git
- **Branches:** design-upgrade (current), improve/world-class, main, + 4 remotes
- **Total commits:** 152
- **No force push used**

---

## 12. Secrets Hygiene

- No `.env` files tracked (only `.env.example` templates in archive)
- `.gitignore` correctly excludes `.env`, `.env.*`, `*.local`, `*.log`, `dist/`, `.wrangler/`, `node_modules/`
- No `service_role`, `sk_`, `ghp_`, `AKIA`, private keys in code
- Only publishable/anon keys present (by design)
- CI uses GitHub Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `GITHUB_TOKEN`)
- `tools/audit-security.py` automates secret scanning

---

## Decision Log

### DECISION 1: CSP 'unsafe-inline' retained
- **Decision:** Keep `'unsafe-inline'` in script-src and style-src
- **Alternatives:** Remove and use nonces/hashes
- **Reason:** 24 HTML files use extensive inline scripts/styles. Removing would require moving all inline JS to external files — too large for this phase. Will be addressed in a future phase.

### DECISION 2: Supabase RLS not tested
- **Decision:** Document gaps but don't modify production policies
- **Alternatives:** Run RLS tests against live database
- **Reason:** No isolated test environment available. Production changes require explicit approval.

### DECISION 3: Educational content not added
- **Decision:** No fabricated content. Only verified official sources.
- **Alternatives:** Add placeholder content
- **Reason:** Project rules forbid fabrication. Official sources (MEN, UIZ) need to be collected and verified.

### DECISION 4: Cloudflare redirects not configured
- **Decision:** Document current state, propose changes as files
- **Alternatives:** Modify _redirects directly
- **Reason:** Production redirect changes require explicit approval.

### DECISION 5: Design upgrade bundle applied
- **Decision:** Applied design-tokens.css + design-upgrade.js from bundle
- **Alternatives:** Skip and build from scratch
- **Reason:** Bundle provides comprehensive design system with light/dark modes, reduced motion, and accessibility features.

---

## Summary of Issues Found

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Permissive storage READ in portal schema | Critical | Documented, migration exists for platform only |
| 2 | Missing FORCE RLS on portal tables | Critical | Documented, needs migration |
| 3 | CSP 'unsafe-inline' for scripts/styles | Medium | Retained (DECISION 1) |
| 4 | contact_messages insert policy too loose | Medium | Documented |
| 5 | Role model inconsistency (handle_new_user) | Medium | Documented |
| 6 | admin.html sessionStorage override | Low | Documented |
| 7 | Stale .netlify/netlify.toml | Low | Documented |
| 8 | No verified educational content | Medium | Blocked (needs sources) |
| 9 | i18n incomplete (15/24 pages) | Low | Expanded (was 3, now 15) |
| 10 | Dark mode incomplete (no Tailwind rebuild) | Low | Partial (CSS vars exist) |

---

**Awaiting approval to proceed to Phase 2 (Security Hardening).**