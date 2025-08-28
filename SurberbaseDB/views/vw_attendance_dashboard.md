# vw_attendance_dashboard View

Comprehensive view that combines student absences and daily logs to provide a unified attendance dashboard for school administrators and staff.

## View Definition

```sql
CREATE VIEW public.vw_attendance_dashboard WITH (security_invoker='true') AS
 SELECT COALESCE((dl.id)::text, (a.id)::text) AS id,
    ((up.first_name || ' '::text) || up.last_name) AS student_name,
    sc.name AS student_class,
    COALESCE(dl.date, a.start_date) AS date,
    [Complex CASE statement for date_range display],
    [Complex CASE statement for duration categorization],
    COALESCE(a.absence_status, 'unentschuldigt'::text) AS status,
    a.reason,
    (a.attachment_url IS NOT NULL) AS has_attachment,
    a.is_excused,
    creator.first_name AS created_by,
    COALESCE(dl.created_at, a.created_at) AS created_at,
    a.status AS approval_status,
    [CASE for recurrence_type],
    [CASE for source_type],
    a.id AS absence_note_id
   FROM multiple joined tables...
```

## Output Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Unique identifier (daily log ID or absence note ID) |
| `student_name` | text | Full student name (first + last) |
| `student_class` | text | Student's class name |
| `date` | date | Absence date (from daily log or absence note) |
| `date_range` | text | Formatted time range or date range display |
| `duration` | text | Duration category: 'Mehrere Tage', 'Zeitfenster', 'Ganzer Tag' |
| `status` | text | Absence status (defaults to 'unentschuldigt' if null) |
| `reason` | text | Reason for absence |
| `has_attachment` | boolean | Whether absence has supporting documentation |
| `is_excused` | boolean | Whether absence is excused |
| `created_by` | text | First name of person who created the record |
| `created_at` | timestamptz | When the record was created |
| `approval_status` | text | Current approval status |
| `recurrence_type` | text | 'recurring' or 'single' |
| `source_type` | text | 'system' (auto-generated) or 'manual' (user-entered) |
| `absence_note_id` | uuid | ID of the underlying absence note |

## Key Features

### Unified Data Source
Combines data from two primary sources:
- **Manual Absence Notes**: Direct absence submissions by staff/parents
- **System Daily Logs**: Auto-generated logs from attendance tracking

### German Language Support
- Uses German terms: "unentschuldigt" (unexcused), "Mehrere Tage" (multiple days)
- "Zeitfenster" (time window), "Ganzer Tag" (whole day)
- Time display uses "ab" (from) and "bis" (until)

### Smart Date/Time Display
The `date_range` column provides context-aware formatting:
- **Multi-day absences**: Shows start date - end date
- **Partial day absences**: Shows time ranges (e.g., "08:00–15:30")
- **Late arrival**: Shows "ab 10:00" (from 10:00)
- **Early departure**: Shows "bis 14:00" (until 14:00)

### Duration Categories
- **"Mehrere Tage"**: Multi-day absences
- **"Zeitfenster"**: Partial day with specific times
- **"Ganzer Tag"**: Full day absence

## Source Tables

### Primary Tables
- `student_absence_notes` (a) - Manual absence submissions
- `student_daily_log` (dl) - System-generated daily logs
- `user_profiles` (up) - Student information
- `profile_info_student` (pis) - Extended student details
- `structure_classes` (sc) - Class information

### Supporting Data
- `user_profiles` (creator) - Who created the absence record
- `student_attendance_logs` + `course_lessons` - Lesson timing data

## Security

- Uses `security_invoker='true'` - queries run with invoker's permissions
- Respects row-level security policies on underlying tables
- Filters out soft-deleted records (`WHERE a.deleted_at IS NULL`)

## Usage Patterns

This view is designed for:

1. **Dashboard Display**: Real-time attendance overview for administrators
2. **Parent Communication**: Showing absence history and status
3. **Compliance Reporting**: Tracking excused vs unexcused absences
4. **Staff Workflow**: Managing absence approvals and documentation

## Data Flow Logic

The view includes complex logic to avoid duplicates:
- Shows daily log entries when they exist
- Falls back to absence note data when no daily log exists
- Uses `EXISTS` subquery to prevent showing both for same absence

## Ordering

Results are ordered by:
1. Date (most recent first)
2. Class name 
3. Student last name

This provides a logical flow for administrative review of recent absences by class.

## Related Tables

- `student_absence_notes` - Source for manual absences
- `student_daily_log` - Source for system-generated logs  
- `student_attendance_logs` - Detailed lesson attendance
- `course_lessons` - Lesson timing information