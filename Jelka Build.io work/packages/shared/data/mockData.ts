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

// Parent Dashboard Mock Data
export const PARENT_CHILDREN = [
  {
    id: 4,
    name: 'Nina Lang',
    class: '1A',
    avatar: '👧',
    checkInPending: true,
    status: 'present', // present, dismissed, excused
    dismissedAt: null,
    specialRule: {
      type: 'pickup',
      person: 'Oma Lang'
    },
    urlaubsInfo: {
      reason: 'Familienurlaub',
      type: 'full', // 'full' for whole day, 'partial' for specific times
      startDate: '2024-07-08', // Next Monday
      endDate: '2024-07-08', // Same day (1 day)
      submittedBy: 'Mutter Lang',
      submittedAt: '2024-06-25 16:20',
      approved: true,
      approvedBy: 'Schulleitung',
      approvedAt: '2024-06-26 09:15'
    }
  },
  {
    id: 2,
    name: 'Tom Koch',
    class: '2B',
    avatar: '👦',
    checkInPending: true,
    status: 'dismissed',
    dismissedAt: '14:35',
    specialRule: null
  },
  {
    id: 3,
    name: 'Tim Peters',
    class: '3C',
    avatar: '👦',
    checkInPending: true,
    status: 'excused',
    dismissedAt: null,
    specialRule: null,
    excuseInfo: {
      reason: 'Arzttermin beim Zahnarzt',
      type: 'partial', // 'full' for whole day, 'partial' for specific times
      startDate: '2024-07-02',
      endDate: '2024-07-02',
      startTime: '10:00',
      endTime: '12:30',
      submittedBy: 'Mutter Peters',
      submittedAt: '2024-07-01 18:45'
    }
  },
  {
    id: 1,
    name: 'Jonas Müller',
    class: '4A',
    avatar: '👦',
    checkInPending: true,
    status: 'present',
    dismissedAt: null,
    specialRule: {
      type: 'alone',
      person: null
    },
    urlaubsInfo: {
      reason: 'Besuch bei den Großeltern',
      type: 'full',
      startDate: '2024-07-15', // Later next week
      endDate: '2024-07-17', // 3 days
      submittedBy: 'Father Müller',
      submittedAt: '2024-06-20 14:30',
      approved: false, // Still pending approval
      approvedBy: undefined,
      approvedAt: undefined
    }
  }
];

export const PARENT_NEWS = [
  {
    id: 1,
    title: '🎓 Zeugnisausgabe: Der Unterricht endet am 23.07. für alle um 13:00 Uhr',
    content: `Liebe Eltern,

am 23. Juli 2024 ist Zeugnisausgabe und der Unterricht endet für alle Kinder bereits um 13:00 Uhr.

WICHTIGE ENTSCHEIDUNG ERFORDERLICH:
Bitte entscheiden Sie bis zum 20.06., ob Ihr Kind um 13 Uhr entlassen werden soll.

Die Anmeldung ist verbindlich. Bei fehlender Rückmeldung gehen wir davon aus, dass Ihr Kind zur gewohnten Zeit abgeholt wird.

Für Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Das FlexWise-Team`,
    date: '2024-06-28',
    important: true,
    isZeugnisPost: true
  },
  {
    id: 2,
    title: 'Neue Pausenzeiten ab September',
    content: 'Ab dem neuen Schuljahr ändern sich die Pausenzeiten. Weitere Details folgen.',
    date: '2024-06-25',
    important: false
  },
  {
    id: 3,
    title: 'Elternabend Klasse 3A',
    content: 'Der nächste Elternabend für die Klasse 3A findet am 10. Juli um 19:00 Uhr statt.',
    date: '2024-06-20',
    important: false
  }
];

export const PARENT_APPOINTMENTS = [
  {
    id: 1,
    title: 'Elterngespräch Emma',
    date: '2024-07-05',
    time: '15:30',
    teacher: 'Frau Schmidt',
    room: 'Klassenzimmer 2A',
    helpText: 'Bitte bringen Sie das letzte Zeugnis und eventuelle Fragen zur Entwicklung Ihres Kindes mit. Das Gespräch dauert ca. 20 Minuten.'
  },
  {
    id: 2,
    title: 'Schulausflug Max',
    date: '2024-07-12',
    time: '08:00',
    location: 'Zoo Berlin',
    room: 'Treffpunkt Haupteingang',
    helpText: 'Bitte sorgen Sie dafür, dass Ihr Kind wetterfeste Kleidung, Sonnenschutz und ausreichend Verpflegung dabei hat. Rückkehr ist für 16:00 Uhr geplant.'
  },
  {
    id: 3,
    title: 'Sportfest',
    date: '2024-07-18',
    time: '09:00',
    location: 'Schulsportplatz',
    room: 'Turnhalle (bei Regen)',
    helpText: 'Sportkleidung und Turnschuhe nicht vergessen! Bei schlechtem Wetter findet das Fest in der Turnhalle statt. Eltern sind herzlich eingeladen zuzuschauen.'
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
