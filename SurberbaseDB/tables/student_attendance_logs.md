# student_attendance_logs Table

Central table for tracking student attendance at individual lessons in the Flexwise school management system.

## Table Structure

```sql
CREATE TABLE public.student_attendance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    student_id uuid NOT NULL,
    daily_log_id uuid,
    lateness_duration_minutes integer,
    method text,
    recorded_by uuid,
    "timestamp" timestamp without time zone DEFAULT now(),
    notes text,
    status public.attendance_status,
    absence_note_id uuid,
    school_id uuid NOT NULL
);
```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key, auto-generated |
| `lesson_id` | uuid | Foreign key to course_lessons table (required) |
| `student_id` | uuid | Foreign key to profile_info_student table (required) |
| `daily_log_id` | uuid | Foreign key to student_daily_log table |
| `lateness_duration_minutes` | integer | Minutes late (if applicable) |
| `method` | text | How attendance was recorded (manual, QR code, etc.) |
| `recorded_by` | uuid | Staff member who recorded attendance |
| `timestamp` | timestamp | When attendance was recorded (default: now) |
| `notes` | text | Additional attendance notes |
| `status` | attendance_status | Attendance status (enum type) |
| `absence_note_id` | uuid | Foreign key to student_absence_notes table |
| `school_id` | uuid | Foreign key to structure_schools table (required) |

## Relationships

- **Belongs to**: `course_lessons` (via lesson_id)
- **Belongs to**: `profile_info_student` (via student_id)  
- **Belongs to**: `student_daily_log` (via daily_log_id)
- **Belongs to**: `student_absence_notes` (via absence_note_id)
- **Belongs to**: `structure_schools` (via school_id)
- **Belongs to**: `profile_info_staff` (via recorded_by)

## Attendance Status Enum

The `status` field uses a custom enum type `public.attendance_status`. Common values likely include:
- Present
- Absent  
- Late
- Excused
- Partial

## Key Features

- **Lesson-Level Tracking**: Records attendance for individual lessons/sessions
- **Lateness Tracking**: Captures exact minutes late when applicable
- **Multiple Recording Methods**: Supports various attendance recording methods
- **Staff Attribution**: Tracks who recorded the attendance
- **Audit Trail**: Full timestamp tracking for attendance events
- **Absence Integration**: Links to formal absence notes when applicable
- **Daily Log Connection**: Integrates with broader daily student logs

## Usage Patterns

This table is used for:

1. **Real-time Attendance**: Recording attendance as lessons occur
2. **Lateness Tracking**: Capturing and reporting tardiness patterns
3. **Absence Documentation**: Linking attendance to formal absence processes
4. **Reporting**: Generating attendance reports and analytics
5. **Parent Communication**: Providing attendance updates to families

## Related Tables

### Core Relationships
- `course_lessons` - The specific lesson/session
- `profile_info_student` - Student information
- `student_daily_log` - Daily student activity summary

### Extended Relationships
- `student_absence_notes` - Formal absence documentation
- `student_presence_events` - Detailed presence/absence events
- `staff_class_links` - Staff assigned to classes

## Related Views

- `vw_attendance_dashboard` - Attendance dashboard data
- `vw_class_checkins_today` - Today's class check-ins
- `vw_daily_attendance_by_class` - Class-wise daily attendance
- `vw_daily_attendance_overview` - Overall attendance overview
- `vw_student_attendance_today` - Today's student attendance
- `vw_lesson_attendance_badges` - Lesson attendance indicators

## Data Integrity Notes

- Requires both `lesson_id` and `student_id` (cannot have attendance without lesson and student)
- Must include `school_id` for data isolation
- `timestamp` defaults to current time for audit purposes
- Supports flexible status tracking via enum type

This table forms the foundation of the attendance tracking system, providing detailed lesson-by-lesson attendance records that roll up into daily, weekly, and term-level reporting.