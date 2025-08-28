--
-- CREATE VIEW STATEMENTS
--
-- Extracted from flexwise28082025dump.sql
-- Total objects: 31
--

-- Object 1/31
CREATE VIEW public.vw_attendance_dashboard WITH (security_invoker='true') AS
 SELECT COALESCE((dl.id)::text, (a.id)::text) AS id,
    ((up.first_name || ' '::text) || up.last_name) AS student_name,
    sc.name AS student_class,
    COALESCE(dl.date, a.start_date) AS date,
        CASE
            WHEN ((dl.id IS NULL) AND (a.start_date <> a.end_date)) THEN (((a.start_date)::text || ' - '::text) || (a.end_date)::text)
            WHEN (dl.id IS NOT NULL) THEN
            CASE
                WHEN ((dl.expected_checkout_time IS NOT NULL) AND (dl.expected_arrival_time IS NOT NULL)) THEN (("left"((dl.expected_checkout_time)::text, 5) || '–'::text) || "left"((dl.expected_arrival_time)::text, 5))
                WHEN (dl.expected_arrival_time IS NOT NULL) THEN ('ab '::text || "left"((dl.expected_arrival_time)::text, 5))
                WHEN (dl.expected_checkout_time IS NOT NULL) THEN ('bis '::text || "left"((dl.expected_checkout_time)::text, 5))
                ELSE NULL::text
            END
            WHEN ((lesson_times.earliest_start IS NOT NULL) AND (lesson_times.latest_end IS NOT NULL)) THEN (("left"((lesson_times.earliest_start)::text, 5) || '–'::text) || "left"((lesson_times.latest_end)::text, 5))
            WHEN (lesson_times.earliest_start IS NOT NULL) THEN ('ab '::text || "left"((lesson_times.earliest_start)::text, 5))
            ELSE NULL::text
        END AS date_range,
        CASE
            WHEN ((dl.id IS NULL) AND (a.start_date <> a.end_date)) THEN 'Mehrere Tage'::text
            WHEN ((dl.id IS NOT NULL) AND ((dl.expected_checkout_time IS NOT NULL) OR (dl.expected_arrival_time IS NOT NULL))) THEN 'Zeitfenster'::text
            WHEN (dl.id IS NOT NULL) THEN 'Ganzer Tag'::text
            WHEN (lesson_times.earliest_start IS NOT NULL) THEN 'Zeitfenster'::text
            ELSE 'Ganzer Tag'::text
        END AS duration,
    COALESCE(a.absence_status, 'unentschuldigt'::text) AS status,
    a.reason,
    (a.attachment_url IS NOT NULL) AS has_attachment,
    a.is_excused,
    creator.first_name AS created_by,
    COALESCE(dl.created_at, a.created_at) AS created_at,
    a.status AS approval_status,
        CASE
            WHEN (a.recurrence_id IS NOT NULL) THEN 'recurring'::text
            ELSE 'single'::text
        END AS recurrence_type,
        CASE
            WHEN (dl.id IS NOT NULL) THEN 'system'::text
            ELSE 'manual'::text
        END AS source_type,
    a.id AS absence_note_id
   FROM ((((((public.student_absence_notes a
     JOIN public.user_profiles up ON ((a.student_id = up.id)))
     JOIN public.profile_info_student pis ON ((up.id = pis.profile_id)))
     JOIN public.structure_classes sc ON ((pis.class_id = sc.id)))
     LEFT JOIN public.user_profiles creator ON ((a.created_by = creator.id)))
     LEFT JOIN public.student_daily_log dl ON ((dl.absence_note_id = a.id)))
     LEFT JOIN ( SELECT sal.absence_note_id,
            min((cl.start_datetime)::time without time zone) AS earliest_start,
            max((cl.end_datetime)::time without time zone) AS latest_end
           FROM (public.student_attendance_logs sal
             JOIN public.course_lessons cl ON ((sal.lesson_id = cl.id)))
          WHERE (sal.absence_note_id IS NOT NULL)
          GROUP BY sal.absence_note_id) lesson_times ON ((lesson_times.absence_note_id = a.id)))
  WHERE ((a.deleted_at IS NULL) AND ((dl.id IS NOT NULL) OR (NOT (EXISTS ( SELECT 1
           FROM public.student_daily_log sdl
          WHERE (sdl.absence_note_id = a.id))))))
  ORDER BY COALESCE(dl.date, a.start_date) DESC, sc.name, up.last_name;

-- Object 2/31
CREATE VIEW public.vw_class_checkins_today AS
 WITH student_status_today AS (
         SELECT s_1.profile_id AS student_id,
            s_1.class_id,
            d.presence_status
           FROM (public.profile_info_student s_1
             LEFT JOIN public.student_daily_log d ON (((d.student_id = s_1.profile_id) AND (d.date = CURRENT_DATE))))
          WHERE (s_1.school_id = ( SELECT user_profiles.school_id
                   FROM public.user_profiles
                  WHERE (user_profiles.id = auth.uid())))
        ), categorized AS (
         SELECT ss.class_id,
            ss.student_id,
                CASE
                    WHEN (ss.presence_status = ANY (ARRAY['present'::public.presence_status, 'late'::public.presence_status, 'left_early'::public.presence_status])) THEN 'present'::text
                    WHEN (ss.presence_status = ANY (ARRAY['absent_unexcused'::public.presence_status, 'absent_excused'::public.presence_status, 'left_without_notice'::public.presence_status, 'temporarily_offsite'::public.presence_status])) THEN 'absent'::text
                    ELSE 'unmarked'::text
                END AS status
           FROM student_status_today ss
        )
 SELECT c.id AS class_id,
    c.name AS class_name,
    c.school_id,
    count(DISTINCT s.profile_id) AS students_in_class,
    count(DISTINCT
        CASE
            WHEN (cat.status = 'present'::text) THEN cat.student_id
            ELSE NULL::uuid
        END) AS students_present_today,
    count(DISTINCT
        CASE
            WHEN (cat.status = 'absent'::text) THEN cat.student_id
            ELSE NULL::uuid
        END) AS students_absent_today,
    count(DISTINCT
        CASE
            WHEN (cat.status <> 'unmarked'::text) THEN cat.student_id
            ELSE NULL::uuid
        END) AS students_marked_today
   FROM ((public.structure_classes c
     LEFT JOIN public.profile_info_student s ON ((s.class_id = c.id)))
     LEFT JOIN categorized cat ON (((cat.class_id = c.id) AND (cat.student_id = s.profile_id))))
  WHERE (c.school_id = ( SELECT user_profiles.school_id
           FROM public.user_profiles
          WHERE (user_profiles.id = auth.uid())))
  GROUP BY c.id, c.name, c.school_id;

-- Object 3/31
CREATE VIEW public.vw_course_schedules_detailed WITH (security_invoker='true') AS
 WITH teacher_names_lookup AS (
         SELECT cs_1.id AS schedule_id,
            array_agg(((up.first_name || ' '::text) || up.last_name) ORDER BY up.last_name) AS teacher_names
           FROM ((public.course_schedules cs_1
             CROSS JOIN LATERAL unnest(cs_1.teacher_ids) teacher_id(teacher_id))
             JOIN public.user_profiles up ON ((up.id = teacher_id.teacher_id)))
          GROUP BY cs_1.id
        ), enrollment_data AS (
         SELECT cs_1.id AS schedule_id,
            count(ce.id) AS enrolled_count,
            array_agg((((up.first_name || ' '::text) || up.last_name) || COALESCE(((' ('::text || sc.name) || ')'::text), ''::text)) ORDER BY up.last_name) AS enrolled_names
           FROM ((((public.course_schedules cs_1
             JOIN public.course_enrollments ce ON (((ce.course_id = cs_1.course_id) AND (ce.school_id = cs_1.school_id) AND (CURRENT_DATE >= ce.start_date) AND (CURRENT_DATE <= ce.end_date))))
             JOIN public.user_profiles up ON ((up.id = ce.student_id)))
             JOIN public.profile_info_student pis ON ((pis.profile_id = ce.student_id)))
             LEFT JOIN public.structure_classes sc ON ((sc.id = pis.class_id)))
          GROUP BY cs_1.id
        )
 SELECT cs.id,
    cs.course_id,
    cl.name AS course_name,
    cl.is_for_year_g AS year_groups,
    cs.start_date,
    cs.end_date,
    COALESCE(sp.start_time, cs.start_time) AS start_time,
    COALESCE(sp.end_time, cs.end_time) AS end_time,
    cs.day_id,
    d.name_en AS day_name_en,
    d.name_de AS day_name_de,
    cs.room_id,
    r.name AS scheduled_room_name,
    cs.school_id,
    cs.teacher_ids,
    cs.period_id,
    sp.block_number,
    sp.label AS period_label,
    sp.group_label,
    cs.class_id,
    c.name AS class_name,
    cs.subject_id,
    s.name AS subject_name,
    cs.meeting_name,
    cs.notes,
    cs.is_archived,
    COALESCE(tnl.teacher_names, ARRAY[]::text[]) AS teacher_names,
    COALESCE(ed.enrolled_count, (0)::bigint) AS enrolled_students_count,
    ed.enrolled_names AS enrolled_students_names,
    cs.valid_from,
    cs.valid_until,
    cs.created_at
   FROM ((((((((public.course_schedules cs
     LEFT JOIN public.structure_days d ON ((cs.day_id = d.id)))
     LEFT JOIN public.course_list cl ON ((cs.course_id = cl.id)))
     LEFT JOIN public.structure_rooms r ON ((cs.room_id = r.id)))
     LEFT JOIN public.schedule_periods sp ON ((cs.period_id = sp.id)))
     LEFT JOIN public.structure_classes c ON ((cs.class_id = c.id)))
     LEFT JOIN public.subjects s ON ((cs.subject_id = s.id)))
     LEFT JOIN teacher_names_lookup tnl ON ((tnl.schedule_id = cs.id)))
     LEFT JOIN enrollment_data ed ON ((ed.schedule_id = cs.id)));

-- Object 4/31
CREATE VIEW public.vw_course_summary WITH (security_invoker='true') AS
 SELECT c.id AS course_id,
    c.name AS course_name,
    c.course_code,
    c.max_students,
    c.is_for_year_g,
    (c.max_students - count(DISTINCT ce.student_id)) AS free_spaces,
    s.id AS subject_id,
    s.name AS subject_name,
    si.icon_path AS subject_icon_path,
    count(DISTINCT ce.student_id) AS student_count,
    COALESCE(array_agg(DISTINCT (cs.day_id)::text ORDER BY (cs.day_id)::text), ARRAY[''::text]) AS weekday_ids,
    COALESCE(array_agg(DISTINCT concat_ws(' '::text, up.first_name, up.last_name)), ARRAY['noch nicht gesteckt'::text]) AS teacher_names,
    COALESCE(array_agg(DISTINCT up.first_name), ARRAY['noch nicht gesteckt'::text]) AS teacher_first_names,
    COALESCE(array_agg(DISTINCT up.last_name), ARRAY['noch nicht gesteckt'::text]) AS teacher_last_names,
    COALESCE(array_agg(DISTINCT tid.teacher_id), ARRAY[]::uuid[]) AS teacher_ids,
    COALESCE(array_agg(DISTINCT concat_ws(' '::text, up2.first_name, up2.last_name)), ARRAY[]::text[]) AS possible_staff_names,
    COALESCE(array_agg(DISTINCT staff_id.staff_id), ARRAY[]::uuid[]) AS possible_staff_ids,
    COALESCE(array_agg(DISTINCT concat((cpt.weekday)::text, '|', (cpt.schedule_period_id)::text)), ARRAY[]::text[]) AS possible_time_slots,
    c.start_date,
    c.end_date,
    c.description,
    c.wichtige_infos AS important_information,
    c.description_visible_to_parents,
    c.created_at,
    c.updated_at,
    c.possible_room_id,
    r.name AS possible_room_name,
    r.room_number AS possible_room_number,
    r.floor AS possible_room_floor,
    r.building AS possible_room_building
   FROM ((((((((((public.course_list c
     LEFT JOIN public.subjects s ON ((c.subject_id = s.id)))
     LEFT JOIN public.subject_icons si ON ((s.icon_id = si.id)))
     LEFT JOIN public.course_enrollments ce ON ((ce.course_id = c.id)))
     LEFT JOIN public.course_schedules cs ON ((cs.course_id = c.id)))
     LEFT JOIN LATERAL unnest(cs.teacher_ids) tid(teacher_id) ON (true))
     LEFT JOIN public.user_profiles up ON ((up.id = tid.teacher_id)))
     LEFT JOIN LATERAL unnest(c.possible_staff_members) staff_id(staff_id) ON (true))
     LEFT JOIN public.user_profiles up2 ON ((up2.id = staff_id.staff_id)))
     LEFT JOIN public.course_possible_times cpt ON ((cpt.course_id = c.id)))
     LEFT JOIN public.structure_rooms r ON ((r.id = c.possible_room_id)))
  WHERE (c.is_active = true)
  GROUP BY c.id, c.name, c.course_code, c.max_students, c.is_for_year_g, s.id, s.name, si.icon_path, c.start_date, c.end_date, c.description, c.wichtige_infos, c.description_visible_to_parents, c.created_at, c.updated_at, c.possible_room_id, r.name, r.room_number, r.floor, r.building;

-- Object 5/31
CREATE VIEW public.vw_daily_absences WITH (security_invoker='true') AS
 SELECT sa.id AS absence_id,
    sa.staff_id,
    ((up.first_name || ' '::text) || up.last_name) AS staff_name,
    sa.reason,
    sa.start_period,
    sa.end_period,
    ((sa.start_period IS NULL) AND (sa.end_period IS NULL)) AS is_full_day,
    ((sa.date)::timestamp without time zone AT TIME ZONE 'UTC'::text) AS start_of_day_utc,
    (((COALESCE(sa.end_date, sa.date))::timestamp without time zone AT TIME ZONE 'UTC'::text) + '23:59:59.999'::interval) AS end_of_day_utc,
    (to_char((sa.date)::timestamp with time zone, 'DD.MM.YYYY'::text) ||
        CASE
            WHEN ((sa.end_date IS NOT NULL) AND (sa.end_date <> sa.date)) THEN (' – '::text || to_char((sa.end_date)::timestamp with time zone, 'DD.MM.YYYY'::text))
            ELSE ''::text
        END) AS formatted_date_range,
    COALESCE(json_agg(json_build_object('lesson_id', cl.id, 'course_id', cl.course_id, 'course_name', c.name, 'start_datetime', cl.start_datetime, 'end_datetime', cl.end_datetime, 'room_id', cl.room_id) ORDER BY cl.start_datetime) FILTER (WHERE (cl.id IS NOT NULL)), '[]'::json) AS lessons
   FROM (((public.staff_absences sa
     JOIN public.user_profiles up ON ((sa.staff_id = up.id)))
     LEFT JOIN public.course_lessons cl ON (((sa.staff_id = ANY (cl.teacher_ids)) AND (cl.is_cancelled = false) AND ((cl.start_datetime)::date >= sa.date) AND ((cl.start_datetime)::date <= COALESCE(sa.end_date, sa.date)))))
     LEFT JOIN public.course_list c ON ((c.id = cl.course_id)))
  GROUP BY sa.id, sa.staff_id, up.first_name, up.last_name, sa.reason, sa.start_period, sa.end_period, sa.date, sa.end_date;

-- Object 6/31
CREATE VIEW public.vw_daily_attendance_by_class WITH (security_invoker='true') AS
 WITH current_attendance_date AS (
         SELECT CURRENT_DATE AS today
        ), class_attendance_summary AS (
         SELECT s.class_id,
            count(*) AS total_students,
            sum(
                CASE
                    WHEN (dl.student_id IS NOT NULL) THEN 1
                    ELSE 0
                END) AS marked_students,
            sum(
                CASE
                    WHEN (dl.presence_status = 'present'::public.presence_status) THEN 1
                    ELSE 0
                END) AS present_count,
            sum(
                CASE
                    WHEN (dl.presence_status = 'absent_excused'::public.presence_status) THEN 1
                    ELSE 0
                END) AS absent_excused_count,
            sum(
                CASE
                    WHEN (dl.presence_status = 'absent_unexcused'::public.presence_status) THEN 1
                    ELSE 0
                END) AS absent_unexcused_count,
            sum(
                CASE
                    WHEN (dl.presence_status = ANY (ARRAY['left_early'::public.presence_status, 'temporarily_offsite'::public.presence_status, 'left_without_notice'::public.presence_status])) THEN 1
                    ELSE 0
                END) AS partial_presence_count
           FROM ((public.profile_info_student s
             JOIN current_attendance_date cad_1 ON (true))
             LEFT JOIN public.student_daily_log dl ON (((dl.student_id = s.profile_id) AND (dl.date = cad_1.today))))
          GROUP BY s.class_id
        )
 SELECT c.id AS class_id,
    c.name AS class_name,
    cad.today AS attendance_date,
    cas.total_students,
    cas.present_count,
    cas.absent_excused_count,
    cas.absent_unexcused_count,
    cas.partial_presence_count,
    (cas.total_students - cas.marked_students) AS unmarked_count
   FROM ((public.structure_classes c
     JOIN class_attendance_summary cas ON ((cas.class_id = c.id)))
     CROSS JOIN current_attendance_date cad);

-- Object 7/31
CREATE VIEW public.vw_daily_attendance_overview WITH (security_invoker='true') AS
 WITH current_date_cte AS (
         SELECT CURRENT_DATE AS today
        ), attendance_summary AS (
         SELECT count(s.profile_id) AS total_students,
            sum(
                CASE
                    WHEN (dl.student_id IS NOT NULL) THEN 1
                    ELSE 0
                END) AS marked_students,
            sum(
                CASE
                    WHEN (dl.presence_status = 'present'::public.presence_status) THEN 1
                    ELSE 0
                END) AS present_count,
            sum(
                CASE
                    WHEN (dl.presence_status = 'absent_excused'::public.presence_status) THEN 1
                    ELSE 0
                END) AS absent_excused_count,
            sum(
                CASE
                    WHEN (dl.presence_status = 'absent_unexcused'::public.presence_status) THEN 1
                    ELSE 0
                END) AS absent_unexcused_count,
            sum(
                CASE
                    WHEN (dl.presence_status = ANY (ARRAY['left_early'::public.presence_status, 'temporarily_offsite'::public.presence_status, 'left_without_notice'::public.presence_status])) THEN 1
                    ELSE 0
                END) AS partial_presence_count
           FROM ((public.profile_info_student s
             CROSS JOIN current_date_cte cdc_1)
             LEFT JOIN public.student_daily_log dl ON (((dl.student_id = s.profile_id) AND (dl.date = cdc_1.today))))
        )
 SELECT cdc.today AS attendance_date,
    ats.total_students,
    ats.present_count,
    ats.absent_excused_count,
    ats.absent_unexcused_count,
    ats.partial_presence_count,
    (ats.total_students - ats.marked_students) AS unmarked_count
   FROM (attendance_summary ats
     CROSS JOIN current_date_cte cdc);

-- Object 8/31
CREATE VIEW public.vw_enrollments_with_students WITH (security_invoker='true') AS
 SELECT e.id,
    e.student_id,
    e.course_id,
    e.assigned_at,
    e.school_id,
    e.schedule_ids,
    e.is_trial,
    e.start_date,
    e.end_date,
    u.first_name,
    u.last_name,
    u.gender,
    u.profile_picture_url,
    u.school_id AS user_school_id,
    s.class_id,
    c.name AS class_name,
    s.notes,
    s.nickname,
    s.allergies
   FROM (((public.course_enrollments e
     JOIN public.user_profiles u ON ((e.student_id = u.id)))
     LEFT JOIN public.profile_info_student s ON ((s.profile_id = u.id)))
     LEFT JOIN public.structure_classes c ON ((s.class_id = c.id)))
  ORDER BY e.school_id, u.last_name, u.first_name, e.start_date DESC;

-- Object 9/31
CREATE VIEW public.vw_erzieher WITH (security_invoker='true') AS
 WITH staff_contacts AS (
         SELECT c.profile_id,
            json_agg(jsonb_build_object('id', c.id, 'contact_type', c.type, 'contact_value', c.value, 'notes', c.notes, 'is_primary', c.is_primary, 'status', c.status) ORDER BY c.is_primary DESC, c.type) AS contacts
           FROM public.contacts c
          WHERE (c.status = 'valid'::text)
          GROUP BY c.profile_id
        )
 SELECT u.id,
    u.first_name,
    u.last_name,
    u.date_of_birth,
    u.gender,
    u.school_id,
    u.profile_picture_url,
    u.account_status,
    s.status,
    s.login_active,
    s.last_invited_at,
    s.joined_at,
    s.employee_id,
    s.colour,
    u.role_id,
    COALESCE(sc.contacts, '[]'::json) AS contacts
   FROM ((public.user_profiles u
     JOIN public.profile_info_staff s ON ((u.id = s.profile_id)))
     LEFT JOIN staff_contacts sc ON ((sc.profile_id = u.id)))
  WHERE (u.role_id = '34fbd171-b2f5-4b3d-8e00-5f033269e885'::uuid)
  ORDER BY u.school_id, u.last_name, u.first_name;

-- Object 10/31
CREATE VIEW public.vw_erzieher_with_email WITH (security_invoker='true') AS
 WITH staff_contacts AS (
         SELECT c.profile_id,
            json_agg(jsonb_build_object('id', c.id, 'contact_type', c.type, 'contact_value', c.value, 'notes', c.notes, 'is_primary', c.is_primary, 'status', c.status) ORDER BY c.is_primary DESC, c.type) AS contacts,
            ( SELECT c2.value
                   FROM public.contacts c2
                  WHERE ((c2.profile_id = c.profile_id) AND (c2.type = 'email'::text) AND (c2.status = 'valid'::text))
                  ORDER BY c2.is_primary DESC
                 LIMIT 1) AS email
           FROM public.contacts c
          WHERE (c.status = 'valid'::text)
          GROUP BY c.profile_id
        )
 SELECT u.id,
    u.first_name,
    u.last_name,
    u.date_of_birth,
    u.gender,
    u.school_id,
    u.profile_picture_url,
    u.account_status,
    sc.email,
    s.status,
    s.login_active,
    s.last_invited_at,
    s.joined_at,
    s.employee_id,
    s.colour,
    u.role_id,
    COALESCE(sc.contacts, '[]'::json) AS contacts
   FROM ((public.user_profiles u
     JOIN public.profile_info_staff s ON ((u.id = s.profile_id)))
     LEFT JOIN staff_contacts sc ON ((sc.profile_id = u.id)))
  WHERE (u.role_id = '34fbd171-b2f5-4b3d-8e00-5f033269e885'::uuid)
  ORDER BY u.school_id, u.last_name, u.first_name;

-- Object 11/31
CREATE VIEW public.vw_externa WITH (security_invoker='true') AS
 WITH external_contacts AS (
         SELECT c.profile_id,
            json_agg(jsonb_build_object('id', c.id, 'contact_type', c.type, 'contact_value', c.value, 'notes', c.notes, 'is_primary', c.is_primary, 'status', c.status) ORDER BY c.is_primary DESC, c.type) AS contacts
           FROM public.contacts c
          WHERE (c.status = 'valid'::text)
          GROUP BY c.profile_id
        )
 SELECT u.id,
    u.first_name,
    u.last_name,
    u.date_of_birth,
    u.gender,
    u.school_id,
    u.profile_picture_url,
    u.account_status,
    s.status,
    s.login_active,
    s.last_invited_at,
    s.joined_at,
    s.employee_id,
    s.colour,
    u.role_id,
    COALESCE(ec.contacts, '[]'::json) AS contacts
   FROM ((public.user_profiles u
     JOIN public.profile_info_staff s ON ((u.id = s.profile_id)))
     LEFT JOIN external_contacts ec ON ((ec.profile_id = u.id)))
  WHERE (u.role_id = '2da8793c-44e9-4aba-887e-9f83cdb37527'::uuid)
  ORDER BY u.school_id, u.last_name, u.first_name;

-- Object 12/31
CREATE VIEW public.vw_family_all_members WITH (security_invoker='true') AS
 WITH family_child_relationships AS (
         SELECT link.family_id,
            link.adult_profile_id,
            json_agg(json_build_object('student_id', link.child_profile_id, 'relationship', link.relationship) ORDER BY link.relationship, link.child_profile_id) AS child_relationships
           FROM public.family_member_child_links link
          GROUP BY link.family_id, link.adult_profile_id
        ), adult_members AS (
         SELECT fm.family_id,
            fm.profile_id AS member_profile_id,
            'adult'::text AS member_type,
            up.first_name,
            up.last_name,
            NULL::text AS nickname,
            pifm.default_relationship,
            fm.is_primary_guardian,
            NULL::uuid AS student_id,
            NULL::uuid AS student_class,
            NULL::date AS date_of_birth,
            COALESCE(fcr.child_relationships, '[]'::json) AS child_relationships
           FROM (((public.family_members fm
             JOIN public.user_profiles up ON ((fm.profile_id = up.id)))
             LEFT JOIN public.profile_info_family_member pifm ON ((fm.profile_id = pifm.profile_id)))
             LEFT JOIN family_child_relationships fcr ON (((fcr.family_id = fm.family_id) AND (fcr.adult_profile_id = fm.profile_id))))
          WHERE ((fm.role = ANY (ARRAY['parent'::text, 'guardian'::text, 'staff'::text, 'other'::text])) AND (fm.removed_at IS NULL))
        ), child_members AS (
         SELECT fmcl.family_id,
            fmcl.child_profile_id AS member_profile_id,
            'child'::text AS member_type,
            up.first_name,
            up.last_name,
            pis.nickname,
            NULL::text AS default_relationship,
            NULL::boolean AS is_primary_guardian,
            fmcl.child_profile_id AS student_id,
            pis.class_id AS student_class,
            pis.date_of_birth,
            NULL::json AS child_relationships
           FROM ((public.family_member_child_links fmcl
             JOIN public.user_profiles up ON ((fmcl.child_profile_id = up.id)))
             LEFT JOIN public.profile_info_student pis ON ((fmcl.child_profile_id = pis.profile_id)))
        )
 SELECT adult_members.family_id,
    adult_members.member_profile_id,
    adult_members.member_type,
    adult_members.first_name,
    adult_members.last_name,
    adult_members.nickname,
    adult_members.default_relationship,
    adult_members.is_primary_guardian,
    adult_members.student_id,
    adult_members.student_class,
    adult_members.date_of_birth,
    adult_members.child_relationships
   FROM adult_members
UNION ALL
 SELECT child_members.family_id,
    child_members.member_profile_id,
    child_members.member_type,
    child_members.first_name,
    child_members.last_name,
    child_members.nickname,
    child_members.default_relationship,
    child_members.is_primary_guardian,
    child_members.student_id,
    child_members.student_class,
    child_members.date_of_birth,
    child_members.child_relationships
   FROM child_members
  ORDER BY 1, 3 DESC, 5, 4;

-- Object 13/31
CREATE VIEW public.vw_lesson_attendance_badges AS
SELECT
    NULL::uuid AS lesson_id,
    NULL::bigint AS total_students,
    NULL::bigint AS present_count,
    NULL::bigint AS late_count,
    NULL::bigint AS absent_count,
    NULL::text AS attendance_status;

-- Object 14/31
CREATE VIEW public.vw_lesson_view_enriched AS
SELECT
    NULL::uuid AS lesson_id,
    NULL::uuid AS course_id,
    NULL::text AS course_name,
    NULL::uuid AS subject_id,
    NULL::text AS subject_name,
    NULL::uuid AS class_id,
    NULL::text AS class_name,
    NULL::timestamp without time zone AS start_datetime,
    NULL::timestamp without time zone AS end_datetime,
    NULL::uuid[] AS teacher_ids,
    NULL::text[] AS teacher_names,
    NULL::boolean AS substitute_detected,
    NULL::text AS room_name,
    NULL::text[] AS period_names,
    NULL::bigint AS student_count,
    NULL::text[] AS student_names_with_class,
    NULL::bigint AS attendance_present_count,
    NULL::numeric AS attendance_percent,
    NULL::text[] AS warnings,
    NULL::text AS is_type;

-- Object 15/31
CREATE VIEW public.vw_lessons_needing_substitute WITH (security_invoker='true') AS
 WITH relevant_absences AS (
         SELECT staff_absences.id,
            staff_absences.staff_id,
            staff_absences.date,
            staff_absences.reason,
            staff_absences.notes,
            staff_absences.created_at,
            staff_absences.school_id,
            staff_absences.substitution_status,
            staff_absences.is_approved,
            staff_absences.approved_by,
            staff_absences.end_date,
            staff_absences.start_period,
            staff_absences.end_period,
            staff_absences.attachment_url,
            staff_absences.created_by
           FROM public.staff_absences
          WHERE (staff_absences.is_approved = true)
        ), lesson_absences AS (
         SELECT cl_1.id AS lesson_id,
            sa.staff_id,
            sa.is_approved
           FROM ((public.course_lessons cl_1
             JOIN public.schedule_periods sp_1 ON ((sp_1.id = cl_1.period_id)))
             JOIN public.staff_absences sa ON ((sa.staff_id = ANY (cl_1.teacher_ids))))
          WHERE ((cl_1.is_cancelled = false) AND ((cl_1.start_datetime)::date >= sa.date) AND ((cl_1.start_datetime)::date <= COALESCE(sa.end_date, sa.date)) AND (((sa.start_period IS NULL) AND (sa.end_period IS NULL)) OR ((sp_1.block_number IS NOT NULL) AND (sa.start_period IS NOT NULL) AND (sa.end_period IS NOT NULL) AND (sp_1.block_number >= sa.start_period) AND (sp_1.block_number <= sa.end_period))))
        ), proposed_substitutes AS (
         SELECT sub.original_lesson_id,
            array_agg(DISTINCT sub.substitute_staff_id) AS substitute_ids,
            array_agg(DISTINCT concat_ws(' '::text, up.first_name, up.last_name)) AS substitute_names,
            max(
                CASE
                    WHEN (sub.status = 'confirmed'::text) THEN 1
                    WHEN (sub.status = ANY (ARRAY['pending'::text, 'draft'::text])) THEN 2
                    ELSE 3
                END) AS substitution_rank
           FROM (public.substitutions sub
             LEFT JOIN public.user_profiles up ON ((up.id = sub.substitute_staff_id)))
          GROUP BY sub.original_lesson_id
        ), lesson_approval_status AS (
         SELECT lesson_absences.lesson_id,
            bool_or(lesson_absences.is_approved) AS has_approved_absence
           FROM lesson_absences
          GROUP BY lesson_absences.lesson_id
        )
 SELECT cl.id AS lesson_id,
    cl.teacher_ids,
    ARRAY( SELECT concat_ws(' '::text, up.first_name, up.last_name) AS concat_ws
           FROM (unnest(cl.teacher_ids) tid(tid)
             JOIN public.user_profiles up ON ((up.id = tid.tid)))) AS all_teacher_names,
    ARRAY( SELECT la.staff_id
           FROM lesson_absences la
          WHERE (la.lesson_id = cl.id)) AS absent_teacher_ids,
    ARRAY( SELECT concat_ws(' '::text, up.first_name, up.last_name) AS concat_ws
           FROM (lesson_absences la
             JOIN public.user_profiles up ON ((up.id = la.staff_id)))
          WHERE (la.lesson_id = cl.id)) AS absent_teacher_names,
    COALESCE(las.has_approved_absence, false) AS is_approved,
        CASE
            WHEN COALESCE(las.has_approved_absence, false) THEN 'Abwesenheit genehmigt'::text
            ELSE 'Noch nicht genehmigt'::text
        END AS absence_status,
    (cardinality(cl.teacher_ids) > 1) AS has_other_teachers,
    sp.label AS period_label,
    sp.block_number AS period_number,
    subj.name AS subject_name,
    sc.name AS class_name,
    sr.name AS room_name,
    cl.start_datetime,
    sd.id AS day_id,
    sd.name_en AS day_name_en,
    sd.name_de AS day_name_de,
        CASE
            WHEN (ps.substitution_rank = 1) THEN 'confirmed'::text
            WHEN (ps.substitution_rank = 2) THEN 'pending'::text
            WHEN ((ps.substitution_rank IS NULL) AND (cardinality(cl.teacher_ids) > 1)) THEN 'team_teaching'::text
            WHEN (ps.substitution_rank IS NULL) THEN 'required'::text
            ELSE 'required'::text
        END AS substitution_status,
    COALESCE(ps.substitute_ids, ARRAY[]::uuid[]) AS proposed_substitute_ids,
    COALESCE(ps.substitute_names, ARRAY[]::text[]) AS proposed_substitute_names
   FROM (((((((public.course_lessons cl
     LEFT JOIN public.schedule_periods sp ON ((sp.id = cl.period_id)))
     LEFT JOIN public.subjects subj ON ((subj.id = cl.subject_id)))
     LEFT JOIN public.structure_classes sc ON ((sc.id = cl.class_id)))
     LEFT JOIN public.structure_rooms sr ON ((sr.id = cl.room_id)))
     LEFT JOIN public.structure_days sd ON (((EXTRACT(isodow FROM cl.start_datetime))::integer = sd.day_number)))
     LEFT JOIN proposed_substitutes ps ON ((ps.original_lesson_id = cl.id)))
     LEFT JOIN lesson_approval_status las ON ((las.lesson_id = cl.id)))
  WHERE ((cl.is_cancelled = false) AND (EXISTS ( SELECT 1
           FROM lesson_absences la
          WHERE (la.lesson_id = cl.id))) AND ((cl.start_datetime)::date >= CURRENT_DATE));

-- Object 16/31
CREATE VIEW public.vw_parent_course_windows WITH (security_invoker='true') AS
 WITH windows AS (
         SELECT w_1.id AS window_id,
            w_1.school_id,
            w_1.semester_id,
            w_1.registration_period_id,
            rp.title AS period_title,
            rp.status AS period_status,
            rp.max_wishes_total,
            rp.max_wishes_per_day,
            w_1.course_id,
            c.name AS course_name,
            c.course_code,
            c.is_active AS course_active,
            w_1.opens_at,
            w_1.closes_at,
            w_1.grade_levels,
            c.description_visible_to_parents,
            c.description AS course_description,
            c.wichtige_infos AS course_wichtige_infos,
            c.pictures AS course_pictures
           FROM ((public.course_registration_windows w_1
             JOIN public.registration_periods rp ON ((rp.id = w_1.registration_period_id)))
             JOIN public.course_list c ON ((c.id = w_1.course_id)))
          WHERE (c.is_active = true)
        ), sched AS (
         SELECT s_1.window_id,
            array_agg(s_1.day_id ORDER BY s_1.day_id) FILTER (WHERE (s_1.day_id IS NOT NULL)) AS schedule_day_ids,
            array_agg(s_1.period_id ORDER BY s_1.period_id) FILTER (WHERE (s_1.period_id IS NOT NULL)) AS schedule_period_ids,
            array_agg(s_1.time_range ORDER BY s_1.time_range) AS schedule_time_ranges,
            array_agg(jsonb_build_object('day_id', s_1.day_id, 'period_id', s_1.period_id, 'start_time', s_1.start_time_fmt, 'end_time', s_1.end_time_fmt) ORDER BY s_1.day_id, s_1.period_id, s_1.start_time) AS schedule_slots
           FROM ( SELECT DISTINCT w_1.window_id,
                    cs.day_id,
                    cs.period_id,
                    to_char((cs.start_time)::interval, 'HH24:MI'::text) AS start_time_fmt,
                    to_char((cs.end_time)::interval, 'HH24:MI'::text) AS end_time_fmt,
                    ((to_char((cs.start_time)::interval, 'HH24:MI'::text) || '-'::text) || to_char((cs.end_time)::interval, 'HH24:MI'::text)) AS time_range,
                    cs.start_time
                   FROM (windows w_1
                     JOIN public.course_schedules cs ON (((cs.school_id = w_1.school_id) AND (cs.course_id = w_1.course_id) AND (COALESCE(cs.is_archived, false) = false) AND (daterange(cs.start_date, cs.end_date, '[]'::text) && daterange((w_1.opens_at)::date, (w_1.closes_at)::date, '[]'::text)))))) s_1
          GROUP BY s_1.window_id
        )
 SELECT w.window_id,
    w.school_id,
    w.semester_id,
    w.registration_period_id,
    w.period_title,
    w.period_status,
    w.max_wishes_total,
    w.max_wishes_per_day,
    w.course_id,
    w.course_name,
    w.course_code,
    w.course_active,
    w.opens_at,
    w.closes_at,
    w.grade_levels,
    ((now() >= w.opens_at) AND (now() <= w.closes_at)) AS is_open,
    (now() < w.opens_at) AS is_scheduled,
    (now() >= w.closes_at) AS is_closed,
    s.schedule_day_ids,
    s.schedule_period_ids,
    s.schedule_time_ranges,
    s.schedule_slots,
    w.description_visible_to_parents,
    w.course_description,
        CASE
            WHEN w.description_visible_to_parents THEN w.course_description
            ELSE NULL::text
        END AS course_description_for_parents,
    w.course_wichtige_infos,
    w.course_pictures,
        CASE
            WHEN (array_length(w.course_pictures, 1) >= 1) THEN w.course_pictures[1]
            ELSE NULL::text
        END AS course_picture_first
   FROM (windows w
     LEFT JOIN sched s ON ((s.window_id = w.window_id)))
  ORDER BY w.closes_at;

-- Object 17/31
CREATE VIEW public.vw_parent_open_registration_cta WITH (security_invoker='true') AS
 WITH windows AS (
         SELECT w.id,
            w.school_id,
            w.course_id,
            w.semester_id,
            w.opens_at,
            w.closes_at,
            w.created_at,
            w.created_by,
            w.registration_period_id,
            w.grade_levels
           FROM (public.course_registration_windows w
             JOIN public.course_list c ON ((c.id = w.course_id)))
          WHERE (c.is_active = true)
        ), period_bounds AS (
         SELECT w.registration_period_id,
            min(w.opens_at) AS opens_first_at,
            max(w.closes_at) AS closes_last_at
           FROM windows w
          GROUP BY w.registration_period_id
        ), period_grades AS (
         SELECT w.registration_period_id,
            unnest(COALESCE(w.grade_levels, '{}'::integer[])) AS g
           FROM windows w
        ), grades_agg AS (
         SELECT period_grades.registration_period_id,
            array_agg(DISTINCT period_grades.g ORDER BY period_grades.g) AS eligible_grades
           FROM period_grades
          GROUP BY period_grades.registration_period_id
        ), periods AS (
         SELECT rp.id AS registration_period_id,
            rp.school_id,
            rp.semester_id,
            rp.title AS period_title,
            pb.opens_first_at,
            pb.closes_last_at,
            ga.eligible_grades
           FROM ((public.registration_periods rp
             JOIN period_bounds pb ON ((pb.registration_period_id = rp.id)))
             LEFT JOIN grades_agg ga ON ((ga.registration_period_id = rp.id)))
        )
 SELECT p.registration_period_id,
    p.school_id,
    p.semester_id,
    p.period_title,
    p.opens_first_at,
    p.closes_last_at,
    p.eligible_grades,
    (((now() AT TIME ZONE 'Europe/Berlin'::text) >= p.opens_first_at) AND ((now() AT TIME ZONE 'Europe/Berlin'::text) <= p.closes_last_at)) AS is_open,
    ('Die Flex-Module sind jetzt geöffnet – bis '::text || to_char((p.closes_last_at AT TIME ZONE 'Europe/Berlin'::text), 'DD.MM.YYYY'::text)) AS headline_de,
    'Jetzt wählen'::text AS cta_label_de,
    ('/parent/registration?period_id='::text || (p.registration_period_id)::text) AS cta_href
   FROM periods p
  WHERE (((now() AT TIME ZONE 'Europe/Berlin'::text) >= p.opens_first_at) AND ((now() AT TIME ZONE 'Europe/Berlin'::text) <= p.closes_last_at))
  ORDER BY p.closes_last_at;

-- Object 18/31
CREATE VIEW public.vw_react_lesson_details WITH (security_invoker='true') AS
 SELECT cl.id AS lesson_id,
    s.name AS subject_name,
    sc.name AS class_name,
    sr.name AS room_name,
    cl.start_datetime,
    cl.end_datetime,
        CASE
            WHEN (sub.id IS NOT NULL) THEN 'substitute'::text
            WHEN (cl.is_cancelled = true) THEN 'cancelled'::text
            ELSE 'regular'::text
        END AS lesson_type,
    (sub.id IS NOT NULL) AS is_substitute,
    cl.is_cancelled,
    sub.substitute_staff_id,
    sub.reason AS cancellation_reason,
    COALESCE(cl.primary_teacher_id, cl.teacher_ids[1]) AS assigned_teacher_id,
        CASE
            WHEN (sub.substitute_staff_id IS NOT NULL) THEN ARRAY[concat(COALESCE(sub_teacher.first_name, ''::text), ' ', COALESCE(sub_teacher.last_name, ''::text))]
            ELSE
            CASE
                WHEN (array_length(cl.teacher_ids, 1) > 0) THEN ARRAY( SELECT concat(up.first_name, ' ', up.last_name) AS concat
                   FROM (unnest(cl.teacher_ids) tid(tid)
                     JOIN public.user_profiles up ON ((up.id = tid.tid)))
                  ORDER BY up.first_name, up.last_name)
                WHEN (cl.primary_teacher_id IS NOT NULL) THEN ARRAY[concat(primary_teacher.first_name, ' ', primary_teacher.last_name)]
                ELSE ARRAY[]::text[]
            END
        END AS teacher_names,
    count(DISTINCT COALESCE(ce.student_id, pis_class.profile_id)) AS student_count,
    array_agg(DISTINCT concat(COALESCE(up_course.first_name, up_class.first_name), ' ', COALESCE(up_course.last_name, up_class.last_name), ' (', COALESCE(sc_course.name, sc_class.name), ')')) FILTER (WHERE (COALESCE(up_course.id, up_class.id) IS NOT NULL)) AS student_names_with_class,
    date(cl.start_datetime) AS lesson_date,
    sp.block_number AS period_number,
    cl.notes,
    (count(sal.id) > 0) AS attendance_taken,
    cl.course_id,
    cl.subject_id,
    cl.class_id,
    cl.room_id,
    cl.school_id,
    s.color AS subject_color,
    s.abbreviation AS subject_abbreviation,
    sc.year AS class_year,
    sc.grade_level,
    sr.room_number,
    sr.building,
    sp.start_time AS period_start_time,
    sp.end_time AS period_end_time,
    sp.label AS period_label
   FROM (((((((((((((((public.course_lessons cl
     LEFT JOIN public.subjects s ON ((cl.subject_id = s.id)))
     LEFT JOIN public.structure_classes sc ON ((cl.class_id = sc.id)))
     LEFT JOIN public.structure_rooms sr ON ((cl.room_id = sr.id)))
     LEFT JOIN public.schedule_periods sp ON ((cl.period_id = sp.id)))
     LEFT JOIN public.substitutions sub ON ((sub.original_lesson_id = cl.id)))
     LEFT JOIN public.user_profiles sub_teacher ON ((sub.substitute_staff_id = sub_teacher.id)))
     LEFT JOIN public.user_profiles primary_teacher ON ((cl.primary_teacher_id = primary_teacher.id)))
     LEFT JOIN public.course_enrollments ce ON (((ce.course_id = cl.course_id) AND ((cl.start_datetime)::date >= ce.start_date) AND ((cl.start_datetime)::date <= ce.end_date))))
     LEFT JOIN public.user_profiles up_course ON ((up_course.id = ce.student_id)))
     LEFT JOIN public.profile_info_student pis_course ON ((pis_course.profile_id = ce.student_id)))
     LEFT JOIN public.structure_classes sc_course ON ((sc_course.id = pis_course.class_id)))
     LEFT JOIN public.profile_info_student pis_class ON (((pis_class.class_id = cl.class_id) AND (cl.course_id IS NULL))))
     LEFT JOIN public.user_profiles up_class ON ((up_class.id = pis_class.profile_id)))
     LEFT JOIN public.structure_classes sc_class ON ((sc_class.id = pis_class.class_id)))
     LEFT JOIN public.student_attendance_logs sal ON ((sal.lesson_id = cl.id)))
  WHERE (cl.is_archived = false)
  GROUP BY cl.id, s.name, sc.name, sr.name, cl.start_datetime, cl.end_datetime, cl.is_cancelled, sub.id, sub.substitute_staff_id, sub.reason, cl.primary_teacher_id, cl.teacher_ids, sub_teacher.first_name, sub_teacher.last_name, primary_teacher.first_name, primary_teacher.last_name, sp.block_number, cl.notes, cl.course_id, cl.subject_id, cl.class_id, cl.room_id, cl.school_id, s.color, s.abbreviation, sc.year, sc.grade_level, sr.room_number, sr.building, sp.start_time, sp.end_time, sp.label
  ORDER BY cl.start_datetime DESC;

-- Object 19/31
CREATE VIEW public.vw_registration_period_courses_by_day WITH (security_invoker='true') AS
 WITH windows AS (
         SELECT crw.id AS window_id,
            crw.course_id,
            crw.school_id,
            crw.registration_period_id,
            crw.semester_id,
            crw.opens_at,
            crw.closes_at,
            COALESCE(crw.grade_levels, cl.is_for_year_g) AS grade_levels_effective,
            cl.name AS course_name,
            cl.max_students
           FROM (public.course_registration_windows crw
             JOIN public.course_list cl ON ((cl.id = crw.course_id)))
          WHERE (cl.is_active = true)
        ), course_days AS (
         SELECT DISTINCT w_1.window_id,
            w_1.course_id,
            w_1.school_id,
            w_1.registration_period_id,
            w_1.semester_id,
            cs.day_id
           FROM (windows w_1
             JOIN public.course_schedules cs ON ((cs.course_id = w_1.course_id)))
        ), days AS (
         SELECT d_1.id AS day_id,
            d_1.day_number AS day_of_week,
            d_1.name_en AS day_name
           FROM public.structure_days d_1
          WHERE ((d_1.day_number >= 1) AND (d_1.day_number <= 5))
        ), teacher_names AS (
         SELECT cs.course_id,
            cs.day_id,
            string_agg(DISTINCT ((up.first_name || ' '::text) || up.last_name), ', '::text ORDER BY ((up.first_name || ' '::text) || up.last_name)) AS teacher
           FROM ((public.course_schedules cs
             LEFT JOIN LATERAL unnest(cs.teacher_ids) t(teacher_id) ON (true))
             LEFT JOIN public.user_profiles up ON ((up.id = t.teacher_id)))
          GROUP BY cs.course_id, cs.day_id
        ), room_names AS (
         SELECT cs.course_id,
            cs.day_id,
            COALESCE(string_agg(DISTINCT r.name, ', '::text ORDER BY r.name), ''::text) AS room
           FROM (public.course_schedules cs
             LEFT JOIN public.structure_rooms r ON ((r.id = cs.room_id)))
          GROUP BY cs.course_id, cs.day_id
        ), available_grades AS (
         SELECT w_1.course_id,
            w_1.school_id,
            string_agg(DISTINCT sc.name, ','::text ORDER BY sc.name) AS available_grades
           FROM (windows w_1
             LEFT JOIN public.structure_classes sc ON (((sc.school_id = w_1.school_id) AND (w_1.grade_levels_effective IS NOT NULL) AND (sc.grade_level = ANY (w_1.grade_levels_effective)))))
          GROUP BY w_1.course_id, w_1.school_id
        ), enrolled_counts AS (
         SELECT w_1.course_id,
            cs.day_id,
            w_1.semester_id,
            count(DISTINCT ce.student_id) AS enrolled_count
           FROM (((windows w_1
             JOIN public.course_schedules cs ON ((cs.course_id = w_1.course_id)))
             LEFT JOIN public.structure_school_semesters sss ON ((sss.id = w_1.semester_id)))
             LEFT JOIN public.course_enrollments ce ON (((ce.course_id = w_1.course_id) AND ((ce.start_date IS NULL) OR (sss.end_date IS NULL) OR (ce.start_date <= sss.end_date)) AND ((ce.end_date IS NULL) OR (sss.start_date IS NULL) OR (ce.end_date >= sss.start_date)))))
          GROUP BY w_1.course_id, cs.day_id, w_1.semester_id
        ), draft_enrolled_counts AS (
         SELECT cad.registration_period_id,
            cad.semester_id,
            cad.school_id,
            cad.day_of_week,
            cad.target_course_id AS course_id,
            count(*) AS draft_enrolled_count
           FROM public.course_allocation_drafts cad
          WHERE (cad.target_course_id IS NOT NULL)
          GROUP BY cad.registration_period_id, cad.semester_id, cad.school_id, cad.day_of_week, cad.target_course_id
        )
 SELECT cd.course_id AS id,
    w.window_id,
    w.course_name AS name,
    COALESCE(tn.teacher, ''::text) AS teacher,
    COALESCE(rm.room, ''::text) AS room,
    w.max_students AS max_capacity,
    COALESCE(ag.available_grades, ''::text) AS available_grades,
    d.day_name AS day,
    d.day_of_week,
    ((now() < w.opens_at) OR (now() > w.closes_at)) AS is_locked,
    COALESCE(dc.draft_enrolled_count, COALESCE(ec.enrolled_count, (0)::bigint)) AS enrolled_count,
    w.school_id,
    w.registration_period_id,
    w.semester_id
   FROM (((((((course_days cd
     JOIN windows w ON ((w.window_id = cd.window_id)))
     JOIN days d ON ((d.day_id = cd.day_id)))
     LEFT JOIN teacher_names tn ON (((tn.course_id = cd.course_id) AND (tn.day_id = cd.day_id))))
     LEFT JOIN room_names rm ON (((rm.course_id = cd.course_id) AND (rm.day_id = cd.day_id))))
     LEFT JOIN available_grades ag ON (((ag.course_id = cd.course_id) AND (ag.school_id = cd.school_id))))
     LEFT JOIN enrolled_counts ec ON (((ec.course_id = cd.course_id) AND (ec.day_id = cd.day_id) AND (ec.semester_id = w.semester_id))))
     LEFT JOIN draft_enrolled_counts dc ON (((dc.registration_period_id = w.registration_period_id) AND (dc.semester_id = w.semester_id) AND (dc.school_id = w.school_id) AND (dc.day_of_week = d.day_of_week) AND (dc.course_id = cd.course_id))));

-- Object 20/31
CREATE VIEW public.vw_registration_period_students_by_day WITH (security_invoker='true') AS
 WITH submissions AS (
         SELECT sws.id AS submission_id,
            sws.student_id,
            sws.school_id,
            sws.registration_period_id,
            sws.semester_id
           FROM public.student_course_wish_submissions sws
        ), choices_pivot AS (
         SELECT scwc.submission_id,
            scwc.day_of_week,
            bool_or(scwc.no_offer) AS has_no_offer,
            max(
                CASE
                    WHEN (scwc.rank = 1) THEN (scwc.window_id)::text
                    ELSE NULL::text
                END) AS rank1_window,
            max(
                CASE
                    WHEN (scwc.rank = 2) THEN (scwc.window_id)::text
                    ELSE NULL::text
                END) AS rank2_window,
            max(
                CASE
                    WHEN (scwc.rank = 3) THEN (scwc.window_id)::text
                    ELSE NULL::text
                END) AS rank3_window
           FROM public.student_course_wish_choices scwc
          GROUP BY scwc.submission_id, scwc.day_of_week
        ), students AS (
         SELECT p.id AS student_id,
            concat_ws(' '::text, p.first_name, p.last_name) AS full_name,
            COALESCE(c.name, ''::text) AS class_name
           FROM ((public.user_profiles p
             JOIN public.profile_info_student s_1 ON ((s_1.profile_id = p.id)))
             LEFT JOIN public.structure_classes c ON ((s_1.class_id = c.id)))
        )
 SELECT s.student_id AS id,
    st.full_name AS name,
    st.class_name AS class,
        CASE
            WHEN ((cp.has_no_offer IS TRUE) AND (cp.rank1_window IS NULL)) THEN 'go-home'::text
            ELSE COALESCE(cp.rank1_window, 'go-home'::text)
        END AS first_choice,
    COALESCE(cp.rank2_window, 'go-home'::text) AS second_choice,
    COALESCE(cp.rank3_window, 'go-home'::text) AS third_choice,
    cp.day_of_week,
    s.school_id,
    s.registration_period_id,
    s.semester_id,
        CASE
            WHEN (cad.special_target = ANY (ARRAY['waiting'::text, 'go-home'::text])) THEN NULL::uuid
            ELSE COALESCE(cad.target_course_id, fe.course_id)
        END AS current_enrollment
   FROM ((((submissions s
     JOIN choices_pivot cp ON ((cp.submission_id = s.submission_id)))
     JOIN students st ON ((st.student_id = s.student_id)))
     LEFT JOIN LATERAL ( SELECT ce2.course_id
           FROM ((((public.course_enrollments ce2
             JOIN public.course_schedules cs2 ON ((cs2.course_id = ce2.course_id)))
             JOIN public.structure_days sd2 ON ((sd2.id = cs2.day_id)))
             JOIN public.course_registration_windows w2 ON (((w2.course_id = ce2.course_id) AND (w2.school_id = s.school_id) AND (w2.registration_period_id = s.registration_period_id) AND (w2.semester_id = s.semester_id))))
             JOIN public.structure_school_semesters sb ON ((sb.id = s.semester_id)))
          WHERE ((ce2.student_id = s.student_id) AND (sd2.day_number = cp.day_of_week) AND ((ce2.start_date IS NULL) OR (sb.end_date IS NULL) OR (ce2.start_date <= sb.end_date)) AND ((ce2.end_date IS NULL) OR (sb.start_date IS NULL) OR (ce2.end_date >= sb.start_date)))
          ORDER BY cs2.start_time, ce2.course_id
         LIMIT 1) fe ON (true))
     LEFT JOIN public.course_allocation_drafts cad ON (((cad.registration_period_id = s.registration_period_id) AND (cad.semester_id = s.semester_id) AND (cad.school_id = s.school_id) AND (cad.student_id = s.student_id) AND (cad.day_of_week = cp.day_of_week))))
  WHERE ((cp.day_of_week >= 1) AND (cp.day_of_week <= 5));

-- Object 21/31
CREATE VIEW public.vw_school_days WITH (security_invoker='true') AS
 SELECT sd.school_id,
    d.id AS day_id,
    d.day_number,
    d.name_en,
    d.name_de
   FROM (public.structure_school_days sd
     JOIN public.structure_days d ON ((sd.day_id = d.id)));

-- Object 22/31
CREATE VIEW public.vw_staff WITH (security_invoker='true') AS
 WITH staff_contacts AS (
         SELECT c.profile_id,
            json_agg(jsonb_build_object('id', c.id, 'contact_type', c.type, 'contact_value', c.value, 'notes', c.notes, 'is_primary', c.is_primary, 'status', c.status) ORDER BY c.is_primary DESC, c.type) AS contacts
           FROM public.contacts c
          WHERE (c.status = 'valid'::text)
          GROUP BY c.profile_id
        )
 SELECT u.id,
    u.first_name,
    u.last_name,
    u.date_of_birth,
    u.gender,
    u.school_id,
    u.profile_picture_url,
    u.account_status,
    s.status,
    s.login_active,
    s.last_invited_at,
    s.joined_at,
    s.employee_id,
    s.colour,
    u.role_id,
    COALESCE(sc.contacts, '[]'::json) AS contacts
   FROM ((public.user_profiles u
     JOIN public.profile_info_staff s ON ((u.id = s.profile_id)))
     LEFT JOIN staff_contacts sc ON ((sc.profile_id = u.id)))
  ORDER BY u.school_id, u.last_name, u.first_name;

-- Object 23/31
CREATE VIEW public.vw_staff_availability_next_7_days WITH (security_invoker='true') AS
 WITH active_staff AS (
         SELECT up.id AS staff_id,
            up.first_name,
            up.last_name,
            up.school_id,
            up.profile_picture_url,
            COALESCE(r.name, 'Unknown'::text) AS role_name
           FROM (((public.user_profiles up
             LEFT JOIN public.user_roles ur ON ((ur.user_profile_id = up.id)))
             LEFT JOIN public.roles r ON ((r.id = ur.role_id)))
             JOIN public.profile_info_staff pis ON ((pis.profile_id = up.id)))
          WHERE ((r.name = ANY (ARRAY['Teacher'::text, 'Admin'::text])) OR (r.name IS NULL))
        ), next_7_days AS (
         SELECT ((CURRENT_DATE + ((i.i)::double precision * '1 day'::interval)))::date AS actual_date
           FROM generate_series(0, 6) i(i)
        ), school_days AS (
         SELECT structure_days.id AS day_id,
            structure_days.day_number,
            structure_days.name_en,
            structure_days.name_de
           FROM public.structure_days
        ), slot_matrix AS (
         SELECT s_1.staff_id,
            s_1.first_name,
            s_1.last_name,
            s_1.school_id,
            s_1.profile_picture_url,
            s_1.role_name,
            d.actual_date AS date,
            sd.day_id,
            sd.day_number,
            sd.name_en AS day_name_en,
            sd.name_de AS day_name_de,
            p.id AS period_id,
            p.block_number,
            p.start_time,
            p.end_time,
            p.label AS period_label
           FROM (((active_staff s_1
             CROSS JOIN next_7_days d)
             JOIN school_days sd ON (((sd.day_number)::numeric = EXTRACT(dow FROM d.actual_date))))
             JOIN public.schedule_periods p ON (((p.school_id = s_1.school_id) AND (p.block_type = 'instructional'::text))))
        ), holiday_days AS (
         SELECT schedule_calendar_exceptions.school_id,
            schedule_calendar_exceptions.date,
            schedule_calendar_exceptions.end_date,
            schedule_calendar_exceptions.notes
           FROM public.schedule_calendar_exceptions
          WHERE (schedule_calendar_exceptions.type = ANY (ARRAY['holiday'::text, 'school_closed'::text, 'no_courses'::text]))
        ), lesson_staff_info AS (
         SELECT cl.id AS lesson_id,
            (cl.start_datetime)::date AS lesson_date,
            cl.period_id,
            unnest(cl.teacher_ids) AS staff_id,
            subj.name AS subject_name,
            sc.name AS class_name,
            cl.meeting_name,
            cl.is_cancelled,
            cl.school_id
           FROM ((public.course_lessons cl
             LEFT JOIN public.subjects subj ON ((subj.id = cl.subject_id)))
             LEFT JOIN public.structure_classes sc ON ((sc.id = cl.class_id)))
          WHERE (((cl.start_datetime)::date >= CURRENT_DATE) AND ((cl.start_datetime)::date <= (CURRENT_DATE + '6 days'::interval)))
        ), colleagues AS (
         SELECT l.id AS lesson_id,
            array_agg(DISTINCT ((up.first_name || ' '::text) || up.last_name)) AS colleague_names
           FROM (public.course_lessons l
             LEFT JOIN public.user_profiles up ON ((up.id = ANY (l.teacher_ids))))
          WHERE (((l.start_datetime)::date >= CURRENT_DATE) AND ((l.start_datetime)::date <= (CURRENT_DATE + '6 days'::interval)))
          GROUP BY l.id
        ), absences AS (
         SELECT staff_absences.staff_id,
            staff_absences.date AS absence_date,
            staff_absences.start_period,
            staff_absences.end_period,
            staff_absences.reason AS absence_reason
           FROM public.staff_absences
          WHERE ((staff_absences.is_approved = true) AND (staff_absences.date >= CURRENT_DATE) AND (staff_absences.date <= (CURRENT_DATE + '6 days'::interval)))
        ), substituting AS (
         SELECT sub.substitute_staff_id AS staff_id,
            (cl.start_datetime)::date AS date,
            cl.period_id
           FROM (public.substitutions sub
             JOIN public.course_lessons cl ON ((cl.id = sub.original_lesson_id)))
          WHERE (((cl.start_datetime)::date >= CURRENT_DATE) AND ((cl.start_datetime)::date <= (CURRENT_DATE + '6 days'::interval)) AND (sub.status = ANY (ARRAY['draft'::text, 'confirmed'::text])))
        ), slots AS (
         SELECT sm.staff_id,
            sm.first_name,
            sm.last_name,
            sm.school_id,
            sm.profile_picture_url,
            sm.role_name,
            sm.date,
            sm.day_id,
            sm.day_number,
            sm.day_name_en,
            sm.day_name_de,
            sm.period_id,
            sm.block_number,
            sm.start_time,
            sm.end_time,
            sm.period_label,
            lsi.lesson_id,
            lsi.subject_name,
            lsi.class_name,
            lsi.meeting_name,
            lsi.is_cancelled,
            c.colleague_names,
            a.absence_reason,
                CASE
                    WHEN (h.school_id IS NOT NULL) THEN 'no_school'::text
                    WHEN lsi.is_cancelled THEN 'cancelled'::text
                    WHEN (s2.staff_id IS NOT NULL) THEN 'substituting'::text
                    WHEN ((lsi.lesson_id IS NOT NULL) AND (cardinality(c.colleague_names) > 1)) THEN 'team_teaching'::text
                    WHEN (lsi.lesson_id IS NOT NULL) THEN 'teaching'::text
                    WHEN (a.staff_id IS NOT NULL) THEN 'absent'::text
                    ELSE 'not_scheduled'::text
                END AS status,
            h.notes AS holiday_or_event_name
           FROM (((((slot_matrix sm
             LEFT JOIN lesson_staff_info lsi ON (((lsi.staff_id = sm.staff_id) AND (lsi.lesson_date = sm.date) AND (lsi.period_id = sm.period_id))))
             LEFT JOIN colleagues c ON ((c.lesson_id = lsi.lesson_id)))
             LEFT JOIN absences a ON (((a.staff_id = sm.staff_id) AND (a.absence_date = sm.date) AND (sm.block_number >= COALESCE(a.start_period, sm.block_number)) AND (sm.block_number <= COALESCE(a.end_period, sm.block_number)))))
             LEFT JOIN substituting s2 ON (((s2.staff_id = sm.staff_id) AND (s2.date = sm.date) AND (s2.period_id = sm.period_id))))
             LEFT JOIN LATERAL ( SELECT h_1.school_id,
                    h_1.date,
                    h_1.end_date,
                    h_1.notes
                   FROM holiday_days h_1
                  WHERE ((h_1.school_id = sm.school_id) AND (sm.date >= h_1.date) AND (sm.date <= COALESCE(h_1.end_date, h_1.date)))
                 LIMIT 1) h ON (true))
        ), on_duty AS (
         SELECT slots.staff_id,
            slots.date,
            bool_or((slots.status = ANY (ARRAY['teaching'::text, 'team_teaching'::text, 'substituting'::text]))) AS is_on_duty_today
           FROM slots
          GROUP BY slots.staff_id, slots.date
        )
 SELECT s.staff_id,
    s.first_name,
    s.last_name,
    s.school_id,
    s.profile_picture_url,
    s.role_name,
    s.date,
    s.day_id,
    s.day_number,
    s.day_name_en,
    s.day_name_de,
    s.period_id,
    s.block_number,
    s.start_time,
    s.end_time,
    s.period_label,
    s.lesson_id,
    s.subject_name,
    s.class_name,
    s.meeting_name,
    s.is_cancelled,
    s.colleague_names,
    s.absence_reason,
    s.status,
    s.holiday_or_event_name,
    od.is_on_duty_today,
        CASE
            WHEN (od.is_on_duty_today = false) THEN 'heute nicht im Dienst'::text
            ELSE NULL::text
        END AS dienst_status_text,
        CASE
            WHEN (s.status = 'absent'::text) THEN 5
            WHEN (s.status = ANY (ARRAY['no_school'::text, 'cancelled'::text])) THEN 6
            WHEN ((od.is_on_duty_today = false) AND (s.status = 'not_scheduled'::text)) THEN 4
            WHEN (s.status = 'teaching'::text) THEN 5
            WHEN (s.status = 'substituting'::text) THEN 3
            WHEN (s.status = 'team_teaching'::text) THEN 2
            WHEN ((od.is_on_duty_today = true) AND (s.status = 'not_scheduled'::text)) THEN 1
            ELSE 99
        END AS availability_sort_number
   FROM (slots s
     LEFT JOIN on_duty od ON (((od.staff_id = s.staff_id) AND (od.date = s.date))))
  ORDER BY
        CASE
            WHEN (s.status = 'absent'::text) THEN 5
            WHEN (s.status = ANY (ARRAY['no_school'::text, 'cancelled'::text])) THEN 6
            WHEN ((od.is_on_duty_today = false) AND (s.status = 'not_scheduled'::text)) THEN 4
            WHEN (s.status = 'teaching'::text) THEN 5
            WHEN (s.status = 'substituting'::text) THEN 3
            WHEN (s.status = 'team_teaching'::text) THEN 2
            WHEN ((od.is_on_duty_today = true) AND (s.status = 'not_scheduled'::text)) THEN 1
            ELSE 99
        END, s.staff_id, s.date, s.block_number;

-- Object 24/31
CREATE VIEW public.vw_staff_period_availability WITH (security_invoker='true') AS
 WITH teaching_roles AS (
         SELECT r.id AS role_id
           FROM public.roles r
          WHERE (r.name = ANY (ARRAY['Teacher'::text, 'Admin'::text]))
        ), teaching_staff AS (
         SELECT up.id AS staff_id,
            ((up.first_name || ' '::text) || up.last_name) AS full_name,
            r.name AS role
           FROM (((public.user_profiles up
             JOIN public.user_roles ur ON ((ur.user_profile_id = up.id)))
             JOIN teaching_roles tr ON ((ur.role_id = tr.role_id)))
             JOIN public.roles r ON ((ur.role_id = r.id)))
        ), school_periods AS (
         SELECT sp_1.id AS period_id,
            sp_1.school_id,
            sp_1.block_number,
            sp_1.label AS period_label,
            sp_1.start_time,
            sp_1.end_time
           FROM public.schedule_periods sp_1
          ORDER BY sp_1.block_number
        ), staff_absences AS (
         SELECT sa.staff_id,
            sa.date,
            sa.end_date,
            sa.start_period,
            sa.end_period,
            sa.is_approved
           FROM public.staff_absences sa
          WHERE (sa.is_approved = true)
        ), lesson_teachers AS (
         SELECT cl.id AS lesson_id,
            cl.period_id,
            cl.is_cancelled,
            t.teacher_id,
            cl.start_datetime
           FROM (public.course_lessons cl
             JOIN LATERAL unnest(cl.teacher_ids) t(teacher_id) ON (true))
        ), lesson_details AS (
         SELECT cl.id AS lesson_id,
            cl.period_id,
            cl.class_id,
            cl.subject_id,
            cl.room_id,
            cl.is_cancelled
           FROM public.course_lessons cl
        ), staff_scheduled_or_absent_today AS (
         SELECT ts_1.staff_id,
                CASE
                    WHEN (EXISTS ( SELECT 1
                       FROM lesson_teachers lt
                      WHERE ((lt.teacher_id = ts_1.staff_id) AND (lt.is_cancelled = false) AND ((lt.start_datetime)::date = (CURRENT_DATE AT TIME ZONE 'Europe/Berlin'::text))))) THEN true
                    WHEN (EXISTS ( SELECT 1
                       FROM staff_absences sa
                      WHERE ((sa.staff_id = ts_1.staff_id) AND (sa.date <= (CURRENT_DATE AT TIME ZONE 'Europe/Berlin'::text)) AND ((sa.end_date IS NULL) OR (sa.end_date >= (CURRENT_DATE AT TIME ZONE 'Europe/Berlin'::text)))))) THEN true
                    ELSE false
                END AS is_scheduled_or_absent_today
           FROM teaching_staff ts_1
        )
 SELECT ts.staff_id,
    ts.full_name,
    ts.role,
    sp.school_id,
    sp.block_number AS period_number,
    sp.period_label,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM staff_absences sa
              WHERE ((sa.staff_id = ts.staff_id) AND (sa.date <= (CURRENT_DATE AT TIME ZONE 'Europe/Berlin'::text)) AND ((sa.end_date IS NULL) OR (sa.end_date >= (CURRENT_DATE AT TIME ZONE 'Europe/Berlin'::text))) AND ((sa.start_period IS NULL) OR (sa.start_period <= sp.block_number)) AND ((sa.end_period IS NULL) OR (sa.end_period >= sp.block_number))))) THEN 'MARKED ABSENT'::text
            WHEN (EXISTS ( SELECT 1
               FROM lesson_teachers lt
              WHERE ((lt.teacher_id = ts.staff_id) AND (lt.period_id = sp.period_id) AND (lt.is_cancelled = false) AND ((lt.start_datetime)::date = (CURRENT_DATE AT TIME ZONE 'Europe/Berlin'::text))))) THEN 'BUSY'::text
            WHEN (ssat.is_scheduled_or_absent_today = false) THEN 'NOT SCHEDULED TODAY'::text
            ELSE 'AVAILABLE'::text
        END AS status,
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM (lesson_teachers lt
                 JOIN lesson_details ld ON ((ld.lesson_id = lt.lesson_id)))
              WHERE ((lt.teacher_id = ts.staff_id) AND (lt.period_id = sp.period_id) AND (lt.is_cancelled = false) AND ((lt.start_datetime)::date = (CURRENT_DATE AT TIME ZONE 'Europe/Berlin'::text))))) THEN ( SELECT concat('Class: ', ld.class_id, ', Subject: ', ld.subject_id, ', Room: ', ld.room_id) AS concat
               FROM (lesson_teachers lt
                 JOIN lesson_details ld ON ((ld.lesson_id = lt.lesson_id)))
              WHERE ((lt.teacher_id = ts.staff_id) AND (lt.period_id = sp.period_id) AND (lt.is_cancelled = false) AND ((lt.start_datetime)::date = (CURRENT_DATE AT TIME ZONE 'Europe/Berlin'::text)))
             LIMIT 1)
            ELSE NULL::text
        END AS lesson_info
   FROM ((teaching_staff ts
     CROSS JOIN school_periods sp)
     LEFT JOIN staff_scheduled_or_absent_today ssat ON ((ssat.staff_id = ts.staff_id)))
  ORDER BY ts.full_name, sp.block_number;

-- Object 25/31
CREATE VIEW public.vw_staff_with_preferences WITH (security_invoker='true') AS
 WITH staff_base AS (
         SELECT s.profile_id,
            s.skills,
            s.roles,
            s.school_id,
            s.status,
            s.login_active,
            s.last_invited_at,
            s.joined_at,
            s.employee_id,
            s.kurzung,
            s.hours_account,
            s.credit_hours,
            s.age_reduction,
            s.subjects_stud,
            s.credit_hours_note,
            s.colour,
            u.id AS user_id,
            u.first_name,
            u.last_name,
            concat(u.first_name, ' ', u.last_name) AS name
           FROM (public.profile_info_staff s
             JOIN public.user_profiles u ON ((u.id = s.profile_id)))
        ), studied_subjects_agg AS (
         SELECT sb_1.profile_id,
            json_agg(DISTINCT jsonb_build_object('id', subj.id, 'name', subj.name, 'color', subj.color, 'icon_id', subj.icon_id)) AS studied_subjects
           FROM staff_base sb_1,
            (LATERAL unnest(sb_1.subjects_stud) subject_id(subject_id)
             JOIN public.subjects subj ON ((subj.id = subject_id.subject_id)))
          GROUP BY sb_1.profile_id
        ), preference_subjects AS (
         SELECT p.id AS preference_id,
            json_agg(jsonb_build_object('id', sp.id, 'name', sp.name, 'color', sp.color, 'icon_id', sp.icon_id)) AS subject_pref_data
           FROM public.staff_yearly_preferences p,
            (LATERAL unnest(p.subject_pref) sp_id(sp_id)
             JOIN public.subjects sp ON ((sp.id = sp_id.sp_id)))
          GROUP BY p.id
        ), preference_classes AS (
         SELECT p.id AS preference_id,
            json_agg(jsonb_build_object('id', c.id, 'name', c.name, 'grade_level', c.grade_level)) AS class_info_data
           FROM public.staff_yearly_preferences p,
            (LATERAL unnest(p.classes) class_id(class_id)
             JOIN public.structure_classes c ON ((c.id = class_id.class_id)))
          GROUP BY p.id
        ), preferences_complete AS (
         SELECT p.staff_profile_id,
            json_agg(jsonb_build_object('id', p.id, 'semester_id', p.semester_id, 'subject_pref', COALESCE(ps.subject_pref_data, '[]'::json), 'classes', p.classes, 'class_info', COALESCE(pc_1.class_info_data, '[]'::json), 'clubs', p.clubs, 'team', p.team, 'efob_team', p.efob_team, 'wishes', p.wishes, 'needs', p.needs, 'created_at', p.created_at, 'updated_at', p.updated_at) ORDER BY p.semester_id) AS preferences
           FROM ((public.staff_yearly_preferences p
             LEFT JOIN preference_subjects ps ON ((ps.preference_id = p.id)))
             LEFT JOIN preference_classes pc_1 ON ((pc_1.preference_id = p.id)))
          GROUP BY p.staff_profile_id
        )
 SELECT sb.user_id,
    sb.first_name,
    sb.last_name,
    sb.name,
    sb.profile_id,
    sb.kurzung,
    sb.subjects_stud,
    COALESCE(ssa.studied_subjects, '[]'::json) AS studied_subjects,
    sb.hours_account,
    sb.credit_hours,
    sb.age_reduction,
    sb.school_id,
    sb.status,
    sb.roles,
    sb.skills,
    sb.joined_at,
    sb.colour,
    COALESCE(pc.preferences, '[]'::json) AS preferences
   FROM ((staff_base sb
     LEFT JOIN studied_subjects_agg ssa ON ((ssa.profile_id = sb.profile_id)))
     LEFT JOIN preferences_complete pc ON ((pc.staff_profile_id = sb.profile_id)));

-- Object 26/31
CREATE VIEW public.vw_structure_school_years_with_periods WITH (security_invoker='true', security_barrier='true') AS
 SELECT y.id AS school_year_id,
    y.school_id,
    y.label AS year_label,
    y.start_date AS year_start,
    y.end_date AS year_end,
    COALESCE(json_agg(jsonb_build_object('id', s.id, 'name', s.name, 'start_date', s.start_date, 'end_date', s.end_date, 'is_active', s.is_active, 'created_at', s.created_at) ORDER BY s.start_date) FILTER (WHERE (s.id IS NOT NULL)), '[]'::json) AS semesters
   FROM (public.structure_school_years y
     LEFT JOIN public.structure_school_semesters s ON ((y.id = s.school_year_id)))
  GROUP BY y.id, y.school_id, y.label, y.start_date, y.end_date;

-- Object 27/31
CREATE VIEW public.vw_student_attendance_today WITH (security_invoker='true') AS
 WITH students_with_attendance AS (
         SELECT s.id AS student_id,
            i.class_id
           FROM (public.user_profiles s
             JOIN public.profile_info_student i ON ((s.id = i.profile_id)))
          WHERE ((EXISTS ( SELECT 1
                   FROM public.student_daily_log d_1
                  WHERE ((d_1.student_id = s.id) AND (d_1.date = CURRENT_DATE)))) OR (EXISTS ( SELECT 1
                   FROM public.student_attendance_logs a_1
                  WHERE ((a_1.student_id = s.id) AND (a_1."timestamp" >= CURRENT_DATE) AND (a_1."timestamp" < (CURRENT_DATE + '1 day'::interval))))))
        )
 SELECT swa.student_id,
    swa.class_id,
    d.presence_status,
    a.status AS lesson_status,
    a.lesson_id
   FROM ((students_with_attendance swa
     LEFT JOIN public.student_daily_log d ON (((swa.student_id = d.student_id) AND (d.date = CURRENT_DATE))))
     LEFT JOIN public.student_attendance_logs a ON (((swa.student_id = a.student_id) AND (a."timestamp" >= CURRENT_DATE) AND (a."timestamp" < (CURRENT_DATE + '1 day'::interval)))));

-- Object 28/31
CREATE VIEW public.vw_student_profiles WITH (security_invoker='true') AS
 SELECT p.id AS profile_id,
    p.first_name,
    s.middle_name,
    p.last_name,
    s.nickname,
    p.gender,
    p.date_of_birth,
    p.profile_picture_url,
    s.class_id,
    c.name AS class_name,
    c.grade_level,
    c.teacher_id,
    s.notes,
    s.allergies,
    s.school_id,
    fm.family_id,
    f.family_code,
    f.family_name,
    COALESCE(parents_data.parents, '[]'::json) AS parents,
    COALESCE(siblings_data.siblings, '[]'::json) AS siblings
   FROM ((((((public.user_profiles p
     JOIN public.profile_info_student s ON ((s.profile_id = p.id)))
     LEFT JOIN public.structure_classes c ON ((s.class_id = c.id)))
     LEFT JOIN public.family_members fm ON (((fm.profile_id = p.id) AND (fm.role = 'student'::text) AND (fm.removed_at IS NULL))))
     LEFT JOIN public.families f ON ((f.id = fm.family_id)))
     LEFT JOIN LATERAL ( SELECT json_agg(json_build_object('profile_id', fm2.profile_id, 'role', fm2.role, 'relation_description', fm2.relation_description, 'is_primary_guardian', fm2.is_primary_guardian, 'first_name', up.first_name, 'last_name', up.last_name, 'profile_picture_url', up.profile_picture_url, 'authorized_for_pickup', fmcl.authorized_for_pickup, 'account_status', up.account_status) ORDER BY up.first_name) AS parents
           FROM ((public.family_members fm2
             JOIN public.user_profiles up ON ((up.id = fm2.profile_id)))
             LEFT JOIN public.family_member_child_links fmcl ON (((fmcl.family_id = fm2.family_id) AND (fmcl.adult_profile_id = fm2.profile_id) AND (fmcl.child_profile_id = p.id))))
          WHERE ((fm2.family_id = fm.family_id) AND (fm2.role = 'parent'::text) AND (fm2.removed_at IS NULL))) parents_data ON ((fm.family_id IS NOT NULL)))
     LEFT JOIN LATERAL ( SELECT json_agg(json_build_object('profile_id', fm2.profile_id, 'role', fm2.role, 'relation_description', fm2.relation_description, 'first_name', up.first_name, 'last_name', up.last_name, 'profile_picture_url', up.profile_picture_url, 'class_name', c2.name, 'grade_level', c2.grade_level, 'authorized_for_pickup', (fm2.profile_id = ANY (s.authorized_pickup_ids))) ORDER BY up.first_name) AS siblings
           FROM (((public.family_members fm2
             JOIN public.user_profiles up ON ((up.id = fm2.profile_id)))
             JOIN public.profile_info_student s2 ON ((s2.profile_id = fm2.profile_id)))
             LEFT JOIN public.structure_classes c2 ON ((c2.id = s2.class_id)))
          WHERE ((fm2.family_id = fm.family_id) AND (fm2.role = 'student'::text) AND (fm2.profile_id <> p.id) AND (fm2.removed_at IS NULL))) siblings_data ON ((fm.family_id IS NOT NULL)));

-- Object 29/31
CREATE VIEW public.vw_subject_grade_hours WITH (security_invoker='true') AS
 SELECT s.id AS subject_id,
    s.name AS subject_name,
    s.icon,
    s.color,
    s.subject_type,
    s.school_id,
    g.grade_level,
    g.hours_per_week
   FROM (public.subjects s
     LEFT JOIN public.subject_grade_hours g ON ((g.subject_id = s.id)));

-- Object 30/31
CREATE VIEW public.vw_subjects_with_grade_and_class_hours AS
SELECT
    NULL::uuid AS subject_id,
    NULL::text AS subject_name,
    NULL::text AS abbreviation,
    NULL::text AS icon,
    NULL::text AS color,
    NULL::public.subject_type_enum AS subject_type,
    NULL::uuid AS school_id,
    NULL::json AS grade_hours;

-- Object 31/31
CREATE VIEW public.vw_user_roles AS
 SELECT ur.user_profile_id,
    array_agg(r.name ORDER BY r.name) AS roles
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  GROUP BY ur.user_profile_id;

