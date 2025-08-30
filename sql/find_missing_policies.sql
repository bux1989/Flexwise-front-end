-- Find Missing MFA Policies
-- Compare expected vs actual policies

-- Expected tables from your checklist
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        -- High Priority (18)
        'profile_info_staff', 'profile_info_student', 'profile_info_family_member',
        'families', 'family_members', 'family_member_child_links',
        'student_absence_notes', 'student_daily_log', 'student_emergency_information',
        'staff_absences', 'staff_documents', 'staff_contracts', 'staff_work_contracts',
        'user_roles', 'protected_roles', 'user_codes',
        'student_pickup_arrangement_overrides', 'student_weekly_pickup_arrangements',
        
        -- Medium Priority (15)
        'student_attendance_logs', 'lesson_diary_entries', 'bulletin_posts', 'bulletin_post_users',
        'course_notes', 'staff_absence_comments', 'staff_class_links', 'staff_subjects',
        'staff_duty_plan', 'staff_yearly_preferences', 'student_course_wish_choices',
        'student_course_wish_submissions', 'student_presence_events', 'change_log',
        'user_groups', 'user_group_members',
        
        -- Selected Operational (10)
        'course_applications', 'course_enrollments', 'course_lessons', 'course_list',
        'course_offers', 'course_possible_times', 'course_registration_windows', 
        'course_schedules', 'schedule_drafts', 'substitutions',
        
        -- Base (2)
        'user_profiles', 'contacts'
    ]) as table_name
),
actual_tables AS (
    SELECT DISTINCT tablename as table_name
    FROM pg_policies 
    WHERE schemaname = 'public' 
        AND policyname LIKE '%mfa_%' 
        AND permissive = 'RESTRICTIVE'
)
SELECT 
    'Missing Tables' as check_type,
    CASE 
        WHEN COUNT(et.table_name) = 0 
        THEN '✅ All expected tables have MFA policies'
        ELSE '❌ Missing MFA policies for: ' || string_agg(et.table_name, ', ')
    END as result
FROM expected_tables et
LEFT JOIN actual_tables at ON et.table_name = at.table_name
WHERE at.table_name IS NULL;

-- Count actual unique tables
SELECT 
    'Actual Coverage' as metric,
    COUNT(DISTINCT tablename) || ' unique tables protected' as result
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE';

-- Count actual total policies  
SELECT 
    'Total Policies' as metric,
    COUNT(*) || ' total MFA policies' as result
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE';

-- Show tables with multiple policies
SELECT 
    'Tables with Multiple Policies' as info,
    tablename || ' (' || COUNT(*) || ' policies)' as details
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE'
GROUP BY tablename
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- List all policy names to find the discrepancy
SELECT 
    'All MFA Policies' as info,
    tablename || ': ' || policyname as policy_details
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE'
ORDER BY tablename, policyname;
