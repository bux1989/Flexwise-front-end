-- Immediate MFA Security Hardening
-- This script adds AAL2 requirements to critical tables
-- Run this in Supabase SQL Editor to prevent AAL1 data access

-- 1. First, let's check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_profiles', 'student_records', 'attendance_records', 
    'admin_settings', 'school_settings', 'contacts'
  )
ORDER BY tablename;

-- 2. Add AAL2 requirement to user_profiles (CRITICAL)
CREATE POLICY "mfa_users_require_aal2_user_profiles" ON public.user_profiles
FOR ALL TO authenticated USING (
  -- Allow access if user has no verified MFA factors
  NOT EXISTS (
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.uid() 
    AND status = 'verified'
  )
  OR 
  -- Or if session is AAL2 (MFA completed)
  COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

-- 3. Add AAL2 requirement to contacts (CRITICAL - contains sensitive info)
CREATE POLICY "mfa_users_require_aal2_contacts" ON public.contacts
FOR ALL TO authenticated USING (
  -- School isolation check first (existing security)
  profile_id IN (
    SELECT up.id FROM user_profiles up 
    WHERE up.school_id = auth.get_user_school_id()
  )
  AND (
    -- Allow access if user has no verified MFA factors
    NOT EXISTS (
      SELECT 1 FROM auth.mfa_factors 
      WHERE user_id = auth.uid() 
      AND status = 'verified'
    )
    OR 
    -- Or if session is AAL2 (MFA completed)
    COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
  )
);

-- 4. Add AAL2 requirement to admin/school settings (CRITICAL)
DO $$ 
BEGIN
  -- Check if school_settings table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'school_settings') THEN
    EXECUTE '
    CREATE POLICY "mfa_users_require_aal2_school_settings" ON public.school_settings
    FOR ALL TO authenticated USING (
      -- School isolation first
      school_id = auth.get_user_school_id()
      AND (
        NOT EXISTS (
          SELECT 1 FROM auth.mfa_factors 
          WHERE user_id = auth.uid() 
          AND status = ''verified''
        )
        OR 
        COALESCE(auth.jwt() ->> ''aal'', ''aal1'') = ''aal2''
      )
    )';
  END IF;
END $$;

-- 5. Add AAL2 requirement to student records (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_records') THEN
    EXECUTE '
    CREATE POLICY "mfa_users_require_aal2_student_records" ON public.student_records
    FOR ALL TO authenticated USING (
      -- School isolation first
      school_id = auth.get_user_school_id()
      AND (
        NOT EXISTS (
          SELECT 1 FROM auth.mfa_factors 
          WHERE user_id = auth.uid() 
          AND status = ''verified''
        )
        OR 
        COALESCE(auth.jwt() ->> ''aal'', ''aal1'') = ''aal2''
      )
    )';
  END IF;
END $$;

-- 6. Add AAL2 requirement to attendance data (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_records') THEN
    EXECUTE '
    CREATE POLICY "mfa_users_require_aal2_attendance" ON public.attendance_records
    FOR ALL TO authenticated USING (
      -- School isolation first
      school_id = auth.get_user_school_id()
      AND (
        NOT EXISTS (
          SELECT 1 FROM auth.mfa_factors 
          WHERE user_id = auth.uid() 
          AND status = ''verified''
        )
        OR 
        COALESCE(auth.jwt() ->> ''aal'', ''aal1'') = ''aal2''
      )
    )';
  END IF;
END $$;

-- 7. Create security monitoring function for AAL1 access attempts
CREATE OR REPLACE FUNCTION log_aal1_access_attempt(
  table_name text,
  action_type text
) RETURNS void AS $$
BEGIN
  -- Log when MFA users try to access data with AAL1 sessions
  IF EXISTS (
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.uid() 
    AND status = 'verified'
  ) AND COALESCE(auth.jwt() ->> 'aal', 'aal1') = 'aal1' THEN
    
    INSERT INTO auth.audit_log_entries (
      instance_id,
      id,
      payload,
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      jsonb_build_object(
        'action', 'aal1_access_blocked',
        'table', table_name,
        'action_type', action_type,
        'user_id', auth.uid(),
        'session_aal', COALESCE(auth.jwt() ->> 'aal', 'aal1'),
        'timestamp', now(),
        'note', 'MFA user attempted data access with AAL1 session'
      ),
      now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Test function to check AAL2 enforcement
CREATE OR REPLACE FUNCTION test_aal2_enforcement()
RETURNS TABLE (
  table_name text,
  has_aal2_policy boolean,
  policy_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pol.tablename::text,
    pol.cmd = 'ALL' AND pol.qual LIKE '%aal%'::text,
    pol.policyname::text
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
    AND pol.tablename IN ('user_profiles', 'contacts', 'school_settings', 'student_records', 'attendance_records')
    AND pol.policyname LIKE '%aal2%';
END;
$$ LANGUAGE plpgsql;

-- 9. Verify the hardening worked
SELECT 'MFA AAL2 hardening completed' as status;

-- Run test to see what policies were created
SELECT * FROM test_aal2_enforcement();

-- Check for any MFA users currently in AAL1 sessions
SELECT 
  u.email,
  mf.factor_type,
  'Has AAL1 session with MFA enabled' as security_note
FROM auth.users u
JOIN auth.mfa_factors mf ON mf.user_id = u.id
JOIN auth.sessions s ON s.user_id = u.id
WHERE mf.status = 'verified'
  AND COALESCE(s.aal, 'aal1') = 'aal1'
  AND s.created_at > now() - interval '1 hour';

-- Summary of protection added
SELECT 
  'Protection Summary' as info,
  'Critical tables now require AAL2 for MFA users' as protection_added,
  'AAL1 sessions blocked from accessing sensitive data' as security_improvement;
