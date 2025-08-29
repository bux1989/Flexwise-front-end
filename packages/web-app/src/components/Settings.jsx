import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { DebugOverlay } from '../debug'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Building, 
  Settings as SettingsIcon, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Database, 
  Key, 
  Users, 
  Book, 
  DoorClosed, 
  UsersRound, 
  Shield, 
  Download,
  Edit
} from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('contact')

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Schuleinstellung</h2>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
          <TabsTrigger
            value="contact"
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
          >
            <Building className="w-4 h-4" />
            Kontaktinformationen
          </TabsTrigger>
          <TabsTrigger
            value="modules"
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
          >
            <SettingsIcon className="w-4 h-4" />
            Module
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-6">
          {/* School Information Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    Schulinformationen
                  </CardTitle>
                  <p className="text-blue-600/70">Grundlegende Informationen über Ihre Schule</p>
                </div>
                <Button variant="ghost" size="sm" className="p-2 hover:bg-blue-100">
                  <Edit className="w-4 h-4 text-blue-600" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <Building className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-foreground">Realschule Berlin-Nord</p>
                    <p className="text-sm text-muted-foreground">Schulname</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-foreground">Nicht festgelegt</p>
                    <p className="text-sm text-muted-foreground">Schulleitung</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-foreground">458 Nordstraße, 13357 Berlin, Deutschland</p>
                    <p className="text-sm text-muted-foreground">Anschrift</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-foreground">kontakt@rs-nord.berlin.de</p>
                    <p className="text-sm text-muted-foreground">E-Mail</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-foreground">+49 30 87654321</p>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-foreground">Nicht festgelegt</p>
                    <p className="text-sm text-muted-foreground">Fax</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Data Management */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Allgemeine Daten
              </CardTitle>
              <p className="text-blue-600/70">Allgemeine Schuldaten bearbeiten und importieren</p>
            </CardHeader>
            <CardContent>
              <DebugOverlay id="SET-001" name="Settings.GeneralData">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { name: 'Schüler*innen', icon: Users },
                  { name: 'Mitarbeiter*innen', icon: User },
                  { name: 'Fächer', icon: Book },
                  { name: 'Räume', icon: DoorClosed },
                  { name: 'Klassen', icon: Users },
                  { name: 'Zugangscodes', icon: Key },
                  { name: 'Kooperationspartner', icon: Building },
                  { name: 'Gruppen', icon: UsersRound },
                  { name: 'Benutzer*innen', icon: User }
                ].map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="flex items-center gap-3 p-4 h-auto hover:bg-blue-50 hover:border-blue-300 transition-colors justify-start border-gray-200"
                    >
                      <IconComponent className="w-6 h-6 text-blue-600" />
                      <span className="font-medium">{item.name}</span>
                    </Button>
                  );
                })}
              </div>
              
              <div className="border-t border-blue-200 pt-6 space-y-3">
                <Button variant="outline" className="w-full p-4 h-auto bg-blue-50 hover:bg-blue-100 border-blue-200">
                  <div className="flex flex-col items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div className="text-center">
                      <p className="font-medium text-blue-900">Sicherheit und Datenschutz</p>
                      <p className="text-sm text-blue-600/70">Hier können Sie Ihre Sicherheits- und Datenschutzeinstellungen verwalten</p>
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="w-full p-3 bg-blue-50 hover:bg-blue-100 border-blue-200 gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  Daten aus der LUSD importieren
                </Button>
                </div>
              </DebugOverlay>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
                Module verwalten
              </CardTitle>
              <p className="text-blue-600/70">Aktivieren und konfigurieren Sie die verfügbaren Module für Ihre Schule</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-medium text-blue-900">Sie haben 19 Module gebucht.</p>
                  <p className="text-sm text-blue-600/70">Verwalten Sie Ihre aktiven Module</p>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <SettingsIcon className="w-4 h-4" />
                  Module verwalten
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "Berichte", "Beurlaubung", "Check-In/Out", "Digitales Klassenbuch",
                  "Eltern-App", "Elternbriefe", "Fehlzeiten", "Flex-Planer",
                  "Info-Board", "Klassenbuch", "Schulinformationen", "Statistiken",
                  "Steckboard", "Stundenplan", "Stundenplanung", "Termine",
                  "To-Do-List", "Vertretungsplan", "Wahlfächer"
                ].map((module, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                    <span className="font-medium text-blue-900">{module}</span>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Aktiv</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* School Year Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Current School Year 2024/25 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-600" />
              Schuljahr 2024/25
            </CardTitle>
            <p className="text-blue-600/70">Aktuelles Schuljahr verwalten</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
              <Book className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Unterschulme</p>
                <p className="text-sm text-blue-600/70">Schulinformationen</p>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200">
              <User className="w-4 h-4 text-blue-600" />
              Kurse aus der LUSD importieren
            </Button>
            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4" />
              Daten sichern
            </Button>

            <div className="pt-4 border-t border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-3">Weitere Einstellungen</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="font-medium text-blue-900">Schuljahr</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="font-medium text-blue-900">Stundenraster</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="font-medium text-blue-900">Wochentage</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded mt-1">
                  <p className="font-medium text-blue-900">A-/B Wochen</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded mt-1">
                  <p className="font-medium text-blue-900">Ferien/Feiertage</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous School Year 2023/24 */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="bg-amber-50 border-b border-amber-200">
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5 text-amber-600" />
              Schuljahr 2023/24
            </CardTitle>
            <p className="text-amber-600/70">Vorheriges Schuljahr verwalten</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700 font-medium mb-2">Aus Datenschutzgründen empfehlen wir, die personenbezogenen Daten des vergangenen Schuljahres zu löschen.</p>
            </div>

            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4" />
              Daten sichern
            </Button>

            <Button className="w-full gap-2 bg-red-600 hover:bg-red-700">
              <X className="w-4 h-4" />
              Zum Löschen/Entfernen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer Links */}
      <div className="flex justify-end mt-12 pb-4">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="#datenschutz" className="hover:text-blue-600 transition-colors cursor-pointer">
            Datenschutz
          </a>
          <span className="text-border">|</span>
          <a href="#impressum" className="hover:text-blue-600 transition-colors cursor-pointer">
            Impressum
          </a>
        </div>
      </div>
    </div>
  )
}
