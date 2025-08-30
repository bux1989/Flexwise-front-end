# Two-Factor Authentication (2FA) System Documentation

## Overview

FlexWise implements a role-based Two-Factor Authentication system with device trust management to enhance security for administrative users while maintaining a seamless user experience.

## System Architecture

### Current Scope
- **Required for**: Admin and Super Admin roles only
- **Device Trust**: 30-day trust period for Admin devices
- **Future Expansion**: Ready for Parents/Externals/Students (90-day trust)

### Components

1. **Database Layer**: `user_trusted_devices` table
2. **Authentication Flow**: Enhanced login with 2FA checks
3. **Verification UI**: Modal dialogs for code entry
4. **Device Management**: Profile settings for trusted device management
5. **Sensitive Actions**: Additional 2FA for critical operations

## Implementation Details

### Database Schema

```sql
CREATE TABLE user_trusted_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_fingerprint text NOT NULL,
    device_name text, -- "Chrome on Windows", "Safari on iPhone"
    trusted_until timestamp NOT NULL,
    created_at timestamp DEFAULT now(),
    last_used_at timestamp DEFAULT now(),
    is_active boolean DEFAULT true,
    school_id uuid NOT NULL REFERENCES structure_schools(id) ON DELETE CASCADE
);
```

### Key Functions

#### Authentication Functions (`lib/supabase.js`)

- `handleLoginWith2FA(email, password)` - Enhanced login with 2FA checks
- `userRequires2FA(userProfile)` - Checks if user role requires 2FA
- `userHas2FAEnabled(user)` - Verifies if user has 2FA configured
- `isDeviceTrusted(userProfileId)` - Checks device trust status
- `addTrustedDevice(userProfileId, userRole, schoolId)` - Adds device to trust list
- `generateDeviceFingerprint()` - Creates unique device identifier
- `generateDeviceName()` - Human-readable device description

#### Device Management Functions

- `loadTrustedDevices()` - Loads user's trusted devices
- `removeTrustedDevice(deviceId)` - Removes specific device
- `removeAllTrustedDevices()` - Clears all trusted devices

## User Flow

### Login Process

1. **Email/Password Authentication**
   - Standard Supabase auth
   - Returns user object and profile

2. **Role-Based 2FA Check**
   ```javascript
   const requires2FA = await userRequires2FA(userProfile)
   // Currently: Admin and Super Admin roles only
   ```

3. **2FA Status Verification**
   ```javascript
   const has2FA = await userHas2FAEnabled(authUser)
   // Checks for verified TOTP or SMS factors
   ```

4. **Device Trust Check**
   ```javascript
   const deviceTrusted = await isDeviceTrusted(userProfile.id)
   // Validates device fingerprint and expiry
   ```

5. **Conditional 2FA Prompt**
   - **If device trusted**: Login complete
   - **If not trusted**: Show 2FA verification dialog
   - **If no 2FA setup**: Allow login with setup reminder

### 2FA Verification Flow

1. **Code Entry Interface**
   - 6-digit code input
   - Support for SMS and TOTP
   - "Remember device" checkbox option

2. **Verification Process**
   ```javascript
   // Try SMS first
   await supabase.auth.verifyOtp({
     phone: user.phone,
     token: code,
     type: 'sms'
   })
   
   // Fallback to TOTP
   await supabase.auth.mfa.verify({
     factorId: totpFactor.id,
     code: code
   })
   ```

3. **Device Trust Addition**
   ```javascript
   if (rememberDevice) {
     await addTrustedDevice(profileId, userRole, schoolId)
   }
   ```

### Sensitive Actions Protection

Protected actions require fresh 2FA verification regardless of device trust:
- Password reset requests
- 2FA disable operations
- Future: Profile changes, role modifications

## Components

### `TwoFactorVerification.jsx`
- **Purpose**: Login-time 2FA verification
- **Features**: SMS/TOTP support, device trust option
- **Props**: `user`, `profile`, `onSuccess`, `onBack`, `showRememberDevice`

### `SensitiveAction2FA.jsx`
- **Purpose**: Additional verification for sensitive operations
- **Features**: Modal overlay, action-specific messaging
- **Props**: `actionTitle`, `actionDescription`, `onSuccess`, `onCancel`, `user`

### Profile Settings Integration
- **Location**: `EditProfile.tsx` → Security Settings
- **Features**: 
  - Trusted devices listing
  - Individual device removal
  - Bulk device removal
  - Device status indicators (active/expired)

## Device Fingerprinting

### Fingerprint Generation
```javascript
const generateDeviceFingerprint = () => {
  const data = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
    platform: navigator.platform,
    timestamp: Date.now()
  }
  return btoa(JSON.stringify(data))
}
```

### Device Naming
```javascript
const generateDeviceName = () => {
  // Detects: Chrome/Firefox/Safari/Edge + Windows/macOS/Linux/iOS/Android
  return `${browser} on ${os}` // e.g., "Chrome on Windows"
}
```

## Security Considerations

### Device Trust Security
- **Fingerprint Uniqueness**: Multiple device characteristics combined
- **Trust Expiration**: Automatic expiry after 30/90 days
- **Centralized Revocation**: Admin can remove compromised devices
- **Activity Tracking**: Last used timestamps for audit trails

### Role-Based Access
- **Admin Roles**: Require 2FA, 30-day device trust
- **Other Roles**: Future expansion with 90-day trust
- **Sensitive Actions**: Always require fresh verification for Admins

### Fallback Mechanisms
- **Primary**: SMS to registered phone number
- **Secondary**: TOTP from authenticator app
- **Emergency**: Email OTP (if configured)
- **Admin Override**: Database-level device removal

## Configuration

### Environment Variables
```bash
# Supabase configuration (existing)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# SMS provider (Twilio via Supabase)
GOTRUE_SMS_TWILIO_ACCOUNT_SID=your_twilio_sid
GOTRUE_SMS_TWILIO_AUTH_TOKEN=your_twilio_token
GOTRUE_SMS_TWILIO_MESSAGE_SERVICE_SID=your_message_service_sid
```

### Supabase Settings
1. **Enable Phone Auth**: Auth → Settings → Enable phone signup
2. **Configure SMS Provider**: Auth → Settings → SMS → Twilio
3. **Enable MFA**: Auth → Settings → Multi-factor authentication

## User Management

### Admin Tasks

#### View User's Trusted Devices
```sql
SELECT 
  utd.*,
  up.first_name,
  up.last_name,
  up.email
FROM user_trusted_devices utd
JOIN user_profiles up ON utd.user_profile_id = up.id
WHERE up.email = 'user@example.com'
  AND utd.is_active = true;
```

#### Remove Compromised Device
```sql
UPDATE user_trusted_devices 
SET is_active = false 
WHERE id = 'device_id';
```

#### Force 2FA Re-verification for User
```sql
UPDATE user_trusted_devices 
SET is_active = false 
WHERE user_profile_id = 'profile_id';
```

### User Self-Service
- **View Devices**: Profile → Security Settings → Trusted Devices
- **Remove Device**: Individual delete buttons
- **Remove All**: Bulk removal option
- **Device Status**: Visual indicators for active/expired devices

## Monitoring & Auditing

### Database Queries for Monitoring

#### 2FA Adoption Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE has_mfa) as users_with_2fa,
  COUNT(*) as total_admin_users,
  ROUND(COUNT(*) FILTER (WHERE has_mfa) * 100.0 / COUNT(*), 2) as adoption_rate
FROM (
  SELECT 
    up.id,
    EXISTS(SELECT 1 FROM auth.mfa_factors WHERE user_id = au.id AND status = 'verified') as has_mfa
  FROM user_profiles up
  JOIN auth.users au ON au.user_metadata->>'profile_id' = up.id::text
  JOIN user_roles ur ON ur.user_profile_id = up.id
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name IN ('Admin', 'Super Admin')
) stats;
```

#### Trusted Device Usage
```sql
SELECT 
  device_name,
  COUNT(*) as device_count,
  AVG(EXTRACT(days FROM NOW() - created_at)) as avg_age_days
FROM user_trusted_devices 
WHERE is_active = true
GROUP BY device_name
ORDER BY device_count DESC;
```

#### Recent 2FA Verifications (via logs)
Monitor application logs for:
- `✅ SMS 2FA verification successful`
- `✅ TOTP 2FA verification successful`
- `❌ 2FA verification failed`

## Troubleshooting

### Common Issues

#### SMS Not Received
1. Check Twilio configuration in Supabase
2. Verify phone number format (E.164: +4915912345678)
3. Check Twilio account balance and delivery status

#### TOTP Code Invalid
1. Verify device time synchronization
2. Check for multiple TOTP factors (use most recent)
3. Ensure QR code was scanned correctly

#### Device Not Trusted After Verification
1. Check browser localStorage for persistence
2. Verify device fingerprint generation
3. Check database for device record creation

#### Locked Out of Account
1. Admin can disable 2FA via database:
   ```sql
   -- Disable all MFA factors for user
   UPDATE auth.mfa_factors 
   SET status = 'unverified' 
   WHERE user_id = (
     SELECT id FROM auth.users 
     WHERE email = 'user@example.com'
   );
   ```

## Future Enhancements

### Planned Features
1. **Role Expansion**: Enable 2FA for Teachers, Parents, Students
2. **Hardware Keys**: Support for FIDO2/WebAuthn
3. **Risk-Based Auth**: IP geolocation, unusual activity detection
4. **Backup Codes**: One-time recovery codes
5. **Admin Dashboard**: Centralized 2FA management interface

### Integration Points
- **Attendance System**: Require 2FA for bulk attendance changes
- **Grade Management**: Protect grade entry/modification
- **User Management**: Secure role assignments and permissions
- **Financial Data**: Protect payment and billing information

## API Reference

### Key Exports from `lib/supabase.js`

```javascript
// Authentication
export async function handleLoginWith2FA(email, password)
export async function userRequires2FA(userProfile)
export async function userHas2FAEnabled(user)

// Device Management
export function generateDeviceFingerprint()
export function generateDeviceName()
export async function isDeviceTrusted(userProfileId)
export async function addTrustedDevice(userProfileId, userRole, schoolId)
```

### Component Props

```javascript
// TwoFactorVerification
interface TwoFactorVerificationProps {
  user: AuthUser
  profile: UserProfile
  onSuccess: (result: VerificationResult) => void
  onBack: () => void
  showRememberDevice?: boolean
}

// SensitiveAction2FA
interface SensitiveAction2FAProps {
  actionTitle: string
  actionDescription: string
  user: AuthUser
  onSuccess: () => void
  onCancel: () => void
}
```

## Testing

### Manual Testing Checklist

#### Login Flow
- [ ] Admin login without 2FA setup (should allow with reminder)
- [ ] Admin login with 2FA, new device (should prompt for verification)
- [ ] Admin login with 2FA, trusted device (should skip verification)
- [ ] Non-admin login (should skip 2FA entirely)

#### Device Trust
- [ ] Select "Remember device" → verify device appears in profile
- [ ] Remove individual device → verify device no longer trusted
- [ ] Remove all devices → verify no devices trusted
- [ ] Wait for expiry → verify expired devices marked appropriately

#### Sensitive Actions
- [ ] Password reset with 2FA enabled → should require verification
- [ ] 2FA disable → should require verification
- [ ] Same actions without 2FA → should execute directly

### Automated Testing

Consider implementing:
- Unit tests for fingerprint generation
- Integration tests for device trust flow
- E2E tests for complete 2FA scenarios
- Security tests for fingerprint uniqueness

---

## Support & Maintenance

For issues or questions regarding the 2FA system:
1. Check application logs for error details
2. Verify Supabase configuration and SMS provider setup
3. Review user's 2FA enrollment status in auth.mfa_factors
4. Check device trust records in user_trusted_devices table

Last Updated: January 2025
Version: 1.0.0
