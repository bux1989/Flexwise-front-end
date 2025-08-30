import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import * as XLSX from 'xlsx'
import {
  ArrowLeft,
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Users,
  Calendar,
  Camera,
  Heart,
  GraduationCap,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import StudentDetailView from './StudentDetailView'
import StudentEditView from './StudentEditView'

export default function StudentManagement({ onBack }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedButStatus, setSelectedButStatus] = useState('all')
  const [selectedPhotoStatus, setSelectedPhotoStatus] = useState('all')
  const [selectedActiveStatus, setSelectedActiveStatus] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDetailView, setShowDetailView] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addMode, setAddMode] = useState('single') // 'single' or 'multiple'
  const [newStudentData, setNewStudentData] = useState({
    firstName: '',
    lastName: '',
    class: '',
    einstieg: new Date().toISOString().split('T')[0], // Today's date
    phone: ''
  })
  const [multipleStudents, setMultipleStudents] = useState([
    {
      id: Date.now(),
      firstName: '',
      lastName: '',
      class: '',
      einstieg: new Date().toISOString().split('T')[0],
      phone: ''
    }
  ])

  // Excel Upload States
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [parsedData, setParsedData] = useState([])
  const [uploadErrors, setUploadErrors] = useState([])
  const [isProcessingFile, setIsProcessingFile] = useState(false)

  // Mock student data - replace with real data from Supabase
  const [students, setStudents] = useState([
    {
      id: 1,
      firstName: 'Max',
      lastName: 'Mustermann',
      nickname: 'Maxi',
      email: 'max.mustermann@student.de',
      phone: '+49 123 456789',
      class: '10A',
      birthDate: '2008-05-15',
      status: 'active', // Has FlexWise login
      address: 'Musterstraße 123, 12345 Berlin',
      einstieg: '2023-08-01', // Started school
      ausstieg: '', // No exit date - still active
      loginInfo: {
        hasAccount: true,
        registrationDate: '2024-01-15',
        lastLogin: '2024-03-15'
      },
      photoPermissions: [
        {
          date: '2024-01-15',
          description: 'Schulveranstaltungen und Projekte',
          grantedBy: 'Frau Mustermann',
          validUntil: '2024-12-31'
        }
      ],
      allergies: [
        {
          name: 'Erdnüsse',
          severity: 'Schwer',
          description: 'Anaphylaxie-Risiko, Notfallmedikation verfügbar'
        }
      ],
      but: {
        enabled: true,
        type: 'B1',
        validUntil: '2024-08-31'
      },
      parents: [
        {
          firstName: 'Maria',
          lastName: 'Mustermann',
          relationship: 'Mutter',
          email: 'maria.mustermann@email.de',
          phone: '+49 123 456789',
          address: 'Musterstraße 123, 12345 Berlin',
          isPrimary: true,
          loginInfo: {
            hasAccount: true,
            registrationDate: '2024-01-20',
            lastLogin: '2024-03-14'
          }
        },
        {
          firstName: 'Peter',
          lastName: 'Mustermann',
          relationship: 'Vater',
          email: 'peter.mustermann@email.de',
          phone: '+49 123 456788',
          address: 'Musterstraße 123, 12345 Berlin',
          isPrimary: false,
          loginInfo: {
            hasAccount: false,
            registrationDate: null,
            lastLogin: null
          }
        }
      ],
      siblings: [
        {
          firstName: 'Anna',
          lastName: 'Mustermann',
          class: '8B',
          birthDate: '2010-03-20'
        }
      ],
      pickupSchedule: {
        'montag': {
          time: '16:00',
          method: 'Abholung durch Eltern',
          authorizedPersons: ['Maria Mustermann', 'Peter Mustermann'],
          notes: 'Nur durch Eltern'
        },
        'dienstag': {
          time: '15:30',
          method: 'Abholung durch Großeltern',
          authorizedPersons: ['Oma Gertrude'],
          notes: 'Dienstags bei den Großeltern'
        },
        'mittwoch': {
          time: '17:00',
          method: 'Selbstständig nach Hause',
          authorizedPersons: [],
          notes: 'Geht allein nach AG'
        },
        'donnerstag': {
          time: '16:00',
          method: 'Abholung durch Eltern',
          authorizedPersons: ['Maria Mustermann', 'Peter Mustermann'],
          notes: ''
        },
        'freitag': {
          time: '14:00',
          method: 'Selbstständig nach Hause',
          authorizedPersons: [],
          notes: 'Früher Schulschluss'
        }
      },
      authorizedPersons: [
        {
          name: 'Gertrude Mustermann',
          relationship: 'Großmutter',
          phone: '+49 123 456700',
          idRequired: false
        },
        {
          name: 'Klaus Weber',
          relationship: 'Nachbar',
          phone: '+49 123 456701',
          idRequired: true
        }
      ],
      activeCourses: [
        {
          name: 'Robotik AG',
          instructor: 'Herr Dr. Tech',
          schedule: 'Mittwoch 15:00-17:00',
          location: 'Informatikraum',
          type: 'AG',
          startDate: '2024-01-10',
          description: 'Programmierung und Bau von Robotern'
        },
        {
          name: 'Schach Club',
          instructor: 'Frau Weise',
          schedule: 'Freitag 14:00-15:30',
          location: 'Klassenzimmer 201',
          type: 'AG',
          startDate: '2023-09-01',
          description: 'Strategisches Schachspiel für Anfänger und Fortgeschrittene'
        }
      ],
      waitingList: [
        {
          name: 'Theater AG',
          instructor: 'Herr Drama',
          schedule: 'Donnerstag 16:00-18:00',
          waitingPosition: 3,
          registrationDate: '2024-01-20'
        }
      ],
      pastCourses: [
        {
          name: 'Fußball AG',
          instructor: 'Herr Sport',
          period: '2023-2024',
          completed: true
        }
      ]
    },
    {
      id: 2,
      firstName: 'Anna',
      lastName: 'Schmidt',
      nickname: null,
      email: 'anna.schmidt@student.de',
      phone: '+49 987 654321',
      class: '10A',
      birthDate: '2008-08-22',
      status: 'inactive', // No FlexWise login yet
      address: 'Hauptstraße 456, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
      loginInfo: {
        hasAccount: false,
        registrationDate: null,
        lastLogin: null
      },
      photoPermissions: [],
      allergies: [],
      but: {
        enabled: false
      }
    },
    {
      id: 3,
      firstName: 'Tom',
      lastName: 'Weber',
      nickname: 'Tommy',
      email: 'tom.weber@student.de',
      phone: '+49 555 123456',
      class: '9B',
      birthDate: '2009-02-10',
      status: 'inactive', // Left school, login disabled
      address: 'Schulstraße 789, 12345 Berlin',
      einstieg: '2022-08-01',
      ausstieg: '2024-07-31', // Student left school
      loginInfo: {
        hasAccount: false, // Account disabled when student left
        registrationDate: '2023-09-01',
        lastLogin: '2024-07-30'
      },
      photoPermissions: [
        {
          date: '2023-09-01',
          description: 'Klassenfotos',
          grantedBy: 'Herr Weber',
          validUntil: '2023-12-31'
        }
      ],
      allergies: [
        {
          name: 'Pollen',
          severity: 'Leicht',
          description: 'Saisonale Allergie, Frühjahr und Sommer'
        }
      ],
      but: {
        enabled: true,
        type: 'L',
        validUntil: '2023-12-31'
      }
    },
    {
      id: 4,
      firstName: 'Lisa',
      lastName: 'Hoffmann',
      nickname: null,
      email: 'lisa.hoffmann@student.de',
      phone: '+49 444 987654',
      class: '10B',
      birthDate: '2008-11-03',
      status: 'active', // Has FlexWise login
      address: 'Lindenstraße 321, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
      loginInfo: {
        hasAccount: true,
        registrationDate: '2024-02-10',
        lastLogin: '2024-03-10'
      },
      photoPermissions: [
        {
          date: '2024-01-10',
          description: 'Schulwebsite und Broschüren',
          grantedBy: 'Frau Hoffmann',
          validUntil: '2025-01-10'
        },
        {
          date: '2024-02-01',
          description: 'Sportveranstaltungen',
          grantedBy: 'Herr Hoffmann',
          validUntil: '2024-12-31'
        }
      ],
      allergies: [],
      but: {
        enabled: false
      }
    },
    {
      id: 5,
      firstName: 'Marco',
      lastName: 'Fischer',
      nickname: null,
      email: 'marco.fischer@student.de',
      phone: '+49 333 111222',
      class: '9A',
      birthDate: '2009-04-18',
      status: 'inactive', // No FlexWise login yet
      address: 'Rosenweg 654, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
      loginInfo: {
        hasAccount: false,
        registrationDate: null,
        lastLogin: null
      },
      photoPermissions: [],
      allergies: [
        {
          name: 'Nüsse',
          severity: 'Mittel',
          description: 'Vermeidung erforderlich'
        },
        {
          name: 'Laktose',
          severity: 'Leicht',
          description: 'Magen-Darm-Beschwerden'
        }
      ],
      but: {
        enabled: true,
        type: 'B2',
        validUntil: '2024-07-31'
      }
    },
    {
      id: 6,
      firstName: 'Julia',
      lastName: 'Wagner',
      nickname: 'Jules',
      email: 'julia.wagner@student.de',
      phone: '+49 222 333444',
      class: '10B',
      birthDate: '2008-07-25',
      status: 'active', // Has FlexWise login
      address: 'Blumenstraße 987, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
      loginInfo: {
        hasAccount: true,
        registrationDate: '2024-01-25',
        lastLogin: '2024-03-12'
      },
      photoPermissions: [
        {
          date: '2024-01-20',
          description: 'Alle Schulaktivitäten',
          grantedBy: 'Frau Wagner',
          validUntil: '2024-12-31'
        }
      ],
      allergies: [],
      but: {
        enabled: false
      }
    },
    {
      id: 7,
      firstName: 'Kevin',
      lastName: 'Bauer',
      nickname: null,
      email: 'kevin.bauer@student.de',
      phone: '+49 111 222333',
      class: '9A',
      birthDate: '2009-01-14',
      status: 'inactive', // No FlexWise login yet
      address: 'Parkstraße 147, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
      loginInfo: {
        hasAccount: false,
        registrationDate: null,
        lastLogin: null
      },
      photoPermissions: [],
      allergies: [],
      but: {
        enabled: false
      }
    }
  ])

  // Get unique classes for filter
  const availableClasses = [...new Set(students.map(student => student.class))].sort()

  // CSV Template and Processing Functions
  const generateCSVTemplate = () => {
    const headers = [
      'Vorname',
      'Nachname',
      'Klasse',
      'Rufname/Nickname',
      'Geburtsdatum',
      'Adresse',
      'Einstieg',
      'Telefon (Schüler)',
      'Eltern 1 - Name',
      'Eltern 1 - E-Mail',
      'Eltern 1 - Telefon',
      'Eltern 2 - Name',
      'Eltern 2 - E-Mail',
      'Eltern 2 - Telefon',
      'Allergien',
      'BuT berechtigt',
      'BuT Typ',
      'BuT Gültig bis'
    ]

    const sampleRow = [
      'Max',
      'Mustermann',
      '10A',
      'Maxi',
      '2008-05-15',
      'Musterstraße 123, 12345 Berlin',
      new Date().toISOString().split('T')[0],
      '+49 123 456789',
      'Maria Mustermann',
      'maria.mustermann@email.de',
      '+49 123 456789',
      'Peter Mustermann',
      'peter.mustermann@email.de',
      '+49 123 456788',
      'Erdnüsse (schwer)',
      'Ja',
      'B1',
      '2024-12-31'
    ]

    return [headers, sampleRow]
  }

  const downloadTemplate = (format = 'csv') => {
    const [headers, sampleRow] = generateCSVTemplate()

    if (format === 'excel') {
      // Create Excel workbook
      const wb = XLSX.utils.book_new()

      // Create data with headers, example row, and instruction
      const instructionRow = ['⚠️ HINWEIS: Die graue Beispielzeile wird automatisch übersprungen', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
      const emptyRow = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
      const newDataRow = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']

      const wsData = [headers, sampleRow, emptyRow, instructionRow, emptyRow, newDataRow]
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Set column widths for better readability
      const colWidths = headers.map(() => ({ wch: 18 }))
      ws['!cols'] = colWidths

      // Style the header row (row 1)
      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!ws[cellRef]) continue
        ws[cellRef].s = {
          fill: { fgColor: { rgb: "366092" } }, // Blue header
          font: { color: { rgb: "FFFFFF" }, bold: true },
          alignment: { horizontal: "center" }
        }
      }

      // Style the example row (row 2) with gray background
      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: col })
        if (!ws[cellRef]) continue
        ws[cellRef].s = {
          fill: { fgColor: { rgb: "E5E5E5" } }, // Light gray background
          font: { color: { rgb: "666666" }, italic: true },
          alignment: { horizontal: "left" }
        }
      }

      // Style the instruction row
      const instructionCellRef = XLSX.utils.encode_cell({ r: 3, c: 0 })
      if (ws[instructionCellRef]) {
        ws[instructionCellRef].s = {
          font: { color: { rgb: "FF6B35" }, bold: true, size: 11 },
          alignment: { horizontal: "left" }
        }
      }

      // Merge cells for instruction
      ws['!merges'] = [{ s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }]

      XLSX.utils.book_append_sheet(wb, ws, 'Schüler Import')
      XLSX.writeFile(wb, 'schueler_import_template.xlsx')
    } else {
      // Generate CSV with proper delimiter (semicolon for German Excel)
      const csvContent = [headers, sampleRow]
        .map(row => row.map(field => `"${field}"`).join(';'))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'schueler_import_template.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const parseFile = (file, arrayBuffer = null, text = null) => {
    const expectedHeaders = [
      'Vorname', 'Nachname', 'Klasse', 'Rufname/Nickname', 'Geburtsdatum', 'Adresse',
      'Einstieg', 'Telefon (Schüler)', 'Eltern 1 - Name', 'Eltern 1 - E-Mail', 'Eltern 1 - Telefon',
      'Eltern 2 - Name', 'Eltern 2 - E-Mail', 'Eltern 2 - Telefon', 'Allergien', 'BuT berechtigt',
      'BuT Typ', 'BuT Gültig bis'
    ]

    let rows = []
    const errors = []

    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      } else {
        // Parse CSV file - try both comma and semicolon delimiters
        const lines = text.split('\n').filter(line => line.trim())

        if (lines.length === 0) {
          return { data: [], errors: ['Datei ist leer'] }
        }

        // Detect delimiter by checking first line
        const firstLine = lines[0]
        const delimiter = firstLine.includes(';') ? ';' : ','

        rows = lines.map(line =>
          line.split(delimiter).map(value => value.replace(/"/g, '').trim())
        )
      }

      if (rows.length < 2) {
        return { data: [], errors: ['Datei ist leer oder enthält nur Überschriften'] }
      }

      const headers = rows[0]
      const data = []

      // Check headers
      if (!expectedHeaders.every(header => headers.includes(header))) {
        errors.push('Datei enthält nicht alle erforderlichen Spalten. Bitte verwenden Sie die Vorlage.')
        return { data: [], errors }
      }

      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i]
        const rowData = {}

        headers.forEach((header, index) => {
          rowData[header] = (values[index] || '').toString().trim()
        })

        // Skip empty rows and instruction rows
        if (!rowData['Vorname'] && !rowData['Nachname'] && !rowData['Klasse']) {
          continue
        }

        // Skip rows that start with warning symbols or instructions
        if (rowData['Vorname'] && rowData['Vorname'].toString().includes('⚠️')) {
          continue
        }

        // Skip example rows (Max Mustermann template data)
        if (rowData['Vorname'] === 'Max' &&
            rowData['Nachname'] === 'Mustermann' &&
            rowData['Klasse'] === '10A' &&
            rowData['Rufname/Nickname'] === 'Maxi') {
          continue // Skip this row without counting as error
        }

        // Validate required fields
        if (!rowData['Vorname']) {
          errors.push(`Zeile ${i + 1}: Vorname ist erforderlich`)
          continue
        }
        if (!rowData['Nachname']) {
          errors.push(`Zeile ${i + 1}: Nachname ist erforderlich`)
          continue
        }
        if (!rowData['Klasse']) {
          errors.push(`Zeile ${i + 1}: Klasse ist erforderlich`)
          continue
        }

        // Validate BuT Type if provided
        if (rowData['BuT Typ'] && !['B1', 'B2', 'L', ''].includes(rowData['BuT Typ'])) {
          errors.push(`Zeile ${i + 1}: BuT Typ muss B1, B2 oder L sein`)
        }

        // Validate BuT berechtigt
        if (rowData['BuT berechtigt'] && !['Ja', 'Nein', 'ja', 'nein', 'Yes', 'No', ''].includes(rowData['BuT berechtigt'])) {
          errors.push(`Zeile ${i + 1}: BuT berechtigt muss "Ja" oder "Nein" sein`)
        }

        data.push({ ...rowData, rowNumber: i + 1 })
      }

      return { data, errors }
    } catch (error) {
      return { data: [], errors: ['Fehler beim Lesen der Datei: ' + error.message] }
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const allowedExtensions = ['.csv', '.xlsx', '.xls']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!allowedExtensions.includes(fileExtension)) {
      setUploadErrors(['Bitte wählen Sie eine CSV- oder Excel-Datei aus (.csv, .xlsx, .xls)'])
      return
    }

    setUploadFile(file)
    setIsProcessingFile(true)
    setUploadErrors([])

    try {
      let data, errors

      if (fileExtension === '.csv') {
        const text = await file.text()
        const result = parseFile(file, null, text)
        data = result.data
        errors = result.errors
      } else {
        const arrayBuffer = await file.arrayBuffer()
        const result = parseFile(file, arrayBuffer, null)
        data = result.data
        errors = result.errors
      }

      setParsedData(data)
      setUploadErrors(errors)
    } catch (error) {
      setUploadErrors(['Fehler beim Lesen der Datei: ' + error.message])
    } finally {
      setIsProcessingFile(false)
    }
  }

  const handleImportStudents = () => {
    if (uploadErrors.length > 0) return

    // Filter out example rows as extra safety measure
    const validRows = parsedData.filter(row => {
      const exampleField = row['Beispiel (NICHT ÄNDERN)'] || ''
      return !(exampleField.toLowerCase().includes('ja') ||
               exampleField.toLowerCase().includes('beispiel') ||
               exampleField.toLowerCase().includes('example') ||
               exampleField.toLowerCase().includes('yes'))
    })

    const newStudents = validRows.map(row => ({
      id: Date.now() + Math.random(),
      firstName: row['Vorname'],
      lastName: row['Nachname'],
      nickname: row['Rufname/Nickname'] || null,
      email: `${row['Vorname'].toLowerCase()}.${row['Nachname'].toLowerCase()}@student.de`,
      phone: row['Telefon (Schüler)'] || '',
      class: row['Klasse'],
      birthDate: row['Geburtsdatum'] || '',
      status: 'inactive',
      address: row['Adresse'] || '',
      einstieg: row['Einstieg'] || new Date().toISOString().split('T')[0],
      ausstieg: '',
      loginInfo: {
        hasAccount: false,
        registrationDate: null,
        lastLogin: null
      },
      photoPermissions: [],
      allergies: row['Allergien'] ? [{
        name: row['Allergien'],
        severity: 'Unbekannt',
        description: row['Allergien']
      }] : [],
      but: {
        enabled: ['Ja', 'ja', 'Yes'].includes(row['BuT berechtigt']),
        type: row['BuT Typ'] || '',
        validUntil: row['BuT Gültig bis'] || ''
      },
      parents: [
        ...(row['Eltern 1 - Name'] ? [{
          firstName: row['Eltern 1 - Name'].split(' ')[0] || '',
          lastName: row['Eltern 1 - Name'].split(' ').slice(1).join(' ') || '',
          relationship: 'Erziehungsberechtigte/r',
          email: row['Eltern 1 - E-Mail'] || '',
          phone: row['Eltern 1 - Telefon'] || '',
          address: row['Adresse'] || '',
          isPrimary: true,
          loginInfo: { hasAccount: false, registrationDate: null, lastLogin: null }
        }] : []),
        ...(row['Eltern 2 - Name'] ? [{
          firstName: row['Eltern 2 - Name'].split(' ')[0] || '',
          lastName: row['Eltern 2 - Name'].split(' ').slice(1).join(' ') || '',
          relationship: 'Erziehungsberechtigte/r',
          email: row['Eltern 2 - E-Mail'] || '',
          phone: row['Eltern 2 - Telefon'] || '',
          address: row['Adresse'] || '',
          isPrimary: false,
          loginInfo: { hasAccount: false, registrationDate: null, lastLogin: null }
        }] : [])
      ],
      siblings: [],
      pickupSchedule: {},
      authorizedPersons: [],
      activeCourses: [],
      waitingList: [],
      pastCourses: []
    }))

    setStudents(prev => [...prev, ...newStudents])

    // Reset upload modal
    setShowUploadModal(false)
    setUploadFile(null)
    setParsedData([])
    setUploadErrors([])
  }

  // Helper functions for visual indicators
  const hasValidPhotoPermission = (student) => {
    return student.photoPermissions?.some(permission =>
      new Date(permission.validUntil) > new Date()
    ) || false
  }

  const hasAllergies = (student) => {
    return student.allergies?.length > 0 || false
  }

  const getButStatus = (student) => {
    if (!student.but?.enabled) return null
    const isValid = new Date(student.but.validUntil) > new Date()
    return { isValid, type: student.but.type }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClass = selectedClass === 'all' || student.class === selectedClass

    const matchesButStatus = (() => {
      if (selectedButStatus === 'all') return true
      const butStatus = getButStatus(student)
      if (selectedButStatus === 'gueltig') return butStatus && butStatus.isValid
      if (selectedButStatus === 'abgelaufen') return butStatus && !butStatus.isValid
      return false
    })()

    const matchesPhotoStatus = (() => {
      if (selectedPhotoStatus === 'all') return true
      const hasValidPhoto = hasValidPhotoPermission(student)
      if (selectedPhotoStatus === 'gueltig') return hasValidPhoto
      if (selectedPhotoStatus === 'keine') return !hasValidPhoto
      return false
    })()

    const matchesActiveStatus = (() => {
      if (selectedActiveStatus === 'all') return true
      if (selectedActiveStatus === 'active') return student.status === 'active'
      if (selectedActiveStatus === 'inactive') return student.status === 'inactive'
      return false
    })()

    return matchesSearch && matchesClass && matchesButStatus && matchesPhotoStatus && matchesActiveStatus
  })

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    setShowDetailView(true)
    setIsEditing(false)
  }

  const handleEditStudent = (student, event) => {
    event.stopPropagation() // Prevent row click
    setSelectedStudent(student)
    setIsEditing(true)
    setShowDetailView(false)
  }

  const handleDeleteStudent = (studentId, event) => {
    event.stopPropagation() // Prevent row click
    if (confirm('Sind Sie sicher, dass Sie diesen Schüler löschen möchten?')) {
      // TODO: Implement delete functionality
      console.log('Delete student:', studentId)
    }
  }

  const handleBackToList = () => {
    setSelectedStudent(null)
    setShowDetailView(false)
    setIsEditing(false)
  }

  const handleSaveStudent = (updatedStudent) => {
    // Update the students array with the edited student data
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === updatedStudent.id ? updatedStudent : student
      )
    )

    // Update the selected student state to reflect changes
    setSelectedStudent(updatedStudent)

    // TODO: Also save to Supabase here
    console.log('Student data saved:', updatedStudent)

    // Return to detail view after saving
    setIsEditing(false)
    setShowDetailView(true)
  }

  const handleAddNewStudent = () => {
    setShowAddModal(true)
    setAddMode('single')
  }

  const handleAddMultipleStudents = () => {
    setShowAddModal(true)
    setAddMode('multiple')
  }

  const handleSaveNewStudent = () => {
    if (addMode === 'single') {
      // Create full student object with defaults
      const newStudent = {
        id: Date.now(),
        firstName: newStudentData.firstName,
        lastName: newStudentData.lastName,
        nickname: null,
        email: `${newStudentData.firstName.toLowerCase()}.${newStudentData.lastName.toLowerCase()}@student.de`,
        phone: newStudentData.phone || '',
        class: newStudentData.class,
        birthDate: '', // Will be filled in edit view
        status: 'inactive', // Default for new students is inactive (no FlexWise login yet)
        address: '',
        einstieg: newStudentData.einstieg,
        ausstieg: '',
        loginInfo: {
          hasAccount: false,
          registrationDate: null,
          lastLogin: null
        },
        photoPermissions: [],
        allergies: [],
        but: { enabled: false },
        parents: [],
        siblings: [],
        pickupSchedule: {},
        authorizedPersons: [],
        activeCourses: [],
        waitingList: [],
        pastCourses: []
      }

      setStudents(prev => [...prev, newStudent])
    } else {
      // Add multiple students
      const newStudentsList = multipleStudents
        .filter(student => student.firstName && student.lastName && student.class)
        .map(student => ({
          id: Date.now() + Math.random(),
          firstName: student.firstName,
          lastName: student.lastName,
          nickname: null,
          email: `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@student.de`,
          phone: student.phone || '',
          class: student.class,
          birthDate: '',
          status: 'inactive', // Default for new students is inactive (no FlexWise login yet)
          address: '',
          einstieg: student.einstieg,
          ausstieg: '',
          loginInfo: {
            hasAccount: false,
            registrationDate: null,
            lastLogin: null
          },
          photoPermissions: [],
          allergies: [],
          but: { enabled: false },
          parents: [],
          siblings: [],
          pickupSchedule: {},
          authorizedPersons: [],
          activeCourses: [],
          waitingList: [],
          pastCourses: []
        }))

      setStudents(prev => [...prev, ...newStudentsList])
    }

    // Reset form and close modal
    setNewStudentData({
      firstName: '',
      lastName: '',
      class: '',
      einstieg: new Date().toISOString().split('T')[0],
      phone: ''
    })
    setMultipleStudents([{
      id: Date.now(),
      firstName: '',
      lastName: '',
      class: '',
      einstieg: new Date().toISOString().split('T')[0],
      phone: ''
    }])
    setShowAddModal(false)
  }

  const addStudentRow = () => {
    setMultipleStudents(prev => [...prev, {
      id: Date.now() + Math.random(),
      firstName: '',
      lastName: '',
      class: '',
      einstieg: new Date().toISOString().split('T')[0],
      phone: ''
    }])
  }

  const removeStudentRow = (id) => {
    setMultipleStudents(prev => prev.filter(student => student.id !== id))
  }

  const updateMultipleStudentField = (id, field, value) => {
    setMultipleStudents(prev => prev.map(student =>
      student.id === id ? { ...student, [field]: value } : student
    ))
  }

  // Show detailed view when student is selected for viewing
  if (selectedStudent && showDetailView && !isEditing) {
    return (
      <StudentDetailView
        student={selectedStudent}
        onBack={handleBackToList}
        onEdit={(student) => {
          setIsEditing(true)
          setShowDetailView(false)
        }}
      />
    )
  }

  // Show comprehensive edit view when editing
  if (selectedStudent && isEditing) {
    return (
      <StudentEditView
        student={selectedStudent}
        onBack={handleBackToList}
        onSave={handleSaveStudent}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Schüler*innen verwalten</h2>
        <div className="ml-auto flex gap-2">
          <Button onClick={handleAddNewStudent} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Neuer Schüler
          </Button>
          <Button onClick={handleAddMultipleStudents} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Users className="w-4 h-4 mr-2" />
            Mehrere Schüler
          </Button>
          <Button onClick={() => setShowUploadModal(true)} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            <Upload className="w-4 h-4 mr-2" />
            Excel Import
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Schüler suchen (Name, Klasse, E-Mail)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {filteredStudents.length} Schüler gefunden
            </Badge>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Class Filter */}
            <div>
              <label className="text-sm font-medium text-blue-900 block mb-2">Klasse</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">Alle Klassen ({students.length})</option>
                {availableClasses.map((className) => {
                  const classCount = students.filter(s => s.class === className).length
                  return (
                    <option key={className} value={className}>
                      {className} ({classCount})
                    </option>
                  )
                })}
              </select>
            </div>

            {/* BuT Status Filter */}
            <div>
              <label className="text-sm font-medium text-blue-900 block mb-2">BuT Status</label>
              <select
                value={selectedButStatus}
                onChange={(e) => setSelectedButStatus(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">Alle</option>
                <option value="gueltig">BuT gültig</option>
                <option value="abgelaufen">BuT abgelaufen</option>
              </select>
            </div>

            {/* Photo Permission Filter */}
            <div>
              <label className="text-sm font-medium text-blue-900 block mb-2">Fotoerlaubnis</label>
              <select
                value={selectedPhotoStatus}
                onChange={(e) => setSelectedPhotoStatus(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">Alle</option>
                <option value="gueltig">Gültige Fotoerlaubnis</option>
                <option value="keine">Keine Fotoerlaubnis</option>
              </select>
            </div>

            {/* Active Status Filter */}
            <div>
              <label className="text-sm font-medium text-blue-900 block mb-2">Status</label>
              <select
                value={selectedActiveStatus}
                onChange={(e) => setSelectedActiveStatus(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">Alle</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Aktive Filter:</span>
            {selectedClass !== 'all' && (
              <Badge variant="outline" className="text-xs">
                Klasse: {selectedClass}
                <button
                  onClick={() => setSelectedClass('all')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedButStatus !== 'all' && (
              <Badge variant="outline" className="text-xs">
                BuT: {selectedButStatus === 'gueltig' ? 'Gültig' : 'Abgelaufen'}
                <button
                  onClick={() => setSelectedButStatus('all')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedPhotoStatus !== 'all' && (
              <Badge variant="outline" className="text-xs">
                Foto: {selectedPhotoStatus === 'gueltig' ? 'Gültig' : 'Keine'}
                <button
                  onClick={() => setSelectedPhotoStatus('all')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedActiveStatus !== 'all' && (
              <Badge variant="outline" className="text-xs">
                Status: {selectedActiveStatus === 'active' ? 'Aktiv' : 'Inaktiv'}
                <button
                  onClick={() => setSelectedActiveStatus('all')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {(selectedClass !== 'all' || selectedButStatus !== 'all' || selectedPhotoStatus !== 'all' || selectedActiveStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedClass('all')
                  setSelectedButStatus('all')
                  setSelectedPhotoStatus('all')
                  setSelectedActiveStatus('all')
                }}
                className="text-xs h-6 px-2"
              >
                Alle Filter zurücksetzen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-blue-50 border-b border-blue-200">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Schülerliste
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleViewStudent(student)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {student.firstName} {student.lastName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Klasse {student.class}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {student.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {student.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(student.birthDate).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Visual Indicators */}
                    {hasValidPhotoPermission(student) && (
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center" title="Gültige Fotoerlaubnis">
                        <Camera className="w-3 h-3 text-green-600" />
                      </div>
                    )}
                    {hasAllergies(student) && (
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center" title="Allergien vorhanden">
                        <Heart className="w-3 h-3 text-red-600" />
                      </div>
                    )}
                    {getButStatus(student) && (
                      <Badge
                        className={getButStatus(student).isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        title={`BuT ${getButStatus(student).type} - ${getButStatus(student).isValid ? 'Gültig' : 'Abgelaufen'}`}
                      >
                        BuT
                      </Badge>
                    )}
                    <Badge
                      variant={student.status === 'active' ? 'default' : 'secondary'}
                      className={student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {student.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEditStudent(student, e)}
                      className="p-2 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteStudent(student.id, e)}
                      className="p-2 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Keine Schüler gefunden</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Keine Schüler entsprechen Ihrer Suche.' : 'Noch keine Schüler angelegt.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add New Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {addMode === 'single' ? 'Neuen Schüler hinzufügen' : 'Mehrere Schüler hinzufügen'}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="p-2"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6">
              {addMode === 'single' ? (
                // Single Student Form
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vorname *
                      </label>
                      <Input
                        value={newStudentData.firstName}
                        onChange={(e) => setNewStudentData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Vorname eingeben"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nachname *
                      </label>
                      <Input
                        value={newStudentData.lastName}
                        onChange={(e) => setNewStudentData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Nachname eingeben"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Klasse *
                      </label>
                      <select
                        value={newStudentData.class}
                        onChange={(e) => setNewStudentData(prev => ({ ...prev, class: e.target.value }))}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        required
                      >
                        <option value="">Klasse auswählen</option>
                        {availableClasses.map(className => (
                          <option key={className} value={className}>{className}</option>
                        ))}
                        <option value="9A">9A</option>
                        <option value="9B">9B</option>
                        <option value="10A">10A</option>
                        <option value="10B">10B</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Einstieg
                      </label>
                      <Input
                        type="date"
                        value={newStudentData.einstieg}
                        onChange={(e) => setNewStudentData(prev => ({ ...prev, einstieg: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon (Eltern)
                      </label>
                      <Input
                        value={newStudentData.phone}
                        onChange={(e) => setNewStudentData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+49 123 456789"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Multiple Students Form
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Fügen Sie mehrere Schüler gleichzeitig hinzu. Nur die markierten Felder (*) sind erforderlich.
                    </p>
                    <Button
                      onClick={addStudentRow}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Zeile hinzufügen
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                      <div>Vorname *</div>
                      <div>Nachname *</div>
                      <div>Klasse *</div>
                      <div>Einstieg</div>
                      <div>Telefon (Eltern)</div>
                      <div>Aktionen</div>
                    </div>
                    {multipleStudents.map((student, index) => (
                      <div key={student.id} className="grid grid-cols-6 gap-2 p-3 border-b border-gray-100 last:border-b-0">
                        <Input
                          value={student.firstName}
                          onChange={(e) => updateMultipleStudentField(student.id, 'firstName', e.target.value)}
                          placeholder="Vorname"
                          size="sm"
                        />
                        <Input
                          value={student.lastName}
                          onChange={(e) => updateMultipleStudentField(student.id, 'lastName', e.target.value)}
                          placeholder="Nachname"
                          size="sm"
                        />
                        <select
                          value={student.class}
                          onChange={(e) => updateMultipleStudentField(student.id, 'class', e.target.value)}
                          className="px-2 py-1 border border-input bg-background rounded text-sm"
                        >
                          <option value="">Klasse</option>
                          {availableClasses.map(className => (
                            <option key={className} value={className}>{className}</option>
                          ))}
                          <option value="9A">9A</option>
                          <option value="9B">9B</option>
                          <option value="10A">10A</option>
                          <option value="10B">10B</option>
                        </select>
                        <Input
                          type="date"
                          value={student.einstieg}
                          onChange={(e) => updateMultipleStudentField(student.id, 'einstieg', e.target.value)}
                          size="sm"
                        />
                        <Input
                          value={student.phone}
                          onChange={(e) => updateMultipleStudentField(student.id, 'phone', e.target.value)}
                          placeholder="Telefon"
                          size="sm"
                        />
                        <Button
                          onClick={() => removeStudentRow(student.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1 text-red-600 hover:bg-red-50"
                          disabled={multipleStudents.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveNewStudent}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={
                  addMode === 'single'
                    ? !newStudentData.firstName || !newStudentData.lastName || !newStudentData.class
                    : multipleStudents.every(s => !s.firstName || !s.lastName || !s.class)
                }
              >
                {addMode === 'single' ? 'Schüler hinzufügen' : `${multipleStudents.filter(s => s.firstName && s.lastName && s.class).length} Schüler hinzufügen`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-green-600" />
                  Excel Import - Schüler hochladen
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowUploadModal(false)
                    setUploadFile(null)
                    setParsedData([])
                    setUploadErrors([])
                  }}
                  className="p-2"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Download Template */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Schritt 1: Vorlage herunterladen
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Laden Sie die Vorlage herunter und füllen Sie sie mit den Schülerdaten aus.
                  Erforderliche Felder: Vorname, Nachname, Klasse.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadTemplate('excel')}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Excel-Vorlage (.xlsx)
                  </Button>
                  <Button
                    onClick={() => downloadTemplate('csv')}
                    variant="outline"
                    className="border-gray-600 text-gray-600 hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV-Vorlage (.csv)
                  </Button>
                </div>
              </div>

              {/* Step 2: Upload File */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-green-600" />
                  Schritt 2: Ausgefüllte Datei hochladen
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="fileInput"
                  />
                  <label
                    htmlFor="fileInput"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Excel- oder CSV-Datei auswählen oder hierhin ziehen
                    </span>
                    <span className="text-xs text-gray-500">
                      Unterstützte Formate: .xlsx, .xls, .csv
                    </span>
                  </label>
                </div>

                {uploadFile && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <strong>Ausgewählte Datei:</strong> {uploadFile.name}
                  </div>
                )}
              </div>

              {/* Processing Indicator */}
              {isProcessingFile && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Datei wird verarbeitet...</span>
                </div>
              )}

              {/* Errors */}
              {uploadErrors.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Fehler gefunden ({uploadErrors.length})
                  </h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {uploadErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success and Preview */}
              {parsedData.length > 0 && uploadErrors.length === 0 && (
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  {(() => {
                    const validStudents = parsedData.filter(row => {
                      const exampleField = row['Beispiel (NICHT ÄNDERN)'] || ''
                      return !(exampleField.toLowerCase().includes('ja') ||
                               exampleField.toLowerCase().includes('beispiel') ||
                               exampleField.toLowerCase().includes('example') ||
                               exampleField.toLowerCase().includes('yes'))
                    }).length

                    return (
                      <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Daten erfolgreich verarbeitet ({validStudents} Schüler werden importiert)
                        {parsedData.length > validStudents && (
                          <span className="text-xs text-gray-600 ml-2">
                            ({parsedData.length - validStudents} Beispielzeile übersprungen)
                          </span>
                        )}
                      </h3>
                    )
                  })()}

                  {/* Preview Table */}
                  <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left border-r border-gray-200">Status</th>
                            <th className="px-3 py-2 text-left border-r border-gray-200">Vorname</th>
                            <th className="px-3 py-2 text-left border-r border-gray-200">Nachname</th>
                            <th className="px-3 py-2 text-left border-r border-gray-200">Klasse</th>
                            <th className="px-3 py-2 text-left border-r border-gray-200">Nickname</th>
                            <th className="px-3 py-2 text-left border-r border-gray-200">BuT</th>
                            <th className="px-3 py-2 text-left">Eltern 1</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {parsedData.map((student, index) => {
                            const exampleField = student['Beispiel (NICHT ÄNDERN)'] || ''
                            const isExample = exampleField.toLowerCase().includes('ja') ||
                                            exampleField.toLowerCase().includes('beispiel') ||
                                            exampleField.toLowerCase().includes('example') ||
                                            exampleField.toLowerCase().includes('yes')

                            return (
                              <tr key={index} className={isExample ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}>
                                <td className="px-3 py-2 border-r border-gray-200">
                                  {isExample ? (
                                    <Badge className="bg-red-100 text-red-700 text-xs">
                                      Beispiel - wird übersprungen
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-700 text-xs">
                                      Wird importiert
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 border-r border-gray-200">{student['Vorname']}</td>
                                <td className="px-3 py-2 border-r border-gray-200">{student['Nachname']}</td>
                                <td className="px-3 py-2 border-r border-gray-200">{student['Klasse']}</td>
                                <td className="px-3 py-2 border-r border-gray-200">{student['Rufname/Nickname'] || '-'}</td>
                                <td className="px-3 py-2 border-r border-gray-200">
                                  {student['BuT berechtigt'] === 'Ja' ? `${student['BuT Typ'] || 'Ja'}` : 'Nein'}
                                </td>
                                <td className="px-3 py-2">{student['Eltern 1 - Name'] || '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFile(null)
                  setParsedData([])
                  setUploadErrors([])
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleImportStudents}
                className="bg-green-600 hover:bg-green-700"
                disabled={parsedData.length === 0 || uploadErrors.length > 0}
              >
                {(() => {
                  if (parsedData.length === 0) return 'Importieren'

                  const validStudents = parsedData.filter(row => {
                    const exampleField = row['Beispiel (NICHT ÄNDERN)'] || ''
                    return !(exampleField.toLowerCase().includes('ja') ||
                             exampleField.toLowerCase().includes('beispiel') ||
                             exampleField.toLowerCase().includes('example') ||
                             exampleField.toLowerCase().includes('yes'))
                  }).length

                  return `${validStudents} Schüler importieren`
                })()}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
