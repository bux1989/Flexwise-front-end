-- Optional: User Authentication Preferences Table
-- This is OPTIONAL - can use localStorage instead for simpler implementation
-- Only create this table if you want server-side preference storage

-- Create user authentication preferences table
CREATE TABLE user_auth_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_method text NOT NULL 
    CHECK (preferred_method IN (
      'password', 
      'magic-link', 
      'oauth-google', 
      'oauth-github', 
      'oauth-microsoft',
      'oauth-apple'
    )),
  remember_choice boolean DEFAULT false,
  last_used_method text 
    CHECK (last_used_method IN (
      'password', 
      'magic-link', 
      'oauth-google', 
      'oauth-github', 
      'oauth-microsoft',
      'oauth-apple'
    )),
  last_used_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  -- Ensure one preference per user
  CONSTRAINT unique_user_auth_preference UNIQUE (user_id)
);

-- Enable RLS for security
ALTER TABLE user_auth_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own preferences
CREATE POLICY "Users can manage their own auth preferences"
ON user_auth_preferences
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function to update user auth preference
CREATE OR REPLACE FUNCTION update_user_auth_preference(
  p_preferred_method text,
  p_remember_choice boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_auth_preferences (
    user_id,
    preferred_method,
    remember_choice,
    last_used_method,
    last_used_at
  ) VALUES (
    auth.uid(),
    p_preferred_method,
    p_remember_choice,
    p_preferred_method,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    preferred_method = EXCLUDED.preferred_method,
    remember_choice = EXCLUDED.remember_choice,
    last_used_method = EXCLUDED.last_used_method,
    last_used_at = now(),
    updated_at = now();
END;
$$;

-- Function to record auth method usage (for analytics)
CREATE OR REPLACE FUNCTION record_auth_method_usage(
  p_method text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_auth_preferences (
    user_id,
    preferred_method,
    last_used_method,
    last_used_at
  ) VALUES (
    auth.uid(),
    p_method,
    p_method,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_used_method = EXCLUDED.last_used_method,
    last_used_at = now(),
    updated_at = now();
END;
$$;

-- Function to get user's preferred auth method
CREATE OR REPLACE FUNCTION get_user_auth_preference()
RETURNS TABLE (
  preferred_method text,
  remember_choice boolean,
  last_used_method text,
  last_used_at timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uap.preferred_method,
    uap.remember_choice,
    uap.last_used_method,
    uap.last_used_at
  FROM user_auth_preferences uap
  WHERE uap.user_id = auth.uid();
END;
$$;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_auth_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_auth_preferences_updated_at
  BEFORE UPDATE ON user_auth_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_auth_preferences_updated_at();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_auth_preference(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION record_auth_method_usage(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_auth_preference() TO authenticated;

-- Usage Examples:
-- 
-- -- Set user's preferred method
-- SELECT update_user_auth_preference('oauth-google', true);
-- 
-- -- Record that user just used a method
-- SELECT record_auth_method_usage('magic-link');
-- 
-- -- Get user's preferences
-- SELECT * FROM get_user_auth_preference();

-- Alternative: Simple localStorage Approach (Recommended to start)
-- Instead of this table, you can store preferences in localStorage:
-- 
-- localStorage.setItem('preferred_auth_method', 'oauth-google');
-- localStorage.setItem('remember_auth_choice', 'true');
-- 
-- const preferred = localStorage.getItem('preferred_auth_method');
-- const remember = localStorage.getItem('remember_auth_choice') === 'true';

SELECT 'User authentication preferences table created successfully' as status;
SELECT 'Note: This is optional - localStorage is simpler for MVP' as recommendation;
