# Updated MFA Security Recommendations

## Official Supabase Guidance 

Based on the [official Supabase blog post](https://supabase.com/blog/mfa-auth-via-rls), our previous implementation should be updated to follow their recommended patterns.

## Key Changes from Previous Implementation

### 1. Use RESTRICTIVE Policies (Not Regular Policies)

**Previous approach:**
```sql
CREATE POLICY "Users with MFA must have AAL2" ON public.user_profiles
FOR ALL TO authenticated USING (...)
```

**✅ Official approach:**
```sql
CREATE POLICY "mfa_enforce_aal2_user_profiles"
ON public.user_profiles
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());
```

**Why RESTRICTIVE?**
- RESTRICTIVE policies are enforced **in addition to** existing policies
- If any RESTRICTIVE policy denies access, the operation is blocked
- More secure than replacing existing policies
- Works alongside existing school isolation policies

### 2. Official Helper Function Pattern

**✅ Supabase recommended function:**
```sql
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
```

**Benefits:**
- Handles the MFA logic correctly
- Users without MFA can access normally
- Users with MFA must have AAL2
- Reusable across multiple policies

### 3. Required Permissions

**CRITICAL:** Must grant access to `auth.mfa_factors`:
```sql
GRANT SELECT ON auth.mfa_factors TO authenticated;
```

Without this, the policies will fail silently.

### 4. Direct AAL Check Pattern

For specific operations, use direct checks:
```sql
CREATE POLICY "mfa_restrict_updates"
ON public.user_profiles  
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (auth.jwt()->>'aal' = 'aal2');
```

## Implementation Plan (Updated)

### Phase 1: Replace Previous Implementation

1. **Remove previous policies** (if applied):
   ```sql
   DROP POLICY IF EXISTS "mfa_users_require_aal2_user_profiles" ON public.user_profiles;
   DROP POLICY IF EXISTS "mfa_users_require_aal2_contacts" ON public.contacts;
   ```

2. **Apply official hardening script**:
   ```sql
   \i sql/supabase_official_mfa_hardening.sql
   ```

3. **Test thoroughly** with the SecurityMFATest component

### Phase 2: Enhanced Security Features

Based on official Supabase patterns and noting that **trusted devices are not yet implemented**:

#### A. Session Management
```sql
-- Enhanced session tracking (future feature)
CREATE TABLE user_trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  device_fingerprint text NOT NULL,
  device_name text,
  trusted_until timestamp,
  created_at timestamp DEFAULT now()
);
```

#### B. Conditional MFA Requirements
```sql
-- Require MFA for sensitive operations only
CREATE POLICY "mfa_for_sensitive_operations"
ON public.user_profiles
AS RESTRICTIVE  
FOR UPDATE
TO authenticated
USING (
  -- Always require AAL2 for role changes
  CASE 
    WHEN OLD.roles IS DISTINCT FROM NEW.roles THEN
      auth.jwt()->>'aal' = 'aal2'
    ELSE
      public.check_mfa_required()
  END
);
```

#### C. Time-based MFA Requirements
```sql
-- Require fresh MFA for admin operations
CREATE POLICY "fresh_mfa_for_admin"
ON public.admin_operations
AS RESTRICTIVE
TO authenticated  
USING (
  auth.jwt()->>'aal' = 'aal2' 
  AND 
  -- Check if MFA was completed within last hour
  (auth.jwt()->>'aal_verified_at')::timestamp > (now() - interval '1 hour')
);
```

### Phase 3: Future Enhancements (Not Yet Implemented)

#### Trusted Device Management
- Device registration and fingerprinting
- Reduced MFA requirements for trusted devices
- Device-based access policies

#### Advanced MFA Features  
- Conditional MFA based on risk factors
- Geographic access restrictions
- Time-based access controls

## Testing Updated Implementation

### Security Test Scenarios

1. **User without MFA factors:**
   - ✅ Should access data normally with AAL1 or AAL2

2. **User with MFA factors, AAL1 session:**
   - ❌ Should be BLOCKED from accessing protected data
   - ✅ Should still be blocked by RESTRICTIVE policies

3. **User with MFA factors, AAL2 session:**  
   - ✅ Should access data normally

4. **Existing school isolation:**
   - ✅ Should continue working (RESTRICTIVE policies are additive)

### Updated SecurityMFATest Component

The existing test component will work with the new implementation, but results should show:
- `RESTRICTIVE policies enforced` instead of regular policies
- Better test coverage for the official helper function

## Migration from Previous Implementation

### Safe Migration Steps

1. **Backup current policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public' 
   AND policyname LIKE '%mfa%';
   ```

2. **Test in staging first**
3. **Apply during maintenance window**
4. **Monitor audit logs for any issues**
5. **Have rollback plan ready**

### Rollback Plan
```sql
-- If needed, disable restrictive policies temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- Fix issues, then re-enable
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

## Key Benefits of Official Approach

1. **✅ Supabase-supported** - Uses official patterns
2. **✅ More secure** - RESTRICTIVE policies can't be bypassed  
3. **✅ Better compatibility** - Works with existing RLS policies
4. **✅ Future-proof** - Follows documented best practices
5. **✅ Comprehensive** - Handles edge cases properly

## Next Steps (Updated Priority)

### Immediate (This Week)
1. ✅ Apply official Supabase hardening script
2. ✅ Test with MFA-enabled accounts
3. ✅ Verify existing school isolation still works
4. ✅ Monitor for any policy conflicts

### Short Term (2-4 Weeks)  
1. Implement session timeout for AAL2 sessions
2. Add monitoring dashboard for MFA compliance
3. Document user MFA enrollment process
4. Add real-time security alerts

### Medium Term (1-3 Months)
1. **Implement trusted device management** (not yet implemented)
2. Add conditional MFA based on risk factors
3. Geographic access restrictions
4. Advanced threat detection

### Long Term (3+ Months)
1. Device fingerprinting and trust scoring
2. Behavioral analytics for anomaly detection  
3. Integration with external security services
4. Regular security audits and penetration testing

## Conclusion

The official Supabase approach is significantly more robust than our initial implementation. The use of RESTRICTIVE policies ensures that MFA enforcement cannot be bypassed, while the official helper function handles edge cases properly.

**Key takeaway:** Always check official documentation and blog posts for security implementations, as they often contain patterns that are more robust than custom solutions.
