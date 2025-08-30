# Corrected Policy Verification Commands

## AS SUPERUSER - Fixed SQL Commands:

### 1. Simple Policy Check (No pg_get_expr)

```sql
-- Simple check to see which policies exist
SELECT 
  'Policy Update Verification' as test,
  tablename,
  policyname,
  permissive,
  cmd,
  'Check if policies were recreated with current timestamp' as note
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'contacts', 'families')
  AND permissive = 'PERMISSIVE'
ORDER BY tablename, policyname;
```

### 2. Test Function Directly

```sql
-- Test the check_mfa_required function
SELECT 
  'Function Context Test' as test,
  (SELECT public.check_mfa_required()) as direct_function_call,
  auth.jwt()->>'aal' as current_aal,
  EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE (auth.jwt()->>'sub')::uuid = user_id AND status = 'verified'
  ) as has_verified_mfa,
  'Function should return FALSE for AAL1 with MFA' as expected;
```

### 3. Test School Isolation Logic

```sql
-- Test the school isolation part
SELECT 
  'School Isolation Test' as test,
  (auth.jwt()->>'profile_id')::uuid as my_profile_id,
  school_id as profile_school_id,
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) as school_check_passes,
  'Should be TRUE if user belongs to this school' as note
FROM public.user_profiles 
WHERE id = (auth.jwt()->>'profile_id')::uuid;
```

### 4. Check Policy Names (Maybe They Don't Exist)

```sql
-- Check if the policies we tried to create actually exist
SELECT 
  'Policy Existence Check' as test,
  'user_profiles_school_isolation' as expected_policy,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'user_profiles_school_isolation'
    ) THEN '✅ Policy exists'
    ELSE '❌ Policy missing'
  END as status

UNION ALL

SELECT 
  'Policy Existence Check' as test,
  'school_isolation_contacts_select' as expected_policy,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'contacts' 
        AND policyname = 'school_isolation_contacts_select'
    ) THEN '✅ Policy exists'
    ELSE '❌ Policy missing'
  END as status

UNION ALL

SELECT 
  'Policy Existence Check' as test,
  'school_isolation_families_select' as expected_policy,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'families' 
        AND policyname = 'school_isolation_families_select'
    ) THEN '✅ Policy exists'
    ELSE '❌ Policy missing'
  END as status;
```

### 5. Manual Policy Logic Test

```sql
-- Test what the policy logic should evaluate to
WITH policy_test AS (
  SELECT 
    'user_profiles' as table_name,
    (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) as school_isolation_passes,
    (SELECT public.check_mfa_required()) as mfa_check_passes,
    (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) 
    AND (SELECT public.check_mfa_required()) as combined_policy_result
  FROM public.user_profiles 
  WHERE id = (auth.jwt()->>'profile_id')::uuid
)
SELECT 
  'Manual Policy Simulation' as test,
  table_name,
  school_isolation_passes,
  mfa_check_passes,
  combined_policy_result,
  CASE 
    WHEN combined_policy_result = true THEN '❌ Policy would ALLOW access'
    ELSE '✅ Policy would BLOCK access'
  END as policy_verdict
FROM policy_test;
```

## Expected Results to Look For:

1. **Policy Existence Check**: Should show "✅ Policy exists" for all 3 tables
2. **Function Test**: Should show `direct_function_call = false`
3. **School Isolation**: Should show `school_check_passes = true` 
4. **Manual Simulation**: Should show `combined_policy_result = false` (blocked)

If any of these don't match expectations, we've found the issue!
