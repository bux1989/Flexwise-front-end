# update_updated_at_column()

**Type:** Function (LANGUAGE plpgsql, SECURITY DEFINER)  
**Purpose:** Trigger function to automatically update the updated_at timestamp  
**Inputs:** None (trigger function)  
**Returns:** TRIGGER

## Behavior
- Reads: NEW record (trigger context)
- Writes: Updates NEW.updated_at to current timestamp
- Called by: Multiple table triggers for timestamp maintenance

## Example
```sql
-- Trigger setup example
CREATE TRIGGER update_students_timestamp 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Dependencies
- Tables: Used by [students](../tables/students.md), [classes](../tables/classes.md), [student_attendance_logs](../tables/student_attendance_logs.md), and other timestamped tables
- Views: None
- Functions: None

## Notes
- Standard utility function for maintaining audit timestamps
- Used across multiple tables for consistency
- Ensures updated_at reflects actual modification time