# Redirects (Phase 5)

## In-site (_redirects)
- `/public/documents/*` → `/documents/:splat` (200)
- `/public/assets/*` → `/assets/:splat` (200)

## Cross-domain (Cloudflare Redirect Rules — external config)
- `management-system-16j.pages.dev/*` → `https://chraim.pages.dev/platform/*` (301)
- `ms-ops-7f3a9c.pages.dev/*` → `https://chraim.pages.dev/admin` (301, with Access)

## Notes
- Do not change original link: https://chraim.pages.dev
- Old domains should 301 to preserve SEO/backlinks.