# DECISIONS.md — CHRVVIM Campus

**Date:** 2026-10-28
**Status:** Active — updated as decisions are made

---

## DECISION 1: CSP 'unsafe-inline' retained
- **Date:** 2026-10-28
- **Decision:** Keep `'unsafe-inline'` in script-src and style-src
- **Alternatives:** Remove and use nonces/hashes for inline scripts
- **Reason:** 24 HTML files use extensive inline scripts/styles. Removing would require moving all inline JS to external files — too large for this phase. Will be addressed in a future phase.
- **Impact:** Weaker XSS protection than ideal, but acceptable for current threat model.

## DECISION 2: Supabase RLS not tested on live DB
- **Date:** 2026-10-28
- **Decision:** Create migration files and test scripts, but don't apply to production
- **Alternatives:** Run RLS tests against live database
- **Reason:** No isolated test environment available. Production changes require explicit approval.
- **Impact:** RLS policies are documented but not verified against live DB.

## DECISION 3: No fabricated educational content
- **Date:** 2026-10-28
- **Decision:** No placeholder/fabricated content. Only verified official sources.
- **Alternatives:** Add placeholder content with "قيد التحقق" status
- **Reason:** Project rules forbid fabrication. Official sources (MEN, UIZ) need to be collected and verified.
- **Impact:** CONTENT_AUDIT.md is a template with "pending" status.

## DECISION 4: Cloudflare redirects not configured
- **Date:** 2026-10-28
- **Decision:** Document current state, propose changes as files
- **Alternatives:** Modify _redirects directly
- **Reason:** Production redirect changes require explicit approval.
- **Impact:** No cross-domain redirects configured yet.

## DECISION 5: Design upgrade bundle applied
- **Date:** 2026-10-28
- **Decision:** Applied design-tokens.css + design-upgrade.js from bundle
- **Alternatives:** Skip and build from scratch
- **Reason:** Bundle provides comprehensive design system with light/dark modes, reduced motion, and accessibility features.
- **Impact:** 4 pages now use design tokens + progressive enhancements.

## DECISION 6: Portal RLS hardening migration created
- **Date:** 2026-10-28
- **Decision:** Create migration file for portal project (mirroring platform hardening)
- **Alternatives:** Modify base schema only
- **Reason:** Migration approach allows safe, incremental application without destructive changes.
- **Impact:** Migration ready for review and application.

## DECISION 7: THREAT_MODEL.md created
- **Date:** 2026-10-28
- **Decision:** Create threat model document before implementation
- **Alternatives:** Skip and implement directly
- **Reason:** Master prompt requires threat model first. Documents attack vectors and controls.
- **Impact:** Security architecture documented.

## DECISION 8: i18n expanded to 15 pages
- **Date:** 2026-10-28
- **Decision:** Add page-i18n.js to 15 pages (was 3)
- **Alternatives:** Add to all 24 pages
- **Reason:** 9 remaining pages are special-purpose (404, admin, offline, privacy, terms, etc.) that don't need full i18n.
- **Impact:** 15/24 pages now have i18n infrastructure.

## DECISION 9: Educational content not fabricated
- **Date:** 2026-10-28
- **Decision:** No placeholder content. Only verified official sources.
- **Alternatives:** Add sample content with "pending" status
- **Reason:** Project rules forbid fabrication. Official sources need verification.
- **Impact:** CONTENT_AUDIT.md is a template with "pending" status.