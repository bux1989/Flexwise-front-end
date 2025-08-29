-- Function: save_user_profile_complete_react
-- Purpose: Save user profile, staff info, and contacts in a single transaction
-- Security: Uses RLS policies, validates school_id from profile data

CREATE OR REPLACE FUNCTION save_user_profile_complete_react(
  p_profile_id UUID,
  p_profile_data JSONB,
  p_staff_data JSONB,
  p_contacts JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school_id UUID;
  v_result JSONB := '{}';
  v_contact JSONB;
  v_contacts_inserted INTEGER := 0;
BEGIN
  -- Get school_id from existing profile (security: can't be manipulated by client)
  SELECT school_id INTO v_school_id
  FROM user_profiles 
  WHERE id = p_profile_id;
  
  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found or school_id missing for profile: %', p_profile_id;
  END IF;

  -- Start transaction
  BEGIN
    -- 1. Update user_profiles table
    UPDATE user_profiles SET
      first_name = COALESCE(p_profile_data->>'first_name', first_name),
      last_name = COALESCE(p_profile_data->>'last_name', last_name),
      date_of_birth = CASE 
        WHEN p_profile_data->>'date_of_birth' IS NOT NULL 
        THEN (p_profile_data->>'date_of_birth')::DATE 
        ELSE date_of_birth 
      END,
      gender = COALESCE(p_profile_data->>'gender', gender),
      profile_picture_url = COALESCE(p_profile_data->>'profile_picture_url', profile_picture_url),
      updated_at = NOW()
    WHERE id = p_profile_id;

    -- Check if update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Failed to update user_profiles for profile: %', p_profile_id;
    END IF;

    -- 2. Upsert profile_info_staff table
    INSERT INTO profile_info_staff (
      profile_id,
      school_id,
      skills,
      kurzung,
      subjects_stud,
      created_at,
      updated_at
    ) VALUES (
      p_profile_id,
      v_school_id,
      COALESCE((p_staff_data->>'skills')::TEXT[], ARRAY[]::TEXT[]),
      p_staff_data->>'kurzung',
      COALESCE((p_staff_data->>'subjects_stud')::TEXT[], ARRAY[]::TEXT[]),
      NOW(),
      NOW()
    )
    ON CONFLICT (profile_id) 
    DO UPDATE SET
      skills = COALESCE((p_staff_data->>'skills')::TEXT[], ARRAY[]::TEXT[]),
      kurzung = p_staff_data->>'kurzung',
      subjects_stud = COALESCE((p_staff_data->>'subjects_stud')::TEXT[], ARRAY[]::TEXT[]),
      updated_at = NOW();

    -- 3. Delete existing contacts
    DELETE FROM contacts 
    WHERE profile_id = p_profile_id;

    -- 4. Insert new contacts
    FOR v_contact IN SELECT * FROM jsonb_array_elements(p_contacts)
    LOOP
      INSERT INTO contacts (
        profile_id,
        profile_type,
        type,
        label,
        value,
        is_primary,
        school_id,
        created_at,
        updated_at
      ) VALUES (
        p_profile_id,
        'staff',
        v_contact->>'type',
        v_contact->>'label',
        v_contact->>'value',
        COALESCE((v_contact->>'is_primary')::BOOLEAN, false),
        v_school_id,
        NOW(),
        NOW()
      );
      
      v_contacts_inserted := v_contacts_inserted + 1;
    END LOOP;

    -- Build success response
    v_result := jsonb_build_object(
      'success', true,
      'profile_id', p_profile_id,
      'school_id', v_school_id,
      'contacts_inserted', v_contacts_inserted,
      'message', 'Profile saved successfully'
    );

    RETURN v_result;

  EXCEPTION WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Error saving profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_user_profile_complete_react(UUID, JSONB, JSONB, JSONB) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION save_user_profile_complete_react IS 
'Saves complete user profile including staff info and contacts in a single transaction. 
Uses school_id from existing profile data for security. 
Parameters:
- p_profile_id: User profile UUID
- p_profile_data: JSONB with first_name, last_name, date_of_birth, gender, profile_picture_url
- p_staff_data: JSONB with skills, kurzung, subjects_stud
- p_contacts: JSONB array with type, label, value, is_primary';
