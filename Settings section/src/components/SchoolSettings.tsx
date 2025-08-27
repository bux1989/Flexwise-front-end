import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { 
  School, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  BookOpen, 
  Calendar, 
  Settings, 
  Database, 
  Shield, 
  UserPlus,
  FileText,
  GraduationCap,
  Building,
  Clock,
  Download,
  Upload,
  Trash2,
  Key,
  Lock,
  Building2,
  User,
  UsersRound,
  Edit
} from "lucide-react";

export function SchoolSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 text-foreground">Schuleinstellung</h1>
        </div>

        <Tabs defaultValue="contact" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-fit bg-white shadow-sm">
            <TabsTrigger value="contact" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <School className="h-4 w-4" />
              Kontaktinformationen
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Settings className="h-4 w-4" />
              Module
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="space-y-6">
            {/* School Information Card */}
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      Schulinformationen
                    </CardTitle>
                    <CardDescription>
                      Grundlegende Informationen über Ihre Schule
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/30">
                    <School className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Realschule Berlin-Nord</p>
                      <p className="text-sm text-muted-foreground">Schulname</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/30">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Nicht festgelegt</p>
                      <p className="text-sm text-muted-foreground">Schulleitung</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/30">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">458 Nordstraße, 13357 Berlin, Deutschland</p>
                      <p className="text-sm text-muted-foreground">Anschrift</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/30">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">kontakt@rs-nord.berlin.de</p>
                      <p className="text-sm text-muted-foreground">E-Mail</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/30">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">+49 30 87654321</p>
                      <p className="text-sm text-muted-foreground">Telefon</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                    <Phone className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium">Nicht festgelegt</p>
                      <p className="text-sm text-muted-foreground">Fax</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* General Data Management */}
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="bg-blue-50/50">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Allgemeine Daten
                </CardTitle>
                <CardDescription>
                  Allgemeine Schuldaten bearbeiten und importieren
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <Users className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-base">Schüler*innen</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-base">Mitarbeiter*innen</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-base">Fächer</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <Building className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-base">Räume</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <Users className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-base">Klassen</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <Key className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-base">Zugangscodes</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <Building2 className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-base">Kooperationspartner</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <UsersRound className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-base">Gruppen</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      <User className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-base">Benutzer*innen</span>
                    </div>
                  </Button>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-center h-auto p-4 bg-gradient-to-r from-blue-50 to-blue-50 hover:from-blue-100 hover:to-blue-100 border-blue-200 transition-all">
                    <div className="flex flex-col items-center gap-3 w-full">
                      <Lock className="h-5 w-5 text-blue-600" />
                      <div className="text-center">
                        <p className="font-medium text-blue-800">Sicherheit und Datenschutz</p>
                        <p className="text-sm text-blue-600 break-words whitespace-normal">Hier können Sie Ihre Sicherheits- und Datenschutzeinstellungen verwalten – darunter automatisches Ausloggen, verpflichtende Zwei-Faktor-Authentifizierung sowie den Vertrag zur Auftragsverarbeitung.</p>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800 transition-colors">
                    <Upload className="h-4 w-4 mr-2 text-blue-600" />
                    Daten aus der LUSD importieren
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* School Year Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="bg-blue-50/50">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Schuljahr 2024/25
                  </CardTitle>
                  <CardDescription>
                    Aktuelles Schuljahr verwalten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-white">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 transition-colors">
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      Unterrichtsliste
                    </Button>
                    <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 transition-colors">
                      <Upload className="h-4 w-4 mr-2 text-blue-600" />
                      Kurse aus der LUSD importieren
                    </Button>
                    <Button variant="outline" className="w-full justify-center bg-green-50 hover:bg-green-100 border-green-200 text-green-800 transition-colors">
                      <Download className="h-4 w-4 mr-2 text-green-600" />
                      Daten sichern
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-700">Weitere Einstellungen</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="hover:bg-slate-50 transition-colors">
                        Schuljahr
                      </Button>
                      <Button variant="outline" size="sm" className="hover:bg-slate-50 transition-colors">
                        Stundenraster
                      </Button>
                      <Button variant="outline" size="sm" className="hover:bg-slate-50 transition-colors">
                        Wochentage
                      </Button>
                      <Button variant="outline" size="sm" className="hover:bg-slate-50 transition-colors">
                        A-/B-Wochen
                      </Button>
                      <Button variant="outline" size="sm" className="hover:bg-slate-50 transition-colors">
                        Ferien/Feiertage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                <CardHeader className="bg-yellow-50/50">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    Schuljahr 2023/24
                  </CardTitle>
                  <CardDescription>
                    Vorheriges Schuljahr verwalten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-white">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Aus Datenschutzgründen empfehlen wir, die personenbezogenen Daten des vergangenen Schuljahres zu löschen.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-800 transition-colors">
                    <Download className="h-4 w-4 mr-2 text-green-600" />
                    Daten sichern
                  </Button>
                  <Button variant="destructive" className="w-full bg-red-500 hover:bg-red-600 transition-colors">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Zum Löschassistenten
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="bg-blue-50/50">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Module verwalten
                </CardTitle>
                <CardDescription>
                  Aktivieren und konfigurieren Sie die verfügbaren Module für Ihre Schule
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-blue-800">Sie haben 19 Module gebucht.</p>
                    <p className="text-sm text-blue-600">Verwalten Sie Ihre aktiven Module</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 transition-colors">
                    <Settings className="h-4 w-4 mr-2" />
                    Module verwalten
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    "Berichte",
                    "Beurlaubung",
                    "Check-In/Out",
                    "Digitales Klassenbuch",
                    "Eltern-App",
                    "Elternbriefe",
                    "Fehlzeiten",
                    "Flex-Planer",
                    "Info-Board",
                    "Klassenbuch",
                    "Schulinformationen",
                    "Statistiken",
                    "Steckboard",
                    "Stundenplan",
                    "Stundenplanung",
                    "Termine",
                    "To-Do-List",
                    "Vertretungsplan",
                    "Wahlfächer"
                  ].map((module, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50/30 hover:bg-blue-50 border-blue-200 transition-colors">
                      <span className="font-medium">{module}</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">Aktiv</Badge>
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
            <a 
              href="#datenschutz" 
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Datenschutz
            </a>
            <span className="text-slate-300">|</span>
            <a 
              href="#impressum" 
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Impressum
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}