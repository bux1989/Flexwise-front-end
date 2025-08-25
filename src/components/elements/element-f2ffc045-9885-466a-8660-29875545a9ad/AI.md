---
name: student-schedule-overview
description: Displays a student's module wishes and pickup plan in a structured two-table format with language support
keywords:
- student
- schedule
- module
- wishes
- pickup
- school
- timetable
---

#### student-schedule-overview

***Purpose:***
Displays a comprehensive overview of a student's module wishes and pickup arrangements organized by weekday, with support for German and English languages.

***Features:***
- Displays module wishes grouped by day and ranked by preference
- Shows pickup information including time, method, and notes for each day
- Supports both German (default) and English languages
- Optional action buttons for editing wishes and pickup information
- Responsive design that works on desktop and mobile devices

***Properties:***
- lang: 'de'|'en' - Language for labels and day names (default: 'de')
- studentName: string - Full name of the student to display in the header
- studentId: string - Student ID to include in event payloads
- days: Array - List of school days to display as columns
- maxWishesRows: number - Maximum number of wish rows to display
- wishesByDay: Object - Object containing wishes grouped by day
- pickupByDay: Object - Object containing pickup information by day
- actions: Object - Configuration for action buttons (canEditWishes, canEditHeimweg, editWishesLink, editHeimwegLink)

***Events:***
- edit-wishes: Triggered when the edit wishes button is clicked. Payload: { studentId: string }
- edit-heimweg: Triggered when the edit pickup info button is clicked. Payload: { studentId: string }

***Notes:***
- The component expects data to be transformed using the provided transformStudentSchedule.js utility
- For pickup methods, the component supports: goes_alone, authorized_pickup, public_transport, and school_bus
- When using authorized_pickup, ensure contacts are properly defined with IDs that match authorizedIds
- The component handles empty states gracefully with em-dashes (—)
- Action buttons can either navigate to links or emit events based on configuration