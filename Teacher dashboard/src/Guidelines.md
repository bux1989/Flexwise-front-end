# AI Development Guidelines for Teacher Dashboard

## ⚠️ PROTECTED AREAS - DO NOT MODIFY

The following components and functionality are **STRICTLY OFF-LIMITS** and should never be modified, updated, or refactored without explicit permission:

### 1. Stundenplan (Schedule) Section
**Location**: Top-left card in the main dashboard

**Protected Elements**:
- The entire schedule card component and its content
- Date selection functionality (Heute button, calendar picker)
- All lesson display logic and styling
- Attendance status badges (green, orange, red indicators)
- Lesson status indicators (UB, Vertretung, Raumwechsel, etc.)
- Time display format and layout
- Current lesson highlighting
- All lesson-related state management

**Protected State Variables**:
- `selectedDate`
- `isDatePickerOpen` 
- `lessons` and `setLessons`
- All lesson-related data structures

**Protected Functions**:
- `handleDateSelect`
- `handleTodayClick`
- `handleAttendanceClick`
- All attendance status calculation functions
- Any function that manipulates lesson data

### 2. Attendance & Klassenbuch System
**Location**: Popup dialogs triggered from schedule attendance badges

**Protected Elements**:
- The entire attendance dialog (`attendanceDialogOpen`)
- All attendance tracking functionality
- Student status management (present, late, excused, unexcused)
- Attendance overview and edit modes
- Lesson note creation and editing
- Student excuse functionality
- Pre-existing absence handling
- All attendance-related dialogs and popups

**Protected State Variables**:
- `attendanceDialogOpen`
- `attendanceViewMode`
- `selectedLessonForAttendance`
- `excuseDialogOpen`
- `selectedStudentForExcuse`
- `excuseReason`
- `tempAttendance`
- `lessonNote`
- `editingLessonNote`
- `tempLessonNote`

**Protected Functions**:
- `switchToEditMode`
- `setStudentStatus`
- `setStudentExcuseReason`
- `setStudentArrivalTime`
- `setStudentLateExcused`
- `setAllStudentsStatus`
- `saveAttendance`
- `handleExcuseStudent`
- `confirmExcuseStudent`
- `deleteExcuseStudent`
- `startEditingLessonNote`
- `saveLessonNote`
- `cancelEditingLessonNote`
- `shouldShowPreExistingAbsences`

**Protected Dialogs**:
- Main attendance dialog (Anwesenheit)
- Excuse student dialog
- Any popup related to classroom book functionality

### 3. Helper Functions & Utilities
**Location**: `/utils/helpers.ts`

**Protected Functions**:
- `needsAttendanceTracking`
- `getAttendanceStatus`
- `getAttendanceSummary`
- `getAttendanceNumbers`
- `createLessonNoteWithMetadata`
- `parseLessonNote`
- `formatCompactTimestamp`
- `getTeacherAbbreviation`

### 4. Mock Data
**Location**: `/constants/mockData.ts`

**Protected Data**:
- `INITIAL_LESSONS` - All lesson/schedule data
- Any attendance-related mock data structures
- Student data within lessons

### 5. Header Klassenbuch Functionality
**Location**: `/components/Header.tsx`

**Protected Elements**:
- The Klassenbuch button and its functionality
- Any navigation to classroom book features

## ✅ MODIFIABLE AREAS

The following sections CAN be modified:

### 1. Info Board
- The info board card (top-right)
- Info board content and announcements
- Vertretungsstunden toggle functionality

### 2. Events Section (Veranstaltungen)
- The events card (bottom-left)
- Event RSVP functionality
- Event display and filtering
- "mehr anzeigen/weniger anzeigen" functionality

### 3. Tasks Section (Aufgaben)
- The tasks card (bottom-right)  
- Task creation, editing, and management
- Task filtering and search
- Task comments and completion
- "mehr anzeigen/weniger anzeigen" functionality

### 4. General UI Improvements
- Styling and layout adjustments (except for schedule/attendance)
- Adding new non-schedule related features
- Performance optimizations that don't affect schedule/attendance logic

## 🔧 MODIFICATION RULES

1. **Before making any changes**, verify that the modification does not affect the protected areas
2. **Never refactor** or extract components from the protected schedule/attendance system
3. **Preserve all existing functionality** in protected areas
4. **Test thoroughly** to ensure no protected functionality is broken
5. **When in doubt**, ask for clarification before proceeding

## 📝 RATIONALE

The schedule and attendance system represents critical school administration functionality that must remain stable and reliable. These systems handle sensitive student data and are essential for regulatory compliance and daily school operations.

Any modifications to these protected areas could:
- Disrupt daily classroom operations
- Cause data integrity issues
- Break compliance with educational regulations
- Impact teacher workflow and productivity

## 🚨 VIOLATION CONSEQUENCES

Modifying protected areas without permission may result in:
- Broken attendance tracking
- Data loss or corruption
- System instability
- Compliance violations
- Disrupted school operations

**Always respect these guidelines and ask for clarification when uncertain.**