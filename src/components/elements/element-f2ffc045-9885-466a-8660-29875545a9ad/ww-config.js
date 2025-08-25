export default {
    editor: {
        label: { en: 'Student Schedule Overview', de: 'Schüler Stundenplan Übersicht' },
        icon: 'calendar'
    },
    properties: {
        lang: {
            label: { en: 'Language', de: 'Sprache' },
            type: 'TextSelect',
            section: 'settings',
            bindable: true,
            defaultValue: 'de',
            options: {
                options: [
                    { value: 'de', label: 'Deutsch' },
                    { value: 'en', label: 'English' }
                ]
            }
        },
        studentName: {
            label: { en: 'Student Name', de: 'Schülername' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: 'Tim Peters'
        },
        studentId: {
            label: { en: 'Student ID', de: 'Schüler-ID' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: ''
        },
        days: {
            label: { en: 'School Days', de: 'Schultage' },
            type: 'Array',
            section: 'settings',
            bindable: true,
            defaultValue: [
                { id: 1, key: 'Montag', label: 'Montag' },
                { id: 2, key: 'Dienstag', label: 'Dienstag' },
                { id: 3, key: 'Mittwoch', label: 'Mittwoch' },
                { id: 4, key: 'Donnerstag', label: 'Donnerstag' },
                { id: 5, key: 'Freitag', label: 'Freitag' }
            ]
        },
        maxWishesRows: {
            label: { en: 'Max Wishes Rows', de: 'Max. Wunschzeilen' },
            type: 'Number',
            section: 'settings',
            bindable: true,
            defaultValue: 3,
            options: { min: 0, max: 10, step: 1 }
        },
        wishesByDay: {
            label: { en: 'Wishes By Day', de: 'Wünsche nach Tag' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {}
        },
        // New: fallback flags and ranks (to render "Falls nicht möglich")
        fallbackByDay: {
            label: { en: 'Fallback By Day', de: 'Fallback je Tag' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {}
        },
        fallbackRankByDay: {
            label: { en: 'Fallback Rank By Day', de: 'Fallback-Rang je Tag' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {}
        },
        pickupByDay: {
            label: { en: 'Pickup By Day', de: 'Abholung nach Tag' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {}
        },
        authorizedContacts: {
            label: { en: 'Authorized Contacts (Global)', de: 'Abholberechtigte (Global)' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: { rows: [], names: '', warning: '' }
        },
        actions: {
            label: { en: 'Action Buttons', de: 'Aktionsschaltflächen' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {
                canEditWishes: true,
                canEditHeimweg: true,
                editWishesLink: '',
                editHeimwegLink: ''
            }
        }
    },
    triggerEvents: [
        {
            name: 'edit-wishes',
            label: { en: 'On edit wishes', de: 'Bei Bearbeitung der Wünsche' },
            event: { studentId: '' }
        },
        {
            name: 'edit-heimweg',
            label: { en: 'On edit pickup info', de: 'Bei Bearbeitung der Abholinformationen' },
            event: { studentId: '' }
        }
    ]
};