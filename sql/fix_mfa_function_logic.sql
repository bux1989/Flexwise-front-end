-- Fix MFA Function Logic to Handle Undefined AAL
-- The current function doesn't handle session.aal = undefined properly

-- Replace the existing function with corrected logic
CREATE OR REPLACE FUNCTION public.check_mfa_required()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_aal text;
  user_has_mfa boolean;
BEGIN
  -- Get current AAL from JWT (handle NULL/undefined)
  current_aal := COALESCE(auth.jwt()->>'aal', 'none');
  
  -- Check if user has verified MFA factors
  SELECT COUNT(*) > 0 INTO user_has_mfa
  FROM auth.mfa_factors
  WHERE auth.uid() = user_id AND status = 'verified';
  
  -- Debug logging (remove in production)
  RAISE LOG 'MFA Check Debug: user_id=%, aal=%, has_mfa=%, result=%', 
    auth.uid(), current_aal, user_has_mfa, 
    CASE 
      WHEN NOT user_has_mfa THEN true  -- No MFA = allow
      WHEN current_aal = 'aal2' THEN true  -- Completed MFA = allow  
      ELSE false  -- Has MFA but not AAL2 = block
    END;
  
  -- Return logic:
  -- - If user has NO MFA factors: ALLOW (return true)
  -- - If user has MFA factors AND is AAL2: ALLOW (return true)  
  -- - If user has MFA factors AND is NOT AAL2: BLOCK (return false)
  RETURN CASE 
    WHEN NOT user_has_mfa THEN true      -- No MFA setup = allow access
    WHEN current_aal = 'aal2' THEN true  -- Completed MFA = allow access
    ELSE false                           -- Has MFA but not completed = block access
  END;
END;
$$;

-- Test the fixed function
SELECT 
  'Testing Fixed MFA Function' as test_type,
  auth.uid() as current_user,
  COALESCE(auth.jwt()->>'aal', 'none') as current_aal,
  EXISTS(SELECT 1 FROM auth.mfa_factors WHERE user_id = auth.uid() AND status = 'verified') as has_mfa,
  public.check_mfa_required() as function_result,
  CASE 
    WHEN NOT EXISTS(SELECT 1 FROM auth.mfa_factors WHERE user_id = auth.uid() AND status = 'verified') 
    THEN 'Should be TRUE (no MFA)'
    WHEN COALESCE(auth.jwt()->>'aal', 'none') = 'aal2' 
    THEN 'Should be TRUE (AAL2)'
    ELSE 'Should be FALSE (has MFA but not AAL2)'
  END as expected_result;

-- Verify a protected table is now blocked
DO $$
BEGIN
  -- This should now fail if MFA policies are working
  PERFORM COUNT(*) FROM public.user_profiles LIMIT 1;
  RAISE NOTICE '⚠️ user_profiles is still ACCESSIBLE - MFA policies still not working';
EXCEPTION 
  WHEN others THEN
    RAISE NOTICE '✅ user_profiles is now BLOCKED - MFA policies working! Error: %', SQLERRM;
END $$;
