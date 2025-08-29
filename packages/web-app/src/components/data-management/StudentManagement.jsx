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
  Calendar
} from 'lucide-react'

export default function StudentManagement({ onBack }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // Mock student data - replace with real data from Supabase
  const [students] = useState([
    {
      id: 1,
      firstName: 'Max',
      lastName: 'Mustermann',
      email: 'max.mustermann@student.de',
      phone: '+49 123 456789',
      class: '10A',
      birthDate: '2008-05-15',
      status: 'active',
      address: 'Musterstraße 123, 12345 Berlin'
    },
    {
      id: 2,
      firstName: 'Anna',
      lastName: 'Schmidt',
      email: 'anna.schmidt@student.de',
      phone: '+49 987 654321',
      class: '10A',
      birthDate: '2008-08-22',
      status: 'active',
      address: 'Hauptstraße 456, 12345 Berlin'
    },
    {
      id: 3,
      firstName: 'Tom',
      lastName: 'Weber',
      email: 'tom.weber@student.de',
      phone: '+49 555 123456',
      class: '9B',
      birthDate: '2009-02-10',
      status: 'inactive',
      address: 'Schulstraße 789, 12345 Berlin'
    },
    {
      id: 4,
      firstName: 'Lisa',
      lastName: 'Hoffmann',
      email: 'lisa.hoffmann@student.de',
      phone: '+49 444 987654',
      class: '10B',
      birthDate: '2008-11-03',
      status: 'active',
      address: 'Lindenstraße 321, 12345 Berlin'
    },
    {
      id: 5,
      firstName: 'Marco',
      lastName: 'Fischer',
      email: 'marco.fischer@student.de',
      phone: '+49 333 111222',
      class: '9A',
      birthDate: '2009-04-18',
      status: 'active',
      address: 'Rosenweg 654, 12345 Berlin'
    },
    {
      id: 6,
      firstName: 'Julia',
      lastName: 'Wagner',
      email: 'julia.wagner@student.de',
      phone: '+49 222 333444',
      class: '10B',
      birthDate: '2008-07-25',
      status: 'active',
      address: 'Blumenstraße 987, 12345 Berlin'
    },
    {
      id: 7,
      firstName: 'Kevin',
      lastName: 'Bauer',
      email: 'kevin.bauer@student.de',
      phone: '+49 111 222333',
      class: '9A',
      birthDate: '2009-01-14',
      status: 'active',
      address: 'Parkstraße 147, 12345 Berlin'
    }
  ])

  // Get unique classes for filter
  const availableClasses = [...new Set(students.map(student => student.class))].sort()

  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClass = selectedClass === 'all' || student.class === selectedClass

    return matchesSearch && matchesClass
  })

  const handleEditStudent = (student) => {
    setSelectedStudent(student)
    setIsEditing(true)
  }

  const handleDeleteStudent = (studentId) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Schüler löschen möchten?')) {
      // TODO: Implement delete functionality
      console.log('Delete student:', studentId)
    }
  }

  const handleSaveStudent = () => {
    // TODO: Implement save functionality
    console.log('Save student:', selectedStudent)
    setIsEditing(false)
    setSelectedStudent(null)
  }

  if (selectedStudent && isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsEditing(false)
              setSelectedStudent(null)
            }}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Schüler bearbeiten</h2>
        </div>

        {/* Edit Form */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Schülerinformationen bearbeiten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-900">Vorname</label>
                <Input 
                  value={selectedStudent.firstName}
                  onChange={(e) => setSelectedStudent({...selectedStudent, firstName: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Nachname</label>
                <Input 
                  value={selectedStudent.lastName}
                  onChange={(e) => setSelectedStudent({...selectedStudent, lastName: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">E-Mail</label>
                <Input 
                  type="email"
                  value={selectedStudent.email}
                  onChange={(e) => setSelectedStudent({...selectedStudent, email: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Telefon</label>
                <Input 
                  value={selectedStudent.phone}
                  onChange={(e) => setSelectedStudent({...selectedStudent, phone: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Klasse</label>
                <Input 
                  value={selectedStudent.class}
                  onChange={(e) => setSelectedStudent({...selectedStudent, class: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Geburtsdatum</label>
                <Input 
                  type="date"
                  value={selectedStudent.birthDate}
                  onChange={(e) => setSelectedStudent({...selectedStudent, birthDate: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-900">Adresse</label>
              <Input 
                value={selectedStudent.address}
                onChange={(e) => setSelectedStudent({...selectedStudent, address: e.target.value})}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveStudent} className="bg-blue-600 hover:bg-blue-700">
                Speichern
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false)
                  setSelectedStudent(null)
                }}
              >
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">Filter nach Klasse:</span>
            <Button
              variant={selectedClass === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedClass('all')}
              className={selectedClass === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}
            >
              Alle ({students.length})
            </Button>
            {availableClasses.map((className) => {
              const classCount = students.filter(s => s.class === className).length
              return (
                <Button
                  key={className}
                  variant={selectedClass === className ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedClass(className)}
                  className={selectedClass === className ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}
                >
                  {className} ({classCount})
                </Button>
              )
            })}
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
              <div key={student.id} className="p-4 hover:bg-muted/50 transition-colors">
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
                    <Badge 
                      variant={student.status === 'active' ? 'default' : 'secondary'}
                      className={student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {student.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStudent(student)}
                      className="p-2 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStudent(student.id)}
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
