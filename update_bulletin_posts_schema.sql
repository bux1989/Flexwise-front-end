-- Update bulletin_posts table to match InfoBoard component expectations
-- Run this on your Supabase database

BEGIN;

-- Add missing columns
ALTER TABLE public.bulletin_posts 
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Migrate existing data
UPDATE public.bulletin_posts 
SET 
  content = body,  -- Copy body to content
  priority = CASE 
    WHEN is_important = true THEN 'high'
    ELSE 'normal'
  END,
  is_public = CASE 
    WHEN visible_groups = '{}' OR visible_groups IS NULL THEN true
    ELSE false
  END,
  updated_at = created_at
WHERE content IS NULL;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_bulletin_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_bulletin_posts_updated_at ON public.bulletin_posts;
CREATE TRIGGER trigger_bulletin_posts_updated_at
  BEFORE UPDATE ON public.bulletin_posts
  FOR EACH ROW EXECUTE FUNCTION update_bulletin_posts_updated_at();

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_bulletin_posts_public_expires 
ON public.bulletin_posts (school_id, is_public, expires_at) 
WHERE is_public = true;

-- Add check constraint for priority values
ALTER TABLE public.bulletin_posts 
ADD CONSTRAINT check_bulletin_posts_priority 
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

COMMIT;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'bulletin_posts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
