# Debug MFA Policy Enforcement Failure

## Critical Issue
Your policy tester shows **0/46 tables correctly blocked** - this is a major security vulnerability!

- ✅ Function works: `check_mfa_required()` returns `false` 
- ❌ Policies fail: All tables accessible to AAL1 users with MFA

## Debug Commands (AS SUPERUSER)

### 1. Check if RESTRICTIVE policies exist
```sql
-- Check which tables have RESTRICTIVE MFA policies
SELECT 
  'RESTRICTIVE Policy Check' as test,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%mfa_%'
  AND permissive = 'RESTRICTIVE'
ORDER BY tablename;
```

### 2. Check specific critical tables
```sql
-- Check user_profiles specifically
SELECT 
  'user_profiles policies' as table_name,
  policyname,
  permissive,
  cmd,
  pg_get_expr(qual, oid) as policy_expression
FROM pg_policies p
JOIN pg_class c ON p.tablename = c.relname
WHERE schemaname = 'public' AND tablename = 'user_profiles';
```

### 3. Test function in policy context vs direct
```sql
-- Test the function behavior with detailed context
SELECT 
  'Function Context Test' as test,
  public.check_mfa_required() as direct_result,
  auth.jwt()->>'aal' as current_aal,
  (auth.jwt()->>'sub')::uuid as jwt_subject,
  EXISTS(
    SELECT 1 FROM auth.mfa_factors 
    WHERE (auth.jwt()->>'sub')::uuid = user_id AND status = 'verified'
  ) as has_mfa_factors;
```

### 4. Check for conflicting policies
```sql
-- Look for permissive policies that might override restrictive ones
SELECT 
  'Conflicting Policies' as test,
  tablename,
  policyname,
  permissive,
  cmd,
  'Permissive policies can override restrictive ones' as note
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'contacts', 'families')
  AND permissive = 'PERMISSIVE'
ORDER BY tablename, policyname;
```

### 5. Check table RLS status
```sql
-- Verify RLS is enabled on critical tables
SELECT 
  'RLS Status' as test,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'contacts', 'families', 'profile_info_staff')
ORDER BY tablename;
```

## Most Likely Issues

### Issue A: Policies Never Created
- The comprehensive hardening script failed
- **Solution**: Re-run `sql/comprehensive_mfa_hardening.sql`

### Issue B: Wrong Function Logic  
- Function returns `true` in policy context (opposite of direct test)
- **Solution**: Debug function logic with dual ID issue

### Issue C: Permissive Policies Override
- Existing permissive policies allow access despite restrictive ones
- **Solution**: Remove conflicting permissive policies

### Issue D: RLS Disabled
- Row Level Security not enabled on tables
- **Solution**: Enable RLS on affected tables

## Emergency Fix Commands

If policies are missing, run these immediately:

```sql
-- Quick fix for critical tables
CREATE POLICY "emergency_mfa_user_profiles" ON public.user_profiles
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.check_mfa_required());

CREATE POLICY "emergency_mfa_contacts" ON public.contacts  
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.check_mfa_required());
```

Run the debug commands first to identify the root cause, then we'll apply the appropriate fix.
