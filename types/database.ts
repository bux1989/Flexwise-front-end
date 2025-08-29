// Database Type Definitions for Flexwise
// Generated from Supabase schema

// ================================
// ENUMS
// ================================

export type AccountStatus = 
  | 'none' 
  | 'created' 
  | 'invited' 
  | 'active' 
  | 'inactive' 
  | 'expired' 
  | 'suspended' 
  | 'deleted';

export type AttendanceStatus = 
  | 'present' 
  | 'late' 
  | 'absent_unexcused' 
  | 'absent_excused' 
  | 'left_early';

export type PresenceStatus = 
  | 'present' 
  | 'absent_unexcused' 
  | 'absent_excused' 
  | 'unmarked' 
  | 'left_early' 
  | 'left_without_notice' 
  | 'temporarily_offsite' 
  | 'late' 
  | 'partial';

export type PresenceEventType = 
  | 'check_in' 
  | 'check_out' 
  | 'temporary_exit' 
  | 'temporary_return' 
  | 'manual_edit';

export type SubjectType = 
  | 'school_subject' 
  | 'module_subject' 
  | 'termin';

export type FamilyRole = 
  | 'student' 
  | 'parent' 
  | 'guardian' 
  | 'staff' 
  | 'other';

export type ContactType = 
  | 'email' 
  | 'phone' 
  | 'address';

export type ContactStatus = 
  | 'valid' 
  | 'invalid' 
  | 'archived';

// ================================
// CORE TABLES
// ================================

export interface UserProfile {
  id: string;
  school_id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null; // date
  gender: string | null;
  profile_picture_url: string | null;
  role_id: string | null;
  account_status: AccountStatus;
  created_at: string; // timestamp
}

export interface Role {
  id: string;
  name: string;
  is_subrole: boolean;
}

export interface UserRole {
  id: number;
  user_profile_id: string;
  role_id: string;
  school_id: string;
  created_at: string; // timestamp
}

export interface StructureSchool {
  id: string;
  name: string;
  timezone: string | null;
  language: string | null;
  year_groups: number[] | null;
  Logo: string | null;
  principal_id: string | null;
  email: string | null;
  phone: string | null;
  fax: string | null;
  address_street: string | null;
  address_city: string | null;
  address_postal_code: string | null;
  address_country: string | null;
}

export interface StructureClass {
  id: string;
  school_id: string;
  name: string;
  year: number;
  teacher_id: string | null;
  grade_level: number | null;
  room_id: string | null;
  color: string | null;
}

export interface StructureRoom {
  id: string;
  school_id: string;
  name: string;
  capacity: number | null;
  room_type: string | null;
  equipment: string[] | null;
}

// ================================
// PROFILE INFO TABLES
// ================================

export interface ProfileInfoStudent {
  profile_id: string;
  class_id: string | null;
  school_id: string;
  date_of_birth: string | null; // date
  middle_name: string | null;
  nickname: string | null;
  allergies: string | null;
  authorized_pickup_ids: string[];
  notes: string | null;
}

export interface ProfileInfoStaff {
  profile_id: string;
  school_id: string;
  skills: string[] | null;
  roles: string[] | null;
  status: 'active' | 'on_leave' | 'archived';
  login_active: boolean;
  last_invited_at: string | null; // timestamp
  joined_at: string | null; // date
  employee_id: string | null;
}

// ================================
// FAMILY & CONTACTS
// ================================

export interface Family {
  id: string;
  school_id: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string; // timestamp
  updated_at: string | null; // timestamp
}

export interface FamilyMember {
  family_id: string;
  profile_id: string;
  role: FamilyRole;
  relation_description: string | null;
  is_primary_guardian: boolean | null;
  is_primary_contact: boolean | null;
  added_at: string; // timestamp
  added_by: string | null;
  removed_at: string | null; // timestamp
  school_id: string;
  notes: string | null;
}

export interface FamilyMemberChildLink {
  id: string;
  family_id: string;
  adult_profile_id: string;
  child_profile_id: string;
  relationship: string | null;
  access_restricted: boolean;
  authorized_for_pickup: boolean;
  pickup_priority: number | null;
  school_id: string;
}

export interface Contact {
  id: string;
  profile_id: string;
  profile_type: string;
  type: ContactType;
  label: string | null;
  value: string;
  is_primary: boolean;
  is_linked_to_user_login: boolean;
  status: ContactStatus;
  notes: string | null;
  school_id: string;
  created_at: string; // timestamp
}

// ================================
// ATTENDANCE SYSTEM
// ================================

export interface StudentDailyLog {
  id: string;
  student_id: string;
  school_id: string;
  date: string; // date
  check_in_time: string | null; // time
  check_out_time: string | null; // time
  check_in_by: string | null;
  check_out_by: string | null;
  presence_status: PresenceStatus;
  expected_arrival_time: string | null; // time
  expected_checkout_time: string | null; // time
  absence_note_id: string | null;
  notes: string | null;
  created_at: string; // timestamp
  updated_at: string; // timestamp
  last_updated_by: string | null;
}

export interface StudentAttendanceLog {
  id: string;
  lesson_id: string;
  student_id: string;
  daily_log_id: string | null;
  status: AttendanceStatus | null;
  lateness_duration_minutes: number | null;
  method: string | null;
  recorded_by: string | null;
  timestamp: string; // timestamp
  notes: string | null;
  absence_note_id: string | null;
  school_id: string;
}

export interface StudentAbsenceNote {
  id: string;
  student_id: string;
  school_id: string;
  created_by: string;
  created_at: string; // timestamp
  start_date: string; // date
  end_date: string; // date
  absence_type: string;
  reason: string | null;
  is_excused: boolean;
  status: string;
  approved_by: string | null;
  approved_at: string | null; // timestamp
  attachment_url: string | null;
  recurrence_id: string | null;
  sensitive: boolean;
  deleted_at: string | null; // timestamp
  absence_status: string | null;
}

export interface StudentPresenceEvent {
  id: string;
  daily_log_id: string;
  student_id: string;
  event_type: PresenceEventType;
  timestamp: string; // timestamp
  method: string | null;
  performed_by: string | null;
  notes: string | null;
  school_id: string;
}

// ================================
// COURSE & LESSON MANAGEMENT
// ================================

export interface CourseList {
  id: string;
  school_id: string;
  name: string;
  course_code: string | null;
  subject_id: string | null;
  max_students: number | null;
  start_date: string | null; // date
  end_date: string | null; // date
  is_active: boolean;
  is_for_year_g: number[] | null;
  possible_room_id: string | null;
  created_at: string; // timestamp
  updated_at: string | null; // timestamp
}

export interface CourseLesson {
  id: string;
  course_id: string | null;
  subject_id: string | null;
  class_id: string | null;
  room_id: string | null;
  primary_teacher_id: string | null;
  teacher_ids: string[];
  start_datetime: string; // timestamp
  end_datetime: string; // timestamp
  period_id: string | null;
  schedule_id: string | null;
  is_cancelled: boolean;
  is_archived: boolean | null;
  notes: string | null;
  school_id: string;
}

export interface CourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  school_id: string;
  schedule_ids: string[];
  assigned_at: string; // timestamp
  start_date: string; // date
  end_date: string; // date
  is_trial: boolean;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  abbreviation: string | null;
  color: string | null;
  subject_type: SubjectType | null;
  icon_id: string | null;
  description: string | null;
}

export interface SchedulePeriod {
  id: string;
  school_id: string;
  block_number: number;
  start_time: string; // time
  end_time: string; // time
  label: string | null;
  attendance_requirement: boolean;
  block_type: string | null;
}

// ================================
// USER GROUPS
// ================================

export interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  school_id: string;
  created_at: string; // timestamp
}

export interface UserGroupMember {
  group_id: string;
  user_id: string;
  school_id: string;
}

// ================================
// JOINED TYPES (WITH RELATIONS)
// ================================

export interface UserProfileWithRole extends UserProfile {
  role?: Role;
  roles?: Role[]; // From user_roles table
  school?: StructureSchool;
}

export interface StudentWithProfile extends ProfileInfoStudent {
  profile?: UserProfile;
  class?: StructureClass;
}

export interface StaffWithProfile extends ProfileInfoStaff {
  profile?: UserProfile;
}

export interface AttendanceLogWithProfile extends StudentAttendanceLog {
  student?: UserProfile;
  lesson?: CourseLesson;
  recorded_by_profile?: UserProfile;
}

export interface LessonWithDetails extends CourseLesson {
  course?: CourseList;
  subject?: Subject;
  class?: StructureClass;
  room?: StructureRoom;
  primary_teacher?: UserProfile;
  teacher_profiles?: UserProfile[];
}

export interface FamilyWithMembers extends Family {
  members?: (FamilyMember & { profile?: UserProfile })[];
  children?: UserProfile[];
  adults?: UserProfile[];
}

// ================================
// API RESPONSE TYPES
// ================================

export interface AttendanceSummary {
  lesson_id: string;
  total_students: number;
  present_count: number;
  late_count: number;
  absent_excused_count: number;
  absent_unexcused_count: number;
  completion_percentage: number;
}

export interface DailyAttendanceSummary {
  date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  early_departure_count: number;
}

// ================================
// FORM TYPES
// ================================

export interface CreateUserProfilePayload {
  first_name: string;
  last_name: string;
  school_id: string;
  role_id?: string;
  date_of_birth?: string;
  gender?: string;
  account_status?: AccountStatus;
}

export interface CreateStudentPayload extends CreateUserProfilePayload {
  class_id?: string;
  parent_contacts?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    relationship: string;
    authorized_for_pickup: boolean;
  }[];
}

export interface AttendanceSubmission {
  lesson_id: string;
  attendance_records: {
    student_id: string;
    status: AttendanceStatus;
    notes?: string;
    lateness_duration_minutes?: number;
  }[];
}

export interface AbsenceNotePayload {
  student_id: string;
  start_date: string;
  end_date: string;
  absence_type: string;
  reason?: string;
  attachment_url?: string;
}

// ================================
// HELPER TYPES
// ================================

export type DatabaseTables = 
  | 'user_profiles'
  | 'roles'
  | 'user_roles'
  | 'structure_schools'
  | 'structure_classes'
  | 'structure_rooms'
  | 'profile_info_student'
  | 'profile_info_staff'
  | 'families'
  | 'family_members'
  | 'family_member_child_links'
  | 'contacts'
  | 'student_daily_log'
  | 'student_attendance_logs'
  | 'student_absence_notes'
  | 'student_presence_events'
  | 'course_list'
  | 'course_lessons'
  | 'course_enrollments'
  | 'subjects'
  | 'schedule_periods'
  | 'user_groups'
  | 'user_group_members';

// Export a type map for dynamic table access
export interface DatabaseSchema {
  user_profiles: UserProfile;
  roles: Role;
  user_roles: UserRole;
  structure_schools: StructureSchool;
  structure_classes: StructureClass;
  structure_rooms: StructureRoom;
  profile_info_student: ProfileInfoStudent;
  profile_info_staff: ProfileInfoStaff;
  families: Family;
  family_members: FamilyMember;
  family_member_child_links: FamilyMemberChildLink;
  contacts: Contact;
  student_daily_log: StudentDailyLog;
  student_attendance_logs: StudentAttendanceLog;
  student_absence_notes: StudentAbsenceNote;
  student_presence_events: StudentPresenceEvent;
  course_list: CourseList;
  course_lessons: CourseLesson;
  course_enrollments: CourseEnrollment;
  subjects: Subject;
  schedule_periods: SchedulePeriod;
  user_groups: UserGroup;
  user_group_members: UserGroupMember;
}
