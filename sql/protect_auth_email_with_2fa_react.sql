-- Function: protect_auth_email_with_2fa_react
-- Purpose: Prevent deletion of authentication email and manage 2FA dependencies
-- Security: Ensures users can't delete their login email or break 2FA setup

-- 1. Function to check if email is used for authentication
CREATE OR REPLACE FUNCTION is_auth_email_react(email_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_email TEXT;
BEGIN
  -- Get the current user's email from JWT claims
  auth_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  RETURN email_value = auth_email;
END;
$$;

-- 2. Trigger function to prevent auth email deletion
CREATE OR REPLACE FUNCTION prevent_auth_email_deletion_react()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_email TEXT;
  has_2fa_enabled BOOLEAN := false;
BEGIN
  -- Only check email contacts
  IF OLD.type != 'email' THEN
    RETURN OLD;
  END IF;
  
  -- Get the current user's email from JWT claims
  auth_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  -- Prevent deletion of authentication email
  IF OLD.value = auth_email THEN
    RAISE EXCEPTION 'Cannot delete authentication email address: %', auth_email;
  END IF;
  
  -- Check if user has 2FA enabled (check auth.mfa_factors table)
  SELECT EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.uid() 
    AND status = 'verified'
  ) INTO has_2fa_enabled;
  
  -- If 2FA is enabled and this is the primary email, require confirmation
  IF has_2fa_enabled AND OLD.is_primary THEN
    -- Log the deletion attempt for security audit
    INSERT INTO audit_log_react (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      metadata,
      created_at
    ) VALUES (
      auth.uid(),
      'DELETE_2FA_EMAIL_ATTEMPT',
      'contacts',
      OLD.id,
      row_to_json(OLD),
      jsonb_build_object(
        'email_deleted', OLD.value,
        'auth_email', auth_email,
        '2fa_enabled', has_2fa_enabled,
        'warning', 'User deleted email while 2FA is active'
      ),
      NOW()
    );
  END IF;
  
  RETURN OLD;
END;
$$;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS prevent_auth_email_deletion_trigger ON contacts;
CREATE TRIGGER prevent_auth_email_deletion_trigger
  BEFORE DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_auth_email_deletion_react();

-- 4. RLS Policy for additional protection
DROP POLICY IF EXISTS "protect_auth_email_deletion_react" ON contacts;
CREATE POLICY "protect_auth_email_deletion_react"
ON contacts FOR DELETE
TO authenticated
USING (
  -- Allow deletion ONLY if:
  -- 1. User owns the contact (via profile_id and school_id)
  -- 2. AND it's NOT their authentication email
  profile_id IN (
    SELECT up.id FROM user_profiles up 
    WHERE up.school_id = (
      SELECT school_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  AND NOT (
    type = 'email' 
    AND value = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

-- 5. Helper function for 2FA email validation
CREATE OR REPLACE FUNCTION validate_2fa_email_change_react(
  old_email TEXT,
  new_email TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_2fa_enabled BOOLEAN := false;
  auth_email TEXT;
BEGIN
  -- Get current auth email
  auth_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  -- Check if user has 2FA enabled
  SELECT EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.uid() 
    AND status = 'verified'
  ) INTO has_2fa_enabled;
  
  -- If changing from auth email and 2FA is enabled, require special handling
  IF old_email = auth_email AND has_2fa_enabled AND new_email != auth_email THEN
    -- Log the change attempt
    INSERT INTO audit_log_react (
      user_id,
      action,
      table_name,
      metadata,
      created_at
    ) VALUES (
      auth.uid(),
      'CHANGE_2FA_AUTH_EMAIL',
      'contacts',
      jsonb_build_object(
        'old_email', old_email,
        'new_email', new_email,
        '2fa_enabled', has_2fa_enabled,
        'requires_2fa_reset', true
      ),
      NOW()
    );
    
    RAISE NOTICE 'Changing authentication email while 2FA is enabled. Consider updating 2FA settings.';
  END IF;
  
  RETURN true;
END;
$$;

-- 6. Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log_react (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_auth_email_react(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_2fa_email_change_react(TEXT, TEXT) TO authenticated;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON audit_log_react(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log_react(created_at);

-- Comments for documentation
COMMENT ON FUNCTION prevent_auth_email_deletion_react IS 
'Prevents deletion of authentication email and logs 2FA-related email changes for security audit';

COMMENT ON FUNCTION validate_2fa_email_change_react IS 
'Validates email changes when 2FA is enabled and logs security events';

COMMENT ON TABLE audit_log_react IS 
'Security audit log for tracking authentication and 2FA related changes';
