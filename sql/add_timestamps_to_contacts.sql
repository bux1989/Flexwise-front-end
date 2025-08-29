-- Migration: Add timestamp columns to contacts table
-- Date: 2025-08-29
-- Issue: contacts table missing updated_at column causing SQLSTATE 42703
-- Purpose: Support tracking when contacts are created and modified

-- Add created_at and updated_at columns with default values
ALTER TABLE contacts 
ADD COLUMN created_at timestamp DEFAULT now(),
ADD COLUMN updated_at timestamp DEFAULT now();

-- Set initial values for existing records
UPDATE contacts 
SET created_at = now(), updated_at = now() 
WHERE created_at IS NULL OR updated_at IS NULL;

-- Create trigger to automatically update updated_at on changes
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to contacts table
CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_contacts_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN contacts.created_at IS 'Timestamp when the contact was created';
COMMENT ON COLUMN contacts.updated_at IS 'Timestamp of last modification, automatically updated on changes';
