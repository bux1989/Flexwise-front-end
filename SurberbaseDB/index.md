# Flexwise Supabase Database Documentation

## Overview

This documentation provides comprehensive coverage of the Flexwise school management system database schema. The database supports core educational functionality including student management, class scheduling, attendance tracking, and teacher administration.

### Architecture

The Flexwise database follows a normalized relational design with the following key principles:

- **Row Level Security (RLS)**: All tables implement appropriate access controls
- **Audit Trails**: Comprehensive logging of data changes
- **Data Integrity**: Foreign keys, constraints, and validation ensure data quality
- **Performance**: Strategic indexing for common query patterns
- **Extensibility**: Modular design supporting future feature additions

### Schema Diagram

![Schema Diagram](schema-diagram.png)

*The diagram shows the relationships between major entities in the system.*

## Tables of Contents

### Tables
| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| [classes](tables/classes.md) | Store class schedules and information | → subjects, teachers |
| [schedule_periods](tables/schedule_periods.md) | Define standardized time periods for scheduling | ← classes, bell_schedule |
| [students](tables/students.md) | Student profile and enrollment data | ← class_enrollment, attendance_logs |
| [student_attendance_logs](tables/student_attendance_logs.md) | Track daily attendance records | → students, classes |
| [subjects](tables/subjects.md) | Store subject/course information and requirements | ← classes, curriculum |

### Views
| View | Purpose | Data Sources |
|------|---------|--------------|
| [lesson_view_enriched](views/lesson_view_enriched.md) | Comprehensive class info with metrics | classes, subjects, teachers, attendance |
| [vw_staff_availability_next_7_days](views/vw_staff_availability_next_7_days.md) | Teacher scheduling and availability | teachers, classes, teacher_availability |

### Functions
| Function | Purpose | Usage |
|----------|---------|-------|
| [daily_attendance_report](functions/daily_attendance_report.md) | Generate daily attendance reports | Reporting, teacher dashboard |
| [update_updated_at_column](functions/update_updated_at_column.md) | Timestamp maintenance trigger function | Audit trails |

### Triggers
| Trigger | Table | Purpose |
|---------|-------|---------|
| [log_attendance_changes](triggers/log_attendance_changes.md) | student_attendance_logs | Audit trail for attendance changes |
| [update_students_timestamp](triggers/update_students_timestamp.md) | students | Maintain updated_at timestamps |

### RLS Policies
| Policy | Table | Access Control |
|--------|-------|----------------|
| [students__students_select_policy](policies/students__students_select_policy.md) | students | Role-based read access |
| [student_attendance_logs__attendance_insert_policy](policies/student_attendance_logs__attendance_insert_policy.md) | student_attendance_logs | Teacher-only attendance creation |

### Indexes
| Index | Table | Performance Benefit |
|-------|-------|-------------------|
| [idx_attendance_student_date](indexes/idx_attendance_student_date.md) | student_attendance_logs | Fast student attendance lookups |
| [idx_classes_schedule](indexes/idx_classes_schedule.md) | classes | Schedule-based queries |

### Constraints
| Constraint | Table | Data Integrity Rule |
|------------|-------|-------------------|
| [students__unique_student_number](constraints/students__unique_student_number.md) | students | Unique student identification |
| [student_attendance_logs__unique_attendance_per_day](constraints/student_attendance_logs__unique_attendance_per_day.md) | student_attendance_logs | One attendance record per student/class/day |

## A-Z Object Directory

### A
- [attendance_insert_policy](policies/student_attendance_logs__attendance_insert_policy.md) - RLS policy controlling attendance record creation

### C
- [classes](tables/classes.md) - Core table storing class schedules and information

### D
- [daily_attendance_report](functions/daily_attendance_report.md) - Function generating comprehensive daily attendance reports

### I
- [idx_attendance_student_date](indexes/idx_attendance_student_date.md) - Index optimizing student attendance queries
- [idx_classes_schedule](indexes/idx_classes_schedule.md) - Index supporting schedule-based lookups

### L
- [lesson_view_enriched](views/lesson_view_enriched.md) - View providing comprehensive lesson information with metrics
- [log_attendance_changes](triggers/log_attendance_changes.md) - Trigger maintaining attendance change audit trail

### S
- [schedule_periods](tables/schedule_periods.md) - Table defining standardized time periods for class scheduling
- [student_attendance_logs](tables/student_attendance_logs.md) - Table tracking daily student attendance
- [students](tables/students.md) - Core table storing student profile information
- [students__students_select_policy](policies/students__students_select_policy.md) - RLS policy for student data access
- [students__unique_student_number](constraints/students__unique_student_number.md) - Constraint ensuring unique student identifiers
- [student_attendance_logs__attendance_insert_policy](policies/student_attendance_logs__attendance_insert_policy.md) - RLS policy for attendance creation
- [student_attendance_logs__unique_attendance_per_day](constraints/student_attendance_logs__unique_attendance_per_day.md) - Constraint preventing duplicate daily attendance
- [subjects](tables/subjects.md) - Table storing subject/course information and academic requirements

### U
- [unique_attendance_per_day](constraints/student_attendance_logs__unique_attendance_per_day.md) - Constraint ensuring single attendance record per student/class/day
- [unique_student_number](constraints/students__unique_student_number.md) - Constraint ensuring unique student numbers
- [update_students_timestamp](triggers/update_students_timestamp.md) - Trigger maintaining updated_at timestamps
- [update_updated_at_column](functions/update_updated_at_column.md) - Function for automatic timestamp updates

### V
- [vw_staff_availability_next_7_days](views/vw_staff_availability_next_7_days.md) - View showing teacher availability for upcoming week

## Common Query Patterns

### Student Management
```sql
-- Find all active students in a grade
SELECT * FROM students 
WHERE grade_level = 10 AND status = 'active';

-- Get student attendance summary
SELECT s.student_number, s.first_name, s.last_name,
       COUNT(*) as total_days,
       COUNT(CASE WHEN sal.status = 'present' THEN 1 END) as present_days
FROM students s
JOIN student_attendance_logs sal ON s.id = sal.student_id
WHERE sal.attendance_date >= '2024-08-01'
GROUP BY s.id, s.student_number, s.first_name, s.last_name;
```

### Class Management
```sql
-- Get today's schedule
SELECT * FROM lesson_view_enriched 
WHERE schedule_day = EXTRACT(DOW FROM CURRENT_DATE)
ORDER BY start_time;

-- Find classes with low attendance
SELECT * FROM lesson_view_enriched 
WHERE avg_attendance_rate < 0.80;
```

### Attendance Tracking
```sql
-- Mark attendance for a class
INSERT INTO student_attendance_logs (student_id, class_id, attendance_date, status)
VALUES ($1, $2, CURRENT_DATE, 'present')
ON CONFLICT (student_id, class_id, attendance_date)
DO UPDATE SET status = EXCLUDED.status, check_in_time = NOW();
```

## Security Considerations

- **RLS Policies**: All sensitive tables have appropriate row-level security
- **FERPA Compliance**: Student data access is strictly controlled
- **Audit Trails**: All changes to critical data are logged
- **Data Privacy**: Personal information is protected through access controls

## Performance Notes

- **Indexes**: Strategic indexing supports common query patterns
- **Partitioning**: Consider partitioning attendance logs by date for large datasets
- **Caching**: Views may benefit from materialization for reporting workloads
- **Archiving**: Implement data archiving strategy for historical records

## Development Guidelines

- **Naming**: Follow consistent naming conventions for all objects
- **Documentation**: Update this documentation when schema changes
- **Testing**: Validate all changes against existing data
- **Migrations**: Use versioned migration scripts for schema updates

---

*Last updated: August 28, 2024*  
*Database version: Based on flexwise28082025dump*