# 🚨 CRITICAL: FlexWise Auth Architecture - Dual User ID System

## ⚠️ MANDATORY READING FOR ALL DEVELOPERS

**This document explains the MOST IMPORTANT architectural pattern in FlexWise that causes frequent bugs if misunderstood.**

---

## 🎯 The Core Problem

FlexWise uses a **DUAL USER ID SYSTEM** that creates confusion and bugs:

### 1. **Supabase Auth User ID** (Primary Key)
- **Where:** `auth.users.id`, `auth.jwt()->>'sub'`
- **Format:** `b61aa963-b65a-400f-a578-818825e0ebac`
- **Purpose:** Supabase's internal user identifier
- **Used for:** MFA factors, sessions, auth tokens, Supabase auth operations

### 2. **FlexWise Profile ID** (Application Key)  
- **Where:** `user_profiles.id`, `auth.users.user_metadata.profile_id`, `auth.uid()`
- **Format:** `ea147260-0e79-48b0-a24e-89b8cd1c4ccb`
- **Purpose:** FlexWise application-level user identifier
- **Used for:** All application data, RLS policies, business logic

---

## 🔥 Why This Causes Problems

### **The Mismatch:**
```javascript
// JavaScript (Correct)
const { data: factors } = await supabase.auth.mfa.listFactors()
// ✅ Uses auth user ID: b61aa963-b65a-400f-a578-818825e0ebac

// SQL RLS (Wrong!)  
SELECT * FROM auth.mfa_factors WHERE user_id = auth.uid()
// ❌ Uses profile ID: ea147260-0e79-48b0-a24e-89b8cd1c4ccb
// 🚨 RESULT: No MFA factors found, security policies fail!
```

### **Common Failures:**
- ❌ MFA policies don't work (all tables accessible)
- ❌ Authentication flows break
- ❌ Security checks fail silently  
- ❌ User data access errors
- ❌ RLS policies return wrong results

---

## ✅ CORRECT Patterns

### **1. JavaScript MFA Operations**
```javascript
// ✅ CORRECT - Use Supabase auth methods (handles auth user ID automatically)
const { data: factors } = await supabase.auth.mfa.listFactors()
const { data: session } = await supabase.auth.getSession()
const currentUser = supabase.auth.getUser()

// ❌ WRONG - Don't query auth.mfa_factors directly from client
```

### **2. SQL MFA Queries**  
```sql
-- ✅ CORRECT - Use JWT sub for auth operations
SELECT COUNT(*) FROM auth.mfa_factors 
WHERE user_id = (auth.jwt()->>'sub')::uuid 
AND status = 'verified';

-- ❌ WRONG - Don't use auth.uid() for auth schema queries
SELECT COUNT(*) FROM auth.mfa_factors 
WHERE user_id = auth.uid();  -- This is profile_id, not auth user_id!
```

### **3. RLS Policies for Auth Data**
```sql
-- ✅ CORRECT - For auth schema tables
CREATE POLICY "users_own_mfa_factors" ON auth.mfa_factors
FOR ALL TO authenticated
USING (user_id = (auth.jwt()->>'sub')::uuid);

-- ✅ CORRECT - For application tables  
CREATE POLICY "users_own_profile" ON public.user_profiles
FOR ALL TO authenticated  
USING (id = auth.uid());
```

### **4. Mixed Queries (Auth + Application Data)**
```sql
-- ✅ CORRECT - Join both ID systems
WITH user_info AS (
  SELECT 
    (auth.jwt()->>'sub')::uuid as auth_user_id,
    auth.uid() as profile_id
)
SELECT 
  up.first_name,
  up.last_name,
  mf.factor_type,
  mf.status
FROM user_info ui
JOIN public.user_profiles up ON up.id = ui.profile_id
LEFT JOIN auth.mfa_factors mf ON mf.user_id = ui.auth_user_id;
```

---

## 🔧 Implementation Checklist

### **When Writing MFA/Auth Code:**

**✅ DO:**
- Use `auth.jwt()->>'sub'` for auth schema queries
- Use `auth.uid()` for application schema queries  
- Use Supabase client methods for MFA operations
- Test with actual MFA users, not just mock data
- Verify both JavaScript and SQL paths work

**❌ DON'T:**
- Mix up auth user ID and profile ID
- Use `auth.uid()` with `auth.mfa_factors`
- Assume client and server use same user ID
- Skip testing MFA flows in both contexts

### **When Debugging Auth Issues:**

1. **Check which user ID is being used:**
   ```sql
   SELECT 
     'Auth User ID' as type, (auth.jwt()->>'sub')::uuid as id
   UNION ALL
   SELECT 
     'Profile ID' as type, auth.uid() as id;
   ```

2. **Verify MFA factors exist:**
   ```sql
   SELECT user_id, status, factor_type 
   FROM auth.mfa_factors 
   WHERE user_id = (auth.jwt()->>'sub')::uuid;
   ```

3. **Check the relationship:**
   ```sql
   SELECT 
     (auth.jwt()->>'sub') as auth_user_id,
     auth.uid() as profile_id,
     auth.jwt()->>'email' as email,
     auth.jwt()->>'aal' as current_aal;
   ```

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────────┐
│              SUPABASE AUTH              │
├─────────────────────────────────────────┤
│ auth.users.id                           │
│ └── b61aa963-b65a-400f-a578-818825e0ebac│ ← Auth User ID
│                                         │
│ auth.mfa_factors.user_id                │ 
│ └── b61aa963-b65a-400f-a578-818825e0ebac│ ← Points to Auth User ID
│                                         │
│ auth.sessions, auth.refresh_tokens      │
│ └── All use Auth User ID                │
└─────────────────────────────────────────┘
                    │
                    │ user_metadata.profile_id
                    ▼
┌─────────────────────────────────────────┐
│            FLEXWISE APP DATA            │
├─────────────────────────────────────────┤
│ user_profiles.id                        │
│ └── ea147260-0e79-48b0-a24e-89b8cd1c4ccb│ ← Profile ID
│                                         │
│ ALL application tables use Profile ID:  │
│ ├── contacts.profile_id                 │
│ ├── families.profile_id                 │  
│ ├── student_daily_log.student_id        │
│ └── staff_absences.staff_id             │
│                                         │
│ auth.uid() returns Profile ID           │
└─────────────────────────────────────────┘
```

---

## 🚨 Common Bug Patterns

### **Bug #1: MFA Policies Don't Work**
```sql
-- ❌ BROKEN CODE
CREATE POLICY "mfa_enforce" ON user_profiles
USING (
  NOT EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.uid()  -- WRONG ID!
  ) 
  OR auth.jwt()->>'aal' = 'aal2'
);

-- ✅ FIXED CODE  
CREATE POLICY "mfa_enforce" ON user_profiles
USING (
  NOT EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = (auth.jwt()->>'sub')::uuid  -- CORRECT ID!
  )
  OR auth.jwt()->>'aal' = 'aal2' 
);
```

### **Bug #2: Mixed ID Context**
```sql
-- ❌ BROKEN CODE
SELECT up.*, mf.status
FROM user_profiles up
LEFT JOIN auth.mfa_factors mf ON mf.user_id = up.id;  -- WRONG!

-- ✅ FIXED CODE
SELECT up.*, mf.status  
FROM user_profiles up
LEFT JOIN auth.mfa_factors mf ON mf.user_id = (
  SELECT (user_metadata->>'sub')::uuid 
  FROM auth.users 
  WHERE (user_metadata->>'profile_id')::uuid = up.id
);
```

### **Bug #3: Function Using Wrong ID**
```sql
-- ❌ BROKEN FUNCTION
CREATE FUNCTION check_user_mfa() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = auth.uid()  -- WRONG!
  );
END;
$$ LANGUAGE plpgsql;

-- ✅ FIXED FUNCTION
CREATE FUNCTION check_user_mfa() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE user_id = (auth.jwt()->>'sub')::uuid  -- CORRECT!
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 🎓 Key Relationships

### **The Linking Logic:**
```sql
-- How to link Auth User ID ↔ Profile ID
SELECT 
  au.id as auth_user_id,
  (au.user_metadata->>'profile_id')::uuid as profile_id,
  up.first_name,
  up.last_name
FROM auth.users au
JOIN user_profiles up ON up.id = (au.user_metadata->>'profile_id')::uuid
WHERE au.email = 'user@example.com';
```

### **Custom auth.uid() Override:**
FlexWise overrides `auth.uid()` to return profile_id instead of auth user id:
```sql
-- Standard Supabase: auth.uid() returns auth.users.id  
-- FlexWise Custom: auth.uid() returns user_metadata.profile_id

-- This is why all application RLS works with auth.uid()
-- But auth schema queries need auth.jwt()->>'sub'
```

---

## 🔄 Migration Patterns

### **When Migrating Auth Code:**

1. **Identify the context:**
   - Auth schema? Use `auth.jwt()->>'sub'`
   - App schema? Use `auth.uid()`

2. **Update queries systematically:**
   ```bash
   # Find all auth.mfa_factors queries
   grep -r "auth.mfa_factors" --include="*.sql"
   
   # Check for auth.uid() usage with auth schema
   grep -r "auth\.uid.*auth\." --include="*.sql"
   ```

3. **Test both contexts:**
   - Test JavaScript MFA flows
   - Test SQL RLS policies  
   - Verify policy enforcement

---

## 📚 Reference Links

- **MFA Implementation:** `docs/MFA_IMPLEMENTATION_SUMMARY.md`
- **RLS Policies:** `sql/comprehensive_mfa_hardening.sql`
- **Auth Functions:** `packages/web-app/src/lib/supabase-mfa.js`
- **Debug Tools:** `sql/debug_auth_context_mismatch.sql`

---

## ⚡ Quick Debug Commands

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

-- Verify MFA factors are found
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ MFA factors found'
    ELSE '❌ No MFA factors found'
  END as status,
  COUNT(*) as factor_count
FROM auth.mfa_factors 
WHERE user_id = (auth.jwt()->>'sub')::uuid;

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

## 🏷️ Tags for AI Assistant

**CRITICAL_ARCHITECTURE, AUTH_DUAL_ID, MFA_DEBUGGING, SUPABASE_PATTERNS, SECURITY_BUGS**

---

*This document must be referenced whenever working with authentication, MFA, RLS policies, or user identification in FlexWise.*
