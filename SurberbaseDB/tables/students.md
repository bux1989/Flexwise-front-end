# students

**Type:** Table  
**Purpose:** Store student profile information and enrollment details  
**Schema:** public  
**Related:** [student_attendance_logs](../tables/student_attendance_logs.md), [class_enrollment](../tables/class_enrollment.md), [grades](../tables/grades.md)

## Columns
| Name | Type | PK | FK → | Not Null | Default | Notes |
|------|------|----|------|----------|---------|-------|
| id | uuid | ✅ | - | ✅ | uuid_generate_v4() | Primary key |
| student_number | varchar(20) | - | - | ✅ | - | Unique student identifier |
| first_name | varchar(100) | - | - | ✅ | - | Student's first name |
| last_name | varchar(100) | - | - | ✅ | - | Student's last name |
| email | varchar(255) | - | - | - | - | Student email address |
| phone | varchar(20) | - | - | - | - | Contact phone number |
| date_of_birth | date | - | - | - | - | Student's birth date |
| grade_level | integer | - | - | ✅ | - | Current grade level (1-12) |
| enrollment_date | date | - | - | ✅ | CURRENT_DATE | Date of enrollment |
| status | student_status | - | - | ✅ | 'active' | active, inactive, graduated, transferred |
| guardian_name | varchar(200) | - | - | - | - | Primary guardian/parent name |
| guardian_phone | varchar(20) | - | - | - | - | Guardian contact number |
| guardian_email | varchar(255) | - | - | - | - | Guardian email address |
| emergency_contact | varchar(200) | - | - | - | - | Emergency contact information |
| medical_notes | text | - | - | - | - | Medical alerts or special needs |
| created_at | timestamptz | - | - | ✅ | now() | Record creation timestamp |
| updated_at | timestamptz | - | - | ✅ | now() | Last update timestamp |

## Keys & Constraints
- PK: id
- Unique: student_number
- Unique: email (where email IS NOT NULL)
- Check: grade_level >= 1 AND grade_level <= 12
- Check: status IN ('active', 'inactive', 'graduated', 'transferred')
- Check: enrollment_date <= CURRENT_DATE

## Indexes
- `idx_students_number` on (student_number) – purpose: fast lookup by student number
- `idx_students_name` on (last_name, first_name) – purpose: name-based searches
- `idx_students_email` on (email) – purpose: email lookups
- `idx_students_grade_status` on (grade_level, status) – purpose: class assignment queries

## RLS
- Enabled: Yes
- Policies:
  - `students_select_policy` (SELECT): `auth.uid() IN (SELECT user_id FROM student_users WHERE student_id = students.id) OR auth.uid() IN (SELECT user_id FROM teachers) OR auth.uid() IN (SELECT user_id FROM admin_users)` – intent: students can see their own record, teachers and admins can see all
  - `students_update_policy` (UPDATE): `auth.uid() IN (SELECT user_id FROM admin_users)` – intent: only admins can update student records

## Triggers
- `update_students_timestamp` BEFORE UPDATE → `update_updated_at_column`
- `validate_student_data` BEFORE INSERT/UPDATE → `validate_student_information`
- `log_student_changes` AFTER UPDATE → `audit_student_changes`

## Dependencies
- Writes to: audit_log
- Reads from: None (base table)
- Referenced by: [student_attendance_logs](../tables/student_attendance_logs.md), [class_enrollment](../tables/class_enrollment.md), [grades](../tables/grades.md), [student_summary_view](../views/student_summary_view.md)

## Example Queries
```sql
-- Find students by name (partial match)
SELECT * FROM students
WHERE (first_name ILIKE '%john%' OR last_name ILIKE '%smith%')
AND status = 'active';

-- Get all students in a specific grade
SELECT student_number, first_name, last_name, email
FROM students
WHERE grade_level = 10
AND status = 'active'
ORDER BY last_name, first_name;

-- Find students needing emergency contact updates
SELECT id, first_name, last_name, student_number
FROM students
WHERE (emergency_contact IS NULL OR emergency_contact = '')
AND status = 'active';

-- Get student enrollment statistics by grade
SELECT 
    grade_level,
    COUNT(*) as total_students,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_students
FROM students
GROUP BY grade_level
ORDER BY grade_level;
```

## Notes

* Student numbers must be unique across the entire system
* Email addresses are optional but must be unique when provided
* Medical notes should be treated with extra privacy consideration
* Grade level determines class eligibility and scheduling
* RLS ensures students can only access their own records