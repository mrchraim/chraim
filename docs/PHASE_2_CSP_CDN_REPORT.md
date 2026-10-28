# Phase 2 — CSP & CDN Elimination Report

**Date:** 2026-10-28
**Branch:** design-upgrade
**Status:** Completed

## Summary

All CDN dependencies have been removed from every HTML file in the project. The Content Security Policy has been tightened to remove external font CDN origins.

## Changes Made

### 1. portal-simple.html — CSP Conversion
- **Removed:** Google Fonts CDN (fonts.googleapis.com, fonts.gstatic.com)
- **Removed:** Tailwind CSS CDN (cdn.tailwindcss.com) + inline tailwind.config
- **Added:** Local font CSS (`/assets/fonts/cairo.css`, `/assets/fonts/fonts.css`)
- **Added:** Local Tailwind CSS (`/assets/tailwind-home.css`, `/assets/components.css`)
- **Added:** i18n script (`/page-i18n.js`)
- **Added:** Back-home floating nav (`/assets/back-home.js`)
- **Fixed:** `target="_blank"` → added `rel="noopener noreferrer"`

### 2. university-directory.html — Font CDN Conversion
- **Removed:** Google Fonts CDN (fonts.googleapis.com)
- **Added:** Local Cairo font CSS (`/assets/fonts/cairo.css`)

### 3. _headers — CSP Tightening
- **Removed:** `https://fonts.googleapis.com` from `style-src`
- **Removed:** `https://fonts.gstatic.com` from `font-src`
- **Result:** `font-src 'self' data:` (no external font origins)

## Verification

| Check | Result |
|-------|--------|
| Tailwind CDN in any HTML | 0 occurrences |
| Google Fonts CDN in any HTML | 0 occurrences |
| Other CDN (jsdelivr, unpkg, cdnjs) | 0 occurrences |
| Broken links (audit-links.py) | 0 |
| Security audit (audit-security.py) | Warnings only (expected) |
| Unit tests (vitest) | 11/11 passed |
| Lint (eslint) | 0 errors, 344 warnings (pre-existing) |
| Format (prettier) | All files pass |

## Remaining CSP Notes

- `script-src 'self' 'unsafe-inline'` — still required because many pages use inline scripts. Removing `'unsafe-inline'` would require moving all inline JS to external files (future work).
- `style-src 'self' 'unsafe-inline'` — still required for inline styles. Same consideration.
- `img-src 'self' data: blob: https:` — allows any HTTPS image (needed for Google Maps embeds, user content).

## Commits

- `9eb1720` — fix: convert portal-simple.html to CSP-safe (local CSS, no CDN)
- `9616700` — fix: convert university-directory.html to CSP-safe (local Cairo font)
- `0771d3f` — fix: tighten CSP — remove font CDN origins (all fonts now local)