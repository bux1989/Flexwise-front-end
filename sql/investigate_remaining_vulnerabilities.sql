-- Investigate the remaining 4 vulnerable tables
-- Let's see exactly what policies exist and why they're not working

-- ==========================================
-- 1. CHECK USER_PROFILES POLICIES (should be NONE)
-- ==========================================
SELECT 
  '=== USER_PROFILES POLICIES ===' as section,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles'
ORDER BY policyname;

-- Check if RLS is properly enabled
SELECT 
  'USER_PROFILES RLS STATUS' as check_type,
  tablename,
  rowsecurity as rls_enabled,
  relforcerowsecurity as force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname = 'user_profiles';

-- ==========================================
-- 2. CHECK USER_ROLES POLICIES
-- ==========================================
SELECT 
  '=== USER_ROLES POLICIES ===' as section,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_roles'
ORDER BY policyname;

-- Check user_roles table structure
SELECT 
  'USER_ROLES COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
  AND column_name IN ('id', 'user_id', 'user_profile_id')
ORDER BY ordinal_position;

-- ==========================================
-- 3. CHECK USER_CODES POLICIES  
-- ==========================================
SELECT 
  '=== USER_CODES POLICIES ===' as section,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_codes'
ORDER BY policyname;

-- Check user_codes table structure
SELECT 
  'USER_CODES COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_codes'
  AND column_name IN ('id', 'user_id', 'user_profile_id')
ORDER BY ordinal_position;

-- ==========================================
-- 4. CHECK PROTECTED_ROLES POLICIES
-- ==========================================
SELECT 
  '=== PROTECTED_ROLES POLICIES ===' as section,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'protected_roles'
ORDER BY policyname;

-- ==========================================
-- 5. CHECK IF THESE TABLES HAVE RLS ENABLED
-- ==========================================
SELECT 
  'RLS STATUS CHECK' as check_type,
  c.relname as tablename,
  c.rowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls,
  CASE 
    WHEN NOT c.rowsecurity THEN 'RLS DISABLED - VULNERABLE!'
    WHEN c.rowsecurity AND NOT c.relforcerowsecurity THEN 'RLS ENABLED BUT NOT FORCED'
    ELSE 'RLS PROPERLY ENABLED'
  END as status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN ('user_profiles', 'user_roles', 'user_codes', 'protected_roles')
ORDER BY c.relname;

-- ==========================================
-- 6. CHECK FOR ANY PERMISSIVE POLICIES THAT MIGHT BE ALLOWING ACCESS
-- ==========================================
SELECT 
  'PERMISSIVE POLICIES CHECK' as check_type,
  tablename,
  policyname,
  cmd,
  'PERMISSIVE POLICY FOUND - ALLOWING ACCESS' as issue
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_roles', 'user_codes', 'protected_roles')
  AND permissive = 'PERMISSIVE'
ORDER BY tablename, policyname;

-- ==========================================
-- 7. TEST THE MFA FUNCTION
-- ==========================================
SELECT 
  'MFA FUNCTION TEST' as test_type,
  public.check_mfa_required() as mfa_check_result,
  CASE 
    WHEN public.check_mfa_required() THEN 'MFA FUNCTION RETURNS TRUE - SHOULD BLOCK ACCESS'
    ELSE 'MFA FUNCTION RETURNS FALSE - POLICIES WILL ALLOW ACCESS'
  END as interpretation;

-- ==========================================
-- 8. CHECK auth.uid() VALUE
-- ==========================================
SELECT 
  'AUTH UID TEST' as test_type,
  auth.uid() as current_auth_uid,
  pg_typeof(auth.uid()) as auth_uid_type,
  CASE 
    WHEN auth.uid() IS NULL THEN 'NO AUTH UID - POLICIES WILL FAIL'
    ELSE 'AUTH UID EXISTS - POLICIES SHOULD WORK'
  END as status;
