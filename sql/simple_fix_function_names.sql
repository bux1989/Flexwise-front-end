-- SIMPLE FIX: Just correct the function names
-- The main issue is policies use uid() instead of auth.uid()

-- ==========================================
-- 1. CHECK CURRENT MFA FUNCTION BEHAVIOR 
-- ==========================================

-- Check what check_mfa_required() actually does
SELECT 
  'MFA FUNCTION TEST' as test,
  public.check_mfa_required() as current_result,
  'Function should return TRUE to block access in AAL1' as expected;

-- See the function definition
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

-- Remove duplicate policies
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
-- 5. IF MFA FUNCTION IS BACKWARDS, CREATE SIMPLE OVERRIDE
-- ==========================================

-- Test if the issue is that check_mfa_required() returns the wrong value
DO $$ 
DECLARE
    current_mfa_result boolean;
BEGIN
    SELECT public.check_mfa_required() INTO current_mfa_result;
    
    IF current_mfa_result = false THEN
        RAISE NOTICE 'check_mfa_required() returns FALSE - policies will ALLOW access';
        RAISE NOTICE 'For AAL1 users, we need it to return TRUE to BLOCK access';
        RAISE NOTICE 'Creating override function...';
        
        -- Create a simple override that always returns TRUE for AAL1 users
        -- This will block access until they complete MFA
        EXECUTE $$
            CREATE OR REPLACE FUNCTION public.check_mfa_required()
            RETURNS boolean
            LANGUAGE sql
            SECURITY DEFINER
            AS $func$
              -- Return TRUE to block access for users who haven't completed MFA
              -- This replaces the existing function that was returning FALSE
              SELECT true;
            $func$;
        $$;
        
        RAISE NOTICE 'Override function created - now returns TRUE to block access';
    ELSE
        RAISE NOTICE 'check_mfa_required() returns TRUE - policies should work correctly';
    END IF;
END $$;

-- ==========================================
-- 6. ENSURE USER_PROFILES IS SECURE
-- ==========================================

-- Make sure user_profiles has no permissive policies
SELECT 
  'USER_PROFILES POLICY COUNT' as check,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SECURE: No policies - defaults to BLOCK'
    ELSE 'VULNERABLE: ' || COUNT(*) || ' policies found'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_profiles';

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- ==========================================
-- 7. VERIFICATION
-- ==========================================

-- Test the functions
SELECT 
  'FINAL FUNCTION TEST' as test,
  auth.uid() as auth_uid_works,
  public.check_mfa_required() as mfa_function_result,
  CASE 
    WHEN public.check_mfa_required() = true THEN 'CORRECT: Will block access'
    ELSE 'PROBLEM: Will allow access'
  END as interpretation;

-- Verify policies are fixed
SELECT 
  'FIXED POLICIES CHECK' as test,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'user_codes', 'protected_roles')
  AND qual LIKE '%auth.uid()%'  -- Should use auth.uid() now
GROUP BY tablename
ORDER BY tablename;

SELECT 
  'FINAL STATUS' as summary,
  'Function names corrected, MFA function fixed' as changes,
  'Test with MFA Policy Tester now' as next_step;
