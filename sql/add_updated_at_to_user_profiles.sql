-- Migration: Add updated_at column to user_profiles table
-- Purpose: Support tracking when profiles are last modified

-- Add updated_at column with default value
ALTER TABLE user_profiles 
ADD COLUMN updated_at timestamp DEFAULT now();

-- Set initial values for existing records
UPDATE user_profiles 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create trigger to automatically update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to user_profiles table
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.updated_at IS 'Timestamp of last modification, automatically updated on changes';
