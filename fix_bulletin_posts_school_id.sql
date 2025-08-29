-- Fix bulletin posts school_id to match current user's school
DO $$
DECLARE
  current_user_school_id uuid;
  sample_user_id uuid;
  posts_updated integer;
BEGIN
  -- Get the school_id from an existing bulletin post (since "Test A" is showing)
  SELECT school_id INTO current_user_school_id 
  FROM bulletin_posts 
  WHERE title = 'test A' 
  LIMIT 1;
  
  -- If we couldn't find it from existing post, get from structure_schools
  IF current_user_school_id IS NULL THEN
    SELECT id INTO current_user_school_id 
    FROM structure_schools 
    LIMIT 1;
  END IF;
  
  -- Get a user ID from the same school
  SELECT id INTO sample_user_id 
  FROM user_profiles 
  WHERE school_id = current_user_school_id
  LIMIT 1;
  
  -- Update all sample posts to use the correct school_id
  UPDATE public.bulletin_posts 
  SET 
    school_id = current_user_school_id,
    created_by = COALESCE(sample_user_id, created_by)
  WHERE 
    title IN (
      'Schulversammlung heute',
      'Lehrerkonferenz morgen', 
      'Mensa-Menü Update',
      'Test: Wichtige Ankündigung',
      'Test: Normale Information'
    );
    
  GET DIAGNOSTICS posts_updated = ROW_COUNT;
  
  RAISE NOTICE 'Updated % bulletin posts to use school_id: %', posts_updated, current_user_school_id;
  RAISE NOTICE 'Using user_id: %', sample_user_id;
  
  -- Show the updated posts
  RAISE NOTICE 'Current bulletin posts for school %:', current_user_school_id;
  
END $$;

-- Verify the fix - show all posts for the school
SELECT 
  title,
  content,
  priority,
  school_id,
  created_at
FROM public.bulletin_posts 
WHERE school_id = (
  SELECT school_id 
  FROM bulletin_posts 
  WHERE title = 'test A' 
  LIMIT 1
)
ORDER BY created_at DESC;
