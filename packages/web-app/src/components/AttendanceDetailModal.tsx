import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Phone, MessageSquare, Mail, Clock, UserCheck } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  klasse: string;
  status: string;
  lastUpdate: string;
  details: string;
  kontakt?: {
    phone?: string;
    mobile?: string;
    email?: string;
  };
  hinweis?: string;
}

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  students: Student[];
}

export function AttendanceDetailModal({ isOpen, onClose, status, students }: AttendanceDetailModalProps) {
  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'ueberfaellig':
        return 'Überfällige Kinder (nach Entlasszeit)';
      case 'unentschuldigt':
        return 'Unentschuldigte Schüler*innen';
      case 'entschuldigt':
        return 'Entschuldigte Schüler*innen';
      case 'ausstehend':
        return 'Ausstehende Schüler*innen';
      case 'anwesend':
        return 'Anwesende Schüler*innen';
      default:
        return 'Schüler*innen';
    }
  };

  const getStatusBadgeColor = (studentStatus: string) => {
    switch (studentStatus) {
      case 'Überfällig':
        return 'bg-red-100 text-red-700';
      case 'Unentschuldigt':
        return 'bg-red-100 text-red-700';
      case 'Entschuldigt':
        return 'bg-blue-100 text-blue-700';
      case 'Ausstehend':
        return 'bg-orange-100 text-orange-700';
      case 'Anwesend':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ueberfaellig':
        return '⏰';
      case 'unentschuldigt':
        return '👤';
      case 'entschuldigt':
        return '✓';
      case 'ausstehend':
        return '⏳';
      case 'anwesend':
        return '✅';
      default:
        return '📊';
    }
  };

  const getStatusCount = () => {
    switch (status) {
      case 'ueberfaellig':
        return '3 Überfällig';
      case 'unentschuldigt':
        return '1 Schüler*in';
      case 'entschuldigt':
        return '2 Schüler*innen';
      case 'ausstehend':
        return '3 Schüler*innen';
      case 'anwesend':
        return '4 Schüler*innen';
      default:
        return `${students.length} Schüler*innen`;
    }
  };

  const getDescription = (status: string) => {
    switch (status) {
      case 'ueberfaellig':
        return 'Diese Kinder sollten bereits abgeholt worden sein. Kontaktieren Sie bei Bedarf die Eltern oder checken Sie die Kinder manuell aus, wenn sie abgeholt wurden.';
      case 'unentschuldigt':
        return 'Schüler*innen mit unentschuldigter Abwesenheit.';
      case 'entschuldigt':
        return 'Schüler*innen mit entschuldigter Abwesenheit.';
      case 'ausstehend':
        return 'Schüler*innen, deren Anwesenheitsstatus noch nicht erfasst wurde.';
      case 'anwesend':
        return 'Alle Schüler*innen, die heute als anwesend markiert wurden.';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getStatusIcon(status)}</span>
              <DialogTitle className="text-xl">{getStatusTitle(status)}</DialogTitle>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {getStatusCount()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex gap-3">
            <Input 
              placeholder="Nach Name suchen..." 
              className="flex-1"
            />
            <Select defaultValue="alle-klassen">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle-klassen">Alle Klassen</SelectItem>
                <SelectItem value="1a">1A</SelectItem>
                <SelectItem value="1b">1B</SelectItem>
                <SelectItem value="2a">2A</SelectItem>
                <SelectItem value="2b">2B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Student List */}
          <div className="overflow-y-auto max-h-96">
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
                <div className="col-span-2">Schüler*in</div>
                <div className="col-span-1">Klasse</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Kontakt</div>
                <div className="col-span-2">Letztes Update</div>
                <div className="col-span-2">Details</div>
                <div className="col-span-1">Aktion</div>
              </div>

              {/* Sample Students based on status */}
              {status === 'ueberfaellig' && (
                <>
                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Lena Müller</div>
                    <div className="col-span-1">3A</div>
                    <div className="col-span-2">
                      <Badge className="bg-red-100 text-red-700 text-xs">15 Min</Badge>
                      <span className="text-xs text-gray-500 ml-1">(seit 15:45)</span>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">Letzte Notiz:</div>
                      <div className="text-xs">0523 (AG) Anruf bei Eltern - mailbox erreicht</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">Keine Hortbetreuung</div>
                      <div className="text-xs text-red-600">Kein Hort</div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button size="sm" variant="outline">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Auschecken
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Tim Weber</div>
                    <div className="col-span-1">4B</div>
                    <div className="col-span-2">
                      <Badge className="bg-red-100 text-red-700 text-xs">10 Min</Badge>
                      <span className="text-xs text-gray-500 ml-1">(seit 16:10)</span>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">Letzte Notiz:</div>
                      <div className="text-xs">1613 (TH): Eltern erreicht - kommen in 15 Minuten</div>
                      <div className="text-xs text-gray-500">+1 weitere Notiz</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">Eltern kontaktiert</div>
                      <div className="text-xs text-green-600">Kein Hort</div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button size="sm" variant="outline">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Auschecken
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Emma Fischer</div>
                    <div className="col-span-1">5A</div>
                    <div className="col-span-2">
                      <Badge className="bg-red-100 text-red-700 text-xs">35 Min</Badge>
                      <span className="text-xs text-gray-500 ml-1">(seit 16:20)</span>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">Geschwisterkind noch in der Schule</div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button size="sm" variant="outline">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Auschecken
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {status === 'unentschuldigt' && (
                <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                  <div className="col-span-2 font-medium">Emma Fischer</div>
                  <div className="col-span-1">4B</div>
                  <div className="col-span-2">
                    <Badge className="bg-red-100 text-red-700">Unentschuldigt</Badge>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs">
                      <Phone className="w-3 h-3 inline mr-1" />
                      0567 890123
                    </div>
                    <div className="text-xs text-red-600">Notfall: 0567 890123</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs">09:00</div>
                    <div className="text-xs text-gray-500">Auto</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">Letzte Notiz:</div>
                    <div className="text-xs">1621 (AG): Notfallkontakt erreicht - Eltern informiert</div>
                    <div className="text-xs text-gray-500">+1 weitere Notiz</div>
                  </div>
                  <div className="col-span-1">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Aktion
                    </Button>
                  </div>
                </div>
              )}

              {status === 'entschuldigt' && (
                <>
                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Clara Weber</div>
                    <div className="col-span-1">3A</div>
                    <div className="col-span-2">
                      <Badge className="bg-blue-100 text-blue-700">Entschuldigt</Badge>
                    </div>
                    <div className="col-span-2">07:45 MW</div>
                    <div className="col-span-2">Arzttermin</div>
                    <div className="col-span-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Aktion
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Hannah Bauer</div>
                    <div className="col-span-1">4B</div>
                    <div className="col-span-2">
                      <Badge className="bg-blue-100 text-blue-700">Entschuldigt</Badge>
                    </div>
                    <div className="col-span-2">07:30 Eltern</div>
                    <div className="col-span-2">Familiärer Termin</div>
                    <div className="col-span-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Aktion
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {status === 'ausstehend' && (
                <>
                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Ben Müller</div>
                    <div className="col-span-1">4B</div>
                    <div className="col-span-2">
                      <Badge className="bg-orange-100 text-orange-700">Ausstehend</Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">
                        <Phone className="w-3 h-3 inline mr-1" />
                        0234 567890
                      </div>
                      <div className="text-xs text-red-600">Notfall: 0234 567891</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">08:00</div>
                      <div className="text-xs text-gray-500">Auto</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">Letzte Notiz:</div>
                      <div className="text-xs">1006 (TH): Anruf bei Eltern - mailbox besprochen</div>
                    </div>
                    <div className="col-span-1">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Aktion
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Greta Wolf</div>
                    <div className="col-span-1">5A</div>
                    <div className="col-span-2">
                      <Badge className="bg-orange-100 text-orange-700">Ausstehend</Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">
                        <Phone className="w-3 h-3 inline mr-1" />
                        0789 012345
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">08:00</div>
                      <div className="text-xs text-gray-500">Auto</div>
                    </div>
                    <div className="col-span-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Aktion
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Igor Petrov</div>
                    <div className="col-span-1">3A</div>
                    <div className="col-span-2">
                      <Badge className="bg-orange-100 text-orange-700">Ausstehend</Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">
                        <Phone className="w-3 h-3 inline mr-1" />
                        0901 234567
                      </div>
                      <div className="text-xs text-red-600">Notfall: 0901 234568</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">08:00</div>
                      <div className="text-xs text-gray-500">Auto</div>
                    </div>
                    <div className="col-span-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Aktion
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {status === 'anwesend' && (
                <>
                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Anna Schmidt</div>
                    <div className="col-span-1">3A</div>
                    <div className="col-span-2">
                      <Badge className="bg-green-100 text-green-700">Anwesend</Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">08:15</div>
                      <div className="text-xs text-gray-500">MS</div>
                    </div>
                    <div className="col-span-2">Ankunft: 08:10</div>
                    <div className="col-span-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Aktion
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">David Klein</div>
                    <div className="col-span-1">3A</div>
                    <div className="col-span-2">
                      <Badge className="bg-green-100 text-green-700">Anwesend</Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">08:10</div>
                      <div className="text-xs text-gray-500">MS</div>
                    </div>
                    <div className="col-span-2">Ankunft: 08:05</div>
                    <div className="col-span-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Aktion
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Felix Meyer</div>
                    <div className="col-span-1">3A</div>
                    <div className="col-span-2">
                      <Badge className="bg-green-100 text-green-700">Anwesend</Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">08:20</div>
                      <div className="text-xs text-gray-500">MS</div>
                    </div>
                    <div className="col-span-2">Ankunft: 08:15</div>
                    <div className="col-span-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Aktion
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                    <div className="col-span-2 font-medium">Jana Hoffmann</div>
                    <div className="col-span-1">5A</div>
                    <div className="col-span-2">
                      <Badge className="bg-green-100 text-green-700">Anwesend</Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">08:25</div>
                      <div className="text-xs text-gray-500">MS</div>
                    </div>
                    <div className="col-span-2">Ankunft: 08:20</div>
                    <div className="col-span-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Aktion
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="text-sm text-gray-600">
                {getDescription(status)}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
