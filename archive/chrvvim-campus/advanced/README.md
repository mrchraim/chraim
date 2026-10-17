# CHRVVIM Student Portal — Advanced preparation build

This is a development build for the CHRVVIM student portal. It is **not yet production-certified**: source checks can pass while real sign-in, persistence, deployment, accessibility and security behavior still need runtime testing.

## Current scope

### Public portal
- Public access to published schedules, courses, professor directory, rooms and announcements.
- S1, S3 and S5 schedules are read from the database only when published.
- The academic guide includes S1 private/public common-core tracks, supplied S3 private-law sessions and A–N surname ranges, and eight S5 tracks/pathways. New imported records remain drafts until reviewed and published.
- The S5 public page uses track labels from a sanitized public guide; unpublished course/schedule details remain in the seed source and are not served through the public JSON route.
- S3 French distribution and A–N surname ranges remain explicitly marked as user-supplied information requiring official verification.
- Draft S3 timetable JSON is retained for seeding but the server does not serve it as a public file.

### Admin console
- Server-side session authentication, bcrypt password hashes, CSRF checks, rate limits, Helmet security headers, input validation, and audit events.
- Roles:
  - `admin`: full access, user management, delete records, audit log.
  - `editor`: can create and edit draft content only; cannot publish, delete, or manage accounts.
  - `publisher`: can edit and publish/archive content; cannot delete records or manage accounts.
- Content entities: schedules, courses, professors, rooms and announcements.
- Account management: create accounts, change role, enable/disable accounts, reset password.
- Public announcements are displayed on the home page. These are in-site notices, **not browser push notifications**.


### Founder profile / الهوية الرقمية للمؤسس
- تمت إضافة صفحة تعريفية بارزة لمحمد شرايم بتصميم تحريري هادئ باللون الكحلي والذهبي، وصورة المؤسس داخل قسمه فقط، وخلفية زخرفية لرمز العدالة.
- تشمل النبذة والمسار الأكاديمي والاهتمامات البحثية والكتابة ورسالة المنصة والحضور الرقمي.
- روابط التواصل مركزية في `public/founder-profile.json`، ويُسمح بعرض الروابط التي تطابق قائمة النطاقات الآمنة في `app.js` فقط. تحقق من كل رابط بنفسك قبل النشر؛ لا تعني هذه الروابط أن الحساب موثّق.
- لتعديل الروابط، حرّر `public/founder-profile.json` ثم أعد النشر. حقول النبذة في الصفحة الحالية جزء من `index.html` وتحتاج تعديلاً في ذلك الملف. لا توجد حتى الآن شاشة إدارة مخصصة لتعديل بيانات المؤسس أو رفع صورته من المتصفح.
- صورة المؤسس محفوظة في `public/assets/founder-mohamed-chraim.jpeg`، وتُخدم عبر مسار محدد مسموح به.

## Requirements
- Node.js 20 or newer (use a current LTS release).
- npm (bundled with Node.js).
- A persistent writable disk for SQLite database and sessions, or a future migration to a managed database.

## Local setup (Windows)
1. Extract this ZIP to a normal folder, e.g. `Documents\\chrvvim-portal`.
2. Install Node.js LTS from https://nodejs.org/en/download/.
3. Open Command Prompt in the extracted folder.
4. Copy `.env.example` to `.env`.
5. Edit `.env`: set a unique `SESSION_SECRET` with at least 32 random characters, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 14 characters. Do not send these secrets to anyone or commit `.env` to GitHub.
6. Run `npm install`.
7. Run `npm run check` to validate JavaScript syntax, the academic JSON files, and selected security guardrails.
8. Run `npm run seed` once to create the database, import initial records as drafts and create the first administrator.
9. Run `npm start`.
10. Open `http://localhost:3000/` for the public portal and `http://localhost:3000/admin` for the admin console.

Do not run `npm run seed` as a routine update. It avoids overwriting existing records, but it is intended for initial setup. If a database already contains schedule rows, seed does not merge the newly added S1/S3 rows; use a fresh local database for first-time setup or add records carefully through the admin console.

## Before internet deployment
- Choose a Node.js host with persistent storage. The SQLite database and session store must survive restarts and deploys. Do not deploy this build on ephemeral storage without migrating to a managed database and durable session store.
- Configure `NODE_ENV=production`, a strong `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` through the host's secret manager. Never commit `.env`.
- Ensure HTTPS is enabled; production cookies are marked Secure.
- Create the initial admin during first boot/seed in a controlled environment, then protect or remove any bootstrap workflow that could be rerun publicly.
- Test sign-in, logout, role restrictions, account disablement, publishing, announcement expiry, and persistence across a restart.
- Back up the SQLite database and test restoring it before launch.
- Verify every academic fact against official faculty notices before publishing. User-provided schedule data is initially imported as drafts.

## Known limitations / next work
- The current runtime has not been fully integration-tested because dependency installation was unavailable in the preparation environment. `npm run check` is only a syntax check, not a live server/auth test.
- Browser push notifications, email/SMS notifications, student-specific accounts, password-reset email flows, multi-factor authentication, and a dedicated settings screen are not implemented.
- A proper migration plan is needed if an existing database was created by an earlier build; the safest first use is a fresh database before any production data is entered.
- Admin endpoints now re-check the account role and active status against SQLite on protected requests, so role changes/deactivation take effect instead of trusting a stale session role.
- Before a public launch, perform a code review and a security test of all endpoints and hosting configuration.
