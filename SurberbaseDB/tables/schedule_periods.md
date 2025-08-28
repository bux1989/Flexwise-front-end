# schedule_periods

**Type:** Table  
**Purpose:** Define standardized time periods for class scheduling across the school  
**Schema:** public  
**Related:** [classes](../tables/classes.md), [bell_schedule](../tables/bell_schedule.md)

## Columns
| Name | Type | PK | FK → | Not Null | Default | Notes |
|------|------|----|------|----------|---------|-------|
| id | uuid | ✅ | - | ✅ | uuid_generate_v4() | Primary key |
| period_name | varchar(50) | - | - | ✅ | - | Period identifier (e.g., "1st Period") |
| period_number | integer | - | - | ✅ | - | Numeric order (1, 2, 3...) |
| start_time | time | - | - | ✅ | - | Period start time |
| end_time | time | - | - | ✅ | - | Period end time |
| duration_minutes | integer | - | - | ✅ | - | Period length in minutes |
| is_academic | boolean | - | - | ✅ | true | Whether period is for academic classes |
| description | varchar(255) | - | - | - | - | Period description (e.g., "Lunch", "Assembly") |
| active | boolean | - | - | ✅ | true | Whether period is currently used |
| created_at | timestamptz | - | - | ✅ | now() | Record creation timestamp |
| updated_at | timestamptz | - | - | ✅ | now() | Last update timestamp |

## Keys & Constraints
- PK: id
- Unique: period_number (where active = true)
- Unique: period_name (where active = true)
- Check: start_time < end_time
- Check: duration_minutes > 0 AND duration_minutes <= 480
- Check: period_number > 0

## Indexes
- `idx_periods_number` on (period_number) – purpose: ordered period lookups
- `idx_periods_time` on (start_time, end_time) – purpose: time-based scheduling
- `idx_periods_active` on (active) – purpose: filter active periods

## RLS
- Enabled: Yes
- Policies:
  - `periods_select_policy` (SELECT): `true` – intent: schedule periods are public information

## Triggers
- `update_periods_timestamp` BEFORE UPDATE → `update_updated_at_column`
- `calculate_duration` BEFORE INSERT/UPDATE → `set_period_duration`

## Dependencies
- Writes to: audit_log
- Reads from: None (base table)
- Referenced by: [classes](../tables/classes.md), [bell_schedule](../tables/bell_schedule.md)

## Example Queries
```sql
-- Get daily schedule periods in order
SELECT period_number, period_name, start_time, end_time, duration_minutes
FROM schedule_periods
WHERE active = true
AND is_academic = true
ORDER BY period_number;

-- Find periods during specific time range
SELECT * FROM schedule_periods
WHERE start_time >= '09:00'
AND end_time <= '15:00'
AND active = true;

-- Get non-academic periods (lunch, breaks, etc.)
SELECT period_name, start_time, end_time, description
FROM schedule_periods
WHERE is_academic = false
AND active = true
ORDER BY start_time;
```

## Notes

* Standardizes time periods across the entire school
* Supports both academic and non-academic periods (lunch, assembly)
* Duration is calculated automatically via trigger
* Period numbers determine display order in schedules
* Used as reference for consistent scheduling