# Debug Permissive Policy Update Failure

## Issue: Updated policies still allow access to user_profiles, contacts, families

## AS SUPERUSER - Debug Commands:

### 1. Verify Policy Updates Were Applied

```sql
-- Check if the policies were actually updated with MFA checks
SELECT 
  'Policy Update Verification' as test,
  tablename,
  policyname,
  permissive,
  cmd,
  CASE 
    WHEN pg_get_expr(qual, c.oid) LIKE '%check_mfa_required%' 
    THEN '✅ Has MFA check'
    ELSE '❌ Missing MFA check'
  END as mfa_check_status
FROM pg_policies p
JOIN pg_class c ON p.tablename = c.relname AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
WHERE p.schemaname = 'public' 
  AND p.tablename IN ('user_profiles', 'contacts', 'families')
  AND p.permissive = 'PERMISSIVE'
ORDER BY tablename, policyname;
```

### 2. Check Function Behavior in Policy Context

```sql
-- Test the function directly vs in policy context
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

### 3. Test Policy Logic Components

```sql
-- Test the school isolation part of the policy
SELECT 
  'School Isolation Test' as test,
  (auth.jwt()->>'profile_id')::uuid as my_profile_id,
  school_id as profile_school_id,
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) as school_check_passes
FROM public.user_profiles 
WHERE id = (auth.jwt()->>'profile_id')::uuid;
```

### 4. Check All Policies on These Tables

```sql
-- List ALL policies (not just school isolation ones)
SELECT 
  'All Policies Check' as test,
  tablename,
  policyname,
  permissive,
  cmd,
  'Any permissive policy can grant access' as note
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'contacts', 'families')
ORDER BY tablename, permissive DESC, policyname;
```

### 5. Simulate Policy Evaluation

```sql
-- Test what happens when we manually apply the logic
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

## Possible Issues:

### Issue A: Policies Not Actually Updated
- Policy update commands failed silently
- **Solution**: Re-run policy updates with error checking

### Issue B: Function Returns True (Wrong)
- `check_mfa_required()` returns `true` when it should return `false`
- **Solution**: Fix function logic

### Issue C: Multiple Policies Conflict
- Other permissive policies still grant access
- **Solution**: Find and update ALL permissive policies

### Issue D: Wrong Policy Logic
- School isolation check passes AND MFA check passes = access granted
- **Solution**: Review logic requirements

## Next Steps Based on Results:

1. **If policies missing MFA checks**: Re-run policy updates
2. **If function returns true**: Fix function logic  
3. **If multiple policies found**: Update all permissive policies
4. **If school isolation fails**: Check profile data consistency

Run these debug commands and share the results to identify the exact issue.
