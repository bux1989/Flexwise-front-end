// Mock data for the application - now properly shared across packages

export const CURRENT_TEACHER = 'Frau Müller';

export const INITIAL_TASKS = [
  {
    id: 1,
    title: 'Klassenbuch für 5A aktualisieren',
    description: 'Fehlzeiten der letzten Woche eintragen und Notizen zu Schülerverhalten hinzufügen',
    completed: false,
    priority: 'high',
    dueDate: '2024-08-30',
    hotList: true,
    assignedTo: ['Frau Müller', 'Herr Schmidt'],
    assignedBy: 'Frau Direktor',
    assignedAt: '2024-08-28, 09:15',
    completedAt: null,
    completedBy: null,
    comments: [
      {
        id: 1,
        text: 'Bitte besondere Aufmerksamkeit auf die Entschuldigungen legen',
        timestamp: '2024-08-28, 10:30',
        author: 'Frau Direktor'
      },
      {
        id: 2,
        text: 'Ich habe bereits die Hälfte der Einträge gemacht',
        timestamp: '2024-08-28, 14:20',
        author: 'Frau Müller'
      }
    ]
  },
  {
    id: 2,
    title: 'Elterngespräche für September planen',
    description: 'Termine mit Eltern von schwächeren Schülern vereinbaren und Gesprächsleitfaden vorbereiten',
    completed: false,
    priority: 'medium',
    dueDate: '2024-09-02',
    hotList: false,
    assignedTo: ['Alle Klassenlehrer'],
    assignedBy: 'Schulleitung',
    assignedAt: '2024-08-27, 16:45',
    completedAt: null,
    completedBy: null,
    comments: [
      {
        id: 3,
        text: 'Bitte bis Ende der Woche eine Liste mit geplanten Terminen einreichen',
        timestamp: '2024-08-28, 08:00',
        author: 'Schulleitung'
      }
    ]
  },
  {
    id: 3,
    title: 'Neue Schulbücher inventarisieren',
    description: 'Die neu gelieferten Bücher für das Schuljahr 2024/25 katalogisieren und an Klassen verteilen',
    completed: true,
    priority: 'low',
    dueDate: '2024-08-29',
    hotList: false,
    assignedTo: ['Herr Wagner', 'Frau Koch'],
    assignedBy: 'Schulverwaltung',
    assignedAt: '2024-08-26, 11:20',
    completedAt: '2024-08-28, 16:30',
    completedBy: 'Herr Wagner',
    comments: [
      {
        id: 4,
        text: 'Alle Bücher sind angekommen und wurden sortiert',
        timestamp: '2024-08-28, 16:30',
        author: 'Herr Wagner'
      }
    ]
  },
  {
    id: 4,
    title: 'Brandschutzübung vorbereiten',
    description: 'Evakuierungsplan für alle Klassen erstellen und Durchführung mit Feuerwehr koordinieren',
    completed: false,
    priority: 'high',
    dueDate: '2024-09-05',
    hotList: true,
    assignedTo: ['Sicherheitsbeauftragte'],
    assignedBy: 'Schulleitung',
    assignedAt: '2024-08-28, 12:00',
    completedAt: null,
    completedBy: null,
    comments: []
  },
  {
    id: 5,
    title: 'AG-Angebote für neues Schuljahr finalisieren',
    description: 'Liste der Arbeitsgemeinschaften fertigstellen und Anmeldeverfahren für Schüler organisieren',
    completed: false,
    priority: 'medium',
    dueDate: '2024-09-01',
    hotList: false,
    assignedTo: ['AG-Koordinatoren'],
    assignedBy: 'Schulleitung',
    assignedAt: '2024-08-27, 14:15',
    completedAt: null,
    completedBy: null,
    comments: [
      {
        id: 5,
        text: 'Bitte auch die neuen Sport-AGs berücksichtigen',
        timestamp: '2024-08-28, 09:45',
        author: 'Herr Sportlehrer'
      }
    ]
  }
];

export const INITIAL_EVENTS = [
  {
    id: 1,
    title: 'Schuljahresbeginn - Lehrerkonferenz',
    description: 'Große Lehrerkonferenz zum Start des neuen Schuljahres 2024/25. Besprechung der wichtigsten Neuerungen, Stundenpläne und organisatorischen Änderungen.',
    date: { day: 2, month: 'Sep', year: 2024 },
    time: '08:00',
    location: 'Lehrerzimmer',
    type: 'meeting',
    rsvp: null
  },
  {
    id: 2,
    title: 'Elternabend 5. Klassen',
    description: 'Informationsveranstaltung für Eltern der neuen 5. Klassen. Vorstellung der Lehrer, Schulregeln und Erwartungen für das neue Schuljahr.',
    date: { day: 5, month: 'Sep', year: 2024 },
    time: '19:00',
    location: 'Aula',
    type: 'meeting',
    rsvp: 'attending'
  },
  {
    id: 3,
    title: 'Herbstferien',
    description: 'Zweiwöchige Herbstferien. Schule geschlossen - Zeit für Erholung und Vorbereitung auf das zweite Quartal.',
    date: { day: 14, month: 'Oct', year: 2024 },
    time: null,
    location: null,
    type: 'holiday',
    rsvp: null
  },
  {
    id: 4,
    title: 'Schulentwicklungstag',
    description: 'Pädagogischer Tag zur Weiterentwicklung des Schulkonzepts. Workshops zu neuen Lehrmethoden und Digitalisierung. Schulfrei für Schüler.',
    date: { day: 18, month: 'Nov', year: 2024 },
    time: '08:00',
    location: 'Gesamte Schule',
    type: 'activity',
    rsvp: 'maybe'
  },
  {
    id: 5,
    title: 'Weihnachtsfeier der Schule',
    description: 'Traditionelle Weihnachtsfeier mit Aufführungen der Schüler, Bastelaktivitäten und gemütlichem Beisammensein der Schulgemeinschaft.',
    date: { day: 19, month: 'Dec', year: 2024 },
    time: '15:00',
    location: 'Aula und Klassenräume',
    type: 'activity',
    rsvp: null
  },
  {
    id: 6,
    title: 'Zeugniskonferenz Q1',
    description: 'Bewertungskonferenz für das erste Quartal. Besprechung der Schülerleistungen und Festlegung der Zwischennoten.',
    date: { day: 25, month: 'Oct', year: 2024 },
    time: '14:00',
    location: 'Lehrerzimmer',
    type: 'meeting',
    rsvp: 'attending'
  }
];

export const ASSIGNEE_GROUPS = [
  {
    id: 'all-teachers',
    name: 'Alle Lehrer',
    members: ['Frau Müller', 'Herr Schmidt', 'Frau Wagner', 'Herr Koch', 'Frau Hoffmann']
  },
  {
    id: 'class-teachers-5',
    name: 'Klassenlehrer 5. Klassen',
    members: ['Frau Müller', 'Herr Schmidt']
  },
  {
    id: 'math-department',
    name: 'Fachbereich Mathematik',
    members: ['Herr Wagner', 'Frau Koch']
  },
  {
    id: 'school-management',
    name: 'Schulleitung',
    members: ['Frau Direktor', 'Herr Konrektor']
  },
  {
    id: 'administration',
    name: 'Verwaltung',
    members: ['Frau Sekretariat', 'Herr Hausmeister']
  }
];

export const INDIVIDUAL_ASSIGNEES = [
  'Frau Müller',
  'Herr Schmidt',
  'Frau Wagner',
  'Herr Koch',
  'Frau Hoffmann',
  'Dr. Bauer',
  'Frau Fischer',
  'Herr Weber',
  'Frau Klein',
  'Herr Neumann'
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
      { id: 5, name: 'Emma Fischer' },
      { id: 6, name: 'Felix Klein' },
      { id: 7, name: 'Gina Wagner' },
      { id: 8, name: 'Hans Meyer' },
      { id: 9, name: 'Ina Bauer' },
      { id: 10, name: 'Jan Richter' },
      { id: 11, name: 'Kim Neumann' },
      { id: 12, name: 'Leo Krüger' },
      { id: 13, name: 'Mia Schulz' },
      { id: 14, name: 'Nico Braun' },
      { id: 15, name: 'Olivia Lange' },
      { id: 16, name: 'Paul Zimmermann' },
      { id: 17, name: 'Quinn Hartmann' },
      { id: 18, name: 'Rosa Krause' },
      { id: 19, name: 'Sam Vogel' },
      { id: 20, name: 'Tina Hoffmann' },
      { id: 21, name: 'Uwe Scholz' },
      { id: 22, name: 'Vera Sommer' },
      { id: 23, name: 'Will Frank' },
      { id: 24, name: 'Xara Jung' },
      { id: 25, name: 'Yann Wolf' },
      { id: 26, name: 'Zoe Peters' }
    ],
    attendance: {
      present: [
        { id: 1, name: 'Anna Becker' },
        { id: 2, name: 'Ben Müller' },
        { id: 3, name: 'Clara Weber' },
        { id: 5, name: 'Emma Fischer' },
        { id: 6, name: 'Felix Klein' },
        { id: 7, name: 'Gina Wagner' },
        { id: 8, name: 'Hans Meyer' },
        { id: 9, name: 'Ina Bauer' },
        { id: 10, name: 'Jan Richter' },
        { id: 11, name: 'Kim Neumann' },
        { id: 12, name: 'Leo Krüger' },
        { id: 13, name: 'Mia Schulz' },
        { id: 14, name: 'Nico Braun' },
        { id: 15, name: 'Olivia Lange' },
        { id: 16, name: 'Paul Zimmermann' },
        { id: 17, name: 'Quinn Hartmann' },
        { id: 18, name: 'Rosa Krause' },
        { id: 19, name: 'Sam Vogel' },
        { id: 20, name: 'Tina Hoffmann' },
        { id: 21, name: 'Uwe Scholz' },
        { id: 22, name: 'Vera Sommer' },
        { id: 23, name: 'Will Frank' },
        { id: 25, name: 'Yann Wolf' },
        { id: 26, name: 'Zoe Peters' }
      ],
      late: [
        {
          id: 4,
          name: 'David Schmidt',
          minutesLate: 5,
          arrivalTime: '08:05',
          lateExcused: false
        }
      ],
      absent: []
    },
    attendanceTaken: true,
    attendanceTakenBy: 'Frau Müller',
    attendanceTakenAt: '21.08.2024 08:10',
    lessonNote: '**Klassenbuch-Eintrag**\nAnwesenheit erfasst: 21.08.2024 08:10 (FMü)\n\nThema: Einführung in lineare Gleichungssysteme. Schüler haben gut mitgearbeitet.'
  },
  {
    id: 2,
    time: '08:50',
    endTime: '09:35',
    subject: 'Physik',
    class: '7b',
    room: 'Raum 108',
    enrolled: 24,
    isCurrent: true,
    isSubstitute: false,
    isCancelled: false,
    teacherRole: 'main',
    otherTeachers: [],
    students: [
      { id: 27, name: 'Alex Berger' },
      { id: 28, name: 'Bella Steinberg' },
      { id: 29, name: 'Carl Richter' },
      { id: 30, name: 'Diana Schulte' },
      { id: 31, name: 'Erik Weiss' },
      { id: 32, name: 'Fiona Kramer' },
      { id: 33, name: 'Gustav Brandt' },
      { id: 34, name: 'Hannah Gross' },
      { id: 35, name: 'Igor Petrov' },
      { id: 36, name: 'Julia Roth' },
      { id: 37, name: 'Klaus Zimmerman' },
      { id: 38, name: 'Laura Beck' },
      { id: 39, name: 'Mark Volkov' },
      { id: 40, name: 'Nina Fuchs' },
      { id: 41, name: 'Otto Graf' },
      { id: 42, name: 'Paula Engel' },
      { id: 43, name: 'Quentin Müller' },
      { id: 44, name: 'Rita Schwarz' },
      { id: 45, name: 'Simon Lang' },
      { id: 46, name: 'Tara Stein' },
      { id: 47, name: 'Ulrich Berg' },
      { id: 48, name: 'Vera Gold' },
      { id: 49, name: 'Wolfgang Baum' },
      { id: 50, name: 'Xenia Kurz' }
    ],
    preExistingAbsences: [
      {
        studentId: 30,
        studentName: 'Diana Schulte',
        reason: 'Arzttermin',
        reportedBy: 'Sekretariat',
        reportedAt: '21.08.2024 07:30'
      }
    ]
  },
  {
    id: 3,
    time: '09:40',
    endTime: '10:25',
    subject: 'Deutsch',
    class: '6a',
    room: 'Raum 112',
    enrolled: 22,
    isCurrent: false,
    isSubstitute: true,
    isCancelled: false,
    teacherRole: 'substitute',
    otherTeachers: [],
    substituteFor: 'Herr Schmidt'
  }
];
