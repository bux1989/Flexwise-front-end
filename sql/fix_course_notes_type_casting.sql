-- Fix for course_notes policies with proper type casting
-- This addresses the "operator does not exist: text = uuid" error

-- First, let's check the exact data types to understand the mismatch
DO $$ 
DECLARE
    course_notes_school_id_type text;
    user_profiles_school_id_type text;
BEGIN
    -- Get data types
    SELECT data_type INTO course_notes_school_id_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'course_notes' 
      AND column_name = 'school_id';
      
    SELECT data_type INTO user_profiles_school_id_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'school_id';
    
    RAISE NOTICE 'course_notes.school_id type: %', course_notes_school_id_type;
    RAISE NOTICE 'user_profiles.school_id type: %', user_profiles_school_id_type;
END $$;

-- Option 1: Cast the user_profiles school_id to text (if course_notes.school_id is text)
DROP POLICY IF EXISTS "school_isolation_course_notes_delete" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_delete" ON public.course_notes FOR DELETE TO authenticated
USING ((school_id = (SELECT school_id::text FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_notes_insert" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_insert" ON public.course_notes FOR INSERT TO authenticated
WITH CHECK ((school_id = (SELECT school_id::text FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_notes_select" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_select" ON public.course_notes FOR SELECT TO authenticated
USING ((school_id = (SELECT school_id::text FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_course_notes_update" ON public.course_notes;
CREATE POLICY "school_isolation_course_notes_update" ON public.course_notes FOR UPDATE TO authenticated
USING ((school_id = (SELECT school_id::text FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- If the above fails, try Option 2: Cast course_notes.school_id to uuid (if user_profiles.school_id is uuid)
-- DROP POLICY IF EXISTS "school_isolation_course_notes_delete" ON public.course_notes;
-- CREATE POLICY "school_isolation_course_notes_delete" ON public.course_notes FOR DELETE TO authenticated
-- USING ((school_id::uuid = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- DROP POLICY IF EXISTS "school_isolation_course_notes_insert" ON public.course_notes;
-- CREATE POLICY "school_isolation_course_notes_insert" ON public.course_notes FOR INSERT TO authenticated
-- WITH CHECK ((school_id::uuid = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- DROP POLICY IF EXISTS "school_isolation_course_notes_select" ON public.course_notes;
-- CREATE POLICY "school_isolation_course_notes_select" ON public.course_notes FOR SELECT TO authenticated
-- USING ((school_id::uuid = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- DROP POLICY IF EXISTS "school_isolation_course_notes_update" ON public.course_notes;
-- CREATE POLICY "school_isolation_course_notes_update" ON public.course_notes FOR UPDATE TO authenticated
-- USING ((school_id::uuid = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL) AND (SELECT public.check_mfa_required()));

-- Verify the policies were created successfully
SELECT 
  policyname,
  tablename,
  'Policy created successfully' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'course_notes'
  AND policyname LIKE 'school_isolation_%'
ORDER BY policyname;
