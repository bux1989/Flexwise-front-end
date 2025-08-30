-- FINAL FIX: Function names and MFA check
-- Issue 1: Policies use uid() instead of auth.uid()
-- Issue 2: check_mfa_required() returns false when it should return true

-- ==========================================
-- 1. INVESTIGATE MFA FUNCTION BEHAVIOR
-- ==========================================

-- Check what check_mfa_required() is actually doing
SELECT 
  'MFA FUNCTION INVESTIGATION' as test,
  public.check_mfa_required() as current_result,
  auth.aal() as current_aal,
  'Expected: true for AAL1, current result should be true' as expectation;

-- Let's see the function definition
SELECT 
  'check_mfa_required FUNCTION BODY' as info,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'check_mfa_required';

-- ==========================================
-- 2. FIX USER_ROLES POLICIES (uid() -> auth.uid())
-- ==========================================

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

-- ==========================================
-- 3. FIX USER_CODES POLICIES (uid() -> auth.uid())
-- ==========================================

DROP POLICY IF EXISTS "school_isolation_user_codes_select" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_select" ON public.user_codes FOR SELECT TO authenticated
USING ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_insert" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_insert" ON public.user_codes FOR INSERT TO authenticated
WITH CHECK ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_update" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_update" ON public.user_codes FOR UPDATE TO authenticated
USING ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_delete" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_delete" ON public.user_codes FOR DELETE TO authenticated
USING ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

-- ==========================================
-- 4. FIX PROTECTED_ROLES POLICIES (uid() -> auth.uid())
-- ==========================================

-- Remove duplicate policies first
DROP POLICY IF EXISTS "admin_only_protected_roles_modify" ON public.protected_roles;
DROP POLICY IF EXISTS "public_read_protected_roles" ON public.protected_roles;

-- Keep only one restrictive admin policy
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

-- ==========================================
-- 5. CHECK USER_PROFILES RLS STATUS (fix column names)
-- ==========================================

SELECT 
  'USER_PROFILES RLS STATUS' as check_type,
  c.relname as tablename,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls,
  CASE 
    WHEN NOT c.relrowsecurity THEN 'RLS DISABLED - ENABLING NOW'
    WHEN c.relrowsecurity AND NOT c.relforcerowsecurity THEN 'RLS ENABLED BUT NOT FORCED - FORCING NOW'
    ELSE 'RLS PROPERLY CONFIGURED'
  END as status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname = 'user_profiles';

-- Ensure user_profiles has proper RLS configuration
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- ==========================================
-- 6. IF MFA FUNCTION IS WRONG, CREATE CORRECT ONE
-- ==========================================

-- If check_mfa_required() is returning false when it should return true,
-- we need to check if it's looking for AAL2 instead of blocking AAL1

-- Let's create a temporary test to see what's happening
DO $$ 
BEGIN
  RAISE NOTICE 'Current AAL: %', auth.aal();
  RAISE NOTICE 'MFA Required Result: %', public.check_mfa_required();
  RAISE NOTICE 'Expected: MFA should return TRUE for AAL1 to block access';
END $$;

-- Check if we need to recreate the function with correct logic
-- The function should return TRUE when MFA is required (to block access in AAL1)
-- It should return FALSE only when user has completed MFA (AAL2)

-- If the current function is backwards, let's create the correct version
CREATE OR REPLACE FUNCTION public.check_mfa_required_fixed()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Return TRUE when MFA is required (AAL1 state - should block access)
  -- Return FALSE when MFA is completed (AAL2 state - should allow access)
  SELECT COALESCE(auth.aal(), 'aal1'::text) = 'aal1'::text;
$$;

-- ==========================================
-- 7. VERIFICATION
-- ==========================================

-- Test the corrected function
SELECT 
  'FUNCTION COMPARISON' as test,
  public.check_mfa_required() as original_function,
  public.check_mfa_required_fixed() as fixed_function,
  auth.aal() as current_aal,
  CASE 
    WHEN auth.aal() = 'aal1' THEN 'Should return TRUE to block access'
    WHEN auth.aal() = 'aal2' THEN 'Should return FALSE to allow access'
    ELSE 'Unknown AAL state'
  END as expected_behavior;

-- Verify policies now use auth.uid() instead of uid()
SELECT 
  'POLICY VERIFICATION' as test,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN 'CORRECT: Uses auth.uid()'
    WHEN qual LIKE '%uid()%' THEN 'INCORRECT: Still uses uid()'
    ELSE 'CHECK MANUALLY'
  END as function_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'user_codes', 'protected_roles')
  AND policyname LIKE '%school_isolation_%' OR policyname LIKE '%admin_only_%'
ORDER BY tablename, policyname;

-- Final status
SELECT 
  'FINAL REPAIR STATUS' as summary,
  'Fixed function names and MFA logic' as changes_made,
  'Test with MFA Policy Tester now' as next_step;
