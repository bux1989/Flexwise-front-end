-- Fix user_codes policies - column is 'id' not 'user_id'

-- USER_CODES (critical - uses id = auth.uid())
DROP POLICY IF EXISTS "school_isolation_user_codes_select" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_select" ON public.user_codes FOR SELECT TO authenticated
USING ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_insert" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_insert" ON public.user_codes FOR INSERT TO authenticated
WITH CHECK ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_update" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_update" ON public.user_codes FOR UPDATE TO authenticated
USING ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_codes_delete" ON public.user_codes;
CREATE POLICY "school_isolation_user_codes_delete" ON public.user_codes FOR DELETE TO authenticated
USING ((id = auth.uid()) AND (SELECT public.check_mfa_required()));

-- Verify the policies were created
SELECT 
  'USER_CODES POLICY CHECK' as test,
  policyname,
  'Policy created successfully' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_codes'
  AND policyname LIKE 'school_isolation_%'
ORDER BY policyname;
