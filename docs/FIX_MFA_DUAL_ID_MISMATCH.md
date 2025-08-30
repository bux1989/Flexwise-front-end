# Fix MFA Dual ID Mismatch

## Root Cause Identified

Your debugging results reveal the **classic dual ID problem**:

- **auth.uid()** = `ea147260-0e79-48b0-a24e-89b8cd1c4ccb` (profile_id)
- **JWT subject** = `b61aa963-b65a-400f-a578-818825e0ebac` (auth user_id) 
- **MFA factors** use `user_id = b61aa963-b65a-400f-a578-818825e0ebac` (JWT subject)
- **RLS policy** incorrectly uses `auth.uid()` (profile_id)

This is why:
- Admin can see MFA factors (bypasses RLS)
- User gets "0 factors" (ID mismatch)
- Function returns `true` (no factors found with profile_id)

## Fix Commands

### AS SUPERUSER (Database Settings > SQL Editor):

```sql
-- 1. Drop the incorrect RLS policy
DROP POLICY IF EXISTS "mfa_factors_user_select" ON auth.mfa_factors;

-- 2. Create corrected RLS policy using JWT subject
CREATE POLICY "mfa_factors_user_select"
ON auth.mfa_factors
FOR SELECT
TO authenticated
USING ((auth.jwt()->>'sub')::uuid = user_id);

-- 3. Fix the check_mfa_required function to use JWT subject
CREATE OR REPLACE FUNCTION public.check_mfa_required()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    array[auth.jwt()->>'aal'] <@ (
      SELECT
        CASE
          WHEN count(id) > 0 THEN array['aal2']
          ELSE array['aal1', 'aal2']
        END AS aal
      FROM auth.mfa_factors
      WHERE (auth.jwt()->>'sub')::uuid = user_id AND status = 'verified'
    )
  );
END;
$$;

-- 4. Verify the fixes
SELECT 
  'Policy Fixed' as status,
  schemaname,
  tablename, 
  policyname,
  CASE 
    WHEN pg_get_expr(polqual, polrelid) LIKE '%jwt%sub%' 
    THEN '✅ Uses JWT subject'
    ELSE '❌ Still uses auth.uid()'
  END as policy_check
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'mfa_factors';

-- 5. Test function logic breakdown
SELECT 
  'Function Test' as test,
  (auth.jwt()->>'sub')::uuid as jwt_subject_uuid,
  'Should match MFA user_id: b61aa963-b65a-400f-a578-818825e0ebac' as note;
```

### AS AUTHENTICATED USER (after fix):

```sql
-- Test 1: Should now show your MFA factors
SELECT 
  'My MFA Factors (Fixed)' as info,
  user_id,
  status,
  factor_type,
  friendly_name,
  (auth.jwt()->>'sub')::uuid as my_jwt_subject
FROM auth.mfa_factors 
WHERE user_id = (auth.jwt()->>'sub')::uuid
  AND status = 'verified';

-- Test 2: Function should now return false (blocking access for AAL1 with MFA)
SELECT 
  'MFA Function Test (Fixed)' as test,
  public.check_mfa_required() as result,
  CASE 
    WHEN public.check_mfa_required() = false THEN '🔒 BLOCKS access (correct for AAL1 with MFA)' 
    ELSE '✅ ALLOWS access'
  END as interpretation;

-- Test 3: Verify ID mapping
SELECT 
  'ID Mapping Verification' as test,
  auth.uid() as profile_id,
  (auth.jwt()->>'sub')::uuid as auth_user_id,
  'MFA factors use auth_user_id, not profile_id' as explanation;
```

## Expected Results After Fix

1. **My MFA Factors**: Should show your verified phone factor
2. **Function Test**: Should return `false` (correctly blocking AAL1 access)
3. **Policy Check**: Should show "✅ Uses JWT subject"

## Why This Happened

Supabase has two user identifiers:
- **auth.uid()**: Returns `profile_id` from user_metadata
- **JWT subject**: The actual authentication user ID

MFA factors are stored with the authentication user ID, but our RLS policy was using the profile ID.

This is documented in `docs/RULES_AUTH_DUAL_ID.md` to prevent future occurrences.
