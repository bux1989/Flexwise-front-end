import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ArrowLeft, Search, Clock, Phone, UserX, ExternalLink, FileText } from 'lucide-react';
import { StudentNotesDialog } from './StudentNotesDialog';

interface StudentNote {
  id: string;
  content: string;
  timestamp: string;
  staffInitials: string;
  staffName: string;
}

interface OverdueStudent {
  id: string;
  name: string;
  class: string;
  pickupTime: string;
  since: string;
  contactInfo: {
    phone?: string;
    emergency?: string;
  };
  note: string;
  hasHortBooking: boolean;
  notes: StudentNote[];
}

interface OverdueStudentsDetailProps {
  onBack: () => void;
  onCheckOut: (studentId: string) => void;
}

export function OverdueStudentsDetail({ onBack, onCheckOut }: OverdueStudentsDetailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [students, setStudents] = useState<OverdueStudent[]>([]);

  // Initialize students data on mount
  React.useEffect(() => {
    const initialStudents: OverdueStudent[] = [
      {
        id: '1',
        name: 'Lena Müller',
        class: '3A',
        pickupTime: '15:30',
        since: '15:45',
        contactInfo: {
          phone: '+49 123 456789',
          emergency: '+49 987 654321'
        },
        note: 'Keine Hortbuchung',
        hasHortBooking: false,
        notes: [
          {
            id: '1-1',
            content: 'Anruf bei Mutter - mailbox erreicht',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
            staffInitials: 'MS',
            staffName: 'Maria Schmidt'
          }
        ]
      },
      {
        id: '2',
        name: 'Tim Weber',
        class: '4B',
        pickupTime: '16:00',
        since: '16:10',
        contactInfo: {
          phone: '+49 111 222333'
        },
        note: 'Eltern kontaktiert',
        hasHortBooking: false,
        notes: [
          {
            id: '2-1',
            content: 'Eltern erreicht - kommen in 15 Minuten',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
            staffInitials: 'TH',
            staffName: 'Thomas Hoffmann'
          },
          {
            id: '2-2',  
            content: 'Erstkontakt - niemand erreicht',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min ago
            staffInitials: 'MS',
            staffName: 'Maria Schmidt'
          }
        ]
      },
      {
        id: '3',
        name: 'Emma Fischer',
        class: '3A',
        pickupTime: '15:45',
        since: '16:20',
        contactInfo: {
          phone: '+49 444 555666',
          emergency: '+49 777 888999'
        },
        note: 'Geschwisterkind noch in der Schule',
        hasHortBooking: true,
        notes: []
      }
    ];
    setStudents(initialStudents);
  }, []);

  const overdueStudents = students;

  const classes = ['1A', '1B', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '5A', '5B', '6A', '6B'];

  const filteredStudents = overdueStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || student.class === classFilter;
    return matchesSearch && matchesClass;
  });

  const getTimeDifference = (since: string, pickup: string) => {
    // Calculate minutes overdue (simplified)
    const sinceTime = since.split(':').map(Number);
    const pickupTime = pickup.split(':').map(Number);
    const sinceMinutes = sinceTime[0] * 60 + sinceTime[1];
    const pickupMinutes = pickupTime[0] * 60 + pickupTime[1];
    const diff = sinceMinutes - pickupMinutes;
    return `${diff} Min`;
  };

  const handleAddNote = (studentId: string, content: string) => {
    const newNote: StudentNote = {
      id: `${studentId}-${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
      staffInitials: 'MS', // In real app, this would come from current user
      staffName: 'Maria Schmidt' // In real app, this would come from current user
    };

    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, notes: [newNote, ...student.notes] }
        : student
    ));
  };

  const getLatestNote = (notes: StudentNote[]) => {
    if (notes.length === 0) return null;
    return notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const formatNotePreview = (note: StudentNote) => {
    const date = new Date(note.timestamp);
    const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return `${timeStr} (${note.staffInitials}): ${note.content}`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Überfällige Kinder (nach Entlasszeit)
          </CardTitle>
        </div>
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" />
          {filteredStudents.length} Überfällig
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nach Name suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Klassen</SelectItem>
              {classes.map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Students Table */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>
              {searchTerm || classFilter !== 'all' 
                ? 'Keine Schüler*innen gefunden mit den aktuellen Filtern.'
                : 'Keine Überfälligen – alles im grünen Bereich.'
              }
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schüler*in</TableHead>
                  <TableHead>Klasse</TableHead>
                  <TableHead>Sollte abgeholt werden</TableHead>
                  <TableHead>Überfällig seit</TableHead>
                  <TableHead>Hinweis</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.class}</Badge>
                    </TableCell>
                    <TableCell>{student.pickupTime} Uhr</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {getTimeDifference(student.since, student.pickupTime)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          (seit {student.since})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{student.note}</span>
                          {!student.hasHortBooking && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              Kein Hort
                            </Badge>
                          )}
                        </div>
                        {student.notes.length > 0 && (
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                            <div className="font-medium mb-1">Letzte Notiz:</div>
                            <div>{formatNotePreview(getLatestNote(student.notes)!)}</div>
                            {student.notes.length > 1 && (
                              <div className="mt-1 text-xs">
                                +{student.notes.length - 1} weitere Notiz{student.notes.length > 2 ? 'en' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {student.contactInfo.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title={`Anrufen: ${student.contactInfo.phone}`}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                        {student.contactInfo.emergency && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600"
                            title={`Notfallkontakt: ${student.contactInfo.emergency}`}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                        <StudentNotesDialog
                          studentName={student.name}
                          notes={student.notes}
                          onAddNote={(content) => handleAddNote(student.id, content)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCheckOut(student.id)}
                          className="gap-1 text-xs"
                        >
                          <UserX className="h-3 w-3" />
                          Auschecken
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium mb-1">Überfällige Kinder</p>
              <p className="text-sm text-muted-foreground">
                Diese Kinder sollten bereits abgeholt worden sein. Kontaktieren Sie bei Bedarf die Eltern 
                oder checken Sie die Kinder manuell aus, wenn sie abgeholt wurden.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}