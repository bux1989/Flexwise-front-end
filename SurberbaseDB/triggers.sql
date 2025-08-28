--
-- CREATE TRIGGER STATEMENTS
--
-- Extracted from flexwise28082025dump.sql
-- Total objects: 30
--

-- Object 1/30
CREATE TRIGGER set_school_id BEFORE INSERT OR UPDATE ON public.course_possible_times FOR EACH ROW EXECUTE FUNCTION public.trg_set_school_on_possible_times();

-- Object 2/30
CREATE TRIGGER trg_cad_set_updated_at BEFORE UPDATE ON public.course_allocation_drafts FOR EACH ROW EXECUTE FUNCTION public.cad_set_updated_at();

-- Object 3/30
CREATE TRIGGER trg_course_schedules_updated_at BEFORE UPDATE ON public.course_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Object 4/30
CREATE TRIGGER trg_log_bulletin_posts AFTER INSERT OR DELETE OR UPDATE ON public.bulletin_posts FOR EACH ROW EXECUTE FUNCTION public.log_change_generic();

-- Object 5/30
CREATE TRIGGER trg_log_course_applications AFTER INSERT OR DELETE OR UPDATE ON public.course_applications FOR EACH ROW EXECUTE FUNCTION public.log_change_generic();

-- Object 6/30
CREATE TRIGGER trg_log_course_enrollments AFTER INSERT OR DELETE OR UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.log_change_generic();

-- Object 7/30
CREATE TRIGGER trg_log_course_list AFTER INSERT OR DELETE OR UPDATE ON public.course_list FOR EACH ROW EXECUTE FUNCTION public.log_change_generic();

-- Object 8/30
CREATE TRIGGER trg_log_course_possible_times AFTER INSERT OR DELETE OR UPDATE ON public.course_possible_times FOR EACH ROW EXECUTE FUNCTION public.log_change_generic();

-- Object 9/30
CREATE TRIGGER trg_log_course_registration_windows AFTER INSERT OR DELETE OR UPDATE ON public.course_registration_windows FOR EACH ROW EXECUTE FUNCTION public.log_change_generic();

-- Object 10/30
CREATE TRIGGER trg_log_registration_periods AFTER INSERT OR DELETE OR UPDATE ON public.registration_periods FOR EACH ROW EXECUTE FUNCTION public.log_change_generic();

-- Object 11/30
CREATE TRIGGER trg_log_schedule_periods AFTER INSERT OR DELETE OR UPDATE ON public.schedule_periods FOR EACH ROW EXECUTE FUNCTION public.log_change_generic();

-- Object 12/30
CREATE TRIGGER trg_log_staff_absences AFTER INSERT OR DELETE OR UPDATE ON public.staff_absences FOR EACH ROW EXECUTE FUNCTION public.log_change_generic();

-- Object 13/30
CREATE TRIGGER trg_protect_role_deletion BEFORE DELETE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.protect_role_deletion();

-- Object 14/30
CREATE TRIGGER trg_protect_role_modification BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.protect_role_modification();

-- Object 15/30
CREATE TRIGGER trg_set_updated_at_course_list BEFORE UPDATE ON public.course_list FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Object 16/30
CREATE TRIGGER trg_set_updated_at_registration_periods BEFORE UPDATE ON public.registration_periods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Object 17/30
CREATE TRIGGER trg_update_registration_periods_updated_at BEFORE UPDATE ON public.registration_periods FOR EACH ROW EXECUTE FUNCTION public.update_registration_periods_updated_at();

-- Object 18/30
CREATE TRIGGER trigger_add_user_to_group AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.add_user_to_group_alt();

-- Object 19/30
CREATE TRIGGER trigger_refresh_user_login_profiles_delete AFTER DELETE ON public.user_roles FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_user_login_profiles();

-- Object 20/30
CREATE TRIGGER trigger_refresh_user_login_profiles_profiles_update AFTER UPDATE OF role_id ON public.user_profiles FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_user_login_profiles();

-- Object 21/30
CREATE TRIGGER trigger_refresh_user_login_profiles_roles_update AFTER UPDATE OF name, is_subrole ON public.roles FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_user_login_profiles();

-- Object 22/30
CREATE TRIGGER trigger_refresh_user_login_profiles_update AFTER UPDATE ON public.user_roles FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_user_login_profiles();

-- Object 23/30
CREATE TRIGGER trigger_remove_user_from_group AFTER DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.remove_user_from_group();

-- Object 24/30
CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();

-- Object 25/30
CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

-- Object 26/30
CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

-- Object 27/30
CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

-- Object 28/30
CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

-- Object 29/30
CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

-- Object 30/30
CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

