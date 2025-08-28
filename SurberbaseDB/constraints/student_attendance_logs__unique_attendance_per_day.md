# student_attendance_logs__unique_attendance_per_day

**Type:** Constraint  
**Table:** [student_attendance_logs](../tables/student_attendance_logs.md)  
**Constraint Type:** UNIQUE  
**Columns:** (student_id, class_id, attendance_date)

## Constraint Definition
```sql
ALTER TABLE student_attendance_logs 
ADD CONSTRAINT unique_attendance_per_day 
UNIQUE (student_id, class_id, attendance_date);
```

## Purpose
Prevents duplicate attendance records for the same student, class, and date combination.

## Business Rules
- Only one attendance record per student per class per day
- Prevents accidental duplicate entries
- Ensures attendance data integrity
- Supports attendance correction workflows (update existing rather than insert new)

## Impact
- **Data Integrity**: Eliminates duplicate attendance entries
- **Performance**: Creates composite index for efficient lookups
- **Applications**: Enforces "upsert" pattern for attendance recording
- **Reporting**: Ensures accurate attendance calculations

## Error Handling
```sql
-- Example violation
INSERT INTO student_attendance_logs (student_id, class_id, attendance_date, status) 
VALUES ('student-uuid', 'class-uuid', '2024-08-28', 'present');

-- Trying to insert again for same student/class/date
INSERT INTO student_attendance_logs (student_id, class_id, attendance_date, status) 
VALUES ('student-uuid', 'class-uuid', '2024-08-28', 'late');
-- ERROR: duplicate key value violates unique constraint "unique_attendance_per_day"
```

## Dependencies
- Table: [student_attendance_logs](../tables/student_attendance_logs.md)

## Notes
- Applications should use INSERT ... ON CONFLICT UPDATE for attendance updates
- Critical for maintaining attendance data quality
- Supports efficient "check if already recorded" queries
- Works with foreign key constraints to ensure referenced entities exist