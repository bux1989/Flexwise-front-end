# Quick Reference Guide

Essential queries and patterns for working with the Flexwise Supabase database.

## Key Authentication Functions

```sql
-- Get current user's school ID
SELECT auth.get_current_user_school_id();

-- Get current user's role
SELECT auth.get_user_role();

-- Get accessible children for current user
SELECT auth.get_accessible_children();

-- Get current user ID
SELECT auth.uid();
```

## Common Table Joins

### Student with Class Information
```sql
SELECT 
    up.first_name, 
    up.last_name,
    sc.name as class_name,
    pis.date_of_birth
FROM user_profiles up
JOIN profile_info_student pis ON up.id = pis.profile_id
JOIN structure_classes sc ON pis.class_id = sc.id
WHERE up.school_id = auth.get_current_user_school_id();
```

### Course Enrollment Details
```sql
SELECT 
    cl.name as course_name,
    up.first_name || ' ' || up.last_name as student_name,
    ce.start_date,
    ce.end_date
FROM course_enrollments ce
JOIN course_list cl ON ce.course_id = cl.id
JOIN user_profiles up ON ce.student_id = up.id
WHERE ce.school_id = auth.get_current_user_school_id();
```

### Daily Attendance Summary
```sql
SELECT 
    date_trunc('day', sal.timestamp) as attendance_date,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE sal.status = 'present') as present_count,
    COUNT(*) FILTER (WHERE sal.status = 'absent') as absent_count
FROM student_attendance_logs sal
WHERE sal.school_id = auth.get_current_user_school_id()
    AND sal.timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date_trunc('day', sal.timestamp)
ORDER BY attendance_date DESC;
```

## Key Business Logic Functions

### Add Student Absence
```sql
-- Simple absence
SELECT public.add_student_absence(
    p_student_id := 'student-uuid',
    p_school_id := auth.get_current_user_school_id(),
    p_start_date := '2025-08-29',
    p_reason := 'Krankmeldung'
);

-- Absence with specific times and recurrence
SELECT public.add_student_absence_with_times_and_recurrence(
    p_student_id := 'student-uuid',
    p_school_id := auth.get_current_user_school_id(),
    p_absence_date := '2025-08-29',
    p_from_time := '08:00',
    p_to_time := '12:00',
    p_reason := 'Arzttermin',
    p_excused := true
);
```

### Family Contact Management
```sql
-- Add contact for all children in family
SELECT public.add_family_contact_for_all_children(
    in_family_id := 'family-uuid',
    in_first_name := 'Maria',
    in_last_name := 'Mustermann',
    in_relationship := 'Mutter',
    in_authorized_for_pickup := true
);
```

## Important Views for Dashboards

### Attendance Dashboard
```sql
-- Use the pre-built attendance dashboard view
SELECT * FROM vw_attendance_dashboard 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Today's Class Check-ins
```sql
SELECT * FROM vw_class_checkins_today;
```

### Staff Availability
```sql
SELECT * FROM vw_staff_availability_next_7_days;
```

### Course Schedules
```sql
SELECT * FROM vw_course_schedules_detailed
WHERE start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE;
```

## Security Patterns

### Row-Level Security
All queries automatically filter by school through RLS policies:
```sql
-- This automatically filters to user's school
SELECT * FROM user_profiles;

-- RLS ensures users only see their school's data
SELECT * FROM student_attendance_logs;
```

### Role-Based Access
```sql
-- Check if user has specific role
SELECT EXISTS(
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_profile_id = auth.uid()
        AND r.name = 'teacher'
);
```

## Data Types & Enums

### Account Status
- `none` - No login account
- `invited` - Invited but not activated  
- `active` - Active account
- `suspended` - Temporarily disabled
- `deleted` - Marked for deletion

### Attendance Status
- `present` - Student present
- `absent` - Student absent
- `late` - Student late
- `excused` - Excused absence

### German Language Fields
Many fields use German terms:
- `unentschuldigt` - Unexcused
- `entschuldigt` - Excused  
- `Ganzer Tag` - Whole day
- `Zeitfenster` - Time window
- `Mehrere Tage` - Multiple days

## Performance Tips

### Use Materialized Views
```sql
-- Fast user login data
SELECT * FROM vwm_user_login_profiles;

-- Cached semester data  
SELECT * FROM vwm_school_semesters_with_year_label;
```

### Index Usage
The database includes strategic indexes:
- `student_attendance_logs` indexed by student_id and date
- `course_applications` unique index per window
- `user_roles` indexed by user_profile_id

### Efficient Counting
```sql
-- Use COUNT(*) FILTER for conditional aggregation
SELECT 
    class_id,
    COUNT(*) as total_students,
    COUNT(*) FILTER (WHERE account_status = 'active') as active_students
FROM user_profiles up
JOIN profile_info_student pis ON up.id = pis.profile_id
GROUP BY class_id;
```

## Error Handling

### Common Constraints
- School isolation: All data must belong to user's school
- Date validations: Start dates before end dates
- Unique constraints: One priority 1 contact per family
- Check constraints: Valid enum values

### Function Return Types
Many functions return JSON with status information:
```sql
-- Example return format
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed"
}
```

---

*This guide covers the most common patterns. Refer to individual table/view documentation for detailed schemas.*