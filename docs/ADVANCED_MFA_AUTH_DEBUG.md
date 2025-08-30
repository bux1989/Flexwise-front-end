# Advanced MFA Auth Context Debugging

## Issue Analysis

Your results show contradictory behavior:
- ✅ Function exists and returns `true` (allows access)
- ❌ User still can't see MFA factors 
- ❌ Permission denied for `auth.users` table

This suggests auth context issues. Let's debug step by step.

## Commands to Run as Authenticated User

### Step 1: Check Basic Auth Context
```sql
-- Test basic auth functions
SELECT 
  'Auth Context Debug' as test,
  auth.uid() as user_id,
  auth.jwt() as jwt_token,
  auth.role() as current_role,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ Not authenticated'
    ELSE '✅ Authenticated'
  END as auth_status;
```

### Step 2: Check AAL Level and JWT Contents
```sql
-- Check AAL level specifically
SELECT 
  'AAL Debug' as test,
  auth.jwt()->>'aal' as aal_level,
  auth.jwt()->>'sub' as jwt_subject,
  auth.jwt()->>'role' as jwt_role,
  auth.jwt()->>'iss' as jwt_issuer;
```

### Step 3: Debug MFA Factors Query with Details
```sql
-- Check what the RLS policy is actually evaluating
SELECT 
  'MFA Policy Debug' as test,
  auth.uid() as my_auth_uid,
  'Looking for user_id = ' || auth.uid()::text as search_criteria;

-- Try to see if ANY mfa_factors exist (ignoring WHERE clause)
SELECT 
  'All MFA Factors Check' as test,
  count(*) as total_factors_in_table
FROM auth.mfa_factors;
```

### Step 4: Test RLS Policy Logic Manually
```sql
-- Test the RLS policy condition manually
SELECT 
  'RLS Policy Test' as test,
  auth.uid() = user_id as policy_condition_result,
  user_id,
  auth.uid() as current_auth_uid
FROM auth.mfa_factors 
WHERE status = 'verified';
```

### Step 5: Check Function Logic Components
```sql
-- Break down the MFA function logic
SELECT 
  'Function Logic Debug' as test,
  EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE auth.uid() = user_id AND status = 'verified'
  ) as has_verified_factors,
  auth.jwt()->>'aal' as current_aal,
  array[auth.jwt()->>'aal'] as aal_array,
  CASE
    WHEN EXISTS(SELECT 1 FROM auth.mfa_factors WHERE auth.uid() = user_id AND status = 'verified')
    THEN array['aal2']
    ELSE array['aal1', 'aal2']
  END as required_aal_array;
```

### Step 6: Alternative Auth Context Check
```sql
-- Try a different approach to get user info
SELECT 
  'Alternative User Check' as test,
  current_setting('request.jwt.claims', true) as jwt_claims,
  current_setting('request.jwt.claim.sub', true) as jwt_subject,
  current_setting('request.jwt.claim.aal', true) as jwt_aal;
```

## Expected Diagnoses

Based on results, we'll identify:

### Scenario A: Auth Context Lost
- `auth.uid()` returns NULL
- **Fix**: Re-authenticate properly

### Scenario B: AAL Level Changed  
- User completed MFA and is now AAL2
- Function correctly returns `true`
- **Issue**: RLS policy or grants problem

### Scenario C: UUID Mismatch
- `auth.uid()` doesn't match MFA factor `user_id`
- **Fix**: Check for UUID format issues

### Scenario D: Permission Issue
- RLS policy exists but grants are missing
- **Fix**: Additional GRANT statements needed

## Next Steps

Run these queries and share results. Based on the output, we'll:

1. **If auth.uid() is NULL**: Fix authentication
2. **If AAL is 'aal2'**: Check why RLS policy isn't working  
3. **If UUIDs don't match**: Investigate ID consistency
4. **If grants missing**: Add proper permissions

This will pinpoint the exact issue causing the contradictory behavior.
