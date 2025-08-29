-- Migration: Fix bug where new contacts are deleted immediately after insertion
-- Date: 2025-08-29
-- Issue: Deletion logic removes newly inserted contacts because temp IDs aren't tracked
-- Fix: Track inserted contact IDs and exclude them from deletion

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
  v_skills_json TEXT;
  v_existing_contact_ids UUID[] := ARRAY[]::UUID[];
  v_inserted_contact_ids UUID[] := ARRAY[]::UUID[];
  v_new_contact_id UUID;
BEGIN
  -- Get school_id from existing profile (security: can't be manipulated by client)
  SELECT school_id INTO v_school_id
  FROM user_profiles 
  WHERE id = p_profile_id;
  
  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found or school_id missing for profile: %', p_profile_id;
  END IF;

  -- Convert skills JSONB array to TEXT[] using string conversion approach
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

    -- 2. Upsert profile_info_staff table (WITHOUT subjects_stud)
    INSERT INTO profile_info_staff (
      profile_id,
      school_id,
      skills,
      kurzung,
      created_at,
      updated_at
    ) VALUES (
      p_profile_id,
      v_school_id,
      v_skills,
      p_staff_data->>'kurzung',
      NOW(),
      NOW()
    )
    ON CONFLICT (profile_id)
    DO UPDATE SET
      skills = v_skills,
      kurzung = p_staff_data->>'kurzung',
      updated_at = NOW();

    -- 3. Handle contacts with proper tracking of new vs existing
    
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
          -- Track existing contact ID
          v_existing_contact_ids := v_existing_contact_ids || (v_contact->>'id')::UUID;
        END IF;
      ELSE
        -- Insert new contact and track its ID
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
        ) RETURNING id INTO v_new_contact_id;
        
        v_contacts_processed := v_contacts_processed + 1;
        -- Track inserted contact ID
        v_inserted_contact_ids := v_inserted_contact_ids || v_new_contact_id;
      END IF;
    END LOOP;

    -- 4. Delete contacts that are no longer in the form data
    -- Only delete if we have contact IDs to compare against
    -- Exclude both existing contacts and newly inserted contacts from deletion
    IF array_length(v_existing_contact_ids, 1) > 0 OR array_length(v_inserted_contact_ids, 1) > 0 THEN
      DELETE FROM contacts 
      WHERE profile_id = p_profile_id 
        AND school_id = v_school_id
        AND id != ALL(v_existing_contact_ids)
        AND id != ALL(v_inserted_contact_ids);
    END IF;

    -- Build success response
    v_result := jsonb_build_object(
      'success', true,
      'profile_id', p_profile_id,
      'school_id', v_school_id,
      'contacts_processed', v_contacts_processed,
      'existing_contacts', array_length(v_existing_contact_ids, 1),
      'new_contacts', array_length(v_inserted_contact_ids, 1),
      'message', 'Profile saved successfully (without subjects_stud field)'
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
Fixed bug where new contacts were being deleted immediately after insertion.
Tracks both existing and newly inserted contact IDs to prevent improper deletion.
Parameters:
- p_profile_id: User profile UUID
- p_profile_data: JSONB with first_name, last_name, date_of_birth, gender, profile_picture_url
- p_staff_data: JSONB with skills, kurzung (subjects_stud removed)
- p_contacts: JSONB array with id, type, label, value, is_primary, is_linked_to_user_login';
