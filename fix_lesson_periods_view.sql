-- Drop and recreate the view with proper period matching
DROP VIEW IF EXISTS public.vw_react_lesson_details;

CREATE VIEW public.vw_react_lesson_details AS
SELECT
  cl.id as lesson_id,
  s.name as subject_name,
  sc.name as class_name,
  sr.name as room_name,
  cl.start_datetime,
  cl.end_datetime,
  CASE
    WHEN sub.id is not null THEN 'substitute'::text
    WHEN cl.is_cancelled = true THEN 'cancelled'::text
    ELSE 'regular'::text
  END as lesson_type,
  sub.id is not null as is_substitute,
  cl.is_cancelled,
  sub.substitute_staff_id,
  sub.reason as cancellation_reason,
  COALESCE(cl.primary_teacher_id, cl.teacher_ids[1]) as assigned_teacher_id,
  CASE
    WHEN sub.substitute_staff_id is not null THEN array[
      concat(
        COALESCE(sub_teacher.first_name, ''::text),
        ' ',
        COALESCE(sub_teacher.last_name, ''::text)
      )
    ]
    ELSE CASE
      WHEN array_length(cl.teacher_ids, 1) > 0 THEN ARRAY(
        SELECT
          concat(up.first_name, ' ', up.last_name) as concat
        FROM
          unnest(cl.teacher_ids) tid (tid)
          JOIN user_profiles up on up.id = tid.tid
        ORDER BY
          up.first_name,
          up.last_name
      )
      WHEN cl.primary_teacher_id is not null THEN array[
        concat(
          primary_teacher.first_name,
          ' ',
          primary_teacher.last_name
        )
      ]
      ELSE array[]::text[]
    END
  END as teacher_names,
  count(
    distinct COALESCE(ce.student_id, pis_class.profile_id)
  ) as student_count,
  array_agg(
    distinct concat(
      COALESCE(up_course.first_name, up_class.first_name),
      ' ',
      COALESCE(up_course.last_name, up_class.last_name),
      ' (',
      COALESCE(sc_course.name, sc_class.name),
      ')'
    )
  ) FILTER (
    WHERE
      COALESCE(up_course.id, up_class.id) is not null
  ) as student_names_with_class,
  date(cl.start_datetime) as lesson_date,
  -- Fix period matching: use direct period_id match OR find period by time overlap
  COALESCE(
    sp_direct.block_number,
    sp_time.block_number
  ) as period_number,
  cl.notes,
  count(sal.id) > 0 as attendance_taken,
  cl.course_id,
  cl.subject_id,
  cl.class_id,
  cl.room_id,
  cl.school_id,
  s.color as subject_color,
  s.abbreviation as subject_abbreviation,
  sc.year as class_year,
  sc.grade_level,
  sr.room_number,
  sr.building,
  COALESCE(
    sp_direct.start_time,
    sp_time.start_time
  ) as period_start_time,
  COALESCE(
    sp_direct.end_time,
    sp_time.end_time
  ) as period_end_time,
  COALESCE(
    sp_direct.label,
    sp_time.label
  ) as period_label
FROM
  course_lessons cl
  LEFT JOIN subjects s ON cl.subject_id = s.id
  LEFT JOIN structure_classes sc ON cl.class_id = sc.id
  LEFT JOIN structure_rooms sr ON cl.room_id = sr.id
  -- Direct period_id match (when period_id is set correctly)
  LEFT JOIN schedule_periods sp_direct ON cl.period_id = sp_direct.id
  -- Time-based period match (fallback when period_id is NULL)
  LEFT JOIN schedule_periods sp_time ON (
    cl.period_id IS NULL 
    AND sp_time.school_id = cl.school_id
    AND cl.start_datetime::time >= sp_time.start_time 
    AND cl.start_datetime::time < sp_time.end_time
  )
  LEFT JOIN substitutions sub ON sub.original_lesson_id = cl.id
  LEFT JOIN user_profiles sub_teacher ON sub.substitute_staff_id = sub_teacher.id
  LEFT JOIN user_profiles primary_teacher ON cl.primary_teacher_id = primary_teacher.id
  LEFT JOIN course_enrollments ce ON ce.course_id = cl.course_id
    AND cl.start_datetime::date >= ce.start_date
    AND cl.start_datetime::date <= ce.end_date
  LEFT JOIN user_profiles up_course ON up_course.id = ce.student_id
  LEFT JOIN profile_info_student pis_course ON pis_course.profile_id = ce.student_id
  LEFT JOIN structure_classes sc_course ON sc_course.id = pis_course.class_id
  LEFT JOIN profile_info_student pis_class ON pis_class.class_id = cl.class_id
    AND cl.course_id is null
  LEFT JOIN user_profiles up_class ON up_class.id = pis_class.profile_id
  LEFT JOIN structure_classes sc_class ON sc_class.id = pis_class.class_id
  LEFT JOIN student_attendance_logs sal ON sal.lesson_id = cl.id
WHERE
  cl.is_archived = false
GROUP BY
  cl.id,
  s.name,
  sc.name,
  sr.name,
  cl.start_datetime,
  cl.end_datetime,
  cl.is_cancelled,
  sub.id,
  sub.substitute_staff_id,
  sub.reason,
  cl.primary_teacher_id,
  cl.teacher_ids,
  sub_teacher.first_name,
  sub_teacher.last_name,
  primary_teacher.first_name,
  primary_teacher.last_name,
  sp_direct.block_number,
  sp_time.block_number,
  sp_direct.start_time,
  sp_time.start_time,
  sp_direct.end_time,
  sp_time.end_time,
  sp_direct.label,
  sp_time.label,
  cl.notes,
  cl.course_id,
  cl.subject_id,
  cl.class_id,
  cl.room_id,
  cl.school_id,
  s.color,
  s.abbreviation,
  sc.year,
  sc.grade_level,
  sr.room_number,
  sr.building
ORDER BY
  cl.start_datetime DESC;
