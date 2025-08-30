# Fix MFA Function and Missing RLS Policies

## Issue Analysis
From debugging results:
1. `check_mfa_required()` function has syntax error
2. No RLS policies exist for `auth.mfa_factors` table
3. Authenticated users can't see their own MFA factors

## Commands to Run

### AS SUPERUSER (Database Settings > SQL Editor):

```sql
-- 1. Fix the check_mfa_required function (corrected version)
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
      WHERE auth.uid() = user_id AND status = 'verified'
    )
  );
END;
$$;

-- 2. Grant necessary permissions
GRANT SELECT ON auth.mfa_factors TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_mfa_required() TO authenticated;

-- 3. Create RLS policy for auth.mfa_factors (allow users to see their own factors)
CREATE POLICY "mfa_factors_user_select"
ON auth.mfa_factors
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Verify function creation
SELECT 
  'Function Status' as info,
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'check_mfa_required'
    ) THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as status;

-- 5. Verify RLS policies
SELECT 
  'RLS Policies' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'mfa_factors';
```

### AS AUTHENTICATED USER (after login):

```sql
-- Test 1: Check function works
SELECT 
  'MFA Function Test' as test,
  public.check_mfa_required() as result,
  CASE 
    WHEN public.check_mfa_required() = false THEN '🔒 BLOCKS access (correct for AAL1 with MFA)' 
    ELSE '✅ ALLOWS access'
  END as interpretation;

-- Test 2: Check if user can see own MFA factors
SELECT 
  'My MFA Factors' as info,
  user_id,
  status,
  factor_type,
  friendly_name
FROM auth.mfa_factors 
WHERE user_id = auth.uid()
  AND status = 'verified';

-- Test 3: Verify auth context
SELECT 
  'My Auth Context' as info,
  auth.uid() as my_auth_user_id,
  auth.jwt()->>'aal' as my_aal_level,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as my_email;
```

## Expected Results

After running these commands:

1. **Function Status**: Should show "✅ Function exists"
2. **RLS Policies**: Should show the new `mfa_factors_user_select` policy
3. **MFA Function Test**: Should return `false` and show "🔒 BLOCKS access" (correct behavior)
4. **My MFA Factors**: Should now show your verified MFA factors
5. **Auth Context**: Should show your user ID, AAL level, and email

## Next Steps

Once this is working:
1. Users will be able to see their own MFA factors
2. The `check_mfa_required()` function will work correctly
3. Table access policies will properly enforce MFA requirements
