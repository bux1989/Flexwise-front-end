# classes

**Type:** Table  
**Purpose:** Store information about individual class sessions and schedules  
**Schema:** public  
**Related:** [students](../tables/students.md), [teachers](../tables/teachers.md), [subjects](../tables/subjects.md), [class_enrollment](../tables/class_enrollment.md)

## Columns
| Name | Type | PK | FK → | Not Null | Default | Notes |
|------|------|----|------|----------|---------|-------|
| id | uuid | ✅ | - | ✅ | uuid_generate_v4() | Primary key |
| subject_id | uuid | - | subjects.id | ✅ | - | Foreign key to subjects |
| teacher_id | uuid | - | teachers.id | ✅ | - | Primary teacher for this class |
| class_name | varchar(255) | - | - | ✅ | - | Human-readable class name |
| description | text | - | - | - | - | Class description |
| schedule_day | integer | - | - | ✅ | - | Day of week (0=Sunday, 6=Saturday) |
| start_time | time | - | - | ✅ | - | Class start time |
| end_time | time | - | - | ✅ | - | Class end time |
| room_number | varchar(50) | - | - | - | - | Classroom location |
| max_students | integer | - | - | - | 30 | Maximum enrollment |
| active | boolean | - | - | ✅ | true | Whether class is currently active |
| semester | varchar(20) | - | - | ✅ | - | Academic semester/term |
| created_at | timestamptz | - | - | ✅ | now() | Record creation timestamp |
| updated_at | timestamptz | - | - | ✅ | now() | Last update timestamp |

## Keys & Constraints
- PK: id
- Unique: (teacher_id, schedule_day, start_time, semester)
- Check: start_time < end_time
- Check: schedule_day >= 0 AND schedule_day <= 6
- Check: max_students > 0

## Indexes
- `idx_classes_teacher` on (teacher_id) – purpose: find classes by teacher
- `idx_classes_schedule` on (schedule_day, start_time) – purpose: schedule lookups
- `idx_classes_subject` on (subject_id) – purpose: find classes by subject
- `idx_classes_active_semester` on (active, semester) – purpose: filter active classes

## RLS
- Enabled: Yes
- Policies:
  - `classes_select_policy` (SELECT): `auth.uid() IN (SELECT user_id FROM teachers WHERE id = classes.teacher_id) OR auth.uid() IN (SELECT user_id FROM student_users su JOIN class_enrollment ce ON su.student_id = ce.student_id WHERE ce.class_id = classes.id)` – intent: teachers can see their classes, students can see enrolled classes
  - `classes_update_policy` (UPDATE): `auth.uid() IN (SELECT user_id FROM teachers WHERE id = classes.teacher_id)` – intent: only assigned teacher can update class

## Triggers
- `update_classes_timestamp` BEFORE UPDATE → `update_updated_at_column`
- `validate_schedule_conflicts` BEFORE INSERT/UPDATE → `check_schedule_conflicts`

## Dependencies
- Writes to: audit_log
- Reads from: subjects, teachers
- Referenced by: [class_enrollment](../tables/class_enrollment.md), [student_attendance_logs](../tables/student_attendance_logs.md), [weekly_schedule_view](../views/weekly_schedule_view.md)

## Example Queries
```sql
-- Get all active classes for current semester
SELECT c.*, s.subject_name, t.first_name || ' ' || t.last_name as teacher_name
FROM classes c
JOIN subjects s ON c.subject_id = s.id
JOIN teachers t ON c.teacher_id = t.id
WHERE c.active = true AND c.semester = 'Fall2024';

-- Find classes for a specific day and time range
SELECT * FROM classes
WHERE schedule_day = 1 -- Monday
AND start_time >= '09:00'
AND end_time <= '17:00'
AND active = true;

-- Get class enrollment count
SELECT c.class_name, COUNT(ce.student_id) as enrolled_count, c.max_students
FROM classes c
LEFT JOIN class_enrollment ce ON c.id = ce.class_id
WHERE c.active = true
GROUP BY c.id, c.class_name, c.max_students;
```

## Notes

* Schedule conflicts are prevented by trigger validation
* Classes are tied to specific semesters for historical tracking
* RLS ensures students only see classes they're enrolled in
* Consider archiving old semester data for performance