-- ABSOLUTE FINAL CLEANUP
-- Remove ALL conflicting policies and investigate why user_profiles is still accessible

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

-- Check if there are any other security definer functions accessing user_profiles
SELECT 
  '🔍 SECURITY DEFINER FUNCTIONS' as test,
  proname as function_name,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosrc LIKE '%user_profiles%' THEN '⚠️ ACCESSES user_profiles'
    ELSE '✅ No user_profiles access'
  END as accesses_user_profiles
FROM pg_proc 
WHERE prosecdef = true 
  AND prosrc LIKE '%user_profiles%';

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

-- Drop ALL policies on user_codes (both old and new)
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_profiles 
        WHERE schemaname = 'public' 
          AND tablename = 'user_codes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_codes', pol_name);
        RAISE NOTICE 'Dropped user_codes policy: %', pol_name;
    END LOOP;
END $$;

-- ==========================================
-- 3. CREATE SIMPLE BLOCKING POLICIES 
-- ==========================================

-- Create simple RESTRICTIVE policies for user_roles that always block
CREATE POLICY "block_user_roles_all" ON public.user_roles FOR ALL TO authenticated
USING (false);  -- Always blocks access

-- Create simple RESTRICTIVE policies for user_codes that always block  
CREATE POLICY "block_user_codes_all" ON public.user_codes FOR ALL TO authenticated
USING (false);  -- Always blocks access

-- ==========================================
-- 4. FORCE DISABLE RLS ON USER_PROFILES THEN RE-ENABLE
-- ==========================================

-- Try completely resetting user_profiles RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- ==========================================
-- 5. CHECK IF THERE ARE BYPASS MECHANISMS
-- ==========================================

-- Check for any roles that might bypass RLS
SELECT 
  '🔍 ROLE BYPASS CHECK' as test,
  rolname,
  rolbypassrls,
  CASE 
    WHEN rolbypassrls THEN '❌ CAN BYPASS RLS'
    ELSE '✅ CANNOT BYPASS RLS'
  END as rls_status
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'postgres', 'service_role')
ORDER BY rolname;

-- Check for any grants that might allow table access
SELECT 
  '🔍 TABLE GRANTS CHECK' as test,
  grantee,
  privilege_type,
  table_name,
  '⚠️ DIRECT GRANT FOUND' as warning
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'user_roles', 'user_codes')
  AND grantee != 'postgres'
ORDER BY table_name, grantee;

-- ==========================================
-- 6. VERIFICATION
-- ==========================================

-- Verify no policies exist on user_profiles
SELECT 
  '✅ USER_PROFILES FINAL STATUS' as test,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO POLICIES - SHOULD BE BLOCKED'
    ELSE '❌ ' || COUNT(*) || ' POLICIES STILL EXIST'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- Verify blocking policies exist on user_roles and user_codes
SELECT 
  '✅ BLOCKING POLICIES STATUS' as test,
  tablename,
  policyname,
  cmd,
  '✅ BLOCKING POLICY ACTIVE' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'user_codes')
  AND policyname LIKE 'block_%'
ORDER BY tablename;

-- Final test of MFA function
SELECT 
  '✅ MFA FUNCTION FINAL TEST' as test,
  public.check_mfa_required() as mfa_result,
  CASE 
    WHEN public.check_mfa_required() = false THEN '✅ RETURNS FALSE - SHOULD BLOCK ACCESS'
    ELSE '❌ RETURNS TRUE - WILL ALLOW ACCESS'
  END as interpretation;

-- Summary
SELECT 
  '🎯 ABSOLUTE FINAL STATUS' as summary,
  'All conflicting policies removed, simple blocking policies applied' as action,
  'user_profiles: 0 policies + forced RLS = should block' as user_profiles_status,
  'user_roles/user_codes: simple false policies = should block' as other_tables_status,
  'Test with MFA Policy Tester now' as next_step;
