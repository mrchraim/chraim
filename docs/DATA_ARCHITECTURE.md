# Data Architecture (Phase 8)

## Current
- Static site: JSON files in `data/` (resources, source-registry, academic-data, groups, directory, legal-library, levels-curriculum).
- Supabase: portal schema (01), platform schema (02), knowledge atlas schema (03 — design only).

## Proposed (gradual)
- Keep JSON for static data (no backend needed).
- Supabase only for auth + RLS-protected content (platform).
- Migrations: numbered SQL files in `supabase/migrations/`.
- No data deletion without backup.

## Principles
- Stable IDs.
- No duplication.
- Reference integrity.
- Migrations reviewed before apply.