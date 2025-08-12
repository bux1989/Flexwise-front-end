---
name: schedule-table
description: A customizable schedule table component for displaying teacher timetables with days and periods in a structured format, with detailed lesson information in a tooltip-style info box
keywords: schedule, timetable, table, teachers, education, periods, days, lessons, tooltip, info box, planning, draft, workload
---

### Schedule Table

***Purpose:***
Displays a structured timetable/schedule grid showing teachers across days and periods, ideal for educational institutions to visualize teaching schedules and lesson assignments. Includes a tooltip-style info box for detailed lesson information and a planning mode for creating draft schedules.

***Features:***

- Automatically sorts days and periods by their numerical order
- Customizable styling for headers, borders, and cell padding
- Data cells include data attributes for day, period, and teacher for potential integrations
- Responsive design with horizontal scrolling for small screens
- Displays lesson information in cells based on teacher, day, and period matching
- Supports different display formats based on available lesson data (class/subject or course)
- Interactive cells that open a tooltip-style info box when clicked
- Smart positioning of info box to ensure visibility within viewport
- Visual highlighting of selected cells only when they contain lessons (in live mode)
- Exposes selected lesson data as a component variable
- Planning mode for creating and editing draft schedules
- Inline form interface for adding, editing, and deleting draft lessons
- Click on empty cells in planning mode to add new lessons
- Click on filled cells in planning mode to edit existing draft lessons
- Teacher workload tracking showing planned lessons vs. available hours
- Color-coded workload indicators (normal, warning, full, over capacity)
- Tooltips explaining workload status and remaining capacity

***Properties:***

- teachers: Array - List of teacher objects with first_name, last_name, hours_account, and age_reduction properties
- days: Array - List of day objects with name_de (day name) and day_number (for sorting) properties
- periods: Array - List of period objects with block_number (for sorting) properties
- lessons: Array - List of lesson objects with teacher_names, day_name_de, block_number, class_name, subject_name, course_name, scheduled_room_name, and enrolled_students_names properties
- headerBackgroundColor: string - Background color for table headers
- borderColor: string - Color for table borders
- cellPadding: string - Padding inside each table cell (CSS length value)
- mode: string - 'live' or 'planning' mode for viewing or editing schedules
- draftLessons: Array - List of draft lesson objects for planning mode
- availableSubjects: Array - List of subject objects with id and name properties for planning mode
- availableClasses: Array - List of class objects with id and name properties for planning mode
- availableRooms: Array - List of room objects with id and name properties for planning mode

***Events:***

- lessonSelected: Triggered when a schedule cell with a lesson is clicked. Payload contains the complete lesson object.
- assignDraftLesson: Triggered when a draft lesson is created or updated. Payload contains the lesson data.
- updateLesson: Triggered when an existing draft lesson is updated. Payload contains the updated lesson data.
- deleteDraftLesson: Triggered when a draft lesson is deleted. Payload contains the lesson ID.

***Exposed Variables:***

- selectedLesson: The currently selected lesson object with all its properties. (path: variables['current_element_uid-selectedLesson'])

***Notes:***

- The table structure creates cells that are populated with lesson data when available
- Each cell includes data attributes (data-day, data-period, data-teacher) for easy identification
- Days are automatically sorted by day_number property
- Periods are automatically sorted by block_number property
- Lesson display logic:
  - If class_name and subject_name are available: Shows class name in bold followed by first two characters of subject name
  - If only course_name is available: Shows first two characters of course name
- Clicking on a cell with lesson data opens an info box showing detailed information about the lesson
- Empty cells in live mode don't highlight when clicked
- The info box displays teacher names, class, subject/course, room, and up to 5 enrolled students
- The info box is positioned intelligently near the clicked cell, adjusting to ensure it remains within the viewport
- Clicking outside the info box or on its close button will dismiss it
- Planning mode allows adding new lessons to empty cells and editing existing draft lessons
- When in planning mode, clicking on any cell opens an inline form near the cell for adding or editing lesson data
- The inline form provides dropdowns for selecting subject, class, and room
- Draft lessons can be deleted from the inline form interface
- Draft lessons are visually distinguished with a green dashed border
- Teacher workload tracking:
  - Shows number of planned lessons compared to available hours (hours_account minus age_reduction)
  - Color coding: normal (0-21), warning/orange (22-27), full/green (28), over/red (29+)
  - Tooltips provide detailed information about workload status and remaining capacity
