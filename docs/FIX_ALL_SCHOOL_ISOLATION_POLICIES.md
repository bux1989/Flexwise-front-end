# Fix All Broken School Isolation Policies

## AS SUPERUSER - Mass Update Script

The problem: All policies use `(auth.jwt()->>'profile_id')::uuid` which is NULL.
The solution: Use `(SELECT school_id FROM public.user_profiles WHERE id = auth.uid())` instead.

```sql
-- =====================================================
-- MASS FIX: UPDATE ALL SCHOOL ISOLATION POLICIES
-- =====================================================

-- CONTACTS (4 policies)
DROP POLICY IF EXISTS "school_isolation_contacts_delete" ON public.contacts;
CREATE POLICY "school_isolation_contacts_delete" ON public.contacts FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_contacts_insert" ON public.contacts;
CREATE POLICY "school_isolation_contacts_insert" ON public.contacts FOR INSERT TO authenticated
WITH CHECK (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_contacts_select" ON public.contacts;
CREATE POLICY "school_isolation_contacts_select" ON public.contacts FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_contacts_update" ON public.contacts;
CREATE POLICY "school_isolation_contacts_update" ON public.contacts FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

-- FAMILIES (4 policies)
DROP POLICY IF EXISTS "school_isolation_families_delete" ON public.families;
CREATE POLICY "school_isolation_families_delete" ON public.families FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_families_insert" ON public.families;
CREATE POLICY "school_isolation_families_insert" ON public.families FOR INSERT TO authenticated
WITH CHECK (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_families_select" ON public.families;
CREATE POLICY "school_isolation_families_select" ON public.families FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_families_update" ON public.families;
CREATE POLICY "school_isolation_families_update" ON public.families FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

-- FAMILY_MEMBER_CHILD_LINKS (4 policies)
DROP POLICY IF EXISTS "school_isolation_family_member_child_links_delete" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_delete" ON public.family_member_child_links FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_family_member_child_links_insert" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_insert" ON public.family_member_child_links FOR INSERT TO authenticated
WITH CHECK (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_family_member_child_links_select" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_select" ON public.family_member_child_links FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_family_member_child_links_update" ON public.family_member_child_links;
CREATE POLICY "school_isolation_family_member_child_links_update" ON public.family_member_child_links FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

-- FAMILY_MEMBERS (4 policies)
DROP POLICY IF EXISTS "school_isolation_family_members_delete" ON public.family_members;
CREATE POLICY "school_isolation_family_members_delete" ON public.family_members FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_family_members_insert" ON public.family_members;
CREATE POLICY "school_isolation_family_members_insert" ON public.family_members FOR INSERT TO authenticated
WITH CHECK (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_family_members_select" ON public.family_members;
CREATE POLICY "school_isolation_family_members_select" ON public.family_members FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_family_members_update" ON public.family_members;
CREATE POLICY "school_isolation_family_members_update" ON public.family_members FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

-- PROFILE_INFO_STAFF (4 policies)
DROP POLICY IF EXISTS "school_isolation_profile_info_staff_delete" ON public.profile_info_staff;
CREATE POLICY "school_isolation_profile_info_staff_delete" ON public.profile_info_staff FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_profile_info_staff_insert" ON public.profile_info_staff;
CREATE POLICY "school_isolation_profile_info_staff_insert" ON public.profile_info_staff FOR INSERT TO authenticated
WITH CHECK (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_profile_info_staff_select" ON public.profile_info_staff;
CREATE POLICY "school_isolation_profile_info_staff_select" ON public.profile_info_staff FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_profile_info_staff_update" ON public.profile_info_staff;
CREATE POLICY "school_isolation_profile_info_staff_update" ON public.profile_info_staff FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

-- PROFILE_INFO_STUDENT (4 policies)
DROP POLICY IF EXISTS "school_isolation_profile_info_student_delete" ON public.profile_info_student;
CREATE POLICY "school_isolation_profile_info_student_delete" ON public.profile_info_student FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_profile_info_student_insert" ON public.profile_info_student;
CREATE POLICY "school_isolation_profile_info_student_insert" ON public.profile_info_student FOR INSERT TO authenticated
WITH CHECK (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_profile_info_student_select" ON public.profile_info_student;
CREATE POLICY "school_isolation_profile_info_student_select" ON public.profile_info_student FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_profile_info_student_update" ON public.profile_info_student;
CREATE POLICY "school_isolation_profile_info_student_update" ON public.profile_info_student FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

-- PROFILE_INFO_FAMILY_MEMBER (4 policies)
DROP POLICY IF EXISTS "school_isolation_profile_info_family_member_delete" ON public.profile_info_family_member;
CREATE POLICY "school_isolation_profile_info_family_member_delete" ON public.profile_info_family_member FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_profile_info_family_member_insert" ON public.profile_info_family_member;
CREATE POLICY "school_isolation_profile_info_family_member_insert" ON public.profile_info_family_member FOR INSERT TO authenticated
WITH CHECK (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_profile_info_family_member_select" ON public.profile_info_family_member;
CREATE POLICY "school_isolation_profile_info_family_member_select" ON public.profile_info_family_member FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

DROP POLICY IF EXISTS "school_isolation_profile_info_family_member_update" ON public.profile_info_family_member;
CREATE POLICY "school_isolation_profile_info_family_member_update" ON public.profile_info_family_member FOR ALL TO authenticated
USING (
  (school_id = (SELECT school_id FROM public.user_profiles WHERE id = auth.uid()) OR school_id IS NULL)
  AND (SELECT public.check_mfa_required())
);

-- Continue with remaining tables...
-- (This is just the first batch - there are 40+ more tables to fix)

-- Verification query after running all updates
SELECT 
  'Fixed Policies Verification' as test,
  count(*) as total_school_isolation_policies,
  'Should show ~80+ policies with correct school_id logic' as note
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE 'school_isolation_%';
```

**This script fixes the core issue:** Replace broken `auth.jwt()->>'profile_id'` with working `(SELECT school_id FROM public.user_profiles WHERE id = auth.uid())`.

**Should I create the complete script for all remaining tables, or do you want to test this batch first?**

After running this, your policy tester should show **most tables as BLOCKED** instead of ALLOWED.
