# Database Schema Index

Complete index of all database objects in the Flexwise Supabase database.

## Quick Navigation

- [Tables](#tables) (82 total)
- [Views](#views) (29 total)  
- [Functions](#functions) (200+ total)
- [Triggers](#triggers)
- [Indexes](#indexes)
- [Constraints](#constraints)

## Tables

### Academic Structure (11 tables)
- `schedule_periods` - Time period definitions
- `structure_classes` - Class/grade definitions  
- `structure_days` - Day type definitions
- `structure_rooms` - Physical room management
- `structure_school_days` - Academic calendar
- `structure_school_semesters` - Semester definitions
- `structure_school_years` - Academic year periods
- `structure_schools` - School definitions and settings
- `subject_class_hours` - Class-specific subject hours
- `subject_grade_hours` - Grade-specific subject hours
- `subjects` - Subject/course catalog

### Communication & Content (7 tables)
- `bulletin_post_users` - Post visibility/targeting
- `bulletin_posts` - Bulletin board posts
- `bulletin_recurrences` - Recurring bulletin patterns
- `contacts` - Contact information management
- `document_types` - Document type definitions
- `student_course_wish_choices` - Course preference choices
- `student_course_wish_submissions` - Course preference submissions

### Course & Scheduling (15 tables)
- `course_allocation_drafts` - Schedule planning drafts
- `course_applications` - Student course applications
- `course_enrollments` - Confirmed course enrollments
- `course_lessons` - Individual lesson records
- **`course_list`** ⭐ - Available courses catalog ([Documentation](tables/course_list.md))
- `course_notes` - Course-specific notes
- `course_offers` - Course offerings per period
- `course_possible_times` - Available time slots
- `course_registration_windows` - Registration time windows
- `course_schedules` - Detailed course schedules
- `registration_periods` - Registration period definitions
- `schedule_calendar_exceptions` - Calendar exceptions
- `schedule_daily_rostering` - Daily staff assignments
- `schedule_drafts` - Schedule draft versions
- `substitutions` - Substitute teacher assignments

### Family & Student Management (13 tables)
- `families` - Family/household records
- `family_member_child_links` - Parent-child relationships
- `family_members` - Family member details
- `profile_info_student` - Student profiles and basic info
- `student_absence_notes` - Absence documentation
- `student_absence_recurrences` - Recurring absence patterns
- **`student_attendance_logs`** ⭐ - Attendance tracking ([Documentation](tables/student_attendance_logs.md))
- `student_daily_log` - Daily student activity logs
- `student_emergency_information` - Emergency contact details
- `student_pickup_arrangement_overrides` - Pickup exceptions
- `student_presence_events` - Detailed presence/absence events
- `student_weekly_pickup_arrangements` - Pickup schedules

### Staff Management (11 tables)
- `lesson_diary_entries` - Lesson documentation
- `profile_info_staff` - Staff profiles and details
- `staff_absence_comments` - Absence notes/comments
- `staff_absences` - Staff absence records
- `staff_class_links` - Staff-class assignments
- `staff_contracts` - Employment contracts
- `staff_documents` - Staff document management
- `staff_duty_plan` - Duty assignment plans
- `staff_subjects` - Staff subject specializations
- `staff_work_contracts` - Work arrangement details
- `staff_yearly_preferences` - Annual preferences

### System & Administration (19 tables)
- `change_log` - System change audit log
- `debug_logs` - System debug information
- `protected_roles` - System-protected roles
- `public_holiday_and_breaks` - Holiday/break calendar
- `published_drafts` - Published draft tracking
- `roles` - Role definitions
- `schema_change_log` - Database schema changes
- `subject_icons` - Subject icon management
- `user_codes` - User authentication codes
- `user_group_members` - Group membership
- `user_groups` - User group definitions
- `user_profiles` - User account profiles
- `user_roles` - User role assignments
- `v_is_subrole` - Role hierarchy view table
- `v_primary_email` - Primary email view table
- Plus 4 additional utility tables

## Views

### Attendance & Daily Operations (6 views)
- **`vw_attendance_dashboard`** ⭐ - Attendance dashboard data ([Documentation](views/vw_attendance_dashboard.md))
- `vw_class_checkins_today` - Today's class check-ins
- `vw_daily_absences` - Daily absence summary
- `vw_daily_attendance_by_class` - Class-wise daily attendance
- `vw_daily_attendance_overview` - Overall attendance overview
- `vw_student_attendance_today` - Today's student attendance

### Course & Schedule Management (7 views)
- `vw_course_schedules_detailed` - Detailed course schedules
- `vw_course_summary` - Course summary information
- `vw_enrollments_with_students` - Enrollments with student details
- `vw_lesson_attendance_badges` - Lesson attendance indicators
- `vw_lesson_view_enriched` - Enhanced lesson information
- `vw_lessons_needing_substitute` - Lessons requiring substitutes
- `vw_react_lesson_details` - Lesson details for React frontend

### Family & Student Management (2 views)
- `vw_family_all_members` - Complete family member details
- `vw_student_profiles` - Student profile information

### Registration & Course Planning (4 views)
- `vw_parent_course_windows` - Parent course registration windows
- `vw_parent_open_registration_cta` - Open registration call-to-actions
- `vw_registration_period_courses_by_day` - Courses by day per period
- `vw_registration_period_students_by_day` - Students by day per period

### Staff Management (5 views)
- `vw_erzieher` - Educator/teacher view
- `vw_erzieher_with_email` - Educators with email contacts
- `vw_externa` - External staff view
- `vw_staff` - Staff directory
- `vw_staff_availability_next_7_days` - Upcoming staff availability
- `vw_staff_period_availability` - Period-based staff availability
- `vw_staff_with_preferences` - Staff with preference details

### Academic Structure (4 views)
- `vw_school_days` - School day information
- `vw_structure_school_years_with_periods` - School years with periods
- `vw_subject_grade_hours` - Subject hours by grade
- `vw_subjects_with_grade_and_class_hours` - Subjects with hour allocations

### System & User Management (1 view)
- `vw_user_roles` - User role information

### Materialized Views (3 views)
- `vwm_class_user_creation_stats` - User creation statistics by class
- `vwm_school_semesters_with_year_label` - Semesters with year labels
- `vwm_user_login_profiles` - User login profile cache

## Functions

The database contains 200+ custom functions. Key categories include:

### Authentication & Authorization
- `auth.get_current_user_school_id()` - Get current user's school
- `auth.get_user_role()` - Get user's primary role
- `auth.get_accessible_children()` - Get children user can access
- `auth.get_accessible_class_ids()` - Get accessible class IDs

### Course Management
- `add_course_note()` - Add notes to courses
- Course registration and enrollment processing functions
- Schedule generation and management functions

### Student & Family Management
- `add_family_contact_for_all_children()` - Add family contacts
- `add_student_absence()` - Record student absences
- `add_student_absence_with_times_and_recurrence()` - Complex absence processing

### Data Processing & Validation
- Interview data ingestion functions
- Data normalization functions
- Validation and constraint checking

### Reporting & Analytics
- Attendance calculation functions
- Dashboard data generation
- Statistical reporting functions

### System Maintenance
- Audit logging functions
- Data cleanup and maintenance
- Cache refresh functions

## Key Features

⭐ **Star indicates documented tables/views with detailed analysis**

### Security Features
- Row-level security (RLS) policies
- School-based data isolation
- Role-based access control
- Audit trail for all changes

### Performance Features
- Materialized views for expensive queries
- Strategic indexing on high-traffic tables
- Query optimization through views

### Data Integrity
- Foreign key constraints
- Check constraints for valid values
- Trigger-based validation
- Soft delete patterns

---

*This index is generated from the actual database schema in flexwise28082025dump.sql*