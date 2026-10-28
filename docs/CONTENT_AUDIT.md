# CONTENT_AUDIT.md — CHRVVIM Campus

**Date:** 2026-10-28
**Status:** Template — pending population with verified sources

---

## Audit Matrix

| Institution | Document Type | Status | Source | Verified On | Notes |
|-------------|--------------|--------|--------|-------------|-------|
| FSJES Agadir | Pedagogical offer | Pending | fsjpa.uiz.ac.ma | — | Needs verification |
| FSJES Agadir | Exam schedules | Pending | fsjpa.uiz.ac.ma | — | Needs verification |
| FSJES Agadir | Announcements | Pending | fsjpa.uiz.ac.ma | — | Needs verification |
| FSJES Ait Melloul | Pedagogical offer | Pending | — | — | Needs source |
| FSA Agadir | Pedagogical offer | Pending | — | — | Needs source |
| FSA Ait Melloul | Pedagogical offer | Pending | — | — | Needs source |
| FLSH Agadir | Pedagogical offer | Pending | — | — | Needs source |
| FLASH Ait Melloul | Pedagogical offer | Pending | — | — | Needs source |
| FMP Agadir | Pedagogical offer | Pending | — | — | Needs source |
| FMP Guelmim | Pedagogical offer | Pending | — | — | Needs source |
| FMP Laayoune | Pedagogical offer | Pending | — | — | Needs source |
| FP Smara | Pedagogical offer | Pending | — | — | Needs source |
| FPO Ouarzazate | Pedagogical offer | Pending | — | — | Needs source |
| FPT Taroudant | Pedagogical offer | Pending | — | — | Needs source |
| FEG Guelmim | Pedagogical offer | Pending | — | — | Needs source |
| ENCG Agadir | Pedagogical offer | Pending | — | — | Needs source |
| ENCG Dakhla | Pedagogical offer | Pending | — | — | Needs source |
| ENSA Agadir | Pedagogical offer | Pending | — | — | Needs source |
| ENSIAD Taroudant | Pedagogical offer | Pending | — | — | Needs source |
| ESEF Agadir | Pedagogical offer | Pending | — | — | Needs source |
| EST Agadir | Pedagogical offer | Pending | — | — | Needs source |
| EST Dakhla | Pedagogical offer | Pending | — | — | Needs source |
| EST Guelmim | Pedagogical offer | Pending | — | — | Needs source |
| EST Laayoune | Pedagogical offer | Pending | — | — | Needs source |
| EST Ouarzazate | Pedagogical offer | Pending | — | — | Needs source |
| Chariaa Ait Melloul | Pedagogical offer | Pending | — | — | Needs source |

## Rules

1. **No fabrication**: Only verified official sources. Unverified = "قيد التحقق" (pending).
2. **Source attribution**: Every document must have `source`, `source_url`, `published_date`, `verified_on`, `version`, `checksum` (SHA-256 for PDFs), `status`.
3. **Status values**: `verified` | `pending` | `outdated`
4. **Conflict resolution**: If two official sources conflict, show the newer one and log the conflict here.
5. **No unofficial sources**: Only university websites, ministry (MESRSI), official platforms (Tawjihi, Cursus, Taalim.ma).
6. **Copyright**: Only host PDFs that are publicly available administrative documents.

## Source Priority

1. University website (e.g., fsjpa.uiz.ac.ma)
2. Ministry of Higher Education (mesrsi.gov.ma)
3. Official platforms (Tawjihi, Cursus, Taalim.ma)
4. Academic regional directorates (AREF)

## Verification Process

1. Visit official source
2. Download/check document
3. Record: title, source URL, publication date, verification date
4. Compute SHA-256 hash (for PDFs)
5. Update this audit table
6. Set status to `verified` or `pending`

## Weekly Automated Check

A GitHub Action should:
1. Check source URLs for changes (hash/date)
2. Open a PR with differences only
3. NOT auto-publish
4. Send summary of changes

*(GitHub Action to be implemented in a future phase)*