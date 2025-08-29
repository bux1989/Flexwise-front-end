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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Kontaktinformationen
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Module
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-6">
          {/* School Information Card */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="bg-muted/50 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    Schulinformationen
                  </CardTitle>
                  <p className="text-muted-foreground">Grundlegende Informationen über Ihre Schule</p>
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Building className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Realschule Berlin-Nord</p>
                    <p className="text-sm text-muted-foreground">Schulname</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Nicht festgelegt</p>
                    <p className="text-sm text-muted-foreground">Schulleitung</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">458 Nordstraße, 13357 Berlin, Deutschland</p>
                    <p className="text-sm text-muted-foreground">Anschrift</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">kontakt@rs-nord.berlin.de</p>
                    <p className="text-sm text-muted-foreground">E-Mail</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">+49 30 87654321</p>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Nicht festgelegt</p>
                    <p className="text-sm text-muted-foreground">Fax</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Data Management */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Allgemeine Daten
              </CardTitle>
              <p className="text-muted-foreground">Allgemeine Schuldaten bearbeiten und importieren</p>
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
                      className="flex items-center gap-3 p-4 h-auto hover:bg-accent hover:border-primary/20 transition-colors justify-start"
                    >
                      <IconComponent className="w-6 h-6 text-primary" />
                      <span className="font-medium">{item.name}</span>
                    </Button>
                  );
                })}
              </div>
              
              <div className="border-t border-border pt-6 space-y-3">
                <Button variant="outline" className="w-full p-4 h-auto bg-muted/20 hover:bg-muted/50 border-border">
                  <div className="flex flex-col items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-foreground">Sicherheit und Datenschutz</p>
                      <p className="text-sm text-muted-foreground">Hier können Sie Ihre Sicherheits- und Datenschutzeinstellungen verwalten</p>
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="w-full p-3 bg-muted/20 hover:bg-muted/50 border-border gap-2">
                  <Download className="w-4 h-4" />
                  Daten aus der LUSD importieren
                </Button>
                </div>
              </DebugOverlay>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                Module verwalten
              </CardTitle>
              <p className="text-muted-foreground">Aktivieren und konfigurieren Sie die verfügbaren Module für Ihre Schule</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6 p-4 bg-muted/20 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Sie haben 19 Module gebucht.</p>
                  <p className="text-sm text-muted-foreground">Verwalten Sie Ihre aktiven Module</p>
                </div>
                <Button className="gap-2">
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
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20 hover:bg-muted/50 transition-colors">
                    <span className="font-medium text-foreground">{module}</span>
                    <Badge variant="secondary">Aktiv</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Footer Links */}
      <div className="flex justify-end mt-12 pb-4">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="#datenschutz" className="hover:text-primary transition-colors cursor-pointer">
            Datenschutz
          </a>
          <span className="text-border">|</span>
          <a href="#impressum" className="hover:text-primary transition-colors cursor-pointer">
            Impressum
          </a>
        </div>
      </div>
    </div>
  )
}
