# Flexwise Documentation

## Database Documentation

### 📖 [Database Schema Reference](./database-schema.md)
Comprehensive documentation of all database tables, relationships, and patterns for Supabase integration. Includes:

- **Core Tables**: user_profiles, roles, structure_schools, etc.
- **Authentication Pattern**: How Supabase auth connects to user profiles
- **Attendance System**: Daily logs, lesson attendance, absence notes
- **Family Management**: Parent-child relationships and permissions  
- **Course System**: Lessons, enrollments, schedules
- **Common Query Patterns**: Ready-to-use SQL examples
- **Security Notes**: RLS, multi-tenancy, access patterns

### 🔧 [TypeScript Types](../types/database.ts)
Strongly-typed interfaces for all database tables and common operations:

- **Core Interfaces**: UserProfile, Role, StructureSchool, etc.
- **Enums**: AccountStatus, AttendanceStatus, PresenceStatus, etc.
- **Joined Types**: UserProfileWithRole, LessonWithDetails, etc.
- **API Response Types**: AttendanceSummary, DailyAttendanceSummary, etc.
- **Form Types**: CreateUserProfilePayload, AttendanceSubmission, etc.

## Usage Examples

### Import Types
```typescript
import type { 
  UserProfile, 
  AttendanceStatus, 
  StudentAttendanceLog,
  LessonWithDetails 
} from '../types/database';
```

### Use with Supabase
```typescript
import { supabase } from './lib/supabase';
import type { UserProfile } from '../types/database';

const { data: profiles } = await supabase
  .from('user_profiles')
  .select('*')
  .returns<UserProfile[]>();
```

### Common Auth Queries
```typescript
// Get current user profile with role
const { data: profile } = await supabase
  .from('user_profiles')
  .select(`
    *,
    roles(name)
  `)
  .eq('id', profileId)
  .single()
  .returns<UserProfileWithRole>();
```

## Quick Reference

### Key Auth Functions (Available in Database)
- `auth.get_profile_id()` - Get current user's profile ID
- `auth.get_user_school_id()` - Get current user's school
- `auth.get_user_role()` - Get current user's role name
- `auth.get_accessible_children()` - Get children user can access (parents)
- `auth.get_accessible_class_ids()` - Get classes user can access

### Security Pattern
All tables use `school_id` for multi-tenant data isolation. Most queries should:
1. Filter by `school_id = auth.get_user_school_id()`
2. Use `auth.get_profile_id()` for user-specific data
3. Respect family access controls for parent-child relationships

### Common Table Relationships
```
user_profiles (hub)
├── roles (role_id)
├── user_roles (many-to-many)
├── structure_schools (school_id)
├── family_members (family relationships)
├── student_daily_log (daily attendance)
├── student_attendance_logs (lesson attendance)
└── course_enrollments (course assignments)
```

---

*This documentation is based on the SQL dump from `Superbase DB/flexwise28082025dump.sql` and will be updated as the schema evolves.*
