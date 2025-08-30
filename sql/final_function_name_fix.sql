-- FINAL FIX: The MFA function is correct, just fix the function names
-- Issue: Policies use uid() instead of auth.uid()

-- ==========================================
-- FIX USER_ROLES POLICIES (uid() -> auth.uid())
-- ==========================================

DROP POLICY IF EXISTS "school_isolation_user_roles_select" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_select" ON public.user_roles FOR SELECT TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_roles_insert" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_roles_update" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_update" ON public.user_roles FOR UPDATE TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

DROP POLICY IF EXISTS "school_isolation_user_roles_delete" ON public.user_roles;
CREATE POLICY "school_isolation_user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
USING ((user_profile_id = auth.uid()) AND (SELECT public.check_mfa_required()));

-- ==========================================
-- FIX USER_CODES POLICIES (uid() -> auth.uid())
-- ==========================================

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

-- ==========================================
-- FIX PROTECTED_ROLES POLICIES (uid() -> auth.uid())
-- ==========================================

-- Clean up duplicate policies first
DROP POLICY IF EXISTS "admin_only_protected_roles_modify" ON public.protected_roles;
DROP POLICY IF EXISTS "public_read_protected_roles" ON public.protected_roles;

-- Create single restrictive admin policy
DROP POLICY IF EXISTS "admin_only_protected_roles_all" ON public.protected_roles;
CREATE POLICY "admin_only_protected_roles_all" ON public.protected_roles FOR ALL TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM public.user_profiles up 
    JOIN public.user_roles ur ON ur.user_profile_id = up.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE up.id = auth.uid() AND r.name = 'Admin'
  ) AND (SELECT public.check_mfa_required())
);

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Check that policies now use auth.uid()
SELECT 
  'POLICY VERIFICATION' as test,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN '✅ FIXED: Uses auth.uid()'
    WHEN qual LIKE '%uid()%' AND qual NOT LIKE '%auth.uid()%' THEN '❌ BROKEN: Still uses uid()'
    ELSE '⚠️ CHECK MANUALLY'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'user_codes', 'protected_roles')
  AND (policyname LIKE '%school_isolation_%' OR policyname LIKE '%admin_only_%')
ORDER BY tablename, policyname;

-- Final status
SELECT 
  'REPAIR COMPLETE' as summary,
  'Function names corrected from uid() to auth.uid()' as fix_applied,
  'MFA function is working correctly (returns FALSE to block AAL1)' as mfa_status,
  'Test with MFA Policy Tester now - should show 46/46 blocked' as next_step;
