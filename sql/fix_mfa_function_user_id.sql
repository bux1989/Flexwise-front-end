-- Fix MFA Function to Use Correct Auth User ID
-- The issue: auth.uid() returns profile_id, but MFA factors are stored against JWT sub (auth user_id)

CREATE OR REPLACE FUNCTION public.check_mfa_required()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_aal text;
  auth_user_id text;
  user_has_mfa boolean;
BEGIN
  -- Get current AAL from JWT
  current_aal := COALESCE(auth.jwt()->>'aal', 'none');
  
  -- Get the REAL auth user ID from JWT sub (not auth.uid() which returns profile_id)
  auth_user_id := auth.jwt()->>'sub';
  
  -- Check if user has verified MFA factors using the correct auth user ID
  SELECT COUNT(*) > 0 INTO user_has_mfa
  FROM auth.mfa_factors
  WHERE auth_user_id::uuid = user_id AND status = 'verified';
  
  -- Debug logging
  RAISE LOG 'MFA Check Fixed: auth_user_id=%, profile_id=%, aal=%, has_mfa=%, result=%', 
    auth_user_id, auth.uid(), current_aal, user_has_mfa,
    CASE 
      WHEN NOT user_has_mfa THEN true  -- No MFA = allow
      WHEN current_aal = 'aal2' THEN true  -- Completed MFA = allow  
      ELSE false  -- Has MFA but not AAL2 = block
    END;
  
  -- Return logic (same as before, but now using correct user ID):
  RETURN CASE 
    WHEN NOT user_has_mfa THEN true      -- No MFA setup = allow access
    WHEN current_aal = 'aal2' THEN true  -- Completed MFA = allow access
    ELSE false                           -- Has MFA but not completed = block access
  END;
END;
$$;

-- Test the FIXED function with correct user ID
SELECT 
  'Testing FIXED MFA Function' as test_type,
  auth.uid() as profile_id,
  auth.jwt()->>'sub' as auth_user_id,
  COALESCE(auth.jwt()->>'aal', 'none') as current_aal,
  EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE (auth.jwt()->>'sub')::uuid = user_id 
    AND status = 'verified'
  ) as has_mfa_correct_check,
  public.check_mfa_required() as function_result,
  CASE 
    WHEN NOT EXISTS(
      SELECT 1 FROM auth.mfa_factors 
      WHERE (auth.jwt()->>'sub')::uuid = user_id 
      AND status = 'verified'
    ) 
    THEN 'Should be TRUE (no MFA)'
    WHEN COALESCE(auth.jwt()->>'aal', 'none') = 'aal2' 
    THEN 'Should be TRUE (AAL2)'
    ELSE 'Should be FALSE (has MFA but not AAL2)'
  END as expected_result;

-- Verify MFA factors are now found with correct user ID
SELECT 
  'MFA Factors Found' as info,
  user_id,
  status,
  factor_type,
  friendly_name
FROM auth.mfa_factors 
WHERE (SELECT auth.jwt()->>'sub')::uuid = user_id 
  AND status = 'verified';

-- Test if table access is now blocked
DO $$
BEGIN
  PERFORM COUNT(*) FROM public.user_profiles LIMIT 1;
  RAISE NOTICE '⚠️ user_profiles is still ACCESSIBLE - function may still need work';
EXCEPTION 
  WHEN others THEN
    RAISE NOTICE '✅ SUCCESS! user_profiles is now BLOCKED - MFA policies working! Error: %', SQLERRM;
END $$;
