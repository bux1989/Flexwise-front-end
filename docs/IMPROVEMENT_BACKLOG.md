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
*No items currently tracked*

### 📱 Performance Optimizations  
*No items currently tracked*

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
