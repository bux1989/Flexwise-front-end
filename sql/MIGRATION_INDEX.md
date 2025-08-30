# Database Migration Index

This document tracks all database schema changes and migrations applied to the project in chronological order.

## Migration Files

### Table Schema Changes

| Date | File | Description | Tables Affected | Status |
|------|------|-------------|----------------|--------|
| 2025-08-29 | `add_updated_at_to_user_profiles.sql` | Add `updated_at` timestamp column with auto-update trigger | `user_profiles` | ✅ Applied |
| 2025-08-29 | `add_timestamps_to_profile_info_staff.sql` | Add `created_at` and `updated_at` timestamp columns with auto-update trigger | `profile_info_staff` | ✅ Applied |
| 2025-08-29 | `add_timestamps_to_contacts.sql` | Add `created_at` and `updated_at` timestamp columns with auto-update trigger | `contacts` | 🟡 Pending |

### Function Changes

| Date | File | Description | Functions Affected | Status |
|------|------|-------------|-------------------|--------|
| 2025-08-29 | `save_user_profile_complete_react.sql` | Complete user profile saving function with surgical contact updates | `save_user_profile_complete_react()` | ✅ Applied |
| 2025-08-29 | `fix_jsonb_array_casting_save_user_profile.sql` | Fix JSONB array casting for skills and subjects_stud fields | `save_user_profile_complete_react()` | ❌ Failed |
| 2025-08-29 | `fix_jsonb_array_handling_v2.sql` | Alternative fix using CASE statements for safer JSONB array handling | `save_user_profile_complete_react()` | ❌ Superseded |
| 2025-08-29 | `remove_subjects_stud_field.sql` | Remove subjects_stud field from function to fix profile saving | `save_user_profile_complete_react()` | ✅ Applied |

### MFA & Authentication Security

| Date | File | Description | Functions/Policies Affected | Status |
|------|------|-------------|------------------------------|--------|
| 2025-08-30 | `simple_mfa_enforcement.sql` | Initial MFA enforcement trigger (aggressive blocking) | `auth.enforce_mfa_for_verified_users()`, trigger on `auth.sessions` | 🟡 Superseded |
| 2025-08-30 | `fix_mfa_enforcement_trigger.sql` | Less aggressive MFA monitoring (logging only) | `auth.log_mfa_status()`, `log_mfa_status_trigger` | ✅ Applied |
| 2025-08-30 | `setup_self_hosted_mfa.sql` | Complete self-hosted MFA setup with audit hooks | `auth.enforce_mfa_for_verified_users()`, audit hooks | 🟡 Alternative |
| 2025-08-30 | `harden_mfa_aal2_requirements.sql` | Custom RLS policies requiring AAL2 for MFA users | Multiple table policies | 🟡 Superseded |
| 2025-08-30 | `supabase_official_mfa_hardening.sql` | **RECOMMENDED** Official Supabase MFA hardening with RESTRICTIVE policies | `public.check_mfa_required()`, RESTRICTIVE policies on critical tables | 🚀 **PENDING** |

### Authentication Methods Expansion

| Date | File | Description | Configuration Changes | Status |
|------|------|-------------|----------------------|--------|
| 2025-08-30 | N/A - Supabase Dashboard | OAuth Provider Configuration | Google, GitHub, Microsoft OAuth setup | 📋 **PLANNED** |
| 2025-08-30 | N/A - Supabase Dashboard | Magic Link Email Templates | Email OTP configuration | 📋 **PLANNED** |
| 2025-08-30 | `user_auth_preferences.sql` | User authentication method preferences (optional) | `user_auth_preferences` table | 📋 **OPTIONAL** |

## Migration Details

### Table Modifications

#### user_profiles
- **Added columns:**
  - `updated_at timestamp DEFAULT now()` - Automatically updated on row changes
- **Triggers:**
  - `update_user_profiles_updated_at` - Auto-updates `updated_at` column

#### profile_info_staff  
- **Added columns:**
  - `created_at timestamp DEFAULT now()` - Record creation timestamp
  - `updated_at timestamp DEFAULT now()` - Automatically updated on row changes
- **Triggers:**
  - `update_profile_info_staff_updated_at` - Auto-updates `updated_at` column

### Function Modifications

#### save_user_profile_complete_react()
- **Purpose:** Save complete user profile including staff info and contacts in a single transaction
- **Security:** Uses RLS policies, validates school_id from profile data
- **Key Features:**
  - Surgical contact updates (preserves `is_linked_to_user_login` and `created_at`)
  - Proper JSONB array handling for `skills` and `subjects_stud` fields
  - Comprehensive error handling and transaction safety
- **Parameters:**
  - `p_profile_id UUID` - User profile UUID
  - `p_profile_data JSONB` - Profile data (first_name, last_name, etc.)
  - `p_staff_data JSONB` - Staff data (skills, kurzung, subjects_stud)
  - `p_contacts JSONB` - Contacts array

### MFA Security Hardening

#### public.check_mfa_required() (Recommended)
- **Purpose:** Official Supabase pattern for checking MFA requirements
- **Logic:**
  - Users without MFA factors: Allow AAL1 or AAL2
  - Users with verified MFA factors: Require AAL2
- **Usage:** Used in RESTRICTIVE RLS policies across critical tables
- **Security:** Cannot be bypassed, enforced at database level

#### RESTRICTIVE Policies (Recommended Implementation)
Applied to critical tables:
- `user_profiles` - Core user data
- `contacts` - Sensitive contact information
- `school_settings` - Administrative settings
- `student_records` - Academic data
- `attendance_records` - Attendance tracking

**Benefits of RESTRICTIVE policies:**
- Enforced **in addition to** existing policies
- Cannot be overridden by other policies
- Work alongside school isolation policies
- More secure than regular policies

### Authentication Methods Infrastructure

#### OAuth Provider Setup (Supabase Dashboard)
**Required Configuration:**
- Google OAuth: Client ID/Secret, authorized domains
- GitHub OAuth: Client ID/Secret, callback URLs
- Microsoft OAuth: Client ID/Secret, tenant configuration
- Redirect URLs: `${domain}/auth/callback`

#### Magic Link Configuration (Supabase Dashboard)
**Email Template Setup:**
- Magic link template customization
- Redirect URL configuration
- Rate limiting settings
- Custom email styling

#### Optional: user_auth_preferences Table
```sql
CREATE TABLE user_auth_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_method text CHECK (preferred_method IN ('password', 'magic-link', 'oauth-google', 'oauth-github', 'oauth-microsoft')),
  remember_choice boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```
**Purpose:** Store user's preferred authentication method
**Alternative:** Can use localStorage instead for simpler implementation

## Migration Best Practices

1. **Always create migration files** for schema changes rather than running SQL directly
2. **Include rollback scripts** when possible
3. **Document the purpose** and impact of each migration
4. **Use descriptive filenames** with dates and purpose
5. **Test migrations** on development environment first
6. **Keep migrations atomic** - one logical change per file
7. **Add comments** to explain complex operations

## File Naming Convention

- Table schema changes: `YYYY-MM-DD_add_column_to_table.sql`
- Function changes: `YYYY-MM-DD_update_function_name.sql`
- Data migrations: `YYYY-MM-DD_migrate_data_description.sql`
- Bug fixes: `YYYY-MM-DD_fix_issue_description.sql`

## How to Apply Migrations

1. Review the migration file for any dependencies
2. Run in development environment first
3. Copy the SQL content from the migration file
4. Execute in database console/client
5. Update this index with the applied status
6. Commit changes to version control

## Rollback Procedures

For critical changes, create corresponding rollback scripts:
- `rollback_YYYY-MM-DD_description.sql`

Store rollback scripts in `sql/rollbacks/` directory.
