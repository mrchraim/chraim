# Security Policy

## الإبلاغ عن ثغرات

لا تفتح issue عام. أرسل تقريراً عبر:
- **Email:** mrchraim@users.noreply.github.com
- **GitHub Private vulnerability reporting**

يُجيب المشرف خلال 72 ساعة.

---

## الوضع الأمني الفعلي (مطابق للواقع)

| بند | الحالة |
|---|---|
| `management-system-16j.pages.dev` | لوحة إدارة (محمية بـ Cloudflare Access) |
| `ms-ops-7f3a9c.pages.dev` | بيئة تشغيل (محمية بـ Cloudflare Access) |

### 1. المفاتيح (Supabase)
- **مفتاح publishable** (`sb_publishable_...`) موجود في `supabase-config.js` — هذا مفتاح **علني** (publishable)، ليس سراً.
- الأمان = Supabase Auth + RLS. لا تضع `service_role` key أبداً في الكود.

### 2. Cloudflare Pages + Access
- Cloudflare Pages + Cloudflare Access + MFA.
- لا توجد أي حسابات مسؤول غير `cheraimmohamed20@gmail.com`.

### 3. CSP (الفعلي في `_headers`)
- `script-src 'self' 'unsafe-inline'` — يسمح بـ inline scripts (لا يزال 'unsafe-inline').
- `style-src 'self' 'unsafe-inline'`.
- `img-src 'self' data: blob: https:`.
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co`.
- `worker-src 'self' blob:`.
- **خطة التشديد:** نقل السكربتات المضمّنة إلى ملفات خارجية (المرحلة 2ج)، ثم إزالة `'unsafe-inline'` من `script-src` وتفعيل السياسة (حالياً في `Content-Security-Policy-Report-Only`).

### 4. رؤوس الأمان
- HSTS preload، COOP/CORP/CORP، nosniff، Permissions-Policy، upgrade-insecure-requests.

### 5. 404 / noindex
- `/admin.html` و `/admin*`: `X-Robots-Tag: noindex, nofollow` + `no-store`.
- `functions/` (إن وُجدت) لا تُنشر عبر `wrangler pages deploy`.

### 6. RLS (Supabase)
- RLS مفعّل على 18/18 جداول (FORCE).
- `anon` (زائر): SELECT على المنشور + INSERT/UPDATE محدود (downloads +1).
- `authenticated` (مستخدم): SELECT على pending.
- `viewer` / `editor` / `admin`: صلاحيات متدرجة.
- Buckets `edu-files`, `documents`: private (0 public).

### 7. Audit (append-only)
- `contact_messages` / `edu_questions`: INSERT فقط (لا UPDATE/DELETE).
- Trigger `guard_exam_downloads`: +1 download per exam.

---

## Cloudflare Pages (ملاحظات تشغيل)

| بند | الحالة |
|---|---|
| `_redirects` (3xx) | مدعوم (Cloudflare Pages) |
| `functions/` | لا يُنشر عبر `wrangler pages deploy` (استخدم middleware) |
| hash routing | 404 عند refresh (استخدم hash-based routing) |
| `.assetsignore` | غير مدعوم في Pages |
| inline scripts | CSP يسمح بـ 'unsafe-inline' (خطة: نقل إلى js/*-inline.js) |
| Cache-Control catch-all | Cloudflare may override (no-store + max-age=0) |

ملاحظات: `admin-console/README.md`.

---

## Cloudflare Access

| بند | القيمة |
|---|---|
| Zero Trust | `lingering-tree-508e.cloudflareaccess.com` |
| Session | 24 ساعة |
| App 1 | `ms-ops-7f3a9c.pages.dev` |
| App 2 | `*.ms-ops-7f3a9c.pages.dev` (wildcard) |
| Policy | "Owner only" — email = cheraimmohamed20@gmail.com |
| unmatched | deny_unmatched_requests = false |

`management-system-16j.pages.dev` **غير** محمي (200). استخدم Cloudflare Access.

---

## Supabase: RLS + Storage

- Project: `uftqrgpzllvqlaztcjbq`.
- Migration: `supabase/migrations/20261021_harden_rls_policies.sql`.
- RLS: 18/18 tables (FORCE).
- Storage objects: 4 (Cloudflare/Supabase assets).
- Buckets: `edu-files`, `documents` (private, 0 public).
- Triggers: `on_auth_user_created` (viewer default), `guard_exam_downloads` (+1).

### ملاحظات RLS
1. **anon** (زائر): SELECT على المنشور + INSERT/UPDATE محدود (downloads +1).
2. **anon UPDATE على exams**: محكوم بـ trigger (+1 download).
3. **edu-files**: private (signed URLs).
4. **viewer**: لا يوجد admin تلقائياً.
5. **contact_messages / edu_questions**: INSERT فقط (return=minimal).
6. **documents**: requires authentication.

> تحقق: `python _tools/audit_supabase_rls.py` → 39 checks, 0 failures.

---

## تحقق (audit)

- `python _tools/audit_final.py` — فحص CSP + headers + caching.
- `python _tools/audit_admin.py` — فحص Cloudflare Access (302).
- `python _tools/audit_supabase_rls.py` — RLS + Storage.

GitHub secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID): تحقق في Settings → Secrets and variables → Actions.

---

## خارج النطاق (Out of scope)

- DoS/DDoS
- Bug bounty (لا يوجد برنامج)
- Third-party (Cloudflare, Supabase, jsDelivr)