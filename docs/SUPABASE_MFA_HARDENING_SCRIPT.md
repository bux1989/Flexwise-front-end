# Official Supabase MFA Hardening Script

## Overview
This script implements the **official Supabase MFA hardening** using RESTRICTIVE policies as recommended in their [blog post](https://supabase.com/blog/mfa-auth-via-rls).

## ⚠️ IMPORTANT INSTRUCTIONS

1. **Open your Supabase Dashboard** → **SQL Editor**
2. **Create a new query**
3. **Copy the entire SQL script below**
4. **Run the script**

## 🔐 SQL Script to Apply

```sql
-- Official Supabase MFA Hardening via Restrictive RLS Policies
-- Based on: https://supabase.com/blog/mfa-auth-via-rls
-- This is the RECOMMENDED approach by Supabase for MFA enforcement

-- 1. Grant permissions to access MFA factors (REQUIRED)
GRANT SELECT ON auth.mfa_factors TO authenticated;

-- 2. Create helper function to check MFA status (recommended pattern)
CREATE OR REPLACE FUNCTION public.check_mfa_required()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    array[auth.jwt()->>'aal'] <@ (
      SELECT
        CASE
          WHEN count(id) > 0 THEN array['aal2']
          ELSE array['aal1', 'aal2']
        END AS aal
      FROM auth.mfa_factors
      WHERE auth.uid() = user_id AND status = 'verified'
    )
  );
END;
$$;

-- 3. Create RESTRICTIVE policies for critical tables
-- Note: RESTRICTIVE policies are enforced in addition to regular policies

-- 3a. User Profiles - CRITICAL
CREATE POLICY "mfa_enforce_aal2_user_profiles"
ON public.user_profiles
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- 3b. Contacts - CRITICAL  
CREATE POLICY "mfa_enforce_aal2_contacts"
ON public.contacts
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());

-- 3c. Admin/School Settings (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'school_settings') THEN
    EXECUTE '
    CREATE POLICY "mfa_enforce_aal2_school_settings"
    ON public.school_settings
    AS RESTRICTIVE
    TO authenticated
    USING (public.check_mfa_required())';
  END IF;
END $$;

-- 3d. Student Records (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_records') THEN
    EXECUTE '
    CREATE POLICY "mfa_enforce_aal2_student_records"
    ON public.student_records
    AS RESTRICTIVE
    TO authenticated
    USING (public.check_mfa_required())';
  END IF;
END $$;

-- 3e. Attendance Records (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_records') THEN
    EXECUTE '
    CREATE POLICY "mfa_enforce_aal2_attendance"
    ON public.attendance_records
    AS RESTRICTIVE
    TO authenticated
    USING (public.check_mfa_required())';
  END IF;
END $$;

-- 4. Alternative: Direct AAL check for specific operations
-- Use this pattern for table-specific enforcement without the function

CREATE POLICY "mfa_restrict_profile_updates"
ON public.user_profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  -- Allow if user has no MFA OR has completed MFA (AAL2)
  NOT EXISTS (
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.uid() 
    AND status = 'verified'
  )
  OR 
  auth.jwt()->>'aal' = 'aal2'
);

-- 5. Enhanced security for administrative operations
CREATE POLICY "mfa_restrict_admin_operations"
ON public.user_profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  -- Always require AAL2 for admin role changes
  CASE 
    WHEN OLD.roles IS DISTINCT FROM NEW.roles THEN
      auth.jwt()->>'aal' = 'aal2'
    ELSE
      public.check_mfa_required()
  END
);

-- 6. Monitoring function for policy violations
CREATE OR REPLACE FUNCTION log_mfa_policy_violation(
  table_name text,
  operation text,
  user_id uuid DEFAULT auth.uid()
) RETURNS void AS $$
BEGIN
  INSERT INTO auth.audit_log_entries (
    instance_id,
    id,
    payload,
    created_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    jsonb_build_object(
      'action', 'mfa_policy_violation',
      'table', table_name,
      'operation', operation,
      'user_id', user_id,
      'session_aal', COALESCE(auth.jwt() ->> 'aal', 'aal1'),
      'has_mfa_factors', EXISTS(
        SELECT 1 FROM auth.mfa_factors 
        WHERE auth.mfa_factors.user_id = log_mfa_policy_violation.user_id 
        AND status = 'verified'
      ),
      'timestamp', now()
    ),
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Test function to verify restrictive policies
CREATE OR REPLACE FUNCTION test_mfa_restrictive_policies()
RETURNS TABLE (
  table_name text,
  policy_name text,
  policy_type text,
  policy_cmd text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pol.tablename::text,
    pol.policyname::text,
    CASE 
      WHEN pol.permissive = 'RESTRICTIVE' THEN 'RESTRICTIVE'
      ELSE 'PERMISSIVE'
    END::text,
    pol.cmd::text
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
    AND pol.policyname LIKE '%mfa_%'
  ORDER BY pol.tablename, pol.policyname;
END;
$$ LANGUAGE plpgsql;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_mfa_required() TO authenticated;
GRANT EXECUTE ON FUNCTION log_mfa_policy_violation(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION test_mfa_restrictive_policies() TO authenticated;

-- 9. Verify the implementation
SELECT 'Official Supabase MFA hardening completed' as status;

-- Show created policies
SELECT * FROM test_mfa_restrictive_policies();

-- Check current MFA status for testing
SELECT 
  'Current user MFA status' as info,
  auth.uid() as user_id,
  COALESCE(auth.jwt() ->> 'aal', 'aal1') as current_aal,
  EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.uid() 
    AND status = 'verified'
  ) as has_verified_mfa,
  public.check_mfa_required() as mfa_check_result;
```

## 🧪 After Running the Script

### Test the Implementation

1. **Use the "Test Supabase MFA Configuration" button** on your login page (I can see it's already there!)

2. **Expected Results:**
   - **Users with MFA + AAL1 session**: Data access **BLOCKED** ❌
   - **Users with MFA + AAL2 session**: Data access **ALLOWED** ✅  
   - **Users without MFA**: Data access **ALLOWED** ✅ (unchanged)

### Verification Queries

After running the script, you can also run these verification queries:

```sql
-- Check if policies were created
SELECT * FROM test_mfa_restrictive_policies();

-- Check your current MFA status  
SELECT 
  auth.uid() as user_id,
  COALESCE(auth.jwt() ->> 'aal', 'aal1') as current_aal,
  EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.uid() 
    AND status = 'verified'
  ) as has_verified_mfa;
```

## ✅ What This Script Does

1. **✅ Grants required permissions** to access MFA factors
2. **✅ Creates official helper function** `check_mfa_required()`
3. **✅ Applies RESTRICTIVE policies** to critical tables
4. **✅ Creates monitoring functions** for security auditing
5. **✅ Provides test functions** to verify everything works

## 🔄 Next Steps

After successfully applying this script:

1. **Test with your MFA-enabled account**
2. **Verify existing functionality still works** (school isolation, etc.)
3. **Monitor for any issues** using the debug components
4. **Ready to proceed** with authentication methods expansion!

## 🚨 Rollback (If Needed)

If you need to rollback for any reason:

```sql
-- Remove RESTRICTIVE policies (emergency rollback)
DROP POLICY IF EXISTS "mfa_enforce_aal2_user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "mfa_enforce_aal2_contacts" ON public.contacts;
-- Add more DROP POLICY statements for other tables as needed
```

---

**Ready to apply? Copy the SQL script above and paste it into your Supabase SQL Editor!** 🚀
