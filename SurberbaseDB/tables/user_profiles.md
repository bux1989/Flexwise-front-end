# user_profiles Table

Central table for managing all user accounts (students, staff, parents, administrators) in the Flexwise school management system.

## Table Structure

```sql
CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    first_name text,
    last_name text,
    date_of_birth date,
    gender text,
    profile_picture_url text,
    role_id uuid,
    account_status public.account_status_enum DEFAULT 'none'::public.account_status_enum NOT NULL
);
```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key, auto-generated |
| `school_id` | uuid | Foreign key to structure_schools table (required) |
| `created_at` | timestamp | Account creation timestamp |
| `first_name` | text | User's first name |
| `last_name` | text | User's last name |
| `date_of_birth` | date | Date of birth (for identity verification) |
| `gender` | text | Gender identity |
| `profile_picture_url` | text | URL to profile photo |
| `role_id` | uuid | Primary role assignment |
| `account_status` | account_status_enum | Current account state |

## Account Status Enum

The `account_status` field tracks the lifecycle of user accounts:

| Status | Description |
|--------|-------------|
| `none` | Default status, no login account created |
| `invited` | User has been invited but hasn't activated account |
| `active` | Account is active and user can log in |
| `suspended` | Account temporarily disabled |
| `deleted` | Account marked for deletion |

*Comment from schema: "Tracks the current state of a linked login account (e.g. invited, active, deleted)."*

## Key Features

### Universal User Model
This table serves as the base for all user types:
- **Students**: Extended by `profile_info_student`
- **Staff**: Extended by `profile_info_staff`  
- **Family Members**: Extended by `family_members`
- **Administrators**: Role-based access through `user_roles`

### Multi-School Support
- Every user belongs to exactly one school (`school_id`)
- Enables multi-tenant architecture
- Data isolation between schools

### Identity Verification
- `date_of_birth` used for secure account verification
- Helps prevent unauthorized access
- Required for password reset flows

### Role-Based Access
- Primary role assignment via `role_id`
- Additional roles possible through `user_roles` table
- Flexible permission system

## Relationships

### Core Extensions (1:1)
- `profile_info_student` - Student-specific details
- `profile_info_staff` - Staff-specific details
- `family_members` - Family member details

### Role & Permission Management
- **Belongs to**: `structure_schools` (via school_id)
- **Belongs to**: `roles` (via role_id)
- **Has many**: `user_roles` (additional role assignments)

### Activity & Audit
- **Has many**: `student_attendance_logs` (as student_id)
- **Has many**: `course_applications` (as student_id)
- **Has many**: `change_log` (as user making changes)

### Family & Relationships
- **Has many**: `family_member_child_links` (as child or parent)
- **Has many**: `contacts` (contact information)

## Usage Patterns

### Account Creation Flow
1. Create `user_profiles` record with basic info
2. Set `account_status` to 'none'
3. Create role-specific profile (student/staff/family)
4. Send invitation → status becomes 'invited'
5. User activates → status becomes 'active'

### Identity Verification
- Login with email/username
- Verify date of birth for account recovery
- Multi-factor authentication support

### Role Management
- Primary role via `role_id`
- Additional roles via `user_roles` table
- School-specific role assignments

## Security Considerations

### Data Protection
- Date of birth is sensitive (GDPR/FERPA)
- Profile pictures need secure storage
- Account status controls access

### Access Control
- School isolation via `school_id`
- Role-based permissions
- Account status enforcement

### Audit Requirements
- Creation timestamps for compliance
- Account status changes tracked
- Role assignment audit trail

## Related Tables

### Direct Extensions
- `profile_info_student` - Student details
- `profile_info_staff` - Staff details
- `family_members` - Family member details

### Role & Permission System
- `roles` - Role definitions
- `user_roles` - Additional role assignments
- `user_groups` - Group memberships

### Activity Tracking
- `student_attendance_logs` - Attendance records
- `course_applications` - Course applications
- `lesson_diary_entries` - Teaching records

## Common Queries

### Get User with Role
```sql
SELECT up.*, r.name as role_name
FROM user_profiles up
JOIN roles r ON up.role_id = r.id
WHERE up.school_id = ?
```

### Active Students in School
```sql
SELECT up.*, pis.*
FROM user_profiles up
JOIN profile_info_student pis ON up.id = pis.profile_id
WHERE up.school_id = ? 
  AND up.account_status = 'active'
```

### Staff Directory
```sql
SELECT up.*, pis.*
FROM user_profiles up
JOIN profile_info_staff pis ON up.id = pis.profile_id
WHERE up.school_id = ?
```

## Related Views

- `vw_student_profiles` - Student profile information
- `vw_staff` - Staff directory
- `vw_family_all_members` - Family member details
- `vw_user_roles` - User role information
- `vwm_user_login_profiles` - Login profile cache

This table is fundamental to the entire system, providing the user identity foundation that all other features build upon.