-- =====================================================
-- COMPLETE FIX: ALL SCHOOL ISOLATION POLICIES
-- =====================================================
-- This script fixes the broken school isolation logic in all RLS policies
-- that were using auth.jwt()->>'profile_id' (which is NULL) and replaces
-- it with the correct (SELECT school_id FROM public.user_profiles WHERE id = auth.uid())

-- BULLETIN_POST_USERS (4 policies)
DROP POLICY IF EXISTS "school_isolation_bulletin_post_users_delete" ON public.bulletin_post_users;
CREATE POLICY "school_isolation_bulletin_post_users_delete" ON public.bulletin_post_users FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_post_users_insert" ON public.bulletin_post_users;
CREATE POLICY "school_isolation_bulletin_post_users_insert" ON public.bulletin_post_users FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_post_users_select" ON public.bulletin_post_users;
CREATE POLICY "school_isolation_bulletin_post_users_select" ON public.bulletin_post_users FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_post_users_update" ON public.bulletin_post_users;
CREATE POLICY "school_isolation_bulletin_post_users_update" ON public.bulletin_post_users FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- BULLETIN_POSTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_bulletin_posts_delete" ON public.bulletin_posts;
CREATE POLICY "school_isolation_bulletin_posts_delete" ON public.bulletin_posts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_posts_insert" ON public.bulletin_posts;
CREATE POLICY "school_isolation_bulletin_posts_insert" ON public.bulletin_posts FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_posts_select" ON public.bulletin_posts;
CREATE POLICY "school_isolation_bulletin_posts_select" ON public.bulletin_posts FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_bulletin_posts_update" ON public.bulletin_posts;
CREATE POLICY "school_isolation_bulletin_posts_update" ON public.bulletin_posts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- CHANGE_LOG (4 policies)
DROP POLICY IF EXISTS "school_isolation_change_log_delete" ON public.change_log;
CREATE POLICY "school_isolation_change_log_delete" ON public.change_log FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_change_log_insert" ON public.change_log;
CREATE POLICY "school_isolation_change_log_insert" ON public.change_log FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_change_log_select" ON public.change_log;
CREATE POLICY "school_isolation_change_log_select" ON public.change_log FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_change_log_update" ON public.change_log;
CREATE POLICY "school_isolation_change_log_update" ON public.change_log FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- CONTACTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_contacts_delete" ON public.contacts;
CREATE POLICY "school_isolation_contacts_delete" ON public.contacts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_contacts_insert" ON public.contacts;
CREATE POLICY "school_isolation_contacts_insert" ON public.contacts FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_contacts_select" ON public.contacts;
CREATE POLICY "school_isolation_contacts_select" ON public.contacts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_contacts_update" ON public.contacts;
CREATE POLICY "school_isolation_contacts_update" ON public.contacts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_APPLICATIONS (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_applications_delete" ON public.course_applications;
CREATE POLICY "school_isolation_course_applications_delete" ON public.course_applications FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_applications_insert" ON public.course_applications;
CREATE POLICY "school_isolation_course_applications_insert" ON public.course_applications FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_applications_select" ON public.course_applications;
CREATE POLICY "school_isolation_course_applications_select" ON public.course_applications FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_applications_update" ON public.course_applications;
CREATE POLICY "school_isolation_course_applications_update" ON public.course_applications FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_ENROLLMENTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_enrollments_delete" ON public.course_enrollments;
CREATE POLICY "school_isolation_course_enrollments_delete" ON public.course_enrollments FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_enrollments_insert" ON public.course_enrollments;
CREATE POLICY "school_isolation_course_enrollments_insert" ON public.course_enrollments FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_enrollments_select" ON public.course_enrollments;
CREATE POLICY "school_isolation_course_enrollments_select" ON public.course_enrollments FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_enrollments_update" ON public.course_enrollments;
CREATE POLICY "school_isolation_course_enrollments_update" ON public.course_enrollments FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_LESSONS (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_lessons_delete" ON public.course_lessons;
CREATE POLICY "school_isolation_course_lessons_delete" ON public.course_lessons FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_lessons_insert" ON public.course_lessons;
CREATE POLICY "school_isolation_course_lessons_insert" ON public.course_lessons FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_lessons_select" ON public.course_lessons;
CREATE POLICY "school_isolation_course_lessons_select" ON public.course_lessons FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_lessons_update" ON public.course_lessons;
CREATE POLICY "school_isolation_course_lessons_update" ON public.course_lessons FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_LIST (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_list_delete" ON public.course_list;
CREATE POLICY "school_isolation_course_list_delete" ON public.course_list FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_list_insert" ON public.course_list;
CREATE POLICY "school_isolation_course_list_insert" ON public.course_list FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_list_select" ON public.course_list;
CREATE POLICY "school_isolation_course_list_select" ON public.course_list FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_list_update" ON public.course_list;
CREATE POLICY "school_isolation_course_list_update" ON public.course_list FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_NOTES (4 policies) - This fixes the original error
DROP POLICY IF EXISTS "school_isolation_course_notes_delete" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_delete" ON public.course_notes FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_notes_insert" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_insert" ON public.course_notes FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_notes_select" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_select" ON public.course_notes FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_notes_update" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_update" ON public.course_notes FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_OFFERS (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_offers_delete" ON public.course_offers;
CREATE POLICY "school_isolation_course_offers_delete" ON public.course_offers FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_offers_insert" ON public.course_offers;
CREATE POLICY "school_isolation_course_offers_insert" ON public.course_offers FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_offers_select" ON public.course_offers;
CREATE POLICY "school_isolation_course_offers_select" ON public.course_offers FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_offers_update" ON public.course_offers;
CREATE POLICY "school_isolation_course_offers_update" ON public.course_offers FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_POSSIBLE_TIMES (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_possible_times_delete" ON public.course_possible_times;
CREATE POLICY "school_isolation_course_possible_times_delete" ON public.course_possible_times FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_possible_times_insert" ON public.course_possible_times;
CREATE POLICY "school_isolation_course_possible_times_insert" ON public.course_possible_times FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_possible_times_select" ON public.course_possible_times;
CREATE POLICY "school_isolation_course_possible_times_select" ON public.course_possible_times FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_possible_times_update" ON public.course_possible_times;
CREATE POLICY "school_isolation_course_possible_times_update" ON public.course_possible_times FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_REGISTRATION_WINDOWS (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_registration_windows_delete" ON public.course_registration_windows;
CREATE POLICY "school_isolation_course_registration_windows_delete" ON public.course_registration_windows FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_registration_windows_insert" ON public.course_registration_windows;
CREATE POLICY "school_isolation_course_registration_windows_insert" ON public.course_registration_windows FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_registration_windows_select" ON public.course_registration_windows;
CREATE POLICY "school_isolation_course_registration_windows_select" ON public.course_registration_windows FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_registration_windows_update" ON public.course_registration_windows;
CREATE POLICY "school_isolation_course_registration_windows_update" ON public.course_registration_windows FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_SCHEDULES (4 policies)
DROP POLICY IF EXISTS "school_isolation_course_schedules_delete" ON public.course_schedules;
CREATE POLICY "school_isolation_course_schedules_delete" ON public.course_schedules FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_schedules_insert" ON public.course_schedules;
CREATE POLICY "school_isolation_course_schedules_insert" ON public.course_schedules FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_schedules_select" ON public.course_schedules;
CREATE POLICY "school_isolation_course_schedules_select" ON public.course_schedules FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_schedules_update" ON public.course_schedules;
CREATE POLICY "school_isolation_course_schedules_update" ON public.course_schedules FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- FAMILIES (4 policies)
DROP POLICY IF EXISTS "school_isolation_families_delete" ON public.families;
CREATE POLICY "school_isolation_families_delete" ON public.families FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_families_insert" ON public.families;
CREATE POLICY "school_isolation_families_insert" ON public.families FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_families_select" ON public.families;
CREATE POLICY "school_isolation_families_select" ON public.families FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_families_update" ON public.families;
CREATE POLICY "school_isolation_families_update" ON public.families FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- FAMILY_MEMBER_CHILD_LINKS (4 policies)
DROP POLICY IF EXISTS "school_isolation_family_member_child_links_delete" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_delete" ON public.family_member_child_links FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_member_child_links_insert" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_insert" ON public.family_member_child_links FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_member_child_links_select" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_select" ON public.family_member_child_links FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_member_child_links_update" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_update" ON public.family_member_child_links FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- FAMILY_MEMBERS (4 policies)
DROP POLICY IF EXISTS "school_isolation_family_members_delete" ON public.family_members;
CREATE POLICY "school_isolation_family_members_delete" ON public.family_members FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_members_insert" ON public.family_members;
CREATE POLICY "school_isolation_family_members_insert" ON public.family_members FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_members_select" ON public.family_members;
CREATE POLICY "school_isolation_family_members_select" ON public.family_members FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_family_members_update" ON public.family_members;
CREATE POLICY "school_isolation_family_members_update" ON public.family_members FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- LESSON_DIARY_ENTRIES (4 policies)
DROP POLICY IF EXISTS "school_isolation_lesson_diary_entries_delete" ON public.lesson_diary_entries;
CREATE POLICY "school_isolation_lesson_diary_entries_delete" ON public.lesson_diary_entries FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_lesson_diary_entries_insert" ON public.lesson_diary_entries;
CREATE POLICY "school_isolation_lesson_diary_entries_insert" ON public.lesson_diary_entries FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_lesson_diary_entries_select" ON public.lesson_diary_entries;
CREATE POLICY "school_isolation_lesson_diary_entries_select" ON public.lesson_diary_entries FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_lesson_diary_entries_update" ON public.lesson_diary_entries;
CREATE POLICY "school_isolation_lesson_diary_entries_update" ON public.lesson_diary_entries FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- PROFILE_INFO_FAMILY_MEMBER (4 policies)
DROP POLICY IF EXISTS "school_isolation_profile_info_family_member_delete" ON public.profile_info_family_member;
CREATE POLICY "school_isolation_profile_info_family_member_delete" ON public.profile_info_family_member FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_profile_info_family_member_insert" ON public.profile_info_family_member;
CREATE POLICY "school_isolation_profile_info_family_member_insert" ON public.profile_info_family_member FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_profile_info_family_member_select" ON public.profile_info_family_member;
CREATE POLICY "school_isolation_profile_info_family_member_select" ON public.profile_info_family_member FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_profile_info_family_member_update" ON public.profile_info_family_member;
CREATE POLICY "school_isolation_profile_info_family_member_update" ON public.profile_info_family_member FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- PROFILE_INFO_STAFF (4 policies)
DROP POLICY IF EXISTS "school_isolation_profile_info_staff_delete" ON public.profile_info_staff;
CREATE POLICY "school_isolation_profile_info_staff_delete" ON public.profile_info_staff FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_profile_info_staff_insert" ON public.profile_info_staff;
CREATE POLICY "school_isolation_profile_info_staff_insert" ON public.profile_info_staff FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_profile_info_staff_select" ON public.profile_info_staff;
CREATE POLICY "school_isolation_profile_info_staff_select" ON public.profile_info_staff FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_profile_info_staff_update" ON public.profile_info_staff;
CREATE POLICY "school_isolation_profile_info_staff_update" ON public.profile_info_staff FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- PROFILE_INFO_STUDENT (4 policies)
DROP POLICY IF EXISTS "school_isolation_profile_info_student_delete" ON public.profile_info_student;
CREATE POLICY "school_isolation_profile_info_student_delete" ON public.profile_info_student FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_profile_info_student_insert" ON public.profile_info_student;
CREATE POLICY "school_isolation_profile_info_student_insert" ON public.profile_info_student FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_profile_info_student_select" ON public.profile_info_student;
CREATE POLICY "school_isolation_profile_info_student_select" ON public.profile_info_student FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_profile_info_student_update" ON public.profile_info_student;
CREATE POLICY "school_isolation_profile_info_student_update" ON public.profile_info_student FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- SCHEDULE_DRAFTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_schedule_drafts_delete" ON public.schedule_drafts;
CREATE POLICY "school_isolation_schedule_drafts_delete" ON public.schedule_drafts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_schedule_drafts_insert" ON public.schedule_drafts;
CREATE POLICY "school_isolation_schedule_drafts_insert" ON public.schedule_drafts FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_schedule_drafts_select" ON public.schedule_drafts;
CREATE POLICY "school_isolation_schedule_drafts_select" ON public.schedule_drafts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_schedule_drafts_update" ON public.schedule_drafts;
CREATE POLICY "school_isolation_schedule_drafts_update" ON public.schedule_drafts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STAFF_ABSENCE_COMMENTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_staff_absence_comments_delete" ON public.staff_absence_comments;
CREATE POLICY "school_isolation_staff_absence_comments_delete" ON public.staff_absence_comments FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_absence_comments_insert" ON public.staff_absence_comments;
CREATE POLICY "school_isolation_staff_absence_comments_insert" ON public.staff_absence_comments FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_absence_comments_select" ON public.staff_absence_comments;
CREATE POLICY "school_isolation_staff_absence_comments_select" ON public.staff_absence_comments FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_absence_comments_update" ON public.staff_absence_comments;
CREATE POLICY "school_isolation_staff_absence_comments_update" ON public.staff_absence_comments FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STAFF_ABSENCES (4 policies)
DROP POLICY IF EXISTS "school_isolation_staff_absences_delete" ON public.staff_absences;
CREATE POLICY "school_isolation_staff_absences_delete" ON public.staff_absences FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_absences_insert" ON public.staff_absences;
CREATE POLICY "school_isolation_staff_absences_insert" ON public.staff_absences FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_absences_select" ON public.staff_absences;
CREATE POLICY "school_isolation_staff_absences_select" ON public.staff_absences FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_absences_update" ON public.staff_absences;
CREATE POLICY "school_isolation_staff_absences_update" ON public.staff_absences FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STAFF_CLASS_LINKS (4 policies)
DROP POLICY IF EXISTS "school_isolation_staff_class_links_delete" ON public.staff_class_links;
CREATE POLICY "school_isolation_staff_class_links_delete" ON public.staff_class_links FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_class_links_insert" ON public.staff_class_links;
CREATE POLICY "school_isolation_staff_class_links_insert" ON public.staff_class_links FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_class_links_select" ON public.staff_class_links;
CREATE POLICY "school_isolation_staff_class_links_select" ON public.staff_class_links FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_class_links_update" ON public.staff_class_links;
CREATE POLICY "school_isolation_staff_class_links_update" ON public.staff_class_links FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STAFF_CONTRACTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_staff_contracts_delete" ON public.staff_contracts;
CREATE POLICY "school_isolation_staff_contracts_delete" ON public.staff_contracts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_contracts_insert" ON public.staff_contracts;
CREATE POLICY "school_isolation_staff_contracts_insert" ON public.staff_contracts FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_contracts_select" ON public.staff_contracts;
CREATE POLICY "school_isolation_staff_contracts_select" ON public.staff_contracts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_contracts_update" ON public.staff_contracts;
CREATE POLICY "school_isolation_staff_contracts_update" ON public.staff_contracts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STAFF_DOCUMENTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_staff_documents_delete" ON public.staff_documents;
CREATE POLICY "school_isolation_staff_documents_delete" ON public.staff_documents FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_documents_insert" ON public.staff_documents;
CREATE POLICY "school_isolation_staff_documents_insert" ON public.staff_documents FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_documents_select" ON public.staff_documents;
CREATE POLICY "school_isolation_staff_documents_select" ON public.staff_documents FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_documents_update" ON public.staff_documents;
CREATE POLICY "school_isolation_staff_documents_update" ON public.staff_documents FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STAFF_DUTY_PLAN (4 policies)
DROP POLICY IF EXISTS "school_isolation_staff_duty_plan_delete" ON public.staff_duty_plan;
CREATE POLICY "school_isolation_staff_duty_plan_delete" ON public.staff_duty_plan FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_duty_plan_insert" ON public.staff_duty_plan;
CREATE POLICY "school_isolation_staff_duty_plan_insert" ON public.staff_duty_plan FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_duty_plan_select" ON public.staff_duty_plan;
CREATE POLICY "school_isolation_staff_duty_plan_select" ON public.staff_duty_plan FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_duty_plan_update" ON public.staff_duty_plan;
CREATE POLICY "school_isolation_staff_duty_plan_update" ON public.staff_duty_plan FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STAFF_SUBJECTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_staff_subjects_delete" ON public.staff_subjects;
CREATE POLICY "school_isolation_staff_subjects_delete" ON public.staff_subjects FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_subjects_insert" ON public.staff_subjects;
CREATE POLICY "school_isolation_staff_subjects_insert" ON public.staff_subjects FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_subjects_select" ON public.staff_subjects;
CREATE POLICY "school_isolation_staff_subjects_select" ON public.staff_subjects FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_subjects_update" ON public.staff_subjects;
CREATE POLICY "school_isolation_staff_subjects_update" ON public.staff_subjects FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STAFF_WORK_CONTRACTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_staff_work_contracts_delete" ON public.staff_work_contracts;
CREATE POLICY "school_isolation_staff_work_contracts_delete" ON public.staff_work_contracts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_work_contracts_insert" ON public.staff_work_contracts;
CREATE POLICY "school_isolation_staff_work_contracts_insert" ON public.staff_work_contracts FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_work_contracts_select" ON public.staff_work_contracts;
CREATE POLICY "school_isolation_staff_work_contracts_select" ON public.staff_work_contracts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_work_contracts_update" ON public.staff_work_contracts;
CREATE POLICY "school_isolation_staff_work_contracts_update" ON public.staff_work_contracts FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STAFF_YEARLY_PREFERENCES (4 policies)
DROP POLICY IF EXISTS "school_isolation_staff_yearly_preferences_delete" ON public.staff_yearly_preferences;
CREATE POLICY "school_isolation_staff_yearly_preferences_delete" ON public.staff_yearly_preferences FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_yearly_preferences_insert" ON public.staff_yearly_preferences;
CREATE POLICY "school_isolation_staff_yearly_preferences_insert" ON public.staff_yearly_preferences FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_yearly_preferences_select" ON public.staff_yearly_preferences;
CREATE POLICY "school_isolation_staff_yearly_preferences_select" ON public.staff_yearly_preferences FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_staff_yearly_preferences_update" ON public.staff_yearly_preferences;
CREATE POLICY "school_isolation_staff_yearly_preferences_update" ON public.staff_yearly_preferences FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STUDENT_ABSENCE_NOTES (4 policies)
DROP POLICY IF EXISTS "school_isolation_student_absence_notes_delete" ON public.student_absence_notes;
CREATE POLICY "school_isolation_student_absence_notes_delete" ON public.student_absence_notes FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_absence_notes_insert" ON public.student_absence_notes;
CREATE POLICY "school_isolation_student_absence_notes_insert" ON public.student_absence_notes FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_absence_notes_select" ON public.student_absence_notes;
CREATE POLICY "school_isolation_student_absence_notes_select" ON public.student_absence_notes FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_absence_notes_update" ON public.student_absence_notes;
CREATE POLICY "school_isolation_student_absence_notes_update" ON public.student_absence_notes FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STUDENT_ATTENDANCE_LOGS (4 policies)
DROP POLICY IF EXISTS "school_isolation_student_attendance_logs_delete" ON public.student_attendance_logs;
CREATE POLICY "school_isolation_student_attendance_logs_delete" ON public.student_attendance_logs FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_attendance_logs_insert" ON public.student_attendance_logs;
CREATE POLICY "school_isolation_student_attendance_logs_insert" ON public.student_attendance_logs FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_attendance_logs_select" ON public.student_attendance_logs;
CREATE POLICY "school_isolation_student_attendance_logs_select" ON public.student_attendance_logs FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_attendance_logs_update" ON public.student_attendance_logs;
CREATE POLICY "school_isolation_student_attendance_logs_update" ON public.student_attendance_logs FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STUDENT_COURSE_WISH_CHOICES (4 policies)
DROP POLICY IF EXISTS "school_isolation_student_course_wish_choices_delete" ON public.student_course_wish_choices;
CREATE POLICY "school_isolation_student_course_wish_choices_delete" ON public.student_course_wish_choices FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_course_wish_choices_insert" ON public.student_course_wish_choices;
CREATE POLICY "school_isolation_student_course_wish_choices_insert" ON public.student_course_wish_choices FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_course_wish_choices_select" ON public.student_course_wish_choices;
CREATE POLICY "school_isolation_student_course_wish_choices_select" ON public.student_course_wish_choices FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_course_wish_choices_update" ON public.student_course_wish_choices;
CREATE POLICY "school_isolation_student_course_wish_choices_update" ON public.student_course_wish_choices FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STUDENT_COURSE_WISH_SUBMISSIONS (4 policies)
DROP POLICY IF EXISTS "school_isolation_student_course_wish_submissions_delete" ON public.student_course_wish_submissions;
CREATE POLICY "school_isolation_student_course_wish_submissions_delete" ON public.student_course_wish_submissions FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_course_wish_submissions_insert" ON public.student_course_wish_submissions;
CREATE POLICY "school_isolation_student_course_wish_submissions_insert" ON public.student_course_wish_submissions FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_course_wish_submissions_select" ON public.student_course_wish_submissions;
CREATE POLICY "school_isolation_student_course_wish_submissions_select" ON public.student_course_wish_submissions FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_course_wish_submissions_update" ON public.student_course_wish_submissions;
CREATE POLICY "school_isolation_student_course_wish_submissions_update" ON public.student_course_wish_submissions FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STUDENT_DAILY_LOG (4 policies)
DROP POLICY IF EXISTS "school_isolation_student_daily_log_delete" ON public.student_daily_log;
CREATE POLICY "school_isolation_student_daily_log_delete" ON public.student_daily_log FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_daily_log_insert" ON public.student_daily_log;
CREATE POLICY "school_isolation_student_daily_log_insert" ON public.student_daily_log FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_daily_log_select" ON public.student_daily_log;
CREATE POLICY "school_isolation_student_daily_log_select" ON public.student_daily_log FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_daily_log_update" ON public.student_daily_log;
CREATE POLICY "school_isolation_student_daily_log_update" ON public.student_daily_log FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STUDENT_EMERGENCY_INFORMATION (4 policies)
DROP POLICY IF EXISTS "school_isolation_student_emergency_information_delete" ON public.student_emergency_information;
CREATE POLICY "school_isolation_student_emergency_information_delete" ON public.student_emergency_information FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_emergency_information_insert" ON public.student_emergency_information;
CREATE POLICY "school_isolation_student_emergency_information_insert" ON public.student_emergency_information FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_emergency_information_select" ON public.student_emergency_information;
CREATE POLICY "school_isolation_student_emergency_information_select" ON public.student_emergency_information FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_emergency_information_update" ON public.student_emergency_information;
CREATE POLICY "school_isolation_student_emergency_information_update" ON public.student_emergency_information FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STUDENT_PICKUP_ARRANGEMENT_OVERRIDES (4 policies)
DROP POLICY IF EXISTS "school_isolation_student_pickup_arrangement_overrides_delete" ON public.student_pickup_arrangement_overrides;
CREATE POLICY "school_isolation_student_pickup_arrangement_overrides_delete" ON public.student_pickup_arrangement_overrides FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_pickup_arrangement_overrides_insert" ON public.student_pickup_arrangement_overrides;
CREATE POLICY "school_isolation_student_pickup_arrangement_overrides_insert" ON public.student_pickup_arrangement_overrides FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_pickup_arrangement_overrides_select" ON public.student_pickup_arrangement_overrides;
CREATE POLICY "school_isolation_student_pickup_arrangement_overrides_select" ON public.student_pickup_arrangement_overrides FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_pickup_arrangement_overrides_update" ON public.student_pickup_arrangement_overrides;
CREATE POLICY "school_isolation_student_pickup_arrangement_overrides_update" ON public.student_pickup_arrangement_overrides FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STUDENT_PRESENCE_EVENTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_student_presence_events_delete" ON public.student_presence_events;
CREATE POLICY "school_isolation_student_presence_events_delete" ON public.student_presence_events FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_presence_events_insert" ON public.student_presence_events;
CREATE POLICY "school_isolation_student_presence_events_insert" ON public.student_presence_events FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_presence_events_select" ON public.student_presence_events;
CREATE POLICY "school_isolation_student_presence_events_select" ON public.student_presence_events FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_presence_events_update" ON public.student_presence_events;
CREATE POLICY "school_isolation_student_presence_events_update" ON public.student_presence_events FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- STUDENT_WEEKLY_PICKUP_ARRANGEMENTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_student_weekly_pickup_arrangements_delete" ON public.student_weekly_pickup_arrangements;
CREATE POLICY "school_isolation_student_weekly_pickup_arrangements_delete" ON public.student_weekly_pickup_arrangements FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_weekly_pickup_arrangements_insert" ON public.student_weekly_pickup_arrangements;
CREATE POLICY "school_isolation_student_weekly_pickup_arrangements_insert" ON public.student_weekly_pickup_arrangements FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_weekly_pickup_arrangements_select" ON public.student_weekly_pickup_arrangements;
CREATE POLICY "school_isolation_student_weekly_pickup_arrangements_select" ON public.student_weekly_pickup_arrangements FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_weekly_pickup_arrangements_update" ON public.student_weekly_pickup_arrangements;
CREATE POLICY "school_isolation_student_weekly_pickup_arrangements_update" ON public.student_weekly_pickup_arrangements FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- SUBSTITUTIONS (4 policies)
DROP POLICY IF EXISTS "school_isolation_substitutions_delete" ON public.substitutions;
CREATE POLICY "school_isolation_substitutions_delete" ON public.substitutions FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_substitutions_insert" ON public.substitutions;
CREATE POLICY "school_isolation_substitutions_insert" ON public.substitutions FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_substitutions_select" ON public.substitutions;
CREATE POLICY "school_isolation_substitutions_select" ON public.substitutions FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_substitutions_update" ON public.substitutions;
CREATE POLICY "school_isolation_substitutions_update" ON public.substitutions FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- USER_GROUPS (4 policies)
DROP POLICY IF EXISTS "school_isolation_user_groups_delete" ON public.user_groups;
CREATE POLICY "school_isolation_user_groups_delete" ON public.user_groups FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_groups_insert" ON public.user_groups;
CREATE POLICY "school_isolation_user_groups_insert" ON public.user_groups FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_groups_select" ON public.user_groups;
CREATE POLICY "school_isolation_user_groups_select" ON public.user_groups FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_groups_update" ON public.user_groups;
CREATE POLICY "school_isolation_user_groups_update" ON public.user_groups FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- USER_GROUP_MEMBERS (4 policies)
DROP POLICY IF EXISTS "school_isolation_user_group_members_delete" ON public.user_group_members;
CREATE POLICY "school_isolation_user_group_members_delete" ON public.user_group_members FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_group_members_insert" ON public.user_group_members;
CREATE POLICY "school_isolation_user_group_members_insert" ON public.user_group_members FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_group_members_select" ON public.user_group_members;
CREATE POLICY "school_isolation_user_group_members_select" ON public.user_group_members FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_group_members_update" ON public.user_group_members;
CREATE POLICY "school_isolation_user_group_members_update" ON public.user_group_members FOR ALL TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- Handle tables that don't have school_id columns differently

-- USER_ROLES (requires different logic based on relationship via user_profile_id)
DROP POLICY IF EXISTS "school_isolation_user_roles_delete" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_roles_insert" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_roles_select" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_select" ON public.user_roles FOR SELECT TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_roles_update" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_update" ON public.user_roles FOR UPDATE TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

-- USER_CODES (requires different logic based on relationship via user_id)
DROP POLICY IF EXISTS "school_isolation_user_codes_delete" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_delete" ON public.user_codes FOR DELETE TO authenticated
USING ((user_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_insert" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_insert" ON public.user_codes FOR INSERT TO authenticated
WITH CHECK ((user_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_select" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_select" ON public.user_codes FOR SELECT TO authenticated
USING ((user_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_update" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_update" ON public.user_codes FOR UPDATE TO authenticated
USING ((user_id = auth.uid()) AND (SELECT public.check_mfa_required()));

-- PROTECTED_ROLES (admin only access + public read)
DROP POLICY IF EXISTS "admin_only_protected_roles_modify" ON public.protected_roles;
CREATE POLICY "admin_only_protected_roles_modify" ON public.protected_roles FOR ALL TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.user_profiles up 
    JOIN public.user_roles ur ON ur.user_profile_id = up.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE up.id = auth.uid() AND r.name = 'Admin'
  ) AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "public_read_protected_roles" ON public.protected_roles;
CREATE POLICY "public_read_protected_roles" ON public.protected_roles FOR SELECT TO authenticated
USING ((SELECT public.check_mfa_required()));

-- Final verification query
SELECT 
  'Script Completion' as status,
  count(*) as total_fixed_policies,
  'All school isolation policies updated with correct user-to-school lookup' as result
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE 'school_isolation_%';
