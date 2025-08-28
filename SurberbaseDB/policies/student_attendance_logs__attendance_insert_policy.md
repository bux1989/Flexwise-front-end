# student_attendance_logs__attendance_insert_policy

**Type:** RLS Policy  
**Table:** [student_attendance_logs](../tables/student_attendance_logs.md)  
**Command:** INSERT  
**Policy Name:** attendance_insert_policy  

## Policy Definition
```sql
CREATE POLICY attendance_insert_policy ON student_attendance_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM teacher_classes 
            WHERE class_id = student_attendance_logs.class_id
        )
    );
```

## Purpose
Restricts attendance record creation to authorized teachers for their assigned classes.

## Access Rules
- **Teachers**: Can only create attendance records for classes they are assigned to teach
- **Students**: Cannot create attendance records
- **Administrators**: Handled through separate policy or elevated privileges
- **Others**: No access

## Check Expression
```sql
auth.uid() IN (
    SELECT user_id FROM teacher_classes 
    WHERE class_id = student_attendance_logs.class_id
)
```

## Dependencies
- Table: [student_attendance_logs](../tables/student_attendance_logs.md)
- Auth Table: teacher_classes
- Function: auth.uid()

## Notes
- Prevents unauthorized attendance modifications
- Ensures only assigned teachers can mark attendance
- Works in conjunction with application-level validations
- May need separate policy for administrative overrides