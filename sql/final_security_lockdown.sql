-- FINAL SECURITY LOCKDOWN
-- Remove the remaining permissive policy on user_profiles and fix all remaining vulnerable tables

-- ==========================================
-- 1. IDENTIFY AND REMOVE THE PERMISSIVE POLICY ON USER_PROFILES
-- ==========================================

-- First, identify what policy is still allowing access
SELECT 
  'CURRENT PERMISSIVE POLICIES ON user_profiles' as issue,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- Remove ALL policies from user_profiles (it should only use the security function)
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'user_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', pol_name);
        RAISE NOTICE 'Dropped policy: %', pol_name;
    END LOOP;
END $$;

-- Ensure RLS is enabled but NO policies exist (default DENY)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- ==========================================
-- 2. FIX TABLES THAT STILL DON'T HAVE POLICIES  
-- ==========================================

-- Check which tables are missing policies entirely
SELECT 
  'MISSING POLICIES CHECK' as status,
  t.table_name,
  CASE 
    WHEN p.policyname IS NULL THEN 'NO POLICIES - VULNERABLE'
    ELSE 'HAS POLICIES'
  END as policy_status
FROM information_schema.tables t
LEFT JOIN (
  SELECT DISTINCT tablename, policyname 
  FROM pg_policies 
  WHERE schemaname = 'public'
    AND policyname LIKE 'school_isolation_%'
) p ON t.table_name = p.tablename
WHERE t.table_schema = 'public' 
  AND t.table_name IN (
    'student_emergency_information',
    'user_roles', 
    'user_codes',
    'protected_roles',
    'lesson_diary_entries',
    'course_offers'
  )
ORDER BY t.table_name;

-- ==========================================
-- 3. ENABLE RLS ON TABLES THAT MIGHT NOT HAVE IT
-- ==========================================

-- Ensure RLS is enabled on all vulnerable tables
ALTER TABLE public.student_emergency_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_emergency_information FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_codes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.protected_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protected_roles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.lesson_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_diary_entries FORCE ROW LEVEL SECURITY;

ALTER TABLE public.course_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_offers FORCE ROW LEVEL SECURITY;

-- ==========================================
-- 4. RE-APPLY POLICIES FOR THE REMAINING VULNERABLE TABLES
-- ==========================================

-- STUDENT_EMERGENCY_INFORMATION (critical)
DROP POLICY IF EXISTS "school_isolation_student_emergency_information_select" ON public.student_emergency_information;
CREATE POLICY "school_isolation_student_emergency_information_select" ON public.student_emergency_information FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_emergency_information_insert" ON public.student_emergency_information;
CREATE POLICY "school_isolation_student_emergency_information_insert" ON public.student_emergency_information FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_emergency_information_update" ON public.student_emergency_information;
CREATE POLICY "school_isolation_student_emergency_information_update" ON public.student_emergency_information FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_student_emergency_information_delete" ON public.student_emergency_information;
CREATE POLICY "school_isolation_student_emergency_information_delete" ON public.student_emergency_information FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- USER_ROLES (critical - uses user_profile_id not school_id)
DROP POLICY IF EXISTS "school_isolation_user_roles_select" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_select" ON public.user_roles FOR SELECT TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_roles_insert" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_roles_update" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_update" ON public.user_roles FOR UPDATE TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_roles_delete" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

-- USER_CODES (critical - uses user_id not school_id)
DROP POLICY IF EXISTS "school_isolation_user_codes_select" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_select" ON public.user_codes FOR SELECT TO authenticated
USING ((user_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_insert" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_insert" ON public.user_codes FOR INSERT TO authenticated
WITH CHECK ((user_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_update" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_update" ON public.user_codes FOR UPDATE TO authenticated
USING ((user_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_delete" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_delete" ON public.user_codes FOR DELETE TO authenticated
USING ((user_id = auth.uid()) AND (SELECT public.check_mfa_required()));

-- PROTECTED_ROLES (critical - admin only access)
DROP POLICY IF EXISTS "admin_only_protected_roles_all" ON public.protected_roles;
CREATE POLICY "admin_only_protected_roles_all" ON public.protected_roles FOR ALL TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.user_profiles up 
    JOIN public.user_roles ur ON ur.user_profile_id = up.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE up.id = auth.uid() AND r.name = 'Admin'
  ) AND (SELECT public.check_mfa_required())
);

-- LESSON_DIARY_ENTRIES (operational)
DROP POLICY IF EXISTS "school_isolation_lesson_diary_entries_select" ON public.lesson_diary_entries;
CREATE POLICY "school_isolation_lesson_diary_entries_select" ON public.lesson_diary_entries FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_lesson_diary_entries_insert" ON public.lesson_diary_entries;
CREATE POLICY "school_isolation_lesson_diary_entries_insert" ON public.lesson_diary_entries FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_lesson_diary_entries_update" ON public.lesson_diary_entries;
CREATE POLICY "school_isolation_lesson_diary_entries_update" ON public.lesson_diary_entries FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_lesson_diary_entries_delete" ON public.lesson_diary_entries;
CREATE POLICY "school_isolation_lesson_diary_entries_delete" ON public.lesson_diary_entries FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- COURSE_OFFERS (operational)
DROP POLICY IF EXISTS "school_isolation_course_offers_select" ON public.course_offers;
CREATE POLICY "school_isolation_course_offers_select" ON public.course_offers FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_offers_insert" ON public.course_offers;
CREATE POLICY "school_isolation_course_offers_insert" ON public.course_offers FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_offers_update" ON public.course_offers;
CREATE POLICY "school_isolation_course_offers_update" ON public.course_offers FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_offers_delete" ON public.course_offers;
CREATE POLICY "school_isolation_course_offers_delete" ON public.course_offers FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- ==========================================
-- 5. FINAL VERIFICATION
-- ==========================================

-- Verify user_profiles has NO policies (should be empty)
SELECT 
  'USER_PROFILES FINAL CHECK' as test,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SECURE: No permissive policies found'
    ELSE 'VULNERABLE: ' || COUNT(*) || ' policies still exist'
  END as status,
  string_agg(policyname, ', ') as remaining_policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- Verify all critical tables have policies
SELECT 
  'CRITICAL TABLES POLICY VERIFICATION' as test,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN 'SECURE'
    WHEN COUNT(*) > 0 THEN 'PARTIAL'
    ELSE 'VULNERABLE - NO POLICIES'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'student_emergency_information',
    'user_roles', 
    'user_codes',
    'lesson_diary_entries',
    'course_offers'
  )
  AND policyname LIKE 'school_isolation_%'
GROUP BY tablename
ORDER BY tablename;

-- Check protected_roles specifically
SELECT 
  'PROTECTED_ROLES CHECK' as test,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SECURE'
    ELSE 'VULNERABLE - NO ADMIN POLICY'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'protected_roles'
  AND policyname LIKE 'admin_only_%';

-- Final summary
SELECT 
  'FINAL SECURITY STATUS' as summary,
  'All vulnerable tables should now be properly secured' as expected_result,
  'Run MFA Policy Tester to verify' as next_step;
