export default {
    options: {
        lazyHydrate: true,
    },
    editor: {
        label: {
            en: 'Course Scheduler',
        },
        icon: 'calendar',
        bubble: {
            icon: 'calendar',
        },
    },
    properties: {
        periods: {
            label: {
                en: 'Periods',
                fr: 'Périodes',
            },
            type: 'Array',
            bindable: true,
            defaultValue: [],
        },
        courses: {
            label: {
                en: 'Courses',
                fr: 'Cours',
            },
            type: 'Array',
            bindable: true,
            defaultValue: [],
        },
        teachers: {
            label: {
                en: 'Teachers',
                fr: 'Enseignants',
            },
            type: 'Array',
            bindable: true,
            defaultValue: [],
        },
        classes: {
            label: {
                en: 'Classes',
                fr: 'Classes',
            },
            type: 'Array',
            bindable: true,
            defaultValue: [],
        },
        rooms: {
            label: {
                en: 'Rooms',
                fr: 'Salles',
            },
            type: 'Array',
            bindable: true,
            defaultValue: [],
        },
        subjects: {
            label: {
                en: 'Subjects',
                fr: 'Matières',
            },
            type: 'Array',
            bindable: true,
            defaultValue: [],
        },
        schoolDays: {
            label: {
                en: 'School Days',
                fr: 'Jours scolaires',
            },
            type: 'Array',
            bindable: true,
            defaultValue: [
                { id: 1, name: 'Monday' },
                { id: 2, name: 'Tuesday' },
                { id: 3, name: 'Wednesday' },
                { id: 4, name: 'Thursday' },
                { id: 5, name: 'Friday' },
            ],
        },
        draftSchedules: {
            label: {
                en: 'Draft Schedules',
                fr: 'Brouillons horaires',
            },
            type: 'Array',
            bindable: true,
            defaultValue: [],
        },
        liveSchedules: {
            label: {
                en: 'Live Schedules',
                fr: 'Horaires publiés',
            },
            type: 'Array',
            bindable: true,
            defaultValue: [],
        },
        mode: {
            label: {
                en: 'Mode',
                fr: 'Mode',
            },
            type: 'Text',
            bindable: true,
            defaultValue: 'planner',
        },
    },
    events: {
        'scheduler:drop': {
            label: {
                en: 'On course dropped',
                fr: 'Lors du dépôt de cours',
            },
            tooltip: {
                en: 'Triggered when a course is dropped onto the schedule grid',
                fr: 'Déclenché quand un cours est déposé sur la grille horaire',
            },
        },
        'scheduler:drag-start': {
            label: {
                en: 'On drag start',
                fr: 'Début du glissement',
            },
            tooltip: {
                en: 'Triggered when dragging a course begins',
                fr: "Déclenché quand le glissement d'un cours commence",
            },
        },
        'scheduler:drag-end': {
            label: {
                en: 'On drag end',
                fr: 'Fin du glissement',
            },
            tooltip: {
                en: 'Triggered when dragging ends (success or failure)',
                fr: 'Déclenché quand le glissement se termine (succès ou échec)',
            },
        },
        'scheduler:remove': {
            label: {
                en: 'On assignment removed',
                fr: 'Assignation supprimée',
            },
            tooltip: {
                en: 'Triggered when a course assignment is deleted',
                fr: 'Déclenché quand une assignation de cours est supprimée',
            },
        },
        'scheduler:mode-changed': {
            label: {
                en: 'On mode changed',
                fr: 'Changement de mode',
            },
            tooltip: {
                en: 'Triggered when switching between planner and live modes',
                fr: 'Déclenché lors du changement entre modes planificateur et direct',
            },
        },
    },
    triggerEvents: [
        {
            name: 'scheduler:drop',
            label: { en: 'On Scheduler Drop' },
            event: {
                dayId: 0,
                periodId: '',
                courseId: '',
                courseName: '',
                courseCode: '',
                teacherIds: [],
                primaryTeacherId: null,
                roomId: null,
                source: 'modal-assignment',
                timestamp: '',
                // Additional fields for assignment moves
                fromDayId: null,
                fromPeriodId: null,
                action: null,
            },
        },
        {
            name: 'scheduler:drag-start',
            label: { en: 'On Drag Start' },
            event: {
                courseId: '',
                courseName: '',
                courseCode: '',
                source: 'drag-start',
                timestamp: '',
            },
        },
        {
            name: 'scheduler:drag-end',
            label: { en: 'On Drag End' },
            event: {
                courseId: '',
                courseName: '',
                courseCode: '',
                source: 'drag-end',
                success: false,
                timestamp: '',
            },
        },
        {
            name: 'scheduler:cell-click',
            label: { en: 'On Cell Click' },
            event: {
                dayId: 0,
                periodId: '',
                periodName: '',
                mode: 'add',
                preSelectedCourse: null,
                timestamp: '',
            },
        },
        {
            name: 'scheduler:assignment-details',
            label: { en: 'On Assignment Details' },
            event: {
                assignment: {},
                courseId: '',
                courseName: '',
                courseCode: '',
                teacherIds: [],
                roomId: null,
                dayId: 0,
                periodId: '',
                timestamp: '',
            },
        },
        {
            name: 'scheduler:course-edit',
            label: { en: 'On Course Edit' },
            event: {
                courseId: '',
                courseName: '',
                courseCode: '',
                source: 'inline-editor',
                timestamp: '',
            },
        },
        {
            name: 'scheduler:remove',
            label: { en: 'On Assignment Remove' },
            event: {
                dayId: 0,
                periodId: '',
                assignmentId: '',
                courseId: '',
                courseName: '',
                source: 'remove',
                timestamp: '',
            },
        },
        {
            name: 'scheduler:mode-changed',
            label: { en: 'On Mode Changed' },
            event: {
                mode: 'planner',
                timestamp: '',
            },
        },
    ],
};
