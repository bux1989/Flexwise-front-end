-- Migration: Add timestamp columns to profile_info_staff table
-- Purpose: Support tracking when staff profiles are created and modified

-- Add created_at and updated_at columns with default values
ALTER TABLE profile_info_staff 
ADD COLUMN created_at timestamp DEFAULT now(),
ADD COLUMN updated_at timestamp DEFAULT now();

-- Set initial values for existing records
UPDATE profile_info_staff 
SET created_at = now(), updated_at = now() 
WHERE created_at IS NULL OR updated_at IS NULL;

-- Create trigger to automatically update updated_at on changes
CREATE OR REPLACE FUNCTION update_profile_info_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to profile_info_staff table
CREATE TRIGGER update_profile_info_staff_updated_at 
    BEFORE UPDATE ON profile_info_staff 
    FOR EACH ROW 
    EXECUTE FUNCTION update_profile_info_staff_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN profile_info_staff.created_at IS 'Timestamp when the staff profile was created';
COMMENT ON COLUMN profile_info_staff.updated_at IS 'Timestamp of last modification, automatically updated on changes';
