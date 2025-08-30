// Comprehensive mock data for all classes

export interface Student {
  id: string;
  name: string;
  classId: string;
}

export interface Lesson {
  id: string;
  period: number;
  day: string;
  time: string;
  subject: string;
  subjectAbbreviation?: string;
  teacher: string;
  room: string;
  attendanceStatus: 'complete' | 'missing' | 'incomplete' | 'future';
  isPast: boolean;
  isOngoing: boolean;
  subjectColor: string;
  status?: 'normal' | 'cancelled' | 'room_changed' | 'teacher_changed';
  originalTeacher?: string;
  originalRoom?: string;
  adminComment?: string;
  classId: string;
}

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

export interface ExcuseEditHistory {
  editorId: string;
  editorName: string;
  timestamp: string;
  previousText?: string;
}

export interface ExcuseInfo {
  text: string;
  createdBy: string; // 'secretary' | 'Eltern' | teacher abbreviation like 'Bug'
  createdAt: string;
  editHistory: ExcuseEditHistory[];
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

export interface StudentStatistics {
  id: string;
  name: string;
  // Fehltage (whole days)
  totalFehltage: number;
  excusedFehltage: number;
  unexcusedFehltage: number;
  // Fehlstunden (individual lessons)
  totalFehlstunden: number;
  excusedFehlstunden: number;
  unexcusedFehlstunden: number;
  // Lateness in minutes
  totalMinutes: number;
  excusedLatenessMinutes: number;
  unexcusedLatenessMinutes: number;
  attendanceRate: number;
  classId: string;
  absenceDetails: AbsenceDetail[];
  latenessDetails: LatenessDetail[];
}

// Current teacher name for filtering
export const CURRENT_TEACHER = 'Schmidt';

// Semester dates
export const SEMESTER_START_DATE = '01.08.2024';
export const getCurrentDate = () => new Date().toLocaleDateString('de-DE');

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

// Timetables for each class
export const mockTimetables: Record<string, Lesson[]> = {
  // Klasse 9A - Mathematics focus with DAZ
  '1': [
    // Montag
    { id: '9a-1-1', period: 1, day: 'Montag', time: '08:00-08:45', subject: 'DAZ', teacher: 'Ust', room: 'B 033', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', adminComment: 'Bitte besondere Aufmerksamkeit auf schwächere Schüler richten.', classId: '1' },
    { id: '9a-1-2', period: 2, day: 'Montag', time: '08:50-09:35', subject: 'DAZ', teacher: 'Jäz', room: 'C 204', attendanceStatus: 'missing', isPast: true, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '1' },
    { id: '9a-1-3', period: 3, day: 'Montag', time: '09:55-10:40', subject: 'En', teacher: 'Men', room: 'B 033', attendanceStatus: 'incomplete', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '1' },
    { id: '9a-1-4', period: 4, day: 'Montag', time: '10:45-11:30', subject: 'En', teacher: 'Schmidt', room: 'B 036', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'teacher_changed', originalTeacher: 'Gre', adminComment: 'Vertretung wegen Krankheit. Materialien sind im Lehrerzimmer hinterlegt.', classId: '1' },
    { id: '9a-1-5', period: 5, day: 'Montag', time: '11:50-12:35', subject: 'Ma', teacher: 'Ars', room: 'B 033', attendanceStatus: 'incomplete', isPast: false, isOngoing: true, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '1' },
    { id: '9a-1-6', period: 6, day: 'Montag', time: '12:40-13:25', subject: 'Ma', teacher: 'Ars', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '1' },

    // Dienstag
    { id: '9a-2-1', period: 1, day: 'Dienstag', time: '08:00-08:45', subject: 'DAZ', teacher: 'Spi', room: 'B 033', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '1' },
    { id: '9a-2-2', period: 2, day: 'Dienstag', time: '08:50-09:35', subject: 'Sp', teacher: 'Kir', room: 'A 101', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-yellow-100 text-yellow-800', status: 'room_changed', originalRoom: 'Sport 1', adminComment: 'Sporthalle wird renoviert. Theorieunterricht im Klassenraum.', classId: '1' },
    { id: '9a-2-3', period: 3, day: 'Dienstag', time: '09:55-10:40', subject: 'AUB', teacher: '', room: '', attendanceStatus: 'missing', isPast: true, isOngoing: false, subjectColor: 'bg-gray-100 text-gray-800', status: 'cancelled', adminComment: 'Stunde entfällt aufgrund Lehrerfortbildung.', classId: '1' },
    { id: '9a-2-4', period: 4, day: 'Dienstag', time: '10:45-11:30', subject: 'GeWi', teacher: 'Vbk', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-purple-100 text-purple-800', status: 'normal', classId: '1' },
    { id: '9a-2-5', period: 5, day: 'Dienstag', time: '11:50-12:35', subject: 'DAZ', teacher: 'Jäz', room: 'C 204', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '1' },
    { id: '9a-2-6', period: 6, day: 'Dienstag', time: '12:40-13:25', subject: 'DAZ', teacher: 'Ust', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '1' },
    // BOWLING AG - Period 7 on Tuesday
    { id: '9a-2-7', period: 7, day: 'Dienstag', time: '13:45-14:30', subject: 'Bowling', teacher: 'Mueller', room: 'Bowling Center', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', adminComment: 'Wahlpflichtkurs - nur angemeldete Schüler', classId: '1' },

    // Mittwoch
    { id: '9a-3-1', period: 1, day: 'Mittwoch', time: '08:00-08:45', subject: 'Ma', teacher: 'Ars', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '1' },
    { id: '9a-3-2', period: 2, day: 'Mittwoch', time: '08:50-09:35', subject: 'Ma', teacher: 'Ars', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', adminComment: 'Klassenarbeit geplant. Taschenrechner erlaubt.', classId: '1' },
    { id: '9a-3-3', period: 3, day: 'Mittwoch', time: '09:55-10:40', subject: 'En', teacher: 'Gre', room: 'B 036', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '1' },
    { id: '9a-3-4', period: 4, day: 'Mittwoch', time: '10:45-11:30', subject: 'En', teacher: 'Gre', room: 'B 036', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '1' },
    { id: '9a-3-5', period: 5, day: 'Mittwoch', time: '11:50-12:35', subject: 'GeWi', teacher: 'Vbk', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-purple-100 text-purple-800', status: 'normal', classId: '1' },
    { id: '9a-3-6', period: 6, day: 'Mittwoch', time: '12:40-13:25', subject: 'NaWi', teacher: 'Bug', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-orange-100 text-orange-800', status: 'normal', classId: '1' },

    // Donnerstag
    { id: '9a-4-1', period: 1, day: 'Donnerstag', time: '08:00-08:45', subject: 'Kla', teacher: 'Men', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-indigo-100 text-indigo-800', status: 'normal', classId: '1' },
    { id: '9a-4-2', period: 2, day: 'Donnerstag', time: '08:50-09:35', subject: 'En', teacher: 'Ree', room: 'B 034', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '1' },
    { id: '9a-4-3', period: 3, day: 'Donnerstag', time: '09:55-10:40', subject: 'Ma', teacher: 'Ars', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '1' },
    { id: '9a-4-4', period: 4, day: 'Donnerstag', time: '10:45-11:30', subject: 'Ma', teacher: 'Ars', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '1' },
    { id: '9a-4-5', period: 5, day: 'Donnerstag', time: '11:50-12:35', subject: 'Sp', teacher: 'Kir', room: 'Sport 1', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-yellow-100 text-yellow-800', status: 'normal', adminComment: 'Schwimmunterricht. Bitte Schwimmsachen nicht vergessen!', classId: '1' },
    { id: '9a-4-6', period: 6, day: 'Donnerstag', time: '12:40-13:25', subject: 'NaWi', teacher: 'Bug', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-orange-100 text-orange-800', status: 'normal', classId: '1' },

    // Freitag
    { id: '9a-5-1', period: 1, day: 'Freitag', time: '08:00-08:45', subject: 'GeWi', teacher: 'Vbk', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-purple-100 text-purple-800', status: 'normal', classId: '1' },
    { id: '9a-5-2', period: 2, day: 'Freitag', time: '08:50-09:35', subject: 'NaWi', teacher: 'Bug', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-orange-100 text-orange-800', status: 'normal', classId: '1' },
    { id: '9a-5-3', period: 3, day: 'Freitag', time: '09:55-10:40', subject: 'DAZ', teacher: 'Gad', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '1' },
    { id: '9a-5-4', period: 4, day: 'Freitag', time: '10:45-11:30', subject: 'DAZ', teacher: 'Wht', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '1' },
    // TISCHTENNIS AG - Period 5 on Friday
    { id: '9a-5-5', period: 5, day: 'Freitag', time: '11:50-12:35', subject: 'Tischtennis', teacher: 'Weber', room: 'Sporthalle 2', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', adminComment: 'Wahlpflichtkurs - nur angemeldete Schüler', classId: '1' },
  ],

  // Klasse 9B - Teacher Schmidt's main class with 15 lessons
  '2': [
    // Montag - 5 lessons for Schmidt
    { id: '9b-1-1', period: 1, day: 'Montag', time: '08:00-08:45', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-1-2', period: 2, day: 'Montag', time: '08:50-09:35', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-1-3', period: 3, day: 'Montag', time: '09:55-10:40', subject: 'DAZ', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'missing', isPast: true, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '2' },
    { id: '9b-1-4', period: 4, day: 'Montag', time: '10:45-11:30', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'incomplete', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-1-5', period: 5, day: 'Montag', time: '11:50-12:35', subject: 'Kla', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: false, isOngoing: true, subjectColor: 'bg-indigo-100 text-indigo-800', status: 'normal', classId: '2' },
    { id: '9b-1-6', period: 6, day: 'Montag', time: '12:40-13:25', subject: 'Ma', teacher: 'Leh', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '2' },

    // Dienstag - 4 lessons for Schmidt
    { id: '9b-2-1', period: 1, day: 'Dienstag', time: '08:00-08:45', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-2-2', period: 2, day: 'Dienstag', time: '08:50-09:35', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-2-3', period: 3, day: 'Dienstag', time: '09:55-10:40', subject: 'DAZ', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'incomplete', isPast: true, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '2' },
    { id: '9b-2-4', period: 4, day: 'Dienstag', time: '10:45-11:30', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-2-5', period: 5, day: 'Dienstag', time: '11:50-12:35', subject: 'Sp', teacher: 'Fit', room: 'Sport 2', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-yellow-100 text-yellow-800', status: 'normal', classId: '2' },
    { id: '9b-2-6', period: 6, day: 'Dienstag', time: '12:40-13:25', subject: 'Sp', teacher: 'Fit', room: 'Sport 2', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-yellow-100 text-yellow-800', status: 'normal', classId: '2' },
    // BOWLING AG - Period 7 on Tuesday
    { id: '9b-2-7', period: 7, day: 'Dienstag', time: '13:45-14:30', subject: 'Bowling', teacher: 'Mueller', room: 'Bowling Center', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', adminComment: 'Wahlpflichtkurs - nur angemeldete Schüler', classId: '2' },

    // Mittwoch - 3 lessons for Schmidt
    { id: '9b-3-1', period: 1, day: 'Mittwoch', time: '08:00-08:45', subject: 'DAZ', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '2' },
    { id: '9b-3-2', period: 2, day: 'Mittwoch', time: '08:50-09:35', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-3-3', period: 3, day: 'Mittwoch', time: '09:55-10:40', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-3-4', period: 4, day: 'Mittwoch', time: '10:45-11:30', subject: 'Bio', teacher: 'Gruen', room: 'Bio 105', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-lime-100 text-lime-800', status: 'normal', adminComment: 'Mikroskopieren von Zellen geplant.', classId: '2' },
    { id: '9b-3-5', period: 5, day: 'Mittwoch', time: '11:50-12:35', subject: 'Ma', teacher: 'Leh', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '2' },
    { id: '9b-3-6', period: 6, day: 'Mittwoch', time: '12:40-13:25', subject: 'Ma', teacher: 'Leh', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '2' },

    // Donnerstag - 2 lessons for Schmidt
    { id: '9b-4-1', period: 1, day: 'Donnerstag', time: '08:00-08:45', subject: 'De', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '2' },
    { id: '9b-4-2', period: 2, day: 'Donnerstag', time: '08:50-09:35', subject: 'DAZ', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '2' },
    { id: '9b-4-3', period: 3, day: 'Donnerstag', time: '09:55-10:40', subject: 'Ch', teacher: 'Lab', room: 'Ch 301', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-violet-100 text-violet-800', status: 'normal', classId: '2' },
    { id: '9b-4-4', period: 4, day: 'Donnerstag', time: '10:45-11:30', subject: 'Ch', teacher: 'Lab', room: 'Ch 301', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-violet-100 text-violet-800', status: 'normal', classId: '2' },
    { id: '9b-4-5', period: 5, day: 'Donnerstag', time: '11:50-12:35', subject: 'Mu', teacher: 'Ton', room: 'Musik', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-pink-100 text-pink-800', status: 'normal', classId: '2' },
    { id: '9b-4-6', period: 6, day: 'Donnerstag', time: '12:40-13:25', subject: 'Mu', teacher: 'Ton', room: 'Musik', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-pink-100 text-pink-800', status: 'normal', classId: '2' },

    // Freitag - 1 lesson for Schmidt
    { id: '9b-5-1', period: 1, day: 'Freitag', time: '08:00-08:45', subject: 'En', teacher: 'Schmidt', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '2' },
    { id: '9b-5-2', period: 2, day: 'Freitag', time: '08:50-09:35', subject: 'Fr', teacher: 'Bon', room: 'C 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-rose-100 text-rose-800', status: 'normal', classId: '2' },
    { id: '9b-5-3', period: 3, day: 'Freitag', time: '09:55-10:40', subject: 'Ku', teacher: 'Pin', room: 'Kunst', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-orange-100 text-orange-800', status: 'normal', classId: '2' },
    { id: '9b-5-4', period: 4, day: 'Freitag', time: '10:45-11:30', subject: 'Ku', teacher: 'Pin', room: 'Kunst', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-orange-100 text-orange-800', status: 'normal', classId: '2' },
    // TISCHTENNIS AG - Period 5 on Friday
    { id: '9b-5-5', period: 5, day: 'Freitag', time: '11:50-12:35', subject: 'Tischtennis', teacher: 'Weber', room: 'Sporthalle 2', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', adminComment: 'Wahlpflichtkurs - nur angemeldete Schüler', classId: '2' },
  ],

  // Klasse 10A - Advanced subjects
  '3': [
    // Montag
    { id: '10a-1-1', period: 1, day: 'Montag', time: '08:00-08:45', subject: 'De', teacher: 'Lit', room: 'A 201', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', classId: '3' },
    { id: '10a-1-2', period: 2, day: 'Montag', time: '08:50-09:35', subject: 'De', teacher: 'Lit', room: 'A 201', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-emerald-100 text-emerald-800', status: 'normal', adminComment: 'Gedichtanalyse - Romantik Epoche.', classId: '3' },
    { id: '10a-1-3', period: 3, day: 'Montag', time: '09:55-10:40', subject: 'Ma', teacher: 'Cal', room: 'A 201', attendanceStatus: 'incomplete', isPast: true, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '3' },
    { id: '10a-1-4', period: 4, day: 'Montag', time: '10:45-11:30', subject: 'Ma', teacher: 'Cal', room: 'A 201', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '3' },
    { id: '10a-1-5', period: 5, day: 'Montag', time: '11:50-12:35', subject: 'Ph', teacher: 'Ein', room: 'Ph 301', attendanceStatus: 'missing', isPast: false, isOngoing: true, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', classId: '3' },
    { id: '10a-1-6', period: 6, day: 'Montag', time: '12:40-13:25', subject: 'Ph', teacher: 'Ein', room: 'Ph 301', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', classId: '3' },
    { id: '10a-1-7', period: 7, day: 'Montag', time: '13:45-14:30', subject: 'WPU', teacher: 'Opt', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-slate-100 text-slate-800', status: 'normal', classId: '3' },

    // Dienstag
    { id: '10a-2-1', period: 1, day: 'Dienstag', time: '08:00-08:45', subject: 'En', teacher: 'Sha', room: 'A 201', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '3' },
    { id: '10a-2-2', period: 2, day: 'Dienstag', time: '08:50-09:35', subject: 'En', teacher: 'Sha', room: 'A 201', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-blue-100 text-blue-800', status: 'normal', classId: '3' },
    { id: '10a-2-3', period: 3, day: 'Dienstag', time: '09:55-10:40', subject: 'Ch', teacher: 'Mol', room: 'Ch 401', attendanceStatus: 'complete', isPast: true, isOngoing: false, subjectColor: 'bg-violet-100 text-violet-800', status: 'normal', classId: '3' },
    { id: '10a-2-4', period: 4, day: 'Dienstag', time: '10:45-11:30', subject: 'Ch', teacher: 'Mol', room: 'Ch 401', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-violet-100 text-violet-800', status: 'normal', adminComment: 'Säure-Base Reaktionen Experiment.', classId: '3' },
    { id: '10a-2-5', period: 5, day: 'Dienstag', time: '11:50-12:35', subject: 'Ge', teacher: 'His', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-amber-100 text-amber-800', status: 'normal', classId: '3' },
    { id: '10a-2-6', period: 6, day: 'Dienstag', time: '12:40-13:25', subject: 'Ge', teacher: 'His', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-amber-100 text-amber-800', status: 'normal', classId: '3' },
    // BOWLING AG - Period 7 on Tuesday
    { id: '10a-2-7', period: 7, day: 'Dienstag', time: '13:45-14:30', subject: 'Bowling', teacher: 'Mueller', room: 'Bowling Center', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', adminComment: 'Wahlpflichtkurs - nur angemeldete Schüler', classId: '3' },

    // Mittwoch
    { id: '10a-3-1', period: 1, day: 'Mittwoch', time: '08:00-08:45', subject: 'Ma', teacher: 'Cal', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', classId: '3' },
    { id: '10a-3-2', period: 2, day: 'Mittwoch', time: '08:50-09:35', subject: 'Ma', teacher: 'Cal', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-green-100 text-green-800', status: 'normal', adminComment: 'Quadratische Funktionen - Prüfungsvorbereitung.', classId: '3' },
    { id: '10a-3-3', period: 3, day: 'Mittwoch', time: '09:55-10:40', subject: 'Bio', teacher: 'Evo', room: 'Bio 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-lime-100 text-lime-800', status: 'normal', classId: '3' },
    { id: '10a-3-4', period: 4, day: 'Mittwoch', time: '10:45-11:30', subject: 'Bio', teacher: 'Evo', room: 'Bio 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-lime-100 text-lime-800', status: 'normal', classId: '3' },
    { id: '10a-3-5', period: 5, day: 'Mittwoch', time: '11:50-12:35', subject: 'Sp', teacher: 'Ath', room: 'Sport 1', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-yellow-100 text-yellow-800', status: 'normal', classId: '3' },
    { id: '10a-3-6', period: 6, day: 'Mittwoch', time: '12:40-13:25', subject: 'Sp', teacher: 'Ath', room: 'Sport 1', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-yellow-100 text-yellow-800', status: 'normal', classId: '3' },

    // Donnerstag
    { id: '10a-4-1', period: 1, day: 'Donnerstag', time: '08:00-08:45', subject: 'Fr', teacher: 'Par', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-rose-100 text-rose-800', status: 'normal', classId: '3' },
    { id: '10a-4-2', period: 2, day: 'Donnerstag', time: '08:50-09:35', subject: 'Fr', teacher: 'Par', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-rose-100 text-rose-800', status: 'normal', classId: '3' },
    { id: '10a-4-3', period: 3, day: 'Donnerstag', time: '09:55-10:40', subject: 'Inf', teacher: 'Cod', room: 'IT 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-gray-100 text-gray-800', status: 'normal', classId: '3' },
    { id: '10a-4-4', period: 4, day: 'Donnerstag', time: '10:45-11:30', subject: 'Inf', teacher: 'Cod', room: 'IT 101', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-gray-100 text-gray-800', status: 'normal', adminComment: 'Python Programmierung - Grundlagen Schleifen.', classId: '3' },
    { id: '10a-4-5', period: 5, day: 'Donnerstag', time: '11:50-12:35', subject: 'PoWi', teacher: 'Dem', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '3' },
    { id: '10a-4-6', period: 6, day: 'Donnerstag', time: '12:40-13:25', subject: 'PoWi', teacher: 'Dem', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-red-100 text-red-800', status: 'normal', classId: '3' },

    // Freitag
    { id: '10a-5-1', period: 1, day: 'Freitag', time: '08:00-08:45', subject: 'Kla', teacher: 'Men', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-indigo-100 text-indigo-800', status: 'normal', classId: '3' },
    { id: '10a-5-2', period: 2, day: 'Freitag', time: '08:50-09:35', subject: 'AWT', teacher: 'Wir', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-purple-100 text-purple-800', status: 'normal', classId: '3' },
    { id: '10a-5-3', period: 3, day: 'Freitag', time: '09:55-10:40', subject: 'AWT', teacher: 'Wir', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-purple-100 text-purple-800', status: 'normal', classId: '3' },
    { id: '10a-5-4', period: 4, day: 'Freitag', time: '10:45-11:30', subject: 'Mu', teacher: 'Bac', room: 'Musik', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-pink-100 text-pink-800', status: 'normal', classId: '3' },
    // TISCHTENNIS AG - Period 5 on Friday
    { id: '10a-5-5', period: 5, day: 'Freitag', time: '11:50-12:35', subject: 'Tischtennis', teacher: 'Weber', room: 'Sporthalle 2', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', adminComment: 'Wahlpflichtkurs - nur angemeldete Schüler', classId: '3' },
  ],

  // Course-specific timetables
  'course-1': [
    // Bowling AG - Tuesday Period 7
    { id: 'bowling-1', period: 7, day: 'Dienstag', time: '13:45-14:30', subject: 'Bowling', teacher: 'Mueller', room: 'Bowling Center', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', adminComment: 'Wahlpflichtkurs - klassenübergreifend', classId: 'course-1' },
  ],

  'course-2': [
    // Tischtennis AG - Friday Period 5
    { id: 'tischtennis-1', period: 5, day: 'Freitag', time: '11:50-12:35', subject: 'Tischtennis', teacher: 'Weber', room: 'Sporthalle 2', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-cyan-100 text-cyan-800', status: 'normal', adminComment: 'Wahlpflichtkurs - klassenübergreifend', classId: 'course-2' },
  ],
};

// Teacher's personal schedule - combining lessons from 9B plus Eth lessons from other classes (total 25 lessons)
export const teacherSchedule: Lesson[] = [
  // 15 lessons from 9B (De, DaZ, En, Kla)
  ...mockTimetables['2'].filter(lesson => lesson.teacher === CURRENT_TEACHER),
  
  // 10 additional Eth lessons across different classes to reach 25 total
  // Klasse 9A - Eth lessons
  { id: 'eth-9a-1', period: 7, day: 'Montag', time: '13:45-14:30', subject: 'Eth', teacher: 'Schmidt', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '1' },
  { id: 'eth-9a-2', period: 8, day: 'Montag', time: '14:35-15:20', subject: 'Eth', teacher: 'Schmidt', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '1' },
  { id: 'eth-9a-3', period: 7, day: 'Dienstag', time: '13:45-14:30', subject: 'Eth', teacher: 'Schmidt', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '1' },
  { id: 'eth-9a-4', period: 8, day: 'Dienstag', time: '14:35-15:20', subject: 'Eth', teacher: 'Schmidt', room: 'B 033', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '1' },
  
  // Klasse 10A - Eth lessons
  { id: 'eth-10a-1', period: 7, day: 'Mittwoch', time: '13:45-14:30', subject: 'Eth', teacher: 'Schmidt', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '3' },
  { id: 'eth-10a-2', period: 8, day: 'Mittwoch', time: '14:35-15:20', subject: 'Eth', teacher: 'Schmidt', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '3' },
  { id: 'eth-10a-3', period: 7, day: 'Donnerstag', time: '13:45-14:30', subject: 'Eth', teacher: 'Schmidt', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '3' },
  { id: 'eth-10a-4', period: 8, day: 'Donnerstag', time: '14:35-15:20', subject: 'Eth', teacher: 'Schmidt', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '3' },
  { id: 'eth-10a-5', period: 6, day: 'Freitag', time: '12:40-13:25', subject: 'Eth', teacher: 'Schmidt', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '3' },
  { id: 'eth-10a-6', period: 7, day: 'Freitag', time: '13:45-14:30', subject: 'Eth', teacher: 'Schmidt', room: 'A 201', attendanceStatus: 'future', isPast: false, isOngoing: false, subjectColor: 'bg-teal-100 text-teal-800', status: 'normal', classId: '3' },
];

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
      { 
        studentId: '9a-2',
        name: 'Ben Schmidt', 
        attendance: [
          { code: 'A' },
          { code: 'E', excuseInfo: generateExcuseInfo('excused') },
          { code: 'A' },
          { code: 'A' },
          { code: 'U' }
        ], 
        totals: { present: 3, late: 0, excused: 1, unexcused: 1 } 
      },
      { 
        studentId: '9a-3',
        name: 'Clara Weber', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' }
        ], 
        totals: { present: 5, late: 0, excused: 0, unexcused: 0 } 
      },
      { 
        studentId: '9a-4',
        name: 'David Fischer', 
        attendance: [
          { code: 'U' },
          { code: 'E', excuseInfo: generateExcuseInfo('excused') },
          { code: 'A' },
          { code: 'E', excuseInfo: generateExcuseInfo('excused') },
          { code: 'A' }
        ], 
        totals: { present: 2, late: 0, excused: 2, unexcused: 1 } 
      },
      { 
        studentId: '9a-5',
        name: 'Emma Wagner', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'S' }, // Late without excuse
          { code: 'A' },
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
      { 
        studentId: '9b-2',
        name: 'Bianca Huber', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' }
        ], 
        totals: { present: 5, late: 0, excused: 0, unexcused: 0 } 
      },
      { 
        studentId: '9b-3',
        name: 'Christian Mayer', 
        attendance: [
          { code: 'S', excuseInfo: generateExcuseInfo('excused') },
          { code: 'A' },
          { code: 'U' },
          { code: 'A' },
          { code: 'A' }
        ], 
        totals: { present: 3, late: 1, excused: 0, unexcused: 1 } 
      },
      { 
        studentId: '9b-4',
        name: 'Diana Fuchs', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'S' }, // Late without excuse
          { code: 'A' }
        ], 
        totals: { present: 4, late: 1, excused: 0, unexcused: 0 } 
      },
      { 
        studentId: '9b-5',
        name: 'Erik Schulz', 
        attendance: [
          { code: 'U' },
          { code: 'A' },
          { code: 'A' },
          { code: 'E', excuseInfo: generateExcuseInfo('excused') },
          { code: 'U' }
        ], 
        totals: { present: 2, late: 0, excused: 1, unexcused: 2 } 
      },
    ]
  },
  '3': {
    dates: ['Mo 18.11', 'Di 19.11', 'Mi 20.11', 'Do 21.11', 'Fr 22.11'],
    studentAttendance: [
      { 
        studentId: '10a-1',
        name: 'Adrian Becker', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' }
        ], 
        totals: { present: 5, late: 0, excused: 0, unexcused: 0 } 
      },
      { 
        studentId: '10a-2',
        name: 'Britta Lehmann', 
        attendance: [
          { code: 'A' },
          { code: 'S', excuseInfo: generateExcuseInfo('excused') },
          { code: 'A' },
          { code: 'A' },
          { code: 'E', excuseInfo: generateExcuseInfo('excused') }
        ], 
        totals: { present: 3, late: 1, excused: 1, unexcused: 0 } 
      },
      { 
        studentId: '10a-3',
        name: 'Cedric Sommer', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' }
        ], 
        totals: { present: 5, late: 0, excused: 0, unexcused: 0 } 
      },
      { 
        studentId: '10a-4',
        name: 'Denise Winter', 
        attendance: [
          { code: 'E', excuseInfo: generateExcuseInfo('excused') },
          { code: 'A' },
          { code: 'U' },
          { code: 'A' },
          { code: 'A' }
        ], 
        totals: { present: 3, late: 0, excused: 1, unexcused: 1 } 
      },
      { 
        studentId: '10a-5',
        name: 'Elias Hoffmann', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'S' }, // Late without excuse
          { code: 'A' }
        ], 
        totals: { present: 4, late: 1, excused: 0, unexcused: 0 } 
      },
    ]
  },
  // Course data for Bowling AG
  'course-1': generateCourseAttendance('course-1'),
  // Course data for Tischtennis AG  
  'course-2': generateCourseAttendance('course-2'),
  // Teacher's personal schedule data
  'teacher': {
    dates: ['Mo 18.11', 'Di 19.11', 'Mi 20.11', 'Do 21.11', 'Fr 22.11'],
    studentAttendance: [
      { 
        studentId: '9b-1',
        name: 'Alexander Stein (9B)', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'E', excuseInfo: generateExcuseInfo('excused') }
        ], 
        totals: { present: 4, late: 0, excused: 1, unexcused: 0 } 
      },
      { 
        studentId: '9b-2',
        name: 'Bianca Huber (9B)', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'A' }
        ], 
        totals: { present: 5, late: 0, excused: 0, unexcused: 0 } 
      },
      { 
        studentId: '9b-3',
        name: 'Christian Mayer (9B)', 
        attendance: [
          { code: 'S', excuseInfo: generateExcuseInfo('excused') },
          { code: 'A' },
          { code: 'U' },
          { code: 'A' },
          { code: 'A' }
        ], 
        totals: { present: 3, late: 1, excused: 0, unexcused: 1 } 
      },
      { 
        studentId: '9b-4',
        name: 'Diana Fuchs (9B)', 
        attendance: [
          { code: 'A' },
          { code: 'A' },
          { code: 'A' },
          { code: 'S' },
          { code: 'A' }
        ], 
        totals: { present: 4, late: 1, excused: 0, unexcused: 0 } 
      },
      { 
        studentId: '9b-5',
        name: 'Erik Schulz (9B)', 
        attendance: [
          { code: 'U' },
          { code: 'A' },
          { code: 'A' },
          { code: 'E', excuseInfo: generateExcuseInfo('excused') },
          { code: 'U' }
        ], 
        totals: { present: 2, late: 0, excused: 1, unexcused: 2 } 
      },
    ]
  },
};

// Helper functions
export function getStudentsForClass(classId: string): Student[] {
  return mockStudents.filter(student => student.classId === classId);
}

export function getTimetableForClass(classId: string): Lesson[] {
  if (classId === 'teacher') {
    return teacherSchedule;
  }
  return mockTimetables[classId] || [];
}

export function getTeacherLessons(): Lesson[] {
  return teacherSchedule;
}

export function getStudentStatisticsForClass(classId: string): StudentStatistics[] {
  return mockStudentStatistics.filter(stat => stat.classId === classId);
}

// New function to get all student statistics (for improved student selection)
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
      { id: 'teacher', name: 'Mein Stundenplan', subject: 'Eigene Stunden', grade: '25 Stunden/Woche', type: 'teacher' as const },
      { id: '1', name: 'Klasse 9A - Mathematik', subject: 'Mathematik', grade: '9A', type: 'class' as const },
      { id: '2', name: 'Klasse 9B - Mathematik', subject: 'Mathematik', grade: '9B', type: 'class' as const },
      { id: '3', name: 'Klasse 10A - Mathematik', subject: 'Mathematik', grade: '10A', type: 'class' as const },
    ],
    courses: mockCourses.map(course => ({ ...course, grade: 'Wahlpflicht' }))
  };
}

// New functions for filtering items based on view type
export function getClassesForStatistics() {
  return [
    { id: '1', name: 'Klasse 9A - Mathematik', subject: 'Mathematik', grade: '9A', type: 'class' as const },
    { id: '2', name: 'Klasse 9B - Mathematik', subject: 'Mathematik', grade: '9B', type: 'class' as const },
    { id: '3', name: 'Klasse 10A - Mathematik', subject: 'Mathematik', grade: '10A', type: 'class' as const },
  ];
}

export function getCoursesForStatistics() {
  return mockCourses.map(course => ({ ...course, grade: 'Wahlpflicht' }));
}

export function getAvailableClasses() {
  return [
    { id: '1', name: '9A', classId: '1' },
    { id: '2', name: '9B', classId: '2' },
    { id: '3', name: '10A', classId: '3' },
  ];
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

// Improved function to get student ID from course attendance (for navigation)
export function getStudentIdFromCourseName(courseName: string): string | undefined {
  // Extract student name from course name format "Name (Class)"
  const nameMatch = courseName.match(/^(.+?)\s*\(/);
  if (!nameMatch) return undefined;
  
  const studentName = nameMatch[1].trim();
  
  // Find student by exact name match
  const student = mockStudents.find(s => s.name === studentName);
  return student?.id;
}

// New function to get class name by class ID
export function getClassNameById(classId: string): string {
  const classMap: Record<string, string> = {
    '1': '9A',
    '2': '9B', 
    '3': '10A'
  };
  return classMap[classId] || classId;
}
