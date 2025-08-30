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
  Book,
  User,
  Clock
} from 'lucide-react'

export default function SubjectManagement({ onBack }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // Mock subject data - replace with real data from Supabase
  const [subjects] = useState([
    {
      id: 1,
      name: 'Deutsch',
      code: 'DE',
      description: 'Deutsche Sprache und Literatur',
      hoursPerWeek: 4,
      teacher: 'Dr. Maria Schneider',
      status: 'active'
    },
    {
      id: 2,
      name: 'Mathematik',
      code: 'MA',
      description: 'Algebra, Geometrie und Analysis',
      hoursPerWeek: 5,
      teacher: 'Thomas Müller',
      status: 'active'
    },
    {
      id: 3,
      name: 'Geschichte',
      code: 'GE',
      description: 'Deutsche und Weltgeschichte',
      hoursPerWeek: 2,
      teacher: 'Dr. Maria Schneider',
      status: 'active'
    },
    {
      id: 4,
      name: 'Physik',
      code: 'PH',
      description: 'Experimentelle und theoretische Physik',
      hoursPerWeek: 3,
      teacher: 'Thomas Müller',
      status: 'active'
    },
    {
      id: 5,
      name: 'Kunst',
      code: 'KU',
      description: 'Bildende Kunst und Gestaltung',
      hoursPerWeek: 2,
      teacher: '',
      status: 'inactive'
    }
  ])

  const filteredSubjects = subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject)
    setIsEditing(true)
  }

  const handleDeleteSubject = (subjectId) => {
    if (confirm('Sind Sie sicher, dass Sie dieses Fach löschen möchten?')) {
      // TODO: Implement delete functionality
      console.log('Delete subject:', subjectId)
    }
  }

  if (selectedSubject && isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsEditing(false)
              setSelectedSubject(null)
            }}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Fach bearbeiten</h2>
        </div>

        {/* Edit Form */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-600" />
              Fachinformationen bearbeiten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-900">Fachname</label>
                <Input 
                  value={selectedSubject.name}
                  onChange={(e) => setSelectedSubject({...selectedSubject, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Fachkürzel</label>
                <Input 
                  value={selectedSubject.code}
                  onChange={(e) => setSelectedSubject({...selectedSubject, code: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Wochenstunden</label>
                <Input 
                  type="number"
                  value={selectedSubject.hoursPerWeek}
                  onChange={(e) => setSelectedSubject({...selectedSubject, hoursPerWeek: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Fachlehrer</label>
                <Input 
                  value={selectedSubject.teacher}
                  onChange={(e) => setSelectedSubject({...selectedSubject, teacher: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-900">Beschreibung</label>
              <Input 
                value={selectedSubject.description}
                onChange={(e) => setSelectedSubject({...selectedSubject, description: e.target.value})}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => {
                // TODO: Implement save functionality
                console.log('Save subject:', selectedSubject)
                setIsEditing(false)
                setSelectedSubject(null)
              }} className="bg-blue-600 hover:bg-blue-700">
                Speichern
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false)
                  setSelectedSubject(null)
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
        <h2 className="text-2xl font-bold text-foreground">Fächer verwalten</h2>
        <Button className="ml-auto bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neues Fach
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Fächer suchen (Name, Kürzel, Lehrer)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {filteredSubjects.length} Fächer gefunden
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subjects List */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-blue-50 border-b border-blue-200">
          <CardTitle className="flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-600" />
            Fächerliste
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredSubjects.map((subject) => (
              <div key={subject.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Book className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {subject.name} ({subject.code})
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {subject.teacher && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {subject.teacher}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {subject.hoursPerWeek}h/Woche
                        </span>
                        <span>{subject.description}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={subject.status === 'active' ? 'default' : 'secondary'}
                      className={subject.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {subject.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSubject(subject)}
                      className="p-2 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubject(subject.id)}
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

      {filteredSubjects.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Keine Fächer gefunden</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Keine Fächer entsprechen Ihrer Suche.' : 'Noch keine Fächer angelegt.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
