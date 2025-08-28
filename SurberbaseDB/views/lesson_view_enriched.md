# lesson_view_enriched

**Type:** View  
**Purpose:** Comprehensive lesson information with attendance and performance metrics  
**Depends on:** [classes](../tables/classes.md), [student_attendance_logs](../tables/student_attendance_logs.md), [subjects](../tables/subjects.md), [teachers](../tables/teachers.md)

## Columns
| Name | Type | Notes |
|------|------|-------|
| class_id | uuid | Class identifier |
| class_name | varchar(255) | Human-readable class name |
| subject_name | varchar(255) | Subject being taught |
| teacher_name | text | Full teacher name |
| schedule_day | integer | Day of week (0-6) |
| start_time | time | Class start time |
| end_time | time | Class end time |
| room_number | varchar(50) | Classroom location |
| total_enrolled | bigint | Number of enrolled students |
| avg_attendance_rate | numeric | Average attendance percentage |
| recent_attendance | bigint | Attendance count for last session |
| last_session_date | date | Most recent class date |
| semester | varchar(20) | Academic term |

## High-Level Logic
- Joins classes with subjects and teachers for complete context
- Calculates enrollment counts from class_enrollment table
- Computes attendance statistics from attendance logs
- Aggregates recent session data for quick insights
- Provides performance metrics at class level

## Intended Usage
- Teacher dashboard with class performance overview
- Administrative reporting on class effectiveness
- Student portal showing class details with context
- Analytics for curriculum planning

## Dependencies
- Tables: [classes](../tables/classes.md), [subjects](../tables/subjects.md), [teachers](../tables/teachers.md), [student_attendance_logs](../tables/student_attendance_logs.md), [class_enrollment](../tables/class_enrollment.md)
- Views: None
- Functions: None

## Example Queries
```sql
-- Get enriched view of all active classes
SELECT * FROM lesson_view_enriched
WHERE semester = 'Fall2024'
ORDER BY avg_attendance_rate DESC;

-- Find classes with low attendance
SELECT class_name, teacher_name, avg_attendance_rate, total_enrolled
FROM lesson_view_enriched
WHERE avg_attendance_rate < 0.80
AND total_enrolled > 5;

-- Teacher's class overview
SELECT class_name, schedule_day, start_time, total_enrolled, avg_attendance_rate
FROM lesson_view_enriched
WHERE teacher_name LIKE '%Smith%'
ORDER BY schedule_day, start_time;
```

## Notes
- Attendance rate calculated over last 30 days for relevance
- Performance metrics updated nightly for efficiency
- Useful for identifying classes needing attention