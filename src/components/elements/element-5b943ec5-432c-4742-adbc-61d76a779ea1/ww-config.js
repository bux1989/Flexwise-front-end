export default {
  editor: {
    label: {
      en: 'Fehlzeiten Dashboard',
      de: 'Fehlzeiten Dashboard'
    },
    icon: 'calendar-check',
    bubble: {
      icon: 'calendar-check',
    },
    infoTag: content => ({
      text: content.dashboardTitle || 'Fehlzeiten Dashboard',
      color: 'var(--ww-color-blue-500)',
    }),
  },
  
  properties: {
    // ===== DATA BINDING CONFIGURATION =====
    attendanceData: {
      label: { en: 'Attendance Data', de: 'Fehlzeiten Daten' },
      type: 'Array',
      defaultValue: [],
      section: 'data',
      bindable: true
    },
    
    classesData: {
      label: { en: 'Classes Data', de: 'Klassen Daten' },
      type: 'Array',
      defaultValue: [],
      section: 'data',
      bindable: true
    },

    studentsData: {
      label: { en: 'Students Data', de: 'Schüler Daten' },
      type: 'Array',
      defaultValue: [],
      section: 'data',
      bindable: true
    },
    
    schoolId: {
      label: { en: 'School ID', de: 'Schul-ID' },
      type: 'Text',
      defaultValue: '',
      section: 'data',
      bindable: true,
      options: {
        placeholder: 'UUID of the school'
      }
    },
    
    // ===== HEADER CONFIGURATION =====
    dashboardTitle: {
      label: { en: 'Dashboard Title', de: 'Dashboard Titel' },
      type: 'Text',
      defaultValue: 'Fehlzeiten',
      section: 'header'
    },
    
    showHeader: {
      label: { en: 'Show Header', de: 'Header anzeigen' },
      type: 'OnOff',
      defaultValue: true,
      section: 'header'
    },
    
    // ===== UI DISPLAY CONFIGURATION =====
    showFilters: {
      label: { en: 'Show Filters', de: 'Filter anzeigen' },
      type: 'OnOff',
      defaultValue: true,
      section: 'display'
    },
    
    showExportButton: {
      label: { en: 'Show Export Button', de: 'Export Button anzeigen' },
      type: 'OnOff',
      defaultValue: true,
      section: 'display'
    },
    
    showAddButton: {
      label: { en: 'Show Add Button', de: 'Hinzufügen Button anzeigen' },
      type: 'OnOff',
      defaultValue: true,
      section: 'display'
    },
    
    showResultsCount: {
      label: { en: 'Show Results Count', de: 'Ergebnis-Anzahl anzeigen' },
      type: 'OnOff',
      defaultValue: true,
      section: 'display'
    },
    
    compactMode: {
      label: { en: 'Compact Mode', de: 'Kompakt Modus' },
      type: 'OnOff',
      defaultValue: false,
      section: 'display'
    },
    
    // ===== TABLE CONFIGURATION =====
    sortableColumns: {
      label: { en: 'Enable Column Sorting', de: 'Spalten-Sortierung aktivieren' },
      type: 'OnOff',
      defaultValue: true,
      section: 'table'
    },
    
    clickableRows: {
      label: { en: 'Clickable Rows', de: 'Klickbare Zeilen' },
      type: 'OnOff',
      defaultValue: true,
      section: 'table'
    },
    
    showStatusIcons: {
      label: { en: 'Show Status Icons', de: 'Status Icons anzeigen' },
      type: 'OnOff',
      defaultValue: true,
      section: 'table'
    },
    
    showSourceIndicators: {
      label: { en: 'Show Source Indicators', de: 'Quellen-Indikatoren anzeigen' },
      type: 'OnOff',
      defaultValue: true,
      section: 'table'
    },
    
    itemsPerPage: {
      label: { en: 'Items Per Page', de: 'Einträge pro Seite' },
      type: 'Number',
      defaultValue: 25,
      section: 'table',
      options: {
        min: 5,
        max: 100,
        step: 5
      }
    },
    
    // ===== BEHAVIOR CONFIGURATION =====
    allowEdit: {
      label: { en: 'Allow Edit', de: 'Bearbeitung erlauben' },
      type: 'OnOff',
      defaultValue: true,
      section: 'behavior'
    },
    
    allowDelete: {
      label: { en: 'Allow Delete', de: 'Löschen erlauben' },
      type: 'OnOff',
      defaultValue: false,
      section: 'behavior'
    },
    
    allowAdd: {
      label: { en: 'Allow Add New', de: 'Hinzufügen erlauben' },
      type: 'OnOff',
      defaultValue: true,
      section: 'behavior'
    },
    
    allowExport: {
      label: { en: 'Allow Export', de: 'Export erlauben' },
      type: 'OnOff',
      defaultValue: true,
      section: 'behavior'
    },
    
    autoRefresh: {
      label: { en: 'Auto Refresh (seconds)', de: 'Auto-Aktualisierung (Sekunden)' },
      type: 'Number',
      defaultValue: 0,
      section: 'behavior',
      options: {
        min: 0,
        max: 300,
        step: 30
      }
    },
    
    // ===== FILTER DEFAULTS =====
    defaultClass: {
      label: { en: 'Default Class Filter', de: 'Standard Klassenfilter' },
      type: 'Text',
      defaultValue: '',
      section: 'filters',
      options: {
        placeholder: 'e.g. 5a, 6b (empty = all)'
      }
    },
    
    defaultDate: {
      label: { en: 'Default Date Filter', de: 'Standard Datumsfilter' },
      type: 'Text',
      defaultValue: '',
      section: 'filters',
      options: {
        placeholder: 'YYYY-MM-DD (empty = today)'
      }
    },
    
    defaultStatus: {
      label: { en: 'Default Status Filter', de: 'Standard Statusfilter' },
      type: 'TextSelect',
      options: {
        options: [
          { value: 'alle', label: { en: 'All', de: 'Alle' } },
          { value: 'krankgemeldet', label: { en: 'Sick', de: 'Krankgemeldet' } },
          { value: 'unentschuldigt', label: { en: 'Unexcused', de: 'Unentschuldigt' } },
          { value: 'beurlaubt', label: { en: 'Excused', de: 'Beurlaubt' } },
          { value: 'verspätet', label: { en: 'Late', de: 'Verspätet' } },
          { value: 'ungeklärt', label: { en: 'Unclear', de: 'Ungeklärt' } }
        ]
      },
      defaultValue: 'alle',
      section: 'filters'
    },
    
    defaultSortBy: {
      label: { en: 'Default Sort Column', de: 'Standard Sortierung' },
      type: 'TextSelect',
      options: {
        options: [
          { value: 'firstName', label: { en: 'First Name', de: 'Vorname' } },
          { value: 'lastName', label: { en: 'Last Name', de: 'Nachname' } },
          { value: 'class', label: { en: 'Class', de: 'Klasse' } },
          { value: 'time', label: { en: 'Time', de: 'Zeit' } },
          { value: 'status', label: { en: 'Status', de: 'Status' } },
          { value: 'date', label: { en: 'Date', de: 'Datum' } }
        ]
      },
      defaultValue: 'time',
      section: 'filters'
    },
    
    defaultSortOrder: {
      label: { en: 'Default Sort Order', de: 'Standard Sortierreihenfolge' },
      type: 'TextSelect',
      options: {
        options: [
          { value: 'asc', label: { en: 'Ascending', de: 'Aufsteigend' } },
          { value: 'desc', label: { en: 'Descending', de: 'Absteigend' } }
        ]
      },
      defaultValue: 'asc',
      section: 'filters'
    },
    
    // ===== STYLING CONFIGURATION =====
    colorTheme: {
      label: { en: 'Color Theme', de: 'Farbschema' },
      type: 'TextSelect',
      options: {
        options: [
          { value: 'default', label: { en: 'Default', de: 'Standard' } },
          { value: 'blue', label: { en: 'Blue', de: 'Blau' } },
          { value: 'green', label: { en: 'Green', de: 'Grün' } },
          { value: 'purple', label: { en: 'Purple', de: 'Lila' } },
          { value: 'orange', label: { en: 'Orange', de: 'Orange' } }
        ]
      },
      defaultValue: 'default',
      section: 'style'
    },
    
    tableHeight: {
      label: { en: 'Table Height', de: 'Tabellen-Höhe' },
      type: 'Length',
      defaultValue: '600px',
      section: 'style'
    },
    
    borderRadius: {
      label: { en: 'Border Radius', de: 'Rahmen-Radius' },
      type: 'Length',
      defaultValue: '8px',
      section: 'style'
    },
    
    // ===== STATUS COLORS CONFIGURATION =====
    statusColorSick: {
      label: { en: 'Sick Status Color', de: 'Krankgemeldet Farbe' },
      type: 'Color',
      defaultValue: '#16a34a',
      section: 'statusColors'
    },
    
    statusColorUnexcused: {
      label: { en: 'Unexcused Status Color', de: 'Unentschuldigt Farbe' },
      type: 'Color',
      defaultValue: '#dc2626',
      section: 'statusColors'
    },
    
    statusColorExcused: {
      label: { en: 'Excused Status Color', de: 'Beurlaubt Farbe' },
      type: 'Color',
      defaultValue: '#2563eb',
      section: 'statusColors'
    },
    
    statusColorLate: {
      label: { en: 'Late Status Color', de: 'Verspätet Farbe' },
      type: 'Color',
      defaultValue: '#ca8a04',
      section: 'statusColors'
    },
    
    statusColorUnclear: {
      label: { en: 'Unclear Status Color', de: 'Ungeklärt Farbe' },
      type: 'Color',
      defaultValue: '#64748b',
      section: 'statusColors'
    },

    // ===== MODAL CONFIGURATION =====
    detailModalTitle: {
      label: { en: 'Detail Modal Title', de: 'Detail Modal Titel' },
      type: 'Text',
      defaultValue: 'Fehlzeit Details',
      section: 'modal'
    },

    showDetailModal: {
      label: { en: 'Show Detail Modal on Row Click', de: 'Detail Modal beim Zeilen-Klick' },
      type: 'OnOff',
      defaultValue: true,
      section: 'modal'
    }
  },
  
  options: {
    autoByContent: true,
    sizable: true,
    hyperlink: false,
    useClassicEditor: false,
    responsive: true
  },

  triggerEvents: [
    {
      name: 'open-add-absence',
      label: { en: 'Open Add Absence', de: 'Fehlzeit hinzufügen öffnen' },
      event: {
        action: 'string',
        timestamp: 'string',
        school_id: 'string',
        current_filters: {
          class: 'string',
          student: 'string',
          date: 'string',
          status: 'string'
        }
      }
    },
    {
      name: 'add-absence',
      label: { en: 'Add Absence', de: 'Fehlzeit hinzufügen' },
      event: {
        timestamp: 'string',
        current_date: 'string',
        current_time: 'string',
        current_filters: {
          class: 'string',
          student: 'string',
          date: 'string',
          status: 'string'
        },
        action: 'string',
        context: {
          school_id: 'string',
          user_timezone: 'string',
          session_id: 'string'
        }
      }
    },
    {
      name: 'save-entry',
      label: { en: 'Save Entry', de: 'Eintrag speichern' },
      event: {
        action: 'string',
        id: 'string',
        data: {
          student_id: 'string',
          school_id: 'string',
          start_date: 'string',
          end_date: 'string',
          duration: 'string',
          time_range: 'string',
          status: 'string',
          reason: 'string',
          has_attachment: 'boolean'
        }
      }
    },
    {
      name: 'open-edit-absence',
      label: { en: 'Open Edit Absence', de: 'Fehlzeit bearbeiten öffnen' },
      event: {
        action: 'string',
        absenceId: 'string',
        studentName: 'string',
        studentClass: 'string',
        currentData: 'object'
      }
    },
    {
      name: 'edit-absence',
      label: { en: 'Edit Absence', de: 'Fehlzeit bearbeiten' },
      event: {
        absenceId: 'string',
        studentName: 'string',
        studentClass: 'string',
        currentData: 'object'
      }
    },
    {
      name: 'delete-absence',
      label: { en: 'Delete Absence', de: 'Fehlzeit löschen' },
      event: {
        absenceId: 'string',
        school_id: 'string',
        studentName: 'string',
        confirmed: 'boolean'
      }
    },
    {
      name: 'refresh-data',
      label: { en: 'Refresh Data', de: 'Daten aktualisieren' },
      event: {
        school_id: 'string',
        class_filter: 'string',
        student_search: 'string',
        status_filter: 'string',
        date_filter: 'string'
      }
    },
    {
      name: 'filters-changed',
      label: { en: 'Filters Changed', de: 'Filter geändert' },
      event: {
        filters: {
          class: 'string',
          student: 'string',
          date: 'string',
          status: 'string'
        },
        resultCount: 'number'
      }
    },
    {
      name: 'row-selected',
      label: { en: 'Row Selected', de: 'Zeile ausgewählt' },
      event: {
        selectedEntry: 'object',
        studentId: 'string',
        absenceId: 'string'
      }
    },
    {
      name: 'export-data',
      label: { en: 'Export Data', de: 'Daten exportieren' },
      event: {
        format: 'string',
        dataCount: 'number',
        filters: 'object',
        data: 'array'
      }
    },
    {
      name: 'data-loaded',
      label: { en: 'Data Loaded', de: 'Daten geladen' },
      event: {
        count: 'number',
        totalCount: 'number',
        timestamp: 'string'
      }
    }
  ]
};
