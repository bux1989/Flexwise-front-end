# vw_staff_availability_next_7_days

**Type:** View  
**Purpose:** Display teacher availability and schedule for the upcoming week  
**Depends on:** [teachers](../tables/teachers.md), [classes](../tables/classes.md), [teacher_availability](../tables/teacher_availability.md)

## Columns
| Name | Type | Notes |
|------|------|-------|
| teacher_id | uuid | Teacher identifier |
| teacher_name | text | Full name (first + last) |
| email | varchar(255) | Teacher's email address |
| day_date | date | Specific date within next 7 days |
| day_name | text | Name of day (Monday, Tuesday, etc.) |
| scheduled_classes | integer | Number of classes scheduled |
| available_hours | interval | Total available hours for the day |
| first_class_time | time | Start time of first class |
| last_class_time | time | End time of last class |
| availability_status | text | available, busy, partially_available |

## High-Level Logic
- Joins teachers with their class schedules for next 7 days
- Calculates available time slots between classes
- Aggregates scheduling information by teacher and day
- Filters for dates from today to 7 days ahead
- Considers teacher availability preferences

## Intended Usage
- Administrative scheduling and planning
- Substitute teacher assignment
- Parent-teacher conference scheduling
- Resource allocation reports

## Dependencies
- Tables: [teachers](../tables/teachers.md), [classes](../tables/classes.md), [teacher_availability](../tables/teacher_availability.md)
- Views: None
- Functions: None

## Example Queries
```sql
-- Get all teachers available tomorrow
SELECT * FROM vw_staff_availability_next_7_days
WHERE day_date = CURRENT_DATE + INTERVAL '1 day'
AND availability_status IN ('available', 'partially_available');

-- Find teachers with light schedules this week
SELECT teacher_name, day_date, scheduled_classes, available_hours
FROM vw_staff_availability_next_7_days
WHERE scheduled_classes <= 2
ORDER BY available_hours DESC;

-- Check specific teacher's availability
SELECT day_name, availability_status, scheduled_classes, available_hours
FROM vw_staff_availability_next_7_days
WHERE teacher_id = $1
ORDER BY day_date;
```

## Notes
- View refreshes automatically with underlying table changes
- Performance optimized for 7-day window queries
- Considers both class schedules and explicit availability settings