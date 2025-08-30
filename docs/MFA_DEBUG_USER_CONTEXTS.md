# MFA Debug - User Context Instructions

## 🚨 CRITICAL: Know Your Execution Context

**The #1 reason MFA debugging fails:** Running the wrong commands in the wrong user context!

---

## 👥 Two Different Contexts

### 🔑 **SUPERUSER/ADMIN Context**
- **When:** Supabase SQL Editor (default)
- **User:** `postgres` or `supabase_admin` 
- **Can do:** See all data, modify policies, grant permissions
- **Cannot do:** Test user MFA experience, trigger user RLS policies
- **MFA factors:** Will show 0 (admin has no MFA)

### 👤 **MFA USER Context** 
- **When:** Logged in as regular user with MFA
- **User:** `authenticated` role (your test user)
- **Can do:** Test MFA policies, see user data through RLS
- **Cannot do:** Modify system policies, see other users' data
- **MFA factors:** Will show actual user's MFA factors

---

## 📋 Command Execution Guide

### 🔑 **RUN AS SUPERUSER** (Supabase SQL Editor)

**System inspection and fixes:**

```sql
-- 1. Check RLS status on auth.mfa_factors
SELECT 
  'RLS Status' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'mfa_factors';

-- 2. Check existing RLS policies 
SELECT 
  'MFA RLS Policies' as info,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'mfa_factors';

-- 3. Grant permissions (if needed)
GRANT SELECT ON auth.mfa_factors TO authenticated;

-- 4. Check all MFA factors in system (bypass RLS)
SET row_security = off;
SELECT 
  'All MFA Factors (Admin View)' as info,
  user_id,
  status,
  factor_type,
  created_at
FROM auth.mfa_factors 
WHERE status = 'verified'
ORDER BY created_at DESC;
SET row_security = on;

-- 5. Update/create MFA functions
CREATE OR REPLACE FUNCTION public.check_mfa_required()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- [function body here]
$$;
```

### 👤 **RUN AS MFA USER** (After Login)

**User experience testing:**

```sql
-- 1. Check your own auth context
SELECT 
  'My Auth Context' as info,
  auth.uid() as my_profile_id,
  auth.jwt()->>'sub' as my_auth_user_id,
  auth.jwt()->>'email' as my_email,
  auth.jwt()->>'aal' as my_aal_level;

-- 2. Check YOUR MFA factors
SELECT 
  'My MFA Factors' as info,
  user_id,
  status,
  factor_type,
  friendly_name
FROM auth.mfa_factors 
WHERE user_id = (auth.jwt()->>'sub')::uuid 
  AND status = 'verified';

-- 3. Test MFA function as user
SELECT 
  'MFA Function Test (User Context)' as test,
  public.check_mfa_required() as result,
  CASE 
    WHEN public.check_mfa_required() = true THEN '✅ ALLOWS access' 
    ELSE '🔒 BLOCKS access'
  END as interpretation;

-- 4. Test table access
SELECT 
  'Table Access Test' as test,
  COUNT(*) as accessible_records
FROM user_profiles 
LIMIT 1;
```

---

## 🔄 How to Switch Contexts

### **Method 1: Browser-Based (Recommended)**

1. **For Superuser Commands:**
   - Go to Supabase Dashboard → SQL Editor
   - Run admin/system commands

2. **For User Commands:**
   - Log into your app: `6d44bb86cd6d4eeb97119a78553077f7-ea15abd7-f3d1-4b75-ab9d-5b7ec3.fly.dev`
   - Use debug tools OR browser console:
   ```javascript
   // In browser console after login
   const { data, error } = await supabase.rpc('check_mfa_required');
   console.log('MFA function result:', data);
   ```

### **Method 2: SQL Editor with Impersonation**

```sql
-- In Supabase SQL Editor, impersonate user (if supported)
SET request.jwt.claims TO '{"sub": "b61aa963-b65a-400f-a578-818825e0ebac", "aal": "aal1", "email": "info@opendoorstuition.de"}';

-- Run user context commands here
SELECT public.check_mfa_required();

-- Reset
RESET request.jwt.claims;
```

---

## 🧪 Step-by-Step Debug Process

### **Step 1: SUPERUSER - System Check**

Run in **Supabase SQL Editor**:

```sql
-- Check if MFA factors exist at all
SET row_security = off;
SELECT 
  COUNT(*) as total_factors,
  COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_factors
FROM auth.mfa_factors;
SET row_security = on;

-- Expected: Should see at least 1 verified factor
```

### **Step 2: SUPERUSER - Fix Permissions** 

If Step 1 shows factors exist but user can't see them:

```sql
-- Grant access to authenticated users
GRANT SELECT ON auth.mfa_factors TO authenticated;

-- Check current permissions
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'mfa_factors' 
  AND table_schema = 'auth';
```

### **Step 3: USER - Test Access**

**Login to your app first**, then run:

```sql
-- Check if you can see your MFA factors
SELECT COUNT(*) as my_factors
FROM auth.mfa_factors 
WHERE user_id = (auth.jwt()->>'sub')::uuid;

-- Expected: Should match JavaScript count (1 factor)
```

### **Step 4: USER - Test MFA Function**

Still in user context:

```sql
-- Test the MFA function
SELECT 
  public.check_mfa_required() as blocks_access,
  auth.jwt()->>'aal' as current_aal;

-- Expected: blocks_access = false (blocks), current_aal = 'aal1'
```

### **Step 5: USER - Test Table Blocking**

```sql
-- This should be BLOCKED if MFA policies work
SELECT COUNT(*) FROM user_profiles LIMIT 1;

-- Expected: Error message about access denied
```

---

## 📊 Expected Results by Context

### **Superuser Context Results:**
```
Total MFA Factors: 1+ (system-wide view)
Permissions: Shows grants to 'authenticated' 
RLS Status: Enabled on auth.mfa_factors
Function Access: Can create/modify functions
```

### **User Context Results:**
```
My MFA Factors: 1 (your factors only)
MFA Function: false (blocks access)
Current AAL: 'aal1' 
Table Access: BLOCKED with error
```

---

## 🚨 Common Mistakes

### **❌ Wrong Context Errors:**

1. **Running user tests as superuser:**
   ```sql
   -- DON'T do this as superuser
   SELECT auth.uid(); -- Returns NULL for superuser!
   ```

2. **Running admin commands as user:**
   ```sql
   -- User can't do this
   GRANT SELECT ON auth.mfa_factors TO authenticated; -- Permission denied
   ```

3. **Misinterpreting results:**
   - Superuser seeing 0 factors ≠ no factors exist
   - User seeing 0 factors = permission problem

---

## ⚡ Quick Context Check

**Before running any command, verify your context:**

```sql
-- What context am I in?
SELECT 
  current_user as db_user,
  auth.uid() as profile_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '🔑 SUPERUSER CONTEXT'
    ELSE '👤 USER CONTEXT' 
  END as context_type;
```

---

## 🎯 Action Plan for Your Current Issue

1. **SUPERUSER:** Check if MFA factors exist in system
2. **SUPERUSER:** Grant permissions if needed  
3. **USER:** Login to app and test MFA detection
4. **USER:** Verify MFA function blocks access
5. **USER:** Test MFA Policy Tester shows SECURE status

**Run Step 1 as superuser first, then we'll know the real issue!**
