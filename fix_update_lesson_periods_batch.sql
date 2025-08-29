-- Drop and recreate the function with the correct column reference
DROP FUNCTION IF EXISTS update_lesson_periods_from_schedules(INTEGER, INTEGER);

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
        
        -- Get a batch of lesson IDs that need updating (using start_datetime instead of created_at)
        SELECT ARRAY(
            SELECT cl.id 
            FROM course_lessons cl
            INNER JOIN course_schedules cs ON cl.schedule_id = cs.id
            WHERE cl.period_id IS NULL 
              AND cl.schedule_id IS NOT NULL
              AND cs.period_id IS NOT NULL
            ORDER BY cl.start_datetime DESC  -- Use start_datetime since created_at doesn't exist
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
            END
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
