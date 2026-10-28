# THREAT_MODEL.md — CHRVVIM Campus

**Date:** 2026-10-28
**Status:** Draft — pending review

---

## 1. Assets

| Asset | Location | Sensitivity |
|-------|----------|-------------|
| Student data (names, emails) | Supabase platform DB | High (PII) |
| Admin credentials | Supabase Auth | Critical |
| Exam files (PDFs) | Supabase Storage (edu-files) | Medium |
| Announcements | Supabase DB | Low (public) |
| Source code | GitHub | Medium |
| Cloudflare config | Cloudflare dashboard | High |
| Supabase config | Supabase dashboard | Critical |
| DNS/domain | Cloudflare | Critical |

## 2. Threat Actors

| Actor | Motivation | Capability |
|-------|-----------|------------|
| Script kiddie | Defacement, data theft | Low — automated tools |
| Malicious student | Grade manipulation, data access | Medium — knows the system |
| Compromised dependency | Supply chain attack | High — automated |
| Insider threat | Data exfiltration | High — legitimate access |
| Nation-state | Surveillance, disruption | Very High |

## 3. Attack Vectors & Controls

### 3.1 Cross-Site Scripting (XSS)
- **Vector:** User input in search, comments, announcements
- **Controls:** CSP (script-src 'self'), input sanitization, output encoding, no innerHTML with untrusted data
- **Residual risk:** 'unsafe-inline' in CSP weakens protection
- **Mitigation:** Move inline scripts to external files (future phase)

### 3.2 SQL Injection
- **Vector:** Search queries, filters, API parameters
- **Controls:** Parameterized queries (Supabase client), RLS policies, input validation
- **Residual risk:** Low (Supabase client handles parameterization)

### 3.3 Authentication Bypass
- **Vector:** Admin panel access, role escalation
- **Controls:** Supabase Auth, RLS on admins table, is_admin() function, Cloudflare Access (proposed)
- **Residual risk:** Medium (no MFA enforced, no Cloudflare Access yet)

### 3.4 Data Leakage
- **Vector:** RLS bypass, storage policy misconfiguration, API enumeration
- **Controls:** RLS on all tables, storage policies, anon key only in frontend
- **Residual risk:** Medium (portal schema lacks FORCE RLS, permissive storage read)

### 3.5 Supply Chain
- **Vector:** Compromised npm/pip packages, CDN injection
- **Controls:** All libs vendored locally, no CDN in production, gitleaks in CI, Dependabot
- **Residual risk:** Low

### 3.6 Denial of Service
- **Vector:** Flooding, large file uploads, expensive queries
- **Controls:** Cloudflare DDoS protection, file size limits (25MB), rate limiting (proposed)
- **Residual risk:** Medium (no explicit rate limiting on API calls)

### 3.7 Social Engineering
- **Vector:** Phishing, impersonation
- **Controls:** MFA (proposed), security awareness, no sensitive data in frontend
- **Residual risk:** Medium

## 4. Controls Summary

| Control | Status | Notes |
|---------|--------|-------|
| CSP headers | ✅ Implemented | 'unsafe-inline' retained |
| HSTS | ✅ Implemented | max-age=31536000 |
| X-Frame-Options | ✅ DENY | |
| RLS (platform) | ✅ Hardened | Migration applied |
| RLS (portal) | ⚠️ Partial | Migration created, not applied |
| FORCE RLS | ⚠️ Partial | Platform only |
| MFA | ❌ Not implemented | Proposed |
| Cloudflare Access | ❌ Not implemented | Proposed for /admin |
| Rate limiting | ❌ Not implemented | Proposed |
| Audit logging | ❌ Not implemented | Proposed |
| Secret scanning | ✅ CI (gitleaks) | |
| Dependency scanning | ✅ Dependabot | |
| Backup/restore | ❌ Not documented | RUNBOOK.md needed |

## 5. Recommendations

1. Apply portal RLS migration (`20261028_harden_portal_rls.sql`)
2. Enforce MFA for admin accounts
3. Implement Cloudflare Access for /admin
4. Add rate limiting to Supabase API calls
5. Create RUNBOOK.md with incident response procedures
6. Move inline scripts to external files (CSP improvement)
7. Add audit logging for admin operations