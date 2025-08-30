# MFA Authentication ID Fix - SQL Commands

## ��� Critical Issue: Dual User ID System

**Problem:** FlexWise uses two different user IDs:
- **Auth User ID** (`auth.jwt()->>'sub'`): Where MFA factors are stored
- **Profile ID** (`auth.uid()`): Where application data is stored

**Result:** MFA policies fail because they check the wrong user ID!

---

## 🔧 Step 1: Fix MFA Function Logic

Run this in **Supabase SQL Editor**:

```sql
-- Fix MFA Function to Use Correct Auth User ID
-- The issue: auth.uid() returns profile_id, but MFA factors are stored against JWT sub (auth user_id)

CREATE OR REPLACE FUNCTION public.check_mfa_required()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_aal text;
  auth_user_id text;
  user_has_mfa boolean;
BEGIN
  -- Get current AAL from JWT
  current_aal := COALESCE(auth.jwt()->>'aal', 'none');
  
  -- Get the REAL auth user ID from JWT sub (not auth.uid() which returns profile_id)
  auth_user_id := auth.jwt()->>'sub';
  
  -- Check if user has verified MFA factors using the correct auth user ID
  SELECT COUNT(*) > 0 INTO user_has_mfa
  FROM auth.mfa_factors
  WHERE auth_user_id::uuid = user_id AND status = 'verified';
  
  -- Debug logging
  RAISE LOG 'MFA Check Fixed: auth_user_id=%, profile_id=%, aal=%, has_mfa=%, result=%', 
    auth_user_id, auth.uid(), current_aal, user_has_mfa,
    CASE 
      WHEN NOT user_has_mfa THEN true  -- No MFA = allow
      WHEN current_aal = 'aal2' THEN true  -- Completed MFA = allow  
      ELSE false  -- Has MFA but not AAL2 = block
    END;
  
  -- Return logic:
  RETURN CASE 
    WHEN NOT user_has_mfa THEN true      -- No MFA setup = allow access
    WHEN current_aal = 'aal2' THEN true  -- Completed MFA = allow access
    ELSE false                           -- Has MFA but not completed = block access
  END;
END;
$$;
```

---

## 🧪 Step 2: Test the Fix

Run this to verify the fix works:

```sql
-- Test the FIXED MFA Function
SELECT 
  'Testing FIXED MFA Function' as test_type,
  auth.uid() as profile_id,
  auth.jwt()->>'sub' as auth_user_id,
  COALESCE(auth.jwt()->>'aal', 'none') as current_aal,
  EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE (auth.jwt()->>'sub')::uuid = user_id 
    AND status = 'verified'
  ) as has_mfa_correct_check,
  public.check_mfa_required() as function_result,
  CASE 
    WHEN NOT EXISTS(
      SELECT 1 FROM auth.mfa_factors 
      WHERE (auth.jwt()->>'sub')::uuid = user_id 
      AND status = 'verified'
    ) 
    THEN 'Should be TRUE (no MFA)'
    WHEN COALESCE(auth.jwt()->>'aal', 'none') = 'aal2' 
    THEN 'Should be TRUE (AAL2)'
    ELSE 'Should be FALSE (has MFA but not AAL2)'
  END as expected_result;
```

---

## 🔍 Step 3: Verify MFA Factors Found

Check that MFA factors are now detected:

```sql
-- Verify MFA factors are now found with correct user ID
SELECT 
  'MFA Factors Found' as info,
  user_id,
  status,
  factor_type,
  friendly_name
FROM auth.mfa_factors 
WHERE (SELECT auth.jwt()->>'sub')::uuid = user_id 
  AND status = 'verified';
```

---

## 🛡️ Step 4: Test Table Access Blocking

Verify that protected tables are now blocked:

```sql
-- Test if table access is now blocked
DO $$
BEGIN
  PERFORM COUNT(*) FROM public.user_profiles LIMIT 1;
  RAISE NOTICE '⚠️ user_profiles is still ACCESSIBLE - function may still need work';
EXCEPTION 
  WHEN others THEN
    RAISE NOTICE '✅ SUCCESS! user_profiles is now BLOCKED - MFA policies working! Error: %', SQLERRM;
END $$;
```

---

## 📊 Expected Results

After running the fix, you should see:

### Test Results:
```
has_mfa_correct_check: true     ← Should now be TRUE!
function_result: false          ← Should now be FALSE (blocking)!
expected_result: Should be FALSE (has MFA but not AAL2)
```

### MFA Policy Tester Results:
- 🔒 **46 tables BLOCKED** (all protected tables)
- ✅ **4 tables ALLOWED** (reference tables only)  
- 🎯 **Status: SECURE**

---

## ���� Debug Commands

If still having issues, run these debug commands:

### Check Auth Context:
```sql
-- Check current auth context
SELECT 
  'Auth User ID' as type, 
  (auth.jwt()->>'sub')::uuid as id,
  'Used for: MFA factors, sessions' as usage
UNION ALL
SELECT 
  'Profile ID' as type,
  auth.uid() as id, 
  'Used for: Application data, RLS' as usage;
```

### Verify MFA Factors:
```sql
-- Verify MFA factors are found
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ MFA factors found'
    ELSE '❌ No MFA factors found'
  END as status,
  COUNT(*) as factor_count
FROM auth.mfa_factors 
WHERE user_id = (auth.jwt()->>'sub')::uuid;
```

### Check Profile Access:
```sql
-- Test profile access
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Profile accessible'  
    ELSE '❌ Profile not accessible'
  END as status
FROM user_profiles 
WHERE id = auth.uid();
```

---

## 📝 Notes

- **This fixes the core issue** where MFA policies weren't working
- **All 45 MFA-protected tables** should now properly block access in AAL1 state
- **Your comprehensive security implementation** covering 42% of the database will finally work
- **Always use `auth.jwt()->>'sub'`** for auth schema queries
- **Always use `auth.uid()`** for application schema queries

---

## 🔗 Related Documentation

- [Critical Auth Architecture](./CRITICAL_AUTH_ARCHITECTURE.md)
- [MFA Implementation Summary](./MFA_IMPLEMENTATION_SUMMARY.md)
- [Comprehensive MFA Coverage](./COMPREHENSIVE_MFA_COVERAGE.md)
