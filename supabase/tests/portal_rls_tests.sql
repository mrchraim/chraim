-- ============================================================================
--  Portal RLS Test Suite — CHRVVIM Campus
--  Project: https://idpafbyefrywjixskvvu.supabase.co
--
--  Run these tests in Supabase SQL Editor or via psql.
--  Each test should be run as a specific role (anon, authenticated, admin).
--
--  Test matrix:
--  | Role          | announcements (read) | exam_files (read) | exam_files (insert) | storage (read) | storage (insert) |
--  |---------------|---------------------|-------------------|--------------------|--------------|--------------------|
--  | anon          | published only      | approved only     | pending only       | approved only | contrib/ only      |
--  | authenticated | published only      | approved only     | pending only       | approved only | contrib/ only      |
--  | admin         | all                 | all               | all                | all          | all                |
-- ============================================================================

-- ============================================================================
-- TEST 1: Anonymous user can read published announcements
-- Expected: SUCCESS (returns published announcements)
-- ============================================================================
-- SET ROLE anon;
-- SELECT count(*) FROM public.announcements WHERE status = 'published';
-- RESET ROLE;

-- ============================================================================
-- TEST 2: Anonymous user CANNOT read draft announcements
-- Expected: 0 rows (RLS filters them out)
-- ============================================================================
-- SET ROLE anon;
-- SELECT count(*) FROM public.announcements WHERE status = 'draft';
-- RESET ROLE;

-- ============================================================================
-- TEST 3: Anonymous user can read approved exam files
-- Expected: SUCCESS
-- ============================================================================
-- SET ROLE anon;
-- SELECT count(*) FROM public.exam_files WHERE status = 'approved';
-- RESET ROLE;

-- ============================================================================
-- TEST 4: Anonymous user CANNOT read pending exam files
-- Expected: 0 rows
-- ============================================================================
-- SET ROLE anon;
-- SELECT count(*) FROM public.exam_files WHERE status = 'pending';
-- RESET ROLE;

-- ============================================================================
-- TEST 5: Anonymous user can insert pending exam file
-- Expected: SUCCESS
-- ============================================================================
-- SET ROLE anon;
-- INSERT INTO public.exam_files (subject_id, file_path, status)
-- VALUES ('test_subject', 'contrib/test.pdf', 'pending');
-- RESET ROLE;

-- ============================================================================
-- TEST 6: Anonymous user CANNOT insert approved exam file
-- Expected: ERROR (RLS violation)
-- ============================================================================
-- SET ROLE anon;
-- INSERT INTO public.exam_files (subject_id, file_path, status)
-- VALUES ('test_subject', 'contrib/test2.pdf', 'approved');
-- RESET ROLE;

-- ============================================================================
-- TEST 7: Anonymous user CANNOT update exam files
-- Expected: 0 rows affected (RLS blocks)
-- ============================================================================
-- SET ROLE anon;
-- UPDATE public.exam_files SET status = 'approved' WHERE status = 'pending';
-- RESET ROLE;

-- ============================================================================
-- TEST 8: Anonymous user CANNOT delete exam files
-- Expected: 0 rows affected
-- ============================================================================
-- SET ROLE anon;
-- DELETE FROM public.exam_files WHERE id = 1;
-- RESET ROLE;

-- ============================================================================
-- TEST 9: Authenticated non-admin CANNOT read draft announcements
-- Expected: 0 rows
-- ============================================================================
-- SET ROLE authenticated;
-- SELECT count(*) FROM public.announcements WHERE status = 'draft';
-- RESET ROLE;

-- ============================================================================
-- TEST 10: Admin can read all announcements
-- Expected: SUCCESS (all rows)
-- ============================================================================
-- SET ROLE authenticated; -- (as admin user)
-- SELECT count(*) FROM public.announcements;
-- RESET ROLE;

-- ============================================================================
-- TEST 11: Admin can insert announcement
-- Expected: SUCCESS
-- ============================================================================
-- SET ROLE authenticated; -- (as admin user)
-- INSERT INTO public.announcements (title, body, status) VALUES ('Test', 'Body', 'draft');
-- RESET ROLE;

-- ============================================================================
-- TEST 12: Admin can update announcement status
-- Expected: SUCCESS
-- ============================================================================
-- SET ROLE authenticated; -- (as admin user)
-- UPDATE public.announcements SET status = 'published' WHERE title = 'Test';
-- RESET ROLE;

-- ============================================================================
-- TEST 13: Admin can delete announcement
-- Expected: SUCCESS
-- ============================================================================
-- SET ROLE authenticated; -- (as admin user)
-- DELETE FROM public.announcements WHERE title = 'Test';
-- RESET ROLE;

-- ============================================================================
-- TEST 14: Anonymous cannot read admins table
-- Expected: 0 rows
-- ============================================================================
-- SET ROLE anon;
-- SELECT count(*) FROM public.admins;
-- RESET ROLE;

-- ============================================================================
-- TEST 15: Authenticated user can only read own admin row
-- Expected: 0 or 1 row (own row only)
-- ============================================================================
-- SET ROLE authenticated;
-- SELECT count(*) FROM public.admins WHERE user_id = auth.uid();
-- RESET ROLE;

-- ============================================================================
-- TEST 16: Storage — anonymous can only read approved exam files
-- Expected: Only objects linked to approved exams
-- ============================================================================
-- SET ROLE anon;
-- SELECT count(*) FROM storage.objects WHERE bucket_id = 'edu-files';
-- RESET ROLE;

-- ============================================================================
-- TEST 17: Storage — anonymous can upload to contrib/ only
-- Expected: SUCCESS for contrib/, FAIL for other folders
-- ============================================================================
-- SET ROLE anon;
-- -- This should succeed:
-- INSERT INTO storage.objects (bucket_id, name) VALUES ('edu-files', 'contrib/test.pdf');
-- -- This should fail (RLS violation):
-- INSERT INTO storage.objects (bucket_id, name) VALUES ('edu-files', 'approved/test.pdf');
-- RESET ROLE;

-- ============================================================================
-- TEST 18: Download counter — anonymous can only increment by 1
-- Expected: SUCCESS for +1, FAIL for +2 or more
-- ============================================================================
-- SET ROLE anon;
-- -- This should succeed (if exam is approved):
-- SELECT public.bump_exam_download(1);
-- -- This should fail or be reverted:
-- UPDATE public.exam_files SET downloads = downloads + 5 WHERE id = 1;
-- RESET ROLE;

-- ============================================================================
-- CLEANUP: Remove test data
-- ============================================================================
-- DELETE FROM public.exam_files WHERE subject_id = 'test_subject';
-- DELETE FROM storage.objects WHERE bucket_id = 'edu-files' AND name LIKE 'contrib/test%';
-- ============================================================================