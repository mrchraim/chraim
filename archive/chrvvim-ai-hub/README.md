# CHRVVIM AI HUB

Consolidated source of the **CHRVVIM Campus** student portal.

| | |
|---|---|
| **Primary (canonical) site** | https://mr1mohamed1chraim.netlify.app/ |
| **Legacy site 1** (redirects to primary) | https://chrvvim0k0l0a0k0.netlify.app/ |
| **Legacy site 2** (redirects to primary) | https://mrchraimfsjpachrvvim.netlify.app/ |

## What this repository is

`site/` is a faithful, deployable mirror of the **live primary** static app
(HTML + CSS + JS + JSON + fonts + 33 PDF documents, no build step, no
external dependencies). It is the single source of truth going forward.

`legacy-redirects/` contains the ready-to-deploy HTTP 301 redirect rules that
point each legacy Netlify site at the primary.

`tools/` contains the read-only mirror script and a local link checker.

`docs/` contains the audit / merge / redirect / test reports.

`deploy/` contains the ready-to-run finishing kit:
* `DEPLOY_ALL_AR.md` — step-by-step guide (Arabic)
* `create-and-push-repo.ps1` — create the GitHub repo and push
* `deploy-legacy-redirects.ps1` — publish the 301 redirects to the legacy sites
* `verify-redirects.ps1` — confirm 301 -> primary (path/query preserved)
* `RUN_ALL.ps1` — run all of the above in sequence
* `netlify-support-ticket_EN.md` — ready-to-send quota-reset request

## Deploy (Netlify)

```
publish directory : site
build command     : (none — static)
```

Redirects/headers ship inside the publish directory (`site/_redirects`,
`site/_headers`), exactly like the deployed original.

## Finishing the legacy migration (redirect old -> primary)

The two legacy sites are currently offline (`503 usage_exceeded`). Once the
Netlify quota is restored, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\RUN_ALL.ps1
```

See `deploy/DEPLOY_ALL_AR.md` for the full guide (login, quota recovery,
GitHub push, redirect deploy, verification).

> Note: a deleted `*.netlify.app` subdomain is **not** released to another
> account, so do not delete the legacy sites — recover the quota instead.

## Safety

* The live primary site was **read-only mirrored**; nothing was pushed to it.
* No DNS, no repository, and no production deployment was changed.
* Everything here is reproducible from `tools/mirror_primary.py`.
