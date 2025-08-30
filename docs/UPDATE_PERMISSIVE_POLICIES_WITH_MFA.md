# Update Permissive Policies with MFA Checks

## Step 1: Identify All Current Permissive Policies

### AS SUPERUSER - Run this first to see what we're working with:

```sql
-- List all current permissive policies on the 46 tables needing MFA
SELECT 
  'Current Permissive Policies' as info,
  tablename,
  policyname,
  cmd,
  'Needs MFA check added' as action_needed
FROM pg_policies 
WHERE schemaname = 'public' 
  AND permissive = 'PERMISSIVE'
  AND tablename IN (
    'user_profiles', 'contacts', 'families', 'family_members', 'family_member_child_links',
    'profile_info_staff', 'profile_info_student', 'profile_info_family_member',
    'student_absence_notes', 'student_daily_log', 'student_emergency_information',
    'staff_absences', 'staff_documents', 'staff_contracts', 'staff_work_contracts',
    'user_roles', 'protected_roles', 'user_codes',
    'student_pickup_arrangement_overrides', 'student_weekly_pickup_arrangements',
    'student_attendance_logs', 'lesson_diary_entries', 'bulletin_posts', 'bulletin_post_users',
    'course_notes', 'staff_absence_comments', 'staff_class_links', 'staff_subjects',
    'staff_duty_plan', 'staff_yearly_preferences', 'student_course_wish_choices',
    'student_course_wish_submissions', 'student_presence_events', 'change_log',
    'user_groups', 'user_group_members', 'course_applications', 'course_enrollments',
    'course_lessons', 'course_list', 'course_offers', 'course_possible_times',
    'course_registration_windows', 'course_schedules', 'schedule_drafts', 'substitutions'
  )
ORDER BY tablename, policyname;
```

## Step 2: Update Known Critical Policies

Based on your previous debugging, start with these known policies:

```sql
-- 1. Update user_profiles school isolation policy
DROP POLICY IF EXISTS "user_profiles_school_isolation" ON public.user_profiles;
CREATE POLICY "user_profiles_school_isolation"
ON public.user_profiles
FOR ALL
TO authenticated
USING (
  -- Preserve existing school isolation logic
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) 
  AND 
  -- Add MFA requirement using optimized function call
  (SELECT public.check_mfa_required())
);

-- 2. Update contacts policies
DROP POLICY IF EXISTS "school_isolation_contacts_select" ON public.contacts;
CREATE POLICY "school_isolation_contacts_select"
ON public.contacts
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_contacts_insert" ON public.contacts;
CREATE POLICY "school_isolation_contacts_insert"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_contacts_update" ON public.contacts;
CREATE POLICY "school_isolation_contacts_update"
ON public.contacts
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_contacts_delete" ON public.contacts;
CREATE POLICY "school_isolation_contacts_delete"
ON public.contacts
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

-- 3. Update families policies
DROP POLICY IF EXISTS "school_isolation_families_select" ON public.families;
CREATE POLICY "school_isolation_families_select"
ON public.families
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_families_insert" ON public.families;
CREATE POLICY "school_isolation_families_insert"
ON public.families
FOR INSERT
TO authenticated
WITH CHECK (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_families_update" ON public.families;
CREATE POLICY "school_isolation_families_update"
ON public.families
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_families_delete" ON public.families;
CREATE POLICY "school_isolation_families_delete"
ON public.families
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);
```

## Step 3: Verify Critical Updates

```sql
-- Test the updated policies
SELECT 
  'Updated Policies Test' as test,
  tablename,
  policyname,
  'Should now include MFA check' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'contacts', 'families')
  AND permissive = 'PERMISSIVE'
ORDER BY tablename, policyname;
```

## Next Steps

1. **Run Step 1** to see all current permissive policies
2. **Run Step 2** to update the critical 3 tables we know about
3. **Test with your policy tester** to see if those 3 tables are now blocked
4. **Systematically update remaining tables** based on Step 1 results

## Pattern for Remaining Tables

For any additional policies found in Step 1, use this pattern:

```sql
-- Template for updating any permissive policy
DROP POLICY IF EXISTS "existing_policy_name" ON public.table_name;
CREATE POLICY "existing_policy_name"
ON public.table_name
FOR [command]
TO authenticated
USING (
  -- Keep existing logic here (tenant isolation, etc.)
  [existing_conditions]
  AND 
  -- Add MFA requirement
  (SELECT public.check_mfa_required())
);
```

**Key Points:**
- Use `(SELECT public.check_mfa_required())` for performance (Supabase best practice)
- Preserve all existing tenant isolation logic
- Add MFA as an additional AND condition
- Handle both USING and WITH CHECK clauses where needed

Run Step 1 first and let me know what policies you find - then we can update the remaining tables systematically.
