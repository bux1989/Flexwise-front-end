# idx_classes_schedule

**Type:** Index  
**Table:** [classes](../tables/classes.md)  
**Index Type:** B-tree  
**Columns:** (schedule_day, start_time)

## Index Definition
```sql
CREATE INDEX idx_classes_schedule 
ON classes (schedule_day, start_time);
```

## Purpose
Optimizes schedule-based queries for finding classes by day and time, supporting timetable generation and schedule conflict detection.

## Use Cases
- Weekly schedule generation
- Finding available time slots
- Schedule conflict detection
- Room scheduling queries
- Teacher workload analysis by time periods

## Performance Impact
- **Query Speed**: Excellent performance for schedule-based lookups and sorting
- **Storage**: Minimal overhead (~12 bytes per row for integer + time)
- **Maintenance**: Very efficient for range queries and ordering

## Example Optimized Queries
```sql
-- Find all Monday classes
SELECT * FROM classes 
WHERE schedule_day = 1 
ORDER BY start_time;

-- Find classes in specific time window
SELECT * FROM classes 
WHERE schedule_day = 2 
AND start_time BETWEEN '09:00' AND '12:00';

-- Find next available time slot
SELECT schedule_day, start_time, end_time 
FROM classes 
WHERE schedule_day >= $1 
ORDER BY schedule_day, start_time;
```

## Dependencies
- Table: [classes](../tables/classes.md)

## Notes
- Essential for schedule management functionality
- Supports efficient ordering by time within each day
- Works well with schedule conflict validation triggers