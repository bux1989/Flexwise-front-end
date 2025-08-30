import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  ArrowLeft,
  Shield,
  Clock,
  Key,
  FileSignature,
  User,
  Settings,
  CheckCircle,
  AlertTriangle,
  Save,
  Users
} from 'lucide-react'

export default function SecurityDataProtection({ onBack }) {
  const [activeTab, setActiveTab] = useState('2fa')
  const [isEditing, setIsEditing] = useState(false)
  
  // Role definitions
  const roles = [
    { key: 'admin', name: 'Admin', icon: Shield, color: 'red' },
    { key: 'teacher', name: 'Lehrkraft', icon: User, color: 'blue' },
    { key: 'educator', name: 'Erzieher*in', icon: User, color: 'green' },
    { key: 'external', name: 'Extern', icon: User, color: 'purple' },
    { key: 'parent', name: 'Eltern', icon: User, color: 'orange' },
    { key: 'student', name: 'Schüler*in', icon: User, color: 'cyan' },
    { key: 'hausmeister', name: 'Hausmeister', icon: User, color: 'indigo' },
    { key: 'sekretariat', name: 'Sekretariat', icon: User, color: 'pink' },
    { key: 'schulsozialarbeit', name: 'Schulsozialarbeit', icon: User, color: 'teal' }
  ]

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: {
      admin: { mandatory: true, enabled: true },
      teacher: { mandatory: false, enabled: true },
      educator: { mandatory: false, enabled: false },
      external: { mandatory: true, enabled: true },
      parent: { mandatory: false, enabled: false },
      student: { mandatory: false, enabled: false },
      hausmeister: { mandatory: false, enabled: false },
      sekretariat: { mandatory: false, enabled: false },
      schulsozialarbeit: { mandatory: false, enabled: false }
    },
    autoLogout: {
      admin: { value: 60, unit: 'minutes' },
      teacher: { value: 45, unit: 'minutes' },
      educator: { value: 45, unit: 'minutes' },
      external: { value: 30, unit: 'minutes' },
      parent: { value: 30, unit: 'minutes' },
      student: { value: 20, unit: 'minutes' },
      hausmeister: { value: 45, unit: 'minutes' },
      sekretariat: { value: 45, unit: 'minutes' },
      schulsozialarbeit: { value: 45, unit: 'minutes' }
    },
    attendancePIN: {
      enabled: false,
      pinLength: 4,
      schoolPassword: ''
    },
    digitalSignature: {
      allowParentSignature: false,
      require2FAForSignature: true
    }
  })

  const [editedSettings, setEditedSettings] = useState(securitySettings)

  const handleSave = () => {
    setSecuritySettings(editedSettings)
    setIsEditing(false)
    console.log('Security settings saved:', editedSettings)
  }

  const handleCancel = () => {
    setEditedSettings(securitySettings)
    setIsEditing(false)
  }

  const updateTwoFactorAuth = (role, field, value) => {
    setEditedSettings(prev => ({
      ...prev,
      twoFactorAuth: {
        ...prev.twoFactorAuth,
        [role]: {
          ...prev.twoFactorAuth[role],
          [field]: value
        }
      }
    }))
  }

  const updateAutoLogout = (role, field, value) => {
    setEditedSettings(prev => ({
      ...prev,
      autoLogout: {
        ...prev.autoLogout,
        [role]: {
          ...prev.autoLogout[role],
          [field]: field === 'value' ? parseInt(value) || 0 : value
        }
      }
    }))
  }

  // Helper function to get display text for timeout
  const getTimeoutDisplay = (timeoutConfig) => {
    const { value, unit } = timeoutConfig
    if (unit === 'days') {
      return `${value} ${value === 1 ? 'Tag' : 'Tage'}`
    }
    return `${value} ${value === 1 ? 'Minute' : 'Minuten'}`
  }

  // Helper function to validate timeout values
  const validateTimeout = (value, unit) => {
    const maxMinutes = 30 * 24 * 60 // 30 days in minutes
    if (unit === 'days') {
      return value >= 1 && value <= 30
    }
    return value >= 1 && value <= maxMinutes
  }

  // Helper function to get max value for current unit
  const getMaxValue = (unit) => {
    return unit === 'days' ? 30 : 30 * 24 * 60 // 30 days or 43200 minutes
  }

  const updateAttendancePIN = (field, value) => {
    setEditedSettings(prev => ({
      ...prev,
      attendancePIN: {
        ...prev.attendancePIN,
        [field]: value
      }
    }))
  }

  const updateDigitalSignature = (field, value) => {
    setEditedSettings(prev => ({
      ...prev,
      digitalSignature: {
        ...prev.digitalSignature,
        [field]: value
      }
    }))
  }

  const currentSettings = isEditing ? editedSettings : securitySettings

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Sicherheit und Datenschutz</h2>
          <p className="text-muted-foreground">Verwalten Sie Ihre Sicherheits- und Datenschutzeinstellungen</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button 
              onClick={() => {
                setEditedSettings(securitySettings)
                setIsEditing(true)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Abbrechen
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="2fa" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            2-Faktor-Auth
          </TabsTrigger>
          <TabsTrigger value="logout" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Auto-Logout
          </TabsTrigger>
          <TabsTrigger value="pin" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Anwesenheits-PIN
          </TabsTrigger>
          <TabsTrigger value="signature" className="flex items-center gap-2">
            <FileSignature className="w-4 h-4" />
            Digitale Signatur
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Rollen & Berechtigungen
          </TabsTrigger>
        </TabsList>

        {/* 2-Factor Authentication Tab */}
        <TabsContent value="2fa" className="space-y-6">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                2-Faktor-Authentifizierung
              </CardTitle>
              <p className="text-red-600/70">Konfigurieren Sie 2FA-Regeln für verschiedene Benutzerrollen</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Super Admin Notice */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <p className="font-medium text-red-900">Super-Admin</p>
                </div>
                <p className="text-sm text-red-600/70 mt-1">
                  Super-Admin-Konten haben immer 2-Faktor-Authentifizierung aktiviert (nicht änderbar)
                </p>
              </div>

              {/* Role Settings */}
              <div className="space-y-4">
                {roles.map((role) => {
                  const IconComponent = role.icon
                  const settings = currentSettings.twoFactorAuth[role.key]
                  
                  return (
                    <div key={role.key} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-${role.color}-100 rounded-full flex items-center justify-center`}>
                            <IconComponent className={`w-5 h-5 text-${role.color}-600`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{role.name}</h3>
                            <p className="text-sm text-gray-600">
                              {settings.mandatory ? 'Verpflichtend' : 'Optional'} • 
                              {settings.enabled ? ' Aktiviert' : ' Deaktiviert'}
                            </p>
                          </div>
                        </div>
                        
                        {isEditing ? (
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={currentSettings.twoFactorAuth[role.key].mandatory}
                                onChange={(e) => updateTwoFactorAuth(role.key, 'mandatory', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Verpflichtend</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={currentSettings.twoFactorAuth[role.key].enabled}
                                onChange={(e) => updateTwoFactorAuth(role.key, 'enabled', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Aktiviert</span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge className={settings.mandatory ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>
                              {settings.mandatory ? 'Verpflichtend' : 'Optional'}
                            </Badge>
                            <Badge className={settings.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {settings.enabled ? 'Aktiviert' : 'Deaktiviert'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto Logout Tab */}
        <TabsContent value="logout" className="space-y-6">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="bg-orange-50 border-b border-orange-200">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Automatische Abmeldung
              </CardTitle>
              <p className="text-orange-600/70">Setzen Sie Timeout-Zeiten für automatische Abmeldung pro Rolle</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const IconComponent = role.icon
                  const timeoutConfig = currentSettings.autoLogout[role.key]

                  return (
                    <div key={role.key} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 bg-${role.color}-100 rounded-full flex items-center justify-center`}>
                          <IconComponent className={`w-4 h-4 text-${role.color}-600`} />
                        </div>
                        <h3 className="font-medium text-gray-900">{role.name}</h3>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max={getMaxValue(timeoutConfig.unit)}
                              value={timeoutConfig.value}
                              onChange={(e) => updateAutoLogout(role.key, 'value', e.target.value)}
                              className="w-20"
                            />
                            <select
                              value={timeoutConfig.unit}
                              onChange={(e) => updateAutoLogout(role.key, 'unit', e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="minutes">Minuten</option>
                              <option value="days">Tage</option>
                            </select>
                          </div>
                          <p className="text-xs text-gray-500">
                            Max: {timeoutConfig.unit === 'days' ? '30 Tage' : '43.200 Minuten (30 Tage)'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-700">
                            {getTimeoutDisplay(timeoutConfig)}
                          </Badge>
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance PIN Tab */}
        <TabsContent value="pin" className="space-y-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Schnelle Anmeldung für Anwesenheit
              </CardTitle>
              <p className="text-blue-600/70">PIN-basierte Anmeldung für laufende Unterrichtsstunden</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center gap-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                {isEditing ? (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={currentSettings.attendancePIN.enabled}
                      onChange={(e) => updateAttendancePIN('enabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="font-medium text-blue-900">Schnelle PIN-Anmeldung aktivieren</span>
                  </label>
                ) : (
                  <div className="flex items-center gap-3">
                    {currentSettings.attendancePIN.enabled ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="font-medium text-blue-900">
                      Schnelle PIN-Anmeldung {currentSettings.attendancePIN.enabled ? 'aktiviert' : 'deaktiviert'}
                    </span>
                  </div>
                )}
              </div>

              {/* PIN Settings */}
              {currentSettings.attendancePIN.enabled && (
                <div className="space-y-4">
                  {/* PIN Length */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">PIN-Länge</h4>
                    {isEditing ? (
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="pinLength"
                            value="4"
                            checked={currentSettings.attendancePIN.pinLength === 4}
                            onChange={(e) => updateAttendancePIN('pinLength', parseInt(e.target.value))}
                            className="w-4 h-4"
                          />
                          <span>4-stellige PIN</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="pinLength"
                            value="6"
                            checked={currentSettings.attendancePIN.pinLength === 6}
                            onChange={(e) => updateAttendancePIN('pinLength', parseInt(e.target.value))}
                            className="w-4 h-4"
                          />
                          <span>6-stellige PIN</span>
                        </label>
                      </div>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700">
                        {currentSettings.attendancePIN.pinLength}-stellige PIN
                      </Badge>
                    )}
                  </div>

                  {/* School Password */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Schulweites Passwort</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Dieses Passwort wird für die PIN-basierte Anmeldung verwendet
                    </p>
                    {isEditing ? (
                      <Input
                        type="password"
                        value={currentSettings.attendancePIN.schoolPassword}
                        onChange={(e) => updateAttendancePIN('schoolPassword', e.target.value)}
                        placeholder="Schulweites Passwort eingeben"
                        className="max-w-md"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {currentSettings.attendancePIN.schoolPassword ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">Passwort gesetzt</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-orange-700">Kein Passwort gesetzt</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Digital Signature Tab */}
        <TabsContent value="signature" className="space-y-6">
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="bg-purple-50 border-b border-purple-200">
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-purple-600" />
                Digitale Signatur für Eltern
              </CardTitle>
              <p className="text-purple-600/70">Einstellungen für digitale Signaturen von Eltern</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Allow Parent Signature */}
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                {isEditing ? (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={currentSettings.digitalSignature.allowParentSignature}
                      onChange={(e) => updateDigitalSignature('allowParentSignature', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="font-medium text-purple-900 block">Digitale Signaturen für Eltern erlauben</span>
                      <span className="text-sm text-purple-600/70">
                        <p>
                          Eltern können digitale Signaturen für Dokumente erstellen. Voraussetzung ist, dass sie vorher eine 2-Faktor-Authentifizierung eingerichtet haben.
                        </p>
                      </span>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-3">
                    {currentSettings.digitalSignature.allowParentSignature ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <span className="font-medium text-purple-900 block">
                        Digitale Signaturen {currentSettings.digitalSignature.allowParentSignature ? 'erlaubt' : 'nicht erlaubt'}
                      </span>
                      <span className="text-sm text-purple-600/70">
                        {currentSettings.digitalSignature.allowParentSignature 
                          ? 'Eltern können digitale Signaturen erstellen'
                          : 'Digitale Signaturen sind deaktiviert'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2FA Requirement for Signatures */}
              {currentSettings.digitalSignature.allowParentSignature && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  {isEditing ? (
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={currentSettings.digitalSignature.require2FAForSignature}
                        onChange={(e) => updateDigitalSignature('require2FAForSignature', e.target.checked)}
                        className="w-5 h-5"
                      />
                      <div>
                        <span className="font-medium text-gray-900 block">2-Faktor-Authentifizierung für Signaturen erforderlich</span>
                        <span className="text-sm text-gray-600">Eltern müssen 2FA aktiviert haben, um digital zu signieren</span>
                      </div>
                    </label>
                  ) : (
                    <div className="flex items-center gap-3">
                      {currentSettings.digitalSignature.require2FAForSignature ? (
                        <Shield className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      )}
                      <div>
                        <span className="font-medium text-gray-900 block">
                          2FA für Signaturen {currentSettings.digitalSignature.require2FAForSignature ? 'erforderlich' : 'nicht erforderlich'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {currentSettings.digitalSignature.require2FAForSignature 
                            ? 'Erhöhte Sicherheit durch 2FA-Pflicht'
                            : 'Signaturen ohne 2FA möglich'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Information Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-xs">ℹ</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Rechtliche Hinweise</p>
                    <p className="text-sm text-blue-600/70 mt-1">
                      Digitale Signaturen haben in Deutschland unter bestimmten Voraussetzungen rechtliche Gültigkeit. 
                      Beachten Sie die aktuellen Bestimmungen des Signaturgesetzes (SigG).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
