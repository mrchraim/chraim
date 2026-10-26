# CHRVVIM AI HUB — Live Deploy Status

**Date:** 2026-10-16
**Status:** ✅ PERMANENTLY LIVE on GitHub Pages — https://mrchraim.github.io/chrvvim-ai-hub/

---

## ✅ FINAL RESULT — permanent live site (GitHub Pages)

| Item | Value |
|------|-------|
| **Public URL** | **https://mrchraim.github.io/chrvvim-ai-hub/** |
| Hub deep link | https://mrchraim.github.io/chrvvim-ai-hub/#hub |
| Host | GitHub Pages (free, no card, no expiry) |
| Repository | https://github.com/mrchraim/chrvvim-ai-hub (public) |
| Pages source | branch `main`, folder `/` (repo root) |
| Files online | **63 / 63 verified** (v11 — Gateway visual identity merged) |
| Service Worker cache | **`chrvvim-v11`** |
| Design | Gateway hero (gradient background + pulse) · 12 cards with icons |
| Pages build | `built` |

Verification (agent, after v11 deploy):
```
python _deploy_kit/verify_live.py https://mrchraim.github.io/chrvvim-ai-hub
PASSED: 63 / 63
RESULT: ALL GOOD
```
Runtime check on live (browser): Hero + pulse + 12 icons present, SW `chrvvim-v11`, `#hub` works.

Temporary preview tunnel (ephemeral, may die after session restart):
**https://showed-moved-latitude-performer.trycloudflare.com/#hub** (68/68 verified, 2026-10-16)
_(earlier tunnels, now dead: `ease-decided-tied-surge`, `grace-vault-acquisitions-logical`)_

Verification (agent, after the deploy):

```
python _deploy_kit/verify_live.py https://mrchraim.github.io/chrvvim-ai-hub
PASSED: 61 / 61
RESULT: ALL GOOD
```

Runtime check (browser DOM on the live URL): title OK, **15 tabs**, first tab =
«البوابة» (hub), hub panel visible with **21 cards**, CSS applied, `app.js`
loaded, Service Worker supported, `#hub` route works.

Security: a temporary classic PAT (`chrvvim-ai-hub-deploy`) was created only to
push, then **deleted/revoked** (API now returns 401). The token file was removed.

> The canonical `<link rel="canonical" href="/">` was left untouched (SEO rule).
> The site uses relative paths throughout, so it works on this project subpath.

---

## Earlier attempt: Netlify Drop (anonymous, temporary)

Created by the agent with zero credentials as a quick public preview.

### What happened

The agent drove the built‑in desktop browser to `https://app.netlify.com/drop`
(Netlify Drop accepts a **folder, ZIP, or single HTML** with **no login**) and
uploaded:

- `_deploy_kit/chrvvim-campus-DROPREDY.zip` (2,208,649 bytes, 61 files)

Netlify accepted the ZIP and **uploaded all 61 files to its edge** (verified in
the network log: `PUT .../files/index.html`, `sw.js`, `_headers`, `_redirects`,
`robots.txt`, `security.txt`, `sitemap.xml`, `data/*.json`, `assets/js/*` — all
HTTP 200).

### Live URLs (both created, both valid)

| # | URL | Password |
|---|-----|----------|
| 1 | https://fascinating-taiyaki-f0b02c.netlify.app | `My-Drop-Site` |
| 2 | https://sunny-muffin-967a74.netlify.app | `My-Drop-Site` |

> Two sites were created because the injected file input fired **both** a
> `change` event (react-dropzone input) and a synthetic `drop` event.

### Verification

```
GET  /                -> 401 (Netlify "Password Protection" page)
POST form-name=form 1 & password=My-Drop-Site -> 200
     contains: chrvvim, ai hub, hub, ibn zohr, timetable
     <title>CHRVVIM CAMPUS ... | ...</title>
     length: 22,894 bytes
```

## ⚠️ Critical limits of this free path

1. **Expires after ~1 hour** ("Your project stays live for an hour before it expires").
2. **Password‑protected** (`My-Drop-Site`) until the site is **claimed**.
3. **To make it permanent, a human must click “Claim this site” and log in** —
   anonymous drops cannot be kept without an account.

Netlify Drop countdown observed: 58:41 remaining at creation.

## Permanence

✅ **DONE** — the permanent site is the GitHub Pages URL at the top of this
document. The paths below were the options considered; option **C** was used.

- ~~A. Claim this Netlify preview~~ — not used (owner's Netlify account is
  currently `usage_exceeded` → risk of 503).
- B. Cloudflare Pages — still available as an alternative host; guide in
  `_deploy_kit/DEPLOY_STEPS_CLOUDFLARE_AR.md`.
- **C. GitHub Pages — ✅ USED.** Repo `mrchraim/chrvvim-ai-hub`, branch `main`,
  source `/`, live at https://mrchraim.github.io/chrvvim-ai-hub/.

## Artefacts

- `_deploy_kit/pages-deploy.ps1` — creates the repo, pushes the site, enables Pages.
- `_deploy_kit/gh_check.py` — repo/tree/Pages status checker (token read from file).
- `_deploy_kit/verify_live.py` — verifies a deployment (61 files) against a URL.
- `_deploy_kit/chrvvim-campus-DROPREDY.zip` — the payload used for the Netlify preview.
- `_deploy_kit/push-to-github.ps1` — alternative repo create + push (whole project).
- `_deploy_kit/legacy_redirects.snippet.txt` — prepared, **not active**.
- `_reports/legacy-url-map.md` — old → new URL map.

## Untouched (as required)

- No existing link, SEO tag, canonical, or domain was modified.
- No original project deleted.


---
## v6 advanced-portal integration (latest)

Source repo: `chrvvim-campus/` (local git), branch `main`, HEAD `7892221`.

- **Integrated as source:** `chrvvim-campus/advanced/` (30 files) — the v6 portal
  (Express + better-sqlite3 + RBAC + admin console + 10 PDF documents + full
  academic guide). Kept as a clearly-separated sibling project because it is a
  **server app** and cannot run on GitHub Pages.
- **Published site kept clean:** after auditing, the 5 files that had been copied
  into `web/` were removed, because they added **no value** to the static site:
  * `admin-v6.*` / `index-v6.html` — need the Node server; unreferenced by the site.
  * `academic-guide-2026-2027.json` — unreferenced (site uses `academic-guide.json`).
  * `founder-mohamed-chraim.jpeg` — **byte-identical duplicate** of existing `founder.jpeg`.
  * `academic-documents.json` — reverted to the original: the v6 copy only changed a
    shadda in 4 Arabic descriptions and *dropped* the useful "relative paths" note.
- **Result:** `web/` is back to the exact verified **v11 = 63 files**, matching the
  permanent live site 1:1. **No push is required** — the live site is already final.
- Verification: `verify_live.py` → **63/63 PASS** on both `http://127.0.0.1:8778` and
  the tunnel mirror.
- Ephemeral public preview (dies on session restart):
  **https://showed-moved-latitude-performer.trycloudflare.com/#hub** (63/63)
- Note: the project lives inside OneDrive "Files On-Demand"; files are placeholders
  (reparse points) that hydrate on read. First read of a dehydrated file can be slow
  (caused one transient verifier error that passed on retry).

### If you later want the v6 portal online as a full app
It needs a persistent Node host (Render / Railway / Fly.io — all free tiers, all
require a one-time account login by the owner). Guide can be added on request.
`advanced/package.json` → `npm start` (`node server/index.js`, Node ≥ 20).


---

## 2026-10-16 — Full architecture audit (after user reported "result is weak")

### Why it felt weak — two concrete reasons

1. **The permanent GitHub Pages URL serves only the `hub` page**, not the real portal.
   * Live now: https://mrchraim.github.io/chrvvim-ai-hub/  ->  `chrvvim-campus/web` = **63 files**, thin hub landing.
   * The **real, full portal** exists as a ready mirror: `chrvvim-ai-hub/site/` = **71 files**,
     `index.html` 78,951 B, `app.js` 97,686 B, `campus-data.js` 91,298 B, **33 PDF documents**,
     plus `admin.html`, `legal.js`, `subjects.js`, `university-formations.js`, Supabase config.
   * It is **not published anywhere permanent** (only on the Netlify primary, and that one is a
     slightly older revision: live index 77,949 B vs mirror 78,951 B).

2. **The legacy 301 redirects cannot be activated right now** — hard external blocker:
   ```
   GET https://mrchraimfsjpachrvvim.netlify.app/  -> 503
        {"error":"usage_exceeded","message":"Usage exceeded"}
   GET https://chrvvim0k0l0a0k0.netlify.app/      -> 503  (same body)
   ```
   The Netlify team exceeded the free-tier allowance. Netlify **rejects new deploys while over
   quota**, so `deploy-legacy-redirects.ps1` cannot publish the `_redirects` until the quota is
   restored (cycle reset / support reset / paid plan). This is not a code problem.
   Ready support ticket: `chrvvim-ai-hub/deploy/netlify-support-ticket_EN.md`.

### Live URL map

| Site | URL | State |
|---|---|---|
| Primary portal (Netlify) | https://mr1mohamed1chraim.netlify.app/ | 200 — full portal (older revision) |
| Legacy 1 | https://chrvvim0k0l0a0k0.netlify.app/ | **503 usage_exceeded** |
| Legacy 2 | https://mrchraimfsjpachrvvim.netlify.app/ | **503 usage_exceeded** |
| GitHub Pages (permanent) | https://mrchraim.github.io/chrvvim-ai-hub/ | 200 — thin hub (63 files) |
| GitHub root user-site | https://mrchraim.github.io/ | 404 (free to create) |

### Account / credential state (checked, nothing usable)

* GitHub: browser **logged out** (both `/settings/tokens` and `/` show the sign-in page).
* Windows Credential Manager holds `git:https://github.com` (user `mrchraim`) and
  `git:https://x-access-token@github.com`, but the stored secret is **no longer accepted** —
  `git push` returns `could not read Username` / "user interactivity has been disabled".
  -> a fresh **GitHub login** is required to push.
* Netlify: CLI 27.13.0 installed (Node v24.20.0 present) but `netlify status` = **Not logged in**;
  browser at `app.netlify.com` shows the **log-in page**. No token file
  (`%TEMP%\opencode\netlify_token.txt`) exists.

### Prepared / ready

* `chrvvim-ai-hub/site/` — full portal, GitHub-Pages-ready after a **12-line fix**
  (`/assets/...` -> `assets/...` in `index.html`) plus `.nojekyll` and a `404.html` SPA fallback.
  Root-absolute refs total only **17** (12 in index.html, all `/assets/`; the rest are harmless
  `/api/...` fetch fallbacks already guarded in `app.js`).
* `chrvvim-ai-hub/legacy-redirects/<site>/_redirects` — the 301 rules, ready.
* `chrvvim-ai-hub/deploy/*.ps1` — create-and-push, deploy-legacy-redirects, verify-redirects, RUN_ALL.
* `chrvvim-ai-hub/deploy/netlify-support-ticket_EN.md` — paste-and-send quota-reset request.

### Live previews (ephemeral, die on session restart)

* Thin hub (what GitHub Pages serves today): https://mrchraim.github.io/chrvvim-ai-hub/
* **Full portal** (local mirror, served at root so absolute paths work):
  https://drops-side-ensures-albuquerque.trycloudflare.com
