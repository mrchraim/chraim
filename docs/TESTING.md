# Testing Checklist (Phase 6)

## Automated (CI)
- [ ] `npm test` (Vitest) — unit tests.
- [ ] `npm run lint` — 0 errors.
- [ ] `npm run format:check` — pass.
- [ ] `build-dist` + `audit-links` — 0 broken.
- [ ] `audit-security` — 0 FAIL.
- [ ] Secret scan (gitleaks).
- [ ] Lighthouse CI (mobile) — target ≥ 90 (manual/CI).
- [ ] axe-core (WCAG 2.2 AA) — 0 critical violations.

## Manual
- [ ] RTL/LTR switching (ar/fr/en).
- [ ] Mobile (360px, 768px) — no horizontal scroll.
- [ ] Keyboard navigation (tab order, focus-visible).
- [ ] Screen reader (NVDA/VoiceOver) — basic.
- [ ] Dark mode (portal) / light (index).
- [ ] PWA offline (service worker).
- [ ] Forms (validation, honeypot).
- [ ] Links (all internal, no 404).

## Tools
- Lighthouse: Chrome DevTools or `npx lighthouse`.
- axe: `npx @axe-core/cli`.
- Playwright: e2e (future).