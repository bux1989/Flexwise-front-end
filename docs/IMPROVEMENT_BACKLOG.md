# Improvement Backlog

This document tracks known issues and potential improvements that are not critical but should be addressed in future iterations.

## Database & Backend Issues

### 🔧 Contact Update Optimization
**Issue:** The `save_user_profile_complete_react` function updates `updated_at` timestamps for all contacts, even if their values haven't changed.

**Current Behavior:**
- All existing contacts get `updated_at = NOW()` regardless of whether their data changed
- This makes it difficult to track when contacts were actually modified

**Proposed Solution:**
- Add field-by-field comparison before updating contacts
- Only update `updated_at` when actual data changes
- Example logic:
  ```sql
  UPDATE contacts SET
    type = v_contact->>'type',
    label = v_contact->>'label', 
    value = v_contact->>'value',
    is_primary = COALESCE((v_contact->>'is_primary')::BOOLEAN, false),
    updated_at = CASE 
      WHEN type != v_contact->>'type' 
        OR label != v_contact->>'label'
        OR value != v_contact->>'value' 
        OR is_primary != COALESCE((v_contact->>'is_primary')::BOOLEAN, false)
      THEN NOW()
      ELSE updated_at
    END
  ```

**Priority:** Low
**Effort:** Medium
**Impact:** Improved data accuracy for audit trails

---

## Frontend Issues

### 🎨 UI/UX Improvements

#### Screen Flash During Logout
**Issue:** When user logs out, there's a brief screen flash/flicker before redirecting to login page.

**Current Behavior:**
- User clicks logout
- Screen briefly flashes or shows content before redirect
- Creates jarring user experience

**Proposed Solutions:**
- Add smooth transition animation during logout
- Show loading spinner during logout process
- Implement fade-out effect before redirect
- Consider using React Router's navigation transitions

**Priority:** Low
**Effort:** Low
**Impact:** Improved user experience, more polished feel

---

### 📱 Performance Optimizations  
*No items currently tracked*

---

## Security & Authentication

### ✅ Two-Factor Authentication (2FA) System - COMPLETED
**Status:** Implemented (January 2025)

**Delivered Features:**
- Role-based 2FA requirement (Admin/Super Admin only)
- Device trust management with 30-day expiry
- SMS and TOTP verification support
- Sensitive action protection (password reset, 2FA disable)
- User-friendly device management in profile settings
- Complete documentation and monitoring guides

**Implementation Details:** See [2FA_SYSTEM.md](./2FA_SYSTEM.md)

### 🔮 Future 2FA Enhancements
**Planned Improvements:**

1. **Role Expansion** (Priority: Medium)
   - Enable 2FA for Teachers (30-day device trust)
   - Enable 2FA for Parents/Externals/Students (90-day device trust)
   - Configurable trust periods per role

2. **Hardware Security Keys** (Priority: Low)
   - FIDO2/WebAuthn support
   - USB security key compatibility
   - Backup methods for key loss

3. **Risk-Based Authentication** (Priority: Low)
   - IP geolocation analysis
   - Unusual activity detection
   - Adaptive trust scoring

4. **Admin Dashboard** (Priority: Medium)
   - Centralized 2FA management interface
   - User 2FA status overview
   - Bulk device trust management
   - Security analytics and reporting

5. **Backup & Recovery** (Priority: High)
   - One-time backup codes generation
   - Account recovery without 2FA device
   - Admin emergency override procedures

**Effort:** Medium to High depending on feature
**Impact:** Enhanced security posture for all user types

---

## General Code Quality

### 🧹 Code Cleanup
*No items currently tracked*

### 📝 Documentation
*No items currently tracked*

---

## How to Use This Document

1. **Adding Items:** When you encounter non-critical issues during development, add them here
2. **Prioritization:** Use priority levels: Critical, High, Medium, Low
3. **Effort Estimation:** Use effort levels: Small, Medium, Large
4. **Impact Assessment:** Consider user experience, performance, maintainability
5. **Regular Review:** Periodically review and tackle items during downtime

## Status Legend
- 🔧 Bug/Issue
- 🎨 UI/UX Enhancement  
- 📱 Performance
- 🧹 Code Quality
- 📝 Documentation
- ✅ Completed
- 🚧 In Progress
- 📋 Planned
