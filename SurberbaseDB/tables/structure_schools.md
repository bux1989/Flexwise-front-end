# structure_schools Table

Core table that defines school entities and their configuration settings in the Flexwise school management system.

## Table Structure

```sql
CREATE TABLE public.structure_schools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    timezone text,
    language text,
    year_groups integer[] DEFAULT '{}'::integer[],
    "Logo" text,
    principal_id uuid,
    email text,
    phone text,
    fax text,
    address_street text,
    address_number text,
    address_postal_code text,
    address_city text,
    address_country text,
    floor_options text[] DEFAULT ARRAY[]::text[],
    building_options text[] DEFAULT ARRAY[]::text[],
    allow_custom_course_times boolean DEFAULT false NOT NULL
);
```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key, auto-generated |
| `name` | text | School name (required) |
| `timezone` | text | School's timezone (e.g., "Europe/Berlin") |
| `language` | text | Primary language of instruction |
| `year_groups` | integer[] | Array of year/grade levels offered |
| `Logo` | text | URL/path to school logo image |
| `principal_id` | uuid | Foreign key to principal's user profile |
| `email` | text | School's main email address |
| `phone` | text | School's main phone number |
| `fax` | text | School's fax number |
| `address_street` | text | Street name |
| `address_number` | text | Street number |
| `address_postal_code` | text | Postal/ZIP code |
| `address_city` | text | City name |
| `address_country` | text | Country name |
| `floor_options` | text[] | Available floors in school building |
| `building_options` | text[] | Available buildings/wings |
| `allow_custom_course_times` | boolean | Whether custom scheduling is allowed |

## Key Features

### Multi-Tenant Architecture
This table enables the multi-tenant design where each school is a separate tenant with:
- Isolated data through `school_id` foreign keys in other tables
- Independent configuration settings
- Separate administrative hierarchies

### Localization Support
- **Timezone**: Handles different geographical locations
- **Language**: Supports multiple languages for instruction
- **Address Fields**: Flexible international address format

### Facility Management
- **Floor Options**: Multi-story building support
- **Building Options**: Multi-building campus support
- **Room Integration**: Works with `structure_rooms` for space management

### Administrative Hierarchy
- **Principal Assignment**: Links to staff member as principal
- **Contact Information**: Complete school contact details
- **Logo Support**: Visual branding for school identity

## Relationships

- **Has many**: All other tables with `school_id` foreign keys
- **Belongs to**: `user_profiles` (via principal_id)
- **Has many**: `structure_rooms` (school facilities)
- **Has many**: `structure_classes` (academic classes)
- **Has many**: `user_profiles` (all school users)
- **Has many**: `course_list` (school's course catalog)

## Data Isolation

This table is central to the system's row-level security (RLS) implementation:
- All user access is filtered by `school_id`
- Users can only see/modify data from their own school
- Prevents cross-school data access

## Usage Patterns

### School Setup
1. Create school record with basic information
2. Assign principal and contact details
3. Configure year groups and facilities
4. Set up courses, classes, and users

### Multi-School Deployment
- Single database instance supports multiple schools
- Each school operates independently
- Shared system functions but isolated data

### Configuration Management
- Central location for school-wide settings
- Controls feature availability (custom course times)
- Manages facility options for scheduling

## Example Values

```sql
-- Example German school
{
  "name": "Freie Schule Beispiel",
  "timezone": "Europe/Berlin", 
  "language": "de",
  "year_groups": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "address_city": "München",
  "address_country": "Deutschland",
  "floor_options": ["Erdgeschoss", "1. Stock", "2. Stock"],
  "building_options": ["Hauptgebäude", "Turnhalle", "Kindergarten"]
}
```

## Related Views

- Most views filter by school_id to respect school boundaries
- `vw_structure_school_years_with_periods` - Academic year planning
- All attendance and course views respect school isolation

## Security Notes

- Critical for data isolation in multi-tenant setup
- Principal assignment must be validated
- Address information may be sensitive (GDPR compliance)
- Logo URLs should be validated for security

This table forms the foundation of the entire school management system, providing the organizational structure and configuration that governs all other operations.