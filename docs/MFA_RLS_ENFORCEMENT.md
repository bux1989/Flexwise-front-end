# MFA Enforcement with Row Level Security (RLS)

## Security Issue with Current Implementation

The current 2FA implementation has a critical security flaw:

```javascript
// ❌ SECURITY VULNERABILITY
const { data: authData, error } = await supabase.auth.signInWithPassword({
  email, password
}) // User gets full session BEFORE 2FA verification!

// Client-side 2FA check happens AFTER session is established
const has2FA = await userHas2FAEnabled(authData.user)
```

**Problems:**
- User has authenticated session before completing 2FA
- Client-side checks can be bypassed
- No database-level enforcement

## Secure Solutions

### Option 1: Supabase Built-in MFA (Recommended)

Supabase's MFA system enforces verification server-side:

```sql
-- Enable MFA on Supabase project
-- Users cannot get a session without completing MFA challenges
```

**Benefits:**
- ✅ Server-side enforcement
- ✅ Cannot be bypassed
- ✅ Standard implementation
- ✅ Automatic session management

### Option 2: Custom RLS Policies

Create database policies that check MFA verification status:

```sql
-- Create MFA verification tracking table
CREATE TABLE user_mfa_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  mfa_verified boolean DEFAULT false,
  verified_at timestamp,
  expires_at timestamp NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp DEFAULT now()
);

-- RLS policy that requires MFA verification
CREATE POLICY "Users can only access data after MFA verification" 
ON user_profiles
FOR ALL
TO authenticated
USING (
  -- Allow access if user doesn't require MFA
  NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_profile_id = user_profiles.id
    AND r.name IN ('Admin', 'Super Admin')
  )
  OR
  -- Or if user has completed MFA verification for current session
  EXISTS (
    SELECT 1 FROM user_mfa_sessions ms
    WHERE ms.user_id = auth.uid()
    AND ms.session_id = (auth.jwt() ->> 'session_id')
    AND ms.mfa_verified = true
    AND ms.expires_at > now()
  )
);

-- Apply similar policies to all sensitive tables
CREATE POLICY "Admin data requires MFA" 
ON admin_sensitive_table
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_mfa_sessions ms
    WHERE ms.user_id = auth.uid()
    AND ms.mfa_verified = true
    AND ms.expires_at > now()
  )
);
```

### Option 3: Server-Side Edge Functions

```typescript
// Edge function for secure authentication
export async function secureMFALogin(email: string, password: string) {
  // Step 1: Verify credentials without creating session
  const user = await verifyCredentials(email, password)
  
  // Step 2: Check if MFA required
  const requiresMFA = await checkMFARequired(user.id)
  
  if (requiresMFA) {
    // Step 3: Send MFA challenge
    const challenge = await sendMFAChallenge(user.id)
    return { mfaRequired: true, challengeId: challenge.id }
  }
  
  // Step 4: Create session only after MFA verification
  const session = await createSession(user.id)
  return { session }
}
```

## Current Implementation Fixes

### Immediate Fix: Pre-Session MFA Check

```javascript
export async function secureHandleLogin(email, password) {
  // Step 1: Check user credentials WITHOUT creating session
  const { data: user, error } = await supabase.rpc('verify_user_credentials', {
    user_email: email,
    user_password: password
  })
  
  if (error) throw error
  
  // Step 2: Check MFA requirements
  const mfaStatus = await checkUserMFAStatus(user.id)
  
  if (mfaStatus.required && !mfaStatus.verified) {
    // Return MFA challenge without creating session
    return {
      needsMFA: true,
      userId: user.id,
      challengeId: mfaStatus.challengeId
    }
  }
  
  // Step 3: Only now create the actual session
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email, password
  })
  
  return { user: authData.user, loginComplete: true }
}
```

## Recommended Approach

**Use Supabase's built-in MFA system** because:

1. **Server-side enforcement** - Cannot be bypassed
2. **Standard implementation** - Well-tested and maintained
3. **Automatic session management** - Handles session creation correctly
4. **Built-in security** - No custom vulnerabilities

## Migration Steps

1. **Enable Supabase MFA** on the project
2. **Update login flow** to use `auth.mfa.challenge()` and `auth.mfa.verify()`
3. **Remove custom 2FA logic** that happens after session creation
4. **Update RLS policies** to trust Supabase's MFA enforcement
5. **Test thoroughly** with MFA-enabled accounts

This ensures proper security where database access is impossible without completing MFA verification.
