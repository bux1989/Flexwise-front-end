# course_list Table

Core table for managing course catalog and course definitions in the Flexwise school management system.

## Table Structure

```sql
CREATE TABLE public.course_list (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name text NOT NULL,
    max_students integer,
    start_date date,
    end_date date,
    is_active boolean DEFAULT true,
    course_code text,
    is_for_year_g integer[],
    description text,
    pictures text[] DEFAULT ARRAY[]::text[],
    wichtige_infos text,
    subject_id uuid,
    is_open_course boolean DEFAULT false NOT NULL,
    description_visible_to_parents boolean DEFAULT false NOT NULL,
    possible_staff_members uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    possible_room_id uuid
);
```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key, auto-generated |
| `school_id` | uuid | Foreign key to structure_schools table |
| `name` | text | Course name/title (required) |
| `max_students` | integer | Maximum enrollment capacity |
| `start_date` | date | Course start date |
| `end_date` | date | Course end date |
| `is_active` | boolean | Whether course is currently active (default: true) |
| `course_code` | text | Unique course identifier/code |
| `is_for_year_g` | integer[] | Array of grade/year levels this course is for |
| `description` | text | Detailed course description |
| `pictures` | text[] | Array of image URLs for course |
| `wichtige_infos` | text | Important information (German: "important info") |
| `subject_id` | uuid | Foreign key to subjects table |
| `is_open_course` | boolean | Whether course is open enrollment (default: false) |
| `description_visible_to_parents` | boolean | Parent visibility flag (default: false) |
| `possible_staff_members` | uuid[] | Array of staff member UUIDs who can teach this course |
| `created_at` | timestamptz | Record creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |
| `possible_room_id` | uuid | Preferred/possible room for this course |

## Relationships

- **Belongs to**: `structure_schools` (via school_id)
- **Belongs to**: `subjects` (via subject_id)  
- **Belongs to**: `structure_rooms` (via possible_room_id)
- **Has many**: `course_offers` (courses offered in specific periods)
- **Has many**: `course_applications` (student applications)
- **Has many**: `course_enrollments` (confirmed enrollments)
- **Has many**: `course_schedules` (scheduled sessions)

## Key Features

- **Multi-grade Support**: Can target multiple grade levels via `is_for_year_g` array
- **Staff Assignment**: Pre-defines possible instructors via `possible_staff_members`
- **Multimedia Support**: Supports multiple course images
- **Parent Visibility**: Configurable description visibility to parents
- **Enrollment Controls**: Supports both capacity limits and open enrollment
- **Audit Trail**: Full creation and update timestamps

## Usage Patterns

This table serves as the master catalog for all courses offered by a school. Courses defined here can then be:

1. **Offered** in specific registration periods via `course_offers`
2. **Applied for** by students via `course_applications` 
3. **Enrolled** when applications are accepted via `course_enrollments`
4. **Scheduled** for specific times via `course_schedules`

The table supports the full course lifecycle from catalog definition to active scheduling.

## Related Views

- `vw_course_summary` - Course summary information
- `vw_course_schedules_detailed` - Detailed course schedules
- `vw_enrollments_with_students` - Enrollments with student details

## German Language Notes

The field `wichtige_infos` indicates this system supports German language content, likely for German/Austrian/Swiss schools.