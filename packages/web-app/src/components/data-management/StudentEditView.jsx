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
  const [expandedParent, setExpandedParent] = useState(null)
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
                <div key={index} className="border border-blue-200 rounded-lg bg-blue-50">
                  {/* Parent Summary - Always Visible */}
                  <div
                    className="p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => setExpandedParent(expandedParent === index ? null : index)}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Elternteil entfernen?')) {
                              removeItemFromArray('parents', index)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details - Only when clicked */}
                  {expandedParent === index && (
                    <div className="border-t border-blue-200 p-4 bg-white space-y-3">
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
                  )}
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
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Geschwister
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.siblings.map((sibling, index) => (
                <div
                  key={index}
                  className="p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                  onClick={() => {
                    // TODO: Navigate to sibling's profile page
                    console.log('Navigate to sibling profile:', sibling.firstName, sibling.lastName)
                  }}
                  title="Klicken um zum Schülerprofil zu gelangen"
                >
                  <div className="flex items-center justify-between">
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
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700">
                        Geschwister
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 hover:bg-orange-50"
                        onClick={(e) => {
                          e.stopPropagation() // Prevent navigation when clicking disconnect
                          if (confirm('Geschwisterverbindung entfernen? (Der Schüler bleibt bestehen, wird nur aus der Familie entfernt)')) {
                            removeItemFromArray('siblings', index)
                          }
                        }}
                        title="Geschwisterverbindung entfernen"
                      >
                        <X className="w-4 h-4 text-orange-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {editedStudent.siblings.length === 0 && (
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
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Regelung zur Heimgehzeit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(editedStudent.pickupSchedule).map(([day, info]) => {
                  const dayNames = {
                    'montag': 'Montag',
                    'dienstag': 'Dienstag',
                    'mittwoch': 'Mittwoch',
                    'donnerstag': 'Donnerstag',
                    'freitag': 'Freitag'
                  }

                  return (
                    <div key={day} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-3 text-center">
                        {dayNames[day] || day}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Art der Abholung</label>
                          <select
                            value={info.method}
                            onChange={(e) => updatePickupSchedule(day, 'method', e.target.value)}
                            className="w-full text-xs px-2 py-1 border border-input bg-white rounded text-center"
                          >
                            <option value="">Auswählen</option>
                            <option value="Schulbus">Schulbus</option>
                            <option value="Abholung">Abholung</option>
                            <option value="Geht allein nach Hause">Geht allein nach Hause</option>
                            <option value="Bus/ÖPNV">Bus/ÖPNV</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Uhrzeit</label>
                          <Input
                            type="time"
                            value={info.time}
                            onChange={(e) => updatePickupSchedule(day, 'time', e.target.value)}
                            className="text-xs text-center h-7"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Hinweise</label>
                          <Textarea
                            value={info.notes || ''}
                            onChange={(e) => updatePickupSchedule(day, 'notes', e.target.value)}
                            className="text-xs h-12"
                            placeholder="Optional..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
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
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
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
            <CardContent className="p-6">
              {editedStudent.authorizedPersons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {editedStudent.authorizedPersons.map((person, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Person #{index + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 hover:bg-red-50 h-6 w-6"
                          onClick={() => removeItemFromArray('authorizedPersons', index)}
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Name</label>
                          <Input
                            value={person.name}
                            onChange={(e) => updateNestedField('authorizedPersons', index, 'name', e.target.value)}
                            className="text-sm"
                            placeholder="Vollständiger Name"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Beziehung</label>
                          <Input
                            value={person.relationship}
                            onChange={(e) => updateNestedField('authorizedPersons', index, 'relationship', e.target.value)}
                            className="text-sm"
                            placeholder="z.B. Großmutter"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Telefonnummer</label>
                          <Input
                            value={person.phone}
                            onChange={(e) => updateNestedField('authorizedPersons', index, 'phone', e.target.value)}
                            className="text-sm"
                            placeholder="+49 123 456789"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`id-required-${index}`}
                            checked={person.idRequired}
                            onChange={(e) => updateNestedField('authorizedPersons', index, 'idRequired', e.target.checked)}
                            className="w-3 h-3"
                          />
                          <label htmlFor={`id-required-${index}`} className="text-xs text-gray-600">
                            Ausweis erforderlich
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Keine abholberechtigten Personen eingetragen</p>
                  <p className="text-gray-400 text-xs mt-1">Klicken Sie auf "Person hinzufügen" um zu beginnen</p>
                </div>
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
              {editedStudent.activeCourses.map((course, index) => (
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
                    <h3 className="font-medium text-green-900">{course.name}</h3>
                    <Badge className="bg-green-100 text-green-700">
                      {course.type || 'AG'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm text-green-600/70">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{course.schedule}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{course.location}</span>
                    </div>
                    {course.startDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>seit {new Date(course.startDate).toLocaleDateString('de-DE')}</span>
                      </div>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-sm text-green-600/70 mt-2">{course.description}</p>
                  )}
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
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Warteliste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.waitingList.map((course, index) => (
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
                    <h3 className="font-medium text-yellow-900">{course.name}</h3>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      Warteliste #{course.waitingPosition}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm text-yellow-600/70">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{course.schedule}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Position: {course.waitingPosition}</span>
                    </div>
                    {course.registrationDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Angemeldet: {new Date(course.registrationDate).toLocaleDateString('de-DE')}</span>
                      </div>
                    )}
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
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gray-600" />
                Vergangene Kurse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editedStudent.pastCourses.map((course, index) => (
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
                    <h3 className="font-medium text-gray-900">{course.name}</h3>
                    <div className="flex items-center gap-2">
                      {course.completed && (
                        <Badge className="bg-green-100 text-green-700">Erfolgreich abgeschlossen</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600/70">
                    <span>{course.period}</span>
                    <span>{course.instructor}</span>
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
