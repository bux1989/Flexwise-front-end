-- Fix remaining vulnerable tables that are still showing as ALLOWED
-- Critical tables: user_profiles, student_emergency_information, user_roles, user_codes, protected_roles
-- Operational tables: lesson_diary_entries, course_offers

-- ==========================================
-- 1. USER_PROFILES - Critical: This should use the security function
-- ==========================================
-- Check if get_user_profile function exists and is working
SELECT 
  'get_user_profile function check' as test,
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'get_user_profile';

-- Ensure user_profiles uses the security function approach (not RLS policies)
-- Drop any conflicting RLS policies that might override the security function
DROP POLICY IF EXISTS "base_user_profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "school_isolation_user_profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_mfa_policy" ON public.user_profiles;

-- Ensure RLS is enabled but no permissive policies exist
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- The table should be accessed ONLY via get_user_profile() function
-- No direct SELECT policies should exist

-- ==========================================
-- 2. STUDENT_EMERGENCY_INFORMATION - Missing policies
-- ==========================================
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

-- ==========================================
-- 3. USER_ROLES - Fix the policies (user_profile_id relationship)
-- ==========================================
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

-- ==========================================
-- 4. USER_CODES - Fix the policies (user_id relationship)
-- ==========================================
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

-- ==========================================
-- 5. PROTECTED_ROLES - Admin only + MFA required
-- ==========================================
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

-- ==========================================
-- 6. LESSON_DIARY_ENTRIES - School isolation + MFA
-- ==========================================
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

-- ==========================================
-- 7. COURSE_OFFERS - School isolation + MFA  
-- ==========================================
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

-- ==========================================
-- Verification: Check all critical policies
-- ==========================================
SELECT 
  'Critical Tables Policy Check' as test,
  tablename,
  policyname,
  'Policy exists' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'user_codes', 'protected_roles', 'lesson_diary_entries', 'course_offers', 'student_emergency_information')
  AND (policyname LIKE 'school_isolation_%' OR policyname LIKE 'admin_only_%' OR policyname LIKE 'public_read_%')
ORDER BY tablename, policyname;

-- Check user_profiles has NO permissive policies (should be blocked by default)
SELECT 
  'User Profiles Security Check' as test,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SECURE: No permissive policies - access via function only'
    ELSE 'VULNERABLE: ' || COUNT(*) || ' permissive policies found'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';
