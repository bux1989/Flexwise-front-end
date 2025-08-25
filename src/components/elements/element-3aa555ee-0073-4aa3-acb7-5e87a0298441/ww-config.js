export default {
editor: {
label: {
en: 'Go Home Settings',
de: 'Abholinfo'
},
icon: 'home'
},
properties: {
activeSemester: {
label: {
en: 'Active Semester',
de: 'Aktives Semester'
},
type: 'Object',
section: 'settings',
bindable: true,
defaultValue: {
id: 'current',
label: 'Current Semester',
startDate: '01.01.2023',
endDate: '30.06.2023'
},
},
schoolDays: {
label: {
en: 'School Days',
de: 'Schultage'
},
type: 'Array',
section: 'settings',
bindable: true,
defaultValue: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"],
options: {
expandable: true,
getItemLabel(_, index) {
return `Day ${index + 1}`;
},
item: {
type: 'Text'
}
},
},
contacts: {
label: {
en: 'Contacts',
de: 'Kontakte'
},
type: 'Array',
section: 'settings',
bindable: true,
defaultValue: [
{
id: '1',
first_name: 'Max',
last_name: 'Mustermann',
relation: 'Vater',
phone: '+49123456789'
},
{
id: '2',
first_name: 'Anna',
last_name: 'Mustermann',
relation: 'Mutter',
phone: '+49987654321'
}
],
options: {
expandable: true,
getItemLabel(item) {
return item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` : `Contact ${item.id || ''}`;
},
item: {
type: 'Object',
options: {
item: {
id: {
label: 'ID',
type: 'Text'
},
first_name: {
label: 'First Name',
type: 'Text'
},
last_name: {
label: 'Last Name',
type: 'Text'
},
relation: {
label: 'Relation',
type: 'Text'
},
phone: {
label: 'Phone',
type: 'Text'
}
}
}
}
},
},
mapping: {
label: {
en: 'Contact Field Mapping',
de: 'Kontaktfeld-Mapping'
},
type: 'Object',
section: 'settings',
bindable: true,
defaultValue: {
id: "id",
firstName: "first_name",
lastName: "last_name",
relation: "relation",
phone: "phone"
},
options: {
item: {
id: {
label: 'ID Field',
type: 'Text'
},
firstName: {
label: 'First Name Field',
type: 'Text'
},
lastName: {
label: 'Last Name Field',
type: 'Text'
},
relation: {
label: 'Relation Field',
type: 'Text'
},
phone: {
label: 'Phone Field',
type: 'Text'
}
}
},
},
methods: {
label: {
en: 'Dismissal Methods',
de: 'Abholarten'
},
type: 'Array',
section: 'settings',
bindable: true,
defaultValue: [
{ id: "goes_alone", label: "Allein nach Hause" },
{ id: "public_transport", label: "Öffentliche Verkehrsmittel" },
{ id: "school_bus", label: "Schulbus / Shuttle" },
{ id: "authorized_pickup", label: "Abholung durch berechtigte Person" },
{ id: "varies_daily", label: "Tägliche Auswahl (unterschiedlich)" }
],
options: {
expandable: true,
getItemLabel(item) {
return item.label || item.id || 'Method';
},
item: {
type: 'Object',
options: {
item: {
id: {
label: 'ID',
type: 'Text'
},
label: {
label: 'Label',
type: 'Text'
}
}
}
}
},
},
initialValue: {
label: {
en: 'Initial Value',
de: 'Anfangswert'
},
type: 'Object',
section: 'settings',
bindable: true,
defaultValue: {
method: "none",
notes: "",
authorizedIds: [],
primaryContactId: null,
byDay: null
},
options: {
item: {
method: {
label: 'Method',
type: 'Text'
},
notes: {
label: 'Notes',
type: 'Text'
},
authorizedIds: {
label: 'Authorized IDs',
type: 'Array'
},
primaryContactId: {
label: 'Primary Contact ID',
type: 'Text'
},
byDay: {
label: 'By Day',
type: 'Object'
}
}
},
},
readOnly: {
label: {
en: 'Read Only',
de: 'Schreibgeschützt'
},
type: 'OnOff',
section: 'settings',
bindable: true,
defaultValue: false,
},
ui: {
label: {
en: 'UI Options',
de: 'UI-Optionen'
},
type: 'Object',
section: 'settings',
bindable: true,
defaultValue: {
compact: true,
stickySubmit: true,
allowAddContact: true,
autosaveLocal: true,
storageKey: "go-home-settings",
emitDebounceMs: 250
},
options: {
item: {
compact: {
label: 'Compact Mode',
type: 'OnOff'
},
stickySubmit: {
label: 'Sticky Submit Button',
type: 'OnOff'
},
allowAddContact: {
label: 'Allow Adding Contacts',
type: 'OnOff'
},
autosaveLocal: {
label: 'Auto-save to LocalStorage',
type: 'OnOff'
},
storageKey: {
label: 'LocalStorage Key',
type: 'Text'
},
emitDebounceMs: {
label: 'Emit Debounce (ms)',
type: 'Number'
}
}
},
},
labels: {
label: {
en: 'Text Labels',
de: 'Textbeschriftungen'
},
type: 'Object',
section: 'settings',
bindable: true,
defaultValue: {
heading: "Abholinfo",
method: "Abholart",
selectValue: "Wert auswählen",
notes: "Notizen",
notesPlaceholder: "Notizen",
dayNotesPlaceholder: "Notizen",
authorized: "Abholberechtigt",
setPrimary: "Primär",
primaryLabel: "Primärabholer",
firstName: "Vorname",
lastName: "Nachname",
phone: "Fonnummer",
relation: "Beziehung zum Kind",
add: "Hinzufügen",
submit: "Speichern",
errSelectMethod: "Bitte wählen Sie eine Abholart.",
errSelectAllDays: "Bitte wählen Sie für jeden Schultag eine Abholart.",
errAuthorizedRequired: "Bitte wählen Sie mindestens eine abholberechtigte Person aus.",
errPrimaryRequired: "Bitte wählen Sie einen Primärabholer.",
errNewContactRequired: "Bitte füllen Sie Vorname und Nachname aus."
},
options: {
item: {
heading: { label: 'Heading', type: 'Text' },
method: { label: 'Method Label', type: 'Text' },
selectValue: { label: 'Select Placeholder', type: 'Text' },
notes: { label: 'Notes Label', type: 'Text' },
notesPlaceholder: { label: 'Notes Placeholder', type: 'Text' },
dayNotesPlaceholder: { label: 'Day Notes Placeholder', type: 'Text' },
authorized: { label: 'Authorized Label', type: 'Text' },
setPrimary: { label: 'Set Primary Label', type: 'Text' },
primaryLabel: { label: 'Primary Label', type: 'Text' },
firstName: { label: 'First Name Label', type: 'Text' },
lastName: { label: 'Last Name Label', type: 'Text' },
phone: { label: 'Phone Label', type: 'Text' },
relation: { label: 'Relation Label', type: 'Text' },
add: { label: 'Add Button', type: 'Text' },
submit: { label: 'Submit Button', type: 'Text' },
errSelectMethod: { label: 'Error: Select Method', type: 'Text' },
errSelectAllDays: { label: 'Error: Select All Days', type: 'Text' },
errAuthorizedRequired: { label: 'Error: Authorized Required', type: 'Text' },
errPrimaryRequired: { label: 'Error: Primary Required', type: 'Text' },
errNewContactRequired: { label: 'Error: New Contact Required', type: 'Text' }
}
},
}
},
triggerEvents: [
{
name: 'change',
label: { en: 'On change', de: 'Bei Änderung' },
event: { value: {} }
},
{
name: 'submit',
label: { en: 'On submit', de: 'Bei Absenden' },
event: { value: {} }
}
]
};