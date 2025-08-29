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
              </div>
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
                  <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-900">
                            {parent.firstName} {parent.lastName}
                          </h3>
                          <p className="text-sm text-blue-600/70">{parent.relationship}</p>
                          <div className="flex items-center gap-4 text-sm text-blue-600/70 mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {parent.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {parent.phone}
                            </span>
                            {parent.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {parent.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={parent.isPrimary ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {parent.isPrimary ? 'Hauptkontakt' : 'Zusatzkontakt'}
                        </Badge>
                        <Button variant="ghost" size="sm" className="p-2 hover:bg-blue-100">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2 hover:bg-red-50">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Keine Elterninformationen vorhanden
                </p>
              )}
            </CardContent>
          </Card>

          {/* Siblings */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Geschwister
                </CardTitle>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.siblings && student.siblings.length > 0 ? (
                student.siblings.map((sibling, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                    <div>
                      <p className="font-medium text-green-900">
                        {sibling.firstName} {sibling.lastName}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-green-600/70">
                        <span>Klasse: {sibling.class || 'Nicht an der Schule'}</span>
                        <span>Geboren: {new Date(sibling.birthDate).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="p-2 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Keine Geschwister verzeichnet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abholinfos Tab */}
        <TabsContent value="abholinfos" className="space-y-6">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="bg-orange-50 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-orange-600" />
                  Wöchentliche Abholinfos
                </CardTitle>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.pickupSchedule ? (
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(student.pickupSchedule).map(([day, info]) => (
                    <div key={day} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-orange-900 capitalize">{day}</h3>
                          <div className="flex items-center gap-4 text-sm text-orange-600/70 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {info.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {info.method}
                            </span>
                            {info.authorizedPersons && info.authorizedPersons.length > 0 && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Abholberechtigt: {info.authorizedPersons.join(', ')}
                              </span>
                            )}
                          </div>
                          {info.notes && (
                            <p className="text-sm text-orange-600/70 mt-2">
                              Hinweise: {info.notes}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="p-2 hover:bg-orange-100">
                          <Edit className="w-4 h-4 text-orange-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Keine Abholinformationen eingetragen
                </p>
              )}
            </CardContent>
          </Card>

          {/* Authorized Pickup Persons */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Abholberechtigte Personen
                </CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Person hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.authorizedPersons && student.authorizedPersons.length > 0 ? (
                student.authorizedPersons.map((person, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <div>
                      <p className="font-medium text-blue-900">{person.name}</p>
                      <div className="flex items-center gap-4 text-sm text-blue-600/70">
                        <span>Beziehung: {person.relationship}</span>
                        {person.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {person.phone}
                          </span>
                        )}
                        {person.idRequired && (
                          <Badge className="bg-yellow-100 text-yellow-700">Ausweis erforderlich</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="p-2 hover:bg-blue-100">
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Keine abholberechtigten Personen eingetragen
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kursübersicht Tab */}
        <TabsContent value="kurse" className="space-y-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Kursübersicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Kursübersicht wird hier angezeigt...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
