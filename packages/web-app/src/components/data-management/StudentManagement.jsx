import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
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
  GraduationCap
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
      status: 'active',
      address: 'Musterstraße 123, 12345 Berlin',
      einstieg: '2023-08-01', // Started school
      ausstieg: '', // No exit date - still active
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
          isPrimary: true
        },
        {
          firstName: 'Peter',
          lastName: 'Mustermann',
          relationship: 'Vater',
          email: 'peter.mustermann@email.de',
          phone: '+49 123 456788',
          address: 'Musterstraße 123, 12345 Berlin',
          isPrimary: false
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
      status: 'active',
      address: 'Hauptstraße 456, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
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
      status: 'inactive',
      address: 'Schulstraße 789, 12345 Berlin',
      einstieg: '2022-08-01',
      ausstieg: '2024-07-31', // Student left school
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
      status: 'active',
      address: 'Lindenstraße 321, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
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
      status: 'active',
      address: 'Rosenweg 654, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
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
      status: 'active',
      address: 'Blumenstraße 987, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
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
      status: 'active',
      address: 'Parkstraße 147, 12345 Berlin',
      einstieg: '2023-08-01',
      ausstieg: '',
      photoPermissions: [],
      allergies: [],
      but: {
        enabled: false
      }
    }
  ])

  // Get unique classes for filter
  const availableClasses = [...new Set(students.map(student => student.class))].sort()

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
        status: 'active',
        address: '',
        einstieg: newStudentData.einstieg,
        ausstieg: '',
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
          status: 'active',
          address: '',
          einstieg: student.einstieg,
          ausstieg: '',
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
        <Button className="ml-auto bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Schüler
        </Button>
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
    </div>
  )
}
