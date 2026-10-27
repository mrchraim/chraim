# CHRAIM — الجرد (Phase 1) — Master Prompt

**التاريخ:** 2026-10-27  
**المستودع:** chraim (main) — up to date.

## 1. what exists (current)
- **Pages:** index, portal, students-guide, university-directory, academic-offer, academic-updates, rafiq-altalib, etablissements/ (24), platform/ (14), admin, orientation, resources, directory, atlas, levels, lessons, support, privacy, terms, 404, offline.
- **Data:** app.js (141KB), 7 data js, 4 json (academic-data, groups, directory, resources, legal-library, levels-curriculum, source-registry), supabase (2 schemas + migrations).
- **Tools:** audit-links, audit-security, build-dist, make-search-index, make-seo, crawler.cjs (small).
- **CI:** deploy-cloudflare-pages.yml + ci.yml (lint/test/build/links/security).
- **Docs:** AUDIT, DESIGN_SYSTEM, COMMUNITY, AI_ASSISTANT, CHANGES_AR, INTEGRATION_PLAN, knowledge-atlas, INVENTORY.

## 2. External parts (to integrate)
- management-system-16j.pages.dev (browse, announcements, contribute, account, about, support, privacy, subject, sitemap, robots) → under /platform/.
- ms-ops-7f3a9c.pages.dev (admin) → /admin (with Cloudflare Access).
- github.com/mrchraim/management-system (merge needed) → archive after.
- Files: supabase/migrations/20261021_harden_rls_policies.sql, SECURITY.md, admin-console/README.md, _tools/audit_final.py, _tools/audit_admin.py, _tools/audit_supabase_rls.py.

## 3. Duplicates / legacy
- archive/ (old projects) — preserved.
- _dev/, vendor/, tools/ — internal (excluded from deploy).
- dist/ — build output (gitignored).

## 4. Missing (per master prompt)
- Redirects 301 from old domains (management-system-16j, ms-ops-7f3a9c) → /platform/*, /admin.
- RLS tests (supabase/tests/).
- Cloudflare Access on /admin (config).
- Secret scanning in CI.
- SRI for external assets (none external now — all local).
- Privacy/terms (ar+fr) — privacy/terms exist (ar only).
- hreflang (index has ar/fr/en links, but not full).
- Lighthouse/axe audit (not run).
- Script مجدول (GitHub Action weekly) — not implemented.

## 5. Plan (phased)
1. Security (RLS review, secrets scan, CSP nonce/hash, Cloudflare Access).
2. Design/UX (shared components, dark mode on index, WCAG).
3. Content (official docs, timetables, announcements) — sources verified.
4. Redirects 301 + redirects file.
5. Testing (links, Lighthouse, axe, RTL, mobile).

**Stop & await approval before Phase 2.**