import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Textarea } from '../ui/textarea'
import { 
  ArrowLeft, 
  User, 
  Users, 
  Car, 
  GraduationCap,
  Save,
  Plus,
  Camera,
  Heart,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Upload,
  Trash2,
  X
} from 'lucide-react'

export default function StudentEditView({ student, onBack, onSave }) {
  const [activeTab, setActiveTab] = useState('schulakte')
  const [editedStudent, setEditedStudent] = useState({
    ...student,
    // Ensure all arrays exist
    photoPermissions: student.photoPermissions || [],
    allergies: student.allergies || [],
    parents: student.parents || [],
    siblings: student.siblings || [],
    authorizedPersons: student.authorizedPersons || [],
    activeCourses: student.activeCourses || [],
    waitingList: student.waitingList || [],
    pastCourses: student.pastCourses || [],
    pickupSchedule: student.pickupSchedule || {
      montag: { time: '', method: '', authorizedPersons: [], notes: '' },
      dienstag: { time: '', method: '', authorizedPersons: [], notes: '' },
      mittwoch: { time: '', method: '', authorizedPersons: [], notes: '' },
      donnerstag: { time: '', method: '', authorizedPersons: [], notes: '' },
      freitag: { time: '', method: '', authorizedPersons: [], notes: '' }
    },
    but: student.but || { enabled: false, type: '', validUntil: '' },
    // Add new fields with defaults
    einstieg: student.einstieg || new Date().toISOString().split('T')[0], // Default to current date
    ausstieg: student.ausstieg || '' // Default empty (no exit date)
  })

  const handleSave = () => {
    onSave(editedStudent)
  }

  const updateField = (field, value) => {
    setEditedStudent(prev => ({ ...prev, [field]: value }))
  }

  const updateNestedField = (field, index, subfield, value) => {
    setEditedStudent(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [subfield]: value } : item
      )
    }))
  }

  const addItemToArray = (field, defaultItem) => {
    setEditedStudent(prev => ({
      ...prev,
      [field]: [...prev[field], defaultItem]
    }))
  }

  const removeItemFromArray = (field, index) => {
    setEditedStudent(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const updatePickupSchedule = (day, field, value) => {
    setEditedStudent(prev => ({
      ...prev,
      pickupSchedule: {
        ...prev.pickupSchedule,
        [day]: {
          ...prev.pickupSchedule[day],
          [field]: value
        }
      }
    }))
  }

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
            {editedStudent.firstName} {editedStudent.lastName} bearbeiten
          </h2>
          <p className="text-muted-foreground">Schülerdaten ändern</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
          <Button variant="outline" onClick={onBack}>
            Abbrechen
          </Button>
        </div>
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
                <div>
                  <label className="text-sm font-medium text-blue-900">Vorname(n)</label>
                  <Input
                    value={editedStudent.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-900">Nachname</label>
                  <Input
                    value={editedStudent.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-900">Rufname (optional)</label>
                  <Input
                    value={editedStudent.nickname || ''}
                    onChange={(e) => updateField('nickname', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-900">Geburtsdatum</label>
                  <Input
                    type="date"
                    value={editedStudent.birthDate}
                    onChange={(e) => updateField('birthDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-900">Klasse</label>
                  <Input
                    value={editedStudent.class}
                    onChange={(e) => updateField('class', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-900">E-Mail</label>
                  <Input
                    type="email"
                    value={editedStudent.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-900">Telefon</label>
                  <Input
                    value={editedStudent.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-900">Status</label>
                  <select 
                    value={editedStudent.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-900">Einstieg (Schulbeginn)</label>
                  <Input
                    type="date"
                    value={editedStudent.einstieg}
                    onChange={(e) => updateField('einstieg', e.target.value)}
                    className="mt-1"
                    title="Tag an dem der Schüler an der Schule begonnen hat"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-900">Ausstieg (Schulende)</label>
                  <Input
                    type="date"
                    value={editedStudent.ausstieg}
                    onChange={(e) => updateField('ausstieg', e.target.value)}
                    className="mt-1"
                    title="Tag an dem der Schüler die Schule verlässt (leer = noch aktiv)"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-900">Adresse</label>
                <Textarea
                  value={editedStudent.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
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
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => addItemToArray('photoPermissions', {
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    grantedBy: '',
                    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year from now
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.photoPermissions.map((permission, index) => (
                <div key={index} className="p-3 border border-green-200 rounded-lg bg-green-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-900">Fotoerlaubnis #{index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-red-50"
                      onClick={() => removeItemFromArray('photoPermissions', index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-green-900">Datum</label>
                      <Input
                        type="date"
                        value={permission.date}
                        onChange={(e) => updateNestedField('photoPermissions', index, 'date', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Gültig bis</label>
                      <Input
                        type="date"
                        value={permission.validUntil}
                        onChange={(e) => updateNestedField('photoPermissions', index, 'validUntil', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Beschreibung</label>
                      <Input
                        value={permission.description}
                        onChange={(e) => updateNestedField('photoPermissions', index, 'description', e.target.value)}
                        className="mt-1"
                        placeholder="z.B. Schulveranstaltungen"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Erteilt durch</label>
                      <Input
                        value={permission.grantedBy}
                        onChange={(e) => updateNestedField('photoPermissions', index, 'grantedBy', e.target.value)}
                        className="mt-1"
                        placeholder="z.B. Frau Mustermann"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {editedStudent.photoPermissions.length === 0 && (
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
                <Button 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => addItemToArray('allergies', {
                    name: '',
                    severity: 'Leicht',
                    description: ''
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.allergies.map((allergy, index) => (
                <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-red-900">Allergie #{index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-red-100"
                      onClick={() => removeItemFromArray('allergies', index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-red-900">Allergie</label>
                      <Input
                        value={allergy.name}
                        onChange={(e) => updateNestedField('allergies', index, 'name', e.target.value)}
                        className="mt-1"
                        placeholder="z.B. Erdnüsse"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-red-900">Schweregrad</label>
                      <select
                        value={allergy.severity}
                        onChange={(e) => updateNestedField('allergies', index, 'severity', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="Leicht">Leicht</option>
                        <option value="Mittel">Mittel</option>
                        <option value="Schwer">Schwer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-red-900">Beschreibung</label>
                    <Textarea
                      value={allergy.description}
                      onChange={(e) => updateNestedField('allergies', index, 'description', e.target.value)}
                      className="mt-1"
                      rows={2}
                      placeholder="Weitere Details zur Allergie..."
                    />
                  </div>
                </div>
              ))}
              {editedStudent.allergies.length === 0 && (
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editedStudent.but.enabled}
                    onChange={(e) => setEditedStudent(prev => ({
                      ...prev,
                      but: { ...prev.but, enabled: e.target.checked }
                    }))}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-purple-900">BuT aktiviert</span>
                </label>
              </div>
              {editedStudent.but.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-purple-900">Typ</label>
                    <select
                      value={editedStudent.but.type}
                      onChange={(e) => setEditedStudent(prev => ({
                        ...prev,
                        but: { ...prev.but, type: e.target.value }
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="">Typ auswählen</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="L">L</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-900">Gültig bis</label>
                    <Input
                      type="date"
                      value={editedStudent.but.validUntil}
                      onChange={(e) => setEditedStudent(prev => ({
                        ...prev,
                        but: { ...prev.but, validUntil: e.target.value }
                      }))}
                      className="mt-1"
                    />
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
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => addItemToArray('parents', {
                    firstName: '',
                    lastName: '',
                    relationship: 'Mutter',
                    email: '',
                    phone: '',
                    address: '',
                    isPrimary: false
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedStudent.parents.map((parent, index) => (
                <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-900">Elternteil #{index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-red-50"
                      onClick={() => removeItemFromArray('parents', index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-blue-900">Vorname</label>
                      <Input
                        value={parent.firstName}
                        onChange={(e) => updateNestedField('parents', index, 'firstName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-900">Nachname</label>
                      <Input
                        value={parent.lastName}
                        onChange={(e) => updateNestedField('parents', index, 'lastName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-900">Beziehung</label>
                      <select
                        value={parent.relationship}
                        onChange={(e) => updateNestedField('parents', index, 'relationship', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="Mutter">Mutter</option>
                        <option value="Vater">Vater</option>
                        <option value="Erziehungsberechtigte(r)">Erziehungsberechtigte(r)</option>
                        <option value="Vormund">Vormund</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={parent.isPrimary}
                          onChange={(e) => updateNestedField('parents', index, 'isPrimary', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-blue-900">Hauptkontakt</span>
                      </label>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-900">E-Mail</label>
                      <Input
                        type="email"
                        value={parent.email}
                        onChange={(e) => updateNestedField('parents', index, 'email', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-900">Telefon</label>
                      <Input
                        value={parent.phone}
                        onChange={(e) => updateNestedField('parents', index, 'phone', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-900">Adresse</label>
                    <Textarea
                      value={parent.address}
                      onChange={(e) => updateNestedField('parents', index, 'address', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              {editedStudent.parents.length === 0 && (
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
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => addItemToArray('siblings', {
                    firstName: '',
                    lastName: '',
                    class: '',
                    birthDate: ''
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.siblings.map((sibling, index) => (
                <div key={index} className="p-3 border border-green-200 rounded-lg bg-green-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-900">Geschwister #{index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-red-50"
                      onClick={() => removeItemFromArray('siblings', index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-green-900">Vorname</label>
                      <Input
                        value={sibling.firstName}
                        onChange={(e) => updateNestedField('siblings', index, 'firstName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Nachname</label>
                      <Input
                        value={sibling.lastName}
                        onChange={(e) => updateNestedField('siblings', index, 'lastName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Klasse (optional)</label>
                      <Input
                        value={sibling.class}
                        onChange={(e) => updateNestedField('siblings', index, 'class', e.target.value)}
                        className="mt-1"
                        placeholder="z.B. 8B oder leer wenn nicht an der Schule"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Geburtsdatum</label>
                      <Input
                        type="date"
                        value={sibling.birthDate}
                        onChange={(e) => updateNestedField('siblings', index, 'birthDate', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {editedStudent.siblings.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Keine Geschwister verzeichnet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abholinfos Tab */}
        <TabsContent value="abholinfos" className="space-y-6">
          {/* Weekly Pickup Schedule */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="bg-orange-50 border-b border-orange-200">
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-orange-600" />
                Wöchentliche Abholinfos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(editedStudent.pickupSchedule).map(([day, info]) => (
                <div key={day} className="p-4 border border-orange-200 rounded-lg bg-orange-50 space-y-3">
                  <h4 className="font-medium text-orange-900 capitalize">{day}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-orange-900">Uhrzeit</label>
                      <Input
                        type="time"
                        value={info.time}
                        onChange={(e) => updatePickupSchedule(day, 'time', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-orange-900">Art der Abholung</label>
                      <select
                        value={info.method}
                        onChange={(e) => updatePickupSchedule(day, 'method', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="">Bitte auswählen</option>
                        <option value="Abholung durch Eltern">Abholung durch Eltern</option>
                        <option value="Abholung durch Großeltern">Abholung durch Großeltern</option>
                        <option value="Abholung durch andere Person">Abholung durch andere Person</option>
                        <option value="Selbstständig nach Hause">Selbstständig nach Hause</option>
                        <option value="Bus/ÖPNV">Bus/ÖPNV</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-orange-900">Abholberechtigte Personen (kommagetrennt)</label>
                    <Input
                      value={info.authorizedPersons?.join(', ') || ''}
                      onChange={(e) => updatePickupSchedule(day, 'authorizedPersons', e.target.value.split(', ').filter(p => p.trim()))}
                      className="mt-1"
                      placeholder="z.B. Maria Mustermann, Peter Mustermann"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-orange-900">Hinweise</label>
                    <Textarea
                      value={info.notes || ''}
                      onChange={(e) => updatePickupSchedule(day, 'notes', e.target.value)}
                      className="mt-1"
                      rows={2}
                      placeholder="Zusätzliche Informationen..."
                    />
                  </div>
                </div>
              ))}
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
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => addItemToArray('authorizedPersons', {
                    name: '',
                    relationship: '',
                    phone: '',
                    idRequired: false
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Person hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.authorizedPersons.map((person, index) => (
                <div key={index} className="p-3 border border-blue-200 rounded-lg bg-blue-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-900">Person #{index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-red-50"
                      onClick={() => removeItemFromArray('authorizedPersons', index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-blue-900">Name</label>
                      <Input
                        value={person.name}
                        onChange={(e) => updateNestedField('authorizedPersons', index, 'name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-900">Beziehung</label>
                      <Input
                        value={person.relationship}
                        onChange={(e) => updateNestedField('authorizedPersons', index, 'relationship', e.target.value)}
                        className="mt-1"
                        placeholder="z.B. Großmutter, Nachbar"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-blue-900">Telefonnummer</label>
                      <Input
                        value={person.phone}
                        onChange={(e) => updateNestedField('authorizedPersons', index, 'phone', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={person.idRequired}
                          onChange={(e) => updateNestedField('authorizedPersons', index, 'idRequired', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-blue-900">Ausweis erforderlich</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              {editedStudent.authorizedPersons.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  Aktive Kurse & AGs
                </CardTitle>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => addItemToArray('activeCourses', {
                    name: '',
                    instructor: '',
                    schedule: '',
                    location: '',
                    type: 'AG',
                    startDate: '',
                    description: ''
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Kurs hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.activeCourses.map((course, index) => (
                <div key={index} className="p-4 border border-green-200 rounded-lg bg-green-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-900">Kurs #{index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-red-50"
                      onClick={() => removeItemFromArray('activeCourses', index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-green-900">Kursname</label>
                      <Input
                        value={course.name}
                        onChange={(e) => updateNestedField('activeCourses', index, 'name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Kursleitung</label>
                      <Input
                        value={course.instructor}
                        onChange={(e) => updateNestedField('activeCourses', index, 'instructor', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Zeit</label>
                      <Input
                        value={course.schedule}
                        onChange={(e) => updateNestedField('activeCourses', index, 'schedule', e.target.value)}
                        className="mt-1"
                        placeholder="z.B. Mittwoch 15:00-17:00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Ort</label>
                      <Input
                        value={course.location}
                        onChange={(e) => updateNestedField('activeCourses', index, 'location', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Typ</label>
                      <select
                        value={course.type}
                        onChange={(e) => updateNestedField('activeCourses', index, 'type', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="AG">AG</option>
                        <option value="Kurs">Kurs</option>
                        <option value="Förderunterricht">Förderunterricht</option>
                        <option value="Sport">Sport</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-900">Startdatum</label>
                      <Input
                        type="date"
                        value={course.startDate}
                        onChange={(e) => updateNestedField('activeCourses', index, 'startDate', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-900">Beschreibung</label>
                    <Textarea
                      value={course.description}
                      onChange={(e) => updateNestedField('activeCourses', index, 'description', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              {editedStudent.activeCourses.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Keine aktiven Kurse oder AGs
                </p>
              )}
            </CardContent>
          </Card>

          {/* Waiting List */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Warteliste
                </CardTitle>
                <Button 
                  size="sm" 
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => addItemToArray('waitingList', {
                    name: '',
                    instructor: '',
                    schedule: '',
                    waitingPosition: 1,
                    registrationDate: new Date().toISOString().split('T')[0]
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Zur Warteliste hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.waitingList.map((course, index) => (
                <div key={index} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-yellow-900">Warteliste #{index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-red-50"
                      onClick={() => removeItemFromArray('waitingList', index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-yellow-900">Kursname</label>
                      <Input
                        value={course.name}
                        onChange={(e) => updateNestedField('waitingList', index, 'name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-yellow-900">Kursleitung</label>
                      <Input
                        value={course.instructor}
                        onChange={(e) => updateNestedField('waitingList', index, 'instructor', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-yellow-900">Zeit</label>
                      <Input
                        value={course.schedule}
                        onChange={(e) => updateNestedField('waitingList', index, 'schedule', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-yellow-900">Position auf Warteliste</label>
                      <Input
                        type="number"
                        min="1"
                        value={course.waitingPosition}
                        onChange={(e) => updateNestedField('waitingList', index, 'waitingPosition', parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-yellow-900">Anmeldedatum</label>
                      <Input
                        type="date"
                        value={course.registrationDate}
                        onChange={(e) => updateNestedField('waitingList', index, 'registrationDate', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {editedStudent.waitingList.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Keine Einträge auf der Warteliste
                </p>
              )}
            </CardContent>
          </Card>

          {/* Past Courses */}
          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-gray-600" />
                  Vergangene Kurse
                </CardTitle>
                <Button 
                  size="sm" 
                  className="bg-gray-600 hover:bg-gray-700"
                  onClick={() => addItemToArray('pastCourses', {
                    name: '',
                    instructor: '',
                    period: '',
                    completed: true
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Vergangenen Kurs hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.pastCourses.map((course, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Vergangener Kurs #{index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-red-50"
                      onClick={() => removeItemFromArray('pastCourses', index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Kursname</label>
                      <Input
                        value={course.name}
                        onChange={(e) => updateNestedField('pastCourses', index, 'name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900">Kursleitung</label>
                      <Input
                        value={course.instructor}
                        onChange={(e) => updateNestedField('pastCourses', index, 'instructor', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900">Zeitraum</label>
                      <Input
                        value={course.period}
                        onChange={(e) => updateNestedField('pastCourses', index, 'period', e.target.value)}
                        className="mt-1"
                        placeholder="z.B. 2023-2024"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={course.completed}
                          onChange={(e) => updateNestedField('pastCourses', index, 'completed', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-900">Erfolgreich abgeschlossen</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              {editedStudent.pastCourses.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Keine vergangenen Kurse verzeichnet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
