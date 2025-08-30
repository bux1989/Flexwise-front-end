-- Debug Auth Context Mismatch
-- JavaScript shows MFA factors, SQL doesn't - let's find out why

-- 1. Check if we're even authenticated in SQL context
SELECT 
    'SQL Auth Context' as check_type,
    auth.uid() as sql_user_id,
    CASE WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED' ELSE '✅ AUTHENTICATED' END as sql_auth_status;

-- 2. Check if JWT is accessible  
SELECT 
    'JWT Auth Context' as check_type,
    auth.jwt() as jwt_data,
    auth.jwt() ->> 'sub' as jwt_user_id,
    auth.jwt() ->> 'aal' as jwt_aal,
    auth.jwt() ->> 'email' as jwt_email;

-- 3. Query MFA factors directly (without auth.uid() filter)
SELECT 
    'All MFA Factors' as info,
    user_id,
    status,
    factor_type,
    friendly_name,
    created_at
FROM auth.mfa_factors 
WHERE status = 'verified'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if your specific user has MFA factors
SELECT 
    'Specific User MFA Check' as info,
    user_id,
    status,
    factor_type,
    friendly_name
FROM auth.mfa_factors 
WHERE user_id = 'ea147260-0e79-48b0-a24e-89b8cd1c4ccb'  -- Your user ID from test
    AND status = 'verified';

-- 5. Compare auth.uid() vs known user ID
SELECT 
    'User ID Comparison' as check_type,
    auth.uid() as auth_uid_result,
    'ea147260-0e79-48b0-a24e-89b8cd1c4ccb' as expected_user_id,
    CASE 
        WHEN auth.uid()::text = 'ea147260-0e79-48b0-a24e-89b8cd1c4ccb' 
        THEN '✅ MATCH' 
        ELSE '❌ MISMATCH' 
    END as comparison_result;

-- 6. Check the exact query our function is using
SELECT 
    'Function Query Debug' as test_type,
    auth.uid() as current_user_id,
    COUNT(*) as mfa_count,
    COUNT(*) > 0 as has_mfa_result
FROM auth.mfa_factors
WHERE auth.uid() = user_id AND status = 'verified';

-- 7. Alternative: Check if user_id column name is different
SELECT 
    'MFA Table Schema' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' 
    AND table_name = 'mfa_factors'
ORDER BY ordinal_position;

-- 8. Test with different user ID field names
SELECT 
    'Alternative MFA Query' as test_type,
    COUNT(*) as factors_by_user_id,
    (SELECT COUNT(*) FROM auth.mfa_factors WHERE id::text LIKE '%ea147260%' AND status = 'verified') as factors_by_id_pattern,
    (SELECT COUNT(*) FROM auth.mfa_factors WHERE status = 'verified') as total_verified_factors;
