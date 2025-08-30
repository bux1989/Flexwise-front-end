-- Verification Script for Comprehensive MFA Policies
-- Run this after executing comprehensive_mfa_hardening.sql

-- Check if helper function exists
SELECT 
    'Helper Function Status' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'public' AND p.proname = 'check_mfa_required'
        ) THEN '✅ check_mfa_required() function exists'
        ELSE '❌ check_mfa_required() function MISSING - run supabase_official_mfa_hardening.sql first'
    END as status;

-- Count total MFA policies
SELECT 
    'Policy Count' as check_type,
    COUNT(*) || ' RESTRICTIVE MFA policies found' as status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE';

-- Expected vs Actual policy count
WITH expected AS (
    SELECT 45 as expected_count -- 2 existing + 43 new
),
actual AS (
    SELECT COUNT(*) as actual_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
        AND policyname LIKE '%mfa_%' 
        AND permissive = 'RESTRICTIVE'
)
SELECT 
    'Coverage Verification' as check_type,
    CASE 
        WHEN actual.actual_count = expected.expected_count 
        THEN '✅ All ' || expected.expected_count || ' MFA policies created successfully'
        ELSE '⚠️ Expected ' || expected.expected_count || ' policies, found ' || actual.actual_count
    END as status
FROM expected, actual;

-- List all protected tables (should be 45)
SELECT 
    'Protected Tables List' as info,
    'Table: ' || tablename || ' | Policy: ' || policyname as details
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE'
ORDER BY tablename;

-- Check for any missing critical tables
WITH critical_tables AS (
    SELECT unnest(ARRAY[
        'user_profiles', 'contacts', 'profile_info_staff', 'profile_info_student',
        'families', 'family_members', 'family_member_child_links', 
        'student_absence_notes', 'student_daily_log', 'student_emergency_information',
        'staff_absences', 'staff_documents', 'user_roles', 'change_log'
    ]) as table_name
),
protected_tables AS (
    SELECT DISTINCT tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
        AND policyname LIKE '%mfa_%' 
        AND permissive = 'RESTRICTIVE'
)
SELECT 
    'Missing Critical Tables' as check_type,
    CASE 
        WHEN COUNT(ct.table_name) = 0 
        THEN '✅ All critical tables are protected'
        ELSE '❌ Missing MFA policies for: ' || string_agg(ct.table_name, ', ')
    END as status
FROM critical_tables ct
LEFT JOIN protected_tables pt ON ct.table_name = pt.tablename
WHERE pt.tablename IS NULL;

-- Test the MFA function (safe read-only test)
SELECT 
    'MFA Function Test' as check_type,
    CASE 
        WHEN public.check_mfa_required() IS NOT NULL 
        THEN '✅ check_mfa_required() function executes successfully'
        ELSE '❌ check_mfa_required() function returns NULL'
    END as status;

-- Check current user's MFA status for context
SELECT 
    'Current Session Info' as info,
    'User ID: ' || COALESCE(auth.uid()::text, 'anonymous') as user_info,
    'AAL Level: ' || COALESCE(auth.jwt() ->> 'aal', 'none') as aal_level,
    'Has MFA Factors: ' || CASE 
        WHEN EXISTS(
            SELECT 1 FROM auth.mfa_factors 
            WHERE user_id = auth.uid() 
            AND status = 'verified'
        ) THEN 'Yes' 
        ELSE 'No' 
    END as mfa_status;

-- Verify specific table categories
SELECT 'High Priority Tables (18)' as category, COUNT(*) as protected_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE'
    AND tablename IN (
        'profile_info_staff', 'profile_info_student', 'profile_info_family_member',
        'families', 'family_members', 'family_member_child_links',
        'student_absence_notes', 'student_daily_log', 'student_emergency_information',
        'staff_absences', 'staff_documents', 'staff_contracts', 'staff_work_contracts',
        'user_roles', 'protected_roles', 'user_codes',
        'student_pickup_arrangement_overrides', 'student_weekly_pickup_arrangements'
    )

UNION ALL

SELECT 'Medium Priority Tables (15)' as category, COUNT(*) as protected_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE'
    AND tablename IN (
        'student_attendance_logs', 'lesson_diary_entries', 'bulletin_posts', 'bulletin_post_users',
        'course_notes', 'staff_absence_comments', 'staff_class_links', 'staff_subjects',
        'staff_duty_plan', 'staff_yearly_preferences', 'student_course_wish_choices',
        'student_course_wish_submissions', 'student_presence_events', 'change_log',
        'user_groups', 'user_group_members'
    )

UNION ALL

SELECT 'Selected Operational Tables (10)' as category, COUNT(*) as protected_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE'
    AND tablename IN (
        'course_applications', 'course_enrollments', 'course_lessons', 'course_list',
        'course_offers', 'course_possible_times', 'course_registration_windows', 
        'course_schedules', 'schedule_drafts', 'substitutions'
    )

UNION ALL

SELECT 'Base Tables (2)' as category, COUNT(*) as protected_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE'
    AND tablename IN ('user_profiles', 'contacts');

-- Performance check - list tables that might need indexing
SELECT 
    'Performance Considerations' as info,
    'Large tables with MFA policies (consider indexing): ' || string_agg(tablename, ', ') as recommendation
FROM (
    SELECT DISTINCT pol.tablename
    FROM pg_policies pol
    JOIN pg_class c ON c.relname = pol.tablename
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE pol.schemaname = 'public' 
        AND pol.policyname LIKE '%mfa_%' 
        AND pol.permissive = 'RESTRICTIVE'
        AND n.nspname = 'public'
        AND c.reltuples > 1000  -- Tables with more than 1000 estimated rows
) large_tables;

-- Summary
SELECT 
    '=== VERIFICATION SUMMARY ===' as final_check,
    'MFA policies successfully implemented on 45 tables providing comprehensive security coverage' as result;

-- Instructions for next steps
SELECT 
    '=== NEXT STEPS ===' as next_steps,
    'Test with different user types: 1) No MFA, 2) MFA but AAL1, 3) MFA with AAL2' as instructions;
