-- Simple MFA Enforcement for Self-Hosted Supabase
-- Copy and paste this into your Supabase SQL Editor or database console

-- 1. Create the MFA enforcement function
CREATE OR REPLACE FUNCTION auth.enforce_mfa_for_verified_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_verified_mfa boolean := false;
BEGIN
  -- Check if user has any verified MFA factors
  SELECT EXISTS (
    SELECT 1 
    FROM auth.mfa_factors 
    WHERE user_id = NEW.user_id 
    AND status = 'verified'
  ) INTO has_verified_mfa;

  -- If user has verified MFA factors but session is only AAL1, block it
  IF has_verified_mfa AND (NEW.aal IS NULL OR NEW.aal = 'aal1') THEN
    RAISE EXCEPTION 'MFA verification required for this user'
      USING HINT = 'User has verified MFA factors and must complete MFA challenge',
            ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create the trigger to enforce MFA
DROP TRIGGER IF EXISTS enforce_mfa_trigger ON auth.sessions;
CREATE TRIGGER enforce_mfa_trigger
  BEFORE INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION auth.enforce_mfa_for_verified_users();

-- 3. Verify the setup worked
SELECT 
  'MFA enforcement trigger created successfully' as status,
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'enforce_mfa_trigger';
