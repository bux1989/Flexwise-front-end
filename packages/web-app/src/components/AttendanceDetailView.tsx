import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Phone, MessageSquare, Mail, Clock, UserCheck, ChevronUp, ChevronDown, Plus, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';

interface Contact {
  phone: string;
  name: string;
  relation: string;
}

interface LastUpdate {
  time: string;
  author: string;
  action: string;
}

interface Comment {
  time: string;
  author: string;
  text: string;
}

interface Student {
  id: string;
  name: string;
  klasse: string;
  status: string;
  time: string;
  contact: Contact;
  lastUpdate: LastUpdate | null;
  comments: Comment[];
  hasMoreComments: boolean;
  [key: string]: any; // Allow indexing for sorting
}

interface AttendanceDetailViewProps {
  status: string;
  onBack: () => void;
}

export function AttendanceDetailView({ status, onBack }: AttendanceDetailViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('alle-klassen');
  const [sortField, setSortField] = useState<'name' | 'klasse' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [noteModal, setNoteModal] = useState<{ isOpen: boolean; studentId: string | null }>({
    isOpen: false,
    studentId: null
  });
  const [newNote, setNewNote] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [studentComments, setStudentComments] = useState<{ [key: string]: Comment[] }>({});
  const [studentUpdates, setStudentUpdates] = useState<{ [key: string]: Student }>({});

  // Sample student data based on status
  const allStudents = useMemo(() => {
    const baseStudents = {
      ueberfaellig: [
        {
          id: '1',
          name: 'Lena Müller',
          klasse: '3A',
          status: 'Überfällig',
          time: '15 Min',
          contact: { phone: '0152 29749821', name: 'Ella Schulz', relation: 'Mutter' },
          lastUpdate: { time: '15:30', author: 'MW', action: 'Als anwesend markiert' },
          comments: [
            { time: '15:45', author: 'AG', text: 'Anruf bei Eltern - mailbox erreicht' },
            { time: '15:30', author: 'MW', text: 'Kind wartet noch auf Abholung' }
          ],
          hasMoreComments: true
        },
        {
          id: '2',
          name: 'Tim Weber',
          klasse: '4B',
          status: 'Überfällig',
          time: '10 Min',
          contact: { phone: '0173 8547392', name: 'Maria Weber', relation: 'Mutter' },
          lastUpdate: { time: '16:00', author: 'TH', action: 'Als anwesend markiert' },
          comments: [
            { time: '16:13', author: 'TH', text: 'Eltern erreicht - kommen in 15 Minuten' },
            { time: '16:05', author: 'MW', text: 'Versuch Eltern zu kontaktieren' }
          ],
          hasMoreComments: true
        },
        {
          id: '3',
          name: 'Emma Fischer',
          klasse: '5A',
          status: 'Überfällig',
          time: '35 Min',
          contact: { phone: '0160 3729485', name: 'Stefan Fischer', relation: 'Vater' },
          lastUpdate: { time: '15:45', author: 'AG', action: 'Als anwesend markiert' },
          comments: [
            { time: '16:20', author: 'AG', text: 'Geschwisterkind noch in der Schule' }
          ],
          hasMoreComments: false
        }
      ],
      unentschuldigt: [
        {
          id: '4',
          name: 'Emma Fischer',
          klasse: '4B',
          status: 'Unentschuldigt',
          time: '09:00',
          contact: { phone: '0567 890123', name: 'Sandra Fischer', relation: 'Mutter' },
          lastUpdate: null,
          comments: [
            { time: '16:21', author: 'AG', text: 'Notfallkontakt erreicht - Eltern informiert' },
            { time: '09:30', author: 'MW', text: 'Kind nicht erschienen' }
          ],
          hasMoreComments: true
        }
      ],
      entschuldigt: [
        {
          id: '5',
          name: 'Clara Weber',
          klasse: '3A',
          status: 'Entschuldigt',
          time: '07:45',
          contact: { phone: '0178 4562893', name: 'Anna Weber', relation: 'Mutter' },
          lastUpdate: { time: '07:45', author: 'MW', action: 'Als entschuldigt markiert' },
          comments: [
            { time: '07:45', author: 'MW', text: 'Arzttermin - Eltern haben angerufen' }
          ],
          hasMoreComments: false
        },
        {
          id: '6',
          name: 'Hannah Bauer',
          klasse: '4B',
          status: 'Entschuldigt',
          time: '07:30',
          contact: { phone: '0151 7394852', name: 'Thomas Bauer', relation: 'Vater' },
          lastUpdate: { time: '07:30', author: 'TH', action: 'Als entschuldigt markiert' },
          comments: [
            { time: '07:30', author: 'TH', text: 'Familiärer Termin - Eltern informiert' }
          ],
          hasMoreComments: false
        }
      ],
      ausstehend: [
        {
          id: '7',
          name: 'Ben Müller',
          klasse: '4B',
          status: 'Ausstehend',
          time: '08:00',
          contact: { phone: '0234 567890', name: 'Lisa Müller', relation: 'Mutter' },
          lastUpdate: null,
          comments: [
            { time: '10:06', author: 'TH', text: 'Anruf bei Eltern - mailbox besprochen' }
          ],
          hasMoreComments: false
        },
        {
          id: '8',
          name: 'Greta Wolf',
          klasse: '5A',
          status: 'Ausstehend',
          time: '08:00',
          contact: { phone: '0789 012345', name: 'Petra Wolf', relation: 'Mutter' },
          lastUpdate: null,
          comments: [],
          hasMoreComments: false
        },
        {
          id: '9',
          name: 'Igor Petrov',
          klasse: '3A',
          status: 'Ausstehend',
          time: '08:00',
          contact: { phone: '0901 234567', name: 'Anja Petrov', relation: 'Mutter' },
          lastUpdate: null,
          comments: [],
          hasMoreComments: false
        }
      ],
      anwesend: [
        {
          id: '10',
          name: 'Anna Schmidt',
          klasse: '3A',
          status: 'Anwesend',
          time: '08:15',
          contact: { phone: '0172 5849372', name: 'Julia Schmidt', relation: 'Mutter' },
          lastUpdate: { time: '08:15', author: 'MS', action: 'Als anwesend markiert' },
          comments: [
            { time: '08:10', author: 'MS', text: 'Ankunft: 08:10' }
          ],
          hasMoreComments: false
        },
        {
          id: '11',
          name: 'David Klein',
          klasse: '3A',
          status: 'Anwesend',
          time: '08:10',
          contact: { phone: '0163 7294853', name: 'Michael Klein', relation: 'Vater' },
          lastUpdate: { time: '08:10', author: 'MS', action: 'Als anwesend markiert' },
          comments: [
            { time: '08:05', author: 'MS', text: 'Ankunft: 08:05' }
          ],
          hasMoreComments: false
        },
        {
          id: '12',
          name: 'Felix Meyer',
          klasse: '3A',
          status: 'Anwesend',
          time: '08:20',
          contact: { phone: '0154 9384756', name: 'Sarah Meyer', relation: 'Mutter' },
          lastUpdate: { time: '08:20', author: 'MS', action: 'Als anwesend markiert' },
          comments: [
            { time: '08:15', author: 'MS', text: 'Ankunft: 08:15' }
          ],
          hasMoreComments: false
        },
        {
          id: '13',
          name: 'Jana Hoffmann',
          klasse: '5A',
          status: 'Anwesend',
          time: '08:25',
          contact: { phone: '0179 6482573', name: 'Nina Hoffmann', relation: 'Mutter' },
          lastUpdate: { time: '08:25', author: 'MS', action: 'Als anwesend markiert' },
          comments: [
            { time: '08:20', author: 'MS', text: 'Ankunft: 08:20' }
          ],
          hasMoreComments: false
        }
      ]
    };
    return baseStudents[status as keyof typeof baseStudents] || [];
  }, [status]);

  // Get unique classes for dropdown
  const availableClasses = useMemo(() => {
    const classes = [...new Set(allStudents.map(student => student.klasse))].sort();
    return classes;
  }, [allStudents]);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    // Merge original students with any updates
    const studentsWithUpdates = allStudents.map(student =>
      studentUpdates[student.id] || student
    );

    let filtered = studentsWithUpdates.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'alle-klassen' || student.klasse === selectedClass;
      return matchesSearch && matchesClass;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = (a[sortField] as string).toLowerCase();
        const bValue = (b[sortField] as string).toLowerCase();
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filtered;
  }, [allStudents, searchTerm, selectedClass, sortField, sortDirection, studentUpdates]);

  const handleSort = (field: 'name' | 'klasse') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'klasse') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const handleOpenNoteModal = (studentId: string) => {
    setNoteModal({ isOpen: true, studentId });
    setNewNote('');
  };

  const handleCloseNoteModal = () => {
    setNoteModal({ isOpen: false, studentId: null });
    setNewNote('');
  };

  const handleSaveNote = () => {
    if (!noteModal.studentId || !newNote.trim()) return;

    // Create new comment with current timestamp and user abbreviation
    const now = new Date();
    const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    const newComment: Comment = {
      time: timeString,
      author: 'AG', // Current user abbreviation - in a real app this would come from user context
      text: newNote.trim()
    };

    // Add comment to student's comments
    setStudentComments(prev => ({
      ...prev,
      [noteModal.studentId!]: [...(prev[noteModal.studentId!] || []), newComment]
    }));

    // Expand comments to show the new one
    setExpandedComments(prev => new Set([...prev, noteModal.studentId!]));

    console.log('Saving note for student:', noteModal.studentId, 'Note:', newNote);
    handleCloseNoteModal();
  };

  const handleStatusChange = (studentId: string, newStatus: string) => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student || student.status === newStatus) return;

    // Create timestamp and user info for the update
    const now = new Date();
    const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const userAbbreviation = 'AG'; // Current user abbreviation

    // Create new last update
    const newLastUpdate: LastUpdate = {
      time: timeString,
      author: userAbbreviation,
      action: `Als ${newStatus.toLowerCase()} markiert`
    };

    // Update the student's status and last update
    const updatedStudent = {
      ...student,
      status: newStatus,
      lastUpdate: newLastUpdate
    };

    setStudentUpdates(prev => ({
      ...prev,
      [studentId]: updatedStudent
    }));

    console.log('Changing status for student:', studentId, 'to:', newStatus);
  };
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusIcon(status)}</span>
          <h1 className="text-2xl font-bold">{getStatusTitle(status)}</h1>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {filteredAndSortedStudents.length} {filteredAndSortedStudents.length === 1 ? 'Schüler*in' : 'Schüler*innen'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schüler*innen-Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex gap-3">
            <Input
              placeholder="Nach Name suchen..."
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle-klassen">Alle Klassen</SelectItem>
                {availableClasses.map((klasse) => (
                  <SelectItem key={klasse} value={klasse}>{klasse}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student List */}
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 border-b pb-2">
              <button
                className="col-span-1 text-left hover:text-gray-900 flex items-center gap-1 text-xs"
                onClick={() => handleSort('name')}
              >
                Schüler*in {getSortIcon('name')}
              </button>
              <button
                className="col-span-1 text-left hover:text-gray-900 flex items-center gap-1 text-xs"
                onClick={() => handleSort('klasse')}
              >
                Klasse {getSortIcon('klasse')}
              </button>
              <div className="col-span-1 text-xs">Status</div>
              <div className="col-span-2 text-xs">Kontakt</div>
              <div className="col-span-2 text-xs">Letztes Update</div>
              <div className="col-span-3 text-xs">Details</div>
              <div className="col-span-2 text-xs">Aktion</div>
            </div>

            {/* Dynamic Student List */}
            {filteredAndSortedStudents.map((student) => {
              // Get updated student data if it exists
              const currentStudent = studentUpdates[student.id] || student;

              // Combine and sort comments by timestamp (newest first)
              const allComments = [...student.comments, ...(studentComments[student.id] || [])]
                .sort((a, b) => {
                  // Parse time strings for comparison (assuming HH:MM format)
                  const timeA = a.time.split(':').map(n => parseInt(n));
                  const timeB = b.time.split(':').map(n => parseInt(n));
                  const minutesA = timeA[0] * 60 + timeA[1];
                  const minutesB = timeB[0] * 60 + timeB[1];
                  return minutesB - minutesA; // Newest first
                });

              const isExpanded = expandedComments.has(student.id);
              const displayComments = isExpanded ? allComments : allComments.slice(0, 1);

              return (
                <div key={student.id} className="grid grid-cols-12 gap-2 items-center py-3 border-b border-gray-100">
                  <div className="col-span-1 font-medium text-sm">{currentStudent.name}</div>
                <div className="col-span-1 text-sm">{currentStudent.klasse}</div>
                <div className="col-span-1">
                  <Badge className={`text-xs ${
                    currentStudent.status === 'Überfällig' ? 'bg-red-100 text-red-700' :
                    currentStudent.status === 'Unentschuldigt' ? 'bg-red-100 text-red-700' :
                    currentStudent.status === 'Entschuldigt' ? 'bg-blue-100 text-blue-700' :
                    currentStudent.status === 'Ausstehend' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {currentStudent.status === 'Überfällig' ? 'Über.' :
                     currentStudent.status === 'Unentschuldigt' ? 'Unent.' :
                     currentStudent.status === 'Entschuldigt' ? 'Entsch.' :
                     currentStudent.status === 'Ausstehend' ? 'Ausst.' :
                     'Anwes.'}
                  </Badge>
                  {currentStudent.status === 'Überfällig' && (
                    <div className="text-xs text-gray-500">15:45</div>
                  )}
                </div>
                  {/* Contact Information */}
                <div className="col-span-2">
                  <div className="text-xs">
                    <div>{currentStudent.contact.phone}</div>
                    <div className="text-gray-600">{currentStudent.contact.name} ({currentStudent.contact.relation})</div>
                  </div>
                </div>
                {/* Last Update */}
                <div className="col-span-2">
                  {currentStudent.lastUpdate ? (
                    <div className="text-xs">
                      <div>{currentStudent.lastUpdate.time} {currentStudent.lastUpdate.author}</div>
                      <div className="text-gray-500">{currentStudent.lastUpdate.action}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </div>
                  {/* Details/Comments */}
                  <div className="col-span-3">
                    {allComments.length > 0 ? (
                      <div className="text-xs space-y-1">
                        {displayComments.map((comment, index) => (
                          <div key={index} className={index === 0 ? '' : 'text-gray-600'}>
                            {comment.time} ({comment.author}): {comment.text}
                          </div>
                        ))}
                        {allComments.length > 1 && (
                          <button
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            onClick={() => {
                              const newExpanded = new Set(expandedComments);
                              if (isExpanded) {
                                newExpanded.delete(student.id);
                              } else {
                                newExpanded.add(student.id);
                              }
                              setExpandedComments(newExpanded);
                            }}
                          >
                            <MoreHorizontal className="w-3 h-3" />
                            {isExpanded ? 'Weniger anzeigen' : `+${allComments.length - 1} weitere Notizen`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Keine Notizen</div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="col-span-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        title="Neue Notiz hinzufügen"
                        onClick={() => handleOpenNoteModal(student.id)}
                        className="px-2 py-1 h-8"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </Button>
                      <select
                        className="text-xs border rounded px-1 py-1 h-8 min-w-[70px]"
                        value={currentStudent.status}
                        onChange={(e) => handleStatusChange(student.id, e.target.value)}
                      >
                        <option value={currentStudent.status}>{currentStudent.status}</option>
                        {currentStudent.status !== 'Anwesend' && <option value="Anwesend">Anwesend</option>}
                        {currentStudent.status !== 'Entschuldigt' && <option value="Entschuldigt">Entschuldigt</option>}
                        {currentStudent.status !== 'Unentschuldigt' && <option value="Unentschuldigt">Unentschuldigt</option>}
                        {currentStudent.status !== 'Ausstehend' && <option value="Ausstehend">Ausstehend</option>}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* No results message */}
            {filteredAndSortedStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Keine Schüler*innen gefunden.</p>
                {searchTerm && (
                  <p className="text-sm mt-1">Versuchen Sie einen anderen Suchbegriff.</p>
                )}
              </div>
            )}
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
        </CardContent>
      </Card>

      {/* New Note Modal */}
      <Dialog open={noteModal.isOpen} onOpenChange={handleCloseNoteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Notiz hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Notiz für {filteredAndSortedStudents.find(s => s.id === noteModal.studentId)?.name}
              </label>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Geben Sie hier Ihre Notiz ein..."
                rows={4}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseNoteModal}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={!newNote.trim()}
              >
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
