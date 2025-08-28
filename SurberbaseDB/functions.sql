--
-- CREATE FUNCTION STATEMENTS
--
-- Extracted from flexwise28082025dump.sql
-- Total objects: 188
--

-- Object 1/188
CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

-- Object 2/188
CREATE FUNCTION auth.get_accessible_children() RETURNS uuid[]
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT ARRAY(
        SELECT child_profile_id
        FROM public.family_member_child_links
        WHERE adult_profile_id = auth.get_profile_id()
        AND access_restricted = false
    );
$$;

-- Object 3/188
CREATE FUNCTION auth.get_accessible_class_ids() RETURNS uuid[]
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT ARRAY(
        -- Get user's direct school classes (for staff)
        SELECT id FROM public.structure_classes 
        WHERE school_id = (
            SELECT school_id FROM public.user_profiles 
            WHERE id = auth.get_profile_id()
        )
        
        UNION
        
        -- Get classes that user's accessible children are in (for parents)
        SELECT DISTINCT ps.class_id
        FROM public.profile_info_student ps
        WHERE ps.profile_id = ANY(auth.get_accessible_children())
        AND ps.class_id IS NOT NULL
    );
$$;

-- Object 4/188
CREATE FUNCTION auth.get_current_user_school_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    -- Try to get from user_profiles table (using 'id' not 'user_id')
    (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()),
    -- Fallback to user metadata
    (auth.jwt() ->> 'school_id')::UUID,
    -- Parse from email domain if structured (optional)
    NULL
  );
$$;

-- Object 5/188
CREATE FUNCTION auth.get_profile_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT CASE 
        WHEN auth.jwt() IS NOT NULL 
        AND auth.jwt() -> 'user_metadata' IS NOT NULL 
        AND auth.jwt() -> 'user_metadata' ->> 'profile_id' IS NOT NULL
        THEN (auth.jwt() -> 'user_metadata' ->> 'profile_id')::uuid
        ELSE NULL
    END;
$$;

-- Object 6/188
CREATE FUNCTION auth.get_user_family_ids() RETURNS uuid[]
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT ARRAY(
        SELECT DISTINCT family_id 
        FROM public.family_member_child_links 
        WHERE adult_profile_id = auth.get_profile_id()
        AND access_restricted = false
    );
$$;

-- Object 7/188
CREATE FUNCTION auth.get_user_role() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT r.name 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_profile_id = auth.get_profile_id()
    LIMIT 1;
$$;

-- Object 8/188
CREATE FUNCTION auth.get_user_school_id() RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  -- Return NULL if no authenticated user
  IF auth.uid() IS NULL THEN 
    RETURN NULL; 
  END IF;
  
  -- Get school_id from user_profiles
  RETURN (SELECT school_id FROM public.user_profiles WHERE id = auth.uid());
END;
$$;

-- Object 9/188
CREATE FUNCTION auth.get_user_school_id_safe() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    -- This function bypasses RLS to avoid recursion
    SELECT school_id 
    FROM public.user_profiles 
    WHERE id = auth.get_profile_id();
$$;

-- Object 10/188
CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;

-- Object 11/188
CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

-- Object 12/188
CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT CASE 
    WHEN COALESCE(
      NULLIF(current_setting('app.current_user_id', true), ''),
      NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'profile_id', '')
    ) IS NOT NULL THEN
      COALESCE(
        NULLIF(current_setting('app.current_user_id', true), ''),
        NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'user_metadata')::jsonb ->> 'profile_id', '')
      )::uuid
    ELSE NULL
  END;
$$;

-- Object 13/188
CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;

-- Object 14/188
CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

-- Object 15/188
CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;

-- Object 16/188
CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;

-- Object 17/188
CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;

-- Object 18/188
CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;

-- Object 19/188
CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RAISE WARNING 'PgBouncer auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$;

-- Object 20/188
CREATE FUNCTION public.add_course_note(p_course_id text, p_school_id text, p_registration_period_id text, p_semester_id text, p_day_of_week integer, p_text text, p_author text DEFAULT 'Admin'::text, p_is_problem boolean DEFAULT false) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  new_note_id UUID;
BEGIN
  -- Insert the new note
  INSERT INTO course_notes (
    course_id, school_id, registration_period_id, semester_id,
    day_of_week, text, author, is_problem
  ) VALUES (
    p_course_id, p_school_id, p_registration_period_id, p_semester_id,
    p_day_of_week, p_text, p_author, p_is_problem
  ) RETURNING id INTO new_note_id;

  RETURN json_build_object(
    'ok', true,
    'note_id', new_note_id,
    'message', 'Note added successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'ok', false,
    'error', SQLERRM
  );
END;
$$;

-- Object 21/188
CREATE FUNCTION public.add_family_contact_for_all_children(in_family_id uuid, in_first_name text, in_last_name text, in_relationship text, in_authorized_for_pickup boolean DEFAULT false, in_user_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  new_profile_id uuid;
  school_id uuid;
  student_id uuid;
begin
  -- Get school_id from any child
  select s.school_id into school_id
  from profile_info_student s
  join family_members fm on fm.profile_id = s.profile_id
  where fm.family_id = in_family_id
    and fm.role = 'student'
  limit 1;

  -- Create the contact (no auth account)
  insert into user_profiles (
    first_name,
    last_name,
    school_id,
    role_id
  )
  select
    in_first_name,
    in_last_name,
    school_id,
    r.id
  from roles r
  where r.name = 'parent'
  returning id into new_profile_id;

  -- Link contact to family
  insert into family_members (
    family_id,
    profile_id,
    role,
    is_primary_guardian
  )
  values (
    in_family_id,
    new_profile_id,
    'parent',
    false
  );

  -- Loop through all children and create child links
  for student_id in
    select profile_id from family_members
    where family_id = in_family_id and role = 'student'
  loop
    insert into family_member_child_links (
      family_id,
      adult_profile_id,
      child_profile_id,
      relationship,
      authorized_for_pickup
    )
    values (
      in_family_id,
      new_profile_id,
      student_id,
      in_relationship,
      in_authorized_for_pickup
    );
  end loop;

  return new_profile_id;
end;
$$;

-- Object 22/188
CREATE FUNCTION public.add_family_contact_for_all_children(_family_id uuid, _first_name text, _last_name text, _phone text, _relationship text, _authorized_for_pickup boolean) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  v_new_profile_id uuid;
  v_parent_role_id uuid;
  v_family_school_id uuid;
  v_student_record record;
begin
  -- Get family's school_id from any student in the family
  select s.school_id into v_family_school_id
  from family_members fm
  join profile_info_student s on s.profile_id = fm.profile_id
  where fm.family_id = _family_id
    and fm.role = 'student'
    and fm.removed_at is null
  limit 1;
  
  if v_family_school_id is null then
    raise exception 'Family not found or no students in family: %', _family_id;
  end if;

  -- Get Parent role ID
  select id into v_parent_role_id
  from roles
  where name = 'Parent'
  limit 1;

  if v_parent_role_id is null then
    raise exception 'Parent role not found in roles table';
  end if;

  -- Create user profile (parent without login)
  insert into user_profiles (
    first_name, 
    last_name, 
    school_id, 
    role_id, 
    account_status
  )
  values (
    _first_name, 
    _last_name, 
    v_family_school_id, 
    v_parent_role_id, 
    'none'
  )
  returning id into v_new_profile_id;

  -- Add user role
  insert into user_roles (user_profile_id, role_id)
  values (v_new_profile_id, v_parent_role_id)
  on conflict (user_profile_id, role_id) do nothing;

  -- Add phone contact
  insert into contacts (
    profile_id,
    profile_type,
    type,
    value,
    is_primary,
    notes,
    is_linked_to_user_login
  )
  values (
    v_new_profile_id,
    'parent',
    'phone',
    _phone,
    true,
    'Manual family contact',
    false
  );

  -- Link to family
  insert into family_members (
    family_id,
    profile_id,
    role,
    relation_description,
    is_primary_guardian,
    is_primary_contact,
    notes
  )
  values (
    _family_id,
    v_new_profile_id,
    'parent',
    _relationship,
    false,
    false,
    'Manual family contact'
  );

  -- Create pickup authorization links for all students in the family
  for v_student_record in 
    select fm.profile_id as student_id
    from family_members fm
    where fm.family_id = _family_id
      and fm.role = 'student'
      and fm.removed_at is null
  loop
    insert into family_member_child_links (
      family_id,
      adult_profile_id,
      child_profile_id,
      relationship,
      authorized_for_pickup
    )
    values (
      _family_id,
      v_new_profile_id,
      v_student_record.student_id,
      _relationship,
      _authorized_for_pickup
    )
    on conflict (family_id, adult_profile_id, child_profile_id) do update
    set 
      relationship = excluded.relationship,
      authorized_for_pickup = excluded.authorized_for_pickup;
  end loop;

  return v_new_profile_id;
end;
$$;

-- Object 23/188
CREATE FUNCTION public.add_family_contact_for_all_children(_family_id uuid, _first_name text, _last_name text, _phone text, _relationship text DEFAULT NULL::text, _authorized_for_pickup boolean DEFAULT NULL::boolean, _child_settings jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  v_new_profile_id uuid;
  v_parent_role_id uuid;
  v_family_school_id uuid;
  v_student_record record;
begin
  -- Get family's school_id from any student in the family
  select s.school_id into v_family_school_id
  from family_members fm
  join profile_info_student s on s.profile_id = fm.profile_id
  where fm.family_id = _family_id
    and fm.role = 'student'
    and fm.removed_at is null
  limit 1;
  
  if v_family_school_id is null then
    raise exception 'Family not found or no students in family: %', _family_id;
  end if;

  -- Get Parent role ID
  select id into v_parent_role_id
  from roles
  where name = 'Parent'
  limit 1;

  if v_parent_role_id is null then
    raise exception 'Parent role not found in roles table';
  end if;

  -- Create user profile (parent without login)
  insert into user_profiles (
    first_name, 
    last_name, 
    school_id, 
    role_id, 
    account_status
  )
  values (
    _first_name, 
    _last_name, 
    v_family_school_id, 
    v_parent_role_id, 
    'none'
  )
  returning id into v_new_profile_id;

  -- Add user role
  insert into user_roles (user_profile_id, role_id)
  values (v_new_profile_id, v_parent_role_id)
  on conflict (user_profile_id, role_id) do nothing;

  -- Add phone contact
  insert into contacts (
    profile_id,
    profile_type,
    type,
    value,
    is_primary,
    notes,
    is_linked_to_user_login
  )
  values (
    v_new_profile_id,
    'parent',
    'phone',
    _phone,
    true,
    'Manual family contact',
    false
  );

  -- Link to family (use primary relationship or default)
  insert into family_members (
    family_id,
    profile_id,
    role,
    relation_description,
    is_primary_guardian,
    is_primary_contact,
    notes
  )
  values (
    _family_id,
    v_new_profile_id,
    'parent',
    coalesce(_relationship, 'guardian'),
    false,
    false,
    'Manual family contact'
  );

  -- Create pickup authorization links for all students in the family
  for v_student_record in 
    select fm.profile_id as student_id
    from family_members fm
    where fm.family_id = _family_id
      and fm.role = 'student'
      and fm.removed_at is null
  loop
    declare
      v_child_relationship text;
      v_child_authorized boolean;
      v_child_setting jsonb;
    begin
      -- Check if individual child settings are provided
      if _child_settings is not null then
        -- Find settings for this specific child
        select value into v_child_setting
        from jsonb_array_elements(_child_settings) as value
        where (value->>'profile_id')::uuid = v_student_record.student_id;
        
        if v_child_setting is not null then
          -- Use individual child settings
          v_child_relationship := v_child_setting->>'relationship';
          v_child_authorized := (v_child_setting->>'auth')::boolean;
        else
          -- Fall back to default parameters if child not found in settings
          v_child_relationship := coalesce(_relationship, 'guardian');
          v_child_authorized := coalesce(_authorized_for_pickup, false);
        end if;
      else
        -- Use default parameters (backward compatibility)
        if _relationship is null or _authorized_for_pickup is null then
          raise exception 'Either provide _child_settings or both _relationship and _authorized_for_pickup parameters';
        end if;
        v_child_relationship := _relationship;
        v_child_authorized := _authorized_for_pickup;
      end if;
      
      insert into family_member_child_links (
        family_id,
        adult_profile_id,
        child_profile_id,
        relationship,
        authorized_for_pickup
      )
      values (
        _family_id,
        v_new_profile_id,
        v_student_record.student_id,
        v_child_relationship,
        v_child_authorized
      )
      on conflict (family_id, adult_profile_id, child_profile_id) do update
      set 
        relationship = excluded.relationship,
        authorized_for_pickup = excluded.authorized_for_pickup;
    end;
  end loop;

  return v_new_profile_id;
end;
$$;

-- Object 24/188
CREATE FUNCTION public.add_family_contact_for_student(in_student_id uuid, in_family_id uuid, in_first_name text, in_last_name text, in_relationship text, in_authorized_for_pickup boolean DEFAULT false, in_user_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  new_profile_id uuid;
begin
  -- Create the contact (no auth account)
  insert into user_profiles (
    first_name,
    last_name,
    school_id,
    role_id
  )
  select
    in_first_name,
    in_last_name,
    s.school_id,
    r.id
  from profile_info_student s
  join roles r on r.name = 'parent'
  where s.profile_id = in_student_id
  returning id into new_profile_id;

  -- Link contact to family
  insert into family_members (
    family_id,
    profile_id,
    role,
    is_primary_guardian
  )
  values (
    in_family_id,
    new_profile_id,
    'parent',
    false
  );

  -- Create child link for only this student
  insert into family_member_child_links (
    family_id,
    adult_profile_id,
    child_profile_id,
    relationship,
    authorized_for_pickup
  )
  values (
    in_family_id,
    new_profile_id,
    in_student_id,
    in_relationship,
    in_authorized_for_pickup
  );

  return new_profile_id;
end;
$$;

-- Object 25/188
CREATE FUNCTION public.add_family_contact_for_student(_student_id uuid, _family_id uuid, _first_name text, _last_name text, _phone text, _relationship text, _authorized_for_pickup boolean) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  v_new_profile_id uuid;
  v_parent_role_id uuid;
  v_student_school_id uuid;
begin
  -- Get student's school_id
  select school_id into v_student_school_id
  from profile_info_student
  where profile_id = _student_id;
  
  if v_student_school_id is null then
    raise exception 'Student not found or missing school_id: %', _student_id;
  end if;

  -- Get Parent role ID
  select id into v_parent_role_id
  from roles
  where name = 'Parent'
  limit 1;

  if v_parent_role_id is null then
    raise exception 'Parent role not found in roles table';
  end if;

  -- Create user profile (parent without login)
  insert into user_profiles (
    first_name, 
    last_name, 
    school_id, 
    role_id, 
    account_status
  )
  values (
    _first_name, 
    _last_name, 
    v_student_school_id, 
    v_parent_role_id, 
    'none'
  )
  returning id into v_new_profile_id;

  -- Add user role
  insert into user_roles (user_profile_id, role_id)
  values (v_new_profile_id, v_parent_role_id)
  on conflict (user_profile_id, role_id) do nothing;

  -- Add phone contact
  insert into contacts (
    profile_id,
    profile_type,
    type,
    value,
    is_primary,
    notes,
    is_linked_to_user_login
  )
  values (
    v_new_profile_id,
    'parent',
    'phone',
    _phone,
    true,
    'Manual family contact',
    false
  );

  -- Link to family
  insert into family_members (
    family_id,
    profile_id,
    role,
    relation_description,
    is_primary_guardian,
    is_primary_contact,
    notes
  )
  values (
    _family_id,
    v_new_profile_id,
    'parent',
    _relationship,
    false,
    false,
    'Manual family contact'
  );

  -- Create pickup authorization link
  insert into family_member_child_links (
    family_id,
    adult_profile_id,
    child_profile_id,
    relationship,
    authorized_for_pickup
  )
  values (
    _family_id,
    v_new_profile_id,
    _student_id,
    _relationship,
    _authorized_for_pickup
  )
  on conflict (family_id, adult_profile_id, child_profile_id) do update
  set 
    relationship = excluded.relationship,
    authorized_for_pickup = excluded.authorized_for_pickup;

  return v_new_profile_id;
end;
$$;

-- Object 26/188
CREATE FUNCTION public.add_main_email_contact(p_profile_id uuid, p_email_value character varying) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_contact_id UUID;
    v_replacement_type VARCHAR(50);
BEGIN
    -- Check if the email address already exists for this profile
    SELECT id INTO v_contact_id
    FROM public.contacts
    WHERE profile_id = p_profile_id
      AND type = 'email'
      AND value = p_email_value;

    -- Determine replacement type for the note
    IF v_contact_id IS NULL THEN
        v_replacement_type := 'new login email';
    ELSE
        v_replacement_type := 'existing email';
    END IF;

    -- Set any existing login email for this profile to false and add replacement note
    UPDATE public.contacts
    SET is_linked_to_user_login = FALSE,
        notes = 'Replaced by ' || v_replacement_type || ': ' || p_email_value || ' on ' ||
          to_char(now(), 'YYYY-MM-DD HH24:MI')
    WHERE profile_id = p_profile_id
      AND type = 'email'
      AND is_linked_to_user_login = TRUE
      AND (v_contact_id IS NULL OR id != v_contact_id);

    -- Handle the specific action based on whether email exists
    IF v_contact_id IS NULL THEN
        -- If the email does NOT exist, insert a new contact and set it as login
        INSERT INTO public.contacts (profile_id, profile_type, type, value, is_linked_to_user_login)
        VALUES (p_profile_id, 'staff', 'email', p_email_value, TRUE);
    ELSE
        -- If the email already exists, set it as the login email
        UPDATE public.contacts
        SET is_linked_to_user_login = TRUE
        WHERE id = v_contact_id;
    END IF;
END;
$$;

-- Object 27/188
CREATE FUNCTION public.add_schedule_period(p_school_id uuid, p_label text, p_group_label text, p_start_time time without time zone, p_end_time time without time zone, p_block_number integer, p_attendance_requirement text DEFAULT 'required'::text, p_block_type text DEFAULT 'instructional'::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO schedule_periods(
    id,
    school_id,
    label,
    group_label,
    start_time,
    end_time,
    block_number,
    attendance_requirement,
    block_type
  )
  VALUES (
    v_id,
    p_school_id,
    p_label,
    p_group_label,
    p_start_time,
    p_end_time,
    p_block_number,
    p_attendance_requirement,
    p_block_type
  );
  RETURN v_id;
END;
$$;

-- Object 28/188
CREATE FUNCTION public.add_student_absence(p_student_id uuid, p_school_id uuid, p_start_date date, p_end_date date DEFAULT NULL::date, p_absence_type text DEFAULT 'unentschuldigt'::text, p_reason text DEFAULT ''::text, p_attachment_url text DEFAULT NULL::text, p_time_range text DEFAULT NULL::text, p_duration text DEFAULT 'Ganzer Tag'::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    new_absence_id uuid;
    result json;
BEGIN
    -- Set end_date to start_date if not provided
    IF p_end_date IS NULL THEN
        p_end_date := p_start_date;
    END IF;
    
    -- Validate absence_type
    IF p_absence_type NOT IN ('krankgemeldet', 'unentschuldigt', 'beurlaubt', 'ungeklärt', 'verspätet') THEN
        RAISE EXCEPTION 'Invalid absence_type. Must be one of: krankgemeldet, unentschuldigt, beurlaubt, ungeklärt, verspätet';
    END IF;
    
    -- Insert new absence
    INSERT INTO student_absence_notes (
        student_id,
        school_id,
        created_by,
        start_date,
        end_date,
        absence_type,
        reason,
        attachment_url,
        status,
        is_excused,
        sensitive
    ) VALUES (
        p_student_id,
        p_school_id,
        auth.uid(),
        p_start_date,
        p_end_date,
        p_absence_type,
        p_reason,
        p_attachment_url,
        'pending',
        CASE 
            WHEN p_absence_type IN ('krankgemeldet', 'beurlaubt') THEN true 
            ELSE false 
        END,
        false
    ) RETURNING id INTO new_absence_id;
    
    -- Return success with new record data
    SELECT json_build_object(
        'success', true,
        'message', 'Absence added successfully',
        'data', json_build_object(
            'id', new_absence_id,
            'student_id', p_student_id,
            'start_date', p_start_date,
            'end_date', p_end_date,
            'absence_type', p_absence_type,
            'reason', p_reason,
            'duration', p_duration,
            'time_range', p_time_range
        )
    ) INTO result;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to add absence'
        );
END;
$$;

-- Object 29/188
CREATE FUNCTION public.add_student_absence_with_times_and_recurrence(p_student_id uuid, p_school_id uuid, p_absence_date date, p_from_time time without time zone, p_to_time time without time zone, p_reason text, p_excused boolean DEFAULT false, p_attachment_url text DEFAULT NULL::text, p_created_by uuid DEFAULT auth.uid(), p_recurrence jsonb DEFAULT NULL::jsonb, p_absence_status text DEFAULT 'unentschuldigt'::text) RETURNS TABLE(daily_log_id uuid, attendance_log_id uuid, absence_date date, lesson_uuid uuid, notes text, recurrence_id uuid, absence_note_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_recurrence_id uuid;
  v_absence_note_id uuid;
  v_dates date[];
  v_date date;
  v_daily_log_id uuid;
  v_lesson RECORD;
  v_attendance_log_id uuid;
  v_note text;
  v_daily_status presence_status;
  v_lesson_status attendance_status;
  v_has_lessons_before boolean := false;
  v_has_lessons_after boolean := false;
  v_absence_type text;
  v_start_date date;
  v_end_date date;
BEGIN
  -- Debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('add_student_absence_start', 
     format('Processing absence for student %s on %s from %s to %s with status %s', 
            p_student_id, p_absence_date, p_from_time, p_to_time, p_absence_status));

  -- RECURRENCE HANDLING: Proper workflow implementation
  IF p_recurrence IS NOT NULL THEN
    -- Step 1: Create recurrence definition
    INSERT INTO public.student_absence_recurrences(
      start_date, end_date, repeat_every_unit, repeat_every_number, week_days, monthly_text, created_by
    )
    VALUES (
      (p_recurrence->>'startDate')::date,
      (p_recurrence->>'endDate')::date,
      (p_recurrence->>'repeatEveryUnit')::text,
      COALESCE((p_recurrence->>'repeatEveryNumber')::smallint, 1),
      CASE WHEN jsonb_array_length(p_recurrence->'weekDays') > 0
           THEN ARRAY(SELECT jsonb_array_elements_text(p_recurrence->'weekDays')::smallint)
           ELSE NULL
      END,
      NULLIF(p_recurrence->>'monthlyText',''),
      p_created_by
    )
    RETURNING id INTO v_recurrence_id;

    -- Set absence details for recurring pattern
    v_absence_type := 'recurring';
    v_start_date := (p_recurrence->>'startDate')::date;
    v_end_date := (p_recurrence->>'endDate')::date;

    -- Step 2: Generate date array based on recurrence rules
    v_dates := ARRAY[]::date[];
    v_date := (p_recurrence->>'startDate')::date;
    WHILE v_date <= (p_recurrence->>'endDate')::date LOOP
      IF (p_recurrence->>'repeatEveryUnit') = 'day' THEN
        IF (p_recurrence->'weekDays' IS NULL OR jsonb_array_length(p_recurrence->'weekDays') = 0)
           OR (extract(isodow from v_date)::smallint = ANY (
                ARRAY(SELECT jsonb_array_elements_text(p_recurrence->'weekDays')::smallint)
              )) THEN
          v_dates := array_append(v_dates, v_date);
        END IF;
        v_date := v_date + COALESCE((p_recurrence->>'repeatEveryNumber')::integer, 1);
      ELSIF (p_recurrence->>'repeatEveryUnit') = 'week' THEN
        IF (extract(isodow from v_date)::smallint = ANY (
              ARRAY(SELECT jsonb_array_elements_text(p_recurrence->'weekDays')::smallint)
            )) THEN
          v_dates := array_append(v_dates, v_date);
        END IF;
        v_date := v_date + 1;
      ELSE
        v_date := v_date + 1;
      END IF;
    END LOOP;
  ELSE
    -- Single absence: just the specified date
    v_dates := ARRAY[p_absence_date];
    v_recurrence_id := NULL;
    v_absence_type := 'single';
    v_start_date := p_absence_date;
    v_end_date := p_absence_date;
  END IF;

  -- CREATE STUDENT_ABSENCE_NOTES RECORD FIRST (single source of truth)
  INSERT INTO public.student_absence_notes (
    student_id,
    school_id,
    created_by,
    start_date,
    end_date,
    absence_type,
    absence_status,
    reason,
    is_excused,
    status,
    attachment_url,
    recurrence_id,
    sensitive
  )
  VALUES (
    p_student_id,
    p_school_id,
    p_created_by,
    v_start_date,
    v_end_date,
    v_absence_type,
    p_absence_status,
    p_reason,
    p_excused,
    'pending'::text,
    p_attachment_url,
    v_recurrence_id,
    false
  )
  RETURNING id INTO v_absence_note_id;

  -- Debug logging for absence note creation
  INSERT INTO debug_logs (step, message) VALUES 
    ('absence_note_created', 
     format('Created absence note %s for student %s with status %s', 
            v_absence_note_id, p_student_id, p_absence_status));

  -- Process each date (single or multiple from recurrence)
  FOREACH v_date IN ARRAY v_dates LOOP
    -- Debug logging for each date
    INSERT INTO debug_logs (step, message) VALUES 
      ('process_absence_date', 
       format('Processing absence for date %s', v_date));

    -- Check if student has lessons before the absence period (for expected_checkout_time)
    SELECT EXISTS(
      -- Course lessons: Students enrolled via course_enrollments
      SELECT 1 FROM course_lessons cl
      INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.school_id = p_school_id
        AND ce.student_id = p_student_id
        AND ce.school_id = p_school_id
        AND v_date BETWEEN ce.start_date AND ce.end_date
        AND cl.start_datetime::date = v_date
        AND cl.end_datetime::time <= p_from_time
        AND cl.is_cancelled IS NOT TRUE
      
      UNION
      
      -- School lessons: Students enrolled via class membership
      SELECT 1 FROM course_lessons cl
      INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
      WHERE cl.school_id = p_school_id
        AND pis.profile_id = p_student_id
        AND pis.school_id = p_school_id
        AND cl.course_id IS NULL
        AND cl.class_id IS NOT NULL
        AND cl.start_datetime::date = v_date
        AND cl.end_datetime::time <= p_from_time
        AND cl.is_cancelled IS NOT TRUE
    ) INTO v_has_lessons_before;

    -- Check if student has lessons after the absence period (for expected_arrival_time)
    SELECT EXISTS(
      -- Course lessons: Students enrolled via course_enrollments
      SELECT 1 FROM course_lessons cl
      INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.school_id = p_school_id
        AND ce.student_id = p_student_id
        AND ce.school_id = p_school_id
        AND v_date BETWEEN ce.start_date AND ce.end_date
        AND cl.start_datetime::date = v_date
        AND cl.start_datetime::time >= p_to_time
        AND cl.is_cancelled IS NOT TRUE
      
      UNION
      
      -- School lessons: Students enrolled via class membership
      SELECT 1 FROM course_lessons cl
      INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
      WHERE cl.school_id = p_school_id
        AND pis.profile_id = p_student_id
        AND pis.school_id = p_school_id
        AND cl.course_id IS NULL
        AND cl.class_id IS NOT NULL
        AND cl.start_datetime::date = v_date
        AND cl.start_datetime::time >= p_to_time
        AND cl.is_cancelled IS NOT TRUE
    ) INTO v_has_lessons_after;

    -- Debug logging for lesson checks
    INSERT INTO debug_logs (step, message) VALUES 
      ('lesson_schedule_check', 
       format('Date %s: Has lessons before %s: %s, Has lessons after %s: %s', 
              v_date, p_from_time, v_has_lessons_before, p_to_time, v_has_lessons_after));

    -- Determine daily status and notes for absence
    IF p_from_time = TIME '00:00' AND p_to_time = TIME '23:59' THEN
      v_daily_status := CASE WHEN p_excused THEN 'absent_excused'::presence_status ELSE 'absent_unexcused'::presence_status END;
      v_note := format('Absent for full day: %s', p_reason);
    ELSE
      v_daily_status := 'partial'::presence_status;
      v_note := format('Absent from %s to %s: %s', p_from_time::text, p_to_time::text, p_reason);
    END IF;

    -- Create/update daily log WITH absence_note_id reference
    INSERT INTO student_daily_log (
      student_id, school_id, date, notes, expected_arrival_time, expected_checkout_time,
      created_at, updated_at, last_updated_by, presence_status, absence_note_id
    )
    VALUES (
      p_student_id, p_school_id, v_date, v_note,
      CASE WHEN v_daily_status = 'partial' AND v_has_lessons_after THEN p_to_time ELSE NULL END,
      CASE WHEN v_daily_status = 'partial' AND v_has_lessons_before THEN p_from_time ELSE NULL END,
      NOW(), NOW(), p_created_by, v_daily_status, v_absence_note_id
    )
    ON CONFLICT (student_id, school_id, date) DO UPDATE
      SET notes = v_note, 
          expected_arrival_time = CASE WHEN v_daily_status = 'partial' AND v_has_lessons_after THEN p_to_time ELSE NULL END,
          expected_checkout_time = CASE WHEN v_daily_status = 'partial' AND v_has_lessons_before THEN p_from_time ELSE NULL END,
          updated_at=NOW(), last_updated_by=p_created_by, presence_status=v_daily_status,
          absence_note_id=v_absence_note_id
    RETURNING id INTO v_daily_log_id;

    -- Mark overlapping lessons that the student is enrolled in
    FOR v_lesson IN
      -- Course lessons: Students enrolled via course_enrollments
      SELECT cl.id, cl.start_datetime, cl.end_datetime
      FROM course_lessons cl
      INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.school_id = p_school_id
        AND ce.student_id = p_student_id
        AND ce.school_id = p_school_id
        AND v_date BETWEEN ce.start_date AND ce.end_date
        AND cl.start_datetime::date = v_date
        AND (cl.start_datetime::time < p_to_time)
        AND (cl.end_datetime::time > p_from_time)
        AND cl.is_cancelled IS NOT TRUE
      
      UNION
      
      -- School lessons: Students enrolled via class membership (course_id is NULL)
      SELECT cl.id, cl.start_datetime, cl.end_datetime
      FROM course_lessons cl
      INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
      WHERE cl.school_id = p_school_id
        AND pis.profile_id = p_student_id
        AND pis.school_id = p_school_id
        AND cl.course_id IS NULL
        AND cl.class_id IS NOT NULL
        AND cl.start_datetime::date = v_date
        AND (cl.start_datetime::time < p_to_time)
        AND (cl.end_datetime::time > p_from_time)
        AND cl.is_cancelled IS NOT TRUE
    LOOP
      -- Debug logging for each lesson processed
      INSERT INTO debug_logs (step, message) VALUES 
        ('process_lesson', 
         format('Processing lesson %s from %s to %s', 
                v_lesson.id, v_lesson.start_datetime, v_lesson.end_datetime));

      -- Determine lesson status and note based on absence period
      IF p_from_time > v_lesson.start_datetime::time AND p_to_time < v_lesson.end_datetime::time THEN
        -- Student absent for middle part of lesson - mark as left early with note
        v_lesson_status := 'left_early'::attendance_status;
        v_note := format('Teilweise abwesend (%s-%s) wegen %s', p_from_time::text, p_to_time::text, p_reason);
      ELSIF p_from_time > v_lesson.start_datetime::time THEN
        -- Student absent from middle of lesson onwards (will arrive late next time)
        v_lesson_status := 'left_early'::attendance_status;
        v_note := format('Erwartet um %s - abwesend bis dahin wegen %s', p_to_time::text, p_reason);
      ELSIF p_to_time < v_lesson.end_datetime::time THEN
        -- Student absent at start, should be present later in lesson (late arrival)
        v_lesson_status := 'late'::attendance_status;
        v_note := format('Abwesend bis %s wegen %s, sollte dann anwesend sein', p_to_time::text, p_reason);
      ELSE
        -- Student absent for entire lesson
        v_lesson_status := CASE WHEN p_excused THEN 'absent_excused'::attendance_status ELSE 'absent_unexcused'::attendance_status END;
        v_note := format('Abwesend wegen %s', p_reason);
      END IF;

      -- Debug logging for lesson status determination
      INSERT INTO debug_logs (step, message) VALUES 
        ('lesson_status_determined', 
         format('Lesson %s status: %s, note: %s', v_lesson.id, v_lesson_status, v_note));

      -- Insert/update lesson attendance WITH absence_note_id reference
      INSERT INTO student_attendance_logs (
        lesson_id, student_id, daily_log_id, notes, recorded_by, "timestamp", status, absence_note_id
      )
      VALUES (
        v_lesson.id, p_student_id, v_daily_log_id, v_note, p_created_by, NOW(), v_lesson_status, v_absence_note_id
      )
      ON CONFLICT (lesson_id, student_id) DO
        UPDATE SET notes = v_note, daily_log_id = v_daily_log_id, recorded_by=p_created_by, 
                   "timestamp"=NOW(), status=v_lesson_status, absence_note_id=v_absence_note_id
      RETURNING id INTO v_attendance_log_id;

      -- FIXED: Return record with lesson_uuid instead of lesson_id
      RETURN QUERY SELECT 
        v_daily_log_id,
        v_attendance_log_id,
        v_date,
        v_lesson.id,           -- Now maps to lesson_uuid column
        v_note,
        v_recurrence_id,
        v_absence_note_id;
    END LOOP;
  END LOOP;

  -- Final debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('add_student_absence_complete', 
     format('Completed absence processing for student %s with absence note %s and status %s', 
            p_student_id, v_absence_note_id, p_absence_status));
END;
$$;

-- Object 30/188
CREATE FUNCTION public."add_student_absence_with_times_and_recurrence_changed25.08.2025"(p_student_id uuid, p_school_id uuid, p_created_by uuid, p_reason text, p_from_time time without time zone, p_to_time time without time zone, p_absence_date date, p_recurrence jsonb DEFAULT NULL::jsonb, p_attachment_url text DEFAULT NULL::text, p_excused boolean DEFAULT true) RETURNS TABLE(daily_log_id uuid, attendance_log_id uuid, log_date date, returned_lesson_id uuid, attendance_note text, recurrence_id uuid, absence_note_id uuid)
    LANGUAGE plpgsql
    AS $$DECLARE
  v_recurrence_id uuid;
  v_absence_note_id uuid;
  v_dates date[];
  v_date date;
  v_daily_log_id uuid;
  v_lesson RECORD;
  v_attendance_log_id uuid;
  v_note text;
  v_daily_status presence_status;
  v_lesson_status attendance_status;
  v_has_lessons_before boolean := false;
  v_has_lessons_after boolean := false;
  v_absence_type text;
  v_start_date date;
  v_end_date date;
BEGIN
  -- Debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('add_student_absence_start', 
     format('Processing absence for student %s on %s from %s to %s', 
            p_student_id, p_absence_date, p_from_time, p_to_time));

  -- RECURRENCE HANDLING: Proper workflow implementation
  IF p_recurrence IS NOT NULL THEN
    -- Step 1: Create recurrence definition
    INSERT INTO public.student_absence_recurrences(
      start_date, end_date, repeat_every_unit, repeat_every_number, week_days, monthly_text, created_by
    )
    VALUES (
      (p_recurrence->>'startDate')::date,
      (p_recurrence->>'endDate')::date,
      (p_recurrence->>'repeatEveryUnit')::text,
      COALESCE((p_recurrence->>'repeatEveryNumber')::smallint, 1),
      CASE WHEN jsonb_array_length(p_recurrence->'weekDays') > 0
           THEN ARRAY(SELECT jsonb_array_elements_text(p_recurrence->'weekDays')::smallint)
           ELSE NULL
      END,
      NULLIF(p_recurrence->>'monthlyText',''),
      p_created_by
    )
    RETURNING id INTO v_recurrence_id;

    -- Set absence details for recurring pattern
    v_absence_type := 'recurring';
    v_start_date := (p_recurrence->>'startDate')::date;
    v_end_date := (p_recurrence->>'endDate')::date;

    -- Step 2: Generate date array based on recurrence rules
    v_dates := ARRAY[]::date[];
    v_date := (p_recurrence->>'startDate')::date;
    WHILE v_date <= (p_recurrence->>'endDate')::date LOOP
      IF (p_recurrence->>'repeatEveryUnit') = 'day' THEN
        IF (p_recurrence->'weekDays' IS NULL OR jsonb_array_length(p_recurrence->'weekDays') = 0)
           OR (extract(isodow from v_date)::smallint = ANY (
                ARRAY(SELECT jsonb_array_elements_text(p_recurrence->'weekDays')::smallint)
              )) THEN
          v_dates := array_append(v_dates, v_date);
        END IF;
        v_date := v_date + COALESCE((p_recurrence->>'repeatEveryNumber')::integer, 1);
      ELSIF (p_recurrence->>'repeatEveryUnit') = 'week' THEN
        IF (extract(isodow from v_date)::smallint = ANY (
              ARRAY(SELECT jsonb_array_elements_text(p_recurrence->'weekDays')::smallint)
            )) THEN
          v_dates := array_append(v_dates, v_date);
        END IF;
        v_date := v_date + 1;
      ELSE
        v_date := v_date + 1;
      END IF;
    END LOOP;
  ELSE
    -- Single absence: just the specified date
    v_dates := ARRAY[p_absence_date];
    v_recurrence_id := NULL;
    v_absence_type := 'single';
    v_start_date := p_absence_date;
    v_end_date := p_absence_date;
  END IF;

  -- CREATE STUDENT_ABSENCE_NOTES RECORD FIRST (single source of truth)
  INSERT INTO public.student_absence_notes (
    student_id,
    school_id,
    created_by,
    start_date,
    end_date,
    absence_type,
    reason,
    is_excused,
    status,
    attachment_url,
    recurrence_id,
    sensitive
  )
  VALUES (
    p_student_id,
    p_school_id,
    p_created_by,
    v_start_date,
    v_end_date,
    v_absence_type,
    p_reason,
    p_excused,
    'pending'::text,  -- Initial status is pending for approval workflow
    p_attachment_url,
    v_recurrence_id,
    false  -- Default to not sensitive
  )
  RETURNING id INTO v_absence_note_id;

  -- Debug logging for absence note creation
  INSERT INTO debug_logs (step, message) VALUES 
    ('absence_note_created', 
     format('Created absence note %s for student %s', v_absence_note_id, p_student_id));

  -- Process each date (single or multiple from recurrence)
  FOREACH v_date IN ARRAY v_dates LOOP
    -- Debug logging for each date
    INSERT INTO debug_logs (step, message) VALUES 
      ('process_absence_date', 
       format('Processing absence for date %s', v_date));

    -- Check if student has lessons before the absence period (for expected_checkout_time)
    SELECT EXISTS(
      -- Course lessons: Students enrolled via course_enrollments
      SELECT 1 FROM course_lessons cl
      INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.school_id = p_school_id
        AND ce.student_id = p_student_id
        AND ce.school_id = p_school_id
        AND v_date BETWEEN ce.start_date AND ce.end_date
        AND cl.start_datetime::date = v_date
        AND cl.end_datetime::time <= p_from_time
        AND cl.is_cancelled IS NOT TRUE
      
      UNION
      
      -- School lessons: Students enrolled via class membership
      SELECT 1 FROM course_lessons cl
      INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
      WHERE cl.school_id = p_school_id
        AND pis.profile_id = p_student_id
        AND pis.school_id = p_school_id
        AND cl.course_id IS NULL
        AND cl.class_id IS NOT NULL
        AND cl.start_datetime::date = v_date
        AND cl.end_datetime::time <= p_from_time
        AND cl.is_cancelled IS NOT TRUE
    ) INTO v_has_lessons_before;

    -- Check if student has lessons after the absence period (for expected_arrival_time)
    SELECT EXISTS(
      -- Course lessons: Students enrolled via course_enrollments
      SELECT 1 FROM course_lessons cl
      INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.school_id = p_school_id
        AND ce.student_id = p_student_id
        AND ce.school_id = p_school_id
        AND v_date BETWEEN ce.start_date AND ce.end_date
        AND cl.start_datetime::date = v_date
        AND cl.start_datetime::time >= p_to_time
        AND cl.is_cancelled IS NOT TRUE
      
      UNION
      
      -- School lessons: Students enrolled via class membership
      SELECT 1 FROM course_lessons cl
      INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
      WHERE cl.school_id = p_school_id
        AND pis.profile_id = p_student_id
        AND pis.school_id = p_school_id
        AND cl.course_id IS NULL
        AND cl.class_id IS NOT NULL
        AND cl.start_datetime::date = v_date
        AND cl.start_datetime::time >= p_to_time
        AND cl.is_cancelled IS NOT TRUE
    ) INTO v_has_lessons_after;

    -- Debug logging for lesson checks
    INSERT INTO debug_logs (step, message) VALUES 
      ('lesson_schedule_check', 
       format('Date %s: Has lessons before %s: %s, Has lessons after %s: %s', 
              v_date, p_from_time, v_has_lessons_before, p_to_time, v_has_lessons_after));

    -- Determine daily status and notes for absence
    IF p_from_time = TIME '00:00' AND p_to_time = TIME '23:59' THEN
      v_daily_status := CASE WHEN p_excused THEN 'absent_excused'::presence_status ELSE 'absent_unexcused'::presence_status END;
      v_note := format('Absent for full day: %s', p_reason);
    ELSE
      v_daily_status := 'partial'::presence_status;
      v_note := format('Absent from %s to %s: %s', p_from_time::text, p_to_time::text, p_reason);
    END IF;

    -- Create/update daily log WITH absence_note_id reference
    INSERT INTO student_daily_log (
      student_id, school_id, date, notes, expected_arrival_time, expected_checkout_time,
      created_at, updated_at, last_updated_by, presence_status, absence_note_id
    )
    VALUES (
      p_student_id, p_school_id, v_date, v_note,
      CASE WHEN v_daily_status = 'partial' AND v_has_lessons_after THEN p_to_time ELSE NULL END,
      CASE WHEN v_daily_status = 'partial' AND v_has_lessons_before THEN p_from_time ELSE NULL END,
      NOW(), NOW(), p_created_by, v_daily_status, v_absence_note_id
    )
    ON CONFLICT (student_id, school_id, date) DO UPDATE
      SET notes = v_note, 
          expected_arrival_time = CASE WHEN v_daily_status = 'partial' AND v_has_lessons_after THEN p_to_time ELSE NULL END,
          expected_checkout_time = CASE WHEN v_daily_status = 'partial' AND v_has_lessons_before THEN p_from_time ELSE NULL END,
          updated_at=NOW(), last_updated_by=p_created_by, presence_status=v_daily_status,
          absence_note_id=v_absence_note_id
    RETURNING id INTO v_daily_log_id;

    -- Mark overlapping lessons that the student is enrolled in
    FOR v_lesson IN
      -- Course lessons: Students enrolled via course_enrollments
      SELECT cl.id, cl.start_datetime, cl.end_datetime
      FROM course_lessons cl
      INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.school_id = p_school_id
        AND ce.student_id = p_student_id
        AND ce.school_id = p_school_id
        AND v_date BETWEEN ce.start_date AND ce.end_date
        AND cl.start_datetime::date = v_date
        AND (cl.start_datetime::time < p_to_time)
        AND (cl.end_datetime::time > p_from_time)
        AND cl.is_cancelled IS NOT TRUE
      
      UNION
      
      -- School lessons: Students enrolled via class membership (course_id is NULL)
      SELECT cl.id, cl.start_datetime, cl.end_datetime
      FROM course_lessons cl
      INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
      WHERE cl.school_id = p_school_id
        AND pis.profile_id = p_student_id
        AND pis.school_id = p_school_id
        AND cl.course_id IS NULL  -- School lessons have no course_id
        AND cl.class_id IS NOT NULL  -- School lessons have class_id
        AND cl.start_datetime::date = v_date
        AND (cl.start_datetime::time < p_to_time)
        AND (cl.end_datetime::time > p_from_time)
        AND cl.is_cancelled IS NOT TRUE
    LOOP
      -- Debug logging for each lesson processed
      INSERT INTO debug_logs (step, message) VALUES 
        ('process_lesson', 
         format('Processing lesson %s from %s to %s', 
                v_lesson.id, v_lesson.start_datetime, v_lesson.end_datetime));

      -- Determine lesson status and note based on absence period
      IF p_from_time > v_lesson.start_datetime::time AND p_to_time < v_lesson.end_datetime::time THEN
        -- Student absent for middle part of lesson - mark as left early with note
        v_lesson_status := 'left_early'::attendance_status;
        v_note := format('Teilweise abwesend (%s-%s) wegen %s', p_from_time::text, p_to_time::text, p_reason);
      ELSIF p_from_time > v_lesson.start_datetime::time THEN
        -- Student absent from middle of lesson onwards (will arrive late next time)
        v_lesson_status := 'left_early'::attendance_status;
        v_note := format('Erwartet um %s - abwesend bis dahin wegen %s', p_to_time::text, p_reason);
      ELSIF p_to_time < v_lesson.end_datetime::time THEN
        -- Student absent at start, should be present later in lesson (late arrival)
        v_lesson_status := 'late'::attendance_status;
        v_note := format('Abwesend bis %s wegen %s, sollte dann anwesend sein', p_to_time::text, p_reason);
      ELSE
        -- Student absent for entire lesson
        v_lesson_status := CASE WHEN p_excused THEN 'absent_excused'::attendance_status ELSE 'absent_unexcused'::attendance_status END;
        v_note := format('Abwesend wegen %s', p_reason);
      END IF;

      -- Debug logging for lesson status determination
      INSERT INTO debug_logs (step, message) VALUES 
        ('lesson_status_determined', 
         format('Lesson %s status: %s, note: %s', v_lesson.id, v_lesson_status, v_note));

      -- Insert/update lesson attendance WITH absence_note_id reference
      INSERT INTO student_attendance_logs (
        lesson_id, student_id, daily_log_id, notes, recorded_by, "timestamp", status, absence_note_id
      )
      VALUES (
        v_lesson.id, p_student_id, v_daily_log_id, v_note, p_created_by, NOW(), v_lesson_status, v_absence_note_id
      )
      ON CONFLICT (lesson_id, student_id) DO
        UPDATE SET notes = v_note, daily_log_id = v_daily_log_id, recorded_by=p_created_by, 
                   "timestamp"=NOW(), status=v_lesson_status, absence_note_id=v_absence_note_id
      RETURNING id INTO v_attendance_log_id;

      -- Return record for this lesson including absence_note_id
      RETURN QUERY SELECT 
        v_daily_log_id,
        v_attendance_log_id,
        v_date,
        v_lesson.id,
        v_note,
        v_recurrence_id,
        v_absence_note_id;
    END LOOP;
  END LOOP;

  -- Final debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('add_student_absence_complete', 
     format('Completed absence processing for student %s with absence note %s', p_student_id, v_absence_note_id));
END;$$;

-- Object 31/188
CREATE FUNCTION public.add_student_partial_absence_with_lesson_marking(p_student_id uuid, p_school_id uuid, p_absence_date date, p_from_time time without time zone, p_to_time time without time zone, p_reason text, p_created_by uuid, p_excused boolean DEFAULT true) RETURNS TABLE(daily_log_id uuid, attendance_log_ids uuid[])
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_daily_log_id uuid;
  v_lesson RECORD;
  v_attendance_log_id uuid;
  v_attendance_log_ids uuid[] := ARRAY[]::uuid[];
  v_note text;
  v_daily_status presence_status;
  v_lesson_status attendance_status;
  v_has_lessons_before boolean := false;
  v_has_lessons_after boolean := false;
BEGIN
  -- Debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('add_partial_absence_start', 
     format('Processing partial absence for student %s on %s from %s to %s', 
            p_student_id, p_absence_date, p_from_time, p_to_time));

  -- WARNING: This function is for SINGLE DAY absences only!
  -- For recurring absences, use student_absence_recurrences table + student_absence_recurrences_generate()

  -- Check if student has lessons before the absence period (for expected_checkout_time)
  SELECT EXISTS(
    -- Course lessons: Students enrolled via course_enrollments
    SELECT 1 FROM course_lessons cl
    INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
    WHERE cl.school_id = p_school_id
      AND ce.student_id = p_student_id
      AND ce.school_id = p_school_id
      AND p_absence_date BETWEEN ce.start_date AND ce.end_date
      AND cl.start_datetime::date = p_absence_date
      AND cl.end_datetime::time <= p_from_time
      AND cl.is_cancelled IS NOT TRUE
    
    UNION
    
    -- School lessons: Students enrolled via class membership
    SELECT 1 FROM course_lessons cl
    INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
    WHERE cl.school_id = p_school_id
      AND pis.profile_id = p_student_id
      AND pis.school_id = p_school_id
      AND cl.course_id IS NULL
      AND cl.class_id IS NOT NULL
      AND cl.start_datetime::date = p_absence_date
      AND cl.end_datetime::time <= p_from_time
      AND cl.is_cancelled IS NOT TRUE
  ) INTO v_has_lessons_before;

  -- Check if student has lessons after the absence period (for expected_arrival_time)
  SELECT EXISTS(
    -- Course lessons: Students enrolled via course_enrollments
    SELECT 1 FROM course_lessons cl
    INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
    WHERE cl.school_id = p_school_id
      AND ce.student_id = p_student_id
      AND ce.school_id = p_school_id
      AND p_absence_date BETWEEN ce.start_date AND ce.end_date
      AND cl.start_datetime::date = p_absence_date
      AND cl.start_datetime::time >= p_to_time
      AND cl.is_cancelled IS NOT TRUE
    
    UNION
    
    -- School lessons: Students enrolled via class membership
    SELECT 1 FROM course_lessons cl
    INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
    WHERE cl.school_id = p_school_id
      AND pis.profile_id = p_student_id
      AND pis.school_id = p_school_id
      AND cl.course_id IS NULL
      AND cl.class_id IS NOT NULL
      AND cl.start_datetime::date = p_absence_date
      AND cl.start_datetime::time >= p_to_time
      AND cl.is_cancelled IS NOT TRUE
  ) INTO v_has_lessons_after;

  -- Debug logging for lesson checks
  INSERT INTO debug_logs (step, message) VALUES 
    ('partial_absence_lesson_check', 
     format('Date %s: Has lessons before %s: %s, Has lessons after %s: %s', 
            p_absence_date, p_from_time, v_has_lessons_before, p_to_time, v_has_lessons_after));
  
  -- Determine daily status based on time window
  IF p_from_time = TIME '00:00' AND p_to_time = TIME '23:59' THEN
    v_daily_status := CASE WHEN p_excused THEN 'absent_excused'::presence_status ELSE 'absent_unexcused'::presence_status END;
    v_note := format('Absent for full day: %s', p_reason);
  ELSE
    v_daily_status := 'partial'::presence_status;
    v_note := format('Absent from %s to %s: %s', p_from_time::text, p_to_time::text, p_reason);
  END IF;

  -- Insert or update daily log WITHOUT setting check_in_time/check_out_time for absences
  -- IMPORTANT: check_in_time and check_out_time represent actual physical presence
  -- For absences, we use expected_arrival_time and expected_checkout_time ONLY if student has relevant lessons
  INSERT INTO student_daily_log (
    student_id, school_id, date, notes, expected_arrival_time, expected_checkout_time,
    created_at, updated_at, last_updated_by, presence_status
  )
  VALUES (
    p_student_id, p_school_id, p_absence_date, v_note, 
    CASE WHEN v_has_lessons_after THEN p_to_time ELSE NULL END,
    CASE WHEN v_has_lessons_before THEN p_from_time ELSE NULL END,
    NOW(), NOW(), p_created_by, v_daily_status
  )
  ON CONFLICT (student_id, school_id, date) DO UPDATE
    SET notes = v_note, 
        expected_arrival_time = CASE WHEN v_has_lessons_after THEN p_to_time ELSE NULL END,
        expected_checkout_time = CASE WHEN v_has_lessons_before THEN p_from_time ELSE NULL END,
        updated_at = NOW(), last_updated_by = p_created_by, presence_status = v_daily_status
  RETURNING id INTO v_daily_log_id;

  -- Mark lessons that overlap with the absence window that the student is enrolled in
  -- This handles both course lessons (with course_enrollments) and school lessons (with class_id)
  FOR v_lesson IN
    -- Course lessons: Students enrolled via course_enrollments
    SELECT cl.id, cl.start_datetime, cl.end_datetime
    FROM course_lessons cl
    INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
    WHERE cl.school_id = p_school_id
      AND ce.student_id = p_student_id
      AND ce.school_id = p_school_id
      AND p_absence_date BETWEEN ce.start_date AND ce.end_date
      AND cl.start_datetime::date = p_absence_date
      AND (cl.start_datetime::time < p_to_time)
      AND (cl.end_datetime::time > p_from_time)
      AND cl.is_cancelled IS NOT TRUE
    
    UNION
    
    -- School lessons: Students enrolled via class membership (course_id is NULL)
    SELECT cl.id, cl.start_datetime, cl.end_datetime
    FROM course_lessons cl
    INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
    WHERE cl.school_id = p_school_id
      AND pis.profile_id = p_student_id
      AND pis.school_id = p_school_id
      AND cl.course_id IS NULL  -- School lessons have no course_id
      AND cl.class_id IS NOT NULL  -- School lessons have class_id
      AND cl.start_datetime::date = p_absence_date
      AND (cl.start_datetime::time < p_to_time)
      AND (cl.end_datetime::time > p_from_time)
      AND cl.is_cancelled IS NOT TRUE
  LOOP
      -- Debug logging for each lesson processed
      INSERT INTO debug_logs (step, message) VALUES 
        ('partial_absence_process_lesson', 
         format('Processing lesson %s from %s to %s', 
                v_lesson.id, v_lesson.start_datetime, v_lesson.end_datetime));

      -- Determine lesson status and note based on absence period
      IF p_from_time > v_lesson.start_datetime::time AND p_to_time < v_lesson.end_datetime::time THEN
        -- Student absent for middle part of lesson - mark as left early with note
        v_lesson_status := 'left_early'::attendance_status;
        v_note := format('Teilweise abwesend (%s-%s) wegen %s', p_from_time::text, p_to_time::text, p_reason);
      ELSIF p_from_time > v_lesson.start_datetime::time THEN
        -- Student absent from middle of lesson onwards (will arrive late next time)
        v_lesson_status := 'left_early'::attendance_status;
        v_note := format('Erwartet um %s - abwesend bis dahin wegen %s', p_to_time::text, p_reason);
      ELSIF p_to_time < v_lesson.end_datetime::time THEN
        -- Student absent at start, should be present later in lesson (late arrival)
        v_lesson_status := 'late'::attendance_status;
        v_note := format('Abwesend bis %s wegen %s, sollte dann anwesend sein', p_to_time::text, p_reason);
      ELSE
        -- Student absent for entire lesson
        v_lesson_status := CASE WHEN p_excused THEN 'absent_excused'::attendance_status ELSE 'absent_unexcused'::attendance_status END;
        v_note := format('Abwesend wegen %s', p_reason);
      END IF;

      -- Debug logging for lesson status determination
      INSERT INTO debug_logs (step, message) VALUES 
        ('partial_absence_lesson_status', 
         format('Lesson %s status: %s, note: %s', v_lesson.id, v_lesson_status, v_note));

    -- Insert or update lesson attendance
    INSERT INTO student_attendance_logs (
      lesson_id, student_id, daily_log_id, notes, recorded_by, "timestamp", status
    )
    VALUES (
      v_lesson.id, p_student_id, v_daily_log_id, v_note, p_created_by, NOW(), v_lesson_status
    )
    ON CONFLICT (lesson_id, student_id) DO
      UPDATE SET notes = v_note, daily_log_id = v_daily_log_id, recorded_by = p_created_by, 
                 "timestamp" = NOW(), status = v_lesson_status
    RETURNING id INTO v_attendance_log_id;

    -- Collect attendance log IDs
    v_attendance_log_ids := array_append(v_attendance_log_ids, v_attendance_log_id);
  END LOOP;

  -- Final debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('partial_absence_complete', 
     format('Completed partial absence processing for student %s on %s', p_student_id, p_absence_date));

  -- Return results
  daily_log_id := v_daily_log_id;
  attendance_log_ids := v_attendance_log_ids;
  RETURN NEXT;
END;
$$;

-- Object 32/188
CREATE FUNCTION public.add_student_partial_absence_with_lesson_marking(p_student_id uuid, p_school_id uuid, p_absence_date date, p_from_time time without time zone, p_to_time time without time zone, p_reason text, p_created_by uuid, p_excused boolean DEFAULT true, p_attachment_url text DEFAULT NULL::text) RETURNS TABLE(daily_log_id uuid, attendance_log_ids uuid[], absence_note_id uuid)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_absence_note_id uuid;
  v_daily_log_id uuid;
  v_lesson RECORD;
  v_attendance_log_id uuid;
  v_attendance_log_ids uuid[] := ARRAY[]::uuid[];
  v_note text;
  v_daily_status presence_status;
  v_lesson_status attendance_status;
  v_has_lessons_before boolean := false;
  v_has_lessons_after boolean := false;
BEGIN
  -- Debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('add_partial_absence_start', 
     format('Processing partial absence for student %s on %s from %s to %s', 
            p_student_id, p_absence_date, p_from_time, p_to_time));

  -- WARNING: This function is for SINGLE DAY absences only!
  -- For recurring absences, use student_absence_recurrences table + student_absence_recurrences_generate()

  -- CREATE STUDENT_ABSENCE_NOTES RECORD FIRST (single source of truth)
  INSERT INTO public.student_absence_notes (
    student_id,
    school_id,
    created_by,
    start_date,
    end_date,
    absence_type,
    reason,
    is_excused,
    status,
    attachment_url,
    recurrence_id,
    sensitive
  )
  VALUES (
    p_student_id,
    p_school_id,
    p_created_by,
    p_absence_date,
    p_absence_date,
    'single'::text,
    p_reason,
    p_excused,
    'pending'::text,  -- Initial status is pending for approval workflow
    p_attachment_url,
    NULL,  -- No recurrence for single day absence
    false  -- Default to not sensitive
  )
  RETURNING id INTO v_absence_note_id;

  -- Debug logging for absence note creation
  INSERT INTO debug_logs (step, message) VALUES 
    ('absence_note_created', 
     format('Created absence note %s for single day absence', v_absence_note_id));

  -- Check if student has lessons before the absence period (for expected_checkout_time)
  SELECT EXISTS(
    -- Course lessons: Students enrolled via course_enrollments
    SELECT 1 FROM course_lessons cl
    INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
    WHERE cl.school_id = p_school_id
      AND ce.student_id = p_student_id
      AND ce.school_id = p_school_id
      AND p_absence_date BETWEEN ce.start_date AND ce.end_date
      AND cl.start_datetime::date = p_absence_date
      AND cl.end_datetime::time <= p_from_time
      AND cl.is_cancelled IS NOT TRUE
    
    UNION
    
    -- School lessons: Students enrolled via class membership
    SELECT 1 FROM course_lessons cl
    INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
    WHERE cl.school_id = p_school_id
      AND pis.profile_id = p_student_id
      AND pis.school_id = p_school_id
      AND cl.course_id IS NULL
      AND cl.class_id IS NOT NULL
      AND cl.start_datetime::date = p_absence_date
      AND cl.end_datetime::time <= p_from_time
      AND cl.is_cancelled IS NOT TRUE
  ) INTO v_has_lessons_before;

  -- Check if student has lessons after the absence period (for expected_arrival_time)
  SELECT EXISTS(
    -- Course lessons: Students enrolled via course_enrollments
    SELECT 1 FROM course_lessons cl
    INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
    WHERE cl.school_id = p_school_id
      AND ce.student_id = p_student_id
      AND ce.school_id = p_school_id
      AND p_absence_date BETWEEN ce.start_date AND ce.end_date
      AND cl.start_datetime::date = p_absence_date
      AND cl.start_datetime::time >= p_to_time
      AND cl.is_cancelled IS NOT TRUE
    
    UNION
    
    -- School lessons: Students enrolled via class membership
    SELECT 1 FROM course_lessons cl
    INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
    WHERE cl.school_id = p_school_id
      AND pis.profile_id = p_student_id
      AND pis.school_id = p_school_id
      AND cl.course_id IS NULL
      AND cl.class_id IS NOT NULL
      AND cl.start_datetime::date = p_absence_date
      AND cl.start_datetime::time >= p_to_time
      AND cl.is_cancelled IS NOT TRUE
  ) INTO v_has_lessons_after;

  -- Debug logging for lesson checks
  INSERT INTO debug_logs (step, message) VALUES 
    ('partial_absence_lesson_check', 
     format('Date %s: Has lessons before %s: %s, Has lessons after %s: %s', 
            p_absence_date, p_from_time, v_has_lessons_before, p_to_time, v_has_lessons_after));
  
  -- Determine daily status based on time window
  IF p_from_time = TIME '00:00' AND p_to_time = TIME '23:59' THEN
    v_daily_status := CASE WHEN p_excused THEN 'absent_excused'::presence_status ELSE 'absent_unexcused'::presence_status END;
    v_note := format('Absent for full day: %s', p_reason);
  ELSE
    v_daily_status := 'partial'::presence_status;
    v_note := format('Absent from %s to %s: %s', p_from_time::text, p_to_time::text, p_reason);
  END IF;

  -- Insert or update daily log WITH absence_note_id reference
  INSERT INTO student_daily_log (
    student_id, school_id, date, notes, expected_arrival_time, expected_checkout_time,
    created_at, updated_at, last_updated_by, presence_status, absence_note_id
  )
  VALUES (
    p_student_id, p_school_id, p_absence_date, v_note, 
    CASE WHEN v_has_lessons_after THEN p_to_time ELSE NULL END,
    CASE WHEN v_has_lessons_before THEN p_from_time ELSE NULL END,
    NOW(), NOW(), p_created_by, v_daily_status, v_absence_note_id
  )
  ON CONFLICT (student_id, school_id, date) DO UPDATE
    SET notes = v_note, 
        expected_arrival_time = CASE WHEN v_has_lessons_after THEN p_to_time ELSE NULL END,
        expected_checkout_time = CASE WHEN v_has_lessons_before THEN p_from_time ELSE NULL END,
        updated_at = NOW(), last_updated_by = p_created_by, presence_status = v_daily_status,
        absence_note_id = v_absence_note_id
  RETURNING id INTO v_daily_log_id;

  -- Mark lessons that overlap with the absence window that the student is enrolled in
  FOR v_lesson IN
    -- Course lessons: Students enrolled via course_enrollments
    SELECT cl.id, cl.start_datetime, cl.end_datetime
    FROM course_lessons cl
    INNER JOIN course_enrollments ce ON ce.course_id = cl.course_id
    WHERE cl.school_id = p_school_id
      AND ce.student_id = p_student_id
      AND ce.school_id = p_school_id
      AND p_absence_date BETWEEN ce.start_date AND ce.end_date
      AND cl.start_datetime::date = p_absence_date
      AND (cl.start_datetime::time < p_to_time)
      AND (cl.end_datetime::time > p_from_time)
      AND cl.is_cancelled IS NOT TRUE
    
    UNION
    
    -- School lessons: Students enrolled via class membership (course_id is NULL)
    SELECT cl.id, cl.start_datetime, cl.end_datetime
    FROM course_lessons cl
    INNER JOIN profile_info_student pis ON pis.class_id = cl.class_id
    WHERE cl.school_id = p_school_id
      AND pis.profile_id = p_student_id
      AND pis.school_id = p_school_id
      AND cl.course_id IS NULL  -- School lessons have no course_id
      AND cl.class_id IS NOT NULL  -- School lessons have class_id
      AND cl.start_datetime::date = p_absence_date
      AND (cl.start_datetime::time < p_to_time)
      AND (cl.end_datetime::time > p_from_time)
      AND cl.is_cancelled IS NOT TRUE
  LOOP
    -- Debug logging for each lesson processed
    INSERT INTO debug_logs (step, message) VALUES 
      ('process_lesson_partial', 
       format('Processing lesson %s from %s to %s for partial absence', 
              v_lesson.id, v_lesson.start_datetime, v_lesson.end_datetime));

    -- Determine lesson status and note based on absence period
    IF p_from_time > v_lesson.start_datetime::time AND p_to_time < v_lesson.end_datetime::time THEN
      -- Student absent for middle part of lesson - mark as left early with note
      v_lesson_status := 'left_early'::attendance_status;
      v_note := format('Teilweise abwesend (%s-%s) wegen %s', p_from_time::text, p_to_time::text, p_reason);
    ELSIF p_from_time > v_lesson.start_datetime::time THEN
      -- Student absent from middle of lesson onwards (will arrive late next time)
      v_lesson_status := 'left_early'::attendance_status;
      v_note := format('Erwartet um %s - abwesend bis dahin wegen %s', p_to_time::text, p_reason);
    ELSIF p_to_time < v_lesson.end_datetime::time THEN
      -- Student absent at start, should be present later in lesson (late arrival)
      v_lesson_status := 'late'::attendance_status;
      v_note := format('Abwesend bis %s wegen %s, sollte dann anwesend sein', p_to_time::text, p_reason);
    ELSE
      -- Student absent for entire lesson
      v_lesson_status := CASE WHEN p_excused THEN 'absent_excused'::attendance_status ELSE 'absent_unexcused'::attendance_status END;
      v_note := format('Abwesend wegen %s', p_reason);
    END IF;

    -- Insert/update lesson attendance WITH absence_note_id reference
    INSERT INTO student_attendance_logs (
      lesson_id, student_id, daily_log_id, notes, recorded_by, "timestamp", status, absence_note_id
    )
    VALUES (
      v_lesson.id, p_student_id, v_daily_log_id, v_note, p_created_by, NOW(), v_lesson_status, v_absence_note_id
    )
    ON CONFLICT (lesson_id, student_id) DO
      UPDATE SET notes = v_note, daily_log_id = v_daily_log_id, recorded_by = p_created_by, 
                 "timestamp" = NOW(), status = v_lesson_status, absence_note_id = v_absence_note_id
    RETURNING id INTO v_attendance_log_id;

    -- Collect attendance log IDs
    v_attendance_log_ids := array_append(v_attendance_log_ids, v_attendance_log_id);
  END LOOP;

  -- Final debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('partial_absence_complete', 
     format('Completed partial absence processing for student %s on %s with absence note %s', 
            p_student_id, p_absence_date, v_absence_note_id));

  -- Return results
  daily_log_id := v_daily_log_id;
  attendance_log_ids := v_attendance_log_ids;
  absence_note_id := v_absence_note_id;
  RETURN NEXT;
END;
$$;

-- Object 33/188
CREATE FUNCTION public.add_student_to_family(target_student_profile_id uuid, target_family_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  auth_user uuid := auth.uid();  -- pulled from session
  existing_family_id uuid;
  school_id uuid;
begin
  -- Get school_id for student
  select up.school_id into school_id
  from user_profiles up
  where up.id = target_student_profile_id;

  -- Check if student already belongs to a family
  select fm.family_id into existing_family_id
  from family_members fm
  where fm.profile_id = target_student_profile_id
    and fm.role = 'student'
    and fm.removed_at is null;

  if existing_family_id is not null then
    raise exception 'This student already belongs to a family (ID: %)', existing_family_id;
  end if;

  -- Insert into family_members
  insert into family_members (
    family_id,
    profile_id,
    role,
    added_by
  ) values (
    target_family_id,
    target_student_profile_id,
    'student',
    auth_user
  );

  -- Insert into change_log
  insert into change_log (
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    after_data
  ) values (
    auth_user,
    school_id,
    'family_members',
    target_student_profile_id,
    'insert',
    jsonb_build_object(
      'family_id', target_family_id,
      'profile_id', target_student_profile_id,
      'role', 'student'
    )
  );
end;
$$;

-- Object 34/188
CREATE FUNCTION public.add_subject_icon(icon_name text, icon_path text, icon_description text DEFAULT NULL::text, icon_tags text[] DEFAULT NULL::text[]) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  new_id uuid;
begin
  insert into public.subject_icons (name, icon_path, description, "Tags")
  values (icon_name, icon_path, icon_description, icon_tags)
  returning id into new_id;

  return new_id;
end;
$$;

-- Object 35/188
CREATE FUNCTION public.add_user_to_group() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_group_id uuid;
  group_name text;
  user_school_id uuid;
BEGIN
  -- Fetch the school_id dynamically from user_profiles
  SELECT school_id INTO user_school_id
  FROM public.user_profiles
  WHERE id = NEW.user_profile_id;

  -- Determine the group based on the new role_id
  SELECT name INTO group_name FROM public.roles WHERE id = NEW.role_id;
  
  -- Check if the group exists for this school (school isolation)
  SELECT id INTO v_group_id
  FROM public.user_groups
  WHERE name = group_name AND school_id = user_school_id;

  -- If the group doesn't exist for this school, create it
  IF v_group_id IS NULL THEN
    INSERT INTO public.user_groups (name, school_id)
    VALUES (group_name, user_school_id)
    RETURNING id INTO v_group_id;
  END IF;

  -- Only add the user to the group if they aren't already a member
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_group_members
    WHERE group_id = v_group_id AND user_id = NEW.user_profile_id
  ) THEN
    INSERT INTO public.user_group_members (group_id, user_id, school_id)
    VALUES (
      v_group_id,
      NEW.user_profile_id,
      user_school_id
    );
    RAISE NOTICE 'User assigned to group: %', v_group_id;
  ELSE
    RAISE NOTICE 'User is already a member of the group: %', v_group_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Object 36/188
CREATE FUNCTION public.add_user_to_group_alt() RETURNS trigger
    LANGUAGE plpgsql
    AS $$DECLARE
  v_group_id uuid;
  group_name text;
  user_school_id uuid;
BEGIN
  -- Fetch the school_id dynamically from user_profiles
  SELECT school_id INTO user_school_id
  FROM public.user_profiles
  WHERE id = NEW.user_profile_id;

  -- Determine the group based on the new role_id
  SELECT name INTO group_name FROM public.roles WHERE id = NEW.role_id;
  
  -- FIXED: Check if the group exists for THIS SCHOOL (not just by name)
  SELECT id INTO v_group_id 
  FROM public.user_groups 
  WHERE name = group_name AND school_id = user_school_id;

  -- If the group doesn't exist for this school, create it
  IF v_group_id IS NULL THEN
    INSERT INTO public.user_groups (name, school_id)
    VALUES (group_name, user_school_id)
    RETURNING id INTO v_group_id;
    RAISE NOTICE 'Created new group for school: % - Group: %', user_school_id, group_name;
  END IF;

  -- Only add the user to the group if they aren't already a member
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_group_members
    WHERE group_id = v_group_id AND user_id = NEW.user_profile_id
  ) THEN
    INSERT INTO public.user_group_members (group_id, user_id, school_id)
    VALUES (
      v_group_id, 
      NEW.user_profile_id,
      user_school_id
    );
    RAISE NOTICE 'User assigned to group: % (School: %)', v_group_id, user_school_id;
  ELSE
    RAISE NOTICE 'User is already a member of the group: %', v_group_id;
  END IF;

  RETURN NEW;
END;$$;

-- Object 37/188
CREATE FUNCTION public.app_move_student_in_draft(p_registration_period_id uuid, p_semester_id uuid, p_school_id uuid, p_day_of_week smallint, p_student_id uuid, p_target text, p_updated_by uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_resolved_course_id uuid;
  v_day_id integer;
begin
  -- Resolve day_id from day_of_week (required while day_id is NOT NULL)
  select sd.id
  into v_day_id
  from public.structure_days sd
  where sd.day_number = p_day_of_week
  limit 1;

  if v_day_id is null then
    return jsonb_build_object('ok', false, 'error', 'BAD_DAY_OF_WEEK');
  end if;

  -- Special targets
  if p_target in ('waiting','go-home') then
    v_resolved_course_id := null;
  else
    -- 1) Prefer resolving as a window in the same context
    begin
      select crw.course_id
      into v_resolved_course_id
      from public.course_registration_windows crw
      where crw.id = p_target::uuid
        and crw.registration_period_id = p_registration_period_id
        and crw.semester_id = p_semester_id
        and crw.school_id = p_school_id
      limit 1;
    exception when invalid_text_representation then
      v_resolved_course_id := null;
    end;

    -- 2) If not a window match, try treating p_target as a course_id (uuid)
    if v_resolved_course_id is null then
      begin
        -- Only accept as course_id if such a course actually exists
        select c.id
        into v_resolved_course_id
        from public.course_list c
        where c.id = p_target::uuid
        limit 1;
      exception when invalid_text_representation then
        v_resolved_course_id := null;
      end;
    end if;

    if v_resolved_course_id is null then
      return jsonb_build_object('ok', false, 'error', 'TARGET_NOT_FOUND_OR_BAD_ID');
    end if;

    -- 3) Guard: course must actually run on p_day_of_week
    if not exists (
      select 1
      from public.course_schedules cs
      join public.structure_days sd on sd.id = cs.day_id
      where cs.course_id = v_resolved_course_id
        and sd.day_number = p_day_of_week
    ) then
      return jsonb_build_object('ok', false, 'error', 'COURSE_NOT_SCHEDULED_ON_DAY');
    end if;
  end if;

  insert into public.course_allocation_drafts (
    registration_period_id, semester_id, school_id, day_id, day_of_week, student_id,
    target_course_id, special_target, updated_by
  ) values (
    p_registration_period_id, p_semester_id, p_school_id, v_day_id, p_day_of_week, p_student_id,
    v_resolved_course_id,
    case when p_target in ('waiting','go-home') then p_target else null end,
    p_updated_by
  )
  on conflict (registration_period_id, semester_id, school_id, day_of_week, student_id)
  do update set
    day_id          = excluded.day_id,
    day_of_week     = excluded.day_of_week,
    target_course_id= excluded.target_course_id,
    special_target  = excluded.special_target,
    updated_by      = excluded.updated_by,
    updated_at      = now();

  return jsonb_build_object('ok', true, 'course_id', v_resolved_course_id, 'day_id', v_day_id);
end;
$$;

-- Object 38/188
CREATE FUNCTION public.assign_main_role(p_user_profile_id uuid, p_role_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_existing_main_role_id UUID;
    v_is_subrole BOOLEAN;
BEGIN
    -- Check if the provided role is actually a main role (not a subrole)
    SELECT is_subrole INTO v_is_subrole
    FROM roles
    WHERE id = p_role_id;
    
    -- If role doesn't exist, return false
    IF v_is_subrole IS NULL THEN
        RAISE EXCEPTION 'Role with id % does not exist', p_role_id;
    END IF;
    
    -- If the role is a subrole, return false
    IF v_is_subrole = TRUE THEN
        RAISE EXCEPTION 'Role with id % is a subrole, not a main role', p_role_id;
    END IF;
    
    -- Check if user profile exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_profile_id) THEN
        RAISE EXCEPTION 'User profile with id % does not exist', p_user_profile_id;
    END IF;
    
    -- Find existing main role for this user
    SELECT r.id INTO v_existing_main_role_id
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_profile_id = p_user_profile_id 
    AND r.is_subrole = FALSE;
    
    -- If there's an existing main role and it's different from the new one
    IF v_existing_main_role_id IS NOT NULL AND v_existing_main_role_id != p_role_id THEN
        -- Remove the existing main role
        DELETE FROM user_roles 
        WHERE user_roles.user_profile_id = p_user_profile_id 
        AND user_roles.role_id = v_existing_main_role_id;
    END IF;
    
    -- If the user doesn't already have this main role, add it
    IF v_existing_main_role_id IS NULL OR v_existing_main_role_id != p_role_id THEN
        INSERT INTO user_roles (user_profile_id, role_id)
        VALUES (p_user_profile_id, p_role_id)
        ON CONFLICT (user_profile_id, role_id) DO NOTHING;
    END IF;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE;
END;
$$;

-- Object 39/188
CREATE FUNCTION public.assign_substitute(p_lesson_id uuid, p_substitute_staff_ids uuid[], p_absent_teacher_ids uuid[], p_reason text, p_created_by uuid DEFAULT NULL::uuid) RETURNS SETOF uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_created_by uuid := COALESCE(p_created_by, auth.uid());
  v_existing_id uuid;
  v_status text;
  v_sub_id uuid;
BEGIN
  -- If no substitute chosen, check if a PENDING substitution exists for this lesson, and delete them all
  IF array_length(p_substitute_staff_ids, 1) IS NULL OR array_length(p_substitute_staff_ids, 1) = 0 THEN
    FOR v_existing_id, v_status IN
      SELECT id, status FROM substitutions WHERE original_lesson_id = p_lesson_id
    LOOP
      IF v_status IS NULL OR v_status IN ('pending', 'draft') THEN
        DELETE FROM substitutions WHERE id = v_existing_id;
      END IF;
    END LOOP;
    RETURN;
  END IF;

  -- Upsert logic: for each substitute, make sure a row exists (update if needed)
  FOREACH v_sub_id IN ARRAY p_substitute_staff_ids LOOP
    SELECT id INTO v_existing_id
    FROM substitutions
    WHERE original_lesson_id = p_lesson_id
      AND substitute_staff_id = v_sub_id;

    IF v_existing_id IS NOT NULL THEN
      UPDATE substitutions
      SET
        absent_teacher_ids = p_absent_teacher_ids,
        reason = p_reason,
        created_by = v_created_by,
        created_at = now()
      WHERE id = v_existing_id;
      RETURN NEXT v_existing_id;
    ELSE
      v_existing_id := gen_random_uuid();
      INSERT INTO substitutions (
        id, original_lesson_id, substitute_staff_id, absent_teacher_ids, reason, created_by, created_at
      )
      VALUES (
        v_existing_id, p_lesson_id, v_sub_id, p_absent_teacher_ids, p_reason, v_created_by, now()
      );
      RETURN NEXT v_existing_id;
    END IF;
  END LOOP;

  -- Clean up: delete any other substitutions for this lesson not in the new array
  DELETE FROM substitutions
  WHERE original_lesson_id = p_lesson_id
    AND (substitute_staff_id IS NULL OR NOT (substitute_staff_id = ANY(p_substitute_staff_ids)));

END;
$$;

-- Object 40/188
CREATE FUNCTION public.assign_unique_colors_to_classes(class_ids uuid[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  preset_colors TEXT[] := ARRAY[
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
    '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9ff',
    '#ffb3ba', '#bae1ff', '#baffc9', '#ffdfba', '#cbaacb',
    '#ff9cee', '#ffffb5', '#c2f0c2', '#d9b3ff', '#f4cccc',
    '#ff6961', '#77dd77', '#fdfd96', '#84b6f4', '#fdcae1',
    '#40e0d0', '#ffb347', '#d2691e', '#dda0dd', '#00ced1',
    '#f0e68c', '#98fb98', '#ffa07a', '#afeeee', '#ffdab9',
    '#ff7f50', '#da70d6', '#ff69b4', '#cd5c5c', '#ffd700'
  ];
  used_indexes INTEGER[] := '{}';
  max_index INTEGER := array_length(preset_colors, 1);
  i INTEGER := 1;
  random_index INTEGER;
  class_id UUID;
BEGIN
  IF array_length(class_ids, 1) > max_index THEN
    RAISE EXCEPTION 'Not enough unique colors for % classes (only % available)', array_length(class_ids, 1), max_index;
  END IF;

  FOREACH class_id IN ARRAY class_ids LOOP
    LOOP
      random_index := floor(random() * max_index + 1);
      IF NOT random_index = ANY (used_indexes) THEN
        used_indexes := used_indexes || random_index;
        EXIT;
      END IF;
    END LOOP;

    UPDATE structure_classes
    SET color = preset_colors[random_index]
    WHERE id = class_id;
  END LOOP;
END;
$$;

-- Object 41/188
CREATE FUNCTION public.attempt_role_deletion(p_role_id uuid) RETURNS TABLE(can_delete boolean, block_reason text, usage_count integer, protection_level text, recommendations text[])
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_usage_count integer;
    v_protection_level text;
    v_protection_reason text;
    v_role_name text;
    v_current_user_role text;
    v_recommendations text[] := ARRAY[]::text[];
BEGIN
    -- Get role details
    SELECT name INTO v_role_name FROM roles WHERE id = p_role_id;
    
    IF v_role_name IS NULL THEN
        RETURN QUERY SELECT false, 'Role not found', 0, NULL::text, ARRAY['Role does not exist']::text[];
        RETURN;
    END IF;

    -- Get current user role
    SELECT r.name INTO v_current_user_role
    FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()::uuid;

    -- Get usage count
    SELECT total_usage INTO v_usage_count FROM get_role_usage_count(p_role_id);

    -- Get protection info
    SELECT protection_level, protection_reason 
    INTO v_protection_level, v_protection_reason
    FROM protected_roles WHERE role_id = p_role_id;

    -- Check deletion possibility
    IF v_protection_level = 'CRITICAL' THEN
        v_recommendations := array_append(v_recommendations, 'Contact system administrator to unprotect this critical role');
        RETURN QUERY SELECT false, 'Critical system role cannot be deleted', v_usage_count, v_protection_level, v_recommendations;
        RETURN;
    END IF;

    IF v_usage_count > 0 THEN
        v_recommendations := array_append(v_recommendations, format('Remove role from %s users first', v_usage_count));
        v_recommendations := array_append(v_recommendations, 'Use bulk role reassignment functions');
        RETURN QUERY SELECT false, format('Role is assigned to %s users', v_usage_count), v_usage_count, v_protection_level, v_recommendations;
        RETURN;
    END IF;

    IF v_protection_level = 'IMPORTANT' AND v_current_user_role != 'Admin' THEN
        v_recommendations := array_append(v_recommendations, 'Admin permission required for important roles');
        RETURN QUERY SELECT false, 'Insufficient permissions', v_usage_count, v_protection_level, v_recommendations;
        RETURN;
    END IF;

    -- If we get here, deletion should be possible
    v_recommendations := array_append(v_recommendations, 'Role can be safely deleted');
    v_recommendations := array_append(v_recommendations, 'Deletion will be logged in audit trail');
    
    RETURN QUERY SELECT true, 'Deletion allowed', v_usage_count, v_protection_level, v_recommendations;
END;
$$;

-- Object 42/188
CREATE FUNCTION public.bulk_generate_parent_student_codes(code_requests jsonb[]) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    code_request JSONB;
    child_profile_id UUID;
    code_instance INTEGER;
    created_by UUID;
    notes TEXT;
    result JSON;
    generated_codes JSON[] := '{}';
    existing_codes JSON[] := '{}';
    error_messages TEXT[] := '{}';
    code_result JSON;
BEGIN
    -- Process each code request
    FOREACH code_request IN ARRAY code_requests LOOP
        child_profile_id := (code_request->>'child_profile_id')::UUID;
        code_instance := (code_request->>'code_instance')::INTEGER;
        created_by := (code_request->>'created_by')::UUID;
        notes := code_request->>'notes';

        -- Generate code for this instance
        SELECT generate_user_code(
            child_profile_id,
            code_instance,
            created_by,
            notes
        ) INTO code_result;

        -- Categorize result
        IF (code_result->>'success')::BOOLEAN THEN
            IF (code_result->>'is_new')::BOOLEAN THEN
                generated_codes := array_append(generated_codes,
                    json_build_object(
                        'child_profile_id', child_profile_id,
                        'code_instance', code_instance,
                        'code', code_result->>'code',
                        'is_new', true
                    )
                );
            ELSE
                existing_codes := array_append(existing_codes,
                    json_build_object(
                        'child_profile_id', child_profile_id,
                        'code_instance', code_instance,
                        'code', code_result->>'code',
                        'is_new', false
                    )
                );
            END IF;
        ELSE
            error_messages := array_append(error_messages,
                format('Failed for %s (instance %s): %s',
                    child_profile_id,
                    code_instance,
                    code_result->>'error'
                )
            );
        END IF;
    END LOOP;

    -- Build final result
    result := json_build_object(
        'success', true,
        'total_requested', array_length(code_requests, 1),
        'codes', array_cat(existing_codes, generated_codes),
        'errors', error_messages,
        'summary', json_build_object(
            'total_codes_returned', array_length(existing_codes, 1) + array_length(generated_codes, 1),
            'existing_count', array_length(existing_codes, 1),
            'generated_count', array_length(generated_codes, 1),
            'error_count', array_length(error_messages, 1)
        )
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'total_requested', array_length(code_requests, 1),
            'codes', '[]'::json,
            'errors', array_append(error_messages, SQLERRM)
        );
END;
$$;

-- Object 43/188
CREATE FUNCTION public.bulk_get_or_generate_user_codes(profile_ids uuid[]) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$DECLARE
    current_profile_id UUID;
    existing_code VARCHAR(6);
    new_code VARCHAR(6);
    code_exists BOOLEAN;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 100;
    result JSON;
    results JSON[] := '{}';
    valid_profile_ids UUID[] := '{}';
    invalid_profile_ids UUID[] := '{}';
    generated_codes JSON[] := '{}';
    existing_codes JSON[] := '{}';
    error_messages TEXT[] := '{}';
BEGIN
    -- Validate all profile IDs first
    FOREACH current_profile_id IN ARRAY profile_ids LOOP
        IF EXISTS(SELECT 1 FROM public.user_profiles WHERE id = current_profile_id) THEN
            valid_profile_ids := array_append(valid_profile_ids, current_profile_id);
        ELSE
            invalid_profile_ids := array_append(invalid_profile_ids, current_profile_id);
            error_messages := array_append(error_messages, format('User profile not found: %s', current_profile_id));
        END IF;
    END LOOP;

    -- Process valid profile IDs
    FOREACH current_profile_id IN ARRAY valid_profile_ids LOOP
        -- Check if there's an existing unused code for this profile (instance 1, not expired)
        SELECT code INTO existing_code
        FROM user_codes
        WHERE user_codes.profile_id = current_profile_id
        AND code_instance = 1
        AND used_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1;

        -- If existing code found, add to existing codes
        IF existing_code IS NOT NULL THEN
            existing_codes := array_append(existing_codes,
                json_build_object(
                    'profile_id', current_profile_id,
                    'code', existing_code,
                    'is_new', false
                )
            );
        ELSE
            -- Generate unique code (retry if collision occurs)
            attempt_count := 0;
            LOOP
                new_code := generate_random_code();
                attempt_count := attempt_count + 1;

                -- Check if code already exists (not expired)
                SELECT EXISTS(
                    SELECT 1 FROM user_codes
                    WHERE code = new_code
                    AND used_at IS NULL
                    AND revoked_at IS NULL
                    AND expires_at > NOW()
                ) INTO code_exists;

                -- Exit loop if code is unique or max attempts reached
                IF NOT code_exists OR attempt_count >= max_attempts THEN
                    EXIT;
                END IF;
            END LOOP;

            -- If we couldn't generate a unique code after max attempts
            IF code_exists AND attempt_count >= max_attempts THEN
                error_messages := array_append(error_messages,
                    format('Unable to generate unique code for profile: %s', current_profile_id)
                );
            ELSE
                -- Insert the new code
                INSERT INTO user_codes (profile_id, code, code_instance)
                VALUES (current_profile_id, new_code, 1);

                -- Add to generated codes
                generated_codes := array_append(generated_codes,
                    json_build_object(
                        'profile_id', current_profile_id,
                        'code', new_code,
                        'is_new', true
                    )
                );
            END IF;
        END IF;
    END LOOP;

    -- Build final result
    result := json_build_object(
        'success', true,
        'total_requested', array_length(profile_ids, 1),
        'valid_profiles', array_length(valid_profile_ids, 1),
        'invalid_profiles', array_length(invalid_profile_ids, 1),
        'codes', array_cat(existing_codes, generated_codes),
        'errors', error_messages,
        'summary', json_build_object(
            'total_codes_returned', array_length(existing_codes, 1) + array_length(generated_codes, 1),
            'existing_count', array_length(existing_codes, 1),
            'generated_count', array_length(generated_codes, 1),
            'error_count', array_length(error_messages, 1)
        )
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'total_requested', array_length(profile_ids, 1),
            'codes', '[]'::json,
            'errors', array_append(error_messages, SQLERRM)
        );
END;$$;

-- Object 44/188
CREATE FUNCTION public.bulk_upsert_enrollments_with_logging(p_enrollments jsonb, p_school_id uuid, p_user_id uuid, p_change_group_id uuid DEFAULT gen_random_uuid()) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  enrollment JSONB;
  v_id UUID;
  v_existing RECORD;
  v_schedule_ids UUID[];
BEGIN
  FOR enrollment IN SELECT * FROM jsonb_array_elements(p_enrollments)
  LOOP
    v_id := COALESCE((enrollment->>'id')::uuid, gen_random_uuid());

    -- Convert schedule_ids if they exist
    v_schedule_ids := NULL;
    IF enrollment ? 'schedule_ids' THEN
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(enrollment->'schedule_ids')::uuid
      ) INTO v_schedule_ids;
    END IF;

    -- Check if enrollment exists
    SELECT * INTO v_existing FROM public.course_enrollments WHERE id = v_id;

    IF FOUND THEN
      -- Log update
      PERFORM log_manual_change(
        'course_enrollments',
        v_id,
        'update',
        p_user_id,
        p_school_id,
        jsonb_build_object('before', to_jsonb(v_existing), 'after', enrollment),
        p_change_group_id
      );

      -- Update
      UPDATE public.course_enrollments
      SET
        student_id   = (enrollment->>'student_id')::uuid,
        course_id    = (enrollment->>'course_id')::uuid,
        schedule_ids = v_schedule_ids,
        is_trial     = COALESCE((enrollment->>'is_trial')::boolean, false),
        start_date   = (enrollment->>'start_date')::date,
        end_date     = (enrollment->>'end_date')::date
      WHERE id = v_id;

    ELSE
      -- Insert
      INSERT INTO public.course_enrollments (
        id, student_id, course_id, schedule_ids,
        is_trial, start_date, end_date, school_id
      ) VALUES (
        v_id,
        (enrollment->>'student_id')::uuid,
        (enrollment->>'course_id')::uuid,
        v_schedule_ids,
        COALESCE((enrollment->>'is_trial')::boolean, false),
        (enrollment->>'start_date')::date,
        (enrollment->>'end_date')::date,
        p_school_id
      );

      -- Log insert
      PERFORM log_manual_change(
        'course_enrollments',
        v_id,
        'insert',
        p_user_id,
        p_school_id,
        to_jsonb(enrollment),
        p_change_group_id
      );
    END IF;
  END LOOP;
END;
$$;

-- Object 45/188
CREATE FUNCTION public.bulletin_delete_series(_user_id uuid, _post_id uuid, _change_group_id uuid DEFAULT gen_random_uuid()) RETURNS TABLE(deleted_post_id uuid, deleted_display_from timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
DECLARE
  rec_id        uuid;
  start_date    timestamp without time zone;
  school_id_var uuid;
BEGIN
  -- A) set audit context once
  PERFORM set_config('my.user_id',         _user_id::text,        true);
  PERFORM set_config('my.change_group_id', _change_group_id::text, true);

  -- B) load the target post’s series info
  SELECT bp.school_id, bp.recurrence_id, bp.display_from
    INTO school_id_var, rec_id, start_date
    FROM public.bulletin_posts bp
   WHERE bp.id = _post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post with id % does not exist.', _post_id;
  END IF;

  -- C) include school in the context
  PERFORM set_config('my.school_id', school_id_var::text, true);

  -- D) if no recurrence, delete just this post
  IF rec_id IS NULL THEN
    DELETE FROM public.bulletin_post_users
     WHERE post_id = _post_id;

    RETURN QUERY
    DELETE FROM public.bulletin_posts
     WHERE id = _post_id
    RETURNING id, display_from;

  ELSE
    -- E) delete all future posts in the series
    DELETE FROM public.bulletin_post_users
     WHERE post_id IN (
       SELECT id FROM public.bulletin_posts
        WHERE recurrence_id = rec_id
          AND display_from >= start_date
     );

    RETURN QUERY
    DELETE FROM public.bulletin_posts
     WHERE recurrence_id = rec_id
       AND display_from >= start_date
    RETURNING id, display_from;
  END IF;
END;
$$;

-- Object 46/188
CREATE FUNCTION public.bulletin_edit_series(_post_id uuid, _title text, _body text, _display_from timestamp without time zone, _edited_by uuid, _recurrence jsonb, _change_group_id uuid DEFAULT gen_random_uuid(), _is_important boolean DEFAULT false, _notify_on_post boolean DEFAULT false, _read_required boolean DEFAULT false, _visible_users uuid[] DEFAULT '{}'::uuid[], _visible_groups uuid[] DEFAULT '{}'::uuid[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  old_post           public.bulletin_posts%ROWTYPE;
  _recurrence_id     uuid;
  post_ids_to_delete uuid[];
BEGIN
  -- A) set audit context once
  PERFORM set_config('my.change_group_id', _change_group_id::text, true);
  PERFORM set_config('my.user_id',         _edited_by::text,        true);

  -- B) load the existing post & set school context
  SELECT * INTO old_post
    FROM public.bulletin_posts
   WHERE id = _post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post % not found', _post_id;
  END IF;
  PERFORM set_config('my.school_id', old_post.school_id::text, true);

  -- C) prevent editing past posts
  IF old_post.display_from < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot edit past posts. This post has already started.';
  END IF;

  -- D) update the “current” post
  UPDATE public.bulletin_posts
     SET title          = _title,
         body           = _body,
         display_from   = _display_from,
         is_important   = _is_important,
         notify_on_post = _notify_on_post,
         read_required  = _read_required,
         visible_groups = _visible_groups
   WHERE id = _post_id;

  -- E) replace visible‐users links
  DELETE FROM public.bulletin_post_users WHERE post_id = _post_id;
  IF array_length(_visible_users,1) IS NOT NULL THEN
    INSERT INTO public.bulletin_post_users(post_id,user_id)
    SELECT _post_id, unnest(_visible_users);
  END IF;

  -- F) fetch the series ID
  SELECT recurrence_id
    INTO _recurrence_id
    FROM public.bulletin_posts
   WHERE id = _post_id;
  IF _recurrence_id IS NULL THEN
    RAISE EXCEPTION 'This post is not part of a recurring series.';
  END IF;

  -- G) update the recurrence record
  UPDATE public.bulletin_recurrences
     SET start_date          = (_recurrence->>'startDate')::timestamp,
         end_date            = (_recurrence->>'endDate')::timestamp,
         repeat_every_unit   = _recurrence->>'repeatEveryUnit',
         repeat_every_number = (_recurrence->>'repeatEveryNumber')::smallint,
         week_days           = ARRAY(SELECT jsonb_array_elements_text(_recurrence->'weekDays'))::smallint[],
         monthly_text        = _recurrence->>'monthlyText'
   WHERE id = _recurrence_id;

  -- H) delete all future instances (excluding the current one)
  SELECT array_agg(id) INTO post_ids_to_delete
    FROM public.bulletin_posts
   WHERE recurrence_id = _recurrence_id
     AND display_from >= CURRENT_DATE
     AND id <> _post_id;

  IF post_ids_to_delete IS NOT NULL THEN
    DELETE FROM public.bulletin_post_users
     WHERE post_id = ANY(post_ids_to_delete);
    DELETE FROM public.bulletin_posts
     WHERE id = ANY(post_ids_to_delete);
  END IF;

  -- I) regenerate future posts under the same change_group_id
  PERFORM public.bulletin_recurrences_generate(_recurrence_id);
END;
$$;

-- Object 47/188
CREATE FUNCTION public.bulletin_post_add(_title text, _body text, _school_id uuid, _created_by uuid, _display_from timestamp without time zone, _change_group_id uuid DEFAULT gen_random_uuid(), _attachments text[] DEFAULT '{}'::text[], _is_important boolean DEFAULT false, _notify_on_post boolean DEFAULT false, _is_recurring boolean DEFAULT false, _read_required boolean DEFAULT false, _visible_users uuid[] DEFAULT '{}'::uuid[], _visible_groups uuid[] DEFAULT '{}'::uuid[], _add_recurrence jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  new_post_id       uuid;
  new_recurrence_id uuid;
BEGIN
  -- 1) Set up context once:
  PERFORM set_config('my.change_group_id', _change_group_id::text, true);
  PERFORM set_config('my.user_id',         _created_by::text,        true);
  PERFORM set_config('my.school_id',       _school_id::text,         true);

  -- 2) Validate
  IF array_length(_visible_users, 1) IS NULL
     AND array_length(_visible_groups, 1) IS NULL THEN
    RAISE EXCEPTION 'Bulletin post must target at least one user or group.';
  END IF;

  -- 3) Insert the base post
  INSERT INTO public.bulletin_posts (
    title, body, school_id, created_by, display_from,
    attachments, is_important, notify_on_post, is_recurring,
    read_required, visible_groups
  ) VALUES (
    _title, _body, _school_id, _created_by, _display_from,
    _attachments, _is_important, _notify_on_post, _is_recurring,
    _read_required, _visible_groups
  )
  RETURNING id INTO new_post_id;

  -- 4) Handle recurrence
  IF _is_recurring AND _add_recurrence IS NOT NULL THEN
    INSERT INTO public.bulletin_recurrences (
      start_date, end_date, repeat_every_unit,
      repeat_every_number, week_days, monthly_text,
      original_post_id
    )
    VALUES (
      (_add_recurrence->>'startDate')::timestamp,
      (_add_recurrence->>'endDate')::timestamp,
      _add_recurrence->>'repeatEveryUnit',
      (_add_recurrence->>'repeatEveryNumber')::smallint,
      ARRAY(SELECT jsonb_array_elements_text(_add_recurrence->'weekDays'))::smallint[],
      _add_recurrence->>'monthlyText',
      new_post_id
    )
    RETURNING id INTO new_recurrence_id;

    UPDATE public.bulletin_posts
      SET recurrence_id = new_recurrence_id
     WHERE id = new_post_id;

    PERFORM public.bulletin_recurrences_generate(new_recurrence_id);
  END IF;

  -- 5) Link visible users
  IF array_length(_visible_users, 1) IS NOT NULL THEN
    INSERT INTO public.bulletin_post_users(post_id, user_id)
    SELECT new_post_id, unnest(_visible_users);
  END IF;

  RETURN new_post_id;
END;
$$;

-- Object 48/188
CREATE FUNCTION public.bulletin_recurrences_generate(p_recurrence_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  rec bulletin_recurrences%ROWTYPE;
BEGIN
  -- load the recurrence record
  SELECT * INTO rec
    FROM public.bulletin_recurrences
   WHERE id = p_recurrence_id;

  IF rec IS NULL THEN
    RAISE EXCEPTION 'Recurrence ID % not found', p_recurrence_id;
  END IF;

  CASE rec.repeat_every_unit
    WHEN 'day' THEN
      IF rec.week_days IS NULL OR coalesce(array_length(rec.week_days,1),0) = 0 THEN
        -- consecutive days
        PERFORM public.bulletin_recurrences_generate_daily_consecutive(rec.id);
      ELSE
        -- only on certain weekdays
        PERFORM public.bulletin_recurrences_generate_daily_on_weekdays(rec.id);
      END IF;

    WHEN 'week' THEN
      PERFORM public.bulletin_recurrences_generate_weekly(rec.id);

    WHEN 'month' THEN
      PERFORM public.bulletin_recurrences_generate_monthly(rec.id);

    ELSE
      RAISE EXCEPTION 'Unsupported repeat_every_unit: %', rec.repeat_every_unit;
  END CASE;
END;
$$;

-- Object 49/188
CREATE FUNCTION public.bulletin_recurrences_generate_daily_consecutive(p_recurrence_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  rec bulletin_recurrences%ROWTYPE;
  post bulletin_posts%ROWTYPE;
  current_day date;
BEGIN
  SELECT * INTO rec FROM bulletin_recurrences WHERE id = p_recurrence_id;
  SELECT * INTO post FROM bulletin_posts WHERE id = rec.original_post_id;

  current_day := rec.start_date::date;

  WHILE current_day <= rec.end_date::date LOOP
    IF NOT EXISTS (
      SELECT 1 FROM bulletin_posts WHERE recurrence_id = p_recurrence_id AND display_from = current_day
    ) THEN
      INSERT INTO bulletin_posts (
        title, body, school_id, created_by, display_from, attachments,
        is_important, notify_on_post, is_recurring, read_required, visible_groups,
        recurrence_id
      ) VALUES (
        post.title, post.body, post.school_id, post.created_by, current_day, post.attachments,
        post.is_important, post.notify_on_post, true, post.read_required, post.visible_groups,
        p_recurrence_id
      );
    END IF;
    current_day := current_day + 1;
  END LOOP;
END;
$$;

-- Object 50/188
CREATE FUNCTION public.bulletin_recurrences_generate_daily_on_weekdays(p_recurrence_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  rec bulletin_recurrences%ROWTYPE;
  post bulletin_posts%ROWTYPE;
  current_day date;
BEGIN
  SELECT * INTO rec FROM bulletin_recurrences WHERE id = p_recurrence_id;
  SELECT * INTO post FROM bulletin_posts WHERE id = rec.original_post_id;

  current_day := rec.start_date::date;

  WHILE current_day <= rec.end_date::date LOOP
    IF EXTRACT(DOW FROM current_day)::smallint = ANY (rec.week_days) THEN
      IF NOT EXISTS (
        SELECT 1 FROM bulletin_posts WHERE recurrence_id = p_recurrence_id AND display_from = current_day
      ) THEN
        INSERT INTO bulletin_posts (
          title, body, school_id, created_by, display_from, attachments,
          is_important, notify_on_post, is_recurring, read_required, visible_groups,
          recurrence_id
        ) VALUES (
          post.title, post.body, post.school_id, post.created_by, current_day, post.attachments,
          post.is_important, post.notify_on_post, true, post.read_required, post.visible_groups,
          p_recurrence_id
        );
      END IF;
    END IF;

    current_day := current_day + 1;
  END LOOP;
END;
$$;

-- Object 51/188
CREATE FUNCTION public.bulletin_recurrences_generate_monthly(p_recurrence_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  rec bulletin_recurrences%ROWTYPE;
  post bulletin_posts%ROWTYPE;
  current_month date;
  target_date date;
  weekday_idx int;
  nth_week int;
  first_day_of_month date;
  day_of_week_start int;
BEGIN
  SELECT * INTO rec FROM bulletin_recurrences WHERE id = p_recurrence_id;
  SELECT * INTO post FROM bulletin_posts WHERE id = rec.original_post_id;

  current_month := date_trunc('month', rec.start_date)::date;

  WHILE current_month <= rec.end_date::date LOOP
    IF rec.monthly_text = 'day' THEN
      -- Repeat on the same day of the month as start_date
      target_date := make_date(
        EXTRACT(YEAR FROM current_month)::int,
        EXTRACT(MONTH FROM current_month)::int,
        EXTRACT(DAY FROM rec.start_date)::int
      );

      IF target_date >= rec.start_date::date AND target_date <= rec.end_date::date THEN
        IF NOT EXISTS (
          SELECT 1 FROM bulletin_posts WHERE recurrence_id = rec.id AND display_from = target_date
        ) THEN
          INSERT INTO bulletin_posts (
            title, body, school_id, created_by, display_from, attachments,
            is_important, notify_on_post, is_recurring, read_required, visible_groups,
            recurrence_id
          ) VALUES (
            post.title, post.body, post.school_id, post.created_by, target_date, post.attachments,
            post.is_important, post.notify_on_post, true, post.read_required, post.visible_groups,
            rec.id
          );
        END IF;
      END IF;

    ELSIF rec.monthly_text = 'weekday' THEN
      -- Repeat on the nth weekday of the month, e.g., 3rd Tuesday

      weekday_idx := EXTRACT(DOW FROM rec.start_date)::int; -- 0=Sunday ... 6=Saturday
      nth_week := ((EXTRACT(DAY FROM rec.start_date) - 1) / 7) + 1;

      first_day_of_month := date_trunc('month', current_month)::date;
      day_of_week_start := EXTRACT(DOW FROM first_day_of_month)::int;

      target_date := first_day_of_month + ((7 + weekday_idx - day_of_week_start) % 7) + ((nth_week - 1) * 7);

      IF target_date >= rec.start_date::date AND target_date <= rec.end_date::date THEN
        IF NOT EXISTS (
          SELECT 1 FROM bulletin_posts WHERE recurrence_id = rec.id AND display_from = target_date
        ) THEN
          INSERT INTO bulletin_posts (
            title, body, school_id, created_by, display_from, attachments,
            is_important, notify_on_post, is_recurring, read_required, visible_groups,
            recurrence_id
          ) VALUES (
            post.title, post.body, post.school_id, post.created_by, target_date, post.attachments,
            post.is_important, post.notify_on_post, true, post.read_required, post.visible_groups,
            rec.id
          );
        END IF;
      END IF;

    END IF;

    current_month := current_month + INTERVAL '1 month' * rec.repeat_every_number;
  END LOOP;
END;
$$;

-- Object 52/188
CREATE FUNCTION public.bulletin_recurrences_generate_weekly(p_recurrence_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  rec bulletin_recurrences%ROWTYPE;
  post bulletin_posts%ROWTYPE;
  current_week_start date;
  i int;
  target_date date;
BEGIN
  SELECT * INTO rec FROM bulletin_recurrences WHERE id = p_recurrence_id;
  SELECT * INTO post FROM bulletin_posts WHERE id = rec.original_post_id;

  -- Calculate Sunday before or equal to startDate (0 = Sunday)
  current_week_start := rec.start_date::date - EXTRACT(DOW FROM rec.start_date::date)::int;

  WHILE current_week_start <= rec.end_date::date LOOP
    FOR i IN 0..6 LOOP
      IF (i = ANY (rec.week_days)) THEN
        target_date := current_week_start + i;

        -- Only create post if on or after startDate and before or equal to endDate
        IF target_date >= rec.start_date::date AND target_date <= rec.end_date::date THEN
          IF NOT EXISTS (
            SELECT 1 FROM bulletin_posts WHERE recurrence_id = rec.id AND display_from = target_date
          ) THEN
            INSERT INTO bulletin_posts (
              title, body, school_id, created_by, display_from, attachments,
              is_important, notify_on_post, is_recurring, read_required, visible_groups,
              recurrence_id
            ) VALUES (
              post.title, post.body, post.school_id, post.created_by, target_date, post.attachments,
              post.is_important, post.notify_on_post, true, post.read_required, post.visible_groups,
              rec.id
            );
          END IF;
        END IF;
      END IF;
    END LOOP;

    -- Move to next recurrence week block
    current_week_start := current_week_start + (rec.repeat_every_number * 7);
  END LOOP;
END;
$$;

-- Object 53/188
CREATE FUNCTION public.cad_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Object 54/188
CREATE FUNCTION public.check_bucket_privacy_settings() RETURNS TABLE(bucket_name text, current_public boolean, intended_public boolean, matches boolean, description text, needs_update boolean, bucket_id text, created_at timestamp with time zone, file_size_limit bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    WITH intended_settings AS (
        -- SECURE DEFAULTS - Everything private unless specifically needed
        SELECT 
            'school-logo'::TEXT AS name,
            FALSE AS public_setting,  -- CHANGED: Private by default
            'School logos and branding assets (PRIVATE for security)'::TEXT AS description
        UNION ALL SELECT 'student-profile-pictures', FALSE, 'Student profile photos (PRIVATE - contains student data)'
        UNION ALL SELECT 'subject-icons', FALSE, 'Icons for academic subjects (PRIVATE by default)'  
        UNION ALL SELECT 'staff-profile-pictures', FALSE, 'Staff member profile photos (PRIVATE)'
        UNION ALL SELECT 'staff-documents', FALSE, 'Staff documents and files (PRIVATE)'
        UNION ALL SELECT 'bulletin-attachments', FALSE, 'Bulletin board attachments (PRIVATE)'
        UNION ALL SELECT 'absence-documents', FALSE, 'Absence related documents (PRIVATE - sensitive student data)'
        UNION ALL SELECT 'course-pictures', FALSE, 'Course and class photos (PRIVATE - may contain student faces)'
    ),
    bucket_comparison AS (
        SELECT 
            b.name,
            b.public AS current_public,
            i.public_setting AS intended_public,
            (b.public = i.public_setting) AS matches,
            i.description,
            (b.public != i.public_setting) AS needs_update,
            b.id,
            b.created_at,
            b.file_size_limit
        FROM storage.buckets b
        INNER JOIN intended_settings i ON b.name = i.name
    )
    SELECT 
        bc.name,
        bc.current_public,
        bc.intended_public,
        bc.matches,
        bc.description,
        bc.needs_update,
        bc.id,
        bc.created_at,
        bc.file_size_limit
    FROM bucket_comparison bc
    ORDER BY bc.name;
$$;

-- Object 55/188
CREATE FUNCTION public.check_existing_auth_user(p_email text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users table
  SELECT EXISTS(
    SELECT 1
    FROM auth.users
    WHERE email = p_email
  ) INTO v_user_exists;

  RETURN v_user_exists;
END;
$$;

-- Object 56/188
CREATE FUNCTION public.check_in_student(data jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  student UUID := (data->>'student_id')::UUID;
  staff UUID := (data->>'staff_id')::UUID;
  method TEXT := COALESCE(data->>'method', 'manual');
  today_log_id UUID;
  student_school_id UUID;
BEGIN
  -- Get the student's school_id
  SELECT school_id INTO student_school_id
  FROM user_profiles
  WHERE id = student;
  
  IF student_school_id IS NULL THEN
    RAISE EXCEPTION 'Student school_id not found for student_id: %', student;
  END IF;

  SELECT id INTO today_log_id
  FROM student_daily_log
  WHERE student_id = student AND date = CURRENT_DATE;

  IF NOT FOUND THEN
    INSERT INTO student_daily_log (
      id, student_id, date, check_in_time, check_in_by, check_in_method, presence_status
    ) VALUES (
      gen_random_uuid(), student, CURRENT_DATE, now(), staff, method, 'present'
    )
    RETURNING id INTO today_log_id;
  ELSE
    UPDATE student_daily_log
    SET
      check_in_time = now(),
      check_in_by = staff,
      check_in_method = method,
      presence_status = 'present',
      updated_at = now()
    WHERE id = today_log_id;
  END IF;

  -- FIX: Add school_id to the insert
  INSERT INTO student_presence_events (
    id, daily_log_id, student_id, event_type, timestamp, method, performed_by, school_id
  ) VALUES (
    gen_random_uuid(), today_log_id, student, 'check_in', now(), method, staff, student_school_id
  );
END;
$$;

-- Object 57/188
CREATE FUNCTION public.cleanup_old_codes(expiry_days integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete unused codes that have expired
    DELETE FROM user_codes
    WHERE used_at IS NULL
    AND revoked_at IS NULL
    AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

-- Object 58/188
CREATE FUNCTION public.create_course_secure(_name text, _start_date date, _end_date date, _is_for_year_g integer[], _course_code text DEFAULT NULL::text, _subject_id uuid DEFAULT NULL::uuid, _max_students integer DEFAULT NULL::integer, _description text DEFAULT NULL::text, _wichtige_infos text DEFAULT NULL::text, _pictures text[] DEFAULT ARRAY[]::text[]) RETURNS TABLE(course_id uuid, course_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  current_user_id uuid := auth.uid();
  current_school_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select school_id
  into current_school_id
  from user_profiles
  where id = current_user_id;

  if current_school_id is null then
    raise exception 'No school assigned to this user';
  end if;

  insert into public.course_list (
    name,
    course_code,
    subject_id,
    max_students,
    start_date,
    end_date,
    is_for_year_g,
    description,
    wichtige_infos,
    pictures,
    school_id
  )
  values (
    _name,
    _course_code,
    _subject_id,
    _max_students,
    _start_date,
    _end_date,
    _is_for_year_g,
    _description,
    _wichtige_infos,
    coalesce(_pictures, array[]::text[]),
    current_school_id
  )
  returning course_list.id, course_list.name into course_id, course_name;
end;
$$;

-- Object 59/188
CREATE FUNCTION public.create_course_with_options(_user_id uuid, _name text, _course_code text, _subject_id uuid, _max_students integer, _start_date date, _end_date date, _is_for_year_g integer[], _description text, _wichtige_infos text, _pictures text[], _possible_staff_members uuid[], _possible_times text[], _description_visible_to_parents boolean, _possible_room_id uuid DEFAULT NULL::uuid) RETURNS TABLE(course_id uuid, course_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  current_school_id uuid;
  current_profile_id uuid;
  p_entry text;
  weekday smallint;
  schedule_period_id uuid;
  start_time time;
  duration_minutes int;
begin
  -- 1. Auth check
  if _user_id is null then
    raise exception 'User ID must be provided';
  end if;

  -- 2. Set session variable for audit logging
  perform set_config('my.user_id', _user_id::text, true);

  -- 3. Resolve profile + school directly from auth.users
  select u.id, u.school_id
  into current_profile_id, current_school_id
  from auth.users au
  join user_profiles u
    on (au.raw_user_meta_data->>'profile_id')::uuid = u.id
  where au.id = _user_id;

  if current_school_id is null then
    raise exception 'No school assigned to this user';
  end if;

  -- Optional: validate possible_room_id belongs to this school (and is active)
  if _possible_room_id is not null then
    perform 1
    from public.structure_rooms r
    where r.id = _possible_room_id
      and r.school_id = current_school_id
      and coalesce(r.is_active, true);
    if not found then
      raise exception 'possible_room_id % not found for this school or is inactive', _possible_room_id;
    end if;
  end if;

  -- 4. Insert course (including parent visibility and possible_room_id)
  insert into public.course_list (
    name,
    course_code,
    subject_id,
    max_students,
    start_date,
    end_date,
    is_for_year_g,
    description,
    description_visible_to_parents,
    wichtige_infos,
    pictures,
    school_id,
    possible_staff_members,
    possible_room_id
  )
  values (
    _name,
    _course_code,
    _subject_id,
    _max_students,
    _start_date,
    _end_date,
    _is_for_year_g,
    _description,
    coalesce(_description_visible_to_parents, false),
    _wichtige_infos,
    coalesce(_pictures, array[]::text[]),
    current_school_id,
    coalesce(_possible_staff_members, array[]::uuid[]),
    _possible_room_id
  )
  returning id, name into course_id, course_name;

  -- 5. Insert possible times
  foreach p_entry in array _possible_times
  loop
    begin
      weekday := split_part(p_entry, '|', 1)::smallint;
      schedule_period_id := split_part(p_entry, '|', 2)::uuid;
      start_time := null;
      duration_minutes := null;

      if weekday < 1 or weekday > 6 then
        raise exception 'Invalid weekday in possible time: %', p_entry;
      end if;

      if array_length(string_to_array(p_entry, '|'), 1) >= 4 then
        start_time := nullif(split_part(p_entry, '|', 3), '')::time;
        duration_minutes := nullif(split_part(p_entry, '|', 4), '')::int;
      end if;

      insert into course_possible_times (
        course_id,
        school_id,
        weekday,
        schedule_period_id,
        is_custom_time,
        custom_start,
        custom_duration,
        created_by
      )
      values (
        course_id,
        current_school_id,
        weekday,
        schedule_period_id,
        start_time is not null,
        start_time,
        case
          when duration_minutes is not null then (duration_minutes || ' minutes')::interval
          else null
        end,
        current_profile_id
      );

    exception when others then
      raise exception 'Failed to insert possible time %: %', p_entry, sqlerrm;
    end;
  end loop;

end;
$$;

-- Object 60/188
CREATE FUNCTION public.create_course_with_options_alt(_user_id uuid, _name text, _course_code text, _subject_id uuid, _max_students integer, _start_date date, _end_date date, _is_for_year_g integer[], _description text, _wichtige_infos text, _pictures text[], _possible_staff_members uuid[], _possible_times text[]) RETURNS TABLE(course_id uuid, course_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$declare
  current_school_id uuid;
  current_profile_id uuid;
  p_entry text;
  weekday smallint;
  schedule_period_id uuid;
  start_time time;
  duration_minutes int;
begin
  -- 1. Auth check
  if _user_id is null then
    raise exception 'User ID must be provided';
  end if;

  -- 2. Set session variable for audit logging
  perform set_config('my.user_id', _user_id::text, true);

  -- 3. Resolve profile + school directly from auth.users
  select u.id, u.school_id
  into current_profile_id, current_school_id
  from auth.users au
  join user_profiles u
    on (au.raw_user_meta_data->>'profile_id')::uuid = u.id
  where au.id = _user_id;

  if current_school_id is null then
    raise exception 'No school assigned to this user';
  end if;

  -- 4. Insert course
  insert into public.course_list (
    name,
    course_code,
    subject_id,
    max_students,
    start_date,
    end_date,
    is_for_year_g,
    description,
    wichtige_infos,
    pictures,
    school_id,
    possible_staff_members
  )
  values (
    _name,
    _course_code,
    _subject_id,
    _max_students,
    _start_date,
    _end_date,
    _is_for_year_g,
    _description,
    _wichtige_infos,
    coalesce(_pictures, array[]::text[]),
    current_school_id,
    coalesce(_possible_staff_members, array[]::uuid[])
  )
  returning id, name into course_id, course_name;

  -- 5. Insert possible times
  foreach p_entry in array _possible_times
  loop
    begin
      weekday := split_part(p_entry, '|', 1)::smallint;
      schedule_period_id := split_part(p_entry, '|', 2)::uuid;
      start_time := null;
      duration_minutes := null;

      if weekday < 1 or weekday > 6 then
        raise exception 'Invalid weekday in possible time: %', p_entry;
      end if;

      if array_length(string_to_array(p_entry, '|'), 1) >= 4 then
        start_time := nullif(split_part(p_entry, '|', 3), '')::time;
        duration_minutes := nullif(split_part(p_entry, '|', 4), '')::int;
      end if;

      insert into course_possible_times (
        course_id,
        school_id,
        weekday,
        schedule_period_id,
        is_custom_time,
        custom_start,
        custom_duration
      )
      values (
        course_id,
        current_school_id,
        weekday,
        schedule_period_id,
        start_time is not null,
        start_time,
        case
          when duration_minutes is not null then (duration_minutes || ' minutes')::interval
          else null
        end
      );

    exception when others then
      raise exception 'Failed to insert possible time %: %', p_entry, sqlerrm;
    end;
  end loop;

end;$$;

-- Object 61/188
CREATE FUNCTION public.create_course_with_options_alt(_user_id uuid, _name text, _course_code text, _subject_id uuid, _max_students integer, _start_date date, _end_date date, _is_for_year_g integer[], _description text, _wichtige_infos text, _pictures text[], _possible_staff_members uuid[], _possible_times text[], _description_visible_to_parents boolean DEFAULT false) RETURNS TABLE(course_id uuid, course_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$declare
  current_school_id uuid;
  current_profile_id uuid;
  p_entry text;
  weekday smallint;
  schedule_period_id uuid;
  start_time time;
  duration_minutes int;
begin
  -- 1. Auth check
  if _user_id is null then
    raise exception 'User ID must be provided';
  end if;

  -- 2. Set session variable for audit logging
  perform set_config('my.user_id', _user_id::text, true);

  -- 3. Resolve profile + school directly from auth.users
  select u.id, u.school_id
  into current_profile_id, current_school_id
  from auth.users au
  join user_profiles u
    on (au.raw_user_meta_data->>'profile_id')::uuid = u.id
  where au.id = _user_id;

  if current_school_id is null then
    raise exception 'No school assigned to this user';
  end if;

  -- 4. Insert course (including description and parent visibility flag)
  insert into public.course_list (
    name,
    course_code,
    subject_id,
    max_students,
    start_date,
    end_date,
    is_for_year_g,
    description,
    description_visible_to_parents,
    wichtige_infos,
    pictures,
    school_id,
    possible_staff_members
  )
  values (
    _name,
    _course_code,
    _subject_id,
    _max_students,
    _start_date,
    _end_date,
    _is_for_year_g,
    _description,
    coalesce(_description_visible_to_parents, false),
    _wichtige_infos,
    coalesce(_pictures, array[]::text[]),
    current_school_id,
    coalesce(_possible_staff_members, array[]::uuid[])
  )
  returning id, name into course_id, course_name;

  -- 5. Insert possible times
  foreach p_entry in array _possible_times
  loop
    begin
      weekday := split_part(p_entry, '|', 1)::smallint;
      schedule_period_id := split_part(p_entry, '|', 2)::uuid;
      start_time := null;
      duration_minutes := null;

      if weekday < 1 or weekday > 6 then
        raise exception 'Invalid weekday in possible time: %', p_entry;
      end if;

      if array_length(string_to_array(p_entry, '|'), 1) >= 4 then
        start_time := nullif(split_part(p_entry, '|', 3), '')::time;
        duration_minutes := nullif(split_part(p_entry, '|', 4), '')::int;
      end if;

      insert into course_possible_times (
        course_id,
        school_id,
        weekday,
        schedule_period_id,
        is_custom_time,
        custom_start,
        custom_duration,
        created_by
      )
      values (
        course_id,
        current_school_id,
        weekday,
        schedule_period_id,
        start_time is not null,
        start_time,
        case
          when duration_minutes is not null then (duration_minutes || ' minutes')::interval
          else null
        end,
        current_profile_id
      );

    exception when others then
      raise exception 'Failed to insert possible time %: %', p_entry, sqlerrm;
    end;
  end loop;

end;$$;

-- Object 62/188
CREATE FUNCTION public.create_family_and_link_student(in_family_name text, in_student_id uuid, in_user_id uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  new_family_id uuid;
  student_school_id uuid;
  existing_family_id uuid;
  new_family_code text;
  school_short text;
begin
  -- Check if student already has a family
  select family_id into existing_family_id
  from family_members
  where profile_id = in_student_id and role = 'student' and removed_at is null;

  if existing_family_id is not null then
    return existing_family_id;
  end if;

  -- Get school ID from student profile
  select school_id into student_school_id
  from profile_info_student
  where profile_id = in_student_id;

  -- Get short code from school (first 2 letters of name)
  select upper(left(name, 2)) into school_short
  from structure_schools
  where id = student_school_id;

  -- Generate a unique family_code (e.g. DE12345)
  loop
    new_family_code := school_short || lpad((trunc(random() * 100000)::int)::text, 5, '0');
    exit when not exists (
      select 1 from families where family_code = new_family_code
    );
  end loop;

  -- Insert new family
  insert into families (school_id, family_name, family_code, created_by)
  values (student_school_id, in_family_name, new_family_code, in_user_id)
  returning id into new_family_id;

  -- Add student to family
  insert into family_members (
    family_id,
    profile_id,
    role,
    is_primary_contact,
    added_by
  )
  values (
    new_family_id,
    in_student_id,
    'student',
    false,
    in_user_id
  );

  -- Log to change_log
  insert into change_log (
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    after_data
  )
  values (
    in_user_id,
    student_school_id,
    'families',
    new_family_id,
    'insert',
    jsonb_build_object(
      'school_id', student_school_id,
      'family_name', in_family_name,
      'family_code', new_family_code,
      'created_by', in_user_id
    )
  );

  return new_family_id;
end;
$$;

-- Object 63/188
CREATE FUNCTION public.create_or_update_subject_schedule(_subject_id uuid, _class_id uuid, _period_id uuid, _day_id integer, _room_id uuid, _staff_ids uuid[], _school_id uuid, _start_date date, _end_date date, _start_time time without time zone, _end_time time without time zone) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  existing_schedule_id uuid;
  v_course_id uuid;  -- Declare the course_id variable
BEGIN
  -- If start_time or end_time are NULL, provide default values
  IF _start_time IS NULL THEN
    _start_time := '08:00:00'::time;  -- Default start time
  END IF;

  IF _end_time IS NULL THEN
    _end_time := '09:00:00'::time;  -- Default end time
  END IF;

  -- Ensure that either course_id or subject_id is set, if one is NULL, use the other
  IF _subject_id IS NULL AND v_course_id IS NULL THEN
    RAISE EXCEPTION 'Both subject_id and course_id cannot be NULL for schedule';
  ELSIF v_course_id IS NULL THEN
    v_course_id := NULL;  -- Ensure it's explicitly NULL for subject-based schedules
  ELSIF _subject_id IS NULL THEN
    _subject_id := NULL;  -- Ensure it's explicitly NULL for course-based schedules
  END IF;

  -- Log the updated start_time, end_time, course_id and subject_id
  INSERT INTO debug_logs(message) VALUES (
    'Using start_time: ' || _start_time || ', end_time: ' || _end_time ||
    ', course_id: ' || COALESCE(v_course_id::text, 'NULL') ||
    ', subject_id: ' || COALESCE(_subject_id::text, 'NULL')
  );

  -- Check if a matching subject-based schedule already exists
  SELECT cs.id INTO existing_schedule_id
  FROM public.course_schedules cs
  WHERE cs.school_id = _school_id
    AND cs.period_id = _period_id
    AND cs.day_id = _day_id
    AND cs.course_id IS NULL  -- subject-based schedule
    AND cs.subject_id = _subject_id
    AND cs.class_id = _class_id
  LIMIT 1;

  IF existing_schedule_id IS NOT NULL THEN
    -- Update existing subject-based schedule
    UPDATE public.course_schedules
    SET teacher_ids = _staff_ids,
        room_id = _room_id,
        start_time = _start_time,
        end_time = _end_time
    WHERE id = existing_schedule_id;

    -- Update lessons tied to this subject-based schedule
    UPDATE public.course_lessons
    SET teacher_ids = _staff_ids,
        room_id = _room_id
    WHERE schedule_id = existing_schedule_id
      AND start_datetime >= _start_date;

    RAISE NOTICE 'Subject-based schedule and lessons updated: %', existing_schedule_id;
  ELSE
    -- Insert new subject-based schedule if it doesn't exist
    INSERT INTO public.course_schedules (
      course_id, subject_id, class_id, day_id, start_date, end_date,
      start_time, end_time, teacher_ids, room_id, school_id, period_id
    )
    VALUES (
      NULL, _subject_id, _class_id, _day_id, _start_date, _end_date,
      _start_time, _end_time, _staff_ids, _room_id, _school_id, _period_id
    )
    RETURNING id INTO existing_schedule_id;

    -- Insert lessons for the new subject-based schedule
    INSERT INTO public.course_lessons (
      course_id, subject_id, class_id, schedule_id, start_datetime, end_datetime,
      school_id, teacher_ids, room_id, period_id, period_ids, is_lesson_based
    )
    SELECT
      NULL, _subject_id, _class_id, existing_schedule_id,
      gs::date + _start_time,
      gs::date + _end_time,
      _school_id, _staff_ids, _room_id,
      _period_id, ARRAY[_period_id], true
    FROM generate_series(_start_date, _end_date, interval '1 day') AS gs
    WHERE extract(dow FROM gs) = _day_id;

    RAISE NOTICE 'Created new subject-based schedule and lessons: %', existing_schedule_id;
  END IF;
END;
$$;

-- Object 64/188
CREATE FUNCTION public.create_parent_profile(p_first_name text, p_last_name text, p_school_id uuid, p_contact jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_new_profile_id UUID;
  v_parent_role_id UUID;
  v_result JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- Get Parent role ID
    SELECT id INTO v_parent_role_id
    FROM roles
    WHERE name = 'Parent'
    LIMIT 1;

    IF v_parent_role_id IS NULL THEN
      RAISE EXCEPTION 'Parent role not found in roles table';
    END IF;

    -- Create user profile
    INSERT INTO user_profiles (first_name, last_name, school_id, role_id, account_status)
    VALUES (p_first_name, p_last_name, p_school_id, v_parent_role_id, 'none')
    RETURNING id INTO v_new_profile_id;

    -- Add user role
    INSERT INTO user_roles (user_profile_id, role_id)
    VALUES (v_new_profile_id, v_parent_role_id)
    ON CONFLICT (user_profile_id, role_id) DO NOTHING;

    -- Add single contact with safer boolean handling
    INSERT INTO contacts (
      profile_id,
      profile_type,
      type,
      value,
      is_primary,
      notes,
      is_linked_to_user_login
    )
    VALUES (
      v_new_profile_id,
      'parent',
      (p_contact->>'contact_type')::TEXT,
      (p_contact->>'contact_value')::TEXT,
      CASE
        WHEN (p_contact->>'is_primary')::TEXT = 'true' THEN TRUE
        WHEN (p_contact->>'is_primary')::TEXT = 'false' THEN FALSE
        WHEN (p_contact->>'is_primary') IS NULL THEN FALSE
        ELSE FALSE
      END,
      (p_contact->>'notes')::TEXT,
      CASE
        WHEN (p_contact->>'is_linked_to_user_login')::TEXT = 'true' THEN TRUE
        WHEN (p_contact->>'is_linked_to_user_login')::TEXT = 'false' THEN FALSE
        WHEN (p_contact->>'is_linked_to_user_login') IS NULL THEN FALSE
        ELSE FALSE
      END
    );

    -- Prepare result
    v_result := jsonb_build_object(
      'success', TRUE,
      'profile_id', v_new_profile_id,
      'role_id', v_parent_role_id,
      'first_name', p_first_name,
      'last_name', p_last_name,
      'school_id', p_school_id
    );

    -- Commit transaction
    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on any error
      RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
  END;
END;
$$;

-- Object 65/188
CREATE FUNCTION public.create_registration_period(p_school_id uuid, p_semester_id uuid, p_title text, p_instructions text, p_internal_notes text, p_opens_at timestamp with time zone, p_closes_at timestamp with time zone, p_course_ids uuid[], p_user_id uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_period_id uuid := gen_random_uuid();
    v_now timestamptz := now();
    v_status text;
    v_distinct_courses uuid[];
    v_course_id uuid;
    v_course_grades int[];
BEGIN
    IF p_user_id IS NULL THEN RAISE EXCEPTION 'p_user_id is required'; END IF;
    IF p_title IS NULL OR length(trim(p_title))=0 THEN RAISE EXCEPTION 'title required'; END IF;
    IF p_opens_at IS NULL OR p_closes_at IS NULL OR p_closes_at <= p_opens_at THEN
        RAISE EXCEPTION 'invalid opens/closes';
    END IF;
    IF p_course_ids IS NULL OR array_length(p_course_ids,1)=0 THEN RAISE EXCEPTION 'course_ids required'; END IF;

    SELECT array_agg(DISTINCT cid) INTO v_distinct_courses FROM unnest(p_course_ids) t(cid);

    IF (
        SELECT count(*) FROM public.course_list c
        WHERE c.school_id = p_school_id AND c.id = ANY(v_distinct_courses)
    ) <> array_length(v_distinct_courses,1) THEN
        RAISE EXCEPTION 'one or more course_ids invalid for this school';
    END IF;

    IF p_opens_at > v_now THEN
        v_status := 'scheduled';
    ELSIF p_closes_at > v_now THEN
        v_status := 'open';
    ELSE
        v_status := 'closed';
    END IF;

    INSERT INTO public.registration_periods
        (id, school_id, semester_id, title, instructions, internal_notes, status, created_by_id, updated_by_id)
    VALUES
        (v_period_id, p_school_id, p_semester_id, p_title, p_instructions, p_internal_notes, v_status, p_user_id, p_user_id);

    FOREACH v_course_id IN ARRAY v_distinct_courses LOOP
        SELECT c.is_for_year_g INTO v_course_grades
        FROM public.course_list c
        WHERE c.id = v_course_id AND c.school_id = p_school_id;

        IF v_course_grades IS NULL OR array_length(v_course_grades,1)=0 THEN
            RAISE EXCEPTION 'course % has no grade levels (is_for_year_g)', v_course_id;
        END IF;

        INSERT INTO public.course_registration_windows
            (id, school_id, semester_id, course_id, registration_period_id,
             opens_at, closes_at, grade_levels, created_at, created_by)
        VALUES
            (gen_random_uuid(), p_school_id, p_semester_id, v_course_id, v_period_id,
             p_opens_at, p_closes_at, v_course_grades, v_now, p_user_id);
    END LOOP;

    RETURN v_period_id;
END;
$$;

-- Object 66/188
CREATE FUNCTION public.create_registration_period(p_school_id uuid, p_semester_id uuid, p_title text, p_instructions text, p_internal_notes text, p_opens_at timestamp with time zone, p_closes_at timestamp with time zone, p_course_ids uuid[], p_user_id uuid, p_max_wishes_total integer DEFAULT NULL::integer, p_max_wishes_per_day integer DEFAULT NULL::integer) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_period_id uuid := gen_random_uuid();
    v_now timestamptz := now();
    v_status text;
    v_distinct_courses uuid[];
    v_course_id uuid;
    v_course_grades int[];
BEGIN
    IF p_user_id IS NULL THEN RAISE EXCEPTION 'p_user_id is required'; END IF;
    IF p_title IS NULL OR length(trim(p_title)) = 0 THEN RAISE EXCEPTION 'title required'; END IF;
    IF p_opens_at IS NULL OR p_closes_at IS NULL OR p_closes_at <= p_opens_at THEN
        RAISE EXCEPTION 'invalid opens/closes'; END IF;
    IF p_course_ids IS NULL OR array_length(p_course_ids,1) = 0 THEN
        RAISE EXCEPTION 'course_ids required'; END IF;
    IF (p_max_wishes_total IS NOT NULL AND p_max_wishes_total < 0)
       OR (p_max_wishes_per_day IS NOT NULL AND p_max_wishes_per_day < 0) THEN
        RAISE EXCEPTION 'wish limits must be >= 0 when provided';
    END IF;

    SELECT array_agg(DISTINCT cid) INTO v_distinct_courses
    FROM unnest(p_course_ids) t(cid);

    IF (
        SELECT count(*) FROM public.course_list c
        WHERE c.school_id = p_school_id AND c.id = ANY(v_distinct_courses)
    ) <> array_length(v_distinct_courses,1) THEN
        RAISE EXCEPTION 'one or more course_ids invalid for this school';
    END IF;

    IF p_opens_at > v_now THEN
        v_status := 'scheduled';
    ELSIF p_closes_at > v_now THEN
        v_status := 'open';
    ELSE
        v_status := 'closed';
    END IF;

    INSERT INTO public.registration_periods
        (id, school_id, semester_id, title, instructions, internal_notes,
         status, created_by_id, updated_by_id, max_wishes_total, max_wishes_per_day)
    VALUES
        (v_period_id, p_school_id, p_semester_id, p_title, p_instructions, p_internal_notes,
         v_status, p_user_id, p_user_id, p_max_wishes_total, p_max_wishes_per_day);

    FOREACH v_course_id IN ARRAY v_distinct_courses LOOP
        SELECT c.is_for_year_g INTO v_course_grades
        FROM public.course_list c
        WHERE c.id = v_course_id AND c.school_id = p_school_id;

        IF v_course_grades IS NULL OR array_length(v_course_grades,1) = 0 THEN
            RAISE EXCEPTION 'course % has no grade levels (is_for_year_g)', v_course_id;
        END IF;

        INSERT INTO public.course_registration_windows
            (id, school_id, course_id, semester_id, opens_at, closes_at,
             created_by, registration_period_id, grade_levels)
        VALUES
            (gen_random_uuid(), p_school_id, v_course_id, p_semester_id, p_opens_at, p_closes_at,
             p_user_id, v_period_id, v_course_grades);
    END LOOP;

    RETURN v_period_id;
END;
$$;

-- Object 67/188
CREATE FUNCTION public.create_schedule_and_generate_lessons(_course_id uuid, _day_id integer, _start_date date, _end_date date, _start_time time without time zone, _end_time time without time zone, _teacher_ids uuid[], _room_id uuid, _school_id uuid, _period_id uuid, _period_count integer) RETURNS TABLE(lesson_id uuid, start_datetime timestamp without time zone, end_datetime timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
declare
  schedule_id uuid;
  weekday_number int;
  period_ids uuid[];
  start_block int;
begin
  -- Get weekday number (0 = Sunday, 1 = Monday, ...)
  select day_number into weekday_number
  from structure_days
  where id = _day_id;

  -- Get block number of the starting period
  select sp.block_number
  into start_block
  from schedule_periods sp
  where sp.id = _period_id;

  -- Get N consecutive period_ids (regardless of day)
  select array_agg(ordered.id order by ordered.block_number)
  into period_ids
  from (
    select sp.id, sp.block_number
    from schedule_periods sp
    where sp.school_id = _school_id
      and sp.block_number >= start_block
    order by sp.block_number
    limit _period_count
  ) as ordered;

  -- Insert schedule
  insert into course_schedules (
    course_id, day_id, start_date, end_date,
    start_time, end_time, teacher_ids, room_id,
    school_id, period_id, period_ids
  )
  values (
    _course_id, _day_id, _start_date, _end_date,
    _start_time, _end_time, _teacher_ids, _room_id,
    _school_id, _period_id, period_ids
  )
  returning id into schedule_id;

  -- Insert lessons on matching weekday
  return query
  insert into course_lessons (
    course_id, schedule_id, start_datetime, end_datetime,
    school_id, teacher_ids, period_id, period_ids
  )
  select
    _course_id,
    schedule_id,
    gs::date + _start_time,
    gs::date + _end_time,
    _school_id,
    _teacher_ids,
    _period_id,
    period_ids
  from generate_series(_start_date, _end_date, interval '1 day') as gs
  where extract(dow from gs) = weekday_number
  returning course_lessons.id as lesson_id,
            course_lessons.start_datetime,
            course_lessons.end_datetime;
end;
$$;

-- Object 68/188
CREATE FUNCTION public.create_school_year_with_semesters_and_log(_school_id uuid, _label text, _start_date date, _end_date date, _semesters jsonb, _user_id uuid, _reason text DEFAULT 'Added school year and semesters'::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$DECLARE
  new_school_year_id UUID := gen_random_uuid();
  new_semester_id UUID;
  semester_record JSONB;
  change_group_id UUID := gen_random_uuid();
BEGIN
  -- Insert the school year
  INSERT INTO public.structure_school_years (id, school_id, label, start_date, end_date)
  VALUES (new_school_year_id, _school_id, _label, _start_date, _end_date);

  -- Log the school year creation
  INSERT INTO public.change_log (
    change_group_id, user_id, school_id, table_name, record_id,
    action_type, before_data, after_data, reason
  ) VALUES (
    change_group_id, _user_id, _school_id, 'structure_school_years', new_school_year_id,
    'insert', NULL,
    jsonb_build_object(
      'id', new_school_year_id,
      'school_id', _school_id,
      'label', _label,
      'start_date', _start_date,
      'end_date', _end_date
    ),
    _reason
  );

  -- Insert and log each semester
  FOR semester_record IN SELECT * FROM jsonb_array_elements(_semesters)
  LOOP
    new_semester_id := gen_random_uuid();

    INSERT INTO public.structure_school_semesters (
      id, school_id, school_year_id, name, start_date, end_date
    ) VALUES (
      new_semester_id,
      _school_id,
      new_school_year_id,
      semester_record->>'name',
      (semester_record->>'start_date')::date,
      (semester_record->>'end_date')::date
    );

    INSERT INTO public.change_log (
      change_group_id, user_id, school_id, table_name, record_id,
      action_type, before_data, after_data, reason
    ) VALUES (
      change_group_id, _user_id, _school_id, 'structure_school_semesters', new_semester_id,
      'insert', NULL,
      jsonb_build_object(
        'id', new_semester_id,
        'school_id', _school_id,
        'school_year_id', new_school_year_id,
        'name', semester_record->>'name',
        'start_date', semester_record->>'start_date',
        'end_date', semester_record->>'end_date'
      ),
      _reason
    );
  END LOOP;

  RETURN new_school_year_id;
END;$$;

-- Object 69/188
CREATE FUNCTION public.create_staff_absence(p_staff_id uuid, p_start_date date, p_end_date date DEFAULT NULL::date, p_start_period integer DEFAULT NULL::integer, p_end_period integer DEFAULT NULL::integer, p_reason text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_attachment_url text DEFAULT NULL::text, p_is_approved boolean DEFAULT false, p_approved_by uuid DEFAULT NULL::uuid, p_created_by uuid DEFAULT auth.uid(), p_substitution_status text DEFAULT 'pending'::text) RETURNS SETOF uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_school_id  uuid := (
    SELECT school_id
      FROM user_profiles
     WHERE id = p_staff_id
     LIMIT 1
  );
  v_user_id    uuid := p_created_by;     -- for change_log.user_id
  v_absence_id uuid;
  v_date       date;
BEGIN
  IF p_staff_id IS NULL OR p_start_date IS NULL THEN
    RAISE EXCEPTION 'staff_id and start_date are required.';
  END IF;
  IF p_end_date IS NULL THEN
    p_end_date := p_start_date;
  END IF;

  FOR v_date IN
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date
  LOOP
    IF EXISTS (
      SELECT 1
        FROM public.staff_absences
       WHERE staff_id = p_staff_id
         AND date = v_date
         AND is_approved IS DISTINCT FROM TRUE
    ) THEN
      RAISE EXCEPTION 'Absence already exists on %.', v_date;
    END IF;

    v_absence_id := gen_random_uuid();
    INSERT INTO public.staff_absences (
      id, staff_id, date, start_period, end_period,
      reason, notes, created_at, school_id,
      substitution_status, is_approved, approved_by,
      attachment_url, created_by, end_date
    )
    VALUES (
      v_absence_id, p_staff_id, v_date, p_start_period, p_end_period,
      p_reason, p_notes, now(), v_school_id,
      p_substitution_status, p_is_approved, p_approved_by,
      p_attachment_url, p_created_by, p_end_date
    );
    RETURN NEXT v_absence_id;
  END LOOP;
END;
$$;

-- Object 70/188
CREATE FUNCTION public.create_staff_member(_school_id uuid, _semester_id uuid, _role_id uuid, _data jsonb, OUT created_user_profile_id uuid, OUT created_staff_profile_id uuid, OUT created_preference_id uuid) RETURNS record
    LANGUAGE plpgsql
    AS $$
DECLARE
  raw_subjects_stud TEXT := _data ->> 'studied subjects';
  raw_subject_wishes TEXT := _data ->> 'subject wishes';
  raw_classes TEXT := _data ->> 'classes';
BEGIN
  -- 1. Create user_profile
  INSERT INTO user_profiles (school_id, first_name, last_name, role_id)
  VALUES (
    _school_id,
    _data ->> 'vorname',
    _data ->> 'Nachname',
    _role_id
  )
  RETURNING id INTO created_user_profile_id;

  -- 1b. Link role in user_roles table
  INSERT INTO user_roles (user_profile_id, role_id)
  VALUES (created_user_profile_id, _role_id);

  -- 2. Create profile_info_staff
  INSERT INTO profile_info_staff (
    profile_id,
    school_id,
    roles,
    kurzung,
    hours_account,
    credit_hours,
    credit_hours_note,
    age_reduction,
    subjects_stud
  ) VALUES (
    created_user_profile_id,
    _school_id,
    ARRAY['teacher'],
    _data ->> 'Init',
    (_data ->> 'Stundenkont.')::INTEGER,
    NULLIF(_data ->> 'Credit_hours', '')::INTEGER,
    NULLIF(_data ->> 'credit hour explanation', ''),
    NULLIF(_data ->> 'age_reduction', '')::INTEGER,
    CASE
      WHEN raw_subjects_stud IS NOT NULL AND LENGTH(TRIM(raw_subjects_stud)) > 0
      THEN string_to_array(
        regexp_replace(
          regexp_replace(raw_subjects_stud, '[\[\]"]', '', 'g'),
          '\s*,\s*', ',', 'g'
        ), ','
      )::UUID[]
      ELSE NULL
    END
  ) RETURNING profile_id INTO created_staff_profile_id;

  -- 3. Optionally create preferences if subject wishes exist
  IF (_data ? 'subject wishes') THEN
    INSERT INTO staff_yearly_preferences (
      staff_profile_id,
      semester_id,
      subject_pref,
      classes,
      clubs,
      team,
      efob_team,
      wishes,
      needs
    ) VALUES (
      created_staff_profile_id,
      _semester_id,
      CASE
        WHEN raw_subject_wishes IS NOT NULL AND LENGTH(TRIM(raw_subject_wishes)) > 0
        THEN string_to_array(
          regexp_replace(
            regexp_replace(raw_subject_wishes, '[\[\]"]', '', 'g'),
            '\s*,\s*', ',', 'g'
          ), ','
        )::UUID[]
        ELSE NULL
      END,
      CASE
        WHEN raw_classes IS NOT NULL AND LENGTH(TRIM(raw_classes)) > 0
        THEN string_to_array(
          regexp_replace(
            regexp_replace(raw_classes, '[\[\]"]', '', 'g'),
            '\s*,\s*', ',', 'g'
          ), ','
        )::UUID[]
        ELSE NULL
      END,
      _data ->> 'input_clubs',
      _data ->> 'Team',
      _data ->> 'eFöB Team',
      _data ->> 'wishes',
      _data ->> 'needs'
    ) RETURNING id INTO created_preference_id;
  ELSE
    created_preference_id := NULL;
  END IF;

END;
$$;

-- Object 71/188
CREATE FUNCTION public.create_standard_pickup_rules(p_student_id uuid, p_school_id uuid, p_rules jsonb, p_valid_from date, p_created_by uuid, p_valid_until date DEFAULT NULL::date) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
    v_rule jsonb;
    v_weekday integer;
    v_pickup_type text;
    v_notes text;
    v_arrangement_id uuid;
    v_results jsonb := '[]'::jsonb;
    v_result jsonb;
    v_semester_id uuid;
BEGIN
    -- Validate inputs
    IF p_student_id IS NULL OR p_school_id IS NULL OR p_rules IS NULL OR p_valid_from IS NULL OR p_created_by IS NULL THEN
        RAISE EXCEPTION 'Required parameters cannot be null';
    END IF;

    -- If valid_for is provided in the JSON, use it as semester/valid_until reference
    -- Extract semester_id from the first rule if present (only if not empty)
    IF p_rules->0->'valid_for' IS NOT NULL AND 
       p_rules->0->>'valid_for' IS NOT NULL AND 
       p_rules->0->>'valid_for' != '' THEN
        v_semester_id := (p_rules->0->>'valid_for')::uuid;
        -- For now, we'll use the provided valid_until or set it to end of academic year
        IF p_valid_until IS NULL THEN
            p_valid_until := p_valid_from + INTERVAL '1 year';
        END IF;
    END IF;

    -- Process each rule in the JSON array
    FOR v_rule IN SELECT jsonb_array_elements(p_rules)
    LOOP
        -- Extract weekday (key) and rule details
        v_weekday := (SELECT key::integer FROM jsonb_each_text(v_rule) WHERE key ~ '^[0-6]$' LIMIT 1);
        
        -- Skip if no valid weekday found or if pickup_type is empty
        CONTINUE WHEN v_weekday IS NULL;
        
        v_pickup_type := v_rule->>v_weekday::text;
        v_notes := v_rule->>'note';
        
        -- Skip empty pickup types
        CONTINUE WHEN v_pickup_type IS NULL OR v_pickup_type = '';
        
        -- Validate pickup type
        IF v_pickup_type NOT IN ('self_dismissal', 'public_transport', 'school_bus', 'authorized_person') THEN
            RAISE EXCEPTION 'Invalid pickup_type: %. Must be one of: self_dismissal, public_transport, school_bus, authorized_person', v_pickup_type;
        END IF;

        -- Delete existing rule for this student/weekday/period if any
        DELETE FROM student_weekly_pickup_arrangements 
        WHERE student_id = p_student_id 
        AND school_id = p_school_id 
        AND weekday = v_weekday
        AND (valid_until IS NULL OR valid_until >= p_valid_from);

        -- Generate UUID for the new arrangement
        v_arrangement_id := gen_random_uuid();

        -- Insert new arrangement
        INSERT INTO student_weekly_pickup_arrangements (
            id,
            student_id,
            school_id, 
            weekday,
            pickup_type,
            notes,
            valid_from,
            valid_until,
            created_by
        ) VALUES (
            v_arrangement_id,
            p_student_id,
            p_school_id,
            v_weekday,
            v_pickup_type,
            v_notes,
            p_valid_from,
            p_valid_until,
            p_created_by
        );

        -- Add to results
        v_result := jsonb_build_object(
            'id', v_arrangement_id,
            'weekday', v_weekday,
            'pickup_type', v_pickup_type,
            'notes', v_notes,
            'valid_from', p_valid_from,
            'valid_until', p_valid_until
        );
        v_results := v_results || v_result;

        -- Log the change
        INSERT INTO change_log (
            user_id,
            school_id,
            table_name,
            record_id,
            action_type,
            before_data,
            after_data,
            reason
        ) VALUES (
            p_created_by,
            p_school_id,
            'student_weekly_pickup_arrangements',
            v_arrangement_id,
            'insert',
            NULL,
            v_result,
            'Created standard pickup rule'
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Standard pickup rules created successfully',
        'arrangements', v_results,
        'student_id', p_student_id,
        'school_id', p_school_id,
        'valid_from', p_valid_from,
        'valid_until', p_valid_until
    );

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating standard pickup rules: %', SQLERRM;
END;
$_$;


ALTER FUNCTION public.create_standard_pickup_rules(p_student_id uuid, p_school_id uuid, p_rules jsonb, p_valid_from date, p_created_by uuid, p_valid_until date) OWNER TO supabase_admin;

--
-- Name: delete_course_by_id(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.delete_course_by_id(p_course_id uuid, p_user_id uuid, p_school_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  -- Set session variables for logging
  perform set_config('my.user_id', p_user_id::text, true);
  if p_school_id is not null then
    perform set_config('my.school_id', p_school_id::text, true);
  end if;

  -- First delete any linked data (e.g. possible times)
  delete from public.course_possible_times where course_id = p_course_id;

  -- Then delete the course itself
  delete from public.course_list where id = p_course_id;
end;
$$;

-- Object 72/188
CREATE FUNCTION public.delete_my_school_days() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
  delete from public.structure_school_days
  where school_id = (
    select school_id
    from public.user_profiles
    where id = auth.uid()
  );
$$;

-- Object 73/188
CREATE FUNCTION public.delete_staff_absence(p_absence_id uuid, p_user_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_before_data jsonb;
  v_school_id uuid;
BEGIN
  -- Capture the current row for audit log
  SELECT to_jsonb(sa.*), sa.school_id
    INTO v_before_data, v_school_id
    FROM staff_absences sa
   WHERE sa.id = p_absence_id;

  IF v_before_data IS NULL THEN
    RAISE EXCEPTION 'Absence with id % not found', p_absence_id;
  END IF;

  -- Delete the absence
  DELETE FROM staff_absences
   WHERE id = p_absence_id;

  -- Optionally: delete related substitutions
  -- DELETE FROM substitutions WHERE absent_teacher_id = (v_before_data->>'staff_id')::uuid AND original_lesson_id IN (...);

  -- Log the deletion
  INSERT INTO change_log (
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    before_data,
    created_at,
    reason
  ) VALUES (
    p_user_id,
    v_school_id,
    'staff_absences',
    p_absence_id,
    'hard_delete',
    v_before_data,
    now(),
    'Absence deleted by function'
  );
END;
$$;

-- Object 74/188
CREATE FUNCTION public.delete_student_absence_with_cleanup(p_absence_note_id uuid, p_school_id uuid, p_deleted_by uuid DEFAULT auth.uid(), p_deletion_reason text DEFAULT 'User requested deletion'::text) RETURNS TABLE(success boolean, message text, deleted_records json)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_absence_note RECORD;
  v_recurrence_id uuid;
  v_deleted_daily_logs integer := 0;
  v_reset_daily_logs integer := 0;
  v_deleted_attendance_logs integer := 0;
  v_deleted_recurrence boolean := false;
  v_affected_dates date[];
  v_result json;
  v_original_status text;
BEGIN
  -- Debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('delete_student_absence_start', 
     format('Starting trackable deletion of absence note %s for school %s by user %s', 
            p_absence_note_id, p_school_id, p_deleted_by));

  -- Get the absence note details first with validation
  SELECT * INTO v_absence_note
  FROM student_absence_notes 
  WHERE id = p_absence_note_id 
    AND school_id = p_school_id 
    AND deleted_at IS NULL;

  -- Check if absence note exists and belongs to this school
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false as success,
      'Absence note not found, already deleted, or does not belong to this school' as message,
      json_build_object(
        'absence_note_id', p_absence_note_id,
        'school_id', p_school_id,
        'error', 'NOT_FOUND'
      ) as deleted_records;
    RETURN;
  END IF;

  v_recurrence_id := v_absence_note.recurrence_id;
  v_original_status := v_absence_note.absence_status;

  -- Debug logging for found absence
  INSERT INTO debug_logs (step, message) VALUES 
    ('absence_note_found', 
     format('Found absence note %s, student: %s, dates: %s to %s, status: %s, recurrence: %s', 
            p_absence_note_id, v_absence_note.student_id, 
            v_absence_note.start_date, v_absence_note.end_date, 
            v_original_status, v_recurrence_id));

  -- Get all affected dates for tracking
  SELECT ARRAY_AGG(date) INTO v_affected_dates
  FROM student_daily_log 
  WHERE absence_note_id = p_absence_note_id;

  -- 1. DELETE STUDENT ATTENDANCE LOGS (lesson-level absences)
  -- Hard delete since these are system-generated records
  DELETE FROM student_attendance_logs 
  WHERE absence_note_id = p_absence_note_id;
  
  GET DIAGNOSTICS v_deleted_attendance_logs = ROW_COUNT;

  INSERT INTO debug_logs (step, message) VALUES 
    ('deleted_attendance_logs', 
     format('Deleted %s attendance log records', v_deleted_attendance_logs));

  -- 2. HANDLE STUDENT DAILY LOGS
  -- For single-day absences: Reset to normal state
  -- For multi-day absences: Some days might be completely removed, others reset
  
  -- Reset daily logs that have other attendance data (don't delete completely)
  UPDATE student_daily_log 
  SET 
    absence_note_id = NULL,
    presence_status = 'present',
    notes = CASE 
      WHEN notes LIKE '%Absent%' THEN 
        format('Previous absence deleted on %s by user %s. Reason: %s', 
               NOW()::date, p_deleted_by, p_deletion_reason)
      ELSE 
        COALESCE(notes, '') || format(' [Absence deleted on %s]', NOW()::date)
    END,
    expected_arrival_time = NULL,
    expected_checkout_time = NULL,
    updated_at = NOW(),
    last_updated_by = p_deleted_by
  WHERE absence_note_id = p_absence_note_id
    -- Only reset if there are other logs for this student on this day
    AND EXISTS (
      SELECT 1 FROM student_attendance_logs sal 
      WHERE sal.student_id = student_daily_log.student_id 
        AND sal.daily_log_id = student_daily_log.id
        AND sal.absence_note_id IS NULL  -- Not related to this absence
    );

  GET DIAGNOSTICS v_reset_daily_logs = ROW_COUNT;

  -- Delete daily logs that were created solely for this absence
  DELETE FROM student_daily_log 
  WHERE absence_note_id = p_absence_note_id
    -- Only delete if no other attendance logs reference this daily log
    AND NOT EXISTS (
      SELECT 1 FROM student_attendance_logs sal 
      WHERE sal.daily_log_id = student_daily_log.id
        AND sal.absence_note_id IS NULL  -- Not related to this absence
    );

  GET DIAGNOSTICS v_deleted_daily_logs = ROW_COUNT;

  INSERT INTO debug_logs (step, message) VALUES 
    ('processed_daily_logs', 
     format('Reset %s daily log records, deleted %s daily log records', 
            v_reset_daily_logs, v_deleted_daily_logs));

  -- 3. HANDLE RECURRENCE PATTERN
  IF v_recurrence_id IS NOT NULL THEN
    -- Check if this recurrence is used by other absence notes
    IF NOT EXISTS (
      SELECT 1 FROM student_absence_notes 
      WHERE recurrence_id = v_recurrence_id 
        AND id != p_absence_note_id 
        AND deleted_at IS NULL
    ) THEN
      -- Safe to soft delete the recurrence pattern
      UPDATE student_absence_recurrences 
      SET 
        deleted_at = NOW(),
        deleted_by = p_deleted_by,
        deletion_reason = p_deletion_reason
      WHERE id = v_recurrence_id;
      
      v_deleted_recurrence := true;

      INSERT INTO debug_logs (step, message) VALUES 
        ('deleted_recurrence', 
         format('Soft deleted recurrence pattern %s', v_recurrence_id));
    ELSE
      INSERT INTO debug_logs (step, message) VALUES 
        ('kept_recurrence', 
         format('Kept recurrence pattern %s (used by other absences)', v_recurrence_id));
    END IF;
  END IF;

  -- 4. SOFT DELETE THE MAIN ABSENCE NOTE WITH TRACKING
  UPDATE student_absence_notes 
  SET 
    deleted_at = NOW(),
    updated_by = p_deleted_by,
    updated_at = NOW(),
    status = 'deleted',
    -- Add deletion tracking to reason field
    reason = COALESCE(reason, '') || format(
      ' [DELETED on %s by %s. Reason: %s. Original status: %s]',
      NOW()::date, p_deleted_by, p_deletion_reason, v_original_status
    )
  WHERE id = p_absence_note_id;

  INSERT INTO debug_logs (step, message) VALUES 
    ('soft_deleted_absence_note', 
     format('Soft deleted absence note %s with tracking info', p_absence_note_id));

  -- 5. CREATE DELETION AUDIT LOG (if you have an audit table)
  -- INSERT INTO absence_deletion_audit (
  --   absence_note_id, deleted_by, deleted_at, deletion_reason, 
  --   original_status, affected_dates, cleanup_summary
  -- ) VALUES (
  --   p_absence_note_id, p_deleted_by, NOW(), p_deletion_reason,
  --   v_original_status, v_affected_dates, 
  --   format('Cleaned up %s attendance logs, %s daily logs', 
  --          v_deleted_attendance_logs, v_deleted_daily_logs + v_reset_daily_logs)
  -- );

  -- Prepare detailed result summary
  v_result := json_build_object(
    'absence_note_id', p_absence_note_id,
    'student_id', v_absence_note.student_id,
    'school_id', p_school_id,
    'original_status', v_original_status,
    'start_date', v_absence_note.start_date,
    'end_date', v_absence_note.end_date,
    'affected_dates', v_affected_dates,
    'cleanup_summary', json_build_object(
      'deleted_attendance_logs', v_deleted_attendance_logs,
      'reset_daily_logs', v_reset_daily_logs,
      'deleted_daily_logs', v_deleted_daily_logs,
      'deleted_recurrence', v_deleted_recurrence,
      'recurrence_id', v_recurrence_id
    ),
    'deletion_info', json_build_object(
      'deleted_at', NOW(),
      'deleted_by', p_deleted_by,
      'deletion_reason', p_deletion_reason
    )
  );

  -- Final debug logging
  INSERT INTO debug_logs (step, message) VALUES 
    ('delete_student_absence_complete', 
     format('Completed trackable deletion of absence %s: %s attendance logs, %s daily logs processed, recurrence deleted: %s', 
            p_absence_note_id, v_deleted_attendance_logs, 
            v_deleted_daily_logs + v_reset_daily_logs, v_deleted_recurrence));

  -- Return success with detailed tracking
  RETURN QUERY SELECT 
    true as success,
    format('Successfully deleted absence and cleaned up %s related records. All changes tracked for audit.', 
           v_deleted_attendance_logs + v_deleted_daily_logs + v_reset_daily_logs) as message,
    v_result as deleted_records;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO debug_logs (step, message) VALUES 
      ('delete_student_absence_error', 
       format('Error in trackable deletion of absence %s: %s', p_absence_note_id, SQLERRM));

    RETURN QUERY SELECT 
      false as success,
      format('Failed to delete absence: %s', SQLERRM) as message,
      json_build_object(
        'error', SQLERRM, 
        'absence_note_id', p_absence_note_id,
        'school_id', p_school_id
      ) as deleted_records;
END;
$$;

-- Object 75/188
CREATE FUNCTION public.delete_user_refresh_tokens(user_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Delete refresh tokens for the specified user
    DELETE FROM auth.refresh_tokens 
    USING auth.users
    WHERE 
        auth.refresh_tokens.user_id::UUID = auth.users.id
        AND auth.users.email = user_email;
END;
$$;

-- Object 76/188
CREATE FUNCTION public.demo_simplified_pickup_system(p_demo_student_id uuid DEFAULT NULL::uuid) RETURNS TABLE(demo_step text, demo_action text, demo_result text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_student_id uuid;
    v_weekly_id uuid;
    v_override_id uuid;
    v_arrangement record;
BEGIN
    -- Use provided student or find any student
    IF p_demo_student_id IS NOT NULL THEN
        v_student_id := p_demo_student_id;
    ELSE
        SELECT id INTO v_student_id FROM user_profiles 
        WHERE id IN (SELECT profile_id FROM profile_info_student) 
        LIMIT 1;
    END IF;
    
    IF v_student_id IS NULL THEN
        RETURN QUERY SELECT 'ERROR'::text, 'No student found for demo'::text, 'Please provide a valid student ID'::text;
        RETURN;
    END IF;
    
    -- Demo Step 1: Create weekly default
    RETURN QUERY SELECT 
        'Step 1'::text, 
        'Create weekly default (Monday = bus pickup)'::text,
        'Setting up recurring Monday bus pickup'::text;
    
    BEGIN
        v_weekly_id := create_weekly_pickup_arrangement(
            p_student_id := v_student_id,
            p_weekday := 1,  -- Monday
            p_pickup_type := 'bus',
            p_notes := 'Demo: Regular Monday bus pickup'
        );
        
        RETURN QUERY SELECT 
            'Step 1'::text, 
            'Weekly arrangement created'::text,
            ('ID: ' || v_weekly_id::text)::text;
            
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'Step 1'::text, 
                'Error creating weekly arrangement'::text,
                SQLERRM::text;
    END;
    
    -- Demo Step 2: Query for Monday
    RETURN QUERY SELECT 
        'Step 2'::text, 
        'Query pickup for next Monday'::text,
        'Should return weekly default (bus)'::text;
    
    SELECT * INTO v_arrangement 
    FROM get_student_pickup_arrangement_for_date(v_student_id, CURRENT_DATE + (1 - EXTRACT(ISODOW FROM CURRENT_DATE) + 7)::integer);
    
    IF v_arrangement.id IS NOT NULL THEN
        RETURN QUERY SELECT 
            'Step 2'::text, 
            'Query result'::text,
            ('Type: ' || v_arrangement.pickup_type || ', Source: ' || v_arrangement.source_type)::text;
    ELSE
        RETURN QUERY SELECT 
            'Step 2'::text, 
            'Query result'::text,
            'No arrangement found'::text;
    END IF;
    
    -- Demo Step 3: Create override
    RETURN QUERY SELECT 
        'Step 3'::text, 
        'Create override for next Monday'::text,
        'Override with parent pickup instead of bus'::text;
    
    BEGIN
        v_override_id := create_pickup_arrangement_override(
            p_student_id := v_student_id,
            p_pickup_date := CURRENT_DATE + (1 - EXTRACT(ISODOW FROM CURRENT_DATE) + 7)::integer,
            p_pickup_type := 'parent',
            p_notes := 'Demo: Special parent pickup override'
        );
        
        RETURN QUERY SELECT 
            'Step 3'::text, 
            'Override created'::text,
            ('ID: ' || v_override_id::text)::text;
            
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'Step 3'::text, 
                'Error creating override'::text,
                SQLERRM::text;
    END;
    
    -- Demo Step 4: Query again
    SELECT * INTO v_arrangement 
    FROM get_student_pickup_arrangement_for_date(v_student_id, CURRENT_DATE + (1 - EXTRACT(ISODOW FROM CURRENT_DATE) + 7)::integer);
    
    RETURN QUERY SELECT 
        'Step 4'::text, 
        'Query same Monday again'::text,
        ('Now returns: ' || v_arrangement.pickup_type || ' (' || v_arrangement.source_type || ')')::text;
    
    -- Cleanup demo data
    DELETE FROM student_pickup_arrangement_overrides WHERE id = v_override_id;
    DELETE FROM student_weekly_pickup_arrangements WHERE id = v_weekly_id;
    
    RETURN QUERY SELECT 
        'Cleanup'::text, 
        'Demo data removed'::text,
        'Demo completed successfully'::text;
END;
$$;

-- Object 77/188
CREATE FUNCTION public.edit_bulletin_post_instance(_post_id uuid, _title text, _body text, _display_from timestamp without time zone, _edited_by uuid, _attachments text[] DEFAULT '{}'::text[], _is_important boolean DEFAULT false, _notify_on_post boolean DEFAULT false, _read_required boolean DEFAULT false, _visible_users uuid[] DEFAULT '{}'::uuid[], _visible_groups uuid[] DEFAULT '{}'::uuid[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  old_post bulletin_posts%ROWTYPE;
BEGIN
  -- Load existing post for logging and attachment diff
  SELECT * INTO old_post FROM bulletin_posts WHERE id = _post_id;

  IF old_post IS NULL THEN
    RAISE EXCEPTION 'Post % not found', _post_id;
  END IF;

  -- Update the bulletin post (no updated_at column)
  UPDATE bulletin_posts SET
    title = _title,
    body = _body,
    display_from = _display_from,
    attachments = _attachments,
    is_important = _is_important,
    notify_on_post = _notify_on_post,
    read_required = _read_required,
    visible_groups = _visible_groups
  WHERE id = _post_id;

  -- Replace visible users
  DELETE FROM bulletin_post_users WHERE post_id = _post_id;
  IF array_length(_visible_users, 1) IS NOT NULL THEN
    INSERT INTO bulletin_post_users (post_id, user_id)
    SELECT _post_id, unnest(_visible_users);
  END IF;

  -- Handle attachment deletion if attachments changed
  IF old_post.attachments IS DISTINCT FROM _attachments THEN
    -- TODO: Replace with your actual bucket cleanup logic
    PERFORM public.delete_attachments(old_post.attachments);
  END IF;

  -- Log the change in the change_log table
  INSERT INTO public.change_log (
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    before_data,
    after_data,
    created_at,
    source
  ) VALUES (
    _edited_by,
    old_post.school_id,
    'bulletin_posts',
    _post_id,
    'update',
    to_jsonb(old_post),
    to_jsonb((SELECT bulletin_posts FROM bulletin_posts WHERE id = _post_id)),
    now(),
    'manual'
  );
END;
$$;

-- Object 78/188
CREATE FUNCTION public.edit_student_absence(p_absence_id uuid, p_school_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_absence_type text DEFAULT NULL::text, p_reason text DEFAULT NULL::text, p_attachment_url text DEFAULT NULL::text, p_time_range text DEFAULT NULL::text, p_duration text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    current_absence record;
    result json;
BEGIN
    -- Get current absence record
    SELECT * INTO current_absence 
    FROM student_absence_notes 
    WHERE id = p_absence_id 
    AND school_id = p_school_id 
    AND deleted_at IS NULL;
    
    -- Check if absence exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Absence not found or access denied',
            'message', 'Could not find absence with given ID'
        );
    END IF;
    
    -- Validate absence_type if provided
    IF p_absence_type IS NOT NULL AND p_absence_type NOT IN ('krankgemeldet', 'unentschuldigt', 'beurlaubt', 'ungeklärt', 'verspätet') THEN
        RAISE EXCEPTION 'Invalid absence_type. Must be one of: krankgemeldet, unentschuldigt, beurlaubt, ungeklärt, verspätet';
    END IF;
    
    -- Update absence record
    UPDATE student_absence_notes SET
        start_date = COALESCE(p_start_date, start_date),
        end_date = COALESCE(p_end_date, end_date),
        absence_type = COALESCE(p_absence_type, absence_type),
        reason = COALESCE(p_reason, reason),
        attachment_url = CASE 
            WHEN p_attachment_url = '' THEN NULL 
            ELSE COALESCE(p_attachment_url, attachment_url) 
        END,
        updated_by = auth.uid(),
        updated_at = NOW(),
        is_excused = CASE 
            WHEN p_absence_type IS NOT NULL THEN 
                CASE WHEN p_absence_type IN ('krankgemeldet', 'beurlaubt') THEN true ELSE false END
            ELSE is_excused
        END
    WHERE id = p_absence_id 
    AND school_id = p_school_id 
    AND deleted_at IS NULL;
    
    -- Return success with updated data
    SELECT json_build_object(
        'success', true,
        'message', 'Absence updated successfully',
        'data', json_build_object(
            'id', p_absence_id,
            'start_date', COALESCE(p_start_date, current_absence.start_date),
            'end_date', COALESCE(p_end_date, current_absence.end_date),
            'absence_type', COALESCE(p_absence_type, current_absence.absence_type),
            'reason', COALESCE(p_reason, current_absence.reason),
            'duration', p_duration,
            'time_range', p_time_range,
            'updated_at', NOW()
        )
    ) INTO result;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to update absence'
        );
END;
$$;

-- Object 79/188
CREATE FUNCTION public.finalize_lesson_substitutions(p_lesson_id uuid, p_user_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_sub RECORD;
  v_lesson RECORD;
  v_conflict_lesson_id uuid;
  v_absent_teacher_id uuid;
  v_substitute_staff_id uuid;
  v_now timestamp := now();
BEGIN
  -- 1. Load the lesson
  SELECT * INTO v_lesson FROM course_lessons WHERE id = p_lesson_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson with id % not found', p_lesson_id::text;
  END IF;

  -- 2. Loop through all non-confirmed substitutions for this lesson
  FOR v_sub IN
    SELECT * FROM substitutions WHERE original_lesson_id = p_lesson_id AND status <> 'confirmed'
  LOOP
    -- 3. Validate no conflicting lesson/substitution for each absent teacher (on another lesson at same time)
    IF v_sub.absent_teacher_ids IS NOT NULL THEN
      FOREACH v_absent_teacher_id IN ARRAY v_sub.absent_teacher_ids LOOP
        SELECT cl.id INTO v_conflict_lesson_id
        FROM course_lessons cl
        LEFT JOIN substitutions s ON s.original_lesson_id = cl.id AND s.status = 'confirmed'
        WHERE cl.id <> v_lesson.id
          AND cl.start_datetime = v_lesson.start_datetime
          AND cl.period_id = v_lesson.period_id
          AND (v_absent_teacher_id = ANY(cl.teacher_ids))
          AND cl.is_cancelled = false
          AND (
            (s.id IS NULL) OR (s.absent_teacher_ids IS NULL) OR NOT (v_absent_teacher_id = ANY(s.absent_teacher_ids))
          )
        LIMIT 1;
        IF v_conflict_lesson_id IS NOT NULL THEN
          RAISE EXCEPTION 'Absent teacher % already has a lesson or substitution at this time (this lesson_id: %, teacher_id: %)', v_absent_teacher_id::text, v_lesson.id::text, v_absent_teacher_id::text;
        END IF;
      END LOOP;
    END IF;

    -- 4. Validate no conflicting lesson/substitution for the substitute (on another lesson at same time)
    v_substitute_staff_id := v_sub.substitute_staff_id;
    IF v_substitute_staff_id IS NOT NULL THEN
      SELECT cl.id INTO v_conflict_lesson_id
      FROM course_lessons cl
      LEFT JOIN substitutions s ON s.original_lesson_id = cl.id AND s.status = 'confirmed'
      WHERE cl.id <> v_lesson.id
        AND cl.start_datetime = v_lesson.start_datetime
        AND cl.period_id = v_lesson.period_id
        AND (v_substitute_staff_id = ANY(cl.teacher_ids)
          OR (s.substitute_staff_id = v_substitute_staff_id AND s.status = 'confirmed'))
        AND cl.is_cancelled = false
      LIMIT 1;
      IF v_conflict_lesson_id IS NOT NULL THEN
        RAISE EXCEPTION 'Substitute staff member % already has a lesson or substitution at this time (this lesson_id: %, staff_id: %)', v_substitute_staff_id::text, v_lesson.id::text, v_substitute_staff_id::text;
      END IF;
    END IF;

    -- 5. Update status to 'confirmed' and notes if provided
    UPDATE substitutions
    SET
      status = 'confirmed',
      created_at = v_now,
      notes = COALESCE(p_notes, notes)
    WHERE id = v_sub.id;

    -- 6. Log to change_log
    INSERT INTO change_log (
      user_id,
      table_name,
      record_id,
      action_type,
      before_data,
      after_data,
      created_at
    ) VALUES (
      COALESCE(p_user_id, v_sub.created_by),
      'substitutions',
      v_sub.id,
      'update',
      to_jsonb(v_sub),
      to_jsonb((SELECT row_to_json(t) FROM substitutions t WHERE t.id = v_sub.id)),
      v_now
    );
  END LOOP;
END;
$$;

-- Object 80/188
CREATE FUNCTION public.generate_random_code() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(6) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- Object 81/188
CREATE FUNCTION public.generate_user_code(p_profile_id uuid, p_code_instance integer DEFAULT 1, p_created_by uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 100;
    existing_code_id UUID;
    result JSON;
BEGIN
    -- Check if user profile exists
    IF NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = p_profile_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User profile not found',
            'code', null
        );
    END IF;

    -- Check if a code already exists for this profile and instance (not expired)
    SELECT id INTO existing_code_id
    FROM user_codes
    WHERE user_codes.profile_id = p_profile_id
    AND user_codes.code_instance = p_code_instance
    AND used_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > NOW();

    IF existing_code_id IS NOT NULL THEN
        -- Return existing code
        SELECT code INTO new_code
        FROM user_codes
        WHERE id = existing_code_id;

        RETURN json_build_object(
            'success', true,
            'error', null,
            'code', new_code,
            'is_new', false,
            'user_code_id', existing_code_id
        );
    END IF;

    -- Generate unique code (retry if collision occurs)
    LOOP
        new_code := generate_random_code();
        attempt_count := attempt_count + 1;

        -- Check if code already exists (not expired)
        SELECT EXISTS(
            SELECT 1 FROM user_codes
            WHERE code = new_code
            AND used_at IS NULL
            AND revoked_at IS NULL
            AND expires_at > NOW()
        ) INTO code_exists;

        -- Exit loop if code is unique or max attempts reached
        IF NOT code_exists OR attempt_count >= max_attempts THEN
            EXIT;
        END IF;
    END LOOP;

    -- If we couldn't generate a unique code after max attempts
    IF code_exists AND attempt_count >= max_attempts THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unable to generate unique code',
            'code', null
        );
    END IF;

    -- Insert the new code
    INSERT INTO user_codes (profile_id, code, code_instance, created_by, notes)
    VALUES (p_profile_id, new_code, p_code_instance, p_created_by, p_notes)
    RETURNING id INTO existing_code_id;

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'error', null,
        'code', new_code,
        'is_new', true,
        'user_code_id', existing_code_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'code', null
        );
END;
$$;

-- Object 82/188
CREATE FUNCTION public.get_all_policies() RETURNS TABLE(schemaname text, tablename text, policyname text, permissive text, roles text[], cmd text, qual text, with_check text)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT 
    p.schemaname::text,
    p.tablename::text,
    p.policyname::text,
    p.permissive::text,
    p.roles,
    p.cmd::text,
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename::text, p.policyname::text;
$$;

-- Object 83/188
CREATE FUNCTION public.get_bucket_privacy_summary() RETURNS json
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT json_build_object(
        'total_buckets', COUNT(*),
        'correct_buckets', COUNT(*) FILTER (WHERE matches = TRUE),
        'incorrect_buckets', COUNT(*) FILTER (WHERE matches = FALSE),
        'configuration_score', ROUND(
            (COUNT(*) FILTER (WHERE matches = TRUE)::DECIMAL / COUNT(*)) * 100, 0
        ),
        'needs_attention', COUNT(*) FILTER (WHERE matches = FALSE) > 0,
        'summary', CASE 
            WHEN COUNT(*) FILTER (WHERE matches = FALSE) = 0 THEN 'All bucket privacy settings are correct'
            ELSE COUNT(*) FILTER (WHERE matches = FALSE)::TEXT || ' buckets have incorrect privacy settings'
        END
    )
    FROM public.check_bucket_privacy_settings();
$$;

-- Object 84/188
CREATE FUNCTION public.get_current_user_children() RETURNS TABLE(child_id uuid)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN NULL::uuid
    ELSE fmcl.child_profile_id
  END
  FROM family_member_child_links fmcl
  WHERE auth.uid() IS NOT NULL 
  AND fmcl.adult_profile_id = auth.uid()
  AND fmcl.access_restricted = false;
$$;

-- Object 85/188
CREATE FUNCTION public.get_current_user_family_ids() RETURNS TABLE(family_id uuid)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT DISTINCT fmcl.family_id
  FROM family_member_child_links fmcl
  WHERE auth.uid() IS NOT NULL 
  AND fmcl.adult_profile_id = auth.uid()
  AND fmcl.access_restricted = false;
$$;

-- Object 86/188
CREATE FUNCTION public.get_or_create_family(p_parent_profile_id uuid, p_student_profile_id uuid, p_school_id uuid, p_family_name text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_family_id UUID;
  v_family_code TEXT;
  v_code_exists BOOLEAN;
  v_attempt_count INTEGER := 0;
  v_max_attempts INTEGER := 100;
  v_result JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- First, try to get existing family_id from family_members
    SELECT family_id INTO v_family_id
    FROM family_members
    WHERE profile_id = p_student_profile_id
    AND role = 'student'
    LIMIT 1;

    -- If family_id found, return it
    IF v_family_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', TRUE,
        'family_id', v_family_id,
        'is_new', FALSE,
        'from', 'student',
        'message', 'Existing family found'
      );
    END IF;

    -- First, try to get existing family_id from family_members
    IF p_parent_profile_id IS NOT NULL THEN
      SELECT family_id INTO v_family_id
      FROM family_members
      WHERE profile_id = p_parent_profile_id
      AND role = 'parent'
      LIMIT 1;

      -- If family_id found, return it
      IF v_family_id IS NOT NULL THEN
        RETURN jsonb_build_object(
          'success', TRUE,
          'family_id', v_family_id,
          'is_new', FALSE,
          'from', 'parent',
          'message', 'Existing family found'
        );
      END IF;
    END IF;

    -- No existing family found, create new family
    -- Generate unique family code in format "DE" + 6 random digits
    LOOP
      v_family_code := 'DE' || lpad(floor(random() * 1000000)::text, 6, '0');
      v_attempt_count := v_attempt_count + 1;

      -- Check if family code already exists
      SELECT EXISTS(
        SELECT 1 FROM families
        WHERE family_code = v_family_code
      ) INTO v_code_exists;

      -- Exit loop if code is unique or max attempts reached
      IF NOT v_code_exists OR v_attempt_count >= v_max_attempts THEN
        EXIT;
      END IF;
    END LOOP;

    -- If we couldn't generate a unique code after max attempts
    IF v_code_exists AND v_attempt_count >= v_max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique family code';
    END IF;

    -- Create new family
    INSERT INTO families (school_id, family_code, family_name)
    VALUES (p_school_id, v_family_code, p_family_name)
    RETURNING id INTO v_family_id;

    -- Create family_members record for student
    INSERT INTO family_members (
      family_id,
      profile_id,
      role,
      is_primary_guardian,
      is_primary_contact,
      notes
    )
    VALUES (
      v_family_id,
      p_student_profile_id,
      'student',
      FALSE,
      FALSE,
      'Added on parent first login'
    );

    -- Create profile_info_family_member record for student
    INSERT INTO profile_info_family_member (
      profile_id,
      school_id,
      can_log_in,
      is_primary_guardian
    )
    VALUES (
      p_student_profile_id,
      p_school_id,
      FALSE,
      FALSE
    )
    ON CONFLICT (profile_id) DO NOTHING;

    IF p_parent_profile_id IS NOT NULL THEN
      -- Create family_members record for parent
      INSERT INTO family_members (
        family_id,
        profile_id,
        role,
        is_primary_guardian,
        is_primary_contact,
        notes
      )
      VALUES (
        v_family_id,
        p_parent_profile_id,
        'parent',
        TRUE,
        TRUE,
        'Added on parent first login'
      );

      -- Create profile_info_family_member record for parent
      INSERT INTO profile_info_family_member (
        profile_id,
        school_id,
        can_log_in,
        is_primary_guardian
      )
      VALUES (
        p_parent_profile_id,
        p_school_id,
        TRUE,
        TRUE
      )
      ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    -- Prepare result
    v_result := jsonb_build_object(
      'success', TRUE,
      'family_id', v_family_id,
      'family_code', v_family_code,
      'is_new', TRUE,
      'message', 'New family created successfully'
    );

    -- Commit transaction
    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on any error
      RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
  END;
END;
$$;

-- Object 87/188
CREATE FUNCTION public.get_or_generate_user_code(profile_id uuid, code_instance integer DEFAULT 1) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    existing_code VARCHAR(6);
    new_code VARCHAR(6);
    code_exists BOOLEAN;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 100;
    result JSON;
BEGIN
    -- Check if user profile exists
    IF NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = profile_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User profile not found',
            'code', null
        );
    END IF;

    -- Check if there's an existing unused code for this profile and instance (not expired)
    SELECT code INTO existing_code
    FROM user_codes
    WHERE user_codes.profile_id = get_or_generate_user_code.profile_id
    AND user_codes.code_instance = get_or_generate_user_code.code_instance
    AND used_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    -- If existing code found, return it
    IF existing_code IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'error', null,
            'code', existing_code
        );
    END IF;

    -- Generate unique code (retry if collision occurs)
    LOOP
        new_code := generate_random_code();
        attempt_count := attempt_count + 1;

        -- Check if code already exists (not expired)
        SELECT EXISTS(
            SELECT 1 FROM user_codes
            WHERE code = new_code
            AND used_at IS NULL
            AND revoked_at IS NULL
            AND expires_at > NOW()
        ) INTO code_exists;

        -- Exit loop if code is unique or max attempts reached
        IF NOT code_exists OR attempt_count >= max_attempts THEN
            EXIT;
        END IF;
    END LOOP;

    -- If we couldn't generate a unique code after max attempts
    IF code_exists AND attempt_count >= max_attempts THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unable to generate unique code',
            'code', null
        );
    END IF;

    -- Insert the new code
    INSERT INTO user_codes (profile_id, code, code_instance)
    VALUES (profile_id, new_code, code_instance);

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'error', null,
        'code', new_code
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'code', null
        );
END;
$$;

-- Object 88/188
CREATE FUNCTION public.get_random_class_color() RETURNS text
    LANGUAGE sql
    AS $$
  SELECT color FROM unnest(ARRAY[
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
    '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9ff',
    '#ffb3ba', '#bae1ff', '#baffc9', '#ffdfba', '#cbaacb',
    '#ff9cee', '#ffffb5', '#c2f0c2', '#d9b3ff', '#f4cccc',
    '#ff6961', '#77dd77', '#fdfd96', '#84b6f4', '#fdcae1',
    '#40e0d0', '#ffb347', '#d2691e', '#dda0dd', '#00ced1',
    '#f0e68c', '#98fb98', '#ffa07a', '#afeeee', '#ffdab9',
    '#ff7f50', '#da70d6', '#ff69b4', '#cd5c5c', '#ffd700'
  ]) AS color
  OFFSET floor(random() * 50);
$$;

-- Object 89/188
CREATE FUNCTION public.get_role_protection_summary() RETURNS TABLE(role_id uuid, role_name text, is_subrole boolean, protection_level text, protection_reason text, usage_count integer, can_delete boolean, last_used timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.is_subrole,
        COALESCE(pr.protection_level, 'NONE') as protection_level,
        pr.protection_reason,
        COALESCE(usage.total_usage, 0) as usage_count,
        CASE 
            WHEN pr.protection_level = 'CRITICAL' THEN false
            WHEN COALESCE(usage.total_usage, 0) > 0 THEN false
            WHEN pr.protection_level = 'IMPORTANT' THEN 
                EXISTS (
                    SELECT 1 FROM user_profiles up
                    JOIN roles admin_r ON up.role_id = admin_r.id
                    WHERE up.id = auth.uid()::uuid
                    AND admin_r.name = 'Admin'
                )
            ELSE true
        END as can_delete,
        (
            SELECT MAX(GREATEST(up.created_at, ur.created_at))
            FROM user_profiles up
            LEFT JOIN user_roles ur ON ur.user_profile_id = up.id
            WHERE up.role_id = r.id OR ur.role_id = r.id
        ) as last_used
    FROM roles r
    LEFT JOIN protected_roles pr ON r.id = pr.role_id
    LEFT JOIN LATERAL get_role_usage_count(r.id) usage ON true
    ORDER BY 
        CASE 
            WHEN pr.protection_level = 'CRITICAL' THEN 1
            WHEN pr.protection_level = 'IMPORTANT' THEN 2
            ELSE 3
        END,
        r.is_subrole,
        r.name;
END;
$$;

-- Object 90/188
CREATE FUNCTION public.get_role_usage_count(p_role_id uuid) RETURNS TABLE(user_profiles_count integer, user_roles_count integer, total_usage integer, is_in_use boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::integer FROM user_profiles WHERE role_id = p_role_id) as user_profiles_count,
        (SELECT COUNT(*)::integer FROM user_roles WHERE role_id = p_role_id) as user_roles_count,
        (
            (SELECT COUNT(*)::integer FROM user_profiles WHERE role_id = p_role_id) +
            (SELECT COUNT(*)::integer FROM user_roles WHERE role_id = p_role_id)
        ) as total_usage,
        (
            (SELECT COUNT(*) FROM user_profiles WHERE role_id = p_role_id) +
            (SELECT COUNT(*) FROM user_roles WHERE role_id = p_role_id)
        ) > 0 as is_in_use;
END;
$$;

-- Object 91/188
CREATE FUNCTION public.get_storage_rls_policies() RETURNS TABLE(schema_name text, table_name text, policy_name text, policy_command text, policy_roles text[], policy_using text, policy_with_check text, is_permissive boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        policyname::TEXT,
        cmd::TEXT,
        roles::TEXT[],
        qual::TEXT,
        with_check::TEXT,
        permissive::BOOLEAN
    FROM pg_policies 
    WHERE schemaname = 'storage'
    ORDER BY tablename, policyname;
$$;

-- Object 92/188
CREATE FUNCTION public.get_student_interview_submission(p_student_id uuid, p_registration_period_id uuid) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(
           interview_raw,                       -- preferred
           payload->'interview',                -- fallback if older rows
           payload->'ui',                       -- older schema we used before
           payload                              -- absolute fallback
         )
  FROM public.student_course_wish_submissions
  WHERE student_id = p_student_id
    AND registration_period_id = p_registration_period_id
  LIMIT 1;
$$;

-- Object 93/188
CREATE FUNCTION public.get_table_policies(table_name text) RETURNS TABLE(schemaname text, tablename text, policyname text, permissive text, roles text[], cmd text, qual text, with_check text)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT 
    p.schemaname::text,
    p.tablename::text,
    p.policyname::text,
    p.permissive::text,
    p.roles,
    p.cmd::text,
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.schemaname = 'public' 
    AND p.tablename = table_name
  ORDER BY p.policyname::text;
$$;

-- Object 94/188
CREATE FUNCTION public.get_tables_with_policies() RETURNS TABLE(tablename text)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT DISTINCT p.tablename::text
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename::text;
$$;

-- Object 95/188
CREATE FUNCTION public.get_unresolved_problems(p_school_id text, p_registration_period_id text, p_semester_id text, p_day_of_week integer) RETURNS TABLE(note_id uuid, course_id text, course_name text, text text, author text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cn.id as note_id,
    cn.course_id,
    COALESCE(c.name, 'Unknown Course') as course_name,
    cn.text,
    cn.author,
    cn.created_at
  FROM course_notes cn
  LEFT JOIN w_registration_period_courses_by_day c ON cn.course_id = c.id
  WHERE cn.school_id = p_school_id
    AND cn.registration_period_id = p_registration_period_id
    AND cn.semester_id = p_semester_id
    AND cn.day_of_week = p_day_of_week
    AND cn.is_problem = true
    AND cn.is_resolved = false
  ORDER BY cn.created_at DESC;
END;
$$;

-- Object 96/188
CREATE FUNCTION public.get_user_children_optimized(user_id uuid DEFAULT auth.uid()) RETURNS uuid[]
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  -- Early return if no user
  IF user_id IS NULL THEN
    RETURN ARRAY[]::uuid[];
  END IF;
  
  -- Return array of child IDs directly
  RETURN ARRAY(
    SELECT fmcl.child_profile_id
    FROM family_member_child_links fmcl
    WHERE fmcl.adult_profile_id = user_id
    AND fmcl.access_restricted = false
  );
END;
$$;

-- Object 97/188
CREATE FUNCTION public.get_user_family_ids() RETURNS uuid[]
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT auth.get_user_family_ids();
$$;

-- Object 98/188
CREATE FUNCTION public.get_user_family_ids_optimized(user_id uuid DEFAULT auth.uid()) RETURNS uuid[]
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN ARRAY[]::uuid[];
  END IF;
  
  RETURN ARRAY(
    SELECT DISTINCT fmcl.family_id
    FROM family_member_child_links fmcl
    WHERE fmcl.adult_profile_id = user_id
    AND fmcl.access_restricted = false
  );
END;
$$;

-- Object 99/188
CREATE FUNCTION public.get_user_profile_by_code(input_code character varying) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    profile_id UUID;
    code_created_at TIMESTAMP WITH TIME ZONE;
    code_used_at TIMESTAMP WITH TIME ZONE;
    code_instance INTEGER;
    code_attempts INTEGER;
    first_name TEXT;
    last_name TEXT;
    school_id UUID;
    date_of_birth DATE;
    role_name TEXT;
BEGIN
    -- Get code details with user profile information and role
    SELECT uc.profile_id, uc.created_at, uc.used_at, uc.code_instance, uc.code_attempts,
           up.first_name, up.last_name, up.school_id, up.date_of_birth,
           r.name
    INTO profile_id, code_created_at, code_used_at, code_instance,
         code_attempts, first_name, last_name, school_id, date_of_birth, role_name
    FROM user_codes uc
    JOIN user_profiles up ON uc.profile_id = up.id
    LEFT JOIN user_roles ur ON up.id = ur.user_profile_id
    LEFT JOIN roles r ON ur.role_id = r.id AND r.is_subrole = false
    WHERE uc.code = input_code
    AND uc.used_at IS NULL
    AND uc.revoked_at IS NULL
    AND uc.expires_at > NOW();

    -- Check if code exists
    IF profile_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Code not found, expired, revoked, or already used',
            'data', json_build_object(
              'profile_id', null,
              'code_attempts', null,
              'first_name', null,
              'last_name', null,
              'school_id', null,
              'date_of_birth', null,
              'code_instance', null,
              'role_name', null
            )
        );
    END IF;

    -- Return success response with code status
    RETURN json_build_object(
        'success', true,
        'error', null,
        'data', json_build_object(
          'profile_id', profile_id,
          'code_attempts', code_attempts,
          'first_name', first_name,
          'last_name', last_name,
          'school_id', school_id,
          'date_of_birth', date_of_birth,
          'code_instance', code_instance,
          'code_created_at', code_created_at,
          'role_name', role_name
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'data', json_build_object(
              'profile_id', null,
              'code_attempts', null,
              'first_name', null,
              'last_name', null,
              'school_id', null,
              'date_of_birth', null,
              'code_instance', null,
              'role_name', null
            )
        );
END;
$$;

-- Object 100/188
CREATE FUNCTION public.get_user_school_id() RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
    v_profile_id uuid;
    v_school_id uuid;
BEGIN
    -- Extract profile_id from auth metadata
    SELECT (auth.jwt() -> 'user_metadata' ->> 'profile_id')::uuid 
    INTO v_profile_id;
    
    -- If no profile_id in metadata, return null
    IF v_profile_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Look up school_id using the profile_id
    SELECT school_id 
    INTO v_school_id
    FROM user_profiles 
    WHERE id = v_profile_id;
    
    RETURN v_school_id;
END;
$$;

-- Object 101/188
CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Object 102/188
CREATE FUNCTION public.import_selected_holidays_to_calendar(school_id uuid, selected_ids uuid[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  insert into schedule_calendar_exceptions (
    id,
    school_id,
    date,
    end_date,
    type,
    notes,
    source,
    is_official
  )
  select
    gen_random_uuid(),
    school_id,
    phb.start_date,
    phb.end_date,
    case
      when phb.type = 'ferientag' then 'holiday'
      when phb.type = 'feiertag' then 'school_closed'
      when phb.type = 'unterrichtsfrei' then 'no_courses'
      else null
    end,
    phb.name,
    phb.source,
    coalesce(phb.is_official, true)
  from public_holiday_and_breaks phb
  where phb.id = any (selected_ids);
end;
$$;

-- Object 103/188
CREATE FUNCTION public.ingest_interview_everything(p_student_id uuid, p_registration_period_id uuid, p_payload jsonb, p_submitted_by uuid DEFAULT NULL::uuid, p_debug boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_now                  timestamptz := now();
  v_school_id            uuid;
  v_period_school_id     uuid;
  v_semester_id          uuid;
  v_status               text;
  v_opened_at            timestamptz;
  v_closed_at            timestamptz;

  v_submission_id        uuid;
  v_student_grade        integer;

  v_apps_upserted        integer := 0;
  v_apps_deleted         integer := 0;

  v_profiles_created     integer := 0;
  v_members_added        integer := 0;
  v_links_inserted       integer := 0;
  v_links_deleted        integer := 0;
  v_links_updated        integer := 0;
  v_siblings_processed   integer := 0;
  v_pickup_rules_applied boolean := false;

  v_family_id            uuid;
  v_primary_contact_id   uuid;

  v_choice               jsonb;
  v_day                  smallint;
  v_rank                 smallint;
  v_window_id            uuid;

  v_contact              jsonb;
  v_contact_type         text;
  v_existing_profile_id  uuid;
  v_local_first          text;
  v_local_last           text;
  v_local_phone          text;
  v_local_email          text;
  v_relation_label       text;

  v_new_profile_id       uuid;
  v_tmp_count            integer;

  v_submitted_by         uuid;

  v_payload_choices_count int := 0;
  v_payload_nooffers_count int := 0;
  v_rows_choices_after     int := 0;
  v_rows_nooffers_after    int := 0;

  v_initial_payload_keys text[];
BEGIN
  -- Local debug helper
  IF p_debug THEN
    INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
    VALUES (p_student_id, p_registration_period_id, 'begin', 'payload received', p_payload);
    RAISE NOTICE '[ingest] begin payload: %', p_payload;
  END IF;

  -- Serialize per student to avoid racing writes
  PERFORM pg_advisory_xact_lock(hashtext(p_student_id::text));

  -- Resolve student's school
  SELECT up.school_id
  INTO v_school_id
  FROM public.user_profiles up
  WHERE up.id = p_student_id;
  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'Student % not found', p_student_id USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- Registration period validation (allow open or scheduled, time-gated)
  SELECT rp.school_id, rp.semester_id, rp.status, rp.opened_at, rp.closed_at
  INTO v_period_school_id, v_semester_id, v_status, v_opened_at, v_closed_at
  FROM public.registration_periods rp
  WHERE rp.id = p_registration_period_id;

  IF v_semester_id IS NULL THEN
    RAISE EXCEPTION 'Registration period % not found', p_registration_period_id;
  END IF;
  IF v_period_school_id <> v_school_id THEN
    RAISE EXCEPTION 'Registration period % belongs to a different school', p_registration_period_id;
  END IF;
  IF v_now < v_opened_at OR v_now > v_closed_at OR lower(COALESCE(v_status,'')) NOT IN ('open','scheduled') THEN
    RAISE EXCEPTION 'Registration period is not open (status: %, window: %..%)', v_status, v_opened_at, v_closed_at;
  END IF;

  -- submitted_by guard (auto-nullify invalid)
  v_submitted_by := p_submitted_by;
  IF v_submitted_by IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = v_submitted_by
  ) THEN
    IF p_debug THEN
      INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
      VALUES (p_student_id, p_registration_period_id, 'guard', 'submitted_by not found -> NULL', jsonb_build_object('submitted_by', v_submitted_by));
      RAISE NOTICE '[ingest] submitted_by % not found -> NULL', v_submitted_by;
    END IF;
    v_submitted_by := NULL;
  END IF;

  -- Determine student's grade via class
  SELECT c.grade_level
  INTO v_student_grade
  FROM public.profile_info_student pis
  JOIN public.structure_classes c ON c.id = pis.class_id
  WHERE pis.profile_id = p_student_id;

  -- Family for authorized contacts
  SELECT fmcl.family_id
  INTO v_family_id
  FROM public.family_member_child_links fmcl
  WHERE fmcl.child_profile_id = p_student_id
  LIMIT 1;
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Student % is not linked to a family; cannot manage authorized contacts', p_student_id;
  END IF;

  v_primary_contact_id := NULLIF(p_payload->>'primary_contact_profile_id', '')::uuid;

  -- Quick payload stats
  SELECT array_agg(key) INTO v_initial_payload_keys
  FROM jsonb_object_keys(p_payload) AS key;
  v_payload_choices_count := COALESCE(jsonb_array_length(p_payload->'choices'),0);
  v_payload_nooffers_count := COALESCE(jsonb_array_length(p_payload->'no_offers'),0);

  IF p_debug THEN
    INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
    VALUES (p_student_id, p_registration_period_id, 'payload.stats', 'keys + counts',
            jsonb_build_object('keys', v_initial_payload_keys, 'choices_len', v_payload_choices_count, 'no_offers_len', v_payload_nooffers_count));
    RAISE NOTICE '[ingest] payload keys: %, choices=% no_offers=%', v_initial_payload_keys, v_payload_choices_count, v_payload_nooffers_count;
  END IF;

  -- 1) Submission header
  INSERT INTO public.student_course_wish_submissions (
    student_id, school_id, registration_period_id, semester_id,
    submitted_at, submitted_by, payload, over_limit_total, over_limit_per_day
  )
  VALUES (
    p_student_id, v_school_id, p_registration_period_id, v_semester_id,
    v_now, v_submitted_by, p_payload, false, false
  )
  ON CONFLICT (student_id, registration_period_id)
  DO UPDATE SET
    semester_id = EXCLUDED.semester_id,
    submitted_at = EXCLUDED.submitted_at,
    submitted_by = EXCLUDED.submitted_by,
    payload = EXCLUDED.payload,
    over_limit_total = EXCLUDED.over_limit_total,
    over_limit_per_day = EXCLUDED.over_limit_per_day
  RETURNING id INTO v_submission_id;

  IF p_debug THEN
    INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
    VALUES (p_student_id, p_registration_period_id, 'submission', 'upserted submission', jsonb_build_object('submission_id', v_submission_id));
  END IF;

  -- 2) Replace normalized choices
  DELETE FROM public.student_course_wish_choices WHERE submission_id = v_submission_id;

  -- insert "no offer"
  IF (p_payload ? 'no_offers') THEN
    INSERT INTO public.student_course_wish_choices (submission_id, day_of_week, rank, window_id, no_offer)
    SELECT v_submission_id, (elem)::smallint, 0, NULL::uuid, true
    FROM jsonb_array_elements_text(p_payload->'no_offers') AS t(elem)
    WHERE (elem)::int BETWEEN 1 AND 5;
  END IF;

  -- ranked choices
  FOR v_choice IN
    SELECT c FROM jsonb_array_elements(COALESCE(p_payload->'choices','[]'::jsonb)) AS t(c)
  LOOP
    v_day := NULLIF((v_choice->>'day_of_week'), '')::smallint;
    v_rank := NULLIF((v_choice->>'rank'), '')::smallint;
    v_window_id := NULLIF(v_choice->>'window_id','')::uuid;

    IF v_day IS NULL OR v_rank IS NULL OR v_window_id IS NULL THEN
      RAISE EXCEPTION 'Invalid choice payload element: %', v_choice;
    END IF;
    IF v_day < 1 OR v_day > 5 OR v_rank < 1 OR v_rank > 10 THEN
      RAISE EXCEPTION 'Invalid day/rank in choice: %', v_choice;
    END IF;

    PERFORM 1
    FROM public.course_registration_windows w
    WHERE w.id = v_window_id
      AND w.school_id = v_school_id
      AND w.registration_period_id = p_registration_period_id
      AND (w.grade_levels IS NULL OR v_student_grade IS NULL OR v_student_grade = ANY (w.grade_levels));
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Window % invalid for student %', v_window_id, p_student_id;
    END IF;

    INSERT INTO public.student_course_wish_choices (submission_id, day_of_week, rank, window_id, no_offer)
    VALUES (v_submission_id, v_day, v_rank, v_window_id, false);
  END LOOP;

  -- rows after insert
  SELECT
    COALESCE(SUM(CASE WHEN no_offer=false THEN 1 ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN no_offer=true THEN 1 ELSE 0 END),0)
  INTO v_rows_choices_after, v_rows_nooffers_after
  FROM public.student_course_wish_choices
  WHERE submission_id = v_submission_id;

  IF p_debug THEN
    INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
    VALUES (p_student_id, p_registration_period_id, 'choices', 'rows after insert',
            jsonb_build_object('choices_rows', v_rows_choices_after, 'no_offer_rows', v_rows_nooffers_after));
    RAISE NOTICE '[ingest] choices rows=% no_offer rows=%', v_rows_choices_after, v_rows_nooffers_after;
  END IF;

  -- 3) Sync course_applications
  WITH current_choices AS (
    SELECT day_of_week, rank, window_id
    FROM public.student_course_wish_choices
    WHERE submission_id = v_submission_id AND no_offer = false
  ),
  choice_windows AS (
    SELECT cc.day_of_week, cc.rank, cc.window_id, w.course_id
    FROM current_choices cc
    JOIN public.course_registration_windows w ON w.id = cc.window_id
  ),
  upserted AS (
    INSERT INTO public.course_applications (
      student_id, school_id, course_id, window_id,
      registration_period_id, semester_id,
      day_of_week, rank, status, source, applied_at, created_by
    )
    SELECT
      p_student_id, v_school_id, cw.course_id, cw.window_id,
      p_registration_period_id, v_semester_id,
      cw.day_of_week, cw.rank, 'pending', 'interview', v_now, v_submitted_by
    FROM choice_windows cw
    ON CONFLICT (student_id, registration_period_id, window_id)
    WHERE (window_id IS NOT NULL)
    DO UPDATE SET
      day_of_week = EXCLUDED.day_of_week,
      rank = EXCLUDED.rank,
      status = 'pending',
      source = 'interview',
      applied_at = EXCLUDED.applied_at,
      created_by = EXCLUDED.created_by
    RETURNING id
  )
  SELECT COUNT(*)::int INTO v_apps_upserted FROM upserted;

  WITH del AS (
    DELETE FROM public.course_applications ca
    WHERE ca.student_id = p_student_id
      AND ca.registration_period_id = p_registration_period_id
      AND ca.source = 'interview'
      AND ca.window_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.student_course_wish_choices c
        WHERE c.submission_id = v_submission_id
          AND c.no_offer = false
          AND c.window_id = ca.window_id
      )
    RETURNING 1
  )
  SELECT COUNT(*)::int INTO v_apps_deleted FROM del;

  IF p_debug THEN
    INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
    VALUES (p_student_id, p_registration_period_id, 'applications', 'upsert/delete counts',
            jsonb_build_object('apps_upserted', v_apps_upserted, 'apps_deleted', v_apps_deleted));
    RAISE NOTICE '[ingest] apps upserted=% deleted=%', v_apps_upserted, v_apps_deleted;
  END IF;

  -- 4) Pickup rules (best-effort)
  IF (p_payload ? 'pickup_rules') THEN
    BEGIN
      PERFORM public.create_standard_pickup_rules_from_json(
        p_student_id, v_semester_id, p_payload->'pickup_rules', v_submitted_by
      );
      v_pickup_rules_applied := true;
      IF p_debug THEN
        INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
        VALUES (p_student_id, p_registration_period_id, 'pickup_rules', 'applied', p_payload->'pickup_rules');
      END IF;
    EXCEPTION WHEN undefined_function THEN
      IF p_debug THEN
        INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
        VALUES (p_student_id, p_registration_period_id, 'pickup_rules', 'helper missing', NULL);
      END IF;
    END;
  ELSE
    IF p_debug THEN
      INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
      VALUES (p_student_id, p_registration_period_id, 'pickup_rules', 'not provided', NULL);
    END IF;
  END IF;

  -- 5) Authorized contacts (replace mode)
  IF (p_payload ? 'authorized_contacts') THEN
    FOR v_contact IN
      SELECT c FROM jsonb_array_elements(p_payload->'authorized_contacts') AS t(c)
    LOOP
      v_contact_type := lower(COALESCE(v_contact->>'type', 'existing'));

      IF v_contact_type = 'existing' THEN
        v_existing_profile_id := NULLIF(v_contact->>'profile_id', '')::uuid;
        v_relation_label := NULLIF(v_contact->>'relation_label', '');
        IF v_existing_profile_id IS NULL THEN
          RAISE EXCEPTION 'Existing contact missing profile_id: %', v_contact;
        END IF;

        INSERT INTO public.family_members (family_id, profile_id, role, relation_description)
        VALUES (v_family_id, v_existing_profile_id, 'parent', v_relation_label)
        ON CONFLICT (family_id, profile_id) DO UPDATE
          SET relation_description = COALESCE(EXCLUDED.relation_description, public.family_members.relation_description);
        v_members_added := v_members_added + 1;

      ELSIF v_contact_type = 'local' THEN
        v_local_first := COALESCE(NULLIF(v_contact->>'first_name', ''), '(Unbenannt)');
        v_local_last  := COALESCE(NULLIF(v_contact->>'last_name', ''), '(Kontakt)');
        v_relation_label := NULLIF(v_contact->>'relation_label', '');
        v_local_phone := NULLIF(v_contact->>'phone', '');
        v_local_email := NULLIF(v_contact->>'email', '');

        INSERT INTO public.user_profiles (school_id, first_name, last_name, account_status)
        VALUES (v_school_id, v_local_first, v_local_last, 'none')
        RETURNING id INTO v_new_profile_id;
        v_profiles_created := v_profiles_created + 1;

        BEGIN
          INSERT INTO public.profile_info_family_member (profile_id)
          VALUES (v_new_profile_id)
          ON CONFLICT (profile_id) DO NOTHING;
        EXCEPTION WHEN undefined_table THEN
          NULL;
        END;

        INSERT INTO public.family_members (family_id, profile_id, role, relation_description)
        VALUES (v_family_id, v_new_profile_id, 'parent', v_relation_label)
        ON CONFLICT (family_id, profile_id) DO NOTHING;

      ELSIF v_contact_type = 'sibling' THEN
        v_existing_profile_id := NULLIF(v_contact->>'student_id', '')::uuid;
        IF v_existing_profile_id IS NULL THEN
          RAISE EXCEPTION 'Sibling contact missing student_id: %', v_contact;
        END IF;
        BEGIN
          PERFORM public.set_sibling_pickup_authorization(
            p_student_id, v_existing_profile_id, true, v_submitted_by
          );
          v_siblings_processed := v_siblings_processed + 1;
        EXCEPTION WHEN undefined_function THEN
          NULL;
        END;
      ELSE
        RAISE EXCEPTION 'Unknown authorized_contacts.type: %', v_contact_type;
      END IF;
    END LOOP;

    -- Desired adult set
    CREATE TEMP TABLE tmp_desired_adults (adult_profile_id uuid PRIMARY KEY) ON COMMIT DROP;

    INSERT INTO tmp_desired_adults (adult_profile_id)
    SELECT DISTINCT NULLIF(c->>'profile_id','')::uuid
    FROM jsonb_array_elements(p_payload->'authorized_contacts') AS t(c)
    WHERE lower(COALESCE(c->>'type','existing')) = 'existing' AND c ? 'profile_id';

    INSERT INTO tmp_desired_adults (adult_profile_id)
    SELECT fm.profile_id
    FROM public.family_members fm
    WHERE fm.family_id = v_family_id
      AND fm.role = 'parent'
      AND NOT EXISTS (SELECT 1 FROM tmp_desired_adults d WHERE d.adult_profile_id = fm.profile_id);

    -- Replace links not in desired set
    WITH del AS (
      DELETE FROM public.family_member_child_links l
      WHERE l.family_id = v_family_id
        AND l.child_profile_id = p_student_id
        AND NOT EXISTS (SELECT 1 FROM tmp_desired_adults d WHERE d.adult_profile_id = l.adult_profile_id)
      RETURNING 1
    )
    SELECT COUNT(*)::int INTO v_links_deleted FROM del;

    -- Ensure links for desired adults, with primary priority
    WITH ins AS (
      INSERT INTO public.family_member_child_links (family_id, adult_profile_id, child_profile_id, pickup_priority)
      SELECT v_family_id, d.adult_profile_id, p_student_id,
             CASE WHEN d.adult_profile_id = v_primary_contact_id THEN 1 ELSE NULL END
      FROM tmp_desired_adults d
      ON CONFLICT (family_id, adult_profile_id, child_profile_id)
      DO NOTHING
      RETURNING 1
    )
    SELECT COALESCE(COUNT(*)::int, 0) INTO v_links_inserted FROM ins;

    UPDATE public.family_member_child_links l
    SET pickup_priority = CASE WHEN l.adult_profile_id = v_primary_contact_id THEN 1 ELSE NULL END
    WHERE l.family_id = v_family_id
      AND l.child_profile_id = p_student_id;

    GET DIAGNOSTICS v_links_updated = ROW_COUNT;

    IF p_debug THEN
      INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
      VALUES (p_student_id, p_registration_period_id, 'contacts', 'processed counts',
              jsonb_build_object('profiles_created', v_profiles_created, 'members_added', v_members_added,
                                 'links_inserted', v_links_inserted, 'links_deleted', v_links_deleted,
                                 'links_updated', v_links_updated, 'siblings_processed', v_siblings_processed,
                                 'primary_contact_id', v_primary_contact_id));
    END IF;
  ELSE
    IF p_debug THEN
      INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
      VALUES (p_student_id, p_registration_period_id, 'contacts', 'not provided', NULL);
    END IF;
  END IF;

  IF p_debug THEN
    INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
    VALUES (p_student_id, p_registration_period_id, 'end', 'summary',
            jsonb_build_object(
              'submission_id', v_submission_id,
              'choices_rows', v_rows_choices_after,
              'no_offer_rows', v_rows_nooffers_after,
              'apps_upserted', v_apps_upserted,
              'apps_deleted', v_apps_deleted,
              'pickup_rules_applied', v_pickup_rules_applied
            ));
  END IF;

  RETURN jsonb_build_object(
    'submission_id', v_submission_id,
    'choices_rows', v_rows_choices_after,
    'no_offer_rows', v_rows_nooffers_after,
    'apps_upserted', v_apps_upserted,
    'apps_deleted', v_apps_deleted,
    'profiles_created', v_profiles_created,
    'family_members_added', v_members_added,
    'links_inserted', v_links_inserted,
    'links_deleted', v_links_deleted,
    'links_updated', v_links_updated,
    'siblings_processed', v_siblings_processed,
    'pickup_rules_applied', v_pickup_rules_applied
  );
END;
$$;

-- Object 104/188
CREATE FUNCTION public.ingest_interview_ui_wrapper(p_student_id uuid, p_registration_period_id uuid, p_ui_payload jsonb, p_submitted_by uuid DEFAULT NULL::uuid, p_debug boolean DEFAULT false) RETURNS TABLE(ui_payload jsonb, normalized_payload jsonb, result jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_school_id uuid;
  v_semester_id uuid;
  v_submission_id uuid;
  v_choices jsonb := '[]'::jsonb;
  v_no_offers jsonb := '[]'::jsonb;
  v_fallbacks jsonb := '[]'::jsonb;
  v_normalized jsonb := '{}'::jsonb;
  v_now timestamptz := now();
BEGIN
  -- If you already have a resolver, use it; otherwise keep NULLs where unknown
  SELECT scws.school_id, scws.semester_id
  INTO v_school_id, v_semester_id
  FROM public.student_course_wish_submissions scws
  WHERE scws.student_id = p_student_id
    AND scws.registration_period_id = p_registration_period_id
  LIMIT 1;

  -- Normalize course_choices, no_offers, pickup_fallbacks from the UI
  WITH raw AS (
    SELECT jsonb_array_elements(COALESCE(p_ui_payload->'course_choices','[]'::jsonb)) AS item
  ),
  mapped AS (
    SELECT
      CASE
        WHEN (item->>'day') ILIKE 'montag' THEN 1
        WHEN (item->>'day') ILIKE 'dienstag' THEN 2
        WHEN (item->>'day') ILIKE 'mittwoch' THEN 3
        WHEN (item->>'day') ILIKE 'donnerstag' THEN 4
        WHEN (item->>'day') ILIKE 'freitag' THEN 5
        ELSE NULL
      END AS dow,
      NULLIF(item->>'window_id','')::uuid AS window_id,
      NULLIF(item->>'rank','')::int AS rank,
      COALESCE((item->>'no_offer')::boolean, false) AS no_offer,
      COALESCE((item->>'pickup_fallback')::boolean, false) AS pickup_fallback
    FROM raw
  )
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object('rank', rank, 'window_id', window_id, 'day_of_week', dow)
        ORDER BY dow, rank
      ) FILTER (WHERE window_id IS NOT NULL AND dow IS NOT NULL AND rank IS NOT NULL),
      '[]'::jsonb
    ) AS choices_json,
    COALESCE(
      jsonb_agg(DISTINCT to_jsonb(dow))
      FILTER (WHERE no_offer IS TRUE AND dow IS NOT NULL),
      '[]'::jsonb
    ) AS no_offers_json,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('day_of_week', dow, 'rank', rank)
        ORDER BY dow, rank
      ) FILTER (WHERE pickup_fallback IS TRUE AND dow IS NOT NULL AND rank IS NOT NULL),
      '[]'::jsonb
    ) AS fallbacks_json
  INTO v_choices, v_no_offers, v_fallbacks
  FROM mapped;

  v_normalized := jsonb_build_object(
    'choices', v_choices,
    'no_offers', v_no_offers,
    'pickup_fallbacks', v_fallbacks,
    'heimweg', COALESCE(p_ui_payload->'heimweg','{}'::jsonb)
  );

  -- Optional debug logging (requires public.log_ingest_debug to exist)
  IF p_debug THEN
    BEGIN
      PERFORM public.log_ingest_debug('wrapper.normalize', p_student_id, p_registration_period_id, 'normalized payload', v_normalized);
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END IF;

  -- Upsert the submission:
  -- - interview_raw stores the COMPLETE interview object exactly as received
  -- - payload keeps both interview and normalized for quick reads
  INSERT INTO public.student_course_wish_submissions (
    student_id, school_id, registration_period_id, semester_id,
    submitted_at, submitted_by, payload, interview_raw,
    over_limit_total, over_limit_per_day
  )
  VALUES (
    p_student_id, v_school_id, p_registration_period_id, v_semester_id,
    v_now, p_submitted_by,
    jsonb_build_object(
      'schema_version', 1,
      'interview', p_ui_payload,
      'normalized', v_normalized
    ),
    p_ui_payload,
    false, false
  )
  ON CONFLICT (student_id, registration_period_id)
  DO UPDATE SET
    semester_id = COALESCE(EXCLUDED.semester_id, public.student_course_wish_submissions.semester_id),
    submitted_at = EXCLUDED.submitted_at,
    submitted_by = EXCLUDED.submitted_by,
    payload = EXCLUDED.payload,
    interview_raw = EXCLUDED.interview_raw,
    over_limit_total = EXCLUDED.over_limit_total,
    over_limit_per_day = EXCLUDED.over_limit_per_day
  RETURNING id INTO v_submission_id;

  IF p_debug THEN
    BEGIN
      PERFORM public.log_ingest_debug('wrapper.submission_upsert', p_student_id, p_registration_period_id, 'submission upserted', jsonb_build_object('submission_id', v_submission_id));
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END IF;

  -- Rebuild course_applications from normalized choices (adjust to your actual function)
  PERFORM public.ingest_interview_everything(
    p_student_id := p_student_id,
    p_registration_period_id := p_registration_period_id,
    p_payload := v_normalized,
    p_submitted_by := p_submitted_by,
    p_debug := p_debug
  );

  IF p_debug THEN
    BEGIN
      PERFORM public.log_ingest_debug('wrapper.done', p_student_id, p_registration_period_id, 'completed', NULL);
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END IF;

  RETURN QUERY
  SELECT
    p_ui_payload AS ui_payload,
    v_normalized AS normalized_payload,
    jsonb_build_object(
      'submission_id', v_submission_id,
      'choices_rows', jsonb_array_length(v_choices),
      'no_offers_count', jsonb_array_length(v_no_offers),
      'pickup_fallbacks_count', jsonb_array_length(v_fallbacks)
    ) AS result;
END;
$$;

-- Object 105/188
CREATE FUNCTION public."ingest_interview_ui_wrapper.alt"(p_student_id uuid, p_registration_period_id uuid, p_ui_payload jsonb, p_submitted_by uuid DEFAULT NULL::uuid, p_debug boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$DECLARE
  v_norm jsonb;
  v_res  jsonb;
BEGIN
  v_norm := public.normalize_interview_ui_payload(p_ui_payload);

  IF p_debug THEN
    INSERT INTO public.ingest_interview_debug_log(student_id, registration_period_id, stage, message, details)
    VALUES (p_student_id, p_registration_period_id, 'wrapper.normalize', 'normalized payload', v_norm);
    RAISE NOTICE '[wrapper] normalized=%', v_norm;
  END IF;

  v_res := public.ingest_interview_everything(
    p_student_id,
    p_registration_period_id,
    v_norm,
    p_submitted_by,
    p_debug
  );

  RETURN jsonb_build_object(
    'normalized_payload', v_norm,
    'result', v_res
  );
END;$$;

-- Object 106/188
CREATE FUNCTION public.is_current_user_staff() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('Teacher', 'Admin', 'Staff')
    )
  END;
$$;

-- Object 107/188
CREATE FUNCTION public.is_user_staff_optimized(user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  -- Early return if no user
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Direct lookup with actual role IDs from the database
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = user_id
    AND up.role_id IN (
      '8b8123fd-ee8e-429d-b6c6-579f82e7c306', -- Teacher
      '6b4ffe63-6384-497b-b40c-473af51dc26d'  -- Admin
    )
  );
END;
$$;

-- Object 108/188
CREATE FUNCTION public.link_and_invite_parent(p_parent_profile_id uuid, p_first_name text, p_last_name text, p_family_id uuid, p_school_id uuid, p_contacts jsonb, p_student_connections jsonb, p_added_by uuid, p_send_invite boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_new_profile_id UUID;
  v_user_code_data JSONB;
  v_primary_email TEXT;
  v_parent_role_id UUID;
  v_result JSONB;
  v_parent_family_member_key JSONB;
  v_student_family_member_keys JSONB[] := '{}';
  v_child_link_ids UUID[] := '{}';
  v_child_link_record RECORD;
BEGIN
  -- Start transaction
  BEGIN
    IF p_parent_profile_id IS NULL THEN
      -- Get Parent role ID
      SELECT id INTO v_parent_role_id
      FROM roles
      WHERE name = 'Parent'
      LIMIT 1;

      IF v_parent_role_id IS NULL THEN
        RAISE EXCEPTION 'Parent role not found in roles table';
      END IF;

      -- Create user profile
      INSERT INTO user_profiles (first_name, last_name, school_id, role_id, account_status)
      VALUES (p_first_name, p_last_name, p_school_id, v_parent_role_id, 'none')
      RETURNING id INTO v_new_profile_id;

      -- Add user role
      INSERT INTO user_roles (user_profile_id, role_id)
      VALUES (v_new_profile_id, v_parent_role_id)
      ON CONFLICT (user_profile_id, role_id) DO NOTHING;

      -- Add contacts with safer boolean handling
      INSERT INTO contacts (
        profile_id,
        profile_type,
        type,
        value,
        is_primary,
        notes,
        is_linked_to_user_login
      )
      SELECT
        v_new_profile_id,
        'parent',
        (contact->>'contact_type')::TEXT,
        (contact->>'contact_value')::TEXT,
        CASE
          WHEN (contact->>'is_primary')::TEXT = 'true' THEN TRUE
          WHEN (contact->>'is_primary')::TEXT = 'false' THEN FALSE
          WHEN (contact->>'is_primary') IS NULL THEN FALSE
          ELSE FALSE
        END,
        (contact->>'notes')::TEXT,
        CASE
          WHEN (contact->>'is_linked_to_user_login')::TEXT = 'true' THEN TRUE
          WHEN (contact->>'is_linked_to_user_login')::TEXT = 'false' THEN FALSE
          WHEN (contact->>'is_linked_to_user_login') IS NULL THEN FALSE
          ELSE FALSE
        END
      FROM jsonb_array_elements(p_contacts) AS contact;
    ELSE
      -- Use existing profile ID
      v_new_profile_id := p_parent_profile_id;
    END IF;

    -- Add family member for parent
    INSERT INTO family_members (
      family_id,
      profile_id,
      role,
      relation_description,
      is_primary_guardian,
      is_primary_contact,
      notes,
      added_by
    )
    VALUES (
      p_family_id,
      v_new_profile_id,
      'parent',
      'Parent',
      TRUE,
      TRUE,
      'Added via link-and-invite-parent function',
      p_added_by
    )
    ON CONFLICT (family_id, profile_id) DO NOTHING;

    -- Store parent family member composite key
    v_parent_family_member_key := jsonb_build_object(
      'family_id', p_family_id,
      'profile_id', v_new_profile_id
    );

    -- Add family member for student (if not already exists) and collect composite keys
    INSERT INTO family_members (
      family_id,
      profile_id,
      role,
      relation_description,
      is_primary_guardian,
      is_primary_contact,
      notes,
      added_by
    )
    SELECT
      p_family_id,
      (connection->>'profile_id')::UUID,
      'student',
      'Student',
      FALSE,
      FALSE,
      'Added via link-and-invite-parent function',
      p_added_by
    FROM jsonb_array_elements(p_student_connections) AS connection
    ON CONFLICT (family_id, profile_id) DO NOTHING;

    -- Store student family member composite keys
    SELECT array_agg(
      jsonb_build_object(
        'family_id', p_family_id,
        'profile_id', (connection->>'profile_id')::UUID
      )
    ) INTO v_student_family_member_keys
    FROM jsonb_array_elements(p_student_connections) AS connection;

    -- Add profile info family member
    INSERT INTO profile_info_family_member (profile_id, school_id)
    VALUES (v_new_profile_id, p_school_id)
    ON CONFLICT (profile_id) DO NOTHING;

    -- Add family member child links and collect IDs
    FOR v_child_link_record IN
      INSERT INTO family_member_child_links (
        family_id,
        adult_profile_id,
        child_profile_id,
        relationship,
        access_restricted,
        notes
      )
      SELECT
        p_family_id,
        v_new_profile_id,
        (connection->>'profile_id')::UUID,
        COALESCE((connection->>'relationship')::TEXT, 'Parent'),
        FALSE,
        'Linked via link-and-invite-parent function'
      FROM jsonb_array_elements(p_student_connections) AS connection
      ON CONFLICT (family_id, adult_profile_id, child_profile_id) DO NOTHING
      RETURNING id
    LOOP
      v_child_link_ids := array_append(v_child_link_ids, v_child_link_record.id);
    END LOOP;

    -- Handle invite if requested
    IF p_send_invite THEN
      -- Get primary email contact
      SELECT (contact->>'contact_value')::TEXT INTO v_primary_email
      FROM jsonb_array_elements(p_contacts) AS contact
      WHERE LOWER((contact->>'contact_type')::TEXT) = 'email'
      LIMIT 1;

      IF v_primary_email IS NOT NULL THEN
        -- Generate user code
        SELECT get_or_generate_user_code(v_new_profile_id) INTO v_user_code_data;

        -- Update account status to invited
        UPDATE user_profiles
        SET account_status = 'invited'
        WHERE id = v_new_profile_id;
      END IF;
    END IF;

    -- Prepare result with family member composite keys and child link IDs
    v_result := jsonb_build_object(
      'success', TRUE,
      'profile_id', v_new_profile_id,
      'family_id', p_family_id,
      'marked_as_invited', p_send_invite AND v_primary_email IS NOT NULL,
      'user_code', CASE WHEN p_send_invite AND v_primary_email IS NOT NULL THEN v_user_code_data ELSE NULL END,
      'invite_email_address', v_primary_email,
      'family_member_keys', jsonb_build_object(
        'parent_family_member_key', v_parent_family_member_key,
        'student_family_member_keys', v_student_family_member_keys
      ),
      'child_link_ids', v_child_link_ids
    );

    -- Commit transaction
    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on any error
      RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
  END;
END;
$$;

-- Object 109/188
CREATE FUNCTION public.log_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_user_id uuid := current_setting('request.user_id', true)::uuid;
  v_school_id uuid := null;
  v_action_type text;
begin
  -- Detect action type
  if (TG_OP = 'INSERT') then
    v_action_type := 'insert';
  elsif (TG_OP = 'UPDATE') then
    v_action_type := 'update';
  elsif (TG_OP = 'DELETE') then
    if (OLD.is_deleted is null or OLD.is_deleted = false) then
      v_action_type := 'hard_delete';
    else
      v_action_type := 'soft_delete';
    end if;
  else
    raise exception 'Unsupported operation: %', TG_OP;
  end if;

  -- Try to get school_id from current setting
  begin
    v_school_id := current_setting('request.school_id', true)::uuid;
  exception
    when others then
      -- Optional, skip if not set
      null;
  end;

  -- Insert change log
  insert into public.change_log (
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    before_data,
    after_data
  ) values (
    v_user_id,
    v_school_id,
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id),
    v_action_type,
    case when v_action_type in ('update', 'soft_delete', 'hard_delete') then to_jsonb(OLD) else null end,
    case when v_action_type in ('insert', 'update', 'soft_delete') then to_jsonb(NEW) else null end
  );

  return null;
end;
$$;

-- Object 110/188
CREATE FUNCTION public.log_change_generic() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  -- try to read an existing group, else generate one
  v_group   UUID := current_setting('my.change_group_id', true)::UUID;
  -- map the trigger operation
  v_action  TEXT := CASE TG_OP
    WHEN 'INSERT' THEN 'insert'
    WHEN 'UPDATE' THEN 'update'
    WHEN 'DELETE' THEN 'hard_delete'
    ELSE NULL
  END;
  v_user    UUID;
  v_school  UUID;
BEGIN
  -- 1) sanity check
  IF v_action IS NULL THEN
    RAISE EXCEPTION 'Unsupported TG_OP: %', TG_OP;
  END IF;

  -- 2) ensure we always have a change_group_id
  v_group := COALESCE(v_group, gen_random_uuid());

  -- 3) pick the actor & school
  IF TG_OP = 'INSERT' THEN
    v_user   := COALESCE(auth.uid(), NEW.created_by);
    v_school := NEW.school_id;
  ELSE
    v_user   := auth.uid();
    v_school := COALESCE(NEW.school_id, OLD.school_id);
  END IF;

  -- 4) write the audit row
  INSERT INTO public.change_log (
    change_group_id,
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    before_data,
    after_data
  ) VALUES (
    v_group,
    v_user,
    v_school,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_action,
    CASE WHEN v_action IN ('update','hard_delete') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN v_action IN ('insert','update')    THEN to_jsonb(NEW) ELSE NULL END
  );

  -- 5) return control to the original DML
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Object 111/188
CREATE FUNCTION public.log_ddl_command() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() LOOP
        INSERT INTO public.schema_change_log (
            event_type,
            object_type,
            object_name,
            executed_sql,
            username,
            session_user_name
        ) VALUES (
            obj.command_tag,
            obj.object_type,
            obj.object_identity,
            current_query(),
            current_user,
            session_user
        );
    END LOOP;
END;
$$;

-- Object 112/188
CREATE FUNCTION public.log_ingest_debug(p_stage text, p_student_id uuid, p_registration_period_id uuid, p_message text, p_details jsonb) RETURNS void
    LANGUAGE sql
    AS $$
  INSERT INTO public.ingest_interview_debug_log (
    student_id, registration_period_id, stage, message, details
  ) VALUES (p_student_id, p_registration_period_id, p_stage, p_message, p_details);
$$;

-- Object 113/188
CREATE FUNCTION public.log_manual_change(p_table_name text, p_record_id uuid, p_action_type text, p_user_id uuid, p_school_id uuid, p_data jsonb, p_change_group_id uuid DEFAULT gen_random_uuid()) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO public.change_log (
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    after_data,
    change_group_id
  )
  VALUES (
    p_user_id,
    p_school_id,
    p_table_name,
    p_record_id,
    p_action_type,
    p_data,
    p_change_group_id
  );
END;
$$;

-- Object 114/188
CREATE FUNCTION public.log_schema_change() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    rec record;
BEGIN
    FOR rec IN
        SELECT
            command_tag,
            object_type,
            object_identity
        FROM pg_event_trigger_ddl_commands()
        WHERE object_type IN ('table', 'view')
          -- Only log changes to objects in the public schema
          AND object_identity LIKE 'public.%'
    LOOP
        INSERT INTO public.schema_change_log(
            event_type, object_type, object_name, executed_sql, username, event_time
        )
        VALUES (
            rec.command_tag,
            rec.object_type,
            rec.object_identity,
            'SQL NOT AVAILABLE IN EVENT TRIGGER',
            session_user,
            now()
        );
    END LOOP;
END;
$$;

-- Object 115/188
CREATE FUNCTION public.mark_all_students_present(p_student_ids uuid[], p_lesson_id uuid, p_school_id uuid, p_recorded_by uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  student uuid;
  v_daily_log_id uuid;
BEGIN
  FOREACH student IN ARRAY p_student_ids
  LOOP
    -- 1. Upsert daily log
    SELECT id INTO v_daily_log_id
    FROM student_daily_log
    WHERE student_id = student
      AND date = current_date;

    IF v_daily_log_id IS NULL THEN
      INSERT INTO student_daily_log (
        student_id,
        school_id,
        date,
        presence_status,
        check_in_time,
        check_in_method,
        check_in_by,
        updated_at,
        last_updated_by
      ) VALUES (
        student,
        p_school_id,
        current_date,
        'present',
        now(),
        'manual',
        p_recorded_by,
        now(),
        p_recorded_by
      )
      RETURNING id INTO v_daily_log_id;
    ELSE
      UPDATE student_daily_log
      SET
        presence_status = 'present',
        check_in_time = now(),
        check_in_method = 'manual',
        check_in_by = p_recorded_by,
        updated_at = now(),
        last_updated_by = p_recorded_by
      WHERE id = v_daily_log_id;
    END IF;

    -- 2. Upsert attendance
    INSERT INTO student_attendance_logs (
      student_id,
      lesson_id,
      daily_log_id,
      status,
      method,
      recorded_by
    ) VALUES (
      student,
      p_lesson_id,
      v_daily_log_id,
      'present',
      'manual',
      p_recorded_by
    )
    ON CONFLICT (student_id, lesson_id) DO UPDATE
    SET
      status = excluded.status,
      method = excluded.method,
      recorded_by = excluded.recorded_by,
      daily_log_id = excluded.daily_log_id,
      timestamp = now();
  END LOOP;
END;
$$;

-- Object 116/188
CREATE FUNCTION public.mark_student_attendance(p_student_id uuid, p_lesson_id uuid, p_school_id uuid, p_recorded_by uuid, p_status public.attendance_status) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_daily_log_id UUID;
  v_existing_status presence_status;
  v_is_late BOOLEAN := FALSE;
  v_first_lesson_ts TIMESTAMP;
  v_enrolled BOOLEAN;
BEGIN
  -- 1. Determine if student is late (only for status = 'late')
  IF p_status = 'late' THEN
    -- Check enrollment and earliest lesson for today
    SELECT true INTO v_enrolled
    FROM course_enrollments ce
    WHERE ce.student_id = p_student_id
      AND ce.school_id = p_school_id
      AND CURRENT_DATE BETWEEN ce.start_date AND ce.end_date
      AND EXISTS (
        SELECT 1
        FROM course_lessons cl
        WHERE cl.course_id = ce.course_id
          AND cl.school_id = p_school_id
          AND cl.is_cancelled IS NOT TRUE
          AND cl.start_datetime::DATE = CURRENT_DATE
      )
    LIMIT 1;

    IF v_enrolled THEN
      SELECT MIN(cl.start_datetime) INTO v_first_lesson_ts
      FROM course_enrollments ce
      JOIN course_lessons cl ON cl.course_id = ce.course_id
      WHERE ce.student_id = p_student_id
        AND ce.school_id = p_school_id
        AND CURRENT_DATE BETWEEN ce.start_date AND ce.end_date
        AND cl.is_cancelled IS NOT TRUE
        AND cl.start_datetime::DATE = CURRENT_DATE;

      IF v_first_lesson_ts IS NOT NULL AND now() > v_first_lesson_ts THEN
        v_is_late := TRUE;
      END IF;
    END IF;
  END IF;

  -- 2. Check for existing daily log
  SELECT id, presence_status INTO v_daily_log_id, v_existing_status
  FROM student_daily_log
  WHERE student_id = p_student_id
    AND date = CURRENT_DATE;

  -- 3. Insert or update daily log
  IF v_daily_log_id IS NULL THEN
    INSERT INTO student_daily_log (
      student_id,
      school_id,
      date,
      presence_status,
      is_late,
      check_in_time,
      check_in_method,
      check_in_by,
      updated_at,
      last_updated_by
    )
    VALUES (
      p_student_id,
      p_school_id,
      CURRENT_DATE,
      CASE 
        WHEN p_status = 'late' THEN 'present'::presence_status
        WHEN p_status = 'present' THEN 'present'::presence_status
        WHEN p_status = 'absent_excused' THEN 'absent_excused'::presence_status
        WHEN p_status = 'absent_unexcused' THEN 'absent_unexcused'::presence_status
        ELSE 'unmarked'::presence_status
      END,
      v_is_late,
      now(),
      'manual',
      p_recorded_by,
      now(),
      p_recorded_by
    )
    RETURNING id INTO v_daily_log_id;

  ELSIF v_existing_status = 'unmarked' THEN
    UPDATE student_daily_log
    SET
      presence_status = CASE 
        WHEN p_status = 'late' THEN 'present'::presence_status
        WHEN p_status = 'present' THEN 'present'::presence_status
        WHEN p_status = 'absent_excused' THEN 'absent_excused'::presence_status
        WHEN p_status = 'absent_unexcused' THEN 'absent_unexcused'::presence_status
        ELSE 'unmarked'::presence_status
      END,
      is_late = v_is_late,
      updated_at = now(),
      last_updated_by = p_recorded_by
    WHERE id = v_daily_log_id;
  END IF;

  -- 4. Upsert into student_attendance_logs
  INSERT INTO student_attendance_logs (
    student_id,
    lesson_id,
    daily_log_id,
    status,
    method,
    recorded_by,
    school_id
  )
  VALUES (
    p_student_id,
    p_lesson_id,
    v_daily_log_id,
    p_status,
    'manual',
    p_recorded_by,
    p_school_id
  )
  ON CONFLICT (student_id, lesson_id) DO UPDATE
  SET
    status = excluded.status,
    method = excluded.method,
    recorded_by = excluded.recorded_by,
    daily_log_id = excluded.daily_log_id,
    school_id = excluded.school_id,
    timestamp = now();

  RETURN 'OK';
END;
$$;

-- Object 117/188
CREATE FUNCTION public.mark_student_attendance_legacy(p_student_id uuid, p_lesson_id uuid, p_school_id uuid, p_recorded_by uuid, p_status text) RETURNS TABLE(daily_log_was_created boolean, daily_log_already_existed boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_daily_log_id uuid;
  v_log_exists boolean := false;
BEGIN
  -- 1. Check for existing daily log
  SELECT id INTO v_daily_log_id
  FROM student_daily_log
  WHERE student_id = p_student_id
    AND date = current_date;

  IF v_daily_log_id IS NULL THEN
    -- 1a. Insert new daily log
    INSERT INTO student_daily_log (
      student_id,
      school_id,
      date,
      presence_status,
      is_late,
      check_in_time,
      check_in_method,
      check_in_by,
      updated_at,
      last_updated_by
    )
    VALUES (
      p_student_id,
      p_school_id,
      current_date,
      CASE 
        WHEN p_status = 'late' THEN 'present'::attendance_status
        ELSE p_status::attendance_status
      END,
      p_status = 'late',
      now(),
      'manual',
      p_recorded_by,
      now(),
      p_recorded_by
    )
    RETURNING id INTO v_daily_log_id;

    daily_log_was_created := true;
    daily_log_already_existed := false;

  ELSE
    daily_log_was_created := false;
    daily_log_already_existed := true;
  END IF;

  -- 2. Upsert lesson attendance
  INSERT INTO student_attendance_logs (
    student_id,
    lesson_id,
    daily_log_id,
    status,
    method,
    recorded_by
  )
  VALUES (
    p_student_id,
    p_lesson_id,
    v_daily_log_id,
    p_status::attendance_status,
    'manual',
    p_recorded_by
  )
  ON CONFLICT (student_id, lesson_id) DO UPDATE
  SET
    status = excluded.status,
    method = excluded.method,
    recorded_by = excluded.recorded_by,
    daily_log_id = excluded.daily_log_id,
    timestamp = now();

  RETURN NEXT;
END;
$$;

-- Object 118/188
CREATE FUNCTION public.mark_student_present(p_student_id uuid, p_lesson_id uuid, p_school_id uuid, p_recorded_by uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_daily_log_id uuid;
BEGIN
  -- 1. Upsert daily log
  SELECT id INTO v_daily_log_id
  FROM student_daily_log
  WHERE student_id = p_student_id
    AND date = current_date;

  IF v_daily_log_id IS NULL THEN
    INSERT INTO student_daily_log (
      student_id,
      school_id,
      date,
      presence_status,
      check_in_time,
      check_in_method,
      check_in_by,
      updated_at,
      last_updated_by
    ) VALUES (
      p_student_id,
      p_school_id,
      current_date,
      'present',
      now(),
      'manual',
      p_recorded_by,
      now(),
      p_recorded_by
    )
    RETURNING id INTO v_daily_log_id;
  ELSE
    UPDATE student_daily_log
    SET
      presence_status = 'present',
      check_in_time = now(),
      check_in_method = 'manual',
      check_in_by = p_recorded_by,
      updated_at = now(),
      last_updated_by = p_recorded_by
    WHERE id = v_daily_log_id;
  END IF;

  -- 2. Upsert lesson attendance
  INSERT INTO student_attendance_logs (
    student_id,
    lesson_id,
    daily_log_id,
    status,
    method,
    recorded_by
  ) VALUES (
    p_student_id,
    p_lesson_id,
    v_daily_log_id,
    'present',
    'manual',
    p_recorded_by
  )
  ON CONFLICT (student_id, lesson_id) DO UPDATE
  SET
    status = excluded.status,
    method = excluded.method,
    recorded_by = excluded.recorded_by,
    daily_log_id = excluded.daily_log_id,
    timestamp = now();
END;
$$;

-- Object 119/188
CREATE FUNCTION public.normalize_interview_ui_payload(p_ui_payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_choice      jsonb;
  v_flat_item   jsonb;
  v_out_choices jsonb := '[]'::jsonb;
  v_no_offers   jsonb := '[]'::jsonb;
  v_day_name    text;
  v_day_num     int;
  v_rank        int;
  v_window_id   text;
BEGIN
  -- Helper day mapper
  -- Montag..Freitag → 1..5
  -- Accept English fallback too, just in case.
  -- Returns NULL if unknown.
  CREATE TEMP TABLE IF NOT EXISTS _day_map(day_name text PRIMARY KEY, day_num int) ON COMMIT DROP;
  IF NOT EXISTS (SELECT 1 FROM _day_map) THEN
    INSERT INTO _day_map(day_name, day_num) VALUES
      ('Montag',1),('Dienstag',2),('Mittwoch',3),('Donnerstag',4),('Freitag',5),
      ('Monday',1),('Tuesday',2),('Wednesday',3),('Thursday',4),('Friday',5);
  END IF;

  -- If already normalized, just passthrough
  IF (p_ui_payload ? 'choices') OR (p_ui_payload ? 'no_offers') THEN
    RETURN jsonb_build_object(
      'choices', COALESCE(p_ui_payload->'choices','[]'::jsonb),
      'no_offers', COALESCE(p_ui_payload->'no_offers','[]'::jsonb)
    );
  END IF;

  -- Accept wrapper objects like { course_choices: [...] }
  IF (p_ui_payload ? 'course_choices') THEN
    FOR v_choice IN
      SELECT c FROM jsonb_array_elements(COALESCE(p_ui_payload->'course_choices','[]'::jsonb)) t(c)
    LOOP
      v_day_name := NULLIF(v_choice->>'day','');
      SELECT day_num INTO v_day_num FROM _day_map WHERE lower(day_name)=lower(v_day_name);
      v_rank := NULLIF(v_choice->>'rank','')::int;
      v_window_id := NULLIF(v_choice->>'window_id','');

      IF (COALESCE(v_choice->>'no_offer','false'))::boolean OR v_rank = 0 OR v_window_id IS NULL THEN
        IF v_day_num BETWEEN 1 AND 5 THEN
          v_no_offers := (SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements(v_no_offers || to_jsonb(v_day_num)) x);
        END IF;
      ELSE
        IF v_day_num BETWEEN 1 AND 5 THEN
          v_out_choices := v_out_choices || jsonb_build_object(
            'day_of_week', v_day_num,
            'rank', v_rank,
            'window_id', v_window_id
          );
        END IF;
      END IF;
    END LOOP;

    RETURN jsonb_build_object('choices', v_out_choices, 'no_offers', v_no_offers);
  END IF;

  -- Accept event shape: { flat: [...], noOfferDays: [...] }
  IF (p_ui_payload ? 'flat') OR (p_ui_payload ? 'noOfferDays') THEN
    -- noOfferDays first
    IF (p_ui_payload ? 'noOfferDays') THEN
      FOR v_day_name IN SELECT elem::text FROM jsonb_array_elements_text(COALESCE(p_ui_payload->'noOfferDays','[]'::jsonb)) t(elem)
      LOOP
        SELECT day_num INTO v_day_num FROM _day_map WHERE lower(day_name)=lower(v_day_name);
        IF v_day_num BETWEEN 1 AND 5 THEN
          v_no_offers := (SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements(v_no_offers || to_jsonb(v_day_num)) x);
        END IF;
      END LOOP;
    END IF;

    -- flat rows
    FOR v_flat_item IN
      SELECT c FROM jsonb_array_elements(COALESCE(p_ui_payload->'flat','[]'::jsonb)) t(c)
    LOOP
      v_day_name := NULLIF(v_flat_item->>'day','');
      SELECT day_num INTO v_day_num FROM _day_map WHERE lower(day_name)=lower(v_day_name);
      v_rank := NULLIF(v_flat_item->>'rank','')::int;
      v_window_id := NULLIF(v_flat_item->>'window_id','');

      IF (COALESCE(v_flat_item->>'no_offer','false'))::boolean OR v_rank = 0 OR v_window_id IS NULL THEN
        IF v_day_num BETWEEN 1 AND 5 THEN
          v_no_offers := (SELECT jsonb_agg(DISTINCT x) FROM jsonb_array_elements(v_no_offers || to_jsonb(v_day_num)) x);
        END IF;
      ELSE
        IF v_day_num BETWEEN 1 AND 5 THEN
          v_out_choices := v_out_choices || jsonb_build_object(
            'day_of_week', v_day_num,
            'rank', v_rank,
            'window_id', v_window_id
          );
        END IF;
      END IF;
    END LOOP;

    RETURN jsonb_build_object('choices', v_out_choices, 'no_offers', v_no_offers);
  END IF;

  -- Fallback: empty
  RETURN jsonb_build_object('choices','[]'::jsonb,'no_offers','[]'::jsonb);
END;
$$;

-- Object 120/188
CREATE FUNCTION public.process_first_login(input_code character varying, p_profile_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    code_updated INTEGER := 0;
    status_updated INTEGER := 0;
BEGIN
    -- Step 1: Mark the code as used
    UPDATE user_codes
    SET used_at = NOW()
    WHERE code = input_code
    AND profile_id = p_profile_id
    AND used_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > NOW();

    GET DIAGNOSTICS code_updated = ROW_COUNT;

    IF code_updated = 0 THEN
        RAISE EXCEPTION 'Failed to mark code as used';
    END IF;

    -- Step 2: Update user profile status to active
    UPDATE user_profiles
    SET account_status = 'active'
    WHERE id = p_profile_id;

    GET DIAGNOSTICS status_updated = ROW_COUNT;

    IF status_updated = 0 THEN
        RAISE EXCEPTION 'Failed to update user profile status';
    END IF;

    -- If we get here, everything succeeded
    RETURN json_build_object(
        'success', true,
        'error', null,
        'profile_id', p_profile_id,
        'message', 'Database operations completed successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        -- The transaction will automatically rollback all changes
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'profile_id', null
        );
END;
$$;

-- Object 121/188
CREATE FUNCTION public.process_parent_student_first_login(input_code character varying, p_child_profile_id uuid, p_adult_profile_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    code_updated INTEGER := 0;
    status_updated INTEGER := 0;
    child_profile_id UUID;
    family_id UUID;
BEGIN
    -- Step 1: Verify the code is linked to the child profile and check parent-student relationship
    SELECT uc.profile_id, fmcl.family_id
    INTO child_profile_id, family_id
    FROM user_codes uc
    JOIN user_profiles up ON uc.profile_id = up.id
    JOIN user_roles ur ON up.id = ur.user_profile_id
    JOIN roles r ON ur.role_id = r.id AND r.name = 'Student' AND r.is_subrole = false
    JOIN family_member_child_links fmcl ON fmcl.child_profile_id = uc.profile_id
    JOIN user_profiles adult_up ON fmcl.adult_profile_id = adult_up.id
    JOIN user_roles adult_ur ON adult_up.id = adult_ur.user_profile_id
    JOIN roles adult_r ON adult_ur.role_id = adult_r.id AND adult_r.name = 'Parent' AND adult_r.is_subrole = false
    WHERE uc.code = input_code
    AND uc.profile_id = p_child_profile_id
    AND fmcl.adult_profile_id = p_adult_profile_id
    AND uc.used_at IS NULL
    AND uc.revoked_at IS NULL
    AND uc.expires_at > NOW()
    AND up.account_status NOT IN ('deleted', 'suspended')
    AND adult_up.account_status NOT IN ('deleted', 'suspended');

    IF child_profile_id IS NULL THEN
        RAISE EXCEPTION 'Code not found, expired, revoked, already used, or not linked to the specified child profile';
    END IF;

    -- Step 2: Verify that the family_id was found (relationship already verified in Step 1)
    IF family_id IS NULL THEN
        RAISE EXCEPTION 'Family relationship not found between adult and child profiles';
    END IF;

    -- Step 3: Mark the code as used
    UPDATE user_codes
    SET used_at = NOW()
    WHERE code = input_code
    AND profile_id = p_child_profile_id
    AND used_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > NOW();

    GET DIAGNOSTICS code_updated = ROW_COUNT;

    IF code_updated = 0 THEN
        RAISE EXCEPTION 'Failed to mark code as used';
    END IF;

    -- Step 4: Update adult profile status to active
    UPDATE user_profiles
    SET account_status = 'active'
    WHERE id = p_adult_profile_id;

    GET DIAGNOSTICS status_updated = ROW_COUNT;

    IF status_updated = 0 THEN
        RAISE EXCEPTION 'Failed to update adult profile status';
    END IF;

    -- If we get here, everything succeeded
    RETURN json_build_object(
        'success', true,
        'error', null,
        'adult_profile_id', p_adult_profile_id,
        'child_profile_id', p_child_profile_id,
        'family_id', family_id,
        'message', 'Parent first login processed successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        -- The transaction will automatically rollback all changes
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'adult_profile_id', null,
            'child_profile_id', null,
            'family_id', null
        );
END;
$$;

-- Object 122/188
CREATE FUNCTION public.protect_role_deletion() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_protection_level text;
    v_protection_reason text;
    v_usage_count integer;
    v_role_name text;
    v_is_subrole boolean;
    v_current_user_id uuid;
    v_current_user_role text;
    v_can_unprotect boolean;
BEGIN
    -- Get current user context
    v_current_user_id := auth.uid()::uuid;
    
    -- Get current user's primary role
    SELECT r.name INTO v_current_user_role
    FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = v_current_user_id;

    -- Get role details
    SELECT name, is_subrole INTO v_role_name, v_is_subrole
    FROM roles WHERE id = OLD.id;

    -- Check if role is in protected list
    SELECT protection_level, protection_reason, can_be_unprotected 
    INTO v_protection_level, v_protection_reason, v_can_unprotect
    FROM protected_roles 
    WHERE role_id = OLD.id;

    -- Check usage count
    SELECT total_usage INTO v_usage_count
    FROM get_role_usage_count(OLD.id);

    -- PROTECTION CHECK 1: Critical system roles cannot be deleted
    IF v_protection_level = 'CRITICAL' THEN
        IF v_can_unprotect = false OR v_current_user_role != 'Admin' THEN
            RAISE EXCEPTION 'ROLE_DELETE_BLOCKED: Critical system role "%" cannot be deleted. Reason: %', 
                v_role_name, v_protection_reason
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    -- PROTECTION CHECK 2: Roles in use cannot be deleted
    IF v_usage_count > 0 THEN
        RAISE EXCEPTION 'ROLE_DELETE_BLOCKED: Role "%" is currently assigned to % users and cannot be deleted. Remove all assignments first.', 
            v_role_name, v_usage_count
            USING ERRCODE = 'P0002';
    END IF;

    -- PROTECTION CHECK 3: Only admins can delete important roles
    IF v_protection_level = 'IMPORTANT' AND v_current_user_role != 'Admin' THEN
        RAISE EXCEPTION 'ROLE_DELETE_BLOCKED: Important role "%" can only be deleted by Admin users. Current user role: %', 
            v_role_name, COALESCE(v_current_user_role, 'Unknown')
            USING ERRCODE = 'P0003';
    END IF;

    -- PROTECTION CHECK 4: Main roles require special permission
    IF v_is_subrole = false AND v_current_user_role != 'Admin' THEN
        RAISE EXCEPTION 'ROLE_DELETE_BLOCKED: Main role "%" can only be deleted by Admin users.', 
            v_role_name
            USING ERRCODE = 'P0004';
    END IF;

    -- Log the successful deletion attempt
    INSERT INTO change_log (
        table_name, 
        operation_type, 
        record_id, 
        old_values, 
        user_id,
        details
    ) VALUES (
        'roles',
        'DELETE',
        OLD.id,
        jsonb_build_object(
            'name', OLD.name,
            'is_subrole', OLD.is_subrole,
            'permissions', OLD.permissions
        ),
        v_current_user_id,
        jsonb_build_object(
            'protection_level', v_protection_level,
            'usage_count', v_usage_count,
            'user_role', v_current_user_role,
            'warning', 'ROLE DELETION APPROVED - All protection checks passed'
        )
    );

    -- If all checks pass, allow the deletion
    RETURN OLD;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the blocked deletion attempt
        INSERT INTO change_log (
            table_name, 
            operation_type, 
            record_id, 
            old_values, 
            user_id,
            details
        ) VALUES (
            'roles',
            'DELETE_BLOCKED',
            OLD.id,
            jsonb_build_object(
                'name', OLD.name,
                'is_subrole', OLD.is_subrole,
                'permissions', OLD.permissions
            ),
            v_current_user_id,
            jsonb_build_object(
                'error_code', SQLSTATE,
                'error_message', SQLERRM,
                'protection_level', v_protection_level,
                'usage_count', v_usage_count,
                'user_role', v_current_user_role
            )
        );
        
        -- Re-raise the exception
        RAISE;
END;
$$;

-- Object 123/188
CREATE FUNCTION public.protect_role_modification() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_protection_level text;
    v_current_user_id uuid;
    v_current_user_role text;
BEGIN
    v_current_user_id := auth.uid()::uuid;
    
    -- Get current user's primary role
    SELECT r.name INTO v_current_user_role
    FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = v_current_user_id;

    -- Check if role is protected
    SELECT protection_level INTO v_protection_level
    FROM protected_roles 
    WHERE role_id = NEW.id;

    -- Prevent modification of critical roles without admin permission
    IF v_protection_level = 'CRITICAL' AND v_current_user_role != 'Admin' THEN
        RAISE EXCEPTION 'ROLE_MODIFY_BLOCKED: Critical system role "%" cannot be modified. Admin permission required.', 
            OLD.name
            USING ERRCODE = 'P0005';
    END IF;

    -- Prevent changing role names for protected roles
    IF v_protection_level IN ('CRITICAL', 'IMPORTANT') AND OLD.name != NEW.name THEN
        IF v_current_user_role != 'Admin' THEN
            RAISE EXCEPTION 'ROLE_MODIFY_BLOCKED: Protected role name "%" cannot be changed. Admin permission required.', 
                OLD.name
                USING ERRCODE = 'P0006';
        END IF;
    END IF;

    -- Log the modification
    INSERT INTO change_log (
        table_name, 
        operation_type, 
        record_id, 
        old_values, 
        new_values,
        user_id
    ) VALUES (
        'roles',
        'UPDATE',
        NEW.id,
        jsonb_build_object(
            'name', OLD.name,
            'permissions', OLD.permissions,
            'is_subrole', OLD.is_subrole
        ),
        jsonb_build_object(
            'name', NEW.name,
            'permissions', NEW.permissions,
            'is_subrole', NEW.is_subrole
        ),
        v_current_user_id
    );

    RETURN NEW;
END;
$$;

-- Object 124/188
CREATE FUNCTION public.publish_all_pending_substitutions(p_school_id uuid, p_date date, p_user_id uuid DEFAULT NULL::uuid, p_notes jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_lesson RECORD;
  v_note text;
BEGIN
  -- Loop through all lessons with pending substitutions for the school and date
  FOR v_lesson IN
    SELECT cl.id AS lesson_id
    FROM course_lessons cl
    JOIN substitutions s ON s.original_lesson_id = cl.id
    WHERE cl.school_id = p_school_id
      AND cl.start_datetime::date = p_date
      AND s.status <> 'confirmed'
    GROUP BY cl.id
  LOOP
    -- For each lesson, try to find the note in p_notes (flat array of objects)
    IF p_notes IS NOT NULL THEN
      SELECT value->>'note'
      INTO v_note
      FROM jsonb_array_elements(p_notes) value
      WHERE value->>'lesson_id' = v_lesson.lesson_id::text
      LIMIT 1;
    ELSE
      v_note := NULL;
    END IF;

    -- For each lesson, finalize its substitutions with the found note
    PERFORM finalize_lesson_substitutions(
      v_lesson.lesson_id,
      p_user_id,
      v_note
    );
  END LOOP;
END;
$$;

-- Object 125/188
CREATE FUNCTION public.publish_schedule_draft_v2(_draft_id uuid, _school_id uuid, _published_by uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$DECLARE
    -- Published draft tracking
    v_draft_title text;
    v_draft_notes text;
    v_semester_id uuid;
    
    -- Original function variables
    draft_data jsonb;
    schedule jsonb;
    schedule_index integer := 0;
    total_schedules integer;
    staff_ids uuid[];
    v_course_id uuid;
    v_period_id uuid;
    v_day_id integer;
    raw_day_id integer;
    v_room_id uuid;
    v_start_time time;
    v_end_time time;
    start_block int;
    period_count integer := 1;
    start_date date := current_date;
    end_date date := current_date + interval '6 months';
    lesson_count integer;
    existing_schedule_id uuid;
    v_class_id uuid;
    v_subject_id uuid;
    v_meeting_name text;
    v_notes text;
    is_termin boolean;
    termin_subject_uuid uuid;
    v_primary_teacher_id uuid;
    
    -- Audit variables (declared but optional)
    v_schedule_count integer := 0;
    v_lesson_count integer := 0;
    v_error_msg text;
    expected_schedule record;
    expected_schedules_count integer;
    actual_schedules_count integer;
    expected_lessons_count integer;
    actual_lessons_count integer;
    
    -- Attendance transfer variables
    v_attendance_transfer_count integer := 0;
    v_old_lesson_id uuid;
    v_new_lesson_id uuid;
    attendance_record RECORD;

    -- Performance helpers
    v_rows_deleted integer := 0;
BEGIN
    -- Session-local timeouts for this run
    PERFORM set_config('statement_timeout', '0', true);
    PERFORM set_config('lock_timeout', '5s', true);

    -- Input validation
    IF _draft_id IS NULL OR _school_id IS NULL THEN
        RAISE EXCEPTION 'Draft ID and School ID are required';
    END IF;
    
    -- Check if draft exists and get metadata
    SELECT sd.title, sd.notes, sd.semester_id, sd.current_version
    INTO v_draft_title, v_draft_notes, v_semester_id, draft_data
    FROM public.schedule_drafts sd
    WHERE sd.id = _draft_id AND sd.school_id = _school_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Schedule draft not found: %', _draft_id;
    END IF;
    
    IF draft_data IS NULL THEN
        RAISE EXCEPTION 'Draft has no current version data';
    END IF;

    INSERT INTO debug_logs (step, message) VALUES 
        ('publish_start', 
         format('Starting publish of draft %s (%s) by user %s', 
                _draft_id, v_draft_title, coalesce(_published_by::text, 'system')));

    -- Find the UUID for the 'Termin' subject (case insensitive)
    SELECT id INTO termin_subject_uuid FROM subjects WHERE lower(name) = 'termin' LIMIT 1;

    -- Create temporary table to track new schedule keys
    CREATE TEMP TABLE temp_draft_keys (
        course_id uuid,
        subject_id uuid,
        class_id uuid,
        period_id uuid,
        day_id integer
    ) ON COMMIT DROP;

    -- Helpful temp indexes for NOT EXISTS checks
    CREATE INDEX ON temp_draft_keys (course_id, period_id, day_id);
    CREATE INDEX ON temp_draft_keys (subject_id, class_id, period_id, day_id);
        
    CREATE TEMP TABLE temp_lessons_to_transfer (
        old_lesson_id uuid,
        lesson_date date,
        class_id uuid,
        period_id uuid,
        day_id int,
        start_time time,
        end_time time,
        new_lesson_id uuid DEFAULT NULL
    ) ON COMMIT DROP;

    total_schedules := jsonb_array_length(draft_data);
    
    INSERT INTO debug_logs (step, message) VALUES 
        ('draft_processing', format('Processing %s schedule entries', total_schedules));

    -- PHASE 1: Process all schedule entries and create/update schedules
    WHILE schedule_index < total_schedules LOOP
        schedule := draft_data -> schedule_index;
        
        -- Reset variables for each iteration
        v_course_id := NULL;
        v_class_id := NULL;
        v_subject_id := NULL;
        v_meeting_name := NULL;
        v_notes := NULL;
        is_termin := false;
        
        -- Parse schedule entry
        IF schedule ? 'course_id' AND (schedule ->> 'course_id') IS NOT NULL THEN
            v_course_id := (schedule ->> 'course_id')::uuid;
            v_class_id := NULL;
            v_subject_id := NULL;
            is_termin := false;
        ELSE
            v_course_id := NULL;
            IF lower(schedule ->> 'subject_id') = 'termin' THEN
                is_termin := true;
                v_subject_id := termin_subject_uuid;
                v_class_id := NULL;
            ELSE
                is_termin := false;
                v_subject_id := NULLIF(schedule ->> 'subject_id', '')::uuid;
                v_class_id := NULLIF(schedule ->> 'class_id', '')::uuid;
            END IF;
        END IF;
        
        v_period_id := NULLIF(schedule ->> 'period_id', '')::uuid;
        raw_day_id := (schedule ->> 'day_id')::int;
        v_day_id := (raw_day_id + 6) % 7;

        IF jsonb_typeof(schedule -> 'room_id') = 'object' THEN
            v_room_id := (schedule -> 'room_id' ->> 'id')::uuid;
        ELSE
            v_room_id := NULLIF(schedule ->> 'room_id', '')::uuid;
        END IF;

        SELECT array_agg(value::uuid)
        INTO staff_ids
        FROM jsonb_array_elements_text(schedule -> 'staff_ids');
        staff_ids := coalesce(staff_ids, ARRAY[]::uuid[]);

        v_meeting_name := schedule ->> 'meeting_name';
        v_notes := schedule ->> 'notes';

        INSERT INTO debug_logs (message, step)
        VALUES (
            format(
                'Processing entry %s: course_id=%s, subject_id=%s, class_id=%s, period_id=%s, day_id=%s, is_termin=%s, meeting_name=%s',
                schedule_index,
                coalesce(v_course_id::text, 'NULL'),
                coalesce(v_subject_id::text, 'NULL'),
                coalesce(v_class_id::text, 'NULL'),
                coalesce(v_period_id::text, 'NULL'),
                raw_day_id,
                is_termin::text,
                coalesce(v_meeting_name, '')
            ),
            'entry_parse'
        );

        -- Skip if no teachers assigned
        IF array_length(staff_ids, 1) IS NULL OR array_length(staff_ids, 1) = 0 THEN
            INSERT INTO debug_logs (message, step)
            VALUES (
                format(
                    '⏭ Skipping schedule: course %s, period %s, day %s — no teachers assigned',
                    coalesce(v_course_id::text, 'NULL'),
                    coalesce(v_period_id::text, 'NULL'),
                    raw_day_id
                ),
                'no_teachers'
            );
            schedule_index := schedule_index + 1;
            CONTINUE;
        END IF;

        -- Get period details
        SELECT sp.block_number, sp.start_time, sp.end_time
        INTO start_block, v_start_time, v_end_time
        FROM public.schedule_periods sp
        WHERE sp.id = v_period_id;

        -- Track this schedule for cleanup purposes
        INSERT INTO temp_draft_keys (course_id, subject_id, class_id, period_id, day_id)
        VALUES (v_course_id, v_subject_id, v_class_id, v_period_id, raw_day_id);

        -- Check for existing schedule
        SELECT cs.id INTO existing_schedule_id
        FROM public.course_schedules cs
        WHERE cs.school_id = _school_id
          AND cs.period_id = v_period_id
          AND cs.day_id = raw_day_id
          AND (
            (v_course_id IS NOT NULL AND cs.course_id = v_course_id)
            OR
            (v_course_id IS NULL AND cs.course_id IS NULL AND cs.subject_id = v_subject_id AND cs.class_id IS NOT DISTINCT FROM v_class_id)
          )
        LIMIT 1;

        INSERT INTO debug_logs (message, step)
        VALUES (
            format('Matching schedule_id for entry %s: %s', schedule_index, coalesce(existing_schedule_id::text, 'NONE')),
            'match_check'
        );

        IF existing_schedule_id IS NOT NULL THEN
            -- Update existing schedule and unarchive if it was archived
            UPDATE public.course_schedules cs
            SET teacher_ids = staff_ids,
                room_id = v_room_id,
                start_time = v_start_time,
                end_time = v_end_time,
                meeting_name = CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                notes = CASE WHEN is_termin THEN v_notes ELSE NULL END,
                is_archived = false
            WHERE cs.id = existing_schedule_id;

            -- Update and unarchive future lessons for the schedule
            UPDATE public.course_lessons cl
            SET teacher_ids = staff_ids,
                room_id = v_room_id,
                meeting_name = CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                notes = CASE WHEN is_termin THEN v_notes ELSE NULL END,
                is_archived = false
            WHERE cl.schedule_id = existing_schedule_id
              AND cl.start_datetime >= current_date;

            INSERT INTO debug_logs (message, step)
            VALUES (
                format('🔁 Updated and unarchived schedule %s and its future lessons', coalesce(existing_schedule_id::text, 'NULL')),
                'update'
            );

        ELSE
            -- Create new schedule
            IF v_course_id IS NOT NULL THEN
                PERFORM * FROM public.create_schedule_and_generate_lessons(
                    v_course_id,
                    raw_day_id,
                    start_date,
                    end_date,
                    v_start_time,
                    v_end_time,
                    staff_ids,
                    v_room_id,
                    _school_id,
                    v_period_id,
                    period_count
                );
                GET DIAGNOSTICS lesson_count = ROW_COUNT;

                INSERT INTO debug_logs (message, step)
                VALUES (
                    format('🔁 Created %s lessons for new course schedule: course %s, period %s, day %s', 
                           lesson_count, coalesce(v_course_id::text, 'NULL'), coalesce(v_period_id::text, 'NULL'), raw_day_id),
                    'insert_course'
                );

            ELSE
                -- Insert school lesson schedule (explicitly unarchived)
                INSERT INTO public.course_schedules (
                    course_id, subject_id, class_id, day_id, start_date, end_date,
                    start_time, end_time, teacher_ids, room_id, school_id, period_id,
                    meeting_name, notes, is_archived
                )
                VALUES (
                    NULL, v_subject_id, v_class_id, raw_day_id, start_date, end_date,
                    v_start_time, v_end_time, staff_ids, v_room_id, _school_id, v_period_id,
                    CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                    CASE WHEN is_termin THEN v_notes ELSE NULL END,
                    false
                )
                RETURNING id INTO existing_schedule_id;

                -- Generate lessons for school lesson
                INSERT INTO public.course_lessons (
                    schedule_id, start_datetime, end_datetime, teacher_ids, room_id,
                    meeting_name, notes, school_id, subject_id, class_id
                )
                SELECT 
                    existing_schedule_id,
                    date_trunc('day', d) + v_start_time,
                    date_trunc('day', d) + v_end_time,
                    staff_ids,
                    v_room_id,
                    CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                    CASE WHEN is_termin THEN v_notes ELSE NULL END,
                    _school_id,
                    v_subject_id,
                    v_class_id
                FROM generate_series(start_date, end_date, '1 day'::interval) AS d
                WHERE extract(dow from d) = v_day_id;

                GET DIAGNOSTICS lesson_count = ROW_COUNT;

                INSERT INTO debug_logs (message, step)
                VALUES (
                    format('🔁 Created %s lessons for new school schedule: subject %s, class %s, period %s, day %s', 
                           lesson_count, coalesce(v_subject_id::text, 'NULL'), coalesce(v_class_id::text, 'NULL'), 
                           coalesce(v_period_id::text, 'NULL'), raw_day_id),
                    'insert_school'
                );
            END IF;
        END IF;

        schedule_index := schedule_index + 1;
    END LOOP;

    INSERT INTO debug_logs (message, step)
    VALUES ('Completed creating/updating schedules and lessons', 'schedules_complete');

    -- PHASE 2: Identify lessons that need attendance transfer
    INSERT INTO debug_logs (step, message) VALUES 
        ('attendance_transfer_start', 'Starting attendance transfer analysis');

    -- Find lessons with attendance that will be deleted
    INSERT INTO temp_lessons_to_transfer (old_lesson_id, lesson_date, class_id, period_id, day_id, start_time, end_time)
    SELECT DISTINCT cl.id, cl.start_datetime::date, cs.class_id, cs.period_id, cs.day_id, cl.start_datetime::time, cl.end_datetime::time
    FROM public.course_lessons cl
    JOIN public.course_schedules cs ON cs.id = cl.schedule_id
    WHERE cs.school_id = _school_id
      AND cl.start_datetime >= current_date
      AND EXISTS (
        SELECT 1 FROM student_attendance_logs sal
        WHERE sal.lesson_id = cl.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM temp_draft_keys dk
        WHERE
          (
            dk.course_id IS NOT NULL
            AND cs.course_id = dk.course_id
            AND cs.period_id = dk.period_id
            AND cs.day_id = dk.day_id
          )
          OR
          (
            dk.course_id IS NULL
            AND cs.course_id IS NULL
            AND cs.subject_id = dk.subject_id
            AND cs.class_id IS NOT DISTINCT FROM dk.class_id
            AND cs.period_id = dk.period_id
            AND cs.day_id = dk.day_id
          )
      );

    -- Attempt to find the new lesson for each old lesson
    UPDATE temp_lessons_to_transfer tlt
    SET new_lesson_id = l_new.id
    FROM public.course_lessons l_new
    JOIN public.course_schedules s_new ON l_new.schedule_id = s_new.id
    WHERE
        l_new.start_datetime::date = tlt.lesson_date
        AND l_new.start_datetime::time = tlt.start_time
        AND (l_new.end_datetime::time = tlt.end_time)
        AND s_new.class_id IS NOT DISTINCT FROM tlt.class_id
        AND s_new.period_id IS NOT DISTINCT FROM tlt.period_id
        AND s_new.day_id = tlt.day_id;

    UPDATE public.course_lessons old
    SET replaced_by_lesson_id = tlt.new_lesson_id
    FROM temp_lessons_to_transfer tlt
    WHERE old.id = tlt.old_lesson_id AND tlt.new_lesson_id IS NOT NULL;
    
    UPDATE public.course_lessons new
    SET replaces_lesson_id = tlt.old_lesson_id
    FROM temp_lessons_to_transfer tlt
    WHERE new.id = tlt.new_lesson_id AND tlt.old_lesson_id IS NOT NULL;

    -- Transfer attendance records to new lessons
    UPDATE student_attendance_logs sal
    SET lesson_id = tlt.new_lesson_id
    FROM temp_lessons_to_transfer tlt
    WHERE sal.lesson_id = tlt.old_lesson_id 
      AND tlt.new_lesson_id IS NOT NULL;

    GET DIAGNOSTICS v_attendance_transfer_count = ROW_COUNT;

    INSERT INTO debug_logs (step, message) VALUES 
        ('attendance_transfer_analysis', 
         format('Found %s lessons with attendance that need transfer', v_attendance_transfer_count));

    -- PHASE 5: Clean up outdated schedules and lessons
    INSERT INTO debug_logs (step, message) VALUES 
        ('cleanup_start', 'Starting cleanup of outdated schedules and lessons');

    -- Let planner know the temp table size after we populated it
    ANALYZE temp_draft_keys;

    -- Identify schedules that are NOT in the new draft
    CREATE TEMP TABLE temp_obsolete_schedules AS
    SELECT cs.id AS schedule_id
    FROM public.course_schedules cs
    WHERE cs.school_id = _school_id
      AND NOT EXISTS (
        SELECT 1 FROM temp_draft_keys dk
        WHERE
          (
            dk.course_id IS NOT NULL
            AND cs.course_id = dk.course_id
            AND cs.period_id = dk.period_id
            AND cs.day_id = dk.day_id
          )
          OR
          (
            dk.course_id IS NULL
            AND cs.course_id IS NULL
            AND cs.subject_id = dk.subject_id
            AND cs.class_id IS NOT DISTINCT FROM dk.class_id
            AND cs.period_id = dk.period_id
            AND cs.day_id = dk.day_id
          )
      );

    -- Index + analyze the temp list
    CREATE INDEX ON temp_obsolete_schedules (schedule_id);
    ANALYZE temp_obsolete_schedules;

    INSERT INTO debug_logs (step, message)
    SELECT 'cleanup_schedules_pending',
           format('Will clean schedule id=%s (not present in new draft)', schedule_id)
    FROM temp_obsolete_schedules;

    -- Delete FUTURE lessons for obsolete schedules that have no attendance, in batches
    LOOP
      WITH del AS (
        SELECT cl.id
        FROM public.course_lessons cl
        JOIN temp_obsolete_schedules tos ON cl.schedule_id = tos.schedule_id
        WHERE cl.start_datetime >= current_date
          AND NOT EXISTS (
            SELECT 1 FROM student_attendance_logs sal WHERE sal.lesson_id = cl.id
          )
        LIMIT 10000
      )
      DELETE FROM public.course_lessons cl
      USING del
      WHERE cl.id = del.id;

      GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
      EXIT WHEN v_rows_deleted = 0;
    END LOOP;

    INSERT INTO debug_logs (step, message)
    VALUES ('cleanup_lessons_deleted', 'Deleted future lessons without attendance for obsolete schedules');

    -- Log lessons we could not delete because attendance still exists
    INSERT INTO debug_logs (step, message)
    SELECT 
      'blocked_deletion_due_to_attendance',
      format('Lesson %s could not be deleted because attendance still exists', cl.id)
    FROM public.course_lessons cl
    JOIN temp_obsolete_schedules tos ON tos.schedule_id = cl.schedule_id
    WHERE cl.start_datetime >= current_date
      AND EXISTS (
        SELECT 1 FROM student_attendance_logs sal WHERE sal.lesson_id = cl.id
      );

    -- Now delete obsolete schedules that have no remaining lessons (past or future)
    DELETE FROM public.course_schedules cs
    USING temp_obsolete_schedules tos
    WHERE cs.id = tos.schedule_id
      AND NOT EXISTS (
        SELECT 1 FROM public.course_lessons cl WHERE cl.schedule_id = cs.id
      );

    INSERT INTO debug_logs (message, step)
    VALUES ('Deleted obsolete course_schedules with no remaining lessons', 'cleanup_schedules');

    -- Mark remaining obsolete schedules/lessons as archived
    UPDATE public.course_schedules cs
    SET is_archived = true
    WHERE cs.id IN (SELECT schedule_id FROM temp_obsolete_schedules)
      AND EXISTS (
        SELECT 1 FROM public.course_lessons cl WHERE cl.schedule_id = cs.id
      );

    UPDATE public.course_lessons cl
    SET is_archived = true
    WHERE cl.schedule_id IN (SELECT schedule_id FROM temp_obsolete_schedules)
      AND cl.start_datetime >= current_date
      AND EXISTS (
        SELECT 1 FROM public.student_attendance_logs sal
        WHERE sal.lesson_id = cl.id
      );

    INSERT INTO debug_logs (step, message)
    SELECT 
        'orphaned_attendance',
        format('Lesson %s still has attendance but no new lesson found', old_lesson_id)
    FROM temp_lessons_to_transfer
    WHERE new_lesson_id IS NULL;

    INSERT INTO debug_logs (message, step)
    VALUES ('Deleted/archived outdated schedules and lessons', 'cleanup_complete');

    -- PHASE 6: Finalize publication
    UPDATE public.schedule_drafts
    SET is_live = false
    WHERE school_id = _school_id;

    UPDATE public.schedule_drafts sd
    SET published_at = now(),
        updated_at = now(),
        is_live = true
    WHERE sd.id = _draft_id;

    INSERT INTO debug_logs (message, step)
    VALUES ('Draft published and marked as live', 'publish_complete');

    INSERT INTO debug_logs (step, message) VALUES 
        ('publish_success', 
         format('Successfully published draft %s with %s attendance transfers', 
                _draft_id, v_attendance_transfer_count));
   
    -- Extra safety archiving
    UPDATE public.course_schedules cs
    SET is_archived = true
    WHERE cs.school_id = _school_id
      AND NOT EXISTS (
        SELECT 1 FROM temp_draft_keys dk
        WHERE (
          dk.course_id IS NOT NULL
          AND cs.course_id = dk.course_id
          AND cs.period_id = dk.period_id
          AND cs.day_id = dk.day_id
        ) OR (
          dk.course_id IS NULL
          AND cs.course_id IS NULL
          AND cs.subject_id = dk.subject_id
          AND cs.class_id IS NOT DISTINCT FROM dk.class_id
          AND cs.period_id = dk.period_id
          AND cs.day_id = dk.day_id
        )
      )
      AND EXISTS (
        SELECT 1 FROM public.course_lessons cl
        WHERE cl.schedule_id = cs.id
      );

    UPDATE public.course_lessons cl
    SET is_archived = true
    WHERE cl.schedule_id IS NOT NULL
      AND cl.schedule_id NOT IN (
        SELECT cs.id FROM public.course_schedules cs
      )
      AND cl.start_datetime >= current_date
      AND EXISTS (
        SELECT 1 FROM public.student_attendance_logs sal
        WHERE sal.lesson_id = cl.id
      );

EXCEPTION
    WHEN OTHERS THEN
        v_error_msg := SQLERRM;
        INSERT INTO debug_logs (step, message) VALUES 
            ('publish_error', 
             format('Error publishing draft %s: %s', _draft_id, v_error_msg));
        RAISE;
END;$$;

-- Object 126/188
CREATE FUNCTION public."publish_schedule_draft_v2_Alt_new"(_draft_id uuid, _school_id uuid, _published_by uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$DECLARE
    -- Published draft tracking
    v_draft_title text;
    v_draft_notes text;
    v_semester_id uuid;
    
    -- Original function variables
    draft_data jsonb;
    schedule jsonb;
    schedule_index integer := 0;
    total_schedules integer;
    staff_ids uuid[];
    v_course_id uuid;
    v_period_id uuid;
    v_day_id integer;
    raw_day_id integer;
    v_room_id uuid;
    v_start_time time;
    v_end_time time;
    start_block int;
    period_count integer := 1;
    start_date date := current_date;
    end_date date := current_date + interval '6 months';
    lesson_count integer;
    existing_schedule_id uuid;
    v_class_id uuid;
    v_subject_id uuid;
    v_meeting_name text;
    v_notes text;
    is_termin boolean;
    termin_subject_uuid uuid;
    v_primary_teacher_id uuid;
    
    -- Audit variables
    v_schedule_count integer := 0;
    v_lesson_count integer := 0;
    v_error_msg text;
    expected_schedule record;
    
    -- Audit comparison tables
    expected_schedules_count integer;
    actual_schedules_count integer;
    expected_lessons_count integer;
    actual_lessons_count integer;
    
    -- Attendance transfer variables
    v_attendance_transfer_count integer := 0;
    v_old_lesson_id uuid;
    v_new_lesson_id uuid;
    attendance_record RECORD;
BEGIN
    -- Input validation
    IF _draft_id IS NULL OR _school_id IS NULL THEN
        RAISE EXCEPTION 'Draft ID and School ID are required';
    END IF;
    
    -- Check if draft exists and get metadata
    SELECT sd.title, sd.notes, sd.semester_id, sd.current_version
    INTO v_draft_title, v_draft_notes, v_semester_id, draft_data
    FROM public.schedule_drafts sd
    WHERE sd.id = _draft_id AND sd.school_id = _school_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Schedule draft not found: %', _draft_id;
    END IF;
    
    IF draft_data IS NULL THEN
        RAISE EXCEPTION 'Draft has no current version data';
    END IF;

    INSERT INTO debug_logs (step, message) VALUES 
        ('publish_start', 
         format('Starting publish of draft %s (%s) by user %s', 
                _draft_id, v_draft_title, coalesce(_published_by::text, 'system')));

    -- Find the UUID for the 'Termin' subject (case insensitive)
    SELECT id INTO termin_subject_uuid FROM subjects WHERE lower(name) = 'termin' LIMIT 1;

    -- Create temporary table to track new schedule keys
    CREATE TEMP TABLE temp_draft_keys (
        course_id uuid,
        subject_id uuid,
        class_id uuid,
        period_id uuid,
        day_id integer
    ) ON COMMIT DROP;
        
    CREATE TEMP TABLE temp_lessons_to_transfer (
        old_lesson_id uuid,
        lesson_date date,
        class_id uuid,
        period_id uuid,
        day_id int,
        start_time time,
        end_time time,
        new_lesson_id uuid DEFAULT NULL
    ) ON COMMIT DROP;

    total_schedules := jsonb_array_length(draft_data);
    
    INSERT INTO debug_logs (step, message) VALUES 
        ('draft_processing', format('Processing %s schedule entries', total_schedules));

    -- PHASE 1: Process all schedule entries and create/update schedules
    WHILE schedule_index < total_schedules LOOP
        schedule := draft_data -> schedule_index;
        
        -- Reset variables for each iteration
        v_course_id := NULL;
        v_class_id := NULL;
        v_subject_id := NULL;
        v_meeting_name := NULL;
        v_notes := NULL;
        is_termin := false;
        
        -- Parse schedule entry
        IF schedule ? 'course_id' AND (schedule ->> 'course_id') IS NOT NULL THEN
            v_course_id := (schedule ->> 'course_id')::uuid;
            v_class_id := NULL;
            v_subject_id := NULL;
            is_termin := false;
        ELSE
            v_course_id := NULL;
            IF lower(schedule ->> 'subject_id') = 'termin' THEN
                is_termin := true;
                v_subject_id := termin_subject_uuid;
                v_class_id := NULL;
            ELSE
                is_termin := false;
                v_subject_id := NULLIF(schedule ->> 'subject_id', '')::uuid;
                v_class_id := NULLIF(schedule ->> 'class_id', '')::uuid;
            END IF;
        END IF;
        
        v_period_id := NULLIF(schedule ->> 'period_id', '')::uuid;
        raw_day_id := (schedule ->> 'day_id')::int;
        v_day_id := (raw_day_id + 6) % 7;

        IF jsonb_typeof(schedule -> 'room_id') = 'object' THEN
            v_room_id := (schedule -> 'room_id' ->> 'id')::uuid;
        ELSE
            v_room_id := NULLIF(schedule ->> 'room_id', '')::uuid;
        END IF;

        SELECT array_agg(value::uuid)
        INTO staff_ids
        FROM jsonb_array_elements_text(schedule -> 'staff_ids');
        staff_ids := coalesce(staff_ids, ARRAY[]::uuid[]);

        v_meeting_name := schedule ->> 'meeting_name';
        v_notes := schedule ->> 'notes';

        INSERT INTO debug_logs (message, step)
        VALUES (
            format(
                'Processing entry %s: course_id=%s, subject_id=%s, class_id=%s, period_id=%s, day_id=%s, is_termin=%s, meeting_name=%s',
                schedule_index,
                coalesce(v_course_id::text, 'NULL'),
                coalesce(v_subject_id::text, 'NULL'),
                coalesce(v_class_id::text, 'NULL'),
                coalesce(v_period_id::text, 'NULL'),
                raw_day_id,
                is_termin::text,
                coalesce(v_meeting_name, '')
            ),
            'entry_parse'
        );

        -- Skip if no teachers assigned
        IF array_length(staff_ids, 1) IS NULL OR array_length(staff_ids, 1) = 0 THEN
            INSERT INTO debug_logs (message, step)
            VALUES (
                format(
                    '⏭ Skipping schedule: course %s, period %s, day %s — no teachers assigned',
                    coalesce(v_course_id::text, 'NULL'),
                    coalesce(v_period_id::text, 'NULL'),
                    raw_day_id
                ),
                'no_teachers'
            );
            schedule_index := schedule_index + 1;
            CONTINUE;
        END IF;

        -- Get period details
        SELECT sp.block_number, sp.start_time, sp.end_time
        INTO start_block, v_start_time, v_end_time
        FROM public.schedule_periods sp
        WHERE sp.id = v_period_id;

        -- Track this schedule for cleanup purposes
        INSERT INTO temp_draft_keys (course_id, subject_id, class_id, period_id, day_id)
        VALUES (v_course_id, v_subject_id, v_class_id, v_period_id, raw_day_id);

        -- Check for existing schedule
        SELECT cs.id INTO existing_schedule_id
        FROM public.course_schedules cs
        WHERE cs.school_id = _school_id
          AND cs.period_id = v_period_id
          AND cs.day_id = raw_day_id
          AND (
            (v_course_id IS NOT NULL AND cs.course_id = v_course_id)
            OR
            (v_course_id IS NULL AND cs.course_id IS NULL AND cs.subject_id = v_subject_id AND cs.class_id IS NOT DISTINCT FROM v_class_id)
          )
        LIMIT 1;

        INSERT INTO debug_logs (message, step)
        VALUES (
            format('Matching schedule_id for entry %s: %s', schedule_index, coalesce(existing_schedule_id::text, 'NONE')),
            'match_check'
        );

        IF existing_schedule_id IS NOT NULL THEN
            -- Update existing schedule
            UPDATE public.course_schedules cs
            SET teacher_ids = staff_ids,
                room_id = v_room_id,
                start_time = v_start_time,
                end_time = v_end_time,
                meeting_name = CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                notes = CASE WHEN is_termin THEN v_notes ELSE NULL END
            WHERE cs.id = existing_schedule_id;

            -- Update future lessons
            UPDATE public.course_lessons cl
            SET teacher_ids = staff_ids,
                room_id = v_room_id,
                meeting_name = CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                notes = CASE WHEN is_termin THEN v_notes ELSE NULL END
            WHERE cl.schedule_id = existing_schedule_id
              AND cl.start_datetime >= current_date;

            INSERT INTO debug_logs (message, step)
            VALUES (
                format('🔁 Updated schedule and lessons for schedule_id %s', coalesce(existing_schedule_id::text, 'NULL')),
                'update'
            );

        ELSE
            -- Create new schedule
            IF v_course_id IS NOT NULL THEN
                PERFORM * FROM public.create_schedule_and_generate_lessons(
                    v_course_id,
                    raw_day_id,
                    start_date,
                    end_date,
                    v_start_time,
                    v_end_time,
                    staff_ids,
                    v_room_id,
                    _school_id,
                    v_period_id,
                    period_count
                );
                GET DIAGNOSTICS lesson_count = ROW_COUNT;

                INSERT INTO debug_logs (message, step)
                VALUES (
                    format('🔁 Created %s lessons for new course schedule: course %s, period %s, day %s', 
                           lesson_count, coalesce(v_course_id::text, 'NULL'), coalesce(v_period_id::text, 'NULL'), raw_day_id),
                    'insert_course'
                );

            ELSE
                -- Insert school lesson schedule
                INSERT INTO public.course_schedules (
                    course_id, subject_id, class_id, day_id, start_date, end_date,
                    start_time, end_time, teacher_ids, room_id, school_id, period_id,
                    meeting_name, notes
                )
                VALUES (
                    NULL, v_subject_id, v_class_id, raw_day_id, start_date, end_date,
                    v_start_time, v_end_time, staff_ids, v_room_id, _school_id, v_period_id,
                    CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                    CASE WHEN is_termin THEN v_notes ELSE NULL END
                )
                RETURNING id INTO existing_schedule_id;

                -- Generate lessons for school lesson
INSERT INTO public.course_lessons (
    schedule_id, start_datetime, end_datetime, teacher_ids, room_id,
    meeting_name, notes, school_id, subject_id, class_id
)
SELECT 
    existing_schedule_id,
    date_trunc('day', d) + v_start_time,
    date_trunc('day', d) + v_end_time,
    staff_ids,
    v_room_id,
    CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
    CASE WHEN is_termin THEN v_notes ELSE NULL END,
    _school_id,
    v_subject_id,
    v_class_id
FROM generate_series(start_date, end_date, '1 day'::interval) AS d
WHERE extract(dow from d) = v_day_id;

                GET DIAGNOSTICS lesson_count = ROW_COUNT;

                INSERT INTO debug_logs (message, step)
                VALUES (
                    format('🔁 Created %s lessons for new school schedule: subject %s, class %s, period %s, day %s', 
                           lesson_count, coalesce(v_subject_id::text, 'NULL'), coalesce(v_class_id::text, 'NULL'), 
                           coalesce(v_period_id::text, 'NULL'), raw_day_id),
                    'insert_school'
                );
            END IF;
        END IF;

        schedule_index := schedule_index + 1;
    END LOOP;

    INSERT INTO debug_logs (message, step)
    VALUES ('Completed creating/updating schedules and lessons', 'schedules_complete');

    -- PHASE 2: Identify lessons that need attendance transfer
    INSERT INTO debug_logs (step, message) VALUES 
        ('attendance_transfer_start', 'Starting attendance transfer analysis');

    -- Find lessons with attendance that will be deleted
    INSERT INTO temp_lessons_to_transfer (old_lesson_id, lesson_date, class_id, period_id, day_id, start_time, end_time)
    SELECT DISTINCT cl.id, cl.start_datetime::date, cs.class_id, cs.period_id, cs.day_id, cl.start_datetime::time, cl.end_datetime::time
    FROM public.course_lessons cl
    JOIN public.course_schedules cs ON cs.id = cl.schedule_id
    WHERE cs.school_id = _school_id
      AND cl.start_datetime >= current_date
      AND EXISTS (
        SELECT 1 FROM student_attendance_logs sal
        WHERE sal.lesson_id = cl.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM temp_draft_keys dk
        WHERE
          (
            dk.course_id IS NOT NULL
            AND cs.course_id = dk.course_id
            AND cs.period_id = dk.period_id
            AND cs.day_id = dk.day_id
          )
          OR
          (
            dk.course_id IS NULL
            AND cs.course_id IS NULL
            AND cs.subject_id = dk.subject_id
            AND cs.class_id IS NOT DISTINCT FROM dk.class_id
            AND cs.period_id = dk.period_id
            AND cs.day_id = dk.day_id
          )
      );


    -- Attempt to find the new lesson for each old lesson by matching date, class, period, and day_id
    UPDATE temp_lessons_to_transfer tlt
    SET new_lesson_id = l_new.id
    FROM public.course_lessons l_new
    JOIN public.course_schedules s_new ON l_new.schedule_id = s_new.id
    WHERE
        l_new.start_datetime::date = tlt.lesson_date
        AND l_new.start_datetime::time = tlt.start_time          -- match start time!
        AND (l_new.end_datetime::time = tlt.end_time)         -- (optional) match end time too
        AND s_new.class_id IS NOT DISTINCT FROM tlt.class_id
        AND s_new.period_id IS NOT DISTINCT FROM tlt.period_id
        AND s_new.day_id = tlt.day_id;


    UPDATE public.course_lessons old
    SET replaced_by_lesson_id = tlt.new_lesson_id
    FROM temp_lessons_to_transfer tlt
    WHERE old.id = tlt.old_lesson_id AND tlt.new_lesson_id IS NOT NULL;
    
    UPDATE public.course_lessons new
    SET replaces_lesson_id = tlt.old_lesson_id
    FROM temp_lessons_to_transfer tlt
    WHERE new.id = tlt.new_lesson_id AND tlt.old_lesson_id IS NOT NULL;

    -- Transfer attendance records to new lessons
    UPDATE student_attendance_logs sal
    SET lesson_id = tlt.new_lesson_id
    FROM temp_lessons_to_transfer tlt
    WHERE sal.lesson_id = tlt.old_lesson_id 
      AND tlt.new_lesson_id IS NOT NULL;

    GET DIAGNOSTICS v_attendance_transfer_count = ROW_COUNT;

    INSERT INTO debug_logs (step, message) VALUES 
        ('attendance_transfer_analysis', 
         format('Found %s lessons with attendance that need transfer', v_attendance_transfer_count));

    -- PHASE 5: Clean up outdated schedules and lessons
    INSERT INTO debug_logs (step, message) VALUES 
        ('cleanup_start', 'Starting cleanup of outdated schedules and lessons');

    -- Identify schedules that are NOT in the new draft
    CREATE TEMP TABLE temp_obsolete_schedules AS
    SELECT cs.id AS schedule_id
    FROM public.course_schedules cs
    WHERE cs.school_id = _school_id
      AND NOT EXISTS (
        SELECT 1 FROM temp_draft_keys dk
        WHERE
          (
            dk.course_id IS NOT NULL
            AND cs.course_id = dk.course_id
            AND cs.period_id = dk.period_id
            AND cs.day_id = dk.day_id
          )
          OR
          (
            dk.course_id IS NULL
            AND cs.course_id IS NULL
            AND cs.subject_id = dk.subject_id
            AND cs.class_id IS NOT DISTINCT FROM dk.class_id
            AND cs.period_id = dk.period_id
            AND cs.day_id = dk.day_id
          )
      );

    INSERT INTO debug_logs (step, message)
    SELECT 'cleanup_schedules_pending',
           format('Will clean schedule id=%s (not present in new draft)', schedule_id)
    FROM temp_obsolete_schedules;

    -- First delete FUTURE lessons for obsolete schedules that have no attendance
    DELETE FROM public.course_lessons cl
    USING temp_obsolete_schedules tos
    WHERE cl.schedule_id = tos.schedule_id
      AND cl.start_datetime >= current_date
      AND NOT EXISTS (
        SELECT 1 FROM student_attendance_logs sal WHERE sal.lesson_id = cl.id
      );

    INSERT INTO debug_logs (step, message)
    VALUES ('cleanup_lessons_deleted', 'Deleted future lessons without attendance for obsolete schedules');

    -- Log lessons we could not delete because attendance still exists and no new lesson was found
    INSERT INTO debug_logs (step, message)
    SELECT 
      'blocked_deletion_due_to_attendance',
      format('Lesson %s could not be deleted because attendance still exists', cl.id)
    FROM public.course_lessons cl
    JOIN temp_obsolete_schedules tos ON tos.schedule_id = cl.schedule_id
    WHERE cl.start_datetime >= current_date
      AND EXISTS (
        SELECT 1 FROM student_attendance_logs sal WHERE sal.lesson_id = cl.id
      );

    -- Now delete obsolete schedules that have no remaining lessons (past or future)
    DELETE FROM public.course_schedules cs
    USING temp_obsolete_schedules tos
    WHERE cs.id = tos.schedule_id
      AND NOT EXISTS (
        SELECT 1 FROM public.course_lessons cl WHERE cl.schedule_id = cs.id
      );

    INSERT INTO debug_logs (message, step)
    VALUES ('Deleted obsolete course_schedules with no remaining lessons', 'cleanup_schedules');

    -- Mark remaining obsolete schedules/lessons as archived (e.g., those with past lessons or future lessons holding attendance)
    UPDATE public.course_schedules cs
    SET is_archived = true
    WHERE cs.id IN (SELECT schedule_id FROM temp_obsolete_schedules)
      AND EXISTS (
        SELECT 1 FROM public.course_lessons cl WHERE cl.schedule_id = cs.id
      );

    UPDATE public.course_lessons cl
    SET is_archived = true
    WHERE cl.schedule_id IN (SELECT schedule_id FROM temp_obsolete_schedules)
      AND cl.start_datetime >= current_date
      AND EXISTS (
        SELECT 1 FROM student_attendance_logs sal WHERE sal.lesson_id = cl.id
      );

    INSERT INTO debug_logs (step, message)
    SELECT 
        'orphaned_attendance',
        format('Lesson %s still has attendance but no new lesson found', old_lesson_id)
    FROM temp_lessons_to_transfer
    WHERE new_lesson_id IS NULL;

    INSERT INTO debug_logs (message, step)
    VALUES ('Deleted/archived outdated schedules and lessons', 'cleanup_complete');

    -- PHASE 6: Finalize publication
    UPDATE public.schedule_drafts
    SET is_live = false
    WHERE school_id = _school_id;

    UPDATE public.schedule_drafts sd
    SET published_at = now(),
        updated_at = now(),
        is_live = true
    WHERE sd.id = _draft_id;

    INSERT INTO debug_logs (message, step)
    VALUES ('Draft published and marked as live', 'publish_complete');

    INSERT INTO debug_logs (step, message) VALUES 
        ('publish_success', 
         format('Successfully published draft %s with %s attendance transfers', 
                _draft_id, v_attendance_transfer_count));
   
    UPDATE public.course_schedules cs
    SET is_archived = true
    WHERE cs.school_id = _school_id
      AND NOT EXISTS (
        SELECT 1 FROM temp_draft_keys dk
        WHERE (
          dk.course_id IS NOT NULL
          AND cs.course_id = dk.course_id
          AND cs.period_id = dk.period_id
          AND cs.day_id = dk.day_id
        ) OR (
          dk.course_id IS NULL
          AND cs.course_id IS NULL
          AND cs.subject_id = dk.subject_id
          AND cs.class_id IS NOT DISTINCT FROM dk.class_id
          AND cs.period_id = dk.period_id
          AND cs.day_id = dk.day_id
        )
      )
      AND EXISTS (
        SELECT 1 FROM public.course_lessons cl
        WHERE cl.schedule_id = cs.id
      );

    UPDATE public.course_lessons cl
    SET is_archived = true
    WHERE cl.schedule_id IS NOT NULL
      AND cl.schedule_id NOT IN (
        SELECT cs.id FROM public.course_schedules cs
      )
      AND cl.start_datetime >= current_date
      AND EXISTS (
        SELECT 1 FROM student_attendance_logs sal
        WHERE sal.lesson_id = cl.id
      );

EXCEPTION
    WHEN OTHERS THEN
        v_error_msg := SQLERRM;
        INSERT INTO debug_logs (step, message) VALUES 
            ('publish_error', 
             format('Error publishing draft %s: %s', _draft_id, v_error_msg));
        RAISE;
END;$$;

-- Object 127/188
CREATE FUNCTION public.publish_schedule_draft_v2_alt(_draft_id uuid, _school_id uuid, _published_by uuid DEFAULT auth.uid()) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$DECLARE
    -- Published draft tracking
    v_published_draft_id uuid;
    v_draft_title text;
    v_draft_notes text;
    v_semester_id uuid;
    
    -- Original function variables
    draft_data jsonb;
    schedule jsonb;
    schedule_index integer := 0;
    total_schedules integer;
    staff_ids uuid[];
    v_course_id uuid;
    v_period_id uuid;
    v_day_id integer;
    raw_day_id integer;
    v_room_id uuid;
    v_start_time time;
    v_end_time time;
    start_block int;
    period_count integer := 1;
    start_date date := current_date;
    end_date date := current_date + interval '6 months';
    lesson_count integer;
    existing_schedule_id uuid;
    v_class_id uuid;
    v_subject_id uuid;
    v_meeting_name text;
    v_notes text;
    is_termin boolean;
    termin_subject_uuid uuid;
    v_primary_teacher_id uuid;
    
    -- Audit variables
    v_schedule_count integer := 0;
    v_lesson_count integer := 0;
    v_error_msg text;
    expected_schedule record;
    
    -- Audit comparison tables
    expected_schedules_count integer;
    actual_schedules_count integer;
    expected_lessons_count integer;
    actual_lessons_count integer;
BEGIN
    -- Input validation
    IF _draft_id IS NULL OR _school_id IS NULL THEN
        RAISE EXCEPTION 'Draft ID and School ID are required';
    END IF;
    
    IF _published_by IS NULL THEN
        RAISE EXCEPTION 'Published by user ID is required';
    END IF;
    
    -- Check if draft exists and get metadata
    SELECT sd.title, sd.notes, sd.semester_id, sd.current_version
    INTO v_draft_title, v_draft_notes, v_semester_id, draft_data
    FROM public.schedule_drafts sd
    WHERE sd.id = _draft_id AND sd.school_id = _school_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Schedule draft not found: %', _draft_id;
    END IF;
    
    IF draft_data IS NULL THEN
        RAISE EXCEPTION 'Draft has no current version data';
    END IF;
    
    -- Check if there's already a successful publish for this draft
    IF EXISTS (
        SELECT 1 FROM public.published_drafts pd 
        WHERE pd.draft_id = _draft_id AND pd.status = 'success'
    ) THEN
        RAISE EXCEPTION 'Draft has already been successfully published';
    END IF;
    
    -- Check if there are existing publications for this semester (for logging)
    IF EXISTS (
        SELECT 1 FROM public.schedule_drafts sd2
        JOIN public.published_drafts pd2 ON sd2.id = pd2.draft_id
        WHERE sd2.school_id = _school_id 
        AND sd2.semester_id = v_semester_id 
        AND sd2.id != _draft_id
        AND pd2.status = 'success'
    ) THEN
        INSERT INTO debug_logs (message, step)
        VALUES (
            format('Republishing: Found existing publications for semester %s, will replace schedules', v_semester_id),
            'publish_republish'
        );
    END IF;
    
    -- Create published_draft record
    INSERT INTO public.published_drafts (
        draft_id, school_id, semester_id, published_by, title, notes, 
        draft_data, status
    ) VALUES (
        _draft_id, _school_id, v_semester_id, _published_by, v_draft_title, v_draft_notes,
        draft_data, 'in_progress'
    ) RETURNING id INTO v_published_draft_id;
    
    -- Log start of publish attempt
    INSERT INTO debug_logs (message, step)
    VALUES (
        format('Starting publish_schedule_draft_v2 for draft %s by user %s, published_draft_id %s', 
               _draft_id, _published_by, v_published_draft_id),
        'publish_start'
    );
    
    -- Find the UUID for the 'Termin' subject (case insensitive)
    SELECT id INTO termin_subject_uuid FROM subjects WHERE lower(name) = 'termin' LIMIT 1;
    
    -- Create temporary table for tracking expected schedules
    CREATE TEMP TABLE temp_expected_schedules (
        course_id uuid,
        subject_id uuid,
        class_id uuid,
        period_id uuid,
        day_id integer,
        primary_teacher_id uuid,
        room_id uuid,
        start_time time,
        end_time time,
        meeting_name text,
        notes text
    ) ON COMMIT DROP;
    
    -- Parse draft data and populate expected schedules
    total_schedules := jsonb_array_length(draft_data);
    
    WHILE schedule_index < total_schedules LOOP
        schedule := draft_data -> schedule_index;
        
        -- Parse schedule data (reusing original logic)
        IF schedule ? 'course_id' AND (schedule ->> 'course_id') IS NOT NULL THEN
            v_course_id := (schedule ->> 'course_id')::uuid;
            v_class_id := NULL;
            v_subject_id := NULL;
            is_termin := false;
        ELSE
            v_course_id := NULL;
            IF lower(schedule ->> 'subject_id') = 'termin' THEN
                is_termin := true;
                v_subject_id := termin_subject_uuid;
                v_class_id := NULL;
            ELSE
                is_termin := false;
                v_subject_id := NULLIF(schedule ->> 'subject_id', '')::uuid;
                v_class_id := NULLIF(schedule ->> 'class_id', '')::uuid;
            END IF;
        END IF;
        
        v_period_id := NULLIF(schedule ->> 'period_id', '')::uuid;
        raw_day_id := (schedule ->> 'day_id')::int;
        v_day_id := (raw_day_id + 6) % 7;
        
        IF jsonb_typeof(schedule -> 'room_id') = 'object' THEN
            v_room_id := (schedule -> 'room_id' ->> 'id')::uuid;
        ELSE
            v_room_id := NULLIF(schedule ->> 'room_id', '')::uuid;
        END IF;
        
        SELECT array_agg(value::uuid)
        INTO staff_ids
        FROM jsonb_array_elements_text(schedule -> 'staff_ids');
        staff_ids := coalesce(staff_ids, ARRAY[]::uuid[]);
        
        -- Set primary teacher as first teacher in the array
        v_primary_teacher_id := NULL;
        IF array_length(staff_ids, 1) > 0 THEN
            v_primary_teacher_id := staff_ids[1];
        END IF;
        
        v_meeting_name := schedule ->> 'meeting_name';
        v_notes := schedule ->> 'notes';
        
        IF array_length(staff_ids, 1) IS NULL OR array_length(staff_ids, 1) = 0 THEN
            INSERT INTO debug_logs (message, step)
            VALUES (
                format('No teachers assigned for schedule entry %s: publishing anyway', schedule_index),
                'publish_no_teachers'
            );
            -- staff_ids will be empty, v_primary_teacher_id will be NULL
        END IF;
        
        -- Get time information
        SELECT sp.block_number, sp.start_time, sp.end_time
        INTO start_block, v_start_time, v_end_time
        FROM public.schedule_periods sp
        WHERE sp.id = v_period_id;
        
        -- Store expected schedule data
        INSERT INTO temp_expected_schedules (
            course_id, subject_id, class_id, period_id, day_id, primary_teacher_id,
            room_id, start_time, end_time, meeting_name, notes
        ) VALUES (
            v_course_id, v_subject_id, v_class_id, v_period_id, raw_day_id, v_primary_teacher_id,
            v_room_id, v_start_time, v_end_time, v_meeting_name, v_notes
        );
        
        schedule_index := schedule_index + 1;
    END LOOP;
    
    -- Get expected count
    SELECT COUNT(*) INTO expected_schedules_count FROM temp_expected_schedules;
    
    -- Now execute the original publish logic with modifications
    -- Reset index for actual processing
    schedule_index := 0;
    
    WHILE schedule_index < total_schedules LOOP
        schedule := draft_data -> schedule_index;
        
        -- Reparse data (same logic as before)
        IF schedule ? 'course_id' AND (schedule ->> 'course_id') IS NOT NULL THEN
            v_course_id := (schedule ->> 'course_id')::uuid;
            v_class_id := NULL;
            v_subject_id := NULL;
            is_termin := false;
        ELSE
            v_course_id := NULL;
            IF lower(schedule ->> 'subject_id') = 'termin' THEN
                is_termin := true;
                v_subject_id := termin_subject_uuid;
                v_class_id := NULL;
            ELSE
                is_termin := false;
                v_subject_id := NULLIF(schedule ->> 'subject_id', '')::uuid;
                v_class_id := NULLIF(schedule ->> 'class_id', '')::uuid;
            END IF;
        END IF;
        
        v_period_id := NULLIF(schedule ->> 'period_id', '')::uuid;
        raw_day_id := (schedule ->> 'day_id')::int;
        v_day_id := (raw_day_id + 6) % 7;
        
        IF jsonb_typeof(schedule -> 'room_id') = 'object' THEN
            v_room_id := (schedule -> 'room_id' ->> 'id')::uuid;
        ELSE
            v_room_id := NULLIF(schedule ->> 'room_id', '')::uuid;
        END IF;
        
        SELECT array_agg(value::uuid)
        INTO staff_ids
        FROM jsonb_array_elements_text(schedule -> 'staff_ids');
        staff_ids := coalesce(staff_ids, ARRAY[]::uuid[]);
        
        -- Set primary teacher
        v_primary_teacher_id := NULL;
        IF array_length(staff_ids, 1) > 0 THEN
            v_primary_teacher_id := staff_ids[1];
        END IF;
        
        v_meeting_name := schedule ->> 'meeting_name';
        v_notes := schedule ->> 'notes';
        
        IF array_length(staff_ids, 1) IS NULL OR array_length(staff_ids, 1) = 0 THEN
            INSERT INTO debug_logs (message, step)
            VALUES (
                format('No teachers assigned for schedule entry %s: publishing anyway', schedule_index),
                'publish_no_teachers'
            );
            -- staff_ids will be empty, v_primary_teacher_id will be NULL
        END IF;
        
        -- Get period times
        SELECT sp.block_number, sp.start_time, sp.end_time
        INTO start_block, v_start_time, v_end_time
        FROM public.schedule_periods sp
        WHERE sp.id = v_period_id;
        
        -- Find existing schedule
        SELECT cs.id INTO existing_schedule_id
        FROM public.course_schedules cs
        WHERE cs.school_id = _school_id
          AND cs.period_id = v_period_id
          AND cs.day_id = raw_day_id
          AND (
            (v_course_id IS NOT NULL AND cs.course_id = v_course_id)
            OR
            (v_course_id IS NULL AND cs.course_id IS NULL AND cs.subject_id = v_subject_id AND cs.class_id IS NOT DISTINCT FROM v_class_id)
          )
        LIMIT 1;
        
        IF existing_schedule_id IS NOT NULL THEN
            -- Update existing schedule with published_draft_id and primary_teacher_id
            UPDATE public.course_schedules cs
            SET teacher_ids = staff_ids,
                room_id = v_room_id,
                start_time = v_start_time,
                end_time = v_end_time,
                meeting_name = CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                notes = v_notes,
                published_draft_id = v_published_draft_id,
                primary_teacher_id = v_primary_teacher_id
            WHERE cs.id = existing_schedule_id;
            
            v_schedule_count := v_schedule_count + 1;
            
            -- Delete existing lessons from current date forward
            DELETE FROM public.course_lessons cl
            WHERE cl.schedule_id = existing_schedule_id
              AND cl.start_datetime >= current_date;
            
            -- Generate new lessons with published_draft_id and primary_teacher_id
            INSERT INTO public.course_lessons (
                course_id, subject_id, class_id, schedule_id, start_datetime, end_datetime,
                school_id, teacher_ids, room_id, period_id, period_ids, is_lesson_based,
                meeting_name, published_draft_id, primary_teacher_id
            )
            SELECT
                v_course_id, v_subject_id, v_class_id, existing_schedule_id,
                gs::date + v_start_time,
                gs::date + v_end_time,
                _school_id, staff_ids, v_room_id,
                v_period_id, ARRAY[v_period_id], true,
                CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                v_published_draft_id, v_primary_teacher_id
            FROM generate_series(start_date, end_date, '1 day'::interval) AS gs
            WHERE EXTRACT(ISODOW FROM gs) = v_day_id;
            
            GET DIAGNOSTICS lesson_count = ROW_COUNT;
            v_lesson_count := v_lesson_count + lesson_count;
            
        ELSE
            -- Create new schedule with published_draft_id and primary_teacher_id
            INSERT INTO public.course_schedules (
                course_id, subject_id, class_id, day_id, start_date, end_date,
                start_time, end_time, teacher_ids, room_id, school_id, period_id,
                meeting_name, notes, published_draft_id, primary_teacher_id
            )
            VALUES (
                v_course_id, v_subject_id, v_class_id, raw_day_id, start_date, end_date,
                v_start_time, v_end_time, staff_ids, v_room_id, _school_id, v_period_id,
                CASE WHEN is_termin THEN v_meeting_name ELSE NULL END, v_notes,
                v_published_draft_id, v_primary_teacher_id
            )
            RETURNING id INTO existing_schedule_id;
            
            v_schedule_count := v_schedule_count + 1;
            
            -- Generate lessons for new schedule
            INSERT INTO public.course_lessons (
                course_id, subject_id, class_id, schedule_id, start_datetime, end_datetime,
                school_id, teacher_ids, room_id, period_id, period_ids, is_lesson_based,
                meeting_name, published_draft_id, primary_teacher_id
            )
            SELECT
                v_course_id, v_subject_id, v_class_id, existing_schedule_id,
                gs::date + v_start_time,
                gs::date + v_end_time,
                _school_id, staff_ids, v_room_id,
                v_period_id, ARRAY[v_period_id], true,
                CASE WHEN is_termin THEN v_meeting_name ELSE NULL END,
                v_published_draft_id, v_primary_teacher_id
            FROM generate_series(start_date, end_date, '1 day'::interval) AS gs
            WHERE EXTRACT(ISODOW FROM gs) = v_day_id;
            
            GET DIAGNOSTICS lesson_count = ROW_COUNT;
            v_lesson_count := v_lesson_count + lesson_count;
        END IF;
        
        schedule_index := schedule_index + 1;
    END LOOP;
    
    -- Cleanup: Delete schedules not in the new draft, including from previous publications for this semester
    DELETE FROM public.course_schedules cs
    WHERE cs.school_id = _school_id
      AND (
        -- Delete old unpublished schedules
        cs.published_draft_id IS NULL
        OR
        -- Delete schedules from previous publications for this semester (allow republishing)
        cs.published_draft_id IN (
          SELECT pd.id FROM public.published_drafts pd 
          JOIN public.schedule_drafts sd ON pd.draft_id = sd.id
          WHERE sd.school_id = _school_id 
          AND sd.semester_id = v_semester_id 
          AND pd.id != v_published_draft_id
          AND pd.status = 'success'
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM temp_expected_schedules tes
        WHERE (
          (tes.course_id IS NOT NULL AND cs.course_id = tes.course_id AND cs.period_id = tes.period_id AND cs.day_id = tes.day_id)
          OR
          (tes.course_id IS NULL AND cs.course_id IS NULL AND cs.subject_id = tes.subject_id AND cs.class_id IS NOT DISTINCT FROM tes.class_id AND cs.period_id = tes.period_id AND cs.day_id = tes.day_id)
        )
      );
    
    -- Cleanup: Delete orphaned lessons and lessons from previous publications for this semester
    DELETE FROM public.course_lessons cl
    WHERE (
        -- Delete orphaned lessons (schedule no longer exists)
        (cl.schedule_id IS NOT NULL
         AND cl.schedule_id NOT IN (SELECT cs.id FROM public.course_schedules cs)
         AND cl.start_datetime >= current_date)
        OR
        -- Delete lessons from previous publications for this semester (allow republishing)
        (cl.published_draft_id IN (
          SELECT pd.id FROM public.published_drafts pd 
          JOIN public.schedule_drafts sd ON pd.draft_id = sd.id
          WHERE sd.school_id = _school_id 
          AND sd.semester_id = v_semester_id 
          AND pd.id != v_published_draft_id
          AND pd.status = 'success'
        ))
      )
      AND NOT EXISTS (
        SELECT 1 FROM student_attendance_logs sal WHERE sal.lesson_id = cl.id
      );
    
    -- AUDIT PHASE: Validate the results
    SELECT COUNT(*) INTO actual_schedules_count 
    FROM public.course_schedules cs 
    WHERE cs.published_draft_id = v_published_draft_id;
    
    SELECT COUNT(*) INTO actual_lessons_count 
    FROM public.course_lessons cl 
    WHERE cl.published_draft_id = v_published_draft_id;
    
    -- Basic count validation
    IF actual_schedules_count != expected_schedules_count THEN
        v_error_msg := format('Schedule count mismatch: expected %s, got %s', 
                             expected_schedules_count, actual_schedules_count);
        RAISE EXCEPTION '%', v_error_msg;
    END IF;
    
    -- Detailed business field validation
    -- Check that all expected schedules were created with correct business data
    FOR expected_schedule IN 
        SELECT * FROM temp_expected_schedules
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.course_schedules cs
            WHERE cs.published_draft_id = v_published_draft_id
              AND cs.course_id IS NOT DISTINCT FROM expected_schedule.course_id
              AND cs.subject_id IS NOT DISTINCT FROM expected_schedule.subject_id
              AND cs.class_id IS NOT DISTINCT FROM expected_schedule.class_id
              AND cs.period_id = expected_schedule.period_id
              AND cs.day_id = expected_schedule.day_id
              AND cs.primary_teacher_id IS NOT DISTINCT FROM expected_schedule.primary_teacher_id
              AND cs.room_id IS NOT DISTINCT FROM expected_schedule.room_id
              AND cs.start_time = expected_schedule.start_time
              AND cs.end_time = expected_schedule.end_time
              AND cs.meeting_name IS NOT DISTINCT FROM expected_schedule.meeting_name
              AND cs.notes IS NOT DISTINCT FROM expected_schedule.notes
        ) THEN
            v_error_msg := format('Missing or incorrect schedule: course_id=%s, subject_id=%s, class_id=%s, period_id=%s, day_id=%s',
                                 expected_schedule.course_id, expected_schedule.subject_id, expected_schedule.class_id, expected_schedule.period_id, expected_schedule.day_id);
            RAISE EXCEPTION '%', v_error_msg;
        END IF;
    END LOOP;
    
    -- Update published_draft record with success
    UPDATE public.published_drafts 
    SET status = 'success',
        schedule_count = v_schedule_count,
        lesson_count = v_lesson_count,
        updated_at = now()
    WHERE id = v_published_draft_id;
    
    -- Update schedule_drafts
    UPDATE public.schedule_drafts
    SET is_live = false
    WHERE school_id = _school_id;
    
    UPDATE public.schedule_drafts
    SET published_at = now(),
        updated_at = now(),
        is_live = true
    WHERE id = _draft_id;
    
    -- Log successful completion
    INSERT INTO debug_logs (message, step)
    VALUES (
        format('Successfully published draft %s: created %s schedules, %s lessons, published_draft_id %s',
               _draft_id, v_schedule_count, v_lesson_count, v_published_draft_id),
        'publish_success'
    );
    
    RETURN v_published_draft_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        v_error_msg := SQLERRM;
        INSERT INTO debug_logs (message, step)
        VALUES (
            format('Publish failed for draft %s: %s', _draft_id, v_error_msg),
            'publish_error'
        );
        
        -- Update published_draft record with failure
        UPDATE public.published_drafts 
        SET status = 'failed',
            error_message = v_error_msg,
            updated_at = now()
        WHERE id = v_published_draft_id;
        
        -- Re-raise the exception to trigger rollback
        RAISE;
END;$$;

-- Object 128/188
CREATE FUNCTION public.refresh_user_login_profiles() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.vwm_user_login_profiles;
  RETURN NULL;
END;
$$;

-- Object 129/188
CREATE FUNCTION public.remove_student_from_family(target_student_profile_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  auth_user uuid := auth.uid();
  school_id uuid;
  current_family_id uuid;
  num_siblings int;
  before_data jsonb;
BEGIN
  -- Get school_id of student
  SELECT up.school_id INTO school_id
  FROM user_profiles up
  WHERE up.id = target_student_profile_id;

  -- Get current family_id
  SELECT fm.family_id INTO current_family_id
  FROM family_members fm
  WHERE fm.profile_id = target_student_profile_id
    AND fm.role = 'student'
    AND fm.removed_at IS NULL;

  IF current_family_id IS NULL THEN
    RAISE EXCEPTION 'This student is not currently assigned to any family.';
  END IF;

  -- Count number of active student family members
  SELECT COUNT(*) INTO num_siblings
  FROM family_members fm
  WHERE fm.family_id = current_family_id
    AND fm.role = 'student'
    AND fm.removed_at IS NULL;

  IF num_siblings <= 1 THEN
    RAISE EXCEPTION 'This is the only student in the family. The entire family should be deleted instead.';
  END IF;

  -- Capture current row as JSON before deletion
  SELECT to_jsonb(fm.*) INTO before_data
  FROM family_members fm
  WHERE fm.profile_id = target_student_profile_id
    AND fm.role = 'student'
    AND fm.removed_at IS NULL;

  -- Hard-delete the family membership
  DELETE FROM family_members
  WHERE profile_id = target_student_profile_id
    AND role = 'student'
    AND removed_at IS NULL;

  -- Insert into change_log
  INSERT INTO change_log (
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    before_data
  ) VALUES (
    auth_user,
    school_id,
    'family_members',
    target_student_profile_id,
    'hard_delete',
    before_data
  );
END;
$$;

-- Object 130/188
CREATE FUNCTION public.remove_user_from_group() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_group_id uuid;
  group_name text;
BEGIN
  -- Get the group name based on the old role_id
  SELECT name INTO group_name FROM public.roles WHERE id = OLD.role_id;

  -- Get the group ID
  SELECT id INTO v_group_id FROM public.user_groups WHERE name = group_name;

  -- Check if the user exists in the group before deleting
  RAISE NOTICE 'Checking if user exists in group: %', v_group_id;

  -- Remove the user from the group
  DELETE FROM public.user_group_members
  WHERE user_id = OLD.user_profile_id AND group_id = v_group_id;

  -- Debugging output for DELETE operation
  RAISE NOTICE 'User removed from group: %', v_group_id;

  RETURN OLD;
END;
$$;

-- Object 131/188
CREATE FUNCTION public.resolve_course_note(p_note_id uuid, p_resolved_by text DEFAULT 'Admin'::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Update the note to resolved
  UPDATE course_notes 
  SET is_resolved = true,
      resolved_at = NOW(),
      resolved_by = p_resolved_by,
      updated_at = NOW()
  WHERE id = p_note_id AND is_problem = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'Note not found or not a problem'
    );
  END IF;

  RETURN json_build_object(
    'ok', true,
    'message', 'Problem resolved successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'ok', false,
    'error', SQLERRM
  );
END;
$$;

-- Object 132/188
CREATE FUNCTION public.save_draft_to_db(_draft_id uuid, _schedule_data jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  old_version jsonb;
  saved_at timestamptz := now();
  user_id uuid := auth.uid();
  new_version_entry jsonb;
BEGIN
  -- Build version object with metadata
  SELECT current_version INTO old_version
  FROM schedule_drafts
  WHERE id = _draft_id;

  new_version_entry := jsonb_build_object(
    'saved_at', to_char(saved_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'saved_by', user_id,
    'data', old_version
  );

  UPDATE schedule_drafts
  SET 
    current_version = _schedule_data,
    versions = CASE
      WHEN old_version IS NOT NULL THEN array_prepend(new_version_entry, coalesce(versions, '{}'))
      ELSE versions
    END,
    published_at = NULL,
    updated_at = saved_at
  WHERE id = _draft_id;

  IF NOT FOUND THEN
    INSERT INTO schedule_drafts (
      id, current_version, versions, created_at, updated_at
    ) VALUES (
      _draft_id, _schedule_data, '{}', saved_at, saved_at
    );
  END IF;

  RETURN jsonb_build_object(
    'saved', true,
    'saved_at', saved_at
  );
END;
$$;

-- Object 133/188
CREATE FUNCTION public.scheduling_create_new_draft(_created_by uuid, _name text, _notes text, _school_id uuid, _semester_id uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  _new_id uuid := gen_random_uuid();
  _now timestamptz := now();
  _change_group_id uuid := gen_random_uuid();
begin
  -- Insert into schedule_drafts
  insert into public.schedule_drafts (
    id,
    created_by,
    title,
    notes,
    school_id,
    semester_id,
    created_at
  )
  values (
    _new_id,
    _created_by,
    _name,
    _notes,
    _school_id,
    _semester_id,
    _now
  );

  -- Log change in change_log
  insert into public.change_log (
    id,
    change_group_id,
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    after_data,
    created_at
  )
  values (
    gen_random_uuid(),
    _change_group_id,
    _created_by,
    _school_id,
    'schedule_drafts',
    _new_id,
    'insert',
    jsonb_build_object(
      'id', _new_id,
      'created_by', _created_by,
      'title', _name,
      'notes', _notes,
      'school_id', _school_id,
      'semester_id', _semester_id,
      'created_at', _now
    ),
    _now
  );

  return _new_id;
end;
$$;

-- Object 134/188
CREATE FUNCTION public.scheduling_save_draft_version(_draft_id uuid, _schedule_data jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  _version_entry jsonb;
  _saved_at timestamptz := now();
  _saved_by uuid := auth.uid();
BEGIN
  _version_entry := jsonb_build_object(
    'saved_at', to_char(_saved_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'saved_by', _saved_by,
    'data', _schedule_data
  );

  UPDATE schedule_drafts
  SET 
    current_version = _version_entry,
    versions = CASE
      WHEN versions IS NULL THEN array[_version_entry]
      ELSE versions || _version_entry
    END
  WHERE id = _draft_id;
END;
$$;

-- Object 135/188
CREATE FUNCTION public.set_pickup_authorization(_family_id uuid, _adult_profile_id uuid, _child_profile_id uuid, _authorized_for_pickup boolean) RETURNS text
    LANGUAGE plpgsql
    AS $$
begin
  insert into public.family_member_child_links (
    family_id,
    adult_profile_id,
    child_profile_id,
    authorized_for_pickup
  )
  values (
    _family_id,
    _adult_profile_id,
    _child_profile_id,
    _authorized_for_pickup
  )
  on conflict (family_id, adult_profile_id, child_profile_id) do update
  set authorized_for_pickup = excluded.authorized_for_pickup;

  if _authorized_for_pickup then
    return '✅ Successfully added as authorized pickup person';
  else
    return '❌ Successfully removed as authorized pickup person';
  end if;
end;
$$;

-- Object 136/188
CREATE FUNCTION public.set_sibling_pickup_authorization(_student_profile_id uuid, _sibling_profile_id uuid, _authorized boolean) RETURNS text
    LANGUAGE plpgsql
    AS $$
begin
  if _authorized then
    update public.profile_info_student
    set authorized_pickup_ids = array_append(authorized_pickup_ids, _sibling_profile_id)
    where profile_id = _student_profile_id
      and not (_sibling_profile_id = any(authorized_pickup_ids));

    return '✅ Successfully added as authorized pickup person';
  else
    update public.profile_info_student
    set authorized_pickup_ids = array_remove(authorized_pickup_ids, _sibling_profile_id)
    where profile_id = _student_profile_id;

    return '❌ Successfully removed as authorized pickup person';
  end if;
end;
$$;

-- Object 137/188
CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Object 138/188
CREATE FUNCTION public.set_user_context(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM set_config('request.user_id', p_user_id::text, true);
END;
$$;

-- Object 139/188
CREATE FUNCTION public.soft_delete_enrollment_with_logging(p_enrollment_id uuid, p_user_id uuid, p_school_id uuid, p_change_group_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_before RECORD;
BEGIN
  -- Optional: set a change group id so the trigger groups this audit entry
  IF p_change_group_id IS NOT NULL THEN
    PERFORM set_config('my.change_group_id', p_change_group_id::text, true);
  END IF;

  -- Fetch the current enrollment before modification (for your own checks if needed)
  SELECT * INTO v_before
  FROM course_enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment with ID % not found.', p_enrollment_id;
  END IF;

  -- Perform soft delete by setting end_date = now()
  UPDATE course_enrollments
  SET end_date = now()
  WHERE id = p_enrollment_id;

  -- No manual log_change() call here. The AFTER UPDATE trigger logs before/after automatically.
END;
$$;

-- Object 140/188
CREATE FUNCTION public.soft_delete_enrollment_with_logging_alt(p_enrollment_id uuid, p_user_id uuid, p_school_id uuid, p_change_group_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$DECLARE
  v_before RECORD;
BEGIN
  -- Fetch the current enrollment before modification
  SELECT * INTO v_before
  FROM course_enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment with ID % not found.', p_enrollment_id;
  END IF;

  -- Perform soft delete by setting end_date = now()
  UPDATE course_enrollments
  SET end_date = now()
  WHERE id = p_enrollment_id;

  -- Log the change with BEFORE data
  PERFORM log_change(
    p_table_name       := 'course_enrollments',
    p_record_id        := p_enrollment_id,
    p_operation        := 'soft_delete',
    p_user_id          := p_user_id,
    p_school_id        := p_school_id,
    p_data             := to_jsonb(v_before),
    p_change_group_id  := p_change_group_id
  );
END;$$;

-- Object 141/188
CREATE FUNCTION public.student_absence_recurrences_generate(p_recurrence_id uuid, p_student_id uuid, p_school_id uuid, p_created_by uuid, p_reason text, p_from_time time without time zone, p_to_time time without time zone, p_attachment_url text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql
    AS $$DECLARE
  rec RECORD;
  v_date date;
  v_daily_log_id uuid;
  v_lesson RECORD;
  v_attendance_log_id uuid;
  v_note text;
BEGIN
  -- Get the recurrence pattern
  SELECT *
    INTO rec
    FROM public.student_absence_recurrences
   WHERE id = p_recurrence_id;

  IF rec IS NULL THEN
    RAISE EXCEPTION 'Recurrence not found for id: %', p_recurrence_id;
  END IF;

  -- Loop through all dates in the recurrence window
  v_date := rec.start_date;
  WHILE v_date <= rec.end_date LOOP
    -- Daily/Interval/Weekday logic
    IF rec.repeat_every_unit = 'day' THEN
      -- If week_days is present, only include if matches
      IF (rec.week_days IS NULL OR array_length(rec.week_days, 1) = 0)
         OR (extract(isodow from v_date)::smallint = ANY (rec.week_days)) THEN

        -- Insert or upsert into student_daily_log
        INSERT INTO student_daily_log (
          student_id, school_id, date, notes, check_in_time, check_out_time, created_at, updated_at, last_updated_by
        )
        VALUES (
          p_student_id, p_school_id, v_date, p_reason, p_from_time, p_to_time, NOW(), NOW(), p_created_by
        )
        ON CONFLICT (student_id, school_id, date) DO UPDATE
          SET notes = p_reason, check_in_time = p_from_time, check_out_time = p_to_time, updated_at=NOW(), last_updated_by=p_created_by
        RETURNING id INTO v_daily_log_id;

        -- For each lesson that overlaps the absence window
        FOR v_lesson IN
          SELECT id, start_datetime, end_datetime
          FROM course_lessons
          WHERE school_id = p_school_id
            AND start_datetime::date = v_date
            AND (start_datetime::time < p_to_time)
            AND (end_datetime::time > p_from_time)
        LOOP
          -- Determine note in German
          IF p_from_time > v_lesson.start_datetime::time THEN
            v_note := format('Zu spät wegen %s', p_reason);
          ELSIF p_to_time < v_lesson.end_datetime::time THEN
            v_note := format('Geht früher wegen %s', p_reason);
          ELSE
            v_note := p_reason;
          END IF;

          -- Insert or update student_attendance_logs
          INSERT INTO student_attendance_logs (
            lesson_id, student_id, daily_log_id, notes, recorded_by, "timestamp", status
          )
          VALUES (
            v_lesson.id, p_student_id, v_daily_log_id, v_note, p_created_by, NOW(), 'absent'
          )
          ON CONFLICT (lesson_id, student_id) DO
            UPDATE SET notes = v_note, daily_log_id = v_daily_log_id, recorded_by=p_created_by, "timestamp"=NOW(), status='absent';
        END LOOP;
      END IF;
      v_date := v_date + rec.repeat_every_number;
    ELSIF rec.repeat_every_unit = 'week' THEN
      -- Only on specified weekdays (should always have week_days array)
      IF extract(isodow from v_date)::smallint = ANY (rec.week_days) THEN
        -- Same logic as above block
        INSERT INTO student_daily_log (
          student_id, school_id, date, notes, check_in_time, check_out_time, created_at, updated_at, last_updated_by
        )
        VALUES (
          p_student_id, p_school_id, v_date, p_reason, p_from_time, p_to_time, NOW(), NOW(), p_created_by
        )
        ON CONFLICT (student_id, school_id, date) DO UPDATE
          SET notes = p_reason, check_in_time = p_from_time, check_out_time = p_to_time, updated_at=NOW(), last_updated_by=p_created_by
        RETURNING id INTO v_daily_log_id;

        -- Lessons
        FOR v_lesson IN
          SELECT id, start_datetime, end_datetime
          FROM course_lessons
          WHERE school_id = p_school_id
            AND start_datetime::date = v_date
            AND (start_datetime::time < p_to_time)
            AND (end_datetime::time > p_from_time)
        LOOP
          IF p_from_time > v_lesson.start_datetime::time THEN
            v_note := format('Zu spät wegen %s', p_reason);
          ELSIF p_to_time < v_lesson.end_datetime::time THEN
            v_note := format('Geht früher wegen %s', p_reason);
          ELSE
            v_note := p_reason;
          END IF;
          INSERT INTO student_attendance_logs (
            lesson_id, student_id, daily_log_id, notes, recorded_by, "timestamp", status
          )
          VALUES (
            v_lesson.id, p_student_id, v_daily_log_id, v_note, p_created_by, NOW(), 'absent'
          )
          ON CONFLICT (lesson_id, student_id) DO
            UPDATE SET notes = v_note, daily_log_id = v_daily_log_id, recorded_by=p_created_by, "timestamp"=NOW(), status='absent';
        END LOOP;
      END IF;
      v_date := v_date + 1;
    ELSE
      -- Other recurrence units (e.g., month) can be added here if needed
      v_date := v_date + 1;
    END IF;
  END LOOP;
END;$$;

-- Object 142/188
CREATE FUNCTION public.test_as_user(user_id uuid) RETURNS TABLE(test_name text, user_name text, school_name text, visible_users bigint, visible_students bigint, visible_absences bigint, visible_classes bigint, cross_school_users bigint, cross_school_students bigint, cross_school_absences bigint, cross_school_classes bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    user_school_id uuid;
    user_full_name text;
    school_name_text text;
BEGIN
    -- Get user info
    SELECT 
        up.school_id,
        up.first_name || ' ' || up.last_name,
        s.name
    INTO user_school_id, user_full_name, school_name_text
    FROM user_profiles up
    LEFT JOIN structure_schools s ON s.id = up.school_id
    WHERE up.id = user_id;

    -- Set the user context (simulating login)
    PERFORM set_config('request.jwt.claim.sub', user_id::text, true);

    -- Return test results
    RETURN QUERY
    SELECT 
        'RLS Test for ' || user_full_name as test_name,
        user_full_name as user_name,
        school_name_text as school_name,
        (SELECT COUNT(*) FROM public.user_profiles)::bigint as visible_users,
        (SELECT COUNT(*) FROM public.profile_info_student)::bigint as visible_students,
        (SELECT COUNT(*) FROM public.student_absence_notes)::bigint as visible_absences,
        (SELECT COUNT(*) FROM public.structure_classes)::bigint as visible_classes,
        (SELECT COUNT(*) FROM public.user_profiles WHERE school_id != user_school_id)::bigint as cross_school_users,
        (SELECT COUNT(*) FROM public.profile_info_student WHERE school_id != user_school_id)::bigint as cross_school_students,
        (SELECT COUNT(*) FROM public.student_absence_notes WHERE school_id != user_school_id)::bigint as cross_school_absences,
        (SELECT COUNT(*) FROM public.structure_classes WHERE school_id != user_school_id)::bigint as cross_school_classes;
END;
$$;

-- Object 143/188
CREATE FUNCTION public.test_current_user_rls() RETURNS TABLE(test_name text, count bigint, auth_uid text, note text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Test family_members
    RETURN QUERY
    SELECT 
        'Family members'::text,
        COUNT(*)::bigint,
        COALESCE(auth.uid()::text, 'NULL')::text,
        'Current user sees this many family members'::text
    FROM family_members;
    
    -- Test vw_checkin_students_today
    RETURN QUERY
    SELECT 
        'Students in checkin view'::text,
        COUNT(*)::bigint,
        COALESCE(auth.uid()::text, 'NULL')::text,
        'Current user sees this many students'::text
    FROM vw_checkin_students_today;
    
    -- Test structure_classes
    RETURN QUERY
    SELECT 
        'Classes visible'::text,
        COUNT(*)::bigint,
        COALESCE(auth.uid()::text, 'NULL')::text,
        'Current user sees this many classes'::text
    FROM structure_classes;
    
    RETURN;
END
$$;

-- Object 144/188
CREATE FUNCTION public.test_rls_as_father_muller() RETURNS TABLE(test_name text, count bigint, expected text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    SET role TO 'authenticated'
    AS $$
BEGIN
    -- Set the user context
    PERFORM set_config('request.jwt.claim.sub', '0c901b8f-19cc-462c-9974-eb6ef5396856', true);
    
    -- Test family_members
    RETURN QUERY
    SELECT 
        'Family members as Father Müller'::text,
        COUNT(*)::bigint,
        'Should be 10'::text
    FROM family_members;
    
    -- Test vw_checkin_students_today
    RETURN QUERY
    SELECT 
        'Students in checkin view'::text,
        COUNT(*)::bigint,
        'Should see school students'::text
    FROM vw_checkin_students_today;
    
    -- Test structure_classes
    RETURN QUERY
    SELECT 
        'Classes visible'::text,
        COUNT(*)::bigint,
        'Should see accessible classes'::text
    FROM structure_classes;
    
    RETURN;
END
$$;

-- Object 145/188
CREATE FUNCTION public.test_storage_access() RETURNS TABLE(bucket_name text, is_public boolean, access_test_result text, file_count integer, error_message text, test_successful boolean)
    LANGUAGE plpgsql
    AS $$
DECLARE
    bucket_record RECORD;
    test_result TEXT;
    file_count_val INTEGER;
    error_msg TEXT;
    success_flag BOOLEAN;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN QUERY SELECT 
            'authentication_required'::TEXT,
            FALSE,
            'NOT_AUTHENTICATED'::TEXT,
            0,
            'User must be signed in to test storage access'::TEXT,
            FALSE;
        RETURN;
    END IF;

    -- Loop through all buckets and test access with user's actual permissions
    FOR bucket_record IN 
        SELECT name, public FROM storage.buckets ORDER BY name
    LOOP
        BEGIN
            -- Try to count objects in bucket (this tests actual RLS policies)
            SELECT COUNT(*)::INTEGER 
            INTO file_count_val
            FROM storage.objects 
            WHERE bucket_id = bucket_record.name;
            
            test_result := 'ACCESS_GRANTED';
            error_msg := NULL;
            success_flag := TRUE;
            
        EXCEPTION WHEN insufficient_privilege THEN
            test_result := 'ACCESS_DENIED_RLS';
            file_count_val := 0;
            error_msg := 'Blocked by RLS policies';
            success_flag := FALSE;
            
        WHEN OTHERS THEN
            test_result := 'ACCESS_ERROR';
            file_count_val := 0;
            error_msg := SQLERRM;
            success_flag := FALSE;
        END;
        
        RETURN QUERY SELECT 
            bucket_record.name,
            bucket_record.public,
            test_result,
            file_count_val,
            error_msg,
            success_flag;
    END LOOP;
    
    RETURN;
END;
$$;

-- Object 146/188
CREATE FUNCTION public.test_timeout(seconds integer) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    SET statement_timeout TO '0'
    AS $$
begin
  perform pg_sleep(seconds);
  return 'ok';
end;
$$;

-- Object 147/188
CREATE FUNCTION public.toggle_custom_period(p_school_id uuid, p_user_id uuid, p_allow_custom boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  perform set_config('request.user_id', p_user_id::text, true);
  perform set_config('request.school_id', p_school_id::text, true);

  if p_allow_custom then
    if not exists (
      select 1 from schedule_periods
      where school_id = p_school_id and block_type = 'custom'
    ) then
      insert into schedule_periods (
        school_id,
        block_number,
        start_time,
        end_time,
        label,
        group_label,
        attendance_requirement,
        block_type
      )
      values (
        p_school_id,
        999,
        '00:00',
        '00:00',
        'Benutzerdefiniert',
        'Spezial',
        'flexible',
        'custom'
      );
    end if;
  else
    delete from schedule_periods
    where school_id = p_school_id and block_type = 'custom';
  end if;
end;
$$;

-- Object 148/188
CREATE FUNCTION public.trg_set_school_on_possible_times() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  select school_id into NEW.school_id
  from course_list
  where id = NEW.course_id;

  if NEW.school_id is null then
    raise exception 'Invalid course_id – could not resolve school_id';
  end if;

  return NEW;
end;
$$;

-- Object 149/188
CREATE FUNCTION public.undo_change(p_change_id uuid, p_user_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_log_entry change_log;
  v_sql TEXT;
BEGIN
  -- Fetch the change log entry
  SELECT * INTO v_log_entry
  FROM change_log
  WHERE id = p_change_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change not found or you are not the owner.';
  END IF;

  -- Ensure it hasn't already been undone
  IF v_log_entry.is_undone THEN
    RAISE EXCEPTION 'This change has already been undone.';
  END IF;

  -- Only support undo for insert, update, and soft_delete
  IF v_log_entry.action_type = 'insert' THEN
    EXECUTE format('DELETE FROM %I WHERE id = $1', v_log_entry.table_name)
    USING v_log_entry.record_id;

  ELSIF v_log_entry.action_type IN ('update', 'soft_delete') THEN
    -- Dynamically build update statement with casting
    SELECT INTO v_sql
      'UPDATE ' || quote_ident(v_log_entry.table_name) || ' SET ' ||
      string_agg(
        CASE
          WHEN key IN ('id', 'course_id', 'student_id', 'teacher_id', 'created_by', 'updated_by', 'school_id') THEN
            quote_ident(key) || ' = (to_jsonb($1)->>' || quote_literal(key) || ')::uuid'
          WHEN key IN ('start_date', 'end_date') THEN
            quote_ident(key) || ' = (to_jsonb($1)->>' || quote_literal(key) || ')::date'
          WHEN key IN ('created_at', 'updated_at', 'assigned_at') THEN
            quote_ident(key) || ' = (to_jsonb($1)->>' || quote_literal(key) || ')::timestamp'
          WHEN key LIKE 'is_%' THEN
            quote_ident(key) || ' = (to_jsonb($1)->>' || quote_literal(key) || ')::boolean'
          WHEN key = 'schedule_ids' THEN
            quote_ident(key) || ' = CASE ' ||
              'WHEN (to_jsonb($1)->>' || quote_literal(key) || ') = ''[]'' THEN ''{}''::uuid[] ' ||
              'ELSE (to_jsonb($1)->>' || quote_literal(key) || ')::uuid[] END'
          ELSE
            quote_ident(key) || ' = to_jsonb($1)->>' || quote_literal(key)
        END,
        ', '
      )
    FROM jsonb_each_text(v_log_entry.before_data);

    v_sql := v_sql || ' WHERE id = $2';

    EXECUTE v_sql USING v_log_entry.before_data, v_log_entry.record_id;

  ELSE
    RAISE EXCEPTION 'Undo not supported for this action type (%).', v_log_entry.action_type;
  END IF;

  -- Mark as undone
  UPDATE change_log
  SET is_undone = true,
      undone_by = p_user_id,
      undone_at = now()
  WHERE id = p_change_id;
END;
$_$;


ALTER FUNCTION public.undo_change(p_change_id uuid, p_user_id uuid) OWNER TO supabase_admin;

--
-- Name: update_course_with_custom_times_alt(uuid, uuid, uuid, text, integer, date, date, boolean, text, smallint[], text, text[], text, uuid, boolean, boolean, uuid[], text[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION public.update_course_with_custom_times_alt(p_user_id uuid, p_school_id uuid, p_course_id uuid, p_name text, p_max_students integer, p_start_date date, p_end_date date, p_is_active boolean, p_course_code text, p_is_for_year_g smallint[], p_description text, p_pictures text[], p_wichtige_infos text, p_subject_id uuid, p_is_open_course boolean, p_description_visible_to_parents boolean, p_possible_staff_members uuid[], p_possible_times text[]) RETURNS void
    LANGUAGE plpgsql
    AS $$declare
  p_entry text;
  weekday smallint;
  schedule_period_id uuid;
  start_time time;
  duration_minutes int;
begin
  -- Set RLS context
  perform set_config('request.user_id', p_user_id::text, true);
  perform set_config('request.school_id', p_school_id::text, true);

  -- Update course details
  update course_list
  set
    name = p_name,
    max_students = p_max_students,
    start_date = p_start_date,
    end_date = p_end_date,
    is_active = p_is_active,
    course_code = p_course_code,
    is_for_year_g = p_is_for_year_g,
    description = p_description,
    pictures = p_pictures,
    wichtige_infos = p_wichtige_infos,
    subject_id = p_subject_id,
    is_open_course = p_is_open_course,
    description_visible_to_parents = p_description_visible_to_parents,
    possible_staff_members = p_possible_staff_members
  where id = p_course_id;

  -- Remove old possible times
  delete from course_possible_times
  where course_id = p_course_id;

  -- Insert new possible times
  foreach p_entry in array p_possible_times
  loop
    begin
      weekday := split_part(p_entry, '|', 1)::smallint;
      schedule_period_id := split_part(p_entry, '|', 2)::uuid;
      start_time := null;
      duration_minutes := null;

      if weekday < 1 or weekday > 6 then
        raise exception 'Invalid weekday in possible time: %', p_entry;
      end if;

      if array_length(string_to_array(p_entry, '|'), 1) >= 4 then
        start_time := nullif(split_part(p_entry, '|', 3), '')::time;
        duration_minutes := nullif(split_part(p_entry, '|', 4), '')::int;
      end if;

      insert into course_possible_times (
        course_id,
        school_id,
        weekday,
        schedule_period_id,
        is_custom_time,
        custom_start,
        custom_duration
      )
      values (
        p_course_id,
        p_school_id,
        weekday,
        schedule_period_id,
        start_time is not null,
        start_time,
        case
          when duration_minutes is not null then (duration_minutes || ' minutes')::interval
          else null
        end
      );

    exception when others then
      raise exception 'Failed to insert possible time %: %', p_entry, sqlerrm;
    end;
  end loop;
end;$$;

-- Object 150/188
CREATE FUNCTION public.update_course_with_options(p_course_id uuid, p_user_id uuid, p_school_id uuid, p_name text, p_max_students integer, p_start_date date, p_end_date date, p_is_active boolean, p_course_code text, p_is_for_year_g integer[], p_description text, p_pictures text[], p_wichtige_infos text, p_subject_id uuid, p_is_open_course boolean, p_description_visible_to_parents boolean, p_possible_staff_members uuid[], p_possible_times text[]) RETURNS void
    LANGUAGE plpgsql
    AS $$DECLARE
  p_entry text;
  weekday smallint;
  schedule_period_id uuid;
  start_time time;
  duration_minutes int;
BEGIN
  -- Set RLS and trigger context
  PERFORM set_config('my.user_id', p_user_id::text, true);
  PERFORM set_config('my.school_id', p_school_id::text, true);

  -- Update course details
  UPDATE course_list
  SET
    name = p_name,
    max_students = p_max_students,
    start_date = p_start_date,
    end_date = p_end_date,
    is_active = p_is_active,
    course_code = p_course_code,
    is_for_year_g = p_is_for_year_g,
    description = p_description,
    pictures = p_pictures,
    wichtige_infos = p_wichtige_infos,
    subject_id = p_subject_id,
    is_open_course = p_is_open_course,
    description_visible_to_parents = p_description_visible_to_parents,
    possible_staff_members = p_possible_staff_members
  WHERE id = p_course_id;

  -- Remove old possible times
  DELETE FROM course_possible_times
  WHERE course_id = p_course_id;

  -- Insert new possible times
  FOREACH p_entry IN ARRAY p_possible_times
  LOOP
    BEGIN
      weekday := split_part(p_entry, '|', 1)::smallint;
      schedule_period_id := split_part(p_entry, '|', 2)::uuid;
      start_time := NULL;
      duration_minutes := NULL;

      IF weekday < 1 OR weekday > 6 THEN
        RAISE EXCEPTION 'Invalid weekday in possible time: %', p_entry;
      END IF;

      IF array_length(string_to_array(p_entry, '|'), 1) >= 4 THEN
        start_time := nullif(split_part(p_entry, '|', 3), '')::time;
        duration_minutes := nullif(split_part(p_entry, '|', 4), '')::int;
      END IF;

      INSERT INTO course_possible_times (
        course_id,
        school_id,
        weekday,
        schedule_period_id,
        is_custom_time,
        custom_start,
        custom_duration
      )
      VALUES (
        p_course_id,
        p_school_id,
        weekday,
        schedule_period_id,
        start_time IS NOT NULL,
        start_time,
        CASE
          WHEN duration_minutes IS NOT NULL THEN (duration_minutes || ' minutes')::interval
          ELSE NULL
        END
      );

    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to insert possible time %: %', p_entry, SQLERRM;
    END;
  END LOOP;
END;$$;

-- Object 151/188
CREATE FUNCTION public.update_course_with_possible_times_alt(p_course_id uuid, p_school_id uuid, p_user_id uuid, p_name text, p_max_students integer, p_start_date date, p_end_date date, p_is_active boolean, p_course_code text, p_is_for_year_g integer[], p_description text, p_pictures text[], p_wichtige_infos text, p_subject_id uuid, p_is_open_course boolean, p_description_visible_to_parents boolean, p_possible_times text[], p_possible_staff_members uuid[] DEFAULT NULL::uuid[]) RETURNS void
    LANGUAGE plpgsql
    AS $$declare
  p_entry text;
  weekday smallint;
  schedule_period_id uuid;
begin
  -- Set RLS context
  perform set_config('request.user_id', p_user_id::text, true);
  perform set_config('request.school_id', p_school_id::text, true);

  -- Update main course fields
  update course_list
  set
    name = p_name,
    max_students = p_max_students,
    start_date = p_start_date,
    end_date = p_end_date,
    is_active = p_is_active,
    course_code = p_course_code,
    is_for_year_g = p_is_for_year_g,
    description = p_description,
    pictures = p_pictures,
    wichtige_infos = p_wichtige_infos,
    subject_id = p_subject_id,
    is_open_course = p_is_open_course,
    description_visible_to_parents = p_description_visible_to_parents,
    possible_staff_members = p_possible_staff_members
  where id = p_course_id;

  -- Remove old possible times
  delete from course_possible_times
  where course_id = p_course_id;

  -- Insert new possible times
  foreach p_entry in array p_possible_times
  loop
    begin
      weekday := split_part(p_entry, '|', 1)::smallint;
      schedule_period_id := split_part(p_entry, '|', 2)::uuid;

      if weekday < 1 or weekday > 5 then
        raise exception 'Invalid weekday in possible time: %', p_entry;
      end if;

      if not exists (
        select 1 from schedule_periods
        where id = schedule_period_id
      ) then
        raise exception 'Invalid schedule_period_id in possible time: %', p_entry;
      end if;

      insert into course_possible_times (course_id, school_id, weekday, schedule_period_id)
      values (p_course_id, p_school_id, weekday, schedule_period_id);

    exception when others then
      raise exception 'Failed to insert possible time %: %', p_entry, sqlerrm;
    end;
  end loop;
end;$$;

-- Object 152/188
CREATE FUNCTION public.update_registration_periods_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Object 153/188
CREATE FUNCTION public.update_schedule_draft_info(p_draft_id uuid, p_title text, p_notes text) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  v_old_record schedule_drafts;
  v_new_record schedule_drafts;
  v_user_id uuid := auth.uid();
begin
  -- Load current state
  select * into v_old_record from schedule_drafts where id = p_draft_id;

  if not found then
    raise exception 'Draft not found';
  end if;

  -- Update draft
  update schedule_drafts
  set
    title = p_title,
    notes = p_notes,
    updated_at = now()
  where id = p_draft_id;

  -- Load new state
  select * into v_new_record from schedule_drafts where id = p_draft_id;

  -- Log change
  insert into change_log (
    user_id,
    school_id,
    table_name,
    record_id,
    action_type,
    before_data,
    after_data
  )
  values (
    v_user_id,
    v_old_record.school_id,
    'schedule_drafts',
    p_draft_id,
    'update',
    to_jsonb(v_old_record),
    to_jsonb(v_new_record)
  );
end;
$$;

-- Object 154/188
CREATE FUNCTION public.update_staff_profile(p_profile_id uuid, p_user_id uuid, p_first_name text, p_last_name text, p_date_of_birth date, p_gender text, p_joined_at date, p_employee_id text DEFAULT NULL::text, p_contacts jsonb DEFAULT '[]'::jsonb, p_reason text DEFAULT NULL::text, p_source text DEFAULT 'manual'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  v_school_id uuid;
  v_before_user jsonb;
  v_before_staff jsonb;
  v_change_group_id uuid := gen_random_uuid();  -- Group log entries
  v_generated_employee_id text;
begin
  -- Get school_id from user_profiles (for change_log)
  select school_id into v_school_id
  from public.user_profiles
  where id = p_profile_id;

  -- Store current user_profiles state
  select to_jsonb(up) into v_before_user
  from public.user_profiles up
  where id = p_profile_id;

  -- Update user_profiles
  update public.user_profiles
  set
    first_name = p_first_name,
    last_name = p_last_name,
    date_of_birth = p_date_of_birth,
    gender = p_gender
  where id = p_profile_id;

  -- Log user_profiles update
  insert into public.change_log (
    user_id, school_id, table_name, record_id,
    action_type, before_data, after_data,
    reason, source, change_group_id
  )
  values (
    p_user_id, v_school_id, 'user_profiles', p_profile_id,
    'update', v_before_user,
    jsonb_build_object(
      'first_name', p_first_name,
      'last_name', p_last_name,
      'date_of_birth', p_date_of_birth,
      'gender', p_gender
    ),
    p_reason, p_source, v_change_group_id
  );

  -- Store current profile_info_staff state
  select to_jsonb(ps) into v_before_staff
  from public.profile_info_staff ps
  where profile_id = p_profile_id;

  -- Auto-generate employee ID if not provided
  if p_employee_id is null then
    loop
      v_generated_employee_id := lpad(trunc(random() * 1000000)::text, 6, '0');
      exit when not exists (
        select 1 from public.profile_info_staff where employee_id = v_generated_employee_id
      );
    end loop;
    p_employee_id := v_generated_employee_id;
  end if;

  -- Update profile_info_staff
  update public.profile_info_staff
  set
    joined_at = p_joined_at,
    employee_id = p_employee_id
  where profile_id = p_profile_id;

  -- Log profile_info_staff update
  insert into public.change_log (
    user_id, school_id, table_name, record_id,
    action_type, before_data, after_data,
    reason, source, change_group_id
  )
  values (
    p_user_id, v_school_id, 'profile_info_staff', p_profile_id,
    'update', v_before_staff,
    jsonb_build_object(
      'joined_at', p_joined_at,
      'employee_id', p_employee_id
    ),
    p_reason, p_source, v_change_group_id
  );

  -- TEMP: Replace contacts (NOTE: not ideal for long-term logging granularity)
  delete from public.contacts
  where profile_id = p_profile_id and profile_type = 'staff';

  insert into public.contacts (
    profile_id, profile_type, type, value, notes, is_primary
  )
  select
    p_profile_id,
    'staff',
    contact ->> 'contact_type',
    contact ->> 'contact_value',
    contact ->> 'notes',
    (contact ->> 'is_primary')::boolean
  from jsonb_array_elements(p_contacts) as contact;

  -- Log contacts bulk update
  insert into public.change_log (
    user_id, school_id, table_name, record_id,
    action_type, before_data, after_data,
    reason, source, change_group_id
  )
  values (
    p_user_id, v_school_id, 'contacts', p_profile_id,
    'update', null, p_contacts,
    p_reason, p_source, v_change_group_id
  );
end;
$$;

-- Object 155/188
CREATE FUNCTION public.upsert_school_days(p_school_id uuid, p_day_ids integer[]) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_school_id UUID;
    v_deleted_count INTEGER;
    v_inserted_count INTEGER;
    v_day_id INTEGER;
BEGIN
    -- Security: Get user's school ID for RLS validation
    v_user_school_id := auth.get_user_school_id();
    
    -- Validate user can only modify their own school
    IF v_user_school_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot determine user school ID'
        );
    END IF;
    
    IF p_school_id != v_user_school_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Access denied: Can only modify your own school days'
        );
    END IF;
    
    -- Validate day_ids array is not empty
    IF p_day_ids IS NULL OR array_length(p_day_ids, 1) IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'day_ids array cannot be empty'
        );
    END IF;
    
    -- Validate all day_ids exist in structure_days table
    IF EXISTS (
        SELECT 1 FROM unnest(p_day_ids) AS day_id 
        WHERE day_id NOT IN (SELECT id FROM public.structure_days)
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid day_id provided - must exist in structure_days table'
        );
    END IF;
    
    -- PERFORMANCE: Delete all existing days for this school (efficient bulk delete)
    DELETE FROM public.structure_school_days 
    WHERE school_id = p_school_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- PERFORMANCE: Bulk insert new days using INSERT + VALUES
    INSERT INTO public.structure_school_days (school_id, day_id)
    SELECT p_school_id, unnest(p_day_ids)
    ON CONFLICT (school_id, day_id) DO NOTHING;
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    
    -- Return success with operation details
    RETURN json_build_object(
        'success', true,
        'school_id', p_school_id,
        'days_deleted', v_deleted_count,
        'days_inserted', v_inserted_count,
        'day_ids', p_day_ids,
        'message', format('Successfully set %s days for school', v_inserted_count)
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Handle any unexpected errors
    RETURN json_build_object(
        'success', false,
        'error', format('Database error: %s', SQLERRM)
    );
END;
$$;

-- Object 156/188
CREATE FUNCTION public.use_code(input_code character varying, profile_id uuid DEFAULT NULL::uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    code_user_id UUID;
    code_found BOOLEAN := false;
BEGIN
    IF profile_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Profile id not provided'
        );
    END IF;

    -- Check if code exists and is unused
    SELECT profile_id INTO code_user_id
    FROM user_codes
    WHERE code = input_code
    AND used_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > NOW();

    IF code_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid, expired, or already used code'
        );
    END IF;

    -- If profile_id was provided, verify ownership
    IF profile_id != code_user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Code does not belong to this user profile'
        );
    END IF;

    -- Mark code as used
    UPDATE user_codes
    SET used_at = NOW()
    WHERE code = input_code
    AND used_at IS NULL;

    RETURN json_build_object(
        'success', true,
        'error', null,
        'message', 'Code marked as used'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Object 157/188
CREATE FUNCTION public.whoami() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    SET statement_timeout TO '0'
    AS $$
  select jsonb_build_object(
    'current_user', current_user,
    'session_user', session_user,
    'effective_role', current_setting('role', true),
    'statement_timeout', current_setting('statement_timeout'),
    'lock_timeout', current_setting('lock_timeout'),
    'supabase_uid', auth.uid(),
    'jwt_claims', current_setting('request.jwt.claims', true)
  );
$$;

-- Object 158/188
CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;

-- Object 159/188
CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;

-- Object 160/188
CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;

-- Object 161/188
CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;

-- Object 162/188
CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;

-- Object 163/188
CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;

-- Object 164/188
CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;

-- Object 165/188
CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;

-- Object 166/188
CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;

-- Object 167/188
CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;

-- Object 168/188
CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;

-- Object 169/188
CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;

-- Object 170/188
CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;

-- Object 171/188
CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;

-- Object 172/188
CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;

-- Object 173/188
CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;

-- Object 174/188
CREATE FUNCTION storage.extract_school_id_from_path(object_path text) RETURNS uuid
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT 
    CASE 
      -- Path format: school-logo/school_id/filename
      -- OR: bucket-name/school_id/folder/filename
      WHEN object_path ~ '^[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' THEN
        (regexp_match(object_path, '^[^/]+/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/'))[1]::UUID
      ELSE
        NULL
    END;
$$;

-- Object 175/188
CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;

-- Object 176/188
CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;

-- Object 177/188
CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;

-- Object 178/188
CREATE FUNCTION storage.get_object_school_id(object_metadata jsonb) RETURNS uuid
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT (object_metadata ->> 'school_id')::UUID;
$$;

-- Object 179/188
CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;

-- Object 180/188
CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;

-- Object 181/188
CREATE FUNCTION storage.is_public_bucket(bucket_name text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT public FROM storage.buckets WHERE name = bucket_name;
$$;

-- Object 182/188
CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;

-- Object 183/188
CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;

-- Object 184/188
CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;

-- Object 185/188
CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;

-- Object 186/188
CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;

-- Object 187/188
CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
BEGIN
    RETURN query EXECUTE
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name || '/' AS name,
                    NULL::uuid AS id,
                    NULL::timestamptz AS updated_at,
                    NULL::timestamptz AS created_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
                ORDER BY prefixes.name COLLATE "C" LIMIT $3
            )
            UNION ALL
            (SELECT split_part(name, '/', $4) AS key,
                name,
                id,
                updated_at,
                created_at,
                metadata
            FROM storage.objects
            WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
            ORDER BY name COLLATE "C" LIMIT $3)
        ) obj
        ORDER BY name COLLATE "C" LIMIT $3;
        $sql$
        USING prefix, bucket_name, limits, levels, start_after;
END;
$_$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;

-- Object 188/188
CREATE FUNCTION supabase_functions.http_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'supabase_functions'
    AS $$
    DECLARE
      request_id bigint;
      payload jsonb;
      url text := TG_ARGV[0]::text;
      method text := TG_ARGV[1]::text;
      headers jsonb DEFAULT '{}'::jsonb;
      params jsonb DEFAULT '{}'::jsonb;
      timeout_ms integer DEFAULT 1000;
    BEGIN
      IF url IS NULL OR url = 'null' THEN
        RAISE EXCEPTION 'url argument is missing';
      END IF;

      IF method IS NULL OR method = 'null' THEN
        RAISE EXCEPTION 'method argument is missing';
      END IF;

      IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
        headers = '{"Content-Type": "application/json"}'::jsonb;
      ELSE
        headers = TG_ARGV[2]::jsonb;
      END IF;

      IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
        params = '{}'::jsonb;
      ELSE
        params = TG_ARGV[3]::jsonb;
      END IF;

      IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
        timeout_ms = 1000;
      ELSE
        timeout_ms = TG_ARGV[4]::integer;
      END IF;

      CASE
        WHEN method = 'GET' THEN
          SELECT http_get INTO request_id FROM net.http_get(
            url,
            params,
            headers,
            timeout_ms
          );
        WHEN method = 'POST' THEN
          payload = jsonb_build_object(
            'old_record', OLD,
            'record', NEW,
            'type', TG_OP,
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA
          );

          SELECT http_post INTO request_id FROM net.http_post(
            url,
            payload,
            params,
            headers,
            timeout_ms
          );
        ELSE
          RAISE EXCEPTION 'method argument % is invalid', method;
      END CASE;

      INSERT INTO supabase_functions.hooks
        (hook_table_id, hook_name, request_id)
      VALUES
        (TG_RELID, TG_NAME, request_id);

      RETURN NEW;
    END
  $$;

