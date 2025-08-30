# Deep MFA Debug - RLS and Permissions Issues

## 🚨 Problem: SQL vs JavaScript MFA Factor Mismatch

**JavaScript:** Finds 1 MFA factor ✅  
**SQL:** Finds 0 MFA factors ❌

This indicates an RLS policy or permissions issue on `auth.mfa_factors`.

---

## 🔍 Step 1: Check auth.mfa_factors Permissions

Run this in **Supabase SQL Editor**:

```sql
-- Check if we can see ANY MFA factors at all
SELECT 
  'Total MFA Factors' as info,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count
FROM auth.mfa_factors;

-- Check if RLS is enabled on auth.mfa_factors
SELECT 
  'RLS Status on auth.mfa_factors' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'mfa_factors';

-- Check RLS policies on auth.mfa_factors
SELECT 
  'MFA Factors RLS Policies' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'mfa_factors';
```

---

## 🔍 Step 2: Check Direct Access to auth Schema

```sql
-- Test if we can access auth schema at all
SELECT 
  'Auth Schema Access Test' as test,
  current_user as current_db_user,
  session_user as session_db_user,
  CASE 
    WHEN has_schema_privilege('auth', 'USAGE') THEN '✅ Can access auth schema'
    ELSE '❌ Cannot access auth schema'
  END as auth_schema_access;

-- Check table permissions on auth.mfa_factors
SELECT 
  'Table Permissions' as info,
  CASE 
    WHEN has_table_privilege('auth.mfa_factors', 'SELECT') THEN '✅ Can SELECT'
    ELSE '❌ Cannot SELECT'
  END as select_permission,
  CASE 
    WHEN has_table_privilege('auth.mfa_factors', 'INSERT') THEN '✅ Can INSERT'
    ELSE '❌ Cannot INSERT'
  END as insert_permission;
```

---

## 🔍 Step 3: Bypass RLS Test (If Needed)

```sql
-- Test bypassing RLS temporarily (if you have permission)
SET row_security = off;

SELECT 
  'MFA Factors (RLS Bypassed)' as info,
  user_id,
  status,
  factor_type,
  created_at
FROM auth.mfa_factors 
WHERE status = 'verified'
ORDER BY created_at DESC;

-- Reset RLS
SET row_security = on;
```

---

## 🔍 Step 4: Check Auth Context in SQL

```sql
-- Verify JWT and auth context
SELECT 
  'Auth Context Check' as info,
  auth.jwt() IS NOT NULL as has_jwt,
  auth.uid() IS NOT NULL as has_uid,
  auth.role() as current_role,
  (auth.jwt()->>'sub') as jwt_sub,
  (auth.jwt()->>'email') as jwt_email,
  (auth.jwt()->>'aal') as jwt_aal;
```

---

## 🔍 Step 5: Alternative MFA Check Method

```sql
-- Try alternative approach using auth.users table
SELECT 
  'Alternative MFA Check' as info,
  au.id as auth_user_id,
  au.email,
  (au.user_metadata->>'profile_id') as profile_id,
  au.phone_confirmed_at IS NOT NULL as has_phone,
  au.email_confirmed_at IS NOT NULL as has_email
FROM auth.users au
WHERE au.email = 'info@opendoorstuition.de';

-- Check if user has phone-based MFA
SELECT 
  'Phone MFA Check' as info,
  phone,
  phone_confirmed_at,
  CASE 
    WHEN phone_confirmed_at IS NOT NULL THEN '✅ Phone verified'
    ELSE '❌ Phone not verified'
  END as phone_status
FROM auth.users 
WHERE email = 'info@opendoorstuition.de';
```

---

## 🔍 Step 6: Grant Explicit Permissions (If Needed)

If the issue is permissions, run this:

```sql
-- Grant SELECT permission on auth.mfa_factors to authenticated users
GRANT SELECT ON auth.mfa_factors TO authenticated;

-- Test again after granting permission
SELECT 
  'MFA Factors After Grant' as info,
  user_id,
  status,
  factor_type
FROM auth.mfa_factors 
WHERE user_id = (auth.jwt()->>'sub')::uuid 
  AND status = 'verified';
```

---

## 🔍 Step 7: Test the MFA Function Again

After resolving permissions:

```sql
-- Test the MFA function with corrected permissions
SELECT 
  'Final MFA Function Test' as test,
  public.check_mfa_required() as function_result,
  COALESCE(auth.jwt()->>'aal', 'none') as current_aal,
  EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = (auth.jwt()->>'sub')::uuid 
    AND status = 'verified'
  ) as direct_mfa_check;
```

---

## 🔍 Step 8: Verify Table Blocking

Test if tables are now properly blocked:

```sql
-- Test critical table access
DO $$
BEGIN
  PERFORM COUNT(*) FROM public.user_profiles LIMIT 1;
  RAISE NOTICE '⚠️ user_profiles ACCESSIBLE - MFA policies still not working';
EXCEPTION 
  WHEN others THEN
    RAISE NOTICE '✅ user_profiles BLOCKED - MFA policies working! Error: %', SQLERRM;
END $$;

-- Test another protected table
DO $$
BEGIN
  PERFORM COUNT(*) FROM public.contacts LIMIT 1;
  RAISE NOTICE '⚠️ contacts ACCESSIBLE - MFA policies still not working';
EXCEPTION 
  WHEN others THEN
    RAISE NOTICE '✅ contacts BLOCKED - MFA policies working! Error: %', SQLERRM;
END $$;
```

---

## 📋 Expected Results

### If Permissions Issue:
```
Total MFA Factors: 0 (due to RLS/permissions)
Auth Schema Access: ❌ Cannot access auth schema
```

### If RLS Issue:
```
RLS Status: rls_enabled = true
MFA Factors RLS Policies: (shows blocking policies)
```

### After Fix:
```
MFA Factors After Grant: Shows your factor
Function Result: false (blocking access)
Tables: BLOCKED with errors
```

---

## 🚀 Quick Fix Summary

Most likely fixes:

1. **Grant Permission:**
   ```sql
   GRANT SELECT ON auth.mfa_factors TO authenticated;
   ```

2. **Check RLS on auth.mfa_factors:**
   - If there are restrictive RLS policies, they might be blocking access
   - Supabase should allow authenticated users to see their own factors

3. **Verify auth context:**
   - Ensure JWT is properly passed to SQL queries
   - Check that auth.uid() and auth.jwt() work correctly

Run these debug commands to identify the exact issue!
