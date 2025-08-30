# Supabase MFA Enforcement Setup Guide

This guide will help you configure Supabase to properly enforce Multi-Factor Authentication (MFA) so users cannot bypass 2FA verification.

## Problem
By default, Supabase allows users to sign in with just email/password even when they have MFA factors enrolled. This creates a security vulnerability where 2FA can be bypassed.

## Solution Steps

### 1. Configure Supabase Auth Settings

Go to your **Supabase Dashboard** → **Authentication** → **Settings**:

```
✅ Enable Multi-Factor Authentication
✅ Require verification for password sign-ins
✅ Maximum enrollments per user: 10
```

### 2. Create MFA Enforcement Database Function

Go to **Supabase Dashboard** → **SQL Editor** and run this SQL:

```sql
-- Create function to enforce MFA for users who have it enabled
CREATE OR REPLACE FUNCTION auth.enforce_mfa_for_verified_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_verified_mfa boolean := false;
BEGIN
  -- Check if user has any verified MFA factors
  SELECT EXISTS (
    SELECT 1 
    FROM auth.mfa_factors 
    WHERE user_id = NEW.user_id 
    AND status = 'verified'
  ) INTO has_verified_mfa;

  -- If user has verified MFA factors but session is only AAL1, block it
  IF has_verified_mfa AND (NEW.aal IS NULL OR NEW.aal = 'aal1') THEN
    RAISE EXCEPTION 'MFA verification required for this user'
      USING HINT = 'User has verified MFA factors and must complete MFA challenge';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_mfa_trigger ON auth.sessions;

-- Create trigger on session creation
CREATE TRIGGER enforce_mfa_trigger
  BEFORE INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION auth.enforce_mfa_for_verified_users();
```

### 3. Create RLS Policy for Additional Security (Optional)

```sql
-- Additional security: RLS policy on user profiles
CREATE POLICY "Users with MFA must have AAL2" ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (
    -- Allow access if user doesn't have MFA OR has completed MFA (AAL2)
    NOT EXISTS (
      SELECT 1 FROM auth.mfa_factors 
      WHERE user_id = auth.uid() 
      AND status = 'verified'
    )
    OR 
    auth.jwt() ->> 'aal' = 'aal2'
  );
```

### 4. Update Auth Configuration (Environment)

If you're using custom Auth configuration, ensure these settings:

```env
# In your Supabase project settings or environment
GOTRUE_MFA_ENABLED=true
GOTRUE_MFA_MAX_ENROLLED_FACTORS=10
```

### 5. Test the Configuration

1. **Login to your app** with the test component added to the login page
2. **Run the "Test Supabase MFA Configuration"** button in the debug section
3. **Check the results**:
   - If you see "VULNERABLE - MFA can be bypassed!", the setup needs completion
   - If you see "SECURE - MFA properly enforced", the configuration is working

### 6. Verify MFA Flow

To properly test:

1. **Enroll MFA** for a test user (use the authenticator app)
2. **Log out completely** 
3. **Try to log in** with just email/password
4. **Should be blocked** from creating a session until MFA is completed

## Expected Behavior After Setup

### ✅ Correct Behavior:
- Users with MFA factors MUST complete 2FA challenge
- Session creation blocked until AAL2 is achieved  
- No bypass possible through client-side manipulation

### ❌ Incorrect Behavior (Before Fix):
- Users can log in with just password despite having MFA
- Session created with AAL1 even when MFA is available
- 2FA verification shown but can be bypassed

## Troubleshooting

### Issue: "Permission denied for function auth.enforce_mfa_for_verified_users"
**Solution**: Make sure you're running the SQL as a Supabase admin/owner

### Issue: Trigger not firing
**Solution**: Check if the function was created in the `auth` schema:
```sql
SELECT proname FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');
```

### Issue: Users can still bypass MFA
**Solution**: 
1. Verify the trigger exists: `\dt auth.sessions` 
2. Check function logs in Supabase Dashboard → Logs
3. Ensure Auth settings are properly configured

## Security Notes

- This setup enforces MFA **server-side** in the database
- Cannot be bypassed by client-side code manipulation
- Works with Supabase's built-in MFA factors (TOTP, SMS)
- Follows Supabase's Authentication Assurance Level (AAL) standards

## Next Steps

After completing this setup:
1. Test thoroughly with different user types
2. Monitor auth logs for any issues
3. Consider adding user notifications about MFA requirements
4. Document the MFA enrollment process for your users
