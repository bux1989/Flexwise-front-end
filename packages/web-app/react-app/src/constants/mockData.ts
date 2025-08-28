// Essential mock data for the teacher dashboard
export const CURRENT_TEACHER = 'Frau Müller';

export const getTeacherAbbreviation = (name: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Frau Müller': 'FMü',
    'Herr Schmidt': 'HSc',
    'Frau Weber': 'FWe',
    'Herr Klein': 'HKl',
    'Frau Fischer': 'FFi',
    'Herr Meyer': 'HMe'
  };
  return abbreviations[name] || name.split(' ').map(part => part[0]).join('');
};

export const ASSIGNEE_GROUPS = [
  {
    id: 'math_teachers',
    name: 'Mathematik-Fachschaft',
    members: ['Frau Müller', 'Herr Schmidt', 'Frau Weber']
  },
  {
    id: 'class_7a_team',
    name: 'Klassenteam 7a',
    members: ['Frau Müller', 'Herr Klein', 'Frau Fischer']
  }
];

export const INDIVIDUAL_ASSIGNEES = [
  'Frau Müller',
  'Herr Schmidt', 
  'Frau Weber',
  'Herr Klein',
  'Frau Fischer',
  'Herr Meyer'
];

export const INITIAL_TASKS = [
  {
    id: 1,
    title: 'Klassenarbeiten Mathematik 8a korrigieren',
    description: 'Korrektur der Klassenarbeit zu Gleichungssystemen vom 15.08.2024.',
    completed: false,
    priority: 'high',
    dueDate: '2024-08-25',
    hotList: true,
    assignedTo: ['Frau Müller'],
    assignedBy: 'Frau Müller',
    assignedAt: '20.08.2024 08:30',
    completedAt: null,
    completedBy: null,
    comments: []
  },
  {
    id: 2,
    title: 'Elterngespräche 7b vorbereiten',
    description: 'Vorbereitung der Einzelgespräche für den Elternabend am 30.08.',
    completed: false,
    priority: 'medium',
    dueDate: '2024-08-28',
    hotList: false,
    assignedTo: ['Frau Müller'],
    assignedBy: 'Frau Müller',
    assignedAt: '19.08.2024 14:15',
    completedAt: null,
    completedBy: null,
    comments: [
      {
        id: 1,
        text: 'Bereits 12 Termine vereinbart',
        timestamp: '20.08.2024 10:15',
        author: 'Frau Müller'
      }
    ]
  }
];

export const INITIAL_EVENTS = [
  {
    id: 1,
    title: 'Lehrerkonferenz',
    description: 'Monatliche Lehrerkonferenz zur Besprechung aktueller Themen.',
    date: { day: 22, month: 'Aug', year: 2024 },
    time: '16:00',
    location: 'Konferenzraum',
    rsvp: null
  },
  {
    id: 2,
    title: 'Elternabend 7b',
    description: 'Informationsabend für die Eltern der Klasse 7b.',
    date: { day: 30, month: 'Aug', year: 2024 },
    time: '19:00',
    location: 'Raum 204',
    rsvp: 'attending'
  }
];

export const INITIAL_LESSONS = [
  {
    id: 1,
    time: '08:00',
    endTime: '08:45',
    subject: 'Mathematik',
    class: '8a',
    room: 'Raum 205',
    enrolled: 26,
    isCurrent: false,
    isSubstitute: false,
    isCancelled: false,
    teacherRole: 'main',
    otherTeachers: [],
    students: [
      { id: 1, name: 'Anna Becker' },
      { id: 2, name: 'Ben Müller' },
      { id: 3, name: 'Clara Weber' },
      { id: 4, name: 'David Schmidt' },
      { id: 5, name: 'Emma Fischer' }
    ],
    attendanceTaken: false,
    lessonNote: ''
  },
  {
    id: 2,
    time: '09:00',
    endTime: '09:45',
    subject: 'Mathematik',
    class: '7b',
    room: 'Raum 205',
    enrolled: 24,
    isCurrent: true,
    isSubstitute: false,
    isCancelled: false,
    teacherRole: 'main',
    otherTeachers: [],
    students: [
      { id: 6, name: 'Felix Klein' },
      { id: 7, name: 'Gina Wagner' },
      { id: 8, name: 'Hans Meyer' },
      { id: 9, name: 'Ina Bauer' }
    ],
    attendanceTaken: false,
    lessonNote: ''
  }
];
