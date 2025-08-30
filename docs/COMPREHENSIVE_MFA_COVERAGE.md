# Comprehensive MFA Coverage Documentation

## Overview
This document outlines the comprehensive MFA (Multi-Factor Authentication) security implementation that protects 45 out of 108 total database tables (42% coverage).

## Implementation Files
- **Primary Script**: `sql/comprehensive_mfa_hardening.sql` - Adds RESTRICTIVE policies to 43 additional tables
- **Base Script**: `sql/supabase_official_mfa_hardening.sql` - Covers user_profiles and contacts (run this first)

## Tables Protected (45 Total)

### Currently Covered (2 tables)
- ✅ `user_profiles` - User profile data and PII
- ✅ `contacts` - Contact information (emails, phones, addresses)

### High Priority (18 tables)
- ✅ `profile_info_staff` - Staff personal information and employee data
- ✅ `profile_info_student` - Student PII, allergies, pickup authorization
- ✅ `profile_info_family_member` - Family member details
- ✅ `families` - Family group data
- ✅ `family_members` - Family relationships and guardian status
- ✅ `family_member_child_links` - Child access permissions and pickup rights
- ✅ `student_absence_notes` - Sensitive absence reasons and medical info
- ✅ `student_daily_log` - Individual attendance with personal notes
- ✅ `student_emergency_information` - Emergency contacts and medical info
- ✅ `staff_absences` - Staff absence records
- ✅ `staff_documents` - Staff document storage
- ✅ `staff_contracts` - Employment contracts
- ✅ `staff_work_contracts` - Work contract details
- ✅ `user_roles` - Role assignments (admin access control)
- ✅ `protected_roles` - System protection roles
- ✅ `user_codes` - User access codes
- ✅ `student_pickup_arrangement_overrides` - Pickup arrangements
- ✅ `student_weekly_pickup_arrangements` - Weekly pickup schedules

### Medium Priority (15 tables)
- ✅ `student_attendance_logs` - Lesson-level attendance tracking
- ✅ `lesson_diary_entries` - Classroom notes and behavioral records
- ✅ `bulletin_posts` - Internal communications
- ✅ `bulletin_post_users` - Bulletin targeting information
- ✅ `course_notes` - Course-related notes and comments
- ✅ `staff_absence_comments` - Comments on staff absences
- ✅ `staff_class_links` - Staff-class assignments
- ✅ `staff_subjects` - Staff subject qualifications
- ✅ `staff_duty_plan` - Staff duty assignments
- ✅ `staff_yearly_preferences` - Staff preferences and availability
- ✅ `student_course_wish_choices` - Student course preferences
- ✅ `student_course_wish_submissions` - Course wish submissions
- ✅ `student_presence_events` - Check-in/out events
- ✅ `change_log` - System change tracking (admin-only recommended)
- ✅ `user_groups` - User group definitions
- ✅ `user_group_members` - User group memberships

### Selected Operational (10 tables)
- ✅ `course_applications` - Course application submissions
- ✅ `course_enrollments` - Student course enrollments
- ✅ `course_lessons` - Individual lesson instances
- ✅ `course_list` - Course catalog
- ✅ `course_offers` - Course offerings
- ✅ `course_possible_times` - Available course times
- ✅ `course_registration_windows` - Registration periods
- ✅ `course_schedules` - Course scheduling data
- ✅ `schedule_drafts` - Draft schedules
- ✅ `substitutions` - Teacher substitutions

## Security Model

### How It Works
1. **Users without MFA factors**: Normal access (AAL1 sufficient)
2. **Users with MFA factors**: MUST complete MFA (AAL2 required) to access protected tables
3. **Policy Type**: RESTRICTIVE (enforced in addition to existing RLS policies)

### MFA Check Function
All policies use the centralized `check_mfa_required()` function that:
- Returns `true` if user has no MFA factors OR has completed MFA (AAL2)
- Returns `false` if user has MFA factors but is in AAL1 session

### Access Pattern
```sql
-- Policy pattern applied to all protected tables
CREATE POLICY "mfa_enforce_aal2_[table_name]"
ON public.[table_name]
AS RESTRICTIVE
TO authenticated
USING (public.check_mfa_required());
```

## Deployment Instructions

### Prerequisites
1. Ensure `sql/supabase_official_mfa_hardening.sql` has been executed first
2. Verify the `check_mfa_required()` function exists

### Execute the Script
1. Open Supabase SQL Editor
2. Copy and execute `sql/comprehensive_mfa_hardening.sql`
3. Verify policies were created using the provided verification functions

### Verification Commands
```sql
-- List all MFA-protected tables
SELECT * FROM list_mfa_protected_tables();

-- Count total MFA policies
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%mfa_%' 
  AND permissive = 'RESTRICTIVE';
```

## Testing Requirements

### Test Scenarios
1. **No MFA User**: Should access all tables normally
2. **MFA User (AAL1)**: Should be blocked from accessing protected tables
3. **MFA User (AAL2)**: Should access all tables after completing MFA
4. **Admin Functions**: Verify admin-only access to sensitive tables like `change_log`

### Performance Testing
- Monitor query performance with new RESTRICTIVE policies
- Consider indexing on frequently queried columns if needed
- Test with realistic user loads

## Coverage Statistics
- **Total Database Tables**: 108
- **Protected Tables**: 45
- **Coverage Percentage**: 42%
- **Unprotected Tables**: 63 (mostly reference/structural data)

## Unprotected Tables (Reference Data)
The following 63 tables remain unprotected as they contain mostly reference or structural data:

### Structure Tables (9)
- `structure_classes`, `structure_days`, `structure_rooms`
- `structure_school_days`, `structure_school_semesters`, `structure_school_years`
- `structure_schools`

### System/Reference Tables (20+)
- `roles`, `document_types`, `registration_periods`
- `public_holiday_and_breaks`, `published_drafts`
- Debug tables: `debug_logs`, `recurrence_debug_log`, `schema_change_log`, etc.

### Auth/System Schemas (34)
- `auth.*` tables (16) - Managed by Supabase
- `realtime.*` tables (10) - Message queuing
- `storage.*` tables (7) - File storage
- Other system schemas

## Rollback Procedure
If issues arise, remove all MFA policies:

```sql
-- Remove all MFA RESTRICTIVE policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND policyname LIKE '%mfa_%' 
          AND permissive = 'RESTRICTIVE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;
```

## Security Impact Assessment
This comprehensive MFA implementation provides:
- **Strong Protection**: 42% of database tables require MFA
- **Graduated Security**: Critical data (PII, family relationships) fully protected
- **Operational Security**: Course management and scheduling protected
- **Flexibility**: Reference data remains accessible for normal operations
- **Performance Consideration**: RESTRICTIVE policies add query overhead but provide maximum security

## Maintenance
- Monitor policy performance regularly
- Review new tables added to database for MFA requirements
- Update policies when table structures change
- Audit MFA compliance through auth logs
