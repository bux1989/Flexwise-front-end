# idx_attendance_student_date

**Type:** Index  
**Table:** [student_attendance_logs](../tables/student_attendance_logs.md)  
**Index Type:** B-tree  
**Columns:** (student_id, attendance_date)

## Index Definition
```sql
CREATE INDEX idx_attendance_student_date 
ON student_attendance_logs (student_id, attendance_date);
```

## Purpose
Optimizes queries that look up attendance records for specific students on specific dates or date ranges.

## Use Cases
- Student attendance history queries
- Generating individual student reports
- Checking if attendance already recorded for a student/date
- Date range queries for attendance analysis

## Performance Impact
- **Query Speed**: Dramatically improves performance for student-specific attendance lookups
- **Storage**: Minimal overhead (~8 bytes per row for UUID + date)
- **Maintenance**: Low maintenance cost, efficient for inserts

## Example Optimized Queries
```sql
-- Fast lookup for specific student and date
SELECT * FROM student_attendance_logs 
WHERE student_id = $1 AND attendance_date = $2;

-- Student attendance for date range
SELECT * FROM student_attendance_logs 
WHERE student_id = $1 
AND attendance_date BETWEEN $2 AND $3;
```

## Dependencies
- Table: [student_attendance_logs](../tables/student_attendance_logs.md)

## Notes
- Most frequently used index for attendance queries
- Supports both equality and range scans efficiently
- Consider partial index if filtering by status is common