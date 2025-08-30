# Rule: Critical Auth Dual ID System

## 🚨 CRITICAL KNOWLEDGE - MANDATORY FOR ALL AUTH WORK

This rule addresses the **#1 cause of bugs** in FlexWise - the dual user ID system.

---

## The Problem

FlexWise uses **TWO DIFFERENT USER IDs** that are frequently confused:

### 1. Supabase Auth User ID
- **SQL:** `(auth.jwt()->>'sub')::uuid`
- **JavaScript:** Built into `supabase.auth.*` methods
- **Format:** `b61aa963-b65a-400f-a578-818825e0ebac`
- **Used for:** MFA factors, auth sessions, Supabase internal operations

### 2. FlexWise Profile ID  
- **SQL:** `auth.uid()`
- **JavaScript:** `supabase.auth.getUser().data.user.user_metadata.profile_id`
- **Format:** `ea147260-0e79-48b0-a24e-89b8cd1c4ccb`
- **Used for:** Application data, RLS policies, business logic

---

## When This Rule Applies

**ALWAYS apply when working with:**
- MFA/2FA implementations
- Authentication functions
- RLS policy creation  
- Auth-related debugging
- User identification queries
- Security implementations

---

## Correct Patterns

### ✅ MFA Functions
```sql
CREATE FUNCTION check_mfa_required() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = (auth.jwt()->>'sub')::uuid  -- CORRECT
    AND status = 'verified'
  );
END;
$$;
```

### ✅ RLS Policies
```sql
-- For auth schema tables:
CREATE POLICY "own_mfa_factors" ON auth.mfa_factors
USING (user_id = (auth.jwt()->>'sub')::uuid);

-- For application tables:
CREATE POLICY "own_profile" ON user_profiles  
USING (id = auth.uid());
```

### ✅ Mixed Queries
```sql
WITH user_context AS (
  SELECT 
    (auth.jwt()->>'sub')::uuid as auth_user_id,
    auth.uid() as profile_id
)
SELECT up.first_name, mf.factor_type
FROM user_context uc
JOIN user_profiles up ON up.id = uc.profile_id
LEFT JOIN auth.mfa_factors mf ON mf.user_id = uc.auth_user_id;
```

---

## Wrong Patterns (Will Break)

### ❌ Wrong ID Usage
```sql
-- DON'T use auth.uid() with auth schema:
SELECT * FROM auth.mfa_factors 
WHERE user_id = auth.uid(); -- BROKEN!

-- DON'T use JWT sub with app schema:
SELECT * FROM user_profiles 
WHERE id = (auth.jwt()->>'sub')::uuid; -- BROKEN!
```

### ❌ Direct Joins
```sql
-- DON'T directly join different ID systems:
SELECT * FROM user_profiles up
JOIN auth.mfa_factors mf ON mf.user_id = up.id; -- BROKEN!
```

---

## Implementation Checklist

When writing auth-related code:

**✅ Before coding:**
- [ ] Identify which schema: `auth.*` or `public.*`?
- [ ] Choose correct ID type based on schema
- [ ] Plan testing for both JavaScript and SQL contexts

**✅ During coding:**
- [ ] Use `(auth.jwt()->>'sub')::uuid` for auth schema
- [ ] Use `auth.uid()` for application schema  
- [ ] Test MFA flows in both contexts
- [ ] Verify policies actually block/allow correctly

**✅ After coding:**
- [ ] Test with real MFA users
- [ ] Verify JavaScript and SQL give same results
- [ ] Check debug logs for ID mismatches
- [ ] Document any custom ID handling

---

## Debug Commands

### Quick ID Check
```sql
SELECT 
  'Auth User ID' as type, (auth.jwt()->>'sub')::uuid as id,
  'Profile ID' as type, auth.uid() as id;
```

### MFA Factor Verification
```sql
SELECT COUNT(*) as mfa_factors_found
FROM auth.mfa_factors 
WHERE user_id = (auth.jwt()->>'sub')::uuid 
AND status = 'verified';
```

### Test Function Results
```sql
SELECT 
  public.check_mfa_required() as function_result,
  COALESCE(auth.jwt()->>'aal', 'none') as current_aal;
```

---

## Common Bug Symptoms

**🚨 These symptoms indicate dual ID bugs:**
- MFA policies allow access when they should block
- "User has 1 MFA factor" in JS but "has_mfa: false" in SQL
- Authentication works in browser but fails in database
- RLS policies return unexpected results
- MFA flows work partially but break in SQL context

---

## Emergency Fix Pattern

If MFA is broken due to dual ID issues:

```sql
-- 1. Check current function logic
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'check_mfa_required';

-- 2. Fix the function (replace AUTH_USER_ID usage)
CREATE OR REPLACE FUNCTION public.check_mfa_required()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = (auth.jwt()->>'sub')::uuid  -- KEY FIX
    AND status = 'verified'
  ) AND COALESCE(auth.jwt()->>'aal', 'none') != 'aal2';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Test immediately
SELECT public.check_mfa_required();
```

---

## Related Files

- **Fix Commands:** `docs/MFA_AUTH_ID_FIX.md` 
- **Full Architecture:** `docs/CRITICAL_AUTH_ARCHITECTURE.md`
- **MFA Implementation:** `docs/MFA_IMPLEMENTATION_SUMMARY.md`

---

**Remember: This is the #1 bug pattern in FlexWise. When in doubt about user IDs, always check which schema you're working with!**
