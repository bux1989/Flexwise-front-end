-- Debug MFA Policies Status
-- Run this to diagnose why MFA policies aren't working

-- 1. Check if MFA policies exist
SELECT 
    'MFA Policies Count' as check_type,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%' 
    AND permissive = 'RESTRICTIVE';

-- 2. List all MFA policies
SELECT 
    'Existing MFA Policies' as info,
    tablename,
    policyname,
    permissive as policy_type,
    CASE WHEN permissive = 'RESTRICTIVE' THEN '✅' ELSE '❌' END as is_restrictive
FROM pg_policies 
WHERE schemaname = 'public' 
    AND policyname LIKE '%mfa_%'
ORDER BY tablename, policyname;

-- 3. Check if check_mfa_required function exists
SELECT 
    'Function Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'public' AND p.proname = 'check_mfa_required'
        ) THEN '✅ Function exists'
        ELSE '❌ Function MISSING'
    END as status;

-- 4. Test the MFA function directly
SELECT 
    'MFA Function Test' as test_type,
    public.check_mfa_required() as result,
    'Should be FALSE in AAL1 with MFA factors' as expected_behavior;

-- 5. Check current user's MFA status
SELECT 
    'Current User MFA Status' as info,
    auth.uid() as user_id,
    COALESCE(auth.jwt() ->> 'aal', 'none') as current_aal,
    EXISTS(
        SELECT 1 FROM auth.mfa_factors 
        WHERE user_id = auth.uid() 
        AND status = 'verified'
    ) as has_verified_mfa;

-- 6. Check RLS is enabled on critical tables
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'contacts', 'families', 'staff_absences')
ORDER BY tablename;

-- 7. Test a specific table policy manually
SELECT 
    'Direct Policy Test' as test_type,
    'Testing user_profiles access...' as info;

-- Try to access user_profiles (should fail if policies work)
DO $$
BEGIN
    -- This should fail if MFA policies are working
    PERFORM COUNT(*) FROM public.user_profiles LIMIT 1;
    RAISE NOTICE '⚠️ user_profiles is ACCESSIBLE (MFA policies not working)';
EXCEPTION 
    WHEN others THEN
        RAISE NOTICE '✅ user_profiles is BLOCKED (MFA policies working): %', SQLERRM;
END $$;

-- 8. Show function definition to check logic
SELECT 
    'Function Definition' as info,
    pg_get_functiondef(oid) as function_code
FROM pg_proc 
WHERE proname = 'check_mfa_required' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
