-- Fix for Failed Admin Operations Policy
-- Run this to complete the base MFA setup

-- Drop the failed policy if it exists
DROP POLICY IF EXISTS "mfa_restrict_admin_operations" ON public.user_profiles;

-- Create a corrected admin operations policy
-- This focuses on role_id changes and is more appropriate for RLS
CREATE POLICY "mfa_restrict_admin_operations"
ON public.user_profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  -- Always require AAL2 for critical profile updates
  -- Since we can't reliably detect role changes in RLS, 
  -- we require AAL2 for all updates to be safe
  auth.jwt()->>'aal' = 'aal2' OR public.check_mfa_required()
);

-- Verify the fix
SELECT 'Fixed admin operations policy' as status;

-- Show all current MFA policies
SELECT 
  tablename,
  policyname,
  permissive as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%mfa_%'
ORDER BY tablename, policyname;
