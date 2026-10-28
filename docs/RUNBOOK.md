# RUNBOOK.md — CHRVVIM Campus Operations

**Date:** 2026-10-28
**Status:** Draft — pending review

---

## 1. Deployment

### Build
```bash
python tools/build-dist.py --out dist --clean
python tools/audit-links.py --root dist
python tools/audit-security.py
```

### Deploy to Cloudflare Pages
1. Push to `main` branch (triggers CI)
2. CI runs: lint → test → build → audit-links → audit-security → gitleaks
3. Cloudflare Pages deploys from `dist/` directory
4. Verify at https://chraim.pages.dev

### Rollback
1. Identify last known good commit: `git log --oneline -10`
2. Revert: `git revert <commit-hash>` (creates new commit)
3. Push to main: `git push origin main`
4. Cloudflare auto-deploys reverted version
5. Verify at https://chraim.pages.dev

**DO NOT use `git reset --hard` or `git push --force` on main.**

---

## 2. Secret Rotation

### If a secret is leaked:
1. **Immediately** revoke the leaked secret in its service (Supabase, Cloudflare, GitHub)
2. Generate a new secret
3. Update GitHub Secrets / Cloudflare env vars
4. Update any code references
5. Force push is NOT needed (secret was in history — use BFG Repo-Cleaner or git-filter-repo)
6. Audit git history: `gitleaks detect --source . --verbose`
7. Notify team

### Supabase Key Rotation
1. Go to Supabase Dashboard → Settings → API
2. Generate new anon key
3. Update `supabase-config.js` and `platform/js/config.js`
4. Update any environment variables
5. Deploy

### Cloudflare API Token Rotation
1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Revoke old token
3. Create new token with minimal permissions
4. Update GitHub Secrets: `CLOUDFLARE_API_TOKEN`
5. Test deployment

---

## 3. Incident Response

### Severity Levels
| Level | Description | Response Time |
|-------|-------------|---------------|
| P1 | Site down, data breach | Immediate |
| P2 | Major feature broken | 4 hours |
| P3 | Minor issue | 24 hours |
| P4 | Cosmetic | Next sprint |

### Incident Checklist
1. **Detect:** Monitor alerts, user reports, CI failures
2. **Assess:** Determine severity and impact
3. **Contain:** Disable affected feature if needed
4. **Fix:** Apply fix on feature branch, test, PR
5. **Deploy:** Merge PR, verify deployment
6. **Post-mortem:** Write incident report, update RUNBOOK

### Common Incidents

#### Site Down
1. Check Cloudflare Pages status
2. Check DNS resolution
3. Check last deployment
4. Rollback if needed (see Rollback section)

#### Data Breach
1. Revoke all API keys immediately
2. Disable Supabase project if needed
3. Notify affected users
4. Investigate scope
5. Patch vulnerability
6. Rotate all secrets

#### Broken Links
1. Run `python tools/audit-links.py --root dist`
2. Fix broken links
3. Rebuild and redeploy

#### CSP Violations
1. Check browser console for CSP errors
2. Update `_headers` if needed
3. Test with CSP Report-Only first
4. Deploy

---

## 4. Supabase Operations

### Apply Migration
1. Open Supabase SQL Editor
2. Paste migration file contents
3. Run
4. Verify with test queries

### Backup
1. Supabase Dashboard → Database → Backups
2. Download backup
3. Store securely (encrypted)

### Restore
1. Supabase Dashboard → Database → Backups
2. Select backup
3. Restore (creates new project or overwrites)

---

## 5. Monitoring

### What to Monitor
- Site availability (uptime)
- Error rates (404, 500)
- Lighthouse scores (performance, accessibility)
- Security headers (CSP, HSTS)
- Broken links (weekly audit)
- Supabase RLS (monthly review)

### Tools
- Cloudflare Analytics
- GitHub Actions CI
- Lighthouse CI (in CI workflow)
- gitleaks (secret scanning)
- audit-security.py (custom security audit)

---

## 6. Contacts

| Role | Contact |
|------|---------|
| Project Owner | Mohamed Chraim |
| Repository | https://github.com/mrchraim/chraim |
| Live Site | https://chraim.pages.dev |
| Supabase (Portal) | idpafbyefrywjixskvvu.supabase.co |
| Supabase (Platform) | uftqrgpzllvqlaztcjbq.supabase.co |