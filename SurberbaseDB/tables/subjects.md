# subjects

**Type:** Table  
**Purpose:** Store subject/course information and academic requirements  
**Schema:** public  
**Related:** [classes](../tables/classes.md), [curriculum](../tables/curriculum.md)

## Columns
| Name | Type | PK | FK → | Not Null | Default | Notes |
|------|------|----|------|----------|---------|-------|
| id | uuid | ✅ | - | ✅ | uuid_generate_v4() | Primary key |
| subject_name | varchar(255) | - | - | ✅ | - | Full subject name |
| subject_code | varchar(20) | - | - | ✅ | - | Abbreviated code (e.g., MATH101) |
| description | text | - | - | - | - | Subject description and objectives |
| credit_hours | integer | - | - | ✅ | 1 | Academic credit value |
| department | varchar(100) | - | - | - | - | Academic department |
| prerequisites | text | - | - | - | - | Required prior subjects |
| grade_level_min | integer | - | - | - | 1 | Minimum grade level |
| grade_level_max | integer | - | - | - | 12 | Maximum grade level |
| active | boolean | - | - | ✅ | true | Whether subject is currently offered |
| created_at | timestamptz | - | - | ✅ | now() | Record creation timestamp |
| updated_at | timestamptz | - | - | ✅ | now() | Last update timestamp |

## Keys & Constraints
- PK: id
- Unique: subject_code
- Check: credit_hours > 0 AND credit_hours <= 6
- Check: grade_level_min <= grade_level_max
- Check: grade_level_min >= 1 AND grade_level_max <= 12

## Indexes
- `idx_subjects_code` on (subject_code) – purpose: fast lookup by subject code
- `idx_subjects_department` on (department) – purpose: department-based queries
- `idx_subjects_grade_level` on (grade_level_min, grade_level_max) – purpose: grade level filtering

## RLS
- Enabled: Yes
- Policies:
  - `subjects_select_policy` (SELECT): `true` – intent: subjects are public information for all authenticated users

## Triggers
- `update_subjects_timestamp` BEFORE UPDATE → `update_updated_at_column`

## Dependencies
- Writes to: audit_log
- Reads from: None (base table)
- Referenced by: [classes](../tables/classes.md), [curriculum](../tables/curriculum.md)

## Example Queries
```sql
-- Get all active subjects for a grade level
SELECT * FROM subjects
WHERE active = true
AND grade_level_min <= 10
AND grade_level_max >= 10;

-- Find subjects by department
SELECT subject_code, subject_name, credit_hours
FROM subjects
WHERE department = 'Mathematics'
AND active = true;

-- Subject with prerequisites
SELECT subject_name, prerequisites
FROM subjects
WHERE prerequisites IS NOT NULL
AND active = true;
```

## Notes

* Subject codes should follow institutional naming conventions
* Prerequisites are stored as text for flexibility but could be normalized
* Credit hours determine academic weight for GPA calculations
* Grade level ranges help with appropriate class assignment