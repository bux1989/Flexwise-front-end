# Database Migration Index

This document tracks all database schema changes and migrations applied to the project in chronological order.

## Migration Files

### Table Schema Changes

| Date | File | Description | Tables Affected | Status |
|------|------|-------------|----------------|--------|
| 2025-08-29 | `add_updated_at_to_user_profiles.sql` | Add `updated_at` timestamp column with auto-update trigger | `user_profiles` | ✅ Applied |
| 2025-08-29 | `add_timestamps_to_profile_info_staff.sql` | Add `created_at` and `updated_at` timestamp columns with auto-update trigger | `profile_info_staff` | ✅ Applied |

### Function Changes

| Date | File | Description | Functions Affected | Status |
|------|------|-------------|-------------------|--------|
| 2025-08-29 | `save_user_profile_complete_react.sql` | Complete user profile saving function with surgical contact updates | `save_user_profile_complete_react()` | ✅ Applied |
| 2025-08-29 | `fix_jsonb_array_casting_save_user_profile.sql` | Fix JSONB array casting for skills and subjects_stud fields | `save_user_profile_complete_react()` | ✅ Applied |

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
