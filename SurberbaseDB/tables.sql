--
-- CREATE TABLE STATEMENTS
--
-- Extracted from flexwise28082025dump.sql
-- Total objects: 112
--

-- Object 1/112
CREATE TABLE _realtime.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


ALTER TABLE _realtime.extensions OWNER TO supabase_admin;

-- Object 2/112
CREATE TABLE _realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE _realtime.schema_migrations OWNER TO supabase_admin;

-- Object 3/112
CREATE TABLE _realtime.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL
);


ALTER TABLE _realtime.tenants OWNER TO supabase_admin;

-- Object 4/112
CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

-- Object 5/112
CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

-- Object 6/112
CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

-- Object 7/112
CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

-- Object 8/112
CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

-- Object 9/112
CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

-- Object 10/112
CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

-- Object 11/112
CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

-- Object 12/112
CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

-- Object 13/112
CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

-- Object 14/112
CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

-- Object 15/112
CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

-- Object 16/112
CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

-- Object 17/112
CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

-- Object 18/112
CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

-- Object 19/112
CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

-- Object 20/112
CREATE TABLE public.bulletin_post_users (
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    school_id uuid NOT NULL
);


ALTER TABLE public.bulletin_post_users OWNER TO supabase_admin;

-- Object 21/112
CREATE TABLE public.bulletin_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    attachments text[] DEFAULT '{}'::text[],
    display_from timestamp without time zone DEFAULT now() NOT NULL,
    notify_on_post boolean DEFAULT false,
    is_recurring boolean DEFAULT false,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    visible_groups uuid[] DEFAULT '{}'::uuid[],
    read_required boolean DEFAULT false NOT NULL,
    recurrence_id uuid,
    is_important boolean DEFAULT false NOT NULL
);


ALTER TABLE public.bulletin_posts OWNER TO supabase_admin;

-- Object 22/112
CREATE TABLE public.bulletin_recurrences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    repeat_every_unit text NOT NULL,
    repeat_every_number smallint NOT NULL,
    week_days smallint[],
    monthly_text text,
    original_post_id uuid NOT NULL,
    school_id uuid NOT NULL
);


ALTER TABLE public.bulletin_recurrences OWNER TO supabase_admin;

-- Object 23/112
CREATE TABLE public.change_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    change_group_id uuid,
    user_id uuid NOT NULL,
    school_id uuid,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    action_type text NOT NULL,
    before_data jsonb,
    after_data jsonb,
    reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_undone boolean DEFAULT false,
    undone_by uuid,
    undone_at timestamp without time zone,
    source text DEFAULT 'manual'::text,
    CONSTRAINT change_log_action_type_check CHECK ((action_type = ANY (ARRAY['insert'::text, 'update'::text, 'soft_delete'::text, 'hard_delete'::text, 'undo'::text])))
);


ALTER TABLE public.change_log OWNER TO supabase_admin;

-- Object 24/112
CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    profile_type text NOT NULL,
    type text NOT NULL,
    label text,
    value text NOT NULL,
    is_primary boolean DEFAULT false,
    notes text,
    status text DEFAULT 'valid'::text,
    created_at timestamp without time zone DEFAULT now(),
    is_linked_to_user_login boolean DEFAULT false NOT NULL,
    school_id uuid NOT NULL,
    CONSTRAINT contacts_status_check CHECK ((status = ANY (ARRAY['valid'::text, 'invalid'::text, 'archived'::text])))
);


ALTER TABLE public.contacts OWNER TO supabase_admin;

-- Object 25/112
CREATE TABLE public.course_allocation_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_period_id uuid NOT NULL,
    day_id integer NOT NULL,
    student_id uuid NOT NULL,
    target_course_id uuid,
    special_target text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    school_id uuid NOT NULL,
    semester_id uuid NOT NULL,
    day_of_week smallint NOT NULL,
    CONSTRAINT cad_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 5))),
    CONSTRAINT cad_exactly_one_target CHECK ((((target_course_id IS NOT NULL) AND (special_target IS NULL)) OR ((target_course_id IS NULL) AND (special_target IS NOT NULL)))),
    CONSTRAINT course_allocation_drafts_special_target_check CHECK ((special_target = ANY (ARRAY['waiting'::text, 'go-home'::text])))
);


ALTER TABLE public.course_allocation_drafts OWNER TO supabase_admin;

-- Object 26/112
CREATE TABLE public.course_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    course_id uuid,
    priority integer,
    school_id uuid NOT NULL,
    window_id uuid,
    registration_period_id uuid NOT NULL,
    semester_id uuid NOT NULL,
    day_of_week smallint,
    rank smallint,
    status text DEFAULT 'pending'::text NOT NULL,
    source text DEFAULT 'interview'::text NOT NULL,
    applied_at timestamp with time zone,
    created_by uuid,
    CONSTRAINT applications_priority_check CHECK (((priority >= 1) AND (priority <= 3))),
    CONSTRAINT course_applications_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 5))),
    CONSTRAINT course_applications_rank_check CHECK (((rank >= 1) AND (rank <= 10)))
);


ALTER TABLE public.course_applications OWNER TO postgres;

-- Object 27/112
CREATE TABLE public.course_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    course_id uuid,
    assigned_at timestamp without time zone DEFAULT now(),
    school_id uuid NOT NULL,
    schedule_ids uuid[] DEFAULT '{}'::uuid[],
    is_trial boolean DEFAULT false,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date DEFAULT (CURRENT_DATE + '90 days'::interval) NOT NULL,
    CONSTRAINT enrollment_dates_valid CHECK ((start_date <= end_date))
);


ALTER TABLE public.course_enrollments OWNER TO postgres;

-- Object 28/112
CREATE TABLE public.course_lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid,
    is_cancelled boolean DEFAULT false,
    notes text,
    school_id uuid NOT NULL,
    is_generated boolean DEFAULT true,
    teacher_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    schedule_id uuid,
    start_datetime timestamp without time zone NOT NULL,
    end_datetime timestamp without time zone NOT NULL,
    period_id uuid,
    period_ids uuid[],
    period_count integer,
    room_id uuid,
    subject_id uuid,
    class_id uuid,
    is_lesson_based boolean DEFAULT false,
    meeting_name text,
    primary_teacher_id uuid,
    replaced_by_lesson_id uuid,
    replacing_lesson_id uuid,
    replaces_lesson_id uuid,
    is_archived boolean DEFAULT false
);


ALTER TABLE public.course_lessons OWNER TO postgres;

-- Object 29/112
CREATE TABLE public.course_list (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name text NOT NULL,
    max_students integer,
    start_date date,
    end_date date,
    is_active boolean DEFAULT true,
    course_code text,
    is_for_year_g integer[],
    description text,
    pictures text[] DEFAULT ARRAY[]::text[],
    wichtige_infos text,
    subject_id uuid,
    is_open_course boolean DEFAULT false NOT NULL,
    description_visible_to_parents boolean DEFAULT false NOT NULL,
    possible_staff_members uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    possible_room_id uuid
);


ALTER TABLE public.course_list OWNER TO postgres;

-- Object 30/112
CREATE TABLE public.course_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id text NOT NULL,
    school_id text NOT NULL,
    registration_period_id text NOT NULL,
    semester_id text NOT NULL,
    day_of_week integer NOT NULL,
    text text NOT NULL,
    author text DEFAULT 'Admin'::text NOT NULL,
    is_problem boolean DEFAULT false,
    is_resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    resolved_by text
);


ALTER TABLE public.course_notes OWNER TO supabase_admin;

-- Object 31/112
CREATE TABLE public.course_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    proposed_by uuid NOT NULL,
    name text NOT NULL,
    max_students integer,
    is_for_year_g integer[],
    description text,
    pictures text[] DEFAULT ARRAY[]::text[],
    wichtige_infos text,
    description_visible_to_parents boolean DEFAULT false NOT NULL,
    possible_team_members text,
    status text DEFAULT 'pending'::text NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    approver_comments text,
    rejection_reason text,
    converted_to_course_id uuid,
    auto_convert_on_approval boolean DEFAULT true,
    proposed_start_date date,
    proposed_duration_weeks integer,
    proposer_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_approval_fields CHECK ((((status = 'approved'::text) AND (approved_by IS NOT NULL) AND (approved_at IS NOT NULL)) OR ((status = 'rejected'::text) AND (approved_by IS NOT NULL) AND (approved_at IS NOT NULL)) OR (status = ANY (ARRAY['pending'::text, 'withdrawn'::text])))),
    CONSTRAINT check_converted_course CHECK ((((status = 'approved'::text) AND (converted_to_course_id IS NOT NULL)) OR ((status <> 'approved'::text) AND (converted_to_course_id IS NULL)) OR (auto_convert_on_approval = false))),
    CONSTRAINT course_offers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'withdrawn'::text])))
);


ALTER TABLE public.course_offers OWNER TO supabase_admin;

-- Object 32/112
CREATE TABLE public.course_possible_times (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    weekday smallint NOT NULL,
    schedule_period_id uuid NOT NULL,
    school_id uuid NOT NULL,
    is_custom_time boolean DEFAULT false NOT NULL,
    custom_start time without time zone,
    custom_duration interval,
    created_by uuid,
    CONSTRAINT course_possible_times_weekday_check CHECK (((weekday >= 1) AND (weekday <= 6)))
);


ALTER TABLE public.course_possible_times OWNER TO supabase_admin;

-- Object 33/112
CREATE TABLE public.course_registration_windows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    course_id uuid NOT NULL,
    semester_id uuid NOT NULL,
    opens_at timestamp with time zone NOT NULL,
    closes_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    registration_period_id uuid NOT NULL,
    grade_levels integer[],
    CONSTRAINT course_registration_windows_dates_check CHECK ((closes_at > opens_at))
);


ALTER TABLE public.course_registration_windows OWNER TO supabase_admin;

-- Object 34/112
CREATE TABLE public.course_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    room_id uuid,
    school_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    teacher_ids uuid[] DEFAULT ARRAY[]::uuid[],
    valid_from date DEFAULT CURRENT_DATE NOT NULL,
    valid_until date DEFAULT (CURRENT_DATE + '90 days'::interval) NOT NULL,
    day_id integer,
    period_id uuid,
    period_ids uuid[],
    subject_id uuid,
    class_id uuid,
    meeting_name text,
    notes text,
    primary_teacher_id uuid,
    is_archived boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.course_schedules OWNER TO postgres;

-- Object 35/112
CREATE TABLE public.debug_logs (
    id integer NOT NULL,
    message text,
    created_at timestamp without time zone DEFAULT now(),
    step text
);


ALTER TABLE public.debug_logs OWNER TO supabase_admin;

-- Object 36/112
CREATE TABLE public.document_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    school_id uuid
);


ALTER TABLE public.document_types OWNER TO supabase_admin;

-- Object 37/112
CREATE TABLE public.families (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    family_code text,
    family_name text,
    created_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by uuid
);


ALTER TABLE public.families OWNER TO supabase_admin;

-- Object 38/112
CREATE TABLE public.family_member_child_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    adult_profile_id uuid NOT NULL,
    child_profile_id uuid NOT NULL,
    relationship text,
    access_restricted boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    authorized_for_pickup boolean DEFAULT false NOT NULL,
    pickup_priority smallint,
    school_id uuid NOT NULL,
    CONSTRAINT family_member_child_links_pickup_priority_check CHECK ((pickup_priority >= 1))
);


ALTER TABLE public.family_member_child_links OWNER TO supabase_admin;

-- Object 39/112
CREATE TABLE public.family_members (
    family_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    role text NOT NULL,
    relation_description text,
    is_primary_guardian boolean DEFAULT false,
    is_primary_contact boolean DEFAULT false,
    added_at timestamp without time zone DEFAULT now(),
    added_by uuid,
    removed_at timestamp without time zone,
    removed_by uuid,
    notes text,
    school_id uuid NOT NULL,
    CONSTRAINT family_members_role_check CHECK ((role = ANY (ARRAY['student'::text, 'parent'::text, 'guardian'::text, 'staff'::text, 'other'::text])))
);


ALTER TABLE public.family_members OWNER TO supabase_admin;

-- Object 40/112
CREATE TABLE public.ingest_interview_debug_log (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    student_id uuid,
    registration_period_id uuid,
    stage text,
    message text,
    details jsonb
);


ALTER TABLE public.ingest_interview_debug_log OWNER TO supabase_admin;

-- Object 41/112
CREATE TABLE public.lesson_diary_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    school_id uuid NOT NULL,
    entry_text text NOT NULL,
    entry_type text DEFAULT 'general'::text NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    CONSTRAINT lesson_diary_entries_entry_type_check CHECK ((entry_type = ANY (ARRAY['general'::text, 'attendance'::text, 'behavior'::text, 'curriculum'::text, 'special_event'::text, 'substitute'::text])))
);


ALTER TABLE public.lesson_diary_entries OWNER TO supabase_admin;

-- Object 42/112
CREATE TABLE public.profile_info_family_member (
    profile_id uuid NOT NULL,
    school_id uuid NOT NULL,
    can_log_in boolean DEFAULT false,
    is_primary_guardian boolean DEFAULT false,
    default_relationship text,
    access_notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by uuid
);


ALTER TABLE public.profile_info_family_member OWNER TO postgres;

-- Object 43/112
CREATE TABLE public.profile_info_staff (
    profile_id uuid NOT NULL,
    skills text[],
    roles text[],
    school_id uuid NOT NULL,
    status text DEFAULT 'active'::text,
    login_active boolean DEFAULT true,
    last_invited_at timestamp without time zone,
    joined_at date,
    employee_id text,
    kurzung text,
    hours_account integer,
    credit_hours integer,
    age_reduction integer,
    subjects_stud uuid[],
    credit_hours_note text,
    colour text,
    CONSTRAINT profile_info_staff_status_check CHECK ((status = ANY (ARRAY['active'::text, 'on_leave'::text, 'archived'::text])))
);


ALTER TABLE public.profile_info_staff OWNER TO postgres;

-- Object 44/112
CREATE TABLE public.profile_info_student (
    profile_id uuid NOT NULL,
    class_id uuid,
    date_of_birth date,
    notes text,
    school_id uuid NOT NULL,
    middle_name text,
    nickname text,
    allergies text,
    required_school_times jsonb,
    early_departure_policy text,
    policy_editable_by_parent boolean DEFAULT false,
    policy_last_set_by text,
    policy_last_set_at timestamp with time zone,
    authorized_pickup_ids uuid[] DEFAULT '{}'::uuid[],
    CONSTRAINT profile_info_student_early_departure_policy_check CHECK ((early_departure_policy = ANY (ARRAY['always'::text, 'with_confirmation'::text, 'never'::text]))),
    CONSTRAINT profile_info_student_policy_last_set_by_check CHECK ((policy_last_set_by = ANY (ARRAY['parent'::text, 'admin'::text, 'system'::text])))
);


ALTER TABLE public.profile_info_student OWNER TO postgres;

-- Object 45/112
CREATE TABLE public.protected_roles (
    role_id uuid NOT NULL,
    protection_level text DEFAULT 'CRITICAL'::text NOT NULL,
    protection_reason text NOT NULL,
    protected_by uuid,
    protected_at timestamp with time zone DEFAULT now(),
    can_be_unprotected boolean DEFAULT false,
    CONSTRAINT protected_roles_protection_level_check CHECK ((protection_level = ANY (ARRAY['CRITICAL'::text, 'IMPORTANT'::text, 'NORMAL'::text])))
);


ALTER TABLE public.protected_roles OWNER TO supabase_admin;

-- Object 46/112
CREATE TABLE public.public_holiday_and_breaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    school_year text NOT NULL,
    is_official boolean DEFAULT true,
    source text DEFAULT 'berlin.de'::text,
    country text DEFAULT 'Germany'::text NOT NULL,
    city text DEFAULT 'Berlin'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT public_holiday_and_breaks_type_check CHECK ((type = ANY (ARRAY['feiertag'::text, 'ferientag'::text, 'unterrichtsfrei'::text])))
);


ALTER TABLE public.public_holiday_and_breaks OWNER TO supabase_admin;

-- Object 47/112
CREATE TABLE public.published_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    draft_id uuid NOT NULL,
    school_id uuid NOT NULL,
    semester_id uuid NOT NULL,
    published_by uuid NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    notes text,
    draft_data jsonb NOT NULL,
    status text DEFAULT 'success'::text NOT NULL,
    error_message text,
    lesson_count integer DEFAULT 0 NOT NULL,
    schedule_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT published_drafts_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'in_progress'::text])))
);


ALTER TABLE public.published_drafts OWNER TO supabase_admin;

-- Object 48/112
CREATE TABLE public.recurrence_debug_log (
    id integer NOT NULL,
    recurrence_id uuid,
    function_called text,
    log_time timestamp with time zone DEFAULT now()
);


ALTER TABLE public.recurrence_debug_log OWNER TO supabase_admin;

-- Object 49/112
CREATE TABLE public.registration_periods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    semester_id uuid NOT NULL,
    title text NOT NULL,
    subtitle text,
    instructions text,
    internal_notes text,
    status text DEFAULT 'draft'::text NOT NULL,
    published_at timestamp with time zone,
    opened_at timestamp with time zone,
    closed_at timestamp with time zone,
    created_by_id uuid NOT NULL,
    updated_by_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    max_wishes_total integer,
    max_wishes_per_day integer,
    CONSTRAINT registration_periods_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'open'::text, 'closed'::text, 'archived'::text]))),
    CONSTRAINT registration_periods_title_not_empty CHECK ((length(TRIM(BOTH FROM title)) > 0)),
    CONSTRAINT registration_periods_wish_limits_check CHECK ((((max_wishes_total IS NULL) OR (max_wishes_total >= 0)) AND ((max_wishes_per_day IS NULL) OR (max_wishes_per_day >= 0))))
);


ALTER TABLE public.registration_periods OWNER TO supabase_admin;

-- Object 50/112
CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    is_subrole boolean DEFAULT false NOT NULL
);


ALTER TABLE public.roles OWNER TO supabase_admin;

-- Object 51/112
CREATE TABLE public.schedule_calendar_exceptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    date date NOT NULL,
    type text,
    notes text,
    allow_checkins boolean DEFAULT false,
    source text,
    is_official boolean DEFAULT false,
    end_date date,
    CONSTRAINT calendar_exceptions_type_check CHECK ((type = ANY (ARRAY['holiday'::text, 'school_closed'::text, 'no_courses'::text])))
);


ALTER TABLE public.schedule_calendar_exceptions OWNER TO postgres;

-- Object 52/112
CREATE TABLE public.schedule_daily_rostering (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    date date NOT NULL,
    staff_id uuid,
    time_block_id uuid,
    start_time time without time zone,
    end_time time without time zone,
    room_id uuid,
    role text,
    substitute_for uuid,
    is_draft boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    course_id uuid
);


ALTER TABLE public.schedule_daily_rostering OWNER TO postgres;

-- Object 53/112
CREATE TABLE public.schedule_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    semester_id uuid NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    title text NOT NULL,
    notes text,
    current_version jsonb,
    versions jsonb[],
    published_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_live boolean DEFAULT false NOT NULL
);


ALTER TABLE public.schedule_drafts OWNER TO supabase_admin;

-- Object 54/112
CREATE TABLE public.schedule_periods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    block_number integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    label text NOT NULL,
    group_label text,
    attendance_requirement text DEFAULT 'required'::text NOT NULL,
    block_type text DEFAULT 'instructional'::text NOT NULL,
    created_by uuid,
    CONSTRAINT schedule_periods_attendance_requirement_check CHECK ((attendance_requirement = ANY (ARRAY['required'::text, 'flexible'::text, 'contracted'::text]))),
    CONSTRAINT schedule_periods_block_type_check CHECK ((block_type = ANY (ARRAY['instructional'::text, 'break'::text, 'flex'::text, 'before_school'::text, 'after_school'::text, 'admin'::text, 'custom'::text])))
);


ALTER TABLE public.schedule_periods OWNER TO postgres;

-- Object 55/112
CREATE TABLE public.schema_change_log (
    id integer NOT NULL,
    event_type text NOT NULL,
    object_type text NOT NULL,
    object_name text,
    executed_sql text DEFAULT 'SQL NOT AVAILABLE'::text NOT NULL,
    username text,
    session_user_name text,
    event_time timestamp with time zone DEFAULT now(),
    group_id uuid
);


ALTER TABLE public.schema_change_log OWNER TO supabase_admin;

-- Object 56/112
CREATE TABLE public.staff_absence_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    absence_id uuid,
    author_id uuid,
    comment text,
    created_at timestamp without time zone DEFAULT now(),
    school_id uuid NOT NULL
);


ALTER TABLE public.staff_absence_comments OWNER TO supabase_admin;

-- Object 57/112
CREATE TABLE public.staff_absences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid,
    date date NOT NULL,
    reason text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    school_id uuid NOT NULL,
    substitution_status text DEFAULT 'pending'::text,
    is_approved boolean DEFAULT false,
    approved_by uuid,
    end_date date,
    start_period integer,
    end_period integer,
    attachment_url text,
    created_by uuid
);


ALTER TABLE public.staff_absences OWNER TO postgres;

-- Object 58/112
CREATE TABLE public.staff_class_links (
    staff_id uuid NOT NULL,
    class_id uuid NOT NULL,
    is_class_teacher boolean DEFAULT false,
    role text,
    school_id uuid NOT NULL
);


ALTER TABLE public.staff_class_links OWNER TO supabase_admin;

-- Object 59/112
CREATE TABLE public.staff_contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid NOT NULL,
    school_id uuid NOT NULL,
    contract_start date,
    contract_end date,
    weekly_hours numeric,
    contract_type text,
    contract_file_url text,
    version_number integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff_contracts OWNER TO supabase_admin;

-- Object 60/112
CREATE TABLE public.staff_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid NOT NULL,
    school_id uuid NOT NULL,
    file_url text NOT NULL,
    document_type text,
    visible_to_staff boolean DEFAULT false,
    uploaded_at timestamp without time zone DEFAULT now(),
    type_id uuid,
    expires_at date
);


ALTER TABLE public.staff_documents OWNER TO supabase_admin;

-- Object 61/112
CREATE TABLE public.staff_duty_plan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid NOT NULL,
    school_id uuid NOT NULL,
    weekday integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    preferred boolean DEFAULT false,
    note text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT staff_duty_plan_weekday_check CHECK (((weekday >= 0) AND (weekday <= 6)))
);


ALTER TABLE public.staff_duty_plan OWNER TO supabase_admin;

-- Object 62/112
CREATE TABLE public.staff_subjects (
    staff_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    preference text,
    qualification_status text,
    experience_years integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    school_id uuid NOT NULL,
    CONSTRAINT staff_subjects_preference_check CHECK ((preference = ANY (ARRAY['loves'::text, 'can do'::text, 'prefers not'::text, 'not qualified'::text])))
);


ALTER TABLE public.staff_subjects OWNER TO supabase_admin;

-- Object 63/112
CREATE TABLE public.staff_work_contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid,
    school_id uuid NOT NULL,
    weekday integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    role text,
    notes text
);


ALTER TABLE public.staff_work_contracts OWNER TO postgres;

-- Object 64/112
CREATE TABLE public.staff_yearly_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_profile_id uuid,
    semester_id text NOT NULL,
    clubs text,
    team text,
    efob_team text,
    wishes text,
    needs text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    subject_pref uuid[],
    classes uuid[],
    school_id uuid NOT NULL
);


ALTER TABLE public.staff_yearly_preferences OWNER TO supabase_admin;

-- Object 65/112
CREATE TABLE public.structure_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name text NOT NULL,
    year integer NOT NULL,
    teacher_id uuid,
    grade_level integer,
    room_id uuid,
    color text
);


ALTER TABLE public.structure_classes OWNER TO postgres;

-- Object 66/112
CREATE TABLE public.structure_days (
    id integer NOT NULL,
    name_en text NOT NULL,
    name_de text,
    day_number integer NOT NULL,
    order_index smallint DEFAULT 1 NOT NULL,
    CONSTRAINT structure_days_day_number_check CHECK (((day_number >= 0) AND (day_number <= 6)))
);


ALTER TABLE public.structure_days OWNER TO supabase_admin;

-- Object 67/112
CREATE TABLE public.structure_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name text NOT NULL,
    room_number text NOT NULL,
    floor text NOT NULL,
    building text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    closed_reason text,
    is_multi_class_bookable boolean DEFAULT false NOT NULL
);


ALTER TABLE public.structure_rooms OWNER TO postgres;

-- Object 68/112
CREATE TABLE public.structure_school_days (
    school_id uuid NOT NULL,
    day_id integer NOT NULL
);


ALTER TABLE public.structure_school_days OWNER TO supabase_admin;

-- Object 69/112
CREATE TABLE public.structure_school_semesters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    school_year_id uuid NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.structure_school_semesters OWNER TO supabase_admin;

-- Object 70/112
CREATE TABLE public.structure_school_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    label text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.structure_school_years OWNER TO supabase_admin;

-- Object 71/112
CREATE TABLE public.structure_schools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    timezone text,
    language text,
    year_groups integer[] DEFAULT '{}'::integer[],
    "Logo" text,
    principal_id uuid,
    email text,
    phone text,
    fax text,
    address_street text,
    address_number text,
    address_postal_code text,
    address_city text,
    address_country text,
    floor_options text[] DEFAULT ARRAY[]::text[],
    building_options text[] DEFAULT ARRAY[]::text[],
    allow_custom_course_times boolean DEFAULT false NOT NULL
);


ALTER TABLE public.structure_schools OWNER TO postgres;

-- Object 72/112
CREATE TABLE public.student_absence_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    school_id uuid NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    updated_at timestamp without time zone,
    start_date date NOT NULL,
    end_date date NOT NULL,
    absence_type text NOT NULL,
    reason text,
    is_excused boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    approved_by uuid,
    approved_at timestamp without time zone,
    attachment_url text,
    recurrence_id uuid,
    last_comment text,
    sensitive boolean DEFAULT false,
    deleted_at timestamp without time zone,
    absence_status text,
    CONSTRAINT check_absence_status CHECK ((absence_status = ANY (ARRAY['krankgemeldet'::text, 'Krankgemeldet'::text, 'unentschuldigt'::text, 'Unentschuldigt'::text, 'beurlaubt'::text, 'Beurlaubt'::text, 'verspätet'::text, 'Verspätet'::text, 'ungeklärt'::text, 'Ungeklärt'::text])))
);


ALTER TABLE public.student_absence_notes OWNER TO supabase_admin;

-- Object 73/112
CREATE TABLE public.student_absence_recurrences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    repeat_every_unit text NOT NULL,
    repeat_every_number smallint DEFAULT 1 NOT NULL,
    week_days smallint[],
    monthly_text text,
    original_absence_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    school_id uuid NOT NULL
);


ALTER TABLE public.student_absence_recurrences OWNER TO supabase_admin;

-- Object 74/112
CREATE TABLE public.student_attendance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    student_id uuid NOT NULL,
    daily_log_id uuid,
    lateness_duration_minutes integer,
    method text,
    recorded_by uuid,
    "timestamp" timestamp without time zone DEFAULT now(),
    notes text,
    status public.attendance_status,
    absence_note_id uuid,
    school_id uuid NOT NULL
);


ALTER TABLE public.student_attendance_logs OWNER TO supabase_admin;

-- Object 75/112
CREATE TABLE public.student_course_wish_choices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    day_of_week smallint NOT NULL,
    rank smallint NOT NULL,
    window_id uuid,
    no_offer boolean DEFAULT false NOT NULL,
    school_id uuid NOT NULL,
    CONSTRAINT student_course_wish_choices_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 5))),
    CONSTRAINT student_course_wish_choices_rank_check CHECK (((rank >= 0) AND (rank <= 10))),
    CONSTRAINT wish_choice_rank_rule CHECK ((((no_offer = true) AND (rank = 0) AND (window_id IS NULL)) OR ((no_offer = false) AND (rank >= 1) AND (window_id IS NOT NULL))))
);


ALTER TABLE public.student_course_wish_choices OWNER TO supabase_admin;

-- Object 76/112
CREATE TABLE public.student_course_wish_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    school_id uuid NOT NULL,
    registration_period_id uuid NOT NULL,
    semester_id uuid NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_by uuid,
    payload jsonb NOT NULL,
    over_limit_total boolean DEFAULT false NOT NULL,
    over_limit_per_day boolean DEFAULT false NOT NULL,
    interview_raw jsonb
);


ALTER TABLE public.student_course_wish_submissions OWNER TO supabase_admin;

-- Object 77/112
CREATE TABLE public.student_daily_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    school_id uuid,
    date date NOT NULL,
    check_in_time timestamp without time zone,
    check_in_method text,
    check_in_by uuid,
    check_out_time timestamp without time zone,
    check_out_method text,
    check_out_by uuid,
    presence_status public.presence_status DEFAULT 'unmarked'::public.presence_status,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_updated_by uuid,
    first_attendance_time timestamp with time zone,
    is_late boolean,
    expected_arrival_time time without time zone,
    expected_checkout_time time without time zone,
    absence_note_id uuid
);


ALTER TABLE public.student_daily_log OWNER TO supabase_admin;

-- Object 78/112
CREATE TABLE public.student_emergency_information (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    school_id uuid NOT NULL,
    medical_information jsonb DEFAULT '{}'::jsonb,
    medication_location text,
    staff_instructions text,
    emergency_procedures text,
    emergency_contacts jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.student_emergency_information OWNER TO supabase_admin;

-- Object 79/112
CREATE TABLE public.student_pickup_arrangement_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    school_id uuid NOT NULL,
    pickup_date date NOT NULL,
    pickup_type text NOT NULL,
    authorized_person_id uuid,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.student_pickup_arrangement_overrides OWNER TO supabase_admin;

-- Object 80/112
CREATE TABLE public.student_presence_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    daily_log_id uuid NOT NULL,
    student_id uuid NOT NULL,
    event_type public.presence_event_type NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    method text,
    performed_by uuid,
    notes text,
    school_id uuid NOT NULL
);


ALTER TABLE public.student_presence_events OWNER TO supabase_admin;

-- Object 81/112
CREATE TABLE public.student_weekly_pickup_arrangements (
    id uuid NOT NULL,
    student_id uuid NOT NULL,
    school_id uuid NOT NULL,
    weekday integer NOT NULL,
    pickup_type text NOT NULL,
    notes text,
    valid_from date NOT NULL,
    valid_until date,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.student_weekly_pickup_arrangements OWNER TO supabase_admin;

-- Object 82/112
CREATE TABLE public.subject_class_hours (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    class_id uuid NOT NULL,
    hours_per_week integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subject_class_hours OWNER TO supabase_admin;

-- Object 83/112
CREATE TABLE public.subject_grade_hours (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    grade_level text NOT NULL,
    hours_per_week integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subject_grade_hours OWNER TO supabase_admin;

-- Object 84/112
CREATE TABLE public.subject_icons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon_path text NOT NULL,
    description text,
    "Tags" text[]
);


ALTER TABLE public.subject_icons OWNER TO supabase_admin;

-- Object 85/112
CREATE TABLE public.subjects (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    color text,
    school_id uuid,
    icon_id uuid,
    subject_type public.subject_type_enum DEFAULT 'school_subject'::public.subject_type_enum NOT NULL,
    is_system_subject boolean DEFAULT false NOT NULL,
    icon text,
    abbreviation text
);


ALTER TABLE public.subjects OWNER TO supabase_admin;

-- Object 86/112
CREATE TABLE public.substitutions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_lesson_id uuid,
    reason text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    valid_until date,
    status text DEFAULT 'draft'::text,
    notes text,
    substitute_staff_id uuid,
    absent_teacher_ids uuid[],
    school_id uuid NOT NULL
);


ALTER TABLE public.substitutions OWNER TO supabase_admin;

-- Object 87/112
CREATE TABLE public.user_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    code character varying(6) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    used_at timestamp with time zone,
    code_instance integer DEFAULT 1,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
    revoked_at timestamp with time zone,
    created_by uuid,
    notes text,
    code_attempts integer DEFAULT 0,
    school_id uuid NOT NULL
);


ALTER TABLE public.user_codes OWNER TO supabase_admin;

-- Object 88/112
CREATE TABLE public.user_group_members (
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    school_id uuid NOT NULL
);


ALTER TABLE public.user_group_members OWNER TO supabase_admin;

-- Object 89/112
CREATE TABLE public.user_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_by uuid,
    school_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_groups OWNER TO supabase_admin;

-- Object 90/112
CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    first_name text,
    last_name text,
    date_of_birth date,
    gender text,
    profile_picture_url text,
    role_id uuid,
    account_status public.account_status_enum DEFAULT 'none'::public.account_status_enum NOT NULL
);


ALTER TABLE public.user_profiles OWNER TO postgres;

-- Object 91/112
CREATE TABLE public.user_roles (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_profile_id uuid NOT NULL,
    role_id uuid NOT NULL,
    school_id uuid NOT NULL
);


ALTER TABLE public.user_roles OWNER TO supabase_admin;

-- Object 92/112
CREATE TABLE public.v_is_subrole (
    is_subrole boolean
);


ALTER TABLE public.v_is_subrole OWNER TO supabase_admin;

-- Object 93/112
CREATE TABLE public.v_primary_email (
    text text
);


ALTER TABLE public.v_primary_email OWNER TO supabase_admin;

-- Object 94/112
CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);

-- Object 95/112
CREATE TABLE realtime.messages_2025_08_25 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_08_25 OWNER TO supabase_admin;

-- Object 96/112
CREATE TABLE realtime.messages_2025_08_26 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_08_26 OWNER TO supabase_admin;

-- Object 97/112
CREATE TABLE realtime.messages_2025_08_27 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_08_27 OWNER TO supabase_admin;

-- Object 98/112
CREATE TABLE realtime.messages_2025_08_28 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_08_28 OWNER TO supabase_admin;

-- Object 99/112
CREATE TABLE realtime.messages_2025_08_29 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_08_29 OWNER TO supabase_admin;

-- Object 100/112
CREATE TABLE realtime.messages_2025_08_30 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_08_30 OWNER TO supabase_admin;

-- Object 101/112
CREATE TABLE realtime.messages_2025_08_31 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_08_31 OWNER TO supabase_admin;

-- Object 102/112
CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

-- Object 103/112
CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

-- Object 104/112
CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

-- Object 105/112
CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

-- Object 106/112
CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

-- Object 107/112
CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

-- Object 108/112
CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

-- Object 109/112
CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

-- Object 110/112
CREATE TABLE storage.tenants (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL
);


ALTER TABLE storage.tenants OWNER TO postgres;

-- Object 111/112
CREATE TABLE supabase_functions.hooks (
    id bigint NOT NULL,
    hook_table_id integer NOT NULL,
    hook_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    request_id bigint
);


ALTER TABLE supabase_functions.hooks OWNER TO supabase_functions_admin;

-- Object 112/112
CREATE TABLE supabase_functions.migrations (
    version text NOT NULL,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE supabase_functions.migrations OWNER TO supabase_functions_admin;

