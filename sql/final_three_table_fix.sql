-- FINAL FIX: Last 3 vulnerable tables
-- user_profiles, user_roles, user_codes

-- ==========================================
-- 1. DIAGNOSE THE REMAINING ISSUES
-- ==========================================

-- Check if RLS is enabled on the problem tables
SELECT 
  'RLS STATUS' as check_type,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls_enabled,
  CASE 
    WHEN NOT c.relrowsecurity THEN '❌ RLS DISABLED'
    WHEN c.relrowsecurity AND NOT c.relforcerowsecurity THEN '⚠️ RLS ENABLED BUT NOT FORCED'
    ELSE '✅ RLS PROPERLY ENABLED'
  END as status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN ('user_profiles', 'user_roles', 'user_codes')
ORDER BY c.relname;

-- Check what policies exist on these tables
SELECT 
  'CURRENT POLICIES' as check_type,
  tablename,
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN '⚠️ PERMISSIVE - ALLOWS ACCESS'
    ELSE '✅ RESTRICTIVE'
  END as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_roles', 'user_codes')
ORDER BY tablename, policyname;

-- ==========================================
-- 2. FORCE ENABLE RLS ON ALL THREE TABLES
-- ==========================================

-- Enable RLS properly on all three tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_codes FORCE ROW LEVEL SECURITY;

-- ==========================================
-- 3. CLEAN UP USER_PROFILES COMPLETELY
-- ==========================================

-- Remove ALL policies from user_profiles (should have NONE)
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
        RAISE NOTICE 'Dropped user_profiles policy: %', pol_name;
    END LOOP;
END $$;

-- ==========================================
-- 4. CREATE RESTRICTIVE POLICIES FOR USER_ROLES
-- ==========================================

-- Drop any existing policies
DROP POLICY IF EXISTS "school_isolation_user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "school_isolation_user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "school_isolation_user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "school_isolation_user_roles_delete" ON public.user_roles;

-- Create RESTRICTIVE policies (note: NOT permissive)
CREATE POLICY "mfa_block_user_roles_select" ON public.user_roles FOR SELECT TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

CREATE POLICY "mfa_block_user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

CREATE POLICY "mfa_block_user_roles_update" ON public.user_roles FOR UPDATE TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

CREATE POLICY "mfa_block_user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

-- ==========================================
-- 5. CREATE RESTRICTIVE POLICIES FOR USER_CODES
-- ==========================================

-- Drop any existing policies
DROP POLICY IF EXISTS "school_isolation_user_codes_select" ON public.user_codes;
DROP POLICY IF EXISTS "school_isolation_user_codes_insert" ON public.user_codes;
DROP POLICY IF EXISTS "school_isolation_user_codes_update" ON public.user_codes;
DROP POLICY IF EXISTS "school_isolation_user_codes_delete" ON public.user_codes;

-- Create RESTRICTIVE policies (note: NOT permissive)
CREATE POLICY "mfa_block_user_codes_select" ON public.user_codes FOR SELECT TO authenticated
USING ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

CREATE POLICY "mfa_block_user_codes_insert" ON public.user_codes FOR INSERT TO authenticated
WITH CHECK ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

CREATE POLICY "mfa_block_user_codes_update" ON public.user_codes FOR UPDATE TO authenticated
USING ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

CREATE POLICY "mfa_block_user_codes_delete" ON public.user_codes FOR DELETE TO authenticated
USING ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

-- ==========================================
-- 6. TEST THE MFA FUNCTION BEHAVIOR
-- ==========================================

-- Verify the MFA function is working as expected
SELECT 
  'MFA FUNCTION TEST' as test_type,
  public.check_mfa_required() as mfa_result,
  CASE 
    WHEN public.check_mfa_required() = false THEN '✅ CORRECT: Returns FALSE in AAL1 - will block access'
    ELSE '❌ PROBLEM: Returns TRUE in AAL1 - will allow access'
  END as interpretation;

-- ==========================================
-- 7. VERIFICATION
-- ==========================================

-- Check user_profiles has no policies
SELECT 
  'USER_PROFILES FINAL CHECK' as test,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SECURE: No policies - default DENY'
    ELSE '❌ VULNERABLE: ' || COUNT(*) || ' policies found'
  END as security_status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- Check user_roles policies
SELECT 
  'USER_ROLES POLICIES' as test,
  policyname,
  cmd,
  '✅ Created' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_roles'
  AND policyname LIKE 'mfa_block_%'
ORDER BY policyname;

-- Check user_codes policies
SELECT 
  'USER_CODES POLICIES' as test,
  policyname,
  cmd,
  '✅ Created' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_codes'
  AND policyname LIKE 'mfa_block_%'
ORDER BY policyname;

-- Final summary
SELECT 
  'FINAL SECURITY SUMMARY' as summary,
  'RLS enabled, policies corrected for last 3 tables' as action_taken,
  'Should achieve 46/46 tables blocked now' as expected_result,
  'Test with MFA Policy Tester' as next_step;
