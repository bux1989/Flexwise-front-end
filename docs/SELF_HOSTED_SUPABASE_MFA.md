# Self-Hosted Supabase MFA Configuration

This guide explains how to properly configure MFA enforcement on self-hosted Supabase.

## Required vs Optional Hooks

### ✅ **REQUIRED Environment Variables**
```env
# Essential for MFA functionality
GOTRUE_MFA_ENABLED=true
GOTRUE_MFA_TOTP_ENROLL_ENABLED=true
GOTRUE_MFA_TOTP_VERIFY_ENABLED=true

# Optional: Phone-based MFA (disabled by default)
GOTRUE_MFA_PHONE_ENROLL_ENABLED=false
GOTRUE_MFA_PHONE_VERIFY_ENABLED=false
```

### 🔍 **OPTIONAL BUT RECOMMENDED (Security Logging)**
```env
# Your current configuration - good for monitoring
GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED=true
GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_URI=pg-functions://postgres/public/mfa_verification_attempt

# Additional security logging
GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED=true
GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI=pg-functions://postgres/public/password_verification_attempt
```

### ❌ **NOT NEEDED for Basic MFA Enforcement**
```env
# These are for advanced use cases only
GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED=false
GOTRUE_HOOK_SEND_SMS_ENABLED=false
GOTRUE_HOOK_SEND_EMAIL_ENABLED=false
```

## Complete Docker Compose Configuration

```yaml
# Example docker-compose.yml Auth service configuration
auth:
  image: supabase/gotrue:v2.111.0
  depends_on:
    db:
      condition: service_healthy
  environment:
    # Database
    GOTRUE_DB_DRIVER: postgres
    GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

    # API URLs
    GOTRUE_API_HOST: 0.0.0.0
    GOTRUE_API_PORT: 9999
    GOTRUE_SITE_URL: ${SITE_URL}

    # JWT
    GOTRUE_JWT_ADMIN_ROLES: service_role
    GOTRUE_JWT_AUD: authenticated
    GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
    GOTRUE_JWT_EXP: ${JWT_EXPIRY}
    GOTRUE_JWT_SECRET: ${JWT_SECRET}

    # MFA Configuration (REQUIRED)
    GOTRUE_MFA_ENABLED: "true"
    GOTRUE_MFA_TOTP_ENROLL_ENABLED: "true"
    GOTRUE_MFA_TOTP_VERIFY_ENABLED: "true"

    # Optional: Phone-based MFA (can be disabled)
    GOTRUE_MFA_PHONE_ENROLL_ENABLED: "false"
    GOTRUE_MFA_PHONE_VERIFY_ENABLED: "false"

    # Security Hooks (OPTIONAL - for logging)
    GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED: "true"
    GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_URI: "pg-functions://postgres/public/mfa_verification_attempt"
    
    GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED: "true"
    GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI: "pg-functions://postgres/public/password_verification_attempt"

    # Other settings
    GOTRUE_DISABLE_SIGNUP: ${DISABLE_SIGNUP}
    GOTRUE_EXTERNAL_EMAIL_ENABLED: ${ENABLE_EMAIL_SIGNUP}
    GOTRUE_MAILER_AUTOCONFIRM: ${ENABLE_EMAIL_AUTOCONFIRM}
    GOTRUE_SMTP_ADMIN_EMAIL: ${SMTP_ADMIN_EMAIL}
    GOTRUE_SMTP_HOST: ${SMTP_HOST}
    GOTRUE_SMTP_PORT: ${SMTP_PORT}
    GOTRUE_SMTP_USER: ${SMTP_USER}
    GOTRUE_SMTP_PASS: ${SMTP_PASS}
    GOTRUE_SMTP_SENDER_NAME: ${SMTP_SENDER_NAME}
```

## Setup Steps

### 1. **Update Your Docker Configuration**
Add the MFA environment variables to your `docker-compose.yml` or `.env` file.

### 2. **Run the Setup SQL**
Execute the SQL script: `sql/setup_self_hosted_mfa.sql` in your database.

### 3. **Restart Your Services**
```bash
docker-compose down
docker-compose up -d
```

### 4. **Test the Configuration**
Use the test component in your app to verify MFA enforcement is working.

## What Each Component Does

### **Database Trigger (CRITICAL)**
- **Purpose**: Actually enforces MFA by blocking session creation
- **Location**: `auth.enforce_mfa_for_verified_users()` function + trigger
- **Action**: Prevents users with MFA from getting AAL1 sessions

### **MFA Verification Hook (OPTIONAL)**
- **Purpose**: Logs MFA attempts for security monitoring
- **Location**: `public.mfa_verification_attempt()` function
- **Action**: Records successful/failed MFA attempts

### **Password Verification Hook (OPTIONAL)**
- **Purpose**: Logs password attempts for security monitoring  
- **Location**: `public.password_verification_attempt()` function
- **Action**: Records successful/failed password attempts

## Expected Behavior After Setup

### ✅ **With MFA Enforcement**:
1. User with MFA tries to log in with password only
2. Initial login attempt creates temporary session
3. Database trigger detects user has MFA but session is AAL1
4. Trigger **blocks** session creation with error
5. Frontend handles error and shows MFA challenge
6. User completes MFA verification
7. New session created with AAL2 (secure)

### ❌ **Without Enforcement (Current Problem)**:
1. User logs in with password only
2. Session created with AAL1
3. User can access dashboard without MFA
4. MFA is "optional" instead of required

## Troubleshooting

### Problem: "function public.mfa_verification_attempt(jsonb) does not exist"
**Solution**: Run the setup SQL script to create the required functions.

### Problem: MFA still being bypassed
**Solution**: 
1. Check if the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'enforce_mfa_trigger';`
2. Verify GOTRUE_MFA_ENABLED and GOTRUE_MFA_TOTP_*_ENABLED are set to "true"
3. Check logs for trigger errors

### Problem: Authentication completely broken
**Solution**: 
1. Check GOTRUE logs: `docker-compose logs auth`
2. Temporarily disable MFA enforcement trigger if needed
3. Verify database connectivity and permissions

## Security Notes

- The database trigger provides **server-side enforcement** that cannot be bypassed
- Hooks are optional and mainly for logging/monitoring
- Self-hosted gives you full control over MFA policies
- Always test in a development environment first

## Monitoring MFA Usage

Query MFA attempts from the audit log:
```sql
SELECT 
  payload->>'action' as action,
  payload->>'valid' as valid,
  created_at,
  ip_address
FROM auth.audit_log_entries 
WHERE payload->>'action' IN ('mfa_verification_attempt', 'password_verification_attempt')
ORDER BY created_at DESC;
```
