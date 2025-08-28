# update_students_timestamp

**Type:** Trigger  
**Table:** [students](../tables/students.md)  
**Timing:** BEFORE UPDATE  
**Events:** UPDATE  
**Function:** [update_updated_at_column](../functions/update_updated_at_column.md)

## Purpose
Automatically updates the `updated_at` timestamp whenever a student record is modified.

## Trigger Definition
```sql
CREATE TRIGGER update_students_timestamp 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Behavior
- Fires before any UPDATE operation on the students table
- Sets `NEW.updated_at = NOW()` for the modified record
- Ensures audit trail consistency

## Dependencies
- Table: [students](../tables/students.md)
- Function: [update_updated_at_column](../functions/update_updated_at_column.md)

## Notes
- Essential for maintaining data modification timestamps
- Part of standard audit trail implementation
- No performance impact as it's a simple timestamp update