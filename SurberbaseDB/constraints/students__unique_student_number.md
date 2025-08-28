# students__unique_student_number

**Type:** Constraint  
**Table:** [students](../tables/students.md)  
**Constraint Type:** UNIQUE  
**Columns:** student_number

## Constraint Definition
```sql
ALTER TABLE students 
ADD CONSTRAINT unique_student_number 
UNIQUE (student_number);
```

## Purpose
Ensures that each student has a unique identifier number across the entire school system.

## Business Rules
- Student numbers must be unique across all students
- No two students can share the same student number
- Student numbers are permanent and not reused
- Used for student identification and record linking

## Impact
- **Data Integrity**: Prevents duplicate student identifications
- **Performance**: Creates implicit index for fast lookups
- **Applications**: Enables reliable student record retrieval
- **Reporting**: Ensures accurate student counting and identification

## Error Handling
```sql
-- Example violation
INSERT INTO students (student_number, first_name, last_name, grade_level) 
VALUES ('STU001', 'John', 'Doe', 10);
-- ERROR: duplicate key value violates unique constraint "unique_student_number"
```

## Dependencies
- Table: [students](../tables/students.md)

## Notes
- Student number format should be standardized (e.g., STU001, STU002)
- Consider sequence generation for automatic assignment
- Essential for maintaining referential integrity across the system
- Used by external systems for student identification