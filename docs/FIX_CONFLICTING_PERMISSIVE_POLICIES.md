# Fix Conflicting Permissive Policies

## Root Cause Identified

Your debugging shows:
- ✅ 47 RESTRICTIVE MFA policies exist and work correctly
- ✅ `check_mfa_required()` returns `false` as expected
- ❌ **PERMISSIVE policies override RESTRICTIVE ones**

## The Problem

PostgreSQL RLS logic:
- If **ANY** permissive policy allows access → user gets access
- RESTRICTIVE policies add constraints but **cannot override** permissive grants

Your conflicting permissive policies:
- `school_isolation_contacts_*` (ALL commands)
- `school_isolation_families_*` (ALL commands) 
- `user_profiles_school_isolation` (ALL commands)

These grant broad access, making MFA restrictions ineffective.

## Solution: Update Permissive Policies to Include MFA

### AS SUPERUSER - Run these commands:

```sql
-- Fix user_profiles permissive policy
DROP POLICY IF EXISTS "user_profiles_school_isolation" ON public.user_profiles;
CREATE POLICY "user_profiles_school_isolation"
ON public.user_profiles
FOR ALL
TO authenticated
USING (
  -- Original school isolation logic AND MFA check
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL) 
  AND public.check_mfa_required()
);

-- Fix contacts permissive policies
DROP POLICY IF EXISTS "school_isolation_contacts_select" ON public.contacts;
CREATE POLICY "school_isolation_contacts_select"
ON public.contacts
FOR ALL
TO authenticated
USING (
  -- Original school isolation logic AND MFA check
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND public.check_mfa_required()
);

DROP POLICY IF EXISTS "school_isolation_contacts_insert" ON public.contacts;
CREATE POLICY "school_isolation_contacts_insert"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND public.check_mfa_required()
);

DROP POLICY IF EXISTS "school_isolation_contacts_update" ON public.contacts;
CREATE POLICY "school_isolation_contacts_update"
ON public.contacts
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND public.check_mfa_required()
);

DROP POLICY IF EXISTS "school_isolation_contacts_delete" ON public.contacts;
CREATE POLICY "school_isolation_contacts_delete"
ON public.contacts
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND public.check_mfa_required()
);

-- Fix families permissive policies  
DROP POLICY IF EXISTS "school_isolation_families_select" ON public.families;
CREATE POLICY "school_isolation_families_select"
ON public.families
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND public.check_mfa_required()
);

DROP POLICY IF EXISTS "school_isolation_families_insert" ON public.families;
CREATE POLICY "school_isolation_families_insert"
ON public.families
FOR INSERT
TO authenticated
WITH CHECK (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND public.check_mfa_required()
);

DROP POLICY IF EXISTS "school_isolation_families_update" ON public.families;
CREATE POLICY "school_isolation_families_update"
ON public.families
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND public.check_mfa_required()
);

DROP POLICY IF EXISTS "school_isolation_families_delete" ON public.families;
CREATE POLICY "school_isolation_families_delete"
ON public.families
FOR ALL
TO authenticated
USING (
  (school_id = (auth.jwt()->>'profile_id')::uuid OR school_id IS NULL)
  AND public.check_mfa_required()
);

-- Verify the fix
SELECT 
  'Fixed Policies Check' as test,
  tablename,
  policyname,
  permissive,
  cmd,
  'Should now include MFA check' as note
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'contacts', 'families')
  AND permissive = 'PERMISSIVE'
ORDER BY tablename, policyname;
```

## Alternative: Simplified Policy Expression Query

```sql
-- Simpler policy check without pg_get_expr
SELECT 
  'user_profiles policies' as table_name,
  policyname,
  permissive,
  cmd,
  'Policy exists - check manually if it includes check_mfa_required()' as note
FROM pg_policies p
WHERE schemaname = 'public' AND tablename = 'user_profiles';
```

## Expected Result

After running these fixes:
- PERMISSIVE policies will require MFA (AAL2) 
- Your policy tester should show tables properly blocked
- Security status should change from "VULNERABLE" to "SECURE"

## Why This Approach

Instead of removing permissive policies (which could break school isolation), we're enhancing them to also require MFA. This preserves existing functionality while adding security.
