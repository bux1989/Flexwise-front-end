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
  DoorClosed,
  Users,
  Key,
  Building,
  UsersRound,
  User
} from 'lucide-react'

const dataConfigs = {
  rooms: {
    title: 'Räume verwalten',
    singular: 'Raum',
    plural: 'Räume',
    icon: DoorClosed,
    fields: [
      { key: 'name', label: 'Raumname', type: 'text' },
      { key: 'number', label: 'Raumnummer', type: 'text' },
      { key: 'capacity', label: 'Kapazität', type: 'number' },
      { key: 'type', label: 'Raumtyp', type: 'text' },
      { key: 'equipment', label: 'Ausstattung', type: 'text' }
    ],
    mockData: [
      { id: 1, name: 'Klassenzimmer A101', number: 'A101', capacity: 30, type: 'Klassenzimmer', equipment: 'Beamer, Whiteboard', status: 'active' },
      { id: 2, name: 'Physiklabor', number: 'P01', capacity: 24, type: 'Labor', equipment: 'Laborausstattung, Abzug', status: 'active' },
      { id: 3, name: 'Aula', number: 'AU', capacity: 200, type: 'Veranstaltungsraum', equipment: 'Bühne, Mikrofon', status: 'active' }
    ]
  },
  classes: {
    title: 'Klassen verwalten',
    singular: 'Klasse',
    plural: 'Klassen',
    icon: Users,
    fields: [
      { key: 'name', label: 'Klassenname', type: 'text' },
      { key: 'grade', label: 'Jahrgangsstufe', type: 'number' },
      { key: 'teacher', label: 'Klassenlehrer', type: 'text' },
      { key: 'students', label: 'Anzahl Schüler', type: 'number' },
      { key: 'room', label: 'Klassenraum', type: 'text' }
    ],
    mockData: [
      { id: 1, name: '10A', grade: 10, teacher: 'Dr. Maria Schneider', students: 28, room: 'A101', status: 'active' },
      { id: 2, name: '10B', grade: 10, teacher: 'Thomas Müller', students: 26, room: 'A102', status: 'active' },
      { id: 3, name: '9A', grade: 9, teacher: 'Sandra Klein', students: 25, room: 'A201', status: 'active' }
    ]
  },
  'access-codes': {
    title: 'Zugangscodes verwalten',
    singular: 'Zugangscode',
    plural: 'Zugangscodes',
    icon: Key,
    fields: [
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'purpose', label: 'Zweck', type: 'text' },
      { key: 'validUntil', label: 'Gültig bis', type: 'date' },
      { key: 'usageCount', label: 'Verwendungen', type: 'number' },
      { key: 'maxUsage', label: 'Max. Verwendungen', type: 'number' }
    ],
    mockData: [
      { id: 1, code: 'ELTERN2024', purpose: 'Elternportal', validUntil: '2024-12-31', usageCount: 45, maxUsage: 100, status: 'active' },
      { id: 2, code: 'TEACHER2024', purpose: 'Lehrerzugang', validUntil: '2024-12-31', usageCount: 12, maxUsage: 50, status: 'active' },
      { id: 3, code: 'GUEST2024', purpose: 'Gastzugang', validUntil: '2024-06-30', usageCount: 5, maxUsage: 10, status: 'expired' }
    ]
  },
  partners: {
    title: 'Kooperationspartner verwalten',
    singular: 'Partner',
    plural: 'Partner',
    icon: Building,
    fields: [
      { key: 'name', label: 'Name der Organisation', type: 'text' },
      { key: 'contact', label: 'Ansprechpartner', type: 'text' },
      { key: 'email', label: 'E-Mail', type: 'email' },
      { key: 'phone', label: 'Telefon', type: 'tel' },
      { key: 'website', label: 'Website', type: 'url' }
    ],
    mockData: [
      { id: 1, name: 'Stadtbibliothek Berlin', contact: 'Frau Müller', email: 'mueller@stadtbib.de', phone: '+49 30 123456', website: 'www.stadtbib.de', status: 'active' },
      { id: 2, name: 'Technik Museum', contact: 'Herr Schmidt', email: 'schmidt@techmuseum.de', phone: '+49 30 654321', website: 'www.techmuseum.de', status: 'active' },
      { id: 3, name: 'Lokaler Sportverein', contact: 'Frau Weber', email: 'weber@sportverein.de', phone: '+49 30 789456', website: '', status: 'inactive' }
    ]
  },
  groups: {
    title: 'Gruppen verwalten',
    singular: 'Gruppe',
    plural: 'Gruppen',
    icon: UsersRound,
    fields: [
      { key: 'name', label: 'Gruppenname', type: 'text' },
      { key: 'type', label: 'Gruppentyp', type: 'text' },
      { key: 'leader', label: 'Gruppenleiter', type: 'text' },
      { key: 'members', label: 'Anzahl Mitglieder', type: 'number' },
      { key: 'schedule', label: 'Termin', type: 'text' }
    ],
    mockData: [
      { id: 1, name: 'Schülerzeitung', type: 'AG', leader: 'Frau Koch', members: 12, schedule: 'Dienstag 14:00', status: 'active' },
      { id: 2, name: 'Robotik-Club', type: 'AG', leader: 'Herr Berg', members: 8, schedule: 'Mittwoch 15:00', status: 'active' },
      { id: 3, name: 'Chor', type: 'AG', leader: 'Frau Lang', members: 25, schedule: 'Donnerstag 13:30', status: 'active' }
    ]
  },
  users: {
    title: 'Benutzer*innen verwalten',
    singular: 'Benutzer',
    plural: 'Benutzer',
    icon: User,
    fields: [
      { key: 'username', label: 'Benutzername', type: 'text' },
      { key: 'email', label: 'E-Mail', type: 'email' },
      { key: 'role', label: 'Rolle', type: 'text' },
      { key: 'lastLogin', label: 'Letzter Login', type: 'date' },
      { key: 'permissions', label: 'Berechtigungen', type: 'text' }
    ],
    mockData: [
      { id: 1, username: 'admin', email: 'admin@schule.de', role: 'Administrator', lastLogin: '2024-01-15', permissions: 'Vollzugriff', status: 'active' },
      { id: 2, username: 'maria.schneider', email: 'maria.schneider@schule.de', role: 'Lehrer', lastLogin: '2024-01-14', permissions: 'Klassenverwaltung', status: 'active' },
      { id: 3, username: 'thomas.mueller', email: 'thomas.mueller@schule.de', role: 'Lehrer', lastLogin: '2024-01-10', permissions: 'Klassenverwaltung', status: 'active' }
    ]
  }
}

export default function GenericDataManagement({ dataType, onBack }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const config = dataConfigs[dataType]
  
  if (!config) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Unbekannter Datentyp</h2>
        </div>
      </div>
    )
  }

  const [data] = useState(config.mockData)
  const IconComponent = config.icon

  const filteredData = data.filter(item => {
    const searchFields = config.fields.map(field => String(item[field.key] || '')).join(' ')
    return searchFields.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleEditItem = (item) => {
    setSelectedItem(item)
    setIsEditing(true)
  }

  const handleDeleteItem = (itemId) => {
    if (confirm(`Sind Sie sicher, dass Sie diesen ${config.singular} löschen möchten?`)) {
      // TODO: Implement delete functionality
      console.log('Delete item:', itemId)
    }
  }

  if (selectedItem && isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsEditing(false)
              setSelectedItem(null)
            }}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">{config.singular} bearbeiten</h2>
        </div>

        {/* Edit Form */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2">
              <IconComponent className="w-5 h-5 text-blue-600" />
              {config.singular} bearbeiten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-blue-900">{field.label}</label>
                  <Input 
                    type={field.type}
                    value={selectedItem[field.key] || ''}
                    onChange={(e) => setSelectedItem({
                      ...selectedItem, 
                      [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                    })}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => {
                // TODO: Implement save functionality
                console.log('Save item:', selectedItem)
                setIsEditing(false)
                setSelectedItem(null)
              }} className="bg-blue-600 hover:bg-blue-700">
                Speichern
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false)
                  setSelectedItem(null)
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
        <h2 className="text-2xl font-bold text-foreground">{config.title}</h2>
        <Button className="ml-auto bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer {config.singular}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={`${config.plural} suchen...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {filteredData.length} {config.plural} gefunden
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Data List */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-blue-50 border-b border-blue-200">
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="w-5 h-5 text-blue-600" />
            {config.plural}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredData.map((item) => (
              <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {item[config.fields[0].key]}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {config.fields.slice(1, 3).map((field) => (
                          item[field.key] && (
                            <span key={field.key}>
                              {field.label}: {item[field.key]}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={item.status === 'active' ? 'default' : 'secondary'}
                      className={item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {item.status === 'active' ? 'Aktiv' : item.status === 'expired' ? 'Abgelaufen' : 'Inaktiv'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                      className="p-2 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
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

      {filteredData.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <IconComponent className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Keine {config.plural} gefunden</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `Keine ${config.plural} entsprechen Ihrer Suche.` : `Noch keine ${config.plural} angelegt.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
