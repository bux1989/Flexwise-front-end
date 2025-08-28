# students__students_select_policy

**Type:** RLS Policy  
**Table:** [students](../tables/students.md)  
**Command:** SELECT  
**Policy Name:** students_select_policy  

## Policy Definition
```sql
CREATE POLICY students_select_policy ON students
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM student_users WHERE student_id = students.id
        ) OR 
        auth.uid() IN (
            SELECT user_id FROM teachers
        ) OR 
        auth.uid() IN (
            SELECT user_id FROM admin_users
        )
    );
```

## Purpose
Controls read access to student records based on user role and relationship.

## Access Rules
- **Students**: Can only access their own student record
- **Teachers**: Can access all student records (for educational purposes)
- **Administrators**: Can access all student records (for management)
- **Others**: No access

## Using Expression
```sql
auth.uid() IN (SELECT user_id FROM student_users WHERE student_id = students.id) 
OR auth.uid() IN (SELECT user_id FROM teachers) 
OR auth.uid() IN (SELECT user_id FROM admin_users)
```

## Dependencies
- Table: [students](../tables/students.md)
- Auth Tables: student_users, teachers, admin_users
- Function: auth.uid()

## Notes
- Ensures FERPA compliance for student data protection
- Teachers need access for grading and communication
- Performance optimized with proper indexes on user tables
- Consider caching user role information for better performance