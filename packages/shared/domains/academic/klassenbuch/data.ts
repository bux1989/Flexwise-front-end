// Comprehensive mock data for all classes
import {
  Student,
  Lesson,
  ExcuseInfo,
  ExcuseEditHistory,
  StudentStatistics
} from './utils';

export interface Course {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  day: string;
  time: string;
  room: string;
  type: 'course';
}

export interface CourseStudent {
  id: string;
  name: string;
  originalClass: string;
  courseId: string;
}

export interface AttendanceRecord {
  studentId: string;
  lessonId: string;
  attendance: 'present' | 'late' | 'excused' | 'unexcused';
  date: string;
}


export interface CourseAttendanceEntry {
  code: 'A' | 'S' | 'E' | 'U';
  excuseInfo?: ExcuseInfo; // For 'E' (always) and 'S' (when excused)
}

export interface AbsenceDetail {
  id: string;
  date: string;
  subject: string;
  type: 'excused' | 'unexcused';
  absenceType: 'fehltag' | 'fehlstunde'; // NEW: distinguish between whole day and individual lesson
  reason?: string;
  minutes: number;
  excuseInfo?: ExcuseInfo;
}

export interface LatenessDetail {
  id: string;
  date: string;
  subject: string;
  type: 'excused' | 'unexcused';
  minutes: number;
  reason?: string;
  excuseInfo?: ExcuseInfo;
}


// Current teacher name for filtering
export const CURRENT_TEACHER = 'Schmidt';

// Semester dates
export const SEMESTER_START_DATE = '01.08.2024';
// Re-export getCurrentDateString as getCurrentDate for compatibility
export { getCurrentDateString as getCurrentDate } from './utils';

// Helper function to generate excuse info
const generateExcuseInfo = (type: 'excused' | 'unexcused'): ExcuseInfo | undefined => {
  if (type === 'unexcused') return undefined;
  
  const creators = ['secretary', 'Eltern', 'Bug', 'Ars', 'Schmidt', 'Men'];
  const createdBy = creators[Math.floor(Math.random() * creators.length)];
  
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 10));
  
  const excuseTexts = [
    'Krankheit mit ärztlichem Attest',
    'Familiärer Notfall',
    'Arzttermin - Routineuntersuchung',
    'Erkältung mit Fieber',
    'Zahnarzttermin',
    'Magenverstimmung',
    'Kopfschmerzen und Übelkeit',
    'Verspätete öffentliche Verkehrsmittel',
    'Schulveranstaltung',
    'Familiäre Verpflichtung'
  ];
  
  const hasEditHistory = Math.random() < 0.3; // 30% chance of having edit history
  
  const editHistory: ExcuseEditHistory[] = [];
  if (hasEditHistory) {
    const editDate = new Date(baseDate);
    editDate.setHours(editDate.getHours() + Math.floor(Math.random() * 24));
    
    editHistory.push({
      editorId: 'IMü',
      editorName: 'I. Müller',
      timestamp: editDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ', ' + 
                editDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      previousText: 'Ursprünglicher Entschuldigungstext'
    });
  }
  
  return {
    text: excuseTexts[Math.floor(Math.random() * excuseTexts.length)],
    createdBy,
    createdAt: baseDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
              baseDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    editHistory
  };
};

// Helper function to generate course attendance entry with excuse info
const generateCourseAttendanceEntry = (): CourseAttendanceEntry => {
  const rand = Math.random();
  let code: 'A' | 'S' | 'E' | 'U';
  let excuseInfo: ExcuseInfo | undefined;

  if (rand < 0.75) {
    code = 'A'; // 75% present
  } else if (rand < 0.85) {
    code = 'S'; // 10% late
    // 70% of late arrivals have excuses
    if (Math.random() < 0.7) {
      excuseInfo = generateExcuseInfo('excused');
    }
  } else if (rand < 0.95) {
    code = 'E'; // 10% excused
    excuseInfo = generateExcuseInfo('excused'); // E always has excuse info
  } else {
    code = 'U'; // 5% unexcused
  }

  return { code, excuseInfo };
};

// Generate realistic absence data with mix of fehltage and fehlstunden
const generateAbsenceDetails = (studentId: string, totalFehltage: number, totalFehlstunden: number, excusedRatio: number = 0.7): AbsenceDetail[] => {
  const subjects = ['Ma', 'De', 'En', 'Ph', 'Bio', 'Ch', 'GeWi', 'NaWi', 'Eth'];
  const details: AbsenceDetail[] = [];
  
  // Generate Fehltage (whole days)
  const excusedFehltage = Math.floor(totalFehltage * excusedRatio);
  const unexcusedFehltage = totalFehltage - excusedFehltage;
  
  for (let i = 0; i < excusedFehltage; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Last 60 days
    details.push({
      id: `${studentId}-fehltag-e-${i}`,
      date: date.toLocaleDateString('de-DE'),
      subject: 'Ganzer Tag', // Whole day
      type: 'excused',
      absenceType: 'fehltag',
      reason: ['Krankheit', 'Arzttermin', 'Familienangelegenheit'][Math.floor(Math.random() * 3)],
      minutes: 360, // Roughly 8 lessons * 45 minutes
      excuseInfo: generateExcuseInfo('excused')
    });
  }
  
  for (let i = 0; i < unexcusedFehltage; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
    details.push({
      id: `${studentId}-fehltag-u-${i}`,
      date: date.toLocaleDateString('de-DE'),
      subject: 'Ganzer Tag',
      type: 'unexcused',
      absenceType: 'fehltag',
      minutes: 360
    });
  }
  
  // Generate Fehlstunden (individual lessons)
  const excusedFehlstunden = Math.floor(totalFehlstunden * excusedRatio);
  const unexcusedFehlstunden = totalFehlstunden - excusedFehlstunden;
  
  for (let i = 0; i < excusedFehlstunden; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Last 60 days
    details.push({
      id: `${studentId}-fehlstunde-e-${i}`,
      date: date.toLocaleDateString('de-DE'),
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      type: 'excused',
      absenceType: 'fehlstunde',
      reason: ['Krankheit', 'Arzttermin', 'Familienangelegenheit', 'Schulveranstaltung'][Math.floor(Math.random() * 4)],
      minutes: 45, // One lesson
      excuseInfo: generateExcuseInfo('excused')
    });
  }
  
  for (let i = 0; i < unexcusedFehlstunden; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
    details.push({
      id: `${studentId}-fehlstunde-u-${i}`,
      date: date.toLocaleDateString('de-DE'),
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      type: 'unexcused',
      absenceType: 'fehlstunde',
      minutes: 45
    });
  }
  
  return details.sort((a, b) => new Date(b.date.split('.').reverse().join('-')).getTime() - new Date(a.date.split('.').reverse().join('-')).getTime());
};

const generateLatenessDetails = (studentId: string, excusedMinutes: number, unexcusedMinutes: number): LatenessDetail[] => {
  const subjects = ['Ma', 'De', 'En', 'Ph', 'Bio', 'Ch', 'GeWi', 'NaWi', 'Eth'];
  const details: LatenessDetail[] = [];
  
  // Generate excused lateness
  let remainingExcused = excusedMinutes;
  let excusedIndex = 0;
  while (remainingExcused > 0) {
    const minutes = Math.min(remainingExcused, Math.floor(Math.random() * 15) + 5); // 5-20 minutes
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 45)); // Last 45 days
    details.push({
      id: `${studentId}-lateness-e-${excusedIndex}`,
      date: date.toLocaleDateString('de-DE'),
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      type: 'excused',
      minutes,
      reason: ['Verspätete öffentliche Verkehrsmittel', 'Arzttermin', 'Familienangelegenheit'][Math.floor(Math.random() * 3)],
      excuseInfo: generateExcuseInfo('excused')
    });
    remainingExcused -= minutes;
    excusedIndex++;
  }
  
  // Generate unexcused lateness
  let remainingUnexcused = unexcusedMinutes;
  let unexcusedIndex = 0;
  while (remainingUnexcused > 0) {
    const minutes = Math.min(remainingUnexcused, Math.floor(Math.random() * 20) + 5); // 5-25 minutes
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
    details.push({
      id: `${studentId}-lateness-u-${unexcusedIndex}`,
      date: date.toLocaleDateString('de-DE'),
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      type: 'unexcused',
      minutes
    });
    remainingUnexcused -= minutes;
    unexcusedIndex++;
  }
  
  return details.sort((a, b) => new Date(b.date.split('.').reverse().join('-')).getTime() - new Date(a.date.split('.').reverse().join('-')).getTime());
};

// Students data - 20 per class
export const mockStudents: Student[] = [
  // Klasse 9A
  { id: '9a-1', name: 'Anna Mueller', classId: '1' },
  { id: '9a-2', name: 'Ben Schmidt', classId: '1' },
  { id: '9a-3', name: 'Clara Weber', classId: '1' },
  { id: '9a-4', name: 'David Fischer', classId: '1' },
  { id: '9a-5', name: 'Emma Wagner', classId: '1' },
  { id: '9a-6', name: 'Felix Bauer', classId: '1' },
  { id: '9a-7', name: 'Greta Hoffmann', classId: '1' },
  { id: '9a-8', name: 'Henry Koch', classId: '1' },
  { id: '9a-9', name: 'Ida Richter', classId: '1' },
  { id: '9a-10', name: 'Jakob Wolf', classId: '1' },
  { id: '9a-11', name: 'Klara Schneider', classId: '1' },
  { id: '9a-12', name: 'Leon Meyer', classId: '1' },
  { id: '9a-13', name: 'Mia Braun', classId: '1' },
  { id: '9a-14', name: 'Noah Krueger', classId: '1' },
  { id: '9a-15', name: 'Olivia Jung', classId: '1' },
  { id: '9a-16', name: 'Paul Lange', classId: '1' },
  { id: '9a-17', name: 'Quinn Zimmermann', classId: '1' },
  { id: '9a-18', name: 'Rosa Hartmann', classId: '1' },
  { id: '9a-19', name: 'Simon Koehler', classId: '1' },
  { id: '9a-20', name: 'Tina Scholz', classId: '1' },

  // Klasse 9B
  { id: '9b-1', name: 'Alexander Stein', classId: '2' },
  { id: '9b-2', name: 'Bianca Huber', classId: '2' },
  { id: '9b-3', name: 'Christian Mayer', classId: '2' },
  { id: '9b-4', name: 'Diana Fuchs', classId: '2' },
  { id: '9b-5', name: 'Erik Schulz', classId: '2' },
  { id: '9b-6', name: 'Franziska Beck', classId: '2' },
  { id: '9b-7', name: 'Gabriel Winkler', classId: '2' },
  { id: '9b-8', name: 'Hannah Roth', classId: '2' },
  { id: '9b-9', name: 'Isabelle Gross', classId: '2' },
  { id: '9b-10', name: 'Julian Peters', classId: '2' },
  { id: '9b-11', name: 'Katharina Neumann', classId: '2' },
  { id: '9b-12', name: 'Lukas Berger', classId: '2' },
  { id: '9b-13', name: 'Marlene Vogt', classId: '2' },
  { id: '9b-14', name: 'Niklas Horn', classId: '2' },
  { id: '9b-15', name: 'Ophelia Graf', classId: '2' },
  { id: '9b-16', name: 'Patrick Keller', classId: '2' },
  { id: '9b-17', name: 'Quincy Thomas', classId: '2' },
  { id: '9b-18', name: 'Rebecca Moeller', classId: '2' },
  { id: '9b-19', name: 'Stefan Kaiser', classId: '2' },
  { id: '9b-20', name: 'Theresa Schmitt', classId: '2' },

  // Klasse 10A
  { id: '10a-1', name: 'Adrian Becker', classId: '3' },
  { id: '10a-2', name: 'Britta Lehmann', classId: '3' },
  { id: '10a-3', name: 'Cedric Sommer', classId: '3' },
  { id: '10a-4', name: 'Denise Winter', classId: '3' },
  { id: '10a-5', name: 'Elias Hoffmann', classId: '3' },
  { id: '10a-6', name: 'Fabienne Krause', classId: '3' },
  { id: '10a-7', name: 'Gerrit Albrecht', classId: '3' },
  { id: '10a-8', name: 'Helena Engel', classId: '3' },
  { id: '10a-9', name: 'Igor Pfeiffer', classId: '3' },
  { id: '10a-10', name: 'Jana Weiss', classId: '3' },
  { id: '10a-11', name: 'Kevin Schwarz', classId: '3' },
  { id: '10a-12', name: 'Lena Drescher', classId: '3' },
  { id: '10a-13', name: 'Moritz Frank', classId: '3' },
  { id: '10a-14', name: 'Nadine Riedel', classId: '3' },
  { id: '10a-15', name: 'Oliver Thiel', classId: '3' },
  { id: '10a-16', name: 'Petra Hagen', classId: '3' },
  { id: '10a-17', name: 'Quentin Lorenz', classId: '3' },
  { id: '10a-18', name: 'Ramona Ernst', classId: '3' },
  { id: '10a-19', name: 'Sebastian Bach', classId: '3' },
  { id: '10a-20', name: 'Tamara Voigt', classId: '3' },
];

// Course definitions - Updated with proper periods
export const mockCourses: Course[] = [
  { id: 'course-1', name: 'Bowling AG', subject: 'Bowling', teacher: 'Mueller', day: 'Dienstag', time: '13:45-14:30', room: 'Bowling Center', type: 'course' },
  { id: 'course-2', name: 'Tischtennis AG', subject: 'Tischtennis', teacher: 'Weber', day: 'Freitag', time: '11:50-12:35', room: 'Sporthalle 2', type: 'course' },
];

// Course students - mixed from different classes
export const mockCourseStudents: Record<string, CourseStudent[]> = {
  'course-1': [
    { id: '9a-2', name: 'Ben Schmidt', originalClass: '9A', courseId: 'course-1' },
    { id: '9a-7', name: 'Greta Hoffmann', originalClass: '9A', courseId: 'course-1' },
    { id: '9a-12', name: 'Leon Meyer', originalClass: '9A', courseId: 'course-1' },
    { id: '9b-3', name: 'Christian Mayer', originalClass: '9B', courseId: 'course-1' },
    { id: '9b-8', name: 'Hannah Roth', originalClass: '9B', courseId: 'course-1' },
    { id: '9b-14', name: 'Niklas Horn', originalClass: '9B', courseId: 'course-1' },
    { id: '10a-5', name: 'Elias Hoffmann', originalClass: '10A', courseId: 'course-1' },
    { id: '10a-11', name: 'Kevin Schwarz', originalClass: '10A', courseId: 'course-1' },
  ],
  'course-2': [
    { id: '9a-4', name: 'David Fischer', originalClass: '9A', courseId: 'course-2' },
    { id: '9a-15', name: 'Olivia Jung', originalClass: '9A', courseId: 'course-2' },
    { id: '9b-6', name: 'Franziska Beck', originalClass: '9B', courseId: 'course-2' },
    { id: '10a-2', name: 'Britta Lehmann', originalClass: '10A', courseId: 'course-2' },
    { id: '10a-19', name: 'Sebastian Bach', originalClass: '10A', courseId: 'course-2' },
  ],
};

// Generate 20 weeks of dates for courses
const generateCourseWeeks = (startDate: Date, dayOfWeek: number, totalWeeks: number) => {
  const dates = [];
  const currentDate = new Date(startDate);
  
  // Find the first occurrence of the target day
  const dayDiff = dayOfWeek - currentDate.getDay();
  currentDate.setDate(currentDate.getDate() + dayDiff + (dayDiff < 0 ? 7 : 0));
  
  for (let i = 0; i < totalWeeks; i++) {
    dates.push(new Date(currentDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }));
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return dates;
};

// Generate course attendance data for 20 weeks with excuse information
const generateCourseAttendance = (courseId: string) => {
  const students = mockCourseStudents[courseId];
  const course = mockCourses.find(c => c.id === courseId);
  
  if (!students || !course) return { dates: [], studentAttendance: [] };
  
  const dayMap = { 'Montag': 1, 'Dienstag': 2, 'Mittwoch': 3, 'Donnerstag': 4, 'Freitag': 5 };
  const dayOfWeek = dayMap[course.day as keyof typeof dayMap];
  
  // Start from current week
  const startDate = new Date();
  const dates = generateCourseWeeks(startDate, dayOfWeek, 20);
  
  const studentAttendance = students.map(student => {
    const attendance: CourseAttendanceEntry[] = dates.map(() => generateCourseAttendanceEntry());
    
    const totals = {
      present: attendance.filter(a => a.code === 'A').length,
      late: attendance.filter(a => a.code === 'S').length,
      excused: attendance.filter(a => a.code === 'E').length,
      unexcused: attendance.filter(a => a.code === 'U').length,
    };
    
    return {
      studentId: student.id,
      name: `${student.name} (${student.originalClass})`,
      attendance,
      totals
    };
  });
  
  return { dates, studentAttendance };
};

// Generate realistic student statistics with fehltage and fehlstunden
const generateStudentStats = (id: string, name: string, classId: string): StudentStatistics => {
  // Generate realistic fehltage (0-5 whole days) and fehlstunden (0-15 individual lessons)
  const totalFehltage = Math.floor(Math.random() * 6); // 0-5 whole days
  const totalFehlstunden = Math.floor(Math.random() * 16); // 0-15 individual lessons
  
  const excusedRatio = 0.6 + Math.random() * 0.3; // 60-90% excused
  
  const excusedFehltage = Math.floor(totalFehltage * excusedRatio);
  const unexcusedFehltage = totalFehltage - excusedFehltage;
  
  const excusedFehlstunden = Math.floor(totalFehlstunden * excusedRatio);
  const unexcusedFehlstunden = totalFehlstunden - excusedFehlstunden;
  
  // Generate lateness minutes
  const excusedLatenessMinutes = Math.floor(Math.random() * 50);
  const unexcusedLatenessMinutes = Math.floor(Math.random() * 40);
  const totalMinutes = excusedLatenessMinutes + unexcusedLatenessMinutes;
  
  // Calculate attendance rate (assuming ~200 school days and ~8 lessons per day)
  const totalPossibleLessons = 200 * 8;
  const missedLessons = (totalFehltage * 8) + totalFehlstunden;
  const attendanceRate = Math.max(70, Math.floor(((totalPossibleLessons - missedLessons) / totalPossibleLessons) * 100));
  
  return {
    id,
    name,
    totalFehltage,
    excusedFehltage,
    unexcusedFehltage,
    totalFehlstunden,
    excusedFehlstunden,
    unexcusedFehlstunden,
    totalMinutes,
    excusedLatenessMinutes,
    unexcusedLatenessMinutes,
    attendanceRate,
    classId,
    absenceDetails: generateAbsenceDetails(id, totalFehltage, totalFehlstunden, excusedRatio),
    latenessDetails: generateLatenessDetails(id, excusedLatenessMinutes, unexcusedLatenessMinutes)
  };
};

// Simplified timetable data for the demo - focusing on key classes
export const mockTimetables: Record<string, Lesson[]> = {
  // Klasse 9A
  '1': [
    // Monday
    { id: '9a-1-1', period: 1, day: 'Montag', time: '08:00-08:45', subject: 'Ma', teacher: 'Ars', room: 'B 033', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '1' },
    { id: '9a-1-2', period: 2, day: 'Montag', time: '08:50-09:35', subject: 'De', teacher: 'Lit', room: 'B 033', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '1' },
    { id: '9a-1-3', period: 3, day: 'Montag', time: '09:55-10:40', subject: 'En', teacher: 'Men', room: 'B 033', attendanceStatus: 'incomplete', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '1' },
    { id: '9a-1-4', period: 4, day: 'Montag', time: '10:45-11:30', subject: 'En', teacher: 'Men', room: 'B 033', attendanceStatus: 'missing', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '1' },
    { id: '9a-1-5', period: 5, day: 'Montag', time: '11:50-12:35', subject: 'Ma', teacher: 'Ars', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '1' },
    
    // Tuesday
    { id: '9a-2-1', period: 1, day: 'Dienstag', time: '08:00-08:45', subject: 'Ph', teacher: 'Ein', room: 'Ph 301', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', classId: '1' },
    { id: '9a-2-2', period: 2, day: 'Dienstag', time: '08:50-09:35', subject: 'Ph', teacher: 'Ein', room: 'Ph 301', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', classId: '1' },
    
    // Wednesday
    { id: '9a-3-1', period: 1, day: 'Mittwoch', time: '08:00-08:45', subject: 'Ge', teacher: 'His', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-amber-100 text-amber-800', status: 'normal', classId: '1' },
    { id: '9a-3-2', period: 2, day: 'Mittwoch', time: '08:50-09:35', subject: 'Ge', teacher: 'His', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-amber-100 text-amber-800', status: 'normal', classId: '1' },
  ],

  // Klasse 9B - Teacher Schmidt's main class
  '2': [
    // Monday
    { id: '9b-1-1', period: 1, day: 'Montag', time: '08:00-08:45', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-1-2', period: 2, day: 'Montag', time: '08:50-09:35', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-1-3', period: 3, day: 'Montag', time: '09:55-10:40', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'missing', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-1-4', period: 4, day: 'Montag', time: '10:45-11:30', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'incomplete', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-1-5', period: 5, day: 'Montag', time: '11:50-12:35', subject: 'Kla', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: false, isOngoing: true, subjectColor: 'bg-indigo-100 text-indigo-800', status: 'normal', classId: '2' },
    
    // Tuesday
    { id: '9b-2-1', period: 1, day: 'Dienstag', time: '08:00-08:45', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-2-2', period: 2, day: 'Dienstag', time: '08:50-09:35', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    
    // Wednesday
    { id: '9b-3-1', period: 1, day: 'Mittwoch', time: '08:00-08:45', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-3-2', period: 2, day: 'Mittwoch', time: '08:50-09:35', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
  ],

  // Teacher's personal schedule
  'teacher': [
    // Monday - 9B classes
    { id: '9b-1-1', period: 1, day: 'Montag', time: '08:00-08:45', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-1-2', period: 2, day: 'Montag', time: '08:50-09:35', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-1-3', period: 3, day: 'Montag', time: '09:55-10:40', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'missing', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-1-4', period: 4, day: 'Montag', time: '10:45-11:30', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'incomplete', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-1-5', period: 5, day: 'Montag', time: '11:50-12:35', subject: 'Kla', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: false, isOngoing: true, subjectColor: 'bg-indigo-100 text-indigo-800', status: 'normal', classId: '2' },
    
    // Ethics lessons in other classes
    { id: 'eth-9a-1', period: 7, day: 'Montag', time: '13:45-14:30', subject: 'Eth', teacher: 'Schmidt', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '1' },
    
    // Tuesday
    { id: '9b-2-1', period: 1, day: 'Dienstag', time: '08:00-08:45', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-2-2', period: 2, day: 'Dienstag', time: '08:50-09:35', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
  ],
};

// Generate student statistics for all classes
export const mockStudentStatistics: StudentStatistics[] = [
  // Klasse 9A
  ...mockStudents.filter(s => s.classId === '1').map(s => generateStudentStats(s.id, s.name, s.classId)),
  // Klasse 9B
  ...mockStudents.filter(s => s.classId === '2').map(s => generateStudentStats(s.id, s.name, s.classId)),
  // Klasse 10A
  ...mockStudents.filter(s => s.classId === '3').map(s => generateStudentStats(s.id, s.name, s.classId)),
];

// Course data for each class with enhanced attendance entries
export const mockCourseData: Record<string, any> = {
  '1': {
    dates: ['Mo 18.11', 'Di 19.11', 'Mi 20.11', 'Do 21.11', 'Fr 22.11'],
    studentAttendance: [
      { 
        studentId: '9a-1',
        name: 'Anna Mueller', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'S', excuseInfo: generateExcuseInfo('excused') },
          { code: 'A' }
        ], 
        totals: { present: 4, late: 1, excused: 0, unexcused: 0 } 
      },
    ]
  },
  '2': {
    dates: ['Mo 18.11', 'Di 19.11', 'Mi 20.11', 'Do 21.11', 'Fr 22.11'],
    studentAttendance: [
      { 
        studentId: '9b-1',
        name: 'Alexander Stein', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'E', excuseInfo: generateExcuseInfo('excused') }
        ], 
        totals: { present: 4, late: 0, excused: 1, unexcused: 0 } 
      },
    ]
  },
  // Course data for Bowling AG
  'course-1': generateCourseAttendance('course-1'),
  // Course data for Tischtennis AG  
  'course-2': generateCourseAttendance('course-2'),
};

// Helper functions
export function getStudentsForClass(classId: string): Student[] {
  return mockStudents.filter(student => student.classId === classId);
}

export function getTimetableForClass(classId: string): Lesson[] {
  if (classId === 'teacher') {
    return mockTimetables['teacher'] || [];
  }
  return mockTimetables[classId] || [];
}

export function getStudentStatisticsForClass(classId: string): StudentStatistics[] {
  return mockStudentStatistics.filter(stat => stat.classId === classId);
}

export function getAllStudentStatistics(): StudentStatistics[] {
  return mockStudentStatistics;
}

export function getCourseDataForClass(classId: string) {
  return mockCourseData[classId] || { dates: [], studentAttendance: [] };
}

export function getCourseStudentsForCourse(courseId: string): CourseStudent[] {
  return mockCourseStudents[courseId] || [];
}

export function getAllCoursesAndClasses() {
  return {
    classes: [
      { id: 'teacher', name: 'Mein Stundenplan', subject: 'Eigene Stunden', grade: '20 Stunden/Woche', type: 'teacher' as const },
      { id: '1', name: 'Klasse 9A', subject: 'Klassenleitung', grade: '9A', type: 'class' as const },
      { id: '2', name: 'Klasse 9B', subject: 'Klassenleitung', grade: '9B', type: 'class' as const },
      { id: '3', name: 'Klasse 10A', subject: 'Fachunterricht', grade: '10A', type: 'class' as const },
    ],
    courses: mockCourses.map(course => ({ ...course, grade: 'Wahlpflicht' }))
  };
}

export function getClassesForStatistics() {
  return [
    { id: '1', name: 'Klasse 9A', subject: 'Klassenleitung', grade: '9A', type: 'class' as const },
    { id: '2', name: 'Klasse 9B', subject: 'Klassenleitung', grade: '9B', type: 'class' as const },
    { id: '3', name: 'Klasse 10A', subject: 'Fachunterricht', grade: '10A', type: 'class' as const },
  ];
}

export function getCoursesForStatistics() {
  return mockCourses.map(course => ({ ...course, grade: 'Wahlpflicht' }));
}

export function getStudentById(studentId: string): StudentStatistics | undefined {
  return mockStudentStatistics.find(student => student.id === studentId);
}

// Function to update absence/lateness data
export function updateAbsenceDetails(studentId: string, absenceId: string, updates: Partial<AbsenceDetail>): void {
  const student = mockStudentStatistics.find(s => s.id === studentId);
  if (student) {
    const absenceIndex = student.absenceDetails.findIndex(a => a.id === absenceId);
    if (absenceIndex !== -1) {
      student.absenceDetails[absenceIndex] = { ...student.absenceDetails[absenceIndex], ...updates };
    }
  }
}

export function updateLatenessDetails(studentId: string, latenessId: string, updates: Partial<LatenessDetail>): void {
  const student = mockStudentStatistics.find(s => s.id === studentId);
  if (student) {
    const latenessIndex = student.latenessDetails.findIndex(l => l.id === latenessId);
    if (latenessIndex !== -1) {
      student.latenessDetails[latenessIndex] = { ...student.latenessDetails[latenessIndex], ...updates };
    }
  }
}

// Function to convert unexcused to excused
export function convertToExcused(studentId: string, itemId: string, itemType: 'absence' | 'lateness', excuseText: string): void {
  const student = mockStudentStatistics.find(s => s.id === studentId);
  if (!student) return;

  const now = new Date();
  const excuseInfo: ExcuseInfo = {
    text: excuseText,
    createdBy: CURRENT_TEACHER,
    createdAt: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
              now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    editHistory: []
  };

  if (itemType === 'absence') {
    const absenceIndex = student.absenceDetails.findIndex(a => a.id === itemId);
    if (absenceIndex !== -1) {
      const absence = student.absenceDetails[absenceIndex];
      absence.type = 'excused';
      absence.excuseInfo = excuseInfo;
      
      // Update statistics based on absence type
      if (absence.absenceType === 'fehltag') {
        student.unexcusedFehltage--;
        student.excusedFehltage++;
      } else {
        student.unexcusedFehlstunden--;
        student.excusedFehlstunden++;
      }
    }
  } else {
    const latenessIndex = student.latenessDetails.findIndex(l => l.id === itemId);
    if (latenessIndex !== -1) {
      const latenessItem = student.latenessDetails[latenessIndex];
      latenessItem.type = 'excused';
      latenessItem.excuseInfo = excuseInfo;
      
      // Update statistics
      student.unexcusedLatenessMinutes -= latenessItem.minutes;
      student.excusedLatenessMinutes += latenessItem.minutes;
    }
  }
}

export function getStudentIdFromCourseName(courseName: string): string | undefined {
  // Extract student name from course name format "Name (Class)"
  const nameMatch = courseName.match(/^(.+?)\s*\(/);
  if (!nameMatch) return undefined;
  
  const studentName = nameMatch[1].trim();
  
  // Find student by exact name match
  const student = mockStudents.find(s => s.name === studentName);
  return student?.id;
}

export function getClassNameById(classId: string): string {
  const classMap: Record<string, string> = {
    '1': '9A',
    '2': '9B', 
    '3': '10A'
  };
  return classMap[classId] || classId;
}
