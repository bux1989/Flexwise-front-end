# student_attendance_logs

**Type:** Table  
**Purpose:** Tracks student presence, movement, and participation in classes  
**Schema:** public  
**Related:** [classes](../tables/classes.md), [students](../tables/students.md), [lesson_view_enriched](../views/lesson_view_enriched.md)

## Columns
| Name | Type | PK | FK → | Not Null | Default | Notes |
|------|------|----|------|----------|---------|-------|
| id | uuid | ✅ | - | ✅ | uuid_generate_v4() | Primary key |
| student_id | uuid | - | students.id | ✅ | - | Foreign key to students |
| class_id | uuid | - | classes.id | ✅ | - | Foreign key to classes |
| attendance_date | date | - | - | ✅ | - | Date of attendance |
| status | attendance_status | - | - | ✅ | 'present' | present, absent, late, excused |
| check_in_time | timestamptz | - | - | - | - | Actual arrival time |
| check_out_time | timestamptz | - | - | - | - | Departure time |
| notes | text | - | - | - | - | Additional notes about attendance |
| created_at | timestamptz | - | - | ✅ | now() | Record creation timestamp |
| updated_at | timestamptz | - | - | ✅ | now() | Last update timestamp |

## Keys & Constraints
- PK: id
- Unique: (student_id, class_id, attendance_date)
- Check: check_in_time <= check_out_time
- Check: status IN ('present', 'absent', 'late', 'excused')

## Indexes
- `idx_attendance_student_date` on (student_id, attendance_date) – purpose: fast lookups by student and date
- `idx_attendance_class_date` on (class_id, attendance_date) – purpose: class roll calls
- `idx_attendance_status` on (status) – purpose: filtering by attendance status

## RLS
- Enabled: Yes
- Policies:
  - `attendance_select_policy` (SELECT): `auth.uid() IN (SELECT user_id FROM student_users WHERE student_id = student_attendance_logs.student_id) OR auth.uid() IN (SELECT user_id FROM teacher_classes WHERE class_id = student_attendance_logs.class_id)` – intent: students can see their own attendance, teachers can see their class attendance
  - `attendance_insert_policy` (INSERT): `auth.uid() IN (SELECT user_id FROM teacher_classes WHERE class_id = student_attendance_logs.class_id)` – intent: only teachers can record attendance

## Triggers
- `update_attendance_timestamp` BEFORE UPDATE → `update_updated_at_column`
- `log_attendance_changes` AFTER INSERT/UPDATE/DELETE → `audit_attendance_changes`

## Dependencies
- Writes to: audit_log
- Reads from: students, classes, teacher_classes
- Referenced by: [attendance_summary_view](../views/attendance_summary_view.md), [daily_attendance_report](../functions/daily_attendance_report.md)

## Example Queries
```sql
-- Get today's attendance for a specific class
SELECT sal.*, s.first_name, s.last_name
FROM student_attendance_logs sal
JOIN students s ON sal.student_id = s.id
WHERE sal.class_id = $1 
AND sal.attendance_date = CURRENT_DATE;

-- Mark student as present
INSERT INTO student_attendance_logs (student_id, class_id, attendance_date, status, check_in_time)
VALUES ($1, $2, CURRENT_DATE, 'present', NOW());

-- Get attendance summary for a student
SELECT 
    COUNT(*) as total_days,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days
FROM student_attendance_logs
WHERE student_id = $1 
AND attendance_date >= $2 
AND attendance_date <= $3;
```

## Notes

* Attendance records are immutable once created (only status can be updated within same day)
* Check-in/out times are optional for basic attendance tracking
* RLS ensures data privacy between students and classes
* Consider partitioning by attendance_date for better performance with large datasets