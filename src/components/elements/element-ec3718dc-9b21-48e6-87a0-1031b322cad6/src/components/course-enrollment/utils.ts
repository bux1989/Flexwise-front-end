export const filterAndSortStudents = (students, searchQuery) => {
if (!students) return [];

const filtered = searchQuery 
? students.filter(s => 
(s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
(s.class || '').toLowerCase().includes(searchQuery.toLowerCase())
)
: students;

return [...filtered].sort(
(a, b) => (a.class || '').localeCompare(b.class || '') || (a.name || '').localeCompare(b.name || '')
);
};

export const getUnenrolledStudents = (students, searchQuery) => {
const unenrolled = students.filter(student => {
const hasEnrollment = student.current_enrollment !== undefined;
const hasGoHomePreference = [student.first_choice, student.second_choice, student.third_choice].includes('go-home');
const isFirstChoiceGoHome = student.first_choice === 'go-home';

return !hasEnrollment && (!hasGoHomePreference || !isFirstChoiceGoHome);
});

return filterAndSortStudents(unenrolled, searchQuery);
};