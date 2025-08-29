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
  GraduationCap,
  UserCheck
} from 'lucide-react'

export default function StaffManagement({ onBack }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // Mock staff data - replace with real data from Supabase
  const [staff] = useState([
    {
      id: 1,
      firstName: 'Dr. Maria',
      lastName: 'Schneider',
      email: 'maria.schneider@schule.de',
      phone: '+49 123 456789',
      role: 'Lehrer',
      subjects: ['Deutsch', 'Geschichte'],
      status: 'active',
      employeeId: 'L001'
    },
    {
      id: 2,
      firstName: 'Thomas',
      lastName: 'Müller',
      email: 'thomas.mueller@schule.de',
      phone: '+49 987 654321',
      role: 'Lehrer',
      subjects: ['Mathematik', 'Physik'],
      status: 'active',
      employeeId: 'L002'
    },
    {
      id: 3,
      firstName: 'Sandra',
      lastName: 'Klein',
      email: 'sandra.klein@schule.de',
      phone: '+49 555 123456',
      role: 'Erzieher*in',
      subjects: [],
      status: 'active',
      employeeId: 'E001'
    },
    {
      id: 4,
      firstName: 'Michael',
      lastName: 'Berg',
      email: 'michael.berg@schule.de',
      phone: '+49 444 987654',
      role: 'Verwaltung',
      subjects: [],
      status: 'inactive',
      employeeId: 'V001'
    }
  ])

  const filteredStaff = staff.filter(person => 
    `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleEditStaff = (person) => {
    setSelectedStaff(person)
    setIsEditing(true)
  }

  const handleDeleteStaff = (staffId) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten?')) {
      // TODO: Implement delete functionality
      console.log('Delete staff:', staffId)
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Lehrer':
        return <GraduationCap className="w-5 h-5 text-blue-600" />
      case 'Erzieher*in':
        return <UserCheck className="w-5 h-5 text-green-600" />
      default:
        return <User className="w-5 h-5 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Lehrer':
        return 'bg-blue-100 text-blue-700'
      case 'Erzieher*in':
        return 'bg-green-100 text-green-700'
      case 'Verwaltung':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (selectedStaff && isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsEditing(false)
              setSelectedStaff(null)
            }}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Mitarbeiter bearbeiten</h2>
        </div>

        {/* Edit Form */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Mitarbeiterinformationen bearbeiten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-900">Vorname</label>
                <Input 
                  value={selectedStaff.firstName}
                  onChange={(e) => setSelectedStaff({...selectedStaff, firstName: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Nachname</label>
                <Input 
                  value={selectedStaff.lastName}
                  onChange={(e) => setSelectedStaff({...selectedStaff, lastName: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">E-Mail</label>
                <Input 
                  type="email"
                  value={selectedStaff.email}
                  onChange={(e) => setSelectedStaff({...selectedStaff, email: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Telefon</label>
                <Input 
                  value={selectedStaff.phone}
                  onChange={(e) => setSelectedStaff({...selectedStaff, phone: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Personal-ID</label>
                <Input 
                  value={selectedStaff.employeeId}
                  onChange={(e) => setSelectedStaff({...selectedStaff, employeeId: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Rolle</label>
                <Input 
                  value={selectedStaff.role}
                  onChange={(e) => setSelectedStaff({...selectedStaff, role: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-900">Unterrichtsfächer (kommagetrennt)</label>
              <Input 
                value={selectedStaff.subjects.join(', ')}
                onChange={(e) => setSelectedStaff({...selectedStaff, subjects: e.target.value.split(', ').filter(s => s.trim())})}
                className="mt-1"
                placeholder="z.B. Deutsch, Mathematik, Geschichte"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => {
                // TODO: Implement save functionality
                console.log('Save staff:', selectedStaff)
                setIsEditing(false)
                setSelectedStaff(null)
              }} className="bg-blue-600 hover:bg-blue-700">
                Speichern
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false)
                  setSelectedStaff(null)
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
        <h2 className="text-2xl font-bold text-foreground">Mitarbeiter*innen verwalten</h2>
        <Button className="ml-auto bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Mitarbeiter
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Mitarbeiter suchen (Name, Rolle, E-Mail, Fächer)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {filteredStaff.length} Mitarbeiter gefunden
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-blue-50 border-b border-blue-200">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Mitarbeiterliste
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredStaff.map((person) => (
              <div key={person.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {getRoleIcon(person.role)}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {person.firstName} {person.lastName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {person.employeeId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {person.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {person.phone}
                        </span>
                        {person.subjects.length > 0 && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {person.subjects.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(person.role)}>
                      {person.role}
                    </Badge>
                    <Badge 
                      variant={person.status === 'active' ? 'default' : 'secondary'}
                      className={person.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {person.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStaff(person)}
                      className="p-2 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStaff(person.id)}
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

      {filteredStaff.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Keine Mitarbeiter gefunden</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Keine Mitarbeiter entsprechen Ihrer Suche.' : 'Noch keine Mitarbeiter angelegt.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
