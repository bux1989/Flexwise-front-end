// Mock data for the teacher dashboard

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
  },
  {
    id: 'exam_committee',
    name: 'Prüfungsausschuss',
    members: ['Frau Müller', 'Herr Meyer', 'Frau Weber', 'Herr Schmidt']
  }
];

export const INDIVIDUAL_ASSIGNEES = [
  'Frau Müller',
  'Herr Schmidt', 
  'Frau Weber',
  'Herr Klein',
  'Frau Fischer',
  'Herr Meyer',
  'Frau Wagner',
  'Herr Bauer'
];

export const INITIAL_TASKS = [
  {
    id: 1,
    title: 'Klassenarbeiten Mathematik 8a korrigieren',
    description: 'Korrektur der Klassenarbeit zu Gleichungssystemen vom 15.08.2024. Bewertungsschlüssel liegt bei.',
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
    description: 'Vorbereitung der Einzelgespräche für den Elternabend am 30.08. Notenlisten und Förderpläne zusammenstellen.',
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
  },
  {
    id: 3,
    title: 'Physik Arbeitsblätter korrigieren 9c',
    description: 'Korrektur der Übungsblätter zu Optik und Lichtbrechung. 25 Arbeiten eingegangen.',
    completed: true,
    priority: 'medium',
    dueDate: '2024-08-22',
    hotList: false,
    assignedTo: ['Frau Müller'],
    assignedBy: 'Frau Müller',
    assignedAt: '18.08.2024 16:20',
    completedAt: '21.08.2024 14:30',
    completedBy: 'Frau Müller',
    comments: [
      {
        id: 1,
        text: '15 von 25 Arbeiten bereits korrigiert',
        timestamp: '21.08.2024 14:30',
        author: 'Frau Müller'
      }
    ]
  },
  {
    id: 4,
    title: 'Schulbücher bestellen',
    description: 'Bestellung der neuen Mathematikbücher für das kommende Schuljahr bei Cornelsen.',
    completed: false,
    priority: 'low',
    dueDate: '2024-09-15',
    hotList: false,
    assignedTo: ['Herr Schmidt', 'Frau Weber'],
    assignedBy: 'Frau Müller',
    assignedAt: '15.08.2024 09:45',
    completedAt: null,
    completedBy: null,
    comments: []
  },
  {
    id: 5,
    title: 'Aufsätze Deutsch 6a korrigieren',
    description: 'Korrektur der Erörterungen zum Thema "Umweltschutz in der Schule". 28 Arbeiten eingegangen.',
    completed: true,
    priority: 'high',
    dueDate: '2024-08-23',
    hotList: true,
    assignedTo: ['Frau Fischer'],
    assignedBy: 'Frau Fischer',
    assignedAt: '17.08.2024 11:20',
    completedAt: '22.08.2024 16:45',
    completedBy: 'Frau Fischer',
    comments: [
      {
        id: 1,
        text: '28 von 28 Arbeiten korrigiert. Sehr gute Ergebnisse!',
        timestamp: '22.08.2024 16:45',
        author: 'Frau Fischer'
      }
    ]
  },
  {
    id: 6,
    title: 'Vertretungsplan erstellen',
    description: 'Wochenplan für Vertretungen vom 26.-30.08.2024 erstellen',
    completed: false,
    priority: 'urgent',
    dueDate: '2024-08-24',
    hotList: true,
    assignedTo: ['Herr Meyer'],
    assignedBy: 'Herr Meyer',
    assignedAt: '21.08.2024 07:30',
    completedAt: null,
    completedBy: null,
    comments: []
  },
  {
    id: 7,
    title: 'Tests Englisch 10b korrigieren', 
    description: 'Korrektur der Vokabeltests zu Unit 3. 22 Tests eingegangen.',
    completed: false,
    priority: 'medium',
    dueDate: '2024-08-26',
    hotList: false,
    assignedTo: ['Frau Wagner'],
    assignedBy: 'Frau Wagner', 
    assignedAt: '20.08.2024 13:15',
    completedAt: null,
    completedBy: null,
    comments: [
      {
        id: 1,
        text: '10 von 22 Tests bereits korrigiert',
        timestamp: '21.08.2024 11:20',
        author: 'Frau Wagner'
      }
    ]
  }
];

export const INITIAL_EVENTS = [
  {
    id: 1,
    title: 'Lehrerkonferenz',
    description: 'Monatliche Lehrerkonferenz zur Besprechung aktueller Themen und organisatorischer Angelegenheiten.',
    date: { day: 22, month: 'Aug', year: 2024 },
    time: '16:00',
    location: 'Konferenzraum',
    rsvp: null
  },
  {
    id: 2,
    title: 'Elternabend 7b',
    description: 'Informationsabend für die Eltern der Klasse 7b mit Vorstellung des neuen Schuljahres und wichtigen Terminen.',
    date: { day: 30, month: 'Aug', year: 2024 },
    time: '19:00',
    location: 'Raum 204',
    rsvp: 'attending'
  },
  {
    id: 3,
    title: 'Fortbildung Digitale Medien',
    description: 'Workshop zur Integration digitaler Medien in den Mathematikunterricht. Anmeldung erforderlich bis 25.08.',
    date: { day: 5, month: 'Sep', year: 2024 },
    time: '14:00',
    location: 'Medienzentrum',
    rsvp: 'maybe'
  },
  {
    id: 4,
    title: 'Schulausflug Klasse 8a',
    description: 'Besuch des Technikmuseums mit anschließender Stadtrallye. Begleitung durch zwei Lehrkräfte erforderlich.',
    date: { day: 12, month: 'Sep', year: 2024 },
    time: '08:30',
    location: 'Technikmuseum',
    rsvp: null
  },
  {
    id: 5,
    title: 'Abiturprüfungen Mathematik',
    description: 'Schriftliche Abiturprüfung im Fach Mathematik. Aufsicht und Korrektur durch Fachlehrer. Beginn pünktlich um 9:00 Uhr.',
    date: { day: 15, month: 'Sep', year: 2024 },
    time: '09:00',
    location: 'Sporthalle',
    rsvp: 'attending'
  },
  {
    id: 6,
    title: 'Einschulung',
    description: 'Feierliche Einschulung der neuen Erstklässler mit Programm und Begrüßung durch die Schulleitung.',
    date: { day: 12, month: 'Sep', year: 2024 },
    time: '10:00',
    location: 'Turnhalle',
    rsvp: 'attending'
  },
  {
    id: 7,
    title: 'Tag der offenen Tür',
    description: 'Präsentation der Schule für interessierte Eltern und Schüler. Verschiedene Fachbereiche stellen sich vor.',
    date: { day: 25, month: 'Sep', year: 2024 },
    time: '10:00',
    location: 'Gesamte Schule',
    rsvp: 'attending'
  },
  {
    id: 8,
    title: 'Sommerfest',
    description: 'Jährliches Sommerfest der Schule mit Aufführungen, Spielen und gemeinsamem Grillen. Alle Lehrkräfte, Schüler und Eltern sind herzlich eingeladen.',
    date: { day: 15, month: 'Jul', year: 2024 },
    time: '15:00',
    location: 'Schulhof',
    rsvp: 'attending'
  },
  {
    id: 9,
    title: 'Pädagogischer Tag',
    description: 'Ganztägige Fortbildung zu modernen Unterrichtsmethoden und Classroom Management.',
    date: { day: 20, month: 'Jul', year: 2024 },
    time: '08:00',
    location: 'Aula',
    rsvp: 'attending'
  },
  {
    id: 10,
    title: 'Schulfest',
    description: 'Großes Schulfest mit Aufführungen, Spielständen, Tombola und kulinarischen Köstlichkeiten. Ein Fest für die ganze Schulgemeinschaft mit Schülern, Eltern und Lehrkräften.',
    date: { day: 20, month: 'Sep', year: 2025 },
    time: '14:00',
    location: 'Schulhof und Turnhalle',
    rsvp: null
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
  },
  {
    id: 4,
    time: '10:45',
    endTime: '11:30',
    subject: 'Mathematik',
    class: '9c',
    room: 'Raum 201',
    enrolled: 28,
    isCurrent: false,
    isSubstitute: false,
    isCancelled: true,
    teacherRole: 'main',
    otherTeachers: [],
    cancellationReason: 'Klassenausflug'
  },
  {
    id: 5,
    time: '11:35',
    endTime: '12:20',
    subject: 'Biologie',
    class: '10a',
    room: 'Raum 301',
    originalRoom: 'Raum 302',
    roomChanged: true,
    enrolled: 25,
    isCurrent: false,
    isSubstitute: false,
    isCancelled: false,
    teacherRole: 'support',
    otherTeachers: [
      { name: 'Frau Weber', isMainResponsible: true }
    ],
    adminComment: 'Raumtausch wegen defektem Beamer in 302'
  },
  {
    id: 6,
    time: '12:25',
    endTime: '13:10',
    subject: 'Mathematik',
    class: '8b',
    room: 'Raum 205',
    enrolled: 23,
    isCurrent: false,
    isSubstitute: false,
    isCancelled: false,
    teacherRole: 'main',
    otherTeachers: []
  }
];