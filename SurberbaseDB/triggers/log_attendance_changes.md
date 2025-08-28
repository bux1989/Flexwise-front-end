# log_attendance_changes

**Type:** Trigger  
**Table:** [student_attendance_logs](../tables/student_attendance_logs.md)  
**Timing:** AFTER INSERT/UPDATE/DELETE  
**Events:** INSERT, UPDATE, DELETE  
**Function:** [audit_attendance_changes](../functions/audit_attendance_changes.md)

## Purpose
Maintains audit trail for all attendance record modifications for compliance and tracking purposes.

## Trigger Definition
```sql
CREATE TRIGGER log_attendance_changes 
    AFTER INSERT OR UPDATE OR DELETE ON student_attendance_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION audit_attendance_changes();
```

## Behavior
- Fires after any INSERT, UPDATE, or DELETE operation on attendance logs
- Records the change type, timestamp, user, and affected data
- Writes to audit_log table for historical tracking
- Captures both OLD and NEW values for updates

## Dependencies
- Table: [student_attendance_logs](../tables/student_attendance_logs.md)
- Function: [audit_attendance_changes](../functions/audit_attendance_changes.md)
- Audit Table: audit_log

## Notes
- Critical for educational compliance requirements
- Helps track attendance correction patterns
- May impact write performance on high-volume operations
- Audit logs should be regularly archived