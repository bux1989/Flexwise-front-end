-- Function to update lesson period_id and period_ids from connected schedules in batches
-- This handles the 12,000+ lessons that are missing period information

CREATE OR REPLACE FUNCTION update_lesson_periods_from_schedules(
    batch_size INTEGER DEFAULT 1000,
    max_batches INTEGER DEFAULT 50
) 
RETURNS TABLE (
    batch_number INTEGER,
    lessons_updated INTEGER,
    total_processed INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    current_batch INTEGER := 0;
    total_updated INTEGER := 0;
    lessons_updated_in_batch INTEGER;
    lesson_batch_ids UUID[];
BEGIN
    -- Loop through batches
    WHILE current_batch < max_batches LOOP
        current_batch := current_batch + 1;
        
        -- Get a batch of lesson IDs that need updating
        SELECT ARRAY(
            SELECT cl.id 
            FROM course_lessons cl
            INNER JOIN course_schedules cs ON cl.schedule_id = cs.id
            WHERE cl.period_id IS NULL 
              AND cl.schedule_id IS NOT NULL
              AND cs.period_id IS NOT NULL
            ORDER BY cl.created_at DESC  -- Process newest first
            LIMIT batch_size
        ) INTO lesson_batch_ids;
        
        -- Exit if no more lessons to process
        IF array_length(lesson_batch_ids, 1) IS NULL THEN
            EXIT;
        END IF;
        
        -- Update this batch of lessons
        UPDATE course_lessons 
        SET 
            period_id = cs.period_id,
            period_ids = CASE 
                WHEN cs.period_ids IS NOT NULL AND array_length(cs.period_ids, 1) > 0 
                THEN cs.period_ids
                ELSE ARRAY[cs.period_id]  -- Create array from single period_id
            END,
            updated_at = NOW()  -- If you have this field
        FROM course_schedules cs
        WHERE course_lessons.schedule_id = cs.id
          AND course_lessons.id = ANY(lesson_batch_ids);
        
        GET DIAGNOSTICS lessons_updated_in_batch = ROW_COUNT;
        total_updated := total_updated + lessons_updated_in_batch;
        
        -- Return batch info
        batch_number := current_batch;
        lessons_updated := lessons_updated_in_batch;
        total_processed := total_updated;
        RETURN NEXT;
        
        -- Log progress
        RAISE NOTICE 'Batch %: Updated % lessons (Total: %)', 
            current_batch, lessons_updated_in_batch, total_updated;
        
        -- Exit if we processed fewer lessons than batch size (last batch)
        IF lessons_updated_in_batch < batch_size THEN
            EXIT;
        END IF;
        
        -- Small delay to avoid overwhelming the database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Completed: % total lessons updated across % batches', 
        total_updated, current_batch;
END;
$$;

-- Function to check how many lessons need updating
CREATE OR REPLACE FUNCTION count_lessons_needing_period_update()
RETURNS TABLE (
    total_lessons BIGINT,
    missing_period_id BIGINT,
    missing_with_schedule BIGINT,
    missing_without_schedule BIGINT,
    ready_for_update BIGINT
)
LANGUAGE sql
AS $$
    SELECT 
        COUNT(*) as total_lessons,
        COUNT(*) FILTER (WHERE period_id IS NULL) as missing_period_id,
        COUNT(*) FILTER (WHERE period_id IS NULL AND schedule_id IS NOT NULL) as missing_with_schedule,
        COUNT(*) FILTER (WHERE period_id IS NULL AND schedule_id IS NULL) as missing_without_schedule,
        COUNT(*) FILTER (
            WHERE period_id IS NULL 
            AND schedule_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM course_schedules cs 
                WHERE cs.id = course_lessons.schedule_id 
                AND cs.period_id IS NOT NULL
            )
        ) as ready_for_update
    FROM course_lessons;
$$;

-- Function to run a single test batch (for safety)
CREATE OR REPLACE FUNCTION test_lesson_period_update()
RETURNS TABLE (
    lesson_id UUID,
    old_period_id UUID,
    new_period_id UUID,
    schedule_id UUID,
    subject_name TEXT,
    class_name TEXT
)
LANGUAGE sql
AS $$
    SELECT 
        cl.id as lesson_id,
        cl.period_id as old_period_id,
        cs.period_id as new_period_id,
        cl.schedule_id,
        s.name as subject_name,
        sc.name as class_name
    FROM course_lessons cl
    INNER JOIN course_schedules cs ON cl.schedule_id = cs.id
    LEFT JOIN subjects s ON cl.subject_id = s.id  
    LEFT JOIN structure_classes sc ON cl.class_id = sc.id
    WHERE cl.period_id IS NULL 
      AND cl.schedule_id IS NOT NULL
      AND cs.period_id IS NOT NULL
    ORDER BY cl.start_datetime DESC
    LIMIT 10;
$$;

-- Usage Instructions:
-- 
-- 1. First, check how many lessons need updating:
--    SELECT * FROM count_lessons_needing_period_update();
--
-- 2. Test with a small sample first:
--    SELECT * FROM test_lesson_period_update();
--
-- 3. Run the batch update (adjust batch_size as needed):
--    SELECT * FROM update_lesson_periods_from_schedules(1000, 50);
--
-- 4. For smaller batches (safer):
--    SELECT * FROM update_lesson_periods_from_schedules(500, 100);

COMMENT ON FUNCTION update_lesson_periods_from_schedules IS 
'Updates course_lessons.period_id and period_ids from connected course_schedules in batches. 
Handles large datasets safely with configurable batch sizes.';

COMMENT ON FUNCTION count_lessons_needing_period_update IS 
'Returns statistics about how many lessons are missing period information and can be updated.';

COMMENT ON FUNCTION test_lesson_period_update IS 
'Shows a sample of 10 lessons that would be updated, for testing before running the full batch update.';
