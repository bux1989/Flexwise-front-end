---
name: course-distribution
description: A component that displays courses and students with their preferences and allows moving students between courses
keywords:
- course
- enrollment
- distribution
- students
- wishes
- preferences
---

#### Course Distribution

***Purpose:***
A presentational component that displays courses and students with their preferences, allowing users to move students between courses based on their wishes.

***Features:***
- Displays a header with semester information, search field, and day selector
- Shows a waiting list for students who need placement
- Shows a student preference grid with color-coded wish buttons
- Groups students by their current enrollment in courses
- Shows a "Going Home" section for students with no course assignment
- Displays course sections with capacity information and student lists
- Allows moving students between courses by clicking on preference buttons
- Provides search functionality to filter students by name or class
- Filters courses by day number using the day selector dropdown
- Includes course management features like lock/unlock, approval, and notes
- Supports expandable course details and notes sections

***Properties:***
- students: array - List of student objects with id, name, class, choices, and current_enrollment
- courses: array - List of course objects with id, window_id, name, teacher, room, capacity, day_of_week, and other details
- currentSemester: string - The current semester to display (e.g., "Fall 2024")
- daysOfWeek: array - List of day objects with day_id, day_number, name_en, and name_de fields
- availableDays: array - Legacy list of day names as strings (e.g., ["Monday", "Tuesday", ...])
- searchQuery: string - The current search query for filtering students
- loading: boolean - Whether data is currently loading

***Events:***
- dayChange: Triggered when the selected day changes. Payload: { value: selectedDayNumber }
- searchChange: Triggered when the search query changes. Payload: { value: "search query" }
- studentMove: Triggered when a student is moved to a course. Payload: { studentId: "student-id", courseId: "course-id" }
- courseLockToggle: Triggered when a course is locked or unlocked. Payload: { courseId: "course-id", lockState: true|false }
- courseApprove: Triggered when a course is approved. Payload: { courseId: "course-id" }
- courseNotesOpen: Triggered when the notes section for a course is opened. Payload: { courseId: "course-id" }
- courseNoteAdd: Triggered when a note is added to a course. Payload: { courseId: "course-id", note: {author, date, content, problem_flag} }
- courseNoteEdit: Triggered when a note is edited. Payload: { courseId: "course-id", noteIndex: 0, note: {author, date, content, problem_flag} }
- courseNoteDelete: Triggered when a note is deleted. Payload: { courseId: "course-id", noteIndex: 0 }

***Notes:***
- This is a purely presentational component - it doesn't make backend calls or handle data mutations
- Students are displayed in a grid showing their three preferences with color-coding:
  - 1st choice: Green
  - 2nd choice: Blue
  - 3rd choice: Orange
  - Current assignment: Filled background
- Students can be moved between courses by clicking on their preference buttons
- The waiting list shows students who need placement (not enrolled and not going home as first choice)
- Students can also be moved to a waiting list
- The component displays an empty state message when no courses or students are available
- Courses are filtered by the day_of_week property matching the selected day_number from the dropdown
- The search functionality filters students by name or class
- Course sections include expandable details and notes management
- Course headers display enrollment badges, status indicators, and action buttons