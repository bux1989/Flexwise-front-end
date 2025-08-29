-- Insert sample bulletin posts for testing
DO $$
DECLARE
  sample_school_id uuid;
  sample_user_id uuid;
BEGIN
  -- Get first available school ID
  SELECT id INTO sample_school_id 
  FROM structure_schools 
  LIMIT 1;
  
  -- Get first available user ID
  SELECT id INTO sample_user_id 
  FROM user_profiles 
  LIMIT 1;
  
  -- Only proceed if we found valid IDs
  IF sample_school_id IS NOT NULL AND sample_user_id IS NOT NULL THEN
    
    -- Delete existing test posts first
    DELETE FROM public.bulletin_posts 
    WHERE title LIKE 'Test:%' OR title LIKE 'Schulversammlung%' OR title LIKE 'Lehrerkonferenz%';
    
    -- Insert sample bulletin posts
    INSERT INTO public.bulletin_posts (
      school_id, 
      title, 
      body, 
      content,
      priority,
      is_public,
      created_by,
      display_from,
      expires_at,
      is_important,
      read_required
    ) VALUES 
    (
      sample_school_id,
      'Schulversammlung heute',
      'Alle Schüler*innen und Lehrkräfte versammeln sich um 14:30 Uhr in der Aula für wichtige Ankündigungen.',
      'Alle Schüler*innen und Lehrkräfte versammeln sich um 14:30 Uhr in der Aula für wichtige Ankündigungen.',
      'high',
      true,
      sample_user_id,
      now(),
      now() + interval '1 day',
      true,
      false
    ),
    (
      sample_school_id,
      'Lehrerkonferenz morgen',
      'Lehrerkonferenz findet morgen um 16:30 Uhr im großen Konferenzraum statt. Bitte alle wichtigen Unterlagen mitbringen.',
      'Lehrerkonferenz findet morgen um 16:30 Uhr im großen Konferenzraum statt. Bitte alle wichtigen Unterlagen mitbringen.',
      'normal',
      true,
      sample_user_id,
      now(),
      now() + interval '2 days',
      false,
      false
    ),
    (
      sample_school_id,
      'Mensa-Menü Update',
      'Das Mittagessen für heute wurde geändert: Vegetarische Pasta mit Tomatensauce steht jetzt zur Verfügung.',
      'Das Mittagessen für heute wurde geändert: Vegetarische Pasta mit Tomatensauce steht jetzt zur Verfügung.',
      'normal',
      true,
      sample_user_id,
      now(),
      now() + interval '8 hours',
      false,
      false
    ),
    (
      sample_school_id,
      'Test: Wichtige Ankündigung',
      'Dies ist eine Test-Ankündigung mit hoher Priorität.',
      'Dies ist eine Test-Ankündigung mit hoher Priorität.',
      'high',
      true,
      sample_user_id,
      now(),
      now() + interval '3 days',
      true,
      true
    ),
    (
      sample_school_id,
      'Test: Normale Information',
      'Dies ist eine normale Test-Information.',
      'Dies ist eine normale Test-Information.',
      'normal',
      true,
      sample_user_id,
      now(),
      now() + interval '2 days',
      false,
      false
    );
    
    RAISE NOTICE 'Sample bulletin posts inserted successfully!';
    RAISE NOTICE 'School ID used: %', sample_school_id;
    RAISE NOTICE 'User ID used: %', sample_user_id;
    
  ELSE
    RAISE NOTICE 'Could not find valid school_id or user_id. Please check your data.';
    RAISE NOTICE 'School ID found: %', sample_school_id;
    RAISE NOTICE 'User ID found: %', sample_user_id;
  END IF;
END $$;

-- Verify the inserted data
SELECT 
  title,
  content,
  priority,
  is_public,
  created_at,
  expires_at,
  school_id
FROM public.bulletin_posts 
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
