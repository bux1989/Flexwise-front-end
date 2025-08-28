# daily_attendance_report(report_date date, class_id uuid)

**Type:** Function (LANGUAGE plpgsql, SECURITY DEFINER)  
**Purpose:** Generate comprehensive daily attendance report for a specific class  
**Inputs:** report_date (date), class_id (uuid)  
**Returns:** TABLE(student_name text, student_number varchar, status attendance_status, check_in_time timestamptz, notes text)

## Behavior
- Reads: [student_attendance_logs](../tables/student_attendance_logs.md), [students](../tables/students.md), [class_enrollment](../tables/class_enrollment.md)
- Writes: None (read-only function)
- Called by: Daily attendance reports, teacher dashboard, administrative queries

## Example
```sql
-- Get today's attendance for Math 101
SELECT * FROM daily_attendance_report(CURRENT_DATE, 'abc123-def456-...');

-- Get attendance for specific date
SELECT * FROM daily_attendance_report('2024-08-28', 'abc123-def456-...');
```

## Dependencies
- Tables: [student_attendance_logs](../tables/student_attendance_logs.md), [students](../tables/students.md), [class_enrollment](../tables/class_enrollment.md)
- Views: None
- Functions: None

## Notes
- SECURITY DEFINER allows teachers to access attendance data
- Returns all enrolled students, marking missing attendance as 'not_recorded'
- Optimized for daily operations with minimal overhead