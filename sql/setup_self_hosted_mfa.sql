-- Self-hosted Supabase MFA Setup
-- Run this SQL in your self-hosted Supabase instance
--
-- IMPORTANT: Before running this, ensure these GoTrue environment variables are set:
-- GOTRUE_MFA_ENABLED=true
-- GOTRUE_MFA_TOTP_ENROLL_ENABLED=true
-- GOTRUE_MFA_TOTP_VERIFY_ENABLED=true

-- 1. Create MFA verification attempt hook function (since you have it enabled)
CREATE OR REPLACE FUNCTION public.mfa_verification_attempt(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  factor_id uuid;
  valid boolean;
  ip_address text;
BEGIN
  -- Extract data from the event
  user_id := (event->>'user_id')::uuid;
  factor_id := (event->>'factor_id')::uuid;
  valid := (event->>'valid')::boolean;
  ip_address := event->>'ip_address';

  -- Log the MFA attempt (optional - for security monitoring)
  INSERT INTO auth.audit_log_entries (
    instance_id,
    id,
    payload,
    created_at,
    ip_address
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    jsonb_build_object(
      'action', 'mfa_verification_attempt',
      'user_id', user_id,
      'factor_id', factor_id,
      'valid', valid,
      'timestamp', now()
    ),
    now(),
    ip_address
  );

  -- Always return the original event to allow the process to continue
  RETURN event;
END;
$$;

-- 2. Create password verification attempt hook function (optional but recommended)
CREATE OR REPLACE FUNCTION public.password_verification_attempt(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  valid boolean;
  ip_address text;
BEGIN
  -- Extract data from the event
  user_id := (event->>'user_id')::uuid;
  valid := (event->>'valid')::boolean;
  ip_address := event->>'ip_address';

  -- Log the password attempt
  INSERT INTO auth.audit_log_entries (
    instance_id,
    id,
    payload,
    created_at,
    ip_address
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    jsonb_build_object(
      'action', 'password_verification_attempt',
      'user_id', user_id,
      'valid', valid,
      'timestamp', now()
    ),
    now(),
    ip_address
  );

  RETURN event;
END;
$$;

-- 3. CRITICAL: MFA Enforcement Function (This is what actually enforces MFA)
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

-- 4. Create the enforcement trigger
DROP TRIGGER IF EXISTS enforce_mfa_trigger ON auth.sessions;
CREATE TRIGGER enforce_mfa_trigger
  BEFORE INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION auth.enforce_mfa_for_verified_users();

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.mfa_verification_attempt(jsonb) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.password_verification_attempt(jsonb) TO postgres, anon, authenticated, service_role;

-- 6. Verify setup
SELECT 
  'MFA enforcement trigger created' as status,
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'enforce_mfa_trigger';
