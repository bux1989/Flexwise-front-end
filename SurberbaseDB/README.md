# Flexwise Supabase Database Documentation

This directory contains comprehensive documentation for the Flexwise school management system database, generated from the actual database dump `flexwise28082025dump.sql`.

## Database Overview

The Flexwise database is a comprehensive school management system built on Supabase (PostgreSQL) that supports:

- **Student Management**: Enrollment, profiles, families, emergency contacts
- **Course Management**: Course offerings, schedules, applications, enrollments  
- **Attendance Tracking**: Daily logs, presence events, absence management
- **Staff Management**: Staff profiles, contracts, absences, preferences, subjects
- **Academic Structure**: Schools, years, semesters, classes, rooms, periods
- **Scheduling**: Course schedules, substitutions, daily rostering
- **Communication**: Bulletin posts, notifications, document management
- **Security**: Row-level security policies, user roles and permissions

## Database Schema Structure

The database contains **82 public tables** organized into logical modules:

### Core Academic Structure (11 tables)
- `structure_schools` - School definitions and settings
- `structure_school_years` - Academic year periods  
- `structure_school_semesters` - Semester definitions
- `structure_classes` - Class/grade definitions
- `structure_rooms` - Physical room management
- `structure_days` - Day type definitions
- `structure_school_days` - Academic calendar
- `schedule_periods` - Time period definitions
- `subjects` - Subject/course catalog
- `subject_grade_hours` - Grade-specific subject hours
- `subject_class_hours` - Class-specific subject hours

### Student Management (12 tables)
- `profile_info_student` - Student profiles and basic info
- `families` - Family/household records
- `family_members` - Family member details
- `family_member_child_links` - Parent-child relationships
- `student_emergency_information` - Emergency contact details
- `student_daily_log` - Daily student activity logs
- `student_attendance_logs` - Attendance tracking
- `student_presence_events` - Detailed presence/absence events
- `student_absence_notes` - Absence documentation
- `student_absence_recurrences` - Recurring absence patterns
- `student_weekly_pickup_arrangements` - Pickup schedules
- `student_pickup_arrangement_overrides` - Pickup exceptions

### Course & Scheduling (15 tables)
- `course_list` - Available courses catalog
- `course_offers` - Course offerings per period
- `course_registration_windows` - Registration time windows
- `course_applications` - Student course applications
- `course_enrollments` - Confirmed course enrollments
- `course_schedules` - Detailed course schedules
- `course_lessons` - Individual lesson records
- `course_possible_times` - Available time slots
- `course_allocation_drafts` - Schedule planning drafts
- `course_notes` - Course-specific notes
- `registration_periods` - Registration period definitions
- `schedule_drafts` - Schedule draft versions
- `schedule_daily_rostering` - Daily staff assignments
- `schedule_calendar_exceptions` - Calendar exceptions
- `substitutions` - Substitute teacher assignments

### Staff Management (11 tables)
- `profile_info_staff` - Staff profiles and details
- `staff_contracts` - Employment contracts
- `staff_work_contracts` - Work arrangement details
- `staff_class_links` - Staff-class assignments
- `staff_subjects` - Staff subject specializations
- `staff_absences` - Staff absence records
- `staff_absence_comments` - Absence notes/comments
- `staff_duty_plan` - Duty assignment plans
- `staff_yearly_preferences` - Annual preferences
- `staff_documents` - Staff document management
- `lesson_diary_entries` - Lesson documentation

### Communication & Content (7 tables)
- `bulletin_posts` - Bulletin board posts
- `bulletin_post_users` - Post visibility/targeting
- `bulletin_recurrences` - Recurring bulletin patterns
- `contacts` - Contact information management
- `document_types` - Document type definitions
- `student_course_wish_choices` - Course preference choices
- `student_course_wish_submissions` - Course preference submissions

### System & Administration (10 tables)
- `user_profiles` - User account profiles
- `user_roles` - User role assignments
- `user_groups` - User group definitions
- `user_group_members` - Group membership
- `user_codes` - User authentication codes
- `roles` - Role definitions
- `protected_roles` - System-protected roles
- `change_log` - System change audit log
- `schema_change_log` - Database schema changes
- `debug_logs` - System debug information

### Special Purpose (16 tables)
- `public_holiday_and_breaks` - Holiday/break calendar
- `published_drafts` - Published draft tracking
- `v_is_subrole` - Role hierarchy view table
- `v_primary_email` - Primary email view table
- Plus 12 additional system and utility tables

## Database Views (29 views)

The database includes 29 views for common queries and reporting:

### Attendance & Daily Operations
- `vw_attendance_dashboard` - Attendance dashboard data
- `vw_class_checkins_today` - Today's class check-ins
- `vw_daily_absences` - Daily absence summary
- `vw_daily_attendance_by_class` - Class-wise daily attendance
- `vw_daily_attendance_overview` - Overall attendance overview
- `vw_student_attendance_today` - Today's student attendance

### Course & Schedule Management  
- `vw_course_schedules_detailed` - Detailed course schedules
- `vw_course_summary` - Course summary information
- `vw_enrollments_with_students` - Enrollments with student details
- `vw_lesson_view_enriched` - Enhanced lesson information
- `vw_lesson_attendance_badges` - Lesson attendance indicators
- `vw_lessons_needing_substitute` - Lessons requiring substitutes
- `vw_react_lesson_details` - Lesson details for React frontend

### Staff Management
- `vw_staff` - Staff directory
- `vw_staff_availability_next_7_days` - Upcoming staff availability
- `vw_staff_period_availability` - Period-based staff availability  
- `vw_staff_with_preferences` - Staff with preference details
- `vw_erzieher` - Educator/teacher view
- `vw_erzieher_with_email` - Educators with email contacts
- `vw_externa` - External staff view

### Family & Student Management
- `vw_family_all_members` - Complete family member details
- `vw_student_profiles` - Student profile information

### Registration & Course Planning
- `vw_parent_course_windows` - Parent course registration windows
- `vw_parent_open_registration_cta` - Open registration call-to-actions
- `vw_registration_period_courses_by_day` - Courses by day per period
- `vw_registration_period_students_by_day` - Students by day per period

### Academic Structure
- `vw_school_days` - School day information
- `vw_structure_school_years_with_periods` - School years with periods
- `vw_subject_grade_hours` - Subject hours by grade
- `vw_subjects_with_grade_and_class_hours` - Subjects with hour allocations

### System & User Management
- `vw_user_roles` - User role information

### Materialized Views (3)
- `vwm_class_user_creation_stats` - User creation statistics by class
- `vwm_school_semesters_with_year_label` - Semesters with year labels
- `vwm_user_login_profiles` - User login profile cache

## Database Functions

The database includes 200+ custom functions for business logic, data validation, and automation. Key function categories include:

- **Authentication & Authorization**: User role management, permission checking
- **Course Management**: Registration processing, enrollment logic
- **Attendance Processing**: Absence calculation, attendance reporting
- **Data Validation**: Input validation, constraint checking
- **Audit & Logging**: Change tracking, debug logging
- **Report Generation**: Dashboard data, analytics

## Security Model

The database implements comprehensive row-level security (RLS) with:

- **User Authentication**: Supabase Auth integration
- **Role-Based Access**: Staff, parent, student, admin roles
- **Data Isolation**: School-based data segregation
- **Family Privacy**: Family-based access controls
- **Audit Trails**: Complete change logging

## Files in this Directory

- `flexwise28082025dump.sql` - Complete database dump from August 28, 2025
- `README.md` - This documentation file (you are here)
- `schema-index.md` - Complete index of all database objects with organized categories
- `quick-reference.md` - Common queries, functions, and usage patterns
- `tables/` - Detailed documentation for key database tables
- `views/` - Documentation for important database views

## Next Steps

This README provides an overview of the database structure. For detailed analysis of specific tables, views, or functions, examine the SQL dump file directly or use database analysis tools.

## Database Statistics

- **Total Tables**: 82 public tables (plus system tables)
- **Total Views**: 29 views (26 regular + 3 materialized)
- **Total Functions**: 200+ custom functions
- **Database Size**: ~30,000 lines of SQL
- **Primary Language**: PostgreSQL with Supabase extensions

---

*Documentation generated from flexwise28082025dump.sql on August 28, 2025*