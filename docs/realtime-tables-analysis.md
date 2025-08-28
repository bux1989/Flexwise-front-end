# FlexWise Real-time Tables Analysis

## All Public Tables in Database

### **Bulletin & Communication**
- `bulletin_post_users` - Users who can see bulletin posts
- `bulletin_posts` - School announcements/info board posts  
- `bulletin_recurrences` - Recurring bulletin posts

### **User Management**
- `user_profiles` - All user profiles (students, teachers, parents)
- `user_roles` - Role assignments 
- `user_groups` - User groupings
- `user_group_members` - Group membership
- `user_codes` - User access codes
- `contacts` - Contact information
- `roles` - Role definitions

### **Family & Student Info**
- `families` - Family groupings
- `family_members` - Family member relationships  
- `family_member_child_links` - Parent-child authorizations
- `profile_info_student` - Student-specific info
- `profile_info_staff` - Staff-specific info
- `profile_info_family_member` - Family member info

### **School Structure**
- `structure_schools` - School entities
- `structure_classes` - Class definitions
- `structure_rooms` - Room information
- `structure_days` - Day definitions
- `structure_school_days` - School day configurations
- `structure_school_semesters` - Semester periods
- `structure_school_years` - Academic years

### **Courses & Lessons**
- `course_list` - Available courses
- `course_lessons` - Individual lesson instances ⭐
- `course_enrollments` - Student course assignments
- `course_notes` - Course-related notes
- `course_offers` - Course offerings
- `course_schedules` - Course scheduling
- `course_applications` - Course applications
- `course_allocation_drafts` - Course allocation planning
- `course_possible_times` - Available time slots
- `course_registration_windows` - Registration periods

### **Attendance System**
- `student_daily_log` - Daily check-in/out tracking ⭐
- `student_attendance_logs` - Lesson-level attendance ⭐
- `student_presence_events` - Presence event tracking ⭐
- `student_absence_notes` - Absence requests/approvals ⭐
- `student_absence_recurrences` - Recurring absences

### **Lesson Documentation**
- `lesson_diary_entries` - Klassenbuch entries ⭐

### **Staff Management**
- `staff_absences` - Staff absence tracking ⭐
- `staff_absence_comments` - Comments on staff absences
- `staff_class_links` - Teacher-class assignments
- `staff_contracts` - Employment contracts
- `staff_documents` - Staff documentation
- `staff_duty_plan` - Duty assignments
- `staff_subjects` - Teacher subject qualifications
- `staff_work_contracts` - Work contracts
- `staff_yearly_preferences` - Annual preferences

### **Substitutions (Vertretung)**
- `substitutions` - Substitute lesson assignments ⭐

### **Student Services**
- `student_course_wish_choices` - Course preferences
- `student_course_wish_submissions` - Course choice submissions
- `student_emergency_information` - Emergency contacts
- `student_pickup_arrangement_overrides` - Pickup arrangement changes
- `student_weekly_pickup_arrangements` - Regular pickup arrangements

### **Academic Structure**
- `subjects` - Subject definitions
- `subject_class_hours` - Subject hour allocations
- `subject_grade_hours` - Grade-level hour requirements  
- `subject_icons` - Subject visual representations
- `schedule_periods` - Time period definitions
- `schedule_daily_rostering` - Daily schedule assignments
- `schedule_drafts` - Schedule planning
- `schedule_calendar_exceptions` - Calendar exceptions

### **Administrative**
- `public_holiday_and_breaks` - Holiday calendar
- `registration_periods` - Registration windows
- `published_drafts` - Published scheduling drafts
- `document_types` - Document type definitions
- `change_log` - System change tracking
- `protected_roles` - Protected role definitions

### **Debug/Logging**
- `debug_logs` - System debugging
- `ingest_interview_debug_log` - Import debugging
- `recurrence_debug_log` - Recurrence debugging
- `schema_change_log` - Database schema changes

---

## Real-time Requirements Analysis

### **🔴 CRITICAL - Must Have Real-time (Safety & Operations)**

1. **`student_daily_log`** - Check-in/out at 14:30 & 16:00 dismissal
2. **`course_lessons`** - Lesson cancellations, room changes 
3. **`substitutions`** - Vertretung assignments
4. **`staff_absences`** - Teacher sick calls triggering substitutions
5. **`bulletin_posts`** - Emergency announcements, schedule changes

### **🟡 HIGH - Should Have Real-time (Daily Operations)**

6. **`student_attendance_logs`** - Live attendance badge updates
7. **`lesson_diary_entries`** - Klassenbuch entries by co-teachers
8. **`student_absence_notes`** - Absence requests/approvals
9. **`student_presence_events`** - Detailed presence tracking

### **🟢 MEDIUM - Nice to Have Real-time (Communication)**

10. **`course_enrollments`** - Student course changes
11. **`student_pickup_arrangement_overrides`** - Pickup changes
12. **`structure_classes`** - Class roster changes

### **⚪ LOW - Future Real-time (Long-term)**

- User management tables (roles, profiles)
- Academic structure (subjects, schedules)
- Administrative tables

---

## Recommended Implementation Order

### **Phase 1: Critical Safety Tables**
```sql
-- Enable critical real-time tables
ALTER PUBLICATION supabase_realtime ADD TABLE student_daily_log;
ALTER PUBLICATION supabase_realtime ADD TABLE course_lessons;  
ALTER PUBLICATION supabase_realtime ADD TABLE substitutions;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_absences;
ALTER PUBLICATION supabase_realtime ADD TABLE bulletin_posts;
```

### **Phase 2: Daily Operations**
```sql  
-- Enable daily operations tables
ALTER PUBLICATION supabase_realtime ADD TABLE student_attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE lesson_diary_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE student_absence_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE student_presence_events;
```

### **Phase 3: Communication Enhancement**
```sql
-- Enable communication tables  
ALTER PUBLICATION supabase_realtime ADD TABLE course_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE student_pickup_arrangement_overrides;
```

⭐ = High priority for real-time based on use cases
