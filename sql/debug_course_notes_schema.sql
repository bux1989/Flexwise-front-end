-- Debug: Check data types for course_notes and user_profiles tables
-- This will help identify the type mismatch causing the error

-- Check course_notes table schema
SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'course_notes'
  AND column_name IN ('school_id', 'id')
ORDER BY ordinal_position;

-- Check user_profiles table schema  
SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
  AND column_name IN ('school_id', 'id')
ORDER BY ordinal_position;

-- Check what auth.uid() returns
SELECT 
  'auth.uid() type' as info,
  pg_typeof(auth.uid()) as auth_uid_type;

-- Test the problematic comparison directly
SELECT 
  'Direct comparison test' as test_name,
  pg_typeof((SELECT school_id FROM public.user_profiles WHERE id = auth.uid())) as user_profiles_school_id_type,
  pg_typeof(cn.school_id) as course_notes_school_id_type
FROM public.course_notes cn 
LIMIT 1;
