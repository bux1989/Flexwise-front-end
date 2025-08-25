export default {
    editor: {
        label: { en: 'Wish Ranker By Day' },
        icon: 'calendar'
    },
    properties: {
        modules: {
            label: { en: 'Course Modules' },
            type: 'Array',
            section: 'settings',
            bindable: true,
            defaultValue: [
                { window_id: 'mo-a1', course_id: 'c1', day: 'Montag', title: 'Fahrradwerkstatt', meta: '15:00–16:30' },
                { window_id: 'mo-a2', course_id: 'c2', day: 'Montag', title: 'Archery', meta: '15:00–16:00' },
                { window_id: 'di-b1', course_id: 'c3', day: 'Dienstag', title: 'Fußball', meta: '14:30–16:00' }
            ],
            options: {
                expandable: true,
                getItemLabel(item) {
                    return item.title || `Course ${item.window_id}`;
                },
                item: {
                    type: 'Object',
                    options: {
                        item: {
                            window_id: { label: 'Window ID', type: 'Text', options: { placeholder: 'Unique window ID' } },
                            course_id: { label: 'Course ID', type: 'Text', options: { placeholder: 'Course ID' } },
                            day: { label: 'Day', type: 'Text', options: { placeholder: 'Day name (e.g. Montag)' } },
                            title: { label: 'Title', type: 'Text', options: { placeholder: 'Course title' } },
                            meta: { label: 'Meta Info', type: 'Text', options: { placeholder: 'Time/location (e.g. 15:00-16:30)' } },
                            // Optional info (if bound from DB shaper)
                            course_code: { label: 'Course Code', type: 'Text' },
                            description_visible_to_parents: { label: 'Description visible to parents', type: 'OnOff', defaultValue: false },
                            // Use Text instead of TextArea to avoid unknown-type errors
                            description_for_parents: { label: 'Description (Parents)', type: 'Text', options: { placeholder: 'Shown if allowed (plain text)' } },
                            // If you want HTML, pass a stripped/clean string from the shaper.
                            pictures: {
                                label: 'Pictures',
                                type: 'Array',
                                options: {
                                    expandable: true,
                                    getItemLabel: (u) => u || 'URL',
                                    item: { type: 'Text', options: { placeholder: 'https://...' } }
                                }
                            },
                            picture_first: { label: 'First Picture URL', type: 'Text' }
                        }
                    }
                }
            },
        },
        daysOrder: {
            label: { en: 'Days Order' },
            type: 'Array',
            section: 'settings',
            bindable: true,
            defaultValue: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'],
            options: {
                expandable: true,
                getItemLabel(item) {
                    return item || 'Day';
                },
                item: { type: 'Text', options: { placeholder: 'Day name' } }
            },
        },
        mapping: {
            label: { en: 'Field Mapping' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {
                idField: 'window_id',
                dayField: 'day',
                titleField: 'title',
                metaField: 'meta'
            },
            options: {
                item: {
                    idField: { label: 'ID Field', type: 'Text', defaultValue: 'window_id' },
                    dayField: { label: 'Day Field', type: 'Text', defaultValue: 'day' },
                    titleField: { label: 'Title Field', type: 'Text', defaultValue: 'title' },
                    metaField: { label: 'Meta Field', type: 'Text', defaultValue: 'meta' }
                }
            },
        },
        initialSelection: {
            label: { en: 'Initial Selection' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {},
        },
        period: {
            label: { en: 'Registration Period' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: { isOpen: true, maxWishesPerDay: null },
            options: {
                item: {
                    isOpen: { label: 'Is Open', type: 'OnOff', defaultValue: true },
                    opensAt: { label: 'Opens At', type: 'Text', defaultValue: '', options: { placeholder: 'YYYY-MM-DD HH:MM' } },
                    closesAt: { label: 'Closes At', type: 'Text', defaultValue: '', options: { placeholder: 'YYYY-MM-DD HH:MM' } },
                    maxWishesPerDay: { label: 'Max wishes per day (dynamic)', type: 'Number', defaultValue: null, options: { min: 1, max: 10 } }
                }
            },
        },
        readOnly: {
            label: { en: 'Read Only' },
            type: 'OnOff',
            section: 'settings',
            bindable: true,
            defaultValue: false,
        },
        ui: {
            label: { en: 'UI Options' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {
                ranksPerDay: 3,
                showQuickAdd: true,
                showSelect: true,
                showPerDaySummary: true,
                stickySummary: true,
                showDayTabs: true,
                collapsedDays: false,
                scrollOffsetPx: 72,
                enableNoOffer: true
            },
            options: {
                item: {
                    ranksPerDay: { label: 'Default Ranks Per Day', type: 'Number', defaultValue: 3, options: { min: 1, max: 10 } },
                    showQuickAdd: { label: 'Show Quick Add', type: 'OnOff', defaultValue: true },
                    showSelect: { label: 'Show Select', type: 'OnOff', defaultValue: true },
                    showPerDaySummary: { label: 'Show Day Summary', type: 'OnOff', defaultValue: true },
                    stickySummary: { label: 'Sticky Summary', type: 'OnOff', defaultValue: true },
                    showDayTabs: { label: 'Show Day Tabs', type: 'OnOff', defaultValue: true },
                    collapsedDays: { label: 'Collapsed Days', type: 'OnOff', defaultValue: false },
                    scrollOffsetPx: { label: 'Scroll Offset (px)', type: 'Number', defaultValue: 72, options: { min: 0, max: 200 } },
                    enableNoOffer: { label: 'Enable "No offer" per day', type: 'OnOff', defaultValue: true }
                }
            },
        },
        labels: {
            label: { en: 'Labels' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {
                heading: 'Bitte wählen Sie pro Tag bis zu 3 Module',
                note: '',
                wishLabel: 'Wunsch',
                none: '—',
                first: '1. Wunsch',
                second: '2. Wunsch',
                third: '3. Wunsch',
                resetDay: 'Zurücksetzen',
                chipEmpty: 'Leer',
                quickAddTooltip: 'Klicken: + → 1 → 2 → 3 → —',
                submit: 'Speichern',
                moreInfo: 'Mehr Info',
                lessInfo: 'Weniger Info',
                noOfferToggle: 'Kein Angebot (geht nach Hause)',
                noOfferChip: 'Kein Angebot gewählt'
            },
            options: {
                item: {
                    heading: { label: 'Heading', type: 'Text' },
                    note: { label: 'Note', type: 'Text' },
                    wishLabel: { label: 'Wish Label', type: 'Text' },
                    none: { label: 'None Option', type: 'Text' },
                    first: { label: 'First Wish', type: 'Text' },
                    second: { label: 'Second Wish', type: 'Text' },
                    third: { label: 'Third Wish', type: 'Text' },
                    resetDay: { label: 'Reset Day', type: 'Text' },
                    chipEmpty: { label: 'Empty Chip', type: 'Text' },
                    quickAddTooltip: { label: 'Quick Add Tooltip', type: 'Text' },
                    submit: { label: 'Submit Button', type: 'Text' },
                    moreInfo: { label: 'More Info', type: 'Text' },
                    lessInfo: { label: 'Less Info', type: 'Text' },
                    noOfferToggle: { label: '"No offer" toggle', type: 'Text' },
                    noOfferChip: { label: '"No offer" chip text', type: 'Text' }
                }
            },
        },
        theme: {
            label: { en: 'Theme' },
            type: 'Object',
            section: 'style',
            bindable: true,
            defaultValue: {
                accentColor: '#3b82f6',
                borderColor: '#e5e7eb',
                chipBg: '#f3f4f6',
                fontSizePx: 14
            },
            options: {
                item: {
                    accentColor: { label: 'Accent Color', type: 'Color', defaultValue: '#3b82f6' },
                    borderColor: { label: 'Border Color', type: 'Color', defaultValue: '#e5e7eb' },
                    chipBg: { label: 'Chip Background', type: 'Color', defaultValue: '#f3f4f6' },
                    fontSizePx: { label: 'Font Size (px)', type: 'Number', defaultValue: 14, options: { min: 10, max: 24 } }
                }
            },
        },
        storage: {
            label: { en: 'Storage Options' },
            type: 'Object',
            section: 'settings',
            bindable: true,
            defaultValue: {
                autosaveLocal: true,
                storageKey: 'wish-per-day',
                emitDebounceMs: 200
            },
            options: {
                item: {
                    autosaveLocal: { label: 'Autosave to LocalStorage', type: 'OnOff', defaultValue: true },
                    storageKey: { label: 'Storage Key', type: 'Text', defaultValue: 'wish-per-day' },
                    emitDebounceMs: { label: 'Emit Debounce (ms)', type: 'Number', defaultValue: 200, options: { min: 0, max: 2000 } }
                }
            },
        }
    },
    triggerEvents: [
        {
            name: 'change',
            label: { en: 'On change' },
            event: { byDay: {}, flat: [], json: '[]', noOfferDays: [] }
        },
        {
            name: 'submit',
            label: { en: 'On submit' },
            event: { byDay: {}, flat: [], json: '[]', noOfferDays: [] }
        }
    ],
    actions: [
        {
            action: 'setRank',
            label: { en: 'Set rank' },
            args: [
                { name: 'day', type: 'string', label: { en: 'Day' } },
                { name: 'windowId', type: 'string', label: { en: 'Window ID' } },
                { name: 'rank', type: 'number', label: { en: 'Rank (1-3, use 0 to clear)' } }
            ]
        },
        {
            action: 'resetDay',
            label: { en: 'Reset day' },
            args: [{ name: 'day', type: 'string', label: { en: 'Day' } }]
        },
        { action: 'clearAll', label: { en: 'Clear all selections' } },
        {
            action: 'importSelection',
            label: { en: 'Import selection' },
            args: [{ name: 'selection', type: 'object', label: { en: 'Selection data' } }]
        },
        {
            action: 'resetToInitial',
            label: { en: 'Reset to initial' },
            args: [{ name: 'clearLocal', type: 'boolean', label: { en: 'Also clear localStorage' } }]
        },
        {
            action: 'scrollToDay',
            label: { en: 'Scroll to day' },
            args: [{ name: 'day', type: 'string', label: { en: 'Day' } }]
        },
        { action: 'submit', label: { en: 'Submit' } }
    ]

};