-- Comprehensive MFA Hardening for All Selected Tables
-- Adds RESTRICTIVE RLS policies to 43 additional tables beyond user_profiles and contacts
-- Based on: https://supabase.com/blog/mfa-auth-via-rls

-- Note: This assumes the helper function check_mfa_required() already exists
-- If not, run supabase_official_mfa_hardening.sql first

-- =====================================================
-- HIGH PRIORITY TABLES (18 tables)
-- =====================================================

-- Profile Info Tables
CREATE POLICY "mfa_enforce_aal2_profile_info_staff"
ON public.profile_info_staff
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_profile_info_student"
ON public.profile_info_student
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_profile_info_family_member"
ON public.profile_info_family_member
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Family Management Tables
CREATE POLICY "mfa_enforce_aal2_families"
ON public.families
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_family_members"
ON public.family_members
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_family_member_child_links"
ON public.family_member_child_links
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Student Records
CREATE POLICY "mfa_enforce_aal2_student_absence_notes"
ON public.student_absence_notes
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_student_daily_log"
ON public.student_daily_log
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_student_emergency_information"
ON public.student_emergency_information
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Staff Records
CREATE POLICY "mfa_enforce_aal2_staff_absences"
ON public.staff_absences
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_staff_documents"
ON public.staff_documents
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_staff_contracts"
ON public.staff_contracts
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_staff_work_contracts"
ON public.staff_work_contracts
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- User Management
CREATE POLICY "mfa_enforce_aal2_user_roles"
ON public.user_roles
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_protected_roles"
ON public.protected_roles
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_user_codes"
ON public.user_codes
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Student Pickup Management
CREATE POLICY "mfa_enforce_aal2_student_pickup_arrangement_overrides"
ON public.student_pickup_arrangement_overrides
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_student_weekly_pickup_arrangements"
ON public.student_weekly_pickup_arrangements
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- =====================================================
-- MEDIUM PRIORITY TABLES (15 tables)
-- =====================================================

-- Attendance and Diary
CREATE POLICY "mfa_enforce_aal2_student_attendance_logs"
ON public.student_attendance_logs
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_lesson_diary_entries"
ON public.lesson_diary_entries
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Communications
CREATE POLICY "mfa_enforce_aal2_bulletin_posts"
ON public.bulletin_posts
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_bulletin_post_users"
ON public.bulletin_post_users
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Course Management
CREATE POLICY "mfa_enforce_aal2_course_notes"
ON public.course_notes
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Staff Management
CREATE POLICY "mfa_enforce_aal2_staff_absence_comments"
ON public.staff_absence_comments
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_staff_class_links"
ON public.staff_class_links
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_staff_subjects"
ON public.staff_subjects
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_staff_duty_plan"
ON public.staff_duty_plan
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_staff_yearly_preferences"
ON public.staff_yearly_preferences
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Student Preferences
CREATE POLICY "mfa_enforce_aal2_student_course_wish_choices"
ON public.student_course_wish_choices
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_student_course_wish_submissions"
ON public.student_course_wish_submissions
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_student_presence_events"
ON public.student_presence_events
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- System Management (Admin-only recommended)
CREATE POLICY "mfa_enforce_aal2_change_log"
ON public.change_log
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- User Groups
CREATE POLICY "mfa_enforce_aal2_user_groups"
ON public.user_groups
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_user_group_members"
ON public.user_group_members
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- =====================================================
-- SELECTED LOW PRIORITY TABLES (10 tables)
-- =====================================================

-- Course Applications and Enrollments
CREATE POLICY "mfa_enforce_aal2_course_applications"
ON public.course_applications
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_course_enrollments"
ON public.course_enrollments
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Course Scheduling
CREATE POLICY "mfa_enforce_aal2_course_lessons"
ON public.course_lessons
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_course_list"
ON public.course_list
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_course_offers"
ON public.course_offers
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_course_possible_times"
ON public.course_possible_times
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_course_registration_windows"
ON public.course_registration_windows
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "mfa_enforce_aal2_course_schedules"
ON public.course_schedules
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Schedule Management
CREATE POLICY "mfa_enforce_aal2_schedule_drafts"
ON public.schedule_drafts
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- Substitutions
CREATE POLICY "mfa_enforce_aal2_substitutions"
ON public.substitutions
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- =====================================================
-- VERIFICATION AND SUMMARY
-- =====================================================

-- Create function to list all MFA-protected tables
CREATE OR REPLACE FUNCTION list_mfa_protected_tables()
RETURNS TABLE (
    table_name text,
    policy_name text,
    policy_type text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pol.tablename::text,
        pol.policyname::text,
        CASE 
            WHEN pol.permissive = 'RESTRICTIVE' THEN 'RESTRICTIVE'
            ELSE 'PERMISSIVE'
        END::text
    FROM pg_policies pol
    WHERE pol.schemaname = 'public'
        AND pol.policyname LIKE '%mfa_%'
        AND pol.permissive = 'RESTRICTIVE'
    ORDER BY pol.tablename, pol.policyname;
END;
$$ LANGUAGE plpgsql;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION list_mfa_protected_tables() TO authenticated;

-- Show summary
SELECT 'Comprehensive MFA hardening completed!' as status;
SELECT 'Added RESTRICTIVE MFA policies to 43 additional tables' as summary;

-- List all protected tables
SELECT 'MFA-Protected Tables:' as info;
SELECT * FROM list_mfa_protected_tables();

-- Show policy count
SELECT 
    'Total MFA policies created:' as metric,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE';

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
COVERAGE SUMMARY:
- Total tables in database: 108
- Tables now protected with MFA: 45 (2 existing + 43 new)
- Coverage percentage: 42% of all tables
- Focus: All sensitive data, user records, and operational data

SECURITY IMPACT:
- Users without MFA factors: Normal access (AAL1 sufficient)
- Users with MFA factors: MUST complete MFA (AAL2 required) to access these 45 tables
- All policies are RESTRICTIVE (enforced in addition to existing RLS)

PERFORMANCE CONSIDERATIONS:
- Each RESTRICTIVE policy adds a query check
- Monitor query performance after deployment
- Consider indexing on commonly queried columns if needed

TESTING RECOMMENDATIONS:
1. Test with users who have no MFA factors (should work normally)
2. Test with users who have MFA but are in AAL1 session (should be blocked)
3. Test with users who have completed MFA (AAL2 session) (should work normally)
4. Test admin functions on change_log table
5. Monitor application performance with new policies

ROLLBACK:
To remove all MFA policies if needed:
DROP POLICY IF EXISTS "mfa_enforce_aal2_[table_name]" ON public.[table_name];
*/
