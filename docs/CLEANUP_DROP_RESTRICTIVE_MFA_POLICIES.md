# Cleanup: Drop All RESTRICTIVE MFA Policies

## AS SUPERUSER (Database Settings > SQL Editor):

```sql
-- Drop all RESTRICTIVE MFA policies from the 47 tables
-- Based on your debugging results showing these policy names

-- Critical Tables
DROP POLICY IF EXISTS "mfa_enforce_aal2_user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "mfa_restrict_admin_operations" ON public.user_profiles;
DROP POLICY IF EXISTS "mfa_restrict_profile_updates" ON public.user_profiles;
DROP POLICY IF EXISTS "mfa_enforce_aal2_contacts" ON public.contacts;
DROP POLICY IF EXISTS "mfa_enforce_aal2_families" ON public.families;
DROP POLICY IF EXISTS "mfa_enforce_aal2_family_members" ON public.family_members;
DROP POLICY IF EXISTS "mfa_enforce_aal2_family_member_child_links" ON public.family_member_child_links;
DROP POLICY IF EXISTS "mfa_enforce_aal2_profile_info_staff" ON public.profile_info_staff;
DROP POLICY IF EXISTS "mfa_enforce_aal2_profile_info_student" ON public.profile_info_student;
DROP POLICY IF EXISTS "mfa_enforce_aal2_profile_info_family_member" ON public.profile_info_family_member;
DROP POLICY IF EXISTS "mfa_enforce_aal2_student_absence_notes" ON public.student_absence_notes;
DROP POLICY IF EXISTS "mfa_enforce_aal2_student_daily_log" ON public.student_daily_log;
DROP POLICY IF EXISTS "mfa_enforce_aal2_student_emergency_information" ON public.student_emergency_information;
DROP POLICY IF EXISTS "mfa_enforce_aal2_staff_absences" ON public.staff_absences;
DROP POLICY IF EXISTS "mfa_enforce_aal2_staff_documents" ON public.staff_documents;
DROP POLICY IF EXISTS "mfa_enforce_aal2_staff_contracts" ON public.staff_contracts;
DROP POLICY IF EXISTS "mfa_enforce_aal2_staff_work_contracts" ON public.staff_work_contracts;
DROP POLICY IF EXISTS "mfa_enforce_aal2_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "mfa_enforce_aal2_protected_roles" ON public.protected_roles;
DROP POLICY IF EXISTS "mfa_enforce_aal2_user_codes" ON public.user_codes;
DROP POLICY IF EXISTS "mfa_enforce_aal2_student_pickup_arrangement_overrides" ON public.student_pickup_arrangement_overrides;
DROP POLICY IF EXISTS "mfa_enforce_aal2_student_weekly_pickup_arrangements" ON public.student_weekly_pickup_arrangements;

-- Operational Tables
DROP POLICY IF EXISTS "mfa_enforce_aal2_student_attendance_logs" ON public.student_attendance_logs;
DROP POLICY IF EXISTS "mfa_enforce_aal2_lesson_diary_entries" ON public.lesson_diary_entries;
DROP POLICY IF EXISTS "mfa_enforce_aal2_bulletin_posts" ON public.bulletin_posts;
DROP POLICY IF EXISTS "mfa_enforce_aal2_bulletin_post_users" ON public.bulletin_post_users;
DROP POLICY IF EXISTS "mfa_enforce_aal2_course_notes" ON public.course_notes;
DROP POLICY IF EXISTS "mfa_enforce_aal2_staff_absence_comments" ON public.staff_absence_comments;
DROP POLICY IF EXISTS "mfa_enforce_aal2_staff_class_links" ON public.staff_class_links;
DROP POLICY IF EXISTS "mfa_enforce_aal2_staff_subjects" ON public.staff_subjects;
DROP POLICY IF EXISTS "mfa_enforce_aal2_staff_duty_plan" ON public.staff_duty_plan;
DROP POLICY IF EXISTS "mfa_enforce_aal2_staff_yearly_preferences" ON public.staff_yearly_preferences;
DROP POLICY IF EXISTS "mfa_enforce_aal2_student_course_wish_choices" ON public.student_course_wish_choices;
DROP POLICY IF EXISTS "mfa_enforce_aal2_student_course_wish_submissions" ON public.student_course_wish_submissions;
DROP POLICY IF EXISTS "mfa_enforce_aal2_student_presence_events" ON public.student_presence_events;
DROP POLICY IF EXISTS "mfa_enforce_aal2_change_log" ON public.change_log;
DROP POLICY IF EXISTS "mfa_enforce_aal2_user_groups" ON public.user_groups;
DROP POLICY IF EXISTS "mfa_enforce_aal2_user_group_members" ON public.user_group_members;
DROP POLICY IF EXISTS "mfa_enforce_aal2_course_applications" ON public.course_applications;
DROP POLICY IF EXISTS "mfa_enforce_aal2_course_enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "mfa_enforce_aal2_course_lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "mfa_enforce_aal2_course_list" ON public.course_list;
DROP POLICY IF EXISTS "mfa_enforce_aal2_course_offers" ON public.course_offers;
DROP POLICY IF EXISTS "mfa_enforce_aal2_course_possible_times" ON public.course_possible_times;
DROP POLICY IF EXISTS "mfa_enforce_aal2_course_registration_windows" ON public.course_registration_windows;
DROP POLICY IF EXISTS "mfa_enforce_aal2_course_schedules" ON public.course_schedules;
DROP POLICY IF EXISTS "mfa_enforce_aal2_schedule_drafts" ON public.schedule_drafts;
DROP POLICY IF EXISTS "mfa_enforce_aal2_substitutions" ON public.substitutions;

-- Verify cleanup
SELECT 
  'Cleanup Verification' as test,
  count(*) as remaining_restrictive_mfa_policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%mfa_%'
  AND permissive = 'RESTRICTIVE';

-- Should return 0 remaining policies
SELECT 
  'Remaining MFA Policies' as info,
  tablename,
  policyname,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%mfa_%'
ORDER BY tablename, policyname;
```

## What This Script Does

1. **Drops all 47 RESTRICTIVE MFA policies** identified in your debugging
2. **Preserves all PERMISSIVE policies** (school isolation, etc.)
3. **Keeps the `check_mfa_required()` function** - you'll need it for the permissive policies
4. **Verifies cleanup** - shows remaining policy count (should be 0)

## What You Keep

- ✅ All PERMISSIVE policies (school isolation logic)
- ✅ The `check_mfa_required()` function
- ✅ All grants and RLS settings
- ✅ Your existing tenant isolation logic

## Next Step

After running this cleanup, you'll have a clean slate with only permissive policies. Then you can systematically add MFA checks to each permissive policy without any conflicts.
