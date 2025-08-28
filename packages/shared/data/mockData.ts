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
    name: 'Alle Lehrer',
    members: ['Frau Müller', 'Herr Schmidt', 'Frau Wagner', 'Herr Koch', 'Frau Hoffmann']
  },
  {
    name: 'Klassenlehrer 5. Klassen',
    members: ['Frau Müller', 'Herr Schmidt']
  },
  {
    name: 'Fachbereich Mathematik',
    members: ['Herr Wagner', 'Frau Koch']
  },
  {
    name: 'Schulleitung',
    members: ['Frau Direktor', 'Herr Konrektor']
  },
  {
    name: 'Verwaltung',
    members: ['Frau Sekretariat', 'Herr Hausmeister']
  }
];
