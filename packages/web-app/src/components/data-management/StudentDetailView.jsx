import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  ArrowLeft, 
  User, 
  Users, 
  Car, 
  GraduationCap,
  Edit,
  Plus,
  Camera,
  Heart,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Upload,
  Trash2
} from 'lucide-react'

export default function StudentDetailView({ student, onBack, onEdit }) {
  const [activeTab, setActiveTab] = useState('schulakte')
  const [expandedParent, setExpandedParent] = useState(null)

  if (!student) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">
            {student.firstName} {student.lastName}
          </h2>
          <p className="text-muted-foreground">Klasse {student.class}</p>
        </div>
        <Button 
          onClick={() => onEdit(student)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Edit className="w-4 h-4 mr-2" />
          Bearbeiten
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schulakte" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Schulakte
          </TabsTrigger>
          <TabsTrigger value="familie" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Familie
          </TabsTrigger>
          <TabsTrigger value="abholinfos" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            Abholinfos
          </TabsTrigger>
          <TabsTrigger value="kurse" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Kursübersicht
          </TabsTrigger>
        </TabsList>

        {/* Schulakte Tab */}
        <TabsContent value="schulakte" className="space-y-6">
          {/* Basic Information */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Grundinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Vorname(n)</p>
                    <p className="text-sm text-blue-600/70">{student.firstName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Nachname</p>
                    <p className="text-sm text-blue-600/70">{student.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Rufname</p>
                    <p className="text-sm text-blue-600/70">{student.nickname || 'Nicht angegeben'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Geburtsdatum</p>
                    <p className="text-sm text-blue-600/70">
                      {new Date(student.birthDate).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Klasse</p>
                    <p className="text-sm text-blue-600/70">{student.class}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Einstieg (Schulbeginn)</p>
                    <p className="text-sm text-blue-600/70">
                      {student.einstieg ? new Date(student.einstieg).toLocaleDateString('de-DE') : 'Nicht angegeben'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Ausstieg (Schulende)</p>
                    <p className="text-sm text-blue-600/70">
                      {student.ausstieg ? new Date(student.ausstieg).toLocaleDateString('de-DE') : 'Noch aktiv'}
                    </p>
                  </div>
                </div>
              </div>
              {student.ausstieg && new Date(student.ausstieg) < new Date() && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700 font-medium">
                    ⚠️ Dieser Schüler hat die Schule verlassen und kann nicht mehr in Kurse eingeschrieben werden.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fotoerlaubnisse */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-green-600" />
                  Fotoerlaubnisse
                </CardTitle>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.photoPermissions && student.photoPermissions.length > 0 ? (
                student.photoPermissions.map((permission, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                    <div>
                      <p className="font-medium text-green-900">{permission.description}</p>
                      <div className="flex items-center gap-4 text-sm text-green-600/70">
                        <span>Datum: {new Date(permission.date).toLocaleDateString('de-DE')}</span>
                        <span>Erteilt durch: {permission.grantedBy}</span>
                        <span>Gültig bis: {new Date(permission.validUntil).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={new Date(permission.validUntil) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {new Date(permission.validUntil) > new Date() ? 'Gültig' : 'Abgelaufen'}
                      </Badge>
                      <Button variant="ghost" size="sm" className="p-2 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Keine Fotoerlaubnisse vorhanden</p>
              )}
            </CardContent>
          </Card>

          {/* Allergien */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Allergien
                </CardTitle>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.allergies && student.allergies.length > 0 ? (
                student.allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <p className="font-medium text-red-900">{allergy.name}</p>
                      <p className="text-sm text-red-600/70">{allergy.severity} - {allergy.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="p-2 hover:bg-red-100">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Keine Allergien verzeichnet</p>
              )}
            </CardContent>
          </Card>

          {/* BuT (Bildung und Teilhabe) */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="bg-purple-50 border-b border-purple-200">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                BuT (Bildung und Teilhabe)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium text-purple-900">Status:</span>
                <Badge className={student.but?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {student.but?.enabled ? 'Aktiviert' : 'Nicht aktiviert'}
                </Badge>
              </div>
              {student.but?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
                    <div>
                      <p className="font-medium text-purple-900">Typ</p>
                      <p className="text-sm text-purple-600/70">{student.but.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
                    <div>
                      <p className="font-medium text-purple-900">Gültig bis</p>
                      <p className="text-sm text-purple-600/70">
                        {new Date(student.but.validUntil).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Familie Tab */}
        <TabsContent value="familie" className="space-y-6">
          {/* Parents */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Eltern / Erziehungsberechtigte
                </CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.parents && student.parents.length > 0 ? (
                student.parents.map((parent, index) => (
                  <div key={index} className="border border-blue-200 rounded-lg bg-blue-50">
                    {/* Parent Summary - Always Visible */}
                    <div
                      className="p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => setExpandedParent(expandedParent === index ? null : index)}
                      title="Klicken für weitere Details"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-blue-900">
                              {parent.firstName} {parent.lastName}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-blue-600/70">
                              <span>{parent.relationship}</span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {parent.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {parent.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={parent.isPrimary ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {parent.isPrimary ? 'Hauptkontakt' : 'Zusatzkontakt'}
                          </Badge>
                          <div className="text-blue-600 text-sm">
                            {expandedParent === index ? '▲' : '▼'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details - Only when clicked */}
                    {expandedParent === index && (
                      <div className="border-t border-blue-200 p-4 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-blue-900">Kontaktinformationen</h4>
                            <div className="text-sm text-blue-600/70 space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{parent.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{parent.phone}</span>
                              </div>
                              {parent.address && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 mt-0.5" />
                                  <span>{parent.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-blue-900">Zusätzliche Informationen</h4>
                            <div className="text-sm text-blue-600/70 space-y-1">
                              <div>Beziehung: {parent.relationship}</div>
                              <div>Status: {parent.isPrimary ? 'Hauptkontakt' : 'Zusatzkontakt'}</div>
                              {/* Add more parent details here as needed */}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Keine Elterninformationen vorhanden</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Siblings */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Geschwister
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.siblings && student.siblings.length > 0 ? (
                student.siblings.map((sibling, index) => (
                  <div
                    key={index}
                    className="p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                    onClick={() => {
                      // TODO: Navigate to sibling's profile page
                      console.log('Navigate to sibling profile:', sibling.firstName, sibling.lastName)
                    }}
                    title="Klicken um zum Schülerprofil zu gelangen"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-900">
                          {sibling.firstName} {sibling.lastName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-green-600/70">
                          <span>Klasse: {sibling.class || 'Nicht an der Schule'}</span>
                          <span>Geboren: {new Date(sibling.birthDate).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Badge className="bg-green-100 text-green-700">
                          Geschwister
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Keine Geschwister verzeichnet</p>
                  <p className="text-gray-400 text-xs mt-1">Geschwister werden über deren eigene Profile verknüpft</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abholinfos Tab */}
        <TabsContent value="abholinfos" className="space-y-6">
          {/* Regelung zur Heimgehzeit */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Regelung zur Heimgehzeit
                </CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {student.pickupSchedule ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(student.pickupSchedule).map(([day, info]) => {
                    const dayNames = {
                      'montag': 'Montag',
                      'dienstag': 'Dienstag',
                      'mittwoch': 'Mittwoch',
                      'donnerstag': 'Donnerstag',
                      'freitag': 'Freitag'
                    }

                    const getIcon = (method) => {
                      if (method?.includes('Schulbus') || method?.includes('Bus')) return '🚌'
                      if (method?.includes('Abholung')) return '👥'
                      if (method?.includes('allein') || method?.includes('selbstständig')) return '🚶'
                      return '🏠'
                    }

                    return (
                      <div key={day} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          {dayNames[day] || day}
                        </div>
                        <div className="text-2xl mb-2">
                          {getIcon(info.method)}
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {info.method || 'Nicht festgelegt'}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {info.time || '--:--'} Uhr
                        </div>
                        {info.notes && (
                          <div className="text-xs text-gray-400 mt-2 truncate" title={info.notes}>
                            {info.notes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Keine Abholinformationen eingetragen
                </p>
              )}
            </CardContent>
          </Card>

          {/* Abholberechtigte */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Abholberechtigte
                </CardTitle>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {student.authorizedPersons && student.authorizedPersons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {student.authorizedPersons.map((person, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {person.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {person.relationship}
                          </div>
                          {person.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <Phone className="w-3 h-3" />
                              {person.phone}
                            </div>
                          )}
                          {person.idRequired && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs mt-2">
                              Ausweis erforderlich
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Keine abholberechtigten Personen eingetragen
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kursübersicht Tab */}
        <TabsContent value="kurse" className="space-y-6">
          {/* Active Courses */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-600" />
                Aktive Kurse & AGs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.activeCourses && student.activeCourses.length > 0 ? (
                student.activeCourses.map((course, index) => (
                  <div
                    key={index}
                    className="p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                    onClick={() => {
                      // TODO: Navigate to course management page
                      console.log('Navigate to course:', course.name)
                    }}
                    title="Klicken um zum Kurs zu gelangen"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-green-900">{course.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-green-600/70 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {course.instructor}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.schedule}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {course.location}
                          </span>
                          {course.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              seit {new Date(course.startDate).toLocaleDateString('de-DE')}
                            </span>
                          )}
                        </div>
                        {course.description && (
                          <p className="text-sm text-green-600/70 mt-2">{course.description}</p>
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        {course.type || 'AG'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Keine aktiven Kurse oder AGs
                </p>
              )}
            </CardContent>
          </Card>

          {/* Waiting List */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="bg-yellow-50 border-b border-yellow-200">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Warteliste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.waitingList && student.waitingList.length > 0 ? (
                student.waitingList.map((course, index) => (
                  <div
                    key={index}
                    className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer"
                    onClick={() => {
                      // TODO: Navigate to course management page
                      console.log('Navigate to course:', course.name)
                    }}
                    title="Klicken um zum Kurs zu gelangen"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-yellow-900">{course.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-yellow-600/70 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {course.instructor}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.schedule}
                          </span>
                          <span>Position: {course.waitingPosition}</span>
                          {course.registrationDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Angemeldet: {new Date(course.registrationDate).toLocaleDateString('de-DE')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">
                        Warteliste #{course.waitingPosition}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Keine Einträge auf der Warteliste
                </p>
              )}
            </CardContent>
          </Card>

          {/* Past Courses */}
          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gray-600" />
                Vergangene Kurse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.pastCourses && student.pastCourses.length > 0 ? (
                student.pastCourses.map((course, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      // TODO: Navigate to course management page
                      console.log('Navigate to course:', course.name)
                    }}
                    title="Klicken um zum Kurs zu gelangen"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{course.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600/70 mt-1">
                          <span>{course.period}</span>
                          <span>{course.instructor}</span>
                        </div>
                      </div>
                      {course.completed && (
                        <Badge className="bg-green-100 text-green-700">Erfolgreich abgeschlossen</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Keine vergangenen Kurse verzeichnet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Info Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-blue-600 text-xs">ℹ</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Kursübersicht</p>
                <p className="text-sm text-blue-600/70 mt-1">
                  Klicken Sie auf einen Kurs, um zur Kursverwaltung zu gelangen. Dort können Sie Änderungen vornehmen oder Schüler ab-/anmelden.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
