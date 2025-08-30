# Supabase Self-Hosting Security Checklist

## ✅ Environment & Configuration

### Required Environment Variables
```bash
# Production
VITE_SUPABASE_URL=https://your-domain.com
VITE_SUPABASE_ANON_KEY=your_anon_key

# For self-hosted Supabase, also configure:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only
POSTGRES_PASSWORD=strong_password
JWT_SECRET=your_jwt_secret_32_chars_minimum
```

### ❌ NEVER expose these in client code:
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTGRES_PASSWORD` 
- `JWT_SECRET`
- Database connection strings

## ✅ Database Security (RLS)

### Essential RLS Policies Needed:
```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance_logs ENABLE ROW LEVEL SECURITY;

-- School isolation policy example
CREATE POLICY "Users can only access their school data" ON user_profiles
    FOR ALL USING (
        school_id = auth.get_user_school_id()
    );

-- Bulletin posts policy
CREATE POLICY "School members can read public posts" ON bulletin_posts
    FOR SELECT USING (
        school_id = auth.get_user_school_id() 
        AND is_public = true
    );
```

## ✅ Authentication Security

### Required Configurations:
1. **Strong JWT Secret** (32+ characters)
2. **Email confirmation** enabled
3. **Rate limiting** on auth endpoints
4. **Session timeout** configured
5. **Password requirements** enforced
6. **Two-Factor Authentication** for admin users ✅ (Implemented)

### Recommended Auth Settings:
```sql
-- In your Supabase Auth config
{
  "SITE_URL": "https://home-5018515799.app-ionos.space",
  "JWT_EXPIRY": 3600,
  "REFRESH_TOKEN_ROTATION_ENABLED": true,
  "SECURITY_REFRESH_TOKEN_REUSE_INTERVAL": 10,
  "PASSWORD_MIN_LENGTH": 8,
  "EMAIL_CONFIRM_REQUIRED": true,
  "MFA_ENABLED": true,
  "SMS_PROVIDER": "twilio"
}
```

### Multi-Factor Authentication (2FA/MFA)
✅ **Implemented** - See [2FA System Documentation](./2FA_SYSTEM.md) for details

**Current Coverage:**
- Admin and Super Admin roles require 2FA
- Device trust management (30-day trust for admins)
- SMS and TOTP (Authenticator app) support
- Sensitive action protection (password reset, 2FA disable)
- User-managed trusted device removal

**Configuration Required:**
```bash
# SMS Provider (Twilio)
GOTRUE_SMS_TWILIO_ACCOUNT_SID=your_twilio_sid
GOTRUE_SMS_TWILIO_AUTH_TOKEN=your_twilio_token
GOTRUE_SMS_TWILIO_MESSAGE_SERVICE_SID=your_message_service_sid
```

**Database Tables:**
- `user_trusted_devices` - Device trust management
- `auth.mfa_factors` - Supabase MFA enrollment (auto-managed)

**Security Benefits:**
- Protection against credential theft
- Device-based access control
- Audit trail for security events
- Gradual rollout capability (currently admin-only)

## ✅ Network Security

### Required Setup:
- [ ] HTTPS only (SSL certificates)
- [ ] Firewall rules (restrict database access)
- [ ] CORS configuration
- [ ] Rate limiting on API endpoints

### CORS Configuration:
```javascript
// In your Supabase config
{
  "cors": {
    "allowed_origins": [
      "https://home-5018515799.app-ionos.space",
      "https://your-domain.com"
    ]
  }
}
```

## ✅ Data Protection

### School Data Isolation:
- [ ] RLS policies enforce school_id filtering
- [ ] No cross-school data access
- [ ] User profiles linked to correct schools

### Sensitive Data:
- [ ] Personal data encrypted at rest
- [ ] Audit logging enabled
- [ ] Backup encryption configured
- [ ] GDPR compliance measures

## ✅ Monitoring & Logging

### Essential Monitoring:
- [ ] Database query monitoring
- [ ] Authentication attempt logging
- [ ] Failed request tracking
- [ ] Performance metrics

### Log What Matters:
- Login/logout events
- Data access patterns
- Failed authentication attempts
- Schema changes
- Admin actions

## ✅ Backup & Recovery

### Required:
- [ ] Automated daily backups
- [ ] Backup encryption
- [ ] Offsite backup storage
- [ ] Recovery testing
- [ ] Point-in-time recovery capability

## ⚠️ Security Headers

Add these to your hosting configuration:

```apache
# .htaccess (if using Apache)
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'"
```

## 🚨 Critical Actions

### Immediate Actions Needed:
1. **Remove hardcoded credentials** ✅ (Fixed)
2. **Implement RLS policies** ❌ (Missing)
3. **Configure CORS properly** ❌ (Check needed)
4. **Set up monitoring** ❌ (Missing)
5. **Enable audit logging** ❌ (Missing)

### Next Steps:
1. Create RLS policies for all tables
2. Configure proper CORS settings
3. Set up monitoring and alerting
4. Implement backup strategy
5. Add security headers to hosting

## 📚 References
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Self-hosting Security](https://supabase.com/docs/guides/self-hosting/docker#security)
- [Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
