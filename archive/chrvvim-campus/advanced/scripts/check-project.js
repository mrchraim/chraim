'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const readJson = name => JSON.parse(fs.readFileSync(path.join(root, 'public', name), 'utf8'));

const draft = readJson('timetable-s3-draft.json');
const publicGuide = readJson('academic-guide-public.json');
const fullGuide = readJson('academic-guide-2026-2027.json');
assert.equal(draft.metadata?.status, 'transcription_draft_not_finally_verified', 'S3 source must remain clearly marked as draft');
assert.ok(Array.isArray(draft.timetable), 'S3 draft timetable must be an array');
assert.ok(draft.timetable.length > 0, 'S3 draft timetable must contain source rows');
assert.ok(Array.isArray(publicGuide.s5_tracks), 'Public guide must include S5 track metadata');
assert.ok(Array.isArray(fullGuide.s5_tracks), 'Full academic guide must include S5 tracks');
assert.equal(fullGuide.s1_tracks?.length, 2, 'S1 must include both common-core tracks');
assert.equal(fullGuide.s3_law_private_schedule?.length, 7, 'S3 law-private image timetable must be present');
assert.equal(fullGuide.s3_law_public_schedule?.length, 7, 'S3 law-public image timetable must be present');
assert.equal(fullGuide.s3_group_ranges?.length, 14, 'S3 group ranges A–N must be present');
assert.equal(fullGuide.s5_tracks.length, 8, 'S5 guide must include all eight supplied tracks');
assert.ok(Array.isArray(publicGuide.s1_tracks), 'Public guide must include S1 track selectors');

const server = fs.readFileSync(path.join(root, 'server', 'index.js'), 'utf8');
assert.match(server, /app\.get\('\/public\/:file'/, 'Public assets must use an explicit allowlist route');
assert.match(server, /const allowed=new Set\(\['academic-guide-public\.json','founder-profile\.json'\]\)/, 'Only approved public JSON files should be downloadable');
assert.match(server, /public\/assets\/\:file/, 'Founder portrait must use a dedicated allowlisted asset route');
const founderProfile = readJson('founder-profile.json');
assert.ok(Array.isArray(founderProfile.socials), 'Founder social links must be centralized in public profile config');
assert.ok(fs.existsSync(path.join(root,'public','assets','founder-mohamed-chraim.jpeg')), 'Founder portrait asset must exist');
assert.match(server, /SELECT id,email,role,active FROM admins WHERE id=\?/, 'Admin permissions must be revalidated against the database');
assert.match(server, /timingSafeEqual/, 'CSRF token comparison must be timing-safe');
assert.match(server, /bcrypt\.compare/, 'Login must compare password hashes');
assert.match(server, /status='published'/, 'Public endpoints must filter unpublished content');

console.log(`Project checks passed: ${draft.timetable.length} S3 draft rows; public guide and security guardrails verified.`);
console.log('Note: this is a static/data check, not a substitute for live HTTP integration and browser testing.');
