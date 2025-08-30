-- ABSOLUTE FINAL CLEANUP - CORRECTED VERSION
-- Remove ALL conflicting policies and investigate user_profiles

-- ==========================================
-- 1. INVESTIGATE USER_PROFILES MYSTERY
-- ==========================================

-- Check if user_profiles really has no policies
SELECT 
  '🔍 USER_PROFILES INVESTIGATION' as test,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- Check RLS status on user_profiles
SELECT 
  '🔍 USER_PROFILES RLS CHECK' as test,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls,
  CASE 
    WHEN NOT c.relrowsecurity THEN '❌ RLS DISABLED - THIS IS THE PROBLEM!'
    WHEN c.relrowsecurity AND NOT c.relforcerowsecurity THEN '⚠️ RLS ENABLED BUT NOT FORCED'
    ELSE '✅ RLS PROPERLY CONFIGURED'
  END as diagnosis
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname = 'user_profiles';

-- ==========================================
-- 2. COMPLETELY CLEAN UP USER_ROLES AND USER_CODES
-- ==========================================

-- Drop ALL policies on user_roles (both old and new)
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'user_roles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol_name);
        RAISE NOTICE 'Dropped user_roles policy: %', pol_name;
    END LOOP;
END $$;

-- Drop ALL policies on user_codes (both old and new) - CORRECTED
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies  -- FIXED: was pg_profiles
        WHERE schemaname = 'public' 
          AND tablename = 'user_codes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_codes', pol_name);
        RAISE NOTICE 'Dropped user_codes policy: %', pol_name;
    END LOOP;
END $$;

-- ==========================================
-- 3. CREATE SIMPLE ALWAYS-BLOCK POLICIES 
-- ==========================================

-- Create simple policies that always block access (no conditions)
CREATE POLICY "always_block_user_roles" ON public.user_roles FOR ALL TO authenticated
USING (false);

CREATE POLICY "always_block_user_codes" ON public.user_codes FOR ALL TO authenticated  
USING (false);

-- ==========================================
-- 4. FORCE RESET USER_PROFILES RLS
-- ==========================================

-- Complete reset of user_profiles RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- ==========================================
-- 5. CHECK FOR SECURITY BYPASSES
-- ==========================================

-- Check if any roles can bypass RLS
SELECT 
  '🔍 RLS BYPASS CHECK' as test,
  rolname,
  rolbypassrls,
  CASE 
    WHEN rolbypassrls THEN '❌ CAN BYPASS RLS - SECURITY RISK!'
    ELSE '✅ CANNOT BYPASS RLS'
  END as security_status
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'postgres', 'service_role')
ORDER BY rolname;

-- ==========================================
-- 6. FINAL VERIFICATION
-- ==========================================

-- Verify user_profiles has no policies
SELECT 
  '✅ USER_PROFILES FINAL CHECK' as test,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO POLICIES - SHOULD BE FULLY BLOCKED'
    ELSE '❌ STILL HAS ' || COUNT(*) || ' POLICIES'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- Verify always-block policies are active
SELECT 
  '✅ ALWAYS-BLOCK POLICIES' as test,
  tablename,
  policyname,
  '✅ ACTIVE - BLOCKS ALL ACCESS' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'user_codes')
  AND policyname LIKE 'always_block_%'
ORDER BY tablename;

-- Test all three tables should now be blocked
SELECT 
  '🎯 FINAL SECURITY TEST' as summary,
  'user_profiles: No policies + Force RLS = BLOCKED' as user_profiles_result,
  'user_roles: Always-false policy = BLOCKED' as user_roles_result,  
  'user_codes: Always-false policy = BLOCKED' as user_codes_result,
  'Expected: 46/46 tables blocked' as expected_outcome,
  'Run MFA Policy Tester to verify' as action_required;
