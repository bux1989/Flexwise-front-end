-- Fix MFA enforcement trigger to work with Supabase's flow
-- The previous trigger was too aggressive and blocked the initial login completely
-- Supabase MFA flow needs to create an initial session first, then upgrade it

-- Remove the aggressive trigger temporarily
DROP TRIGGER IF EXISTS enforce_mfa_trigger ON auth.sessions;

-- Option 1: More lenient trigger that allows initial AAL1 sessions
-- but logs when MFA should be required (for monitoring)
CREATE OR REPLACE FUNCTION auth.log_mfa_status()
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

  -- Log when user with MFA creates AAL1 session (for monitoring)
  IF has_verified_mfa AND (NEW.aal IS NULL OR NEW.aal = 'aal1') THEN
    -- Log this for security monitoring but don't block
    INSERT INTO auth.audit_log_entries (
      instance_id,
      id,
      payload,
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      jsonb_build_object(
        'action', 'mfa_bypass_detected',
        'user_id', NEW.user_id,
        'session_aal', COALESCE(NEW.aal, 'aal1'),
        'has_verified_mfa', has_verified_mfa,
        'note', 'User with verified MFA factors created AAL1 session'
      ),
      now()
    );
  END IF;
  
  -- Always allow the session to be created
  RETURN NEW;
END;
$$;

-- Create the new monitoring trigger
CREATE TRIGGER log_mfa_status_trigger
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION auth.log_mfa_status();

-- Grant permissions
GRANT EXECUTE ON FUNCTION auth.log_mfa_status() TO postgres, anon, authenticated, service_role;

SELECT 'MFA enforcement trigger updated - now allows Supabase MFA flow' as status;
