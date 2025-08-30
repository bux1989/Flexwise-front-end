# Update All Permissive Policies with MFA Checks

## AS SUPERUSER - Complete Policy Update Script

Based on your current policies, here's the comprehensive update script:

```sql
-- =====================================================
-- UPDATE ALL SCHOOL ISOLATION POLICIES WITH MFA CHECKS
-- =====================================================

-- BULLETIN_POST_USERS (4 policies)
DROP POLICY IF EXISTS "school_isolation_bulletin_post_users_delete" ON public.bulletin_post_users;
CREATE POLICY "school_isolation_bulletin_post_users_delete" ON public.bulletin_post_users FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_post_users_insert" ON public.bulletin_post_users;
CREATE POLICY "school_isolation_bulletin_post_users_insert" ON public.bulletin_post_users FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_post_users_select" ON public.bulletin_post_users;
CREATE POLICY "school_isolation_bulletin_post_users_select" ON public.bulletin_post_users FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_post_users_update" ON public.bulletin_post_users;
CREATE POLICY "school_isolation_bulletin_post_users_update" ON public.bulletin_post_users FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- BULLETIN_POSTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_bulletin_posts_delete" ON public.bulletin_posts;
CREATE POLICY "school_isolation_bulletin_posts_delete" ON public.bulletin_posts FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_posts_insert" ON public.bulletin_posts;
CREATE POLICY "school_isolation_bulletin_posts_insert" ON public.bulletin_posts FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_posts_select" ON public.bulletin_posts;
CREATE POLICY "school_isolation_bulletin_posts_select" ON public.bulletin_posts FOR SELECT TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_posts_update" ON public.bulletin_posts;
CREATE POLICY "school_isolation_bulletin_posts_update" ON public.bulletin_posts FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- CHANGE_LOG (4 policies)
DROP POLICY IF EXISTS "school_isolation_change_log_delete" ON public.change_log;
CREATE POLICY "school_isolation_change_log_delete" ON public.change_log FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_change_log_insert" ON public.change_log;
CREATE POLICY "school_isolation_change_log_insert" ON public.change_log FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_change_log_select" ON public.change_log;
CREATE POLICY "school_isolation_change_log_select" ON public.change_log FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_change_log_update" ON public.change_log;
CREATE POLICY "school_isolation_change_log_update" ON public.change_log FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- CONTACTS (4 policies) 
DROP POLICY IF EXISTS "school_isolation_contacts_delete" ON public.contacts;
CREATE POLICY "school_isolation_contacts_delete" ON public.contacts FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_contacts_insert" ON public.contacts;
CREATE POLICY "school_isolation_contacts_insert" ON public.contacts FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_contacts_select" ON public.contacts;
CREATE POLICY "school_isolation_contacts_select" ON public.contacts FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_contacts_update" ON public.contacts;
CREATE POLICY "school_isolation_contacts_update" ON public.contacts FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_APPLICATIONS (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_applications_delete" ON public.course_applications;
CREATE POLICY "school_isolation_course_applications_delete" ON public.course_applications FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_applications_insert" ON public.course_applications;
CREATE POLICY "school_isolation_course_applications_insert" ON public.course_applications FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_applications_select" ON public.course_applications;
CREATE POLICY "school_isolation_course_applications_select" ON public.course_applications FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_applications_update" ON public.course_applications;
CREATE POLICY "school_isolation_course_applications_update" ON public.course_applications FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_ENROLLMENTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_enrollments_delete" ON public.course_enrollments;
CREATE POLICY "school_isolation_course_enrollments_delete" ON public.course_enrollments FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_enrollments_insert" ON public.course_enrollments;
CREATE POLICY "school_isolation_course_enrollments_insert" ON public.course_enrollments FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_enrollments_select" ON public.course_enrollments;
CREATE POLICY "school_isolation_course_enrollments_select" ON public.course_enrollments FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_enrollments_update" ON public.course_enrollments;
CREATE POLICY "school_isolation_course_enrollments_update" ON public.course_enrollments FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_LESSONS (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_lessons_delete" ON public.course_lessons;
CREATE POLICY "school_isolation_course_lessons_delete" ON public.course_lessons FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_lessons_insert" ON public.course_lessons;
CREATE POLICY "school_isolation_course_lessons_insert" ON public.course_lessons FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_lessons_select" ON public.course_lessons;
CREATE POLICY "school_isolation_course_lessons_select" ON public.course_lessons FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_lessons_update" ON public.course_lessons;
CREATE POLICY "school_isolation_course_lessons_update" ON public.course_lessons FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_LIST (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_list_delete" ON public.course_list;
CREATE POLICY "school_isolation_course_list_delete" ON public.course_list FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_list_insert" ON public.course_list;
CREATE POLICY "school_isolation_course_list_insert" ON public.course_list FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_list_select" ON public.course_list;
CREATE POLICY "school_isolation_course_list_select" ON public.course_list FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_list_update" ON public.course_list;
CREATE POLICY "school_isolation_course_list_update" ON public.course_list FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_NOTES (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_notes_delete" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_delete" ON public.course_notes FOR DELETE TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_notes_insert" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_insert" ON public.course_notes FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_notes_select" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_select" ON public.course_notes FOR SELECT TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_notes_update" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_update" ON public.course_notes FOR UPDATE TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_POSSIBLE_TIMES (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_possible_times_delete" ON public.course_possible_times;
CREATE POLICY "school_isolation_course_possible_times_delete" ON public.course_possible_times FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_possible_times_insert" ON public.course_possible_times;
CREATE POLICY "school_isolation_course_possible_times_insert" ON public.course_possible_times FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_possible_times_select" ON public.course_possible_times;
CREATE POLICY "school_isolation_course_possible_times_select" ON public.course_possible_times FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_possible_times_update" ON public.course_possible_times;
CREATE POLICY "school_isolation_course_possible_times_update" ON public.course_possible_times FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_REGISTRATION_WINDOWS (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_registration_windows_delete" ON public.course_registration_windows;
CREATE POLICY "school_isolation_course_registration_windows_delete" ON public.course_registration_windows FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_registration_windows_insert" ON public.course_registration_windows;
CREATE POLICY "school_isolation_course_registration_windows_insert" ON public.course_registration_windows FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_registration_windows_select" ON public.course_registration_windows;
CREATE POLICY "school_isolation_course_registration_windows_select" ON public.course_registration_windows FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_registration_windows_update" ON public.course_registration_windows;
CREATE POLICY "school_isolation_course_registration_windows_update" ON public.course_registration_windows FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_SCHEDULES (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_schedules_delete" ON public.course_schedules;
CREATE POLICY "school_isolation_course_schedules_delete" ON public.course_schedules FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_schedules_insert" ON public.course_schedules;
CREATE POLICY "school_isolation_course_schedules_insert" ON public.course_schedules FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_schedules_select" ON public.course_schedules;
CREATE POLICY "school_isolation_course_schedules_select" ON public.course_schedules FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_schedules_update" ON public.course_schedules;
CREATE POLICY "school_isolation_course_schedules_update" ON public.course_schedules FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- FAMILIES (4 policies)
DROP POLICY IF EXISTS "school_isolation_families_delete" ON public.families;
CREATE POLICY "school_isolation_families_delete" ON public.families FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_families_insert" ON public.families;
CREATE POLICY "school_isolation_families_insert" ON public.families FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_families_select" ON public.families;
CREATE POLICY "school_isolation_families_select" ON public.families FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_families_update" ON public.families;
CREATE POLICY "school_isolation_families_update" ON public.families FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- FAMILY_MEMBER_CHILD_LINKS (4 policies)
DROP POLICY IF EXISTS "school_isolation_family_member_child_links_delete" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_delete" ON public.family_member_child_links FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_member_child_links_insert" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_insert" ON public.family_member_child_links FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_member_child_links_select" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_select" ON public.family_member_child_links FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_member_child_links_update" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_update" ON public.family_member_child_links FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- FAMILY_MEMBERS (4 policies)
DROP POLICY IF EXISTS "school_isolation_family_members_delete" ON public.family_members;
CREATE POLICY "school_isolation_family_members_delete" ON public.family_members FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_members_insert" ON public.family_members;
CREATE POLICY "school_isolation_family_members_insert" ON public.family_members FOR INSERT TO authenticated
WITH CHECK ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_members_select" ON public.family_members;
CREATE POLICY "school_isolation_family_members_select" ON public.family_members FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_members_update" ON public.family_members;
CREATE POLICY "school_isolation_family_members_update" ON public.family_members FOR ALL TO authenticated
USING ((school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- Continue in next part due to length...
```

**This is Part 1 of the script. Would you like me to continue with the remaining tables, or should we test these first to make sure the pattern works correctly?**

**Next tables to cover:**
- profile_info_family_member (4 policies)
- profile_info_staff (4 policies) 
- profile_info_student (4 policies)
- protected_roles (2 policies)
- schedule_drafts (4 policies)
- staff_* tables (multiple tables with 4 policies each)
- And the remaining ones from your list

**Testing suggestion:** Run Part 1 first, then test with your MFA policy tester to verify the pattern works before applying to all remaining tables.
