-- Migration: Final fix for subjects_stud casting issue using string_to_array
-- Date: 2025-08-29
-- Issue: SQLSTATE 42804 - persistent type mismatch with JSONB arrays
-- Fix: Convert JSONB array to string, then use string_to_array for reliable conversion

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
  v_contacts_processed INTEGER := 0;
  v_skills TEXT[];
  v_subjects_stud TEXT[];
  v_skills_json TEXT;
  v_subjects_json TEXT;
BEGIN
  -- Get school_id from existing profile (security: can't be manipulated by client)
  SELECT school_id INTO v_school_id
  FROM user_profiles 
  WHERE id = p_profile_id;
  
  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found or school_id missing for profile: %', p_profile_id;
  END IF;

  -- Convert JSONB arrays to TEXT[] using string conversion approach
  -- This avoids the JSONB casting issues
  
  -- Handle skills array
  IF p_staff_data->'skills' IS NOT NULL AND p_staff_data->'skills' != 'null'::jsonb THEN
    v_skills_json := p_staff_data->>'skills';
    -- Remove brackets and quotes, split by comma
    v_skills_json := replace(replace(replace(v_skills_json, '[', ''), ']', ''), '"', '');
    IF v_skills_json != '' THEN
      v_skills := string_to_array(v_skills_json, ',');
      -- Trim whitespace from each element
      FOR i IN 1..array_length(v_skills, 1) LOOP
        v_skills[i] := trim(v_skills[i]);
      END LOOP;
    ELSE
      v_skills := ARRAY[]::TEXT[];
    END IF;
  ELSE
    v_skills := ARRAY[]::TEXT[];
  END IF;

  -- Handle subjects_stud array
  IF p_staff_data->'subjects_stud' IS NOT NULL AND p_staff_data->'subjects_stud' != 'null'::jsonb THEN
    v_subjects_json := p_staff_data->>'subjects_stud';
    -- Remove brackets and quotes, split by comma
    v_subjects_json := replace(replace(replace(v_subjects_json, '[', ''), ']', ''), '"', '');
    IF v_subjects_json != '' THEN
      v_subjects_stud := string_to_array(v_subjects_json, ',');
      -- Trim whitespace from each element
      FOR i IN 1..array_length(v_subjects_stud, 1) LOOP
        v_subjects_stud[i] := trim(v_subjects_stud[i]);
      END LOOP;
    ELSE
      v_subjects_stud := ARRAY[]::TEXT[];
    END IF;
  ELSE
    v_subjects_stud := ARRAY[]::TEXT[];
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
      v_skills,
      p_staff_data->>'kurzung',
      v_subjects_stud,
      NOW(),
      NOW()
    )
    ON CONFLICT (profile_id)
    DO UPDATE SET
      skills = v_skills,
      kurzung = p_staff_data->>'kurzung',
      subjects_stud = v_subjects_stud,
      updated_at = NOW();

    -- 3. Surgical contact updates (preserve important fields like is_linked_to_user_login)
    
    -- First, handle updates and inserts
    FOR v_contact IN SELECT * FROM jsonb_array_elements(p_contacts)
    LOOP
      -- Check if contact has an ID (existing) or needs to be inserted (new)
      IF v_contact->>'id' IS NOT NULL AND NOT (v_contact->>'id' LIKE 'temp_%') THEN
        -- Update existing contact (preserve is_linked_to_user_login and created_at)
        UPDATE contacts SET
          type = v_contact->>'type',
          label = v_contact->>'label',
          value = v_contact->>'value',
          is_primary = COALESCE((v_contact->>'is_primary')::BOOLEAN, false),
          updated_at = NOW()
        WHERE id = (v_contact->>'id')::UUID 
          AND profile_id = p_profile_id;
          
        IF FOUND THEN
          v_contacts_processed := v_contacts_processed + 1;
        END IF;
      ELSE
        -- Insert new contact
        INSERT INTO contacts (
          profile_id,
          profile_type,
          type,
          label,
          value,
          is_primary,
          is_linked_to_user_login,
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
          COALESCE((v_contact->>'is_linked_to_user_login')::BOOLEAN, false),
          v_school_id,
          NOW(),
          NOW()
        );
        
        v_contacts_processed := v_contacts_processed + 1;
      END IF;
    END LOOP;

    -- 4. Delete contacts that are no longer in the form data
    -- Only delete if we have contact IDs to compare against
    IF jsonb_array_length(p_contacts) > 0 THEN
      DELETE FROM contacts 
      WHERE profile_id = p_profile_id 
        AND school_id = v_school_id
        AND id NOT IN (
          SELECT (contact_element->>'id')::UUID
          FROM jsonb_array_elements(p_contacts) AS contact_element
          WHERE contact_element->>'id' IS NOT NULL 
            AND NOT (contact_element->>'id' LIKE 'temp_%')
            AND (contact_element->>'id')::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        );
    END IF;

    -- Build success response
    v_result := jsonb_build_object(
      'success', true,
      'profile_id', p_profile_id,
      'school_id', v_school_id,
      'contacts_processed', v_contacts_processed,
      'message', 'Profile saved successfully with surgical contact updates'
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
'Saves complete user profile including staff info and contacts in a single transaction using surgical updates. 
Preserves important contact fields like is_linked_to_user_login and created_at timestamps.
Uses school_id from existing profile data for security. 
Uses string conversion approach to handle JSONB arrays, avoiding casting issues.
Parameters:
- p_profile_id: User profile UUID
- p_profile_data: JSONB with first_name, last_name, date_of_birth, gender, profile_picture_url
- p_staff_data: JSONB with skills, kurzung, subjects_stud
- p_contacts: JSONB array with id, type, label, value, is_primary, is_linked_to_user_login';
