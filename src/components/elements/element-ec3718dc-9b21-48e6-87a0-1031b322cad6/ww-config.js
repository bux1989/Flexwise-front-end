export default {
editor: {
label: { en: 'Course Distribution' },
icon: 'collection',
},
properties: {
students: {
label: { en: 'Students' },
type: 'Array',
section: 'settings',
bindable: true,
defaultValue: [
{ id: 's1', name: '3A Benjamin Harris', class: '3A', first_choice: 'win-archery', second_choice: 'win-volleyball', third_choice: 'go-home', day_of_week: 1, current_enrollment: 'archery' },
{ id: 's2', name: '3B Emily Lee', class: '3B', first_choice: 'win-archery', second_choice: 'win-volleyball', third_choice: 'go-home', day_of_week: 1, current_enrollment: 'archery' },
{ id: 's3', name: '5A Lucas Anderson', class: '5A', first_choice: 'win-archery', second_choice: 'win-football', third_choice: 'win-football', day_of_week: 1, current_enrollment: 'football' },
{ id: 's4', name: '4A Alexander J.', class: '4A', first_choice: 'win-football', second_choice: 'win-volleyball', third_choice: 'go-home', day_of_week: 1, current_enrollment: 'football' },
{ id: 's5', name: '4B Abigail R.', class: '4B', first_choice: 'win-football', second_choice: 'win-volleyball', third_choice: 'go-home', day_of_week: 1, current_enrollment: null },
{ id: 's6', name: '5B Elizabeth H.', class: '5B', first_choice: 'go-home', second_choice: 'win-volleyball', third_choice: 'win-archery', day_of_week: 1, current_enrollment: null }
],
},
courses: {
label: { en: 'Courses' },
type: 'Array',
section: 'settings',
bindable: true,
defaultValue: [
{ id: 'archery', window_id: 'win-archery', name: 'Archery', teacher: 'Mr. A', room: 'A1', max_capacity: 12, available_grades: '3A,3B,5A', day: 'Monday', day_of_week: 1, is_locked: false, enrolled_count: 3, notes_count: 2 },
{ id: 'football', window_id: 'win-football', name: 'Football', teacher: 'Coach F', room: 'Field', max_capacity: 16, available_grades: '4A,4B,5B', day: 'Monday', day_of_week: 1, is_locked: false, enrolled_count: 5, notes_count: 0 },
{ id: 'volleyball', window_id: 'win-volleyball', name: 'Volleyball', teacher: 'Ms. V', room: 'Gym', max_capacity: 14, available_grades: '3A,3B,4A,5A', day: 'Monday', day_of_week: 1, is_locked: true, enrolled_count: 19, notes_count: 3 }
],
},
currentSemester: {
label: { en: 'Current Semester' },
type: 'Text',
section: 'settings',
bindable: true,
defaultValue: 'Fall 2024',
},
availableDays: {
label: { en: 'Available Days' },
type: 'Array',
section: 'settings',
bindable: true,
defaultValue: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
},
daysOfWeek: {
label: { en: 'Days of Week' },
type: 'Array',
section: 'settings',
bindable: true,
defaultValue: [
{ school_id: '1df8108c-692a-48f2-8e22-98dbb6f4fdf4', day_id: 2, day_number: 1, name_en: 'Monday', name_de: 'Montag' },
{ school_id: '1df8108c-692a-48f2-8e22-98dbb6f4fdf4', day_id: 3, day_number: 2, name_en: 'Tuesday', name_de: 'Dienstag' },
{ school_id: '1df8108c-692a-48f2-8e22-98dbb6f4fdf4', day_id: 4, day_number: 3, name_en: 'Wednesday', name_de: 'Mittwoch' },
{ school_id: '1df8108c-692a-48f2-8e22-98dbb6f4fdf4', day_id: 5, day_number: 4, name_en: 'Thursday', name_de: 'Donnerstag' },
{ school_id: '1df8108c-692a-48f2-8e22-98dbb6f4fdf4', day_id: 6, day_number: 5, name_en: 'Friday', name_de: 'Freitag' }
],
},
searchQuery: {
label: { en: 'Search Query' },
type: 'Text',
section: 'settings',
bindable: true,
defaultValue: '',
},
loading: {
label: { en: 'Loading State' },
type: 'OnOff',
section: 'settings',
bindable: true,
defaultValue: false,
}
},
triggerEvents: [
{ name: 'dayChange', label: { en: 'On day change' }, event: { value: '' } },
{ name: 'searchChange', label: { en: 'On search change' }, event: { value: '' } },
{ name: 'studentMove', label: { en: 'On student move' }, event: { studentId: '', courseId: '' } },
{ name: 'courseLockToggle', label: { en: 'On course lock toggle' }, event: { courseId: '', lockState: false } },
{ name: 'courseApprove', label: { en: 'On course approve' }, event: { courseId: '' } },
{ name: 'courseNotesOpen', label: { en: 'On course notes open' }, event: { courseId: '' } },
{ name: 'courseNoteAdd', label: { en: 'On course note add' }, event: { courseId: '', note: {} } },
{ name: 'courseNoteEdit', label: { en: 'On course note edit' }, event: { courseId: '', noteIndex: 0, note: {} } },
{ name: 'courseNoteDelete', label: { en: 'On course note delete' }, event: { courseId: '', noteIndex: 0 } }
]
};
