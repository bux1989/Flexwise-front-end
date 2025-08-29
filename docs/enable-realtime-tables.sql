-- FlexWise Real-time Tables Setup
-- Enable real-time subscriptions for critical school operations

-- ==============================================
-- CRITICAL SAFETY & OPERATIONS TABLES (Phase 1)
-- ==============================================

-- 1. Daily check-in/out tracking (14:30 & 16:00 dismissal coordination)
ALTER PUBLICATION supabase_realtime ADD TABLE student_daily_log;

-- 2. Lesson cancellations, room changes, schedule modifications
ALTER PUBLICATION supabase_realtime ADD TABLE course_lessons;

-- 3. Substitute lesson assignments (Vertretungsstunden)
ALTER PUBLICATION supabase_realtime ADD TABLE substitutions;

-- 4. Staff absences triggering substitute assignments
ALTER PUBLICATION supabase_realtime ADD TABLE staff_absences;

-- 5. Info-Board announcements, emergency notices
ALTER PUBLICATION supabase_realtime ADD TABLE bulletin_posts;

-- ==============================================
-- HIGH PRIORITY DAILY OPERATIONS (Phase 2)
-- ==============================================

-- 6. Lesson-level attendance tracking (live badge updates)
ALTER PUBLICATION supabase_realtime ADD TABLE student_attendance_logs;

-- 7. Klassenbuch entries by teachers
ALTER PUBLICATION supabase_realtime ADD TABLE lesson_diary_entries;

-- 8. Student absence requests and approvals
ALTER PUBLICATION supabase_realtime ADD TABLE student_absence_notes;

-- 9. Detailed presence event tracking
ALTER PUBLICATION supabase_realtime ADD TABLE student_presence_events;

-- ==============================================
-- VERIFICATION QUERY
-- ==============================================

-- Verify which tables are enabled for real-time
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
ORDER BY tablename;

-- ==============================================
-- NOTES
-- ==============================================

-- Real-time Use Cases Covered:
-- ✅ 14:30/16:00 student check-out coordination
-- ✅ Live attendance badge updates ("20/1/2")
-- ✅ Instant lesson cancellation notifications
-- ✅ Vertretung (substitute) assignments
-- ✅ Emergency Info-Board announcements
-- ✅ Klassenbuch entries from co-teachers
-- ✅ Absence request approvals
-- ✅ Staff absence notifications
-- ✅ Detailed presence tracking

-- Expected Performance Impact:
-- - 9 tables enabled for real-time
-- - School-wide + teacher-specific subscriptions
-- - Estimated peak load: 50-200 concurrent connections
-- - CX42 server capacity: Excellent (well within limits)

-- Next Steps:
-- 1. Execute this script on self-hosted Supabase
-- 2. Implement real-time hooks in React application
-- 3. Test with multiple users during dismissal times
