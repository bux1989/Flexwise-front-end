import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ArrowLeft, Search, CheckCircle, Clock, UserCheck, UserX, AlertCircle, Phone, FileText } from 'lucide-react';
import { StudentNotesDialog } from './StudentNotesDialog';
import { StudentActionDropdown } from './StudentActionDropdown';

interface StudentNote {
  id: string;
  content: string;
  timestamp: string;
  staffInitials: string;
  staffName: string;
}

interface Student {
  id: string;
  name: string;
  class: string;
  status: 'anwesend' | 'ausstehend' | 'entschuldigt' | 'unentschuldigt';
  lastUpdate: {
    time: string;
    by: string;
  };
  note?: string;
  arrivalTime?: string;
  contact?: {
    phone: string;
    email?: string;
    emergency?: string;
  };
  notes?: StudentNote[];
}

interface AttendanceStatusDetailProps {
  status: string;
  onBack: () => void;
  onUpdateStatus: (studentId: string, action: string, details?: { status?: string; reason?: string }) => void;
}

export function AttendanceStatusDetail({ status, onBack, onUpdateStatus }: AttendanceStatusDetailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [students, setStudents] = useState<Student[]>([]);

  // Initialize students data on mount
  React.useEffect(() => {
    const baseStudents: Student[] = [
      { 
        id: '1', 
        name: 'Anna Schmidt', 
        class: '3A', 
        status: 'anwesend', 
        lastUpdate: { time: '08:15', by: 'MS' }, 
        arrivalTime: '08:10',
        contact: { phone: '0123 456789', email: 'a.schmidt@email.de' },
        notes: []
      },
      { 
        id: '2', 
        name: 'Ben Müller', 
        class: '4B', 
        status: 'ausstehend', 
        lastUpdate: { time: '08:00', by: 'Auto' },
        contact: { phone: '0234 567890', email: 'b.mueller@email.de', emergency: '0234 567891' },
        notes: [
          {
            id: '2-1',
            content: 'Anruf bei Eltern - mailbox besprochen',
            timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
            staffInitials: 'TH',
            staffName: 'Thomas Hoffmann'
          }
        ]
      },
      { 
        id: '3', 
        name: 'Clara Weber', 
        class: '3A', 
        status: 'entschuldigt', 
        lastUpdate: { time: '07:45', by: 'MW' }, 
        note: 'Arzttermin',
        contact: { phone: '0345 678901', email: 'c.weber@email.de' },
        notes: []
      },
      { 
        id: '4', 
        name: 'David Klein', 
        class: '5A', 
        status: 'anwesend', 
        lastUpdate: { time: '08:10', by: 'MS' }, 
        arrivalTime: '08:05',
        contact: { phone: '0456 789012', email: 'd.klein@email.de' },
        notes: []
      },
      { 
        id: '5', 
        name: 'Emma Fischer', 
        class: '4B', 
        status: 'unentschuldigt', 
        lastUpdate: { time: '09:00', by: 'Auto' }, 
        note: 'Nicht erschienen',
        contact: { phone: '0567 890123', email: 'e.fischer@email.de', emergency: '0567 890124' },
        notes: [
          {
            id: '5-1',
            content: 'Notfallkontakt erreicht - Eltern informiert',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            staffInitials: 'MS',
            staffName: 'Maria Schmidt'
          },
          {
            id: '5-2',
            content: 'Erstkontakt - niemand erreicht',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            staffInitials: 'TH',
            staffName: 'Thomas Hoffmann'
          }
        ]
      },
      { 
        id: '6', 
        name: 'Felix Meyer', 
        class: '3A', 
        status: 'anwesend', 
        lastUpdate: { time: '08:20', by: 'MS' }, 
        arrivalTime: '08:15',
        contact: { phone: '0678 901234', email: 'f.meyer@email.de' },
        notes: []
      },
      { 
        id: '7', 
        name: 'Greta Wolf', 
        class: '5A', 
        status: 'ausstehend', 
        lastUpdate: { time: '08:00', by: 'Auto' },
        contact: { phone: '0789 012345', email: 'g.wolf@email.de' },
        notes: []
      },
      { 
        id: '8', 
        name: 'Hannah Bauer', 
        class: '4B', 
        status: 'entschuldigt', 
        lastUpdate: { time: '07:30', by: 'Eltern' }, 
        note: 'Familiärer Termin',
        contact: { phone: '0890 123456', email: 'h.bauer@email.de' },
        notes: []
      },
      { 
        id: '9', 
        name: 'Igor Petrov', 
        class: '3A', 
        status: 'ausstehend', 
        lastUpdate: { time: '08:00', by: 'Auto' },
        contact: { phone: '0901 234567', email: 'i.petrov@email.de', emergency: '0901 234568' },
        notes: []
      },
      { 
        id: '10', 
        name: 'Jana Hoffmann', 
        class: '5A', 
        status: 'anwesend', 
        lastUpdate: { time: '08:25', by: 'MS' }, 
        arrivalTime: '08:20',
        contact: { phone: '0012 345678', email: 'j.hoffmann@email.de' },
        notes: []
      }
    ];

    const filteredStudents = baseStudents.filter(student => student.status === status);
    setStudents(filteredStudents);
  }, [status]);
  const classes = ['1A', '1B', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '5A', '5B', '6A', '6B'];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || student.class === classFilter;
    return matchesSearch && matchesClass;
  });

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
        ? { ...student, notes: [newNote, ...(student.notes || [])] }
        : student
    ));
  };

  const getLatestNote = (notes: StudentNote[] = []) => {
    if (notes.length === 0) return null;
    return notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const formatNotePreview = (note: StudentNote) => {
    const date = new Date(note.timestamp);
    const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return `${timeStr} (${note.staffInitials}): ${note.content}`;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      anwesend: { 
        label: 'Anwesende Schüler*innen', 
        icon: CheckCircle, 
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Alle Schüler*innen, die heute als anwesend markiert wurden.'
      },
      ausstehend: { 
        label: 'Ausstehende Schüler*innen', 
        icon: Clock, 
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        description: 'Schüler*innen, deren Anwesenheitsstatus noch nicht erfasst wurde.'
      },
      entschuldigt: { 
        label: 'Entschuldigte Schüler*innen', 
        icon: UserCheck, 
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Schüler*innen mit entschuldigter Abwesenheit.'
      },
      unentschuldigt: { 
        label: 'Unentschuldigte Schüler*innen', 
        icon: UserX, 
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        description: 'Schüler*innen mit unentschuldigter Abwesenheit.'
      }
    };

    return configs[status as keyof typeof configs] || configs.ausstehend;
  };

  const getStatusBadge = (studentStatus: string) => {
    const configs = {
      anwesend: { label: 'Anwesend', className: 'bg-green-50 text-green-700' },
      ausstehend: { label: 'Ausstehend', className: 'bg-orange-50 text-orange-700' },
      entschuldigt: { label: 'Entschuldigt', className: 'bg-blue-50 text-blue-700' },
      unentschuldigt: { label: 'Unentschuldigt', className: 'bg-red-50 text-red-700' }
    };

    const config = configs[studentStatus as keyof typeof configs] || configs.ausstehend;
    
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  
  // Check if contact information should be displayed
  const shouldShowContact = status === 'unentschuldigt' || status === 'ausstehend';
  
  // Check if notes functionality should be available
  const shouldShowNotes = status === 'unentschuldigt' || status === 'ausstehend';

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            {statusConfig.label}
          </CardTitle>
        </div>
        <Badge variant="secondary" className={`gap-1 ${statusConfig.bgColor} ${statusConfig.color}`}>
          <StatusIcon className="h-3 w-3" />
          {filteredStudents.length} Schüler*innen
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
            <StatusIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>
              {searchTerm || classFilter !== 'all' 
                ? 'Keine Schüler*innen gefunden mit den aktuellen Filtern.'
                : `Keine ${statusConfig.label.toLowerCase()}.`
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
                  <TableHead>Status</TableHead>
                  {shouldShowContact && <TableHead>Kontakt</TableHead>}
                  <TableHead>Letztes Update</TableHead>
                  <TableHead>Details</TableHead>
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
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    {shouldShowContact && (
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {student.contact?.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{student.contact.phone}</span>
                            </div>
                          )}
                          {student.contact?.emergency && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-red-500" />
                              <span className="text-red-600 text-xs">Notfall: {student.contact.emergency}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="text-sm">
                        <div>{student.lastUpdate.time}</div>
                        <div className="text-muted-foreground">{student.lastUpdate.by}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {student.arrivalTime && (
                            <div className="text-muted-foreground">Ankunft: {student.arrivalTime}</div>
                          )}
                          {student.note && (
                            <div className="text-muted-foreground">{student.note}</div>
                          )}
                        </div>
                        {shouldShowNotes && student.notes && student.notes.length > 0 && (
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
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {shouldShowNotes && (
                          <StudentNotesDialog
                            studentName={student.name}
                            notes={student.notes || []}
                            onAddNote={(content) => handleAddNote(student.id, content)}
                          />
                        )}
                        <StudentActionDropdown
                          studentId={student.id}
                          studentName={student.name}
                          onAction={onUpdateStatus}
                        />
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
            <StatusIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium mb-1">{statusConfig.label}</p>
              <p className="text-sm text-muted-foreground">
                {statusConfig.description}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}