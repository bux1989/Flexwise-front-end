-- Fix missing password verification hook function
-- Run this in your Supabase database

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

  -- Log the password attempt (optional - for security monitoring)
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

  -- Always return the original event to allow the process to continue
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.password_verification_attempt(jsonb) TO postgres, anon, authenticated, service_role;

-- Verify the function was created
SELECT 'Password verification hook function created successfully' as status;
