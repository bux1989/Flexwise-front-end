import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Phone, MessageSquare, Mail, Clock, UserCheck, ChevronUp, ChevronDown } from 'lucide-react';

interface AttendanceDetailViewProps {
  status: string;
  onBack: () => void;
}

export function AttendanceDetailView({ status, onBack }: AttendanceDetailViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('alle-klassen');
  const [sortField, setSortField] = useState<'name' | 'klasse' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sample student data based on status
  const allStudents = useMemo(() => {
    const baseStudents = {
      ueberfaellig: [
        { id: '1', name: 'Lena Müller', klasse: '3A', status: 'Überfällig', time: '15 Min', details: 'Keine Hortbetreuung', contact: '0523 (AG) Anruf bei Eltern' },
        { id: '2', name: 'Tim Weber', klasse: '4B', status: 'Überfällig', time: '10 Min', details: 'Eltern kontaktiert', contact: '1613 (TH): Eltern erreicht' },
        { id: '3', name: 'Emma Fischer', klasse: '5A', status: 'Überfällig', time: '35 Min', details: 'Geschwisterkind noch in der Schule', contact: '' }
      ],
      unentschuldigt: [
        { id: '4', name: 'Emma Fischer', klasse: '4B', status: 'Unentschuldigt', time: '09:00', details: 'Auto', contact: '1621 (AG): Notfallkontakt erreicht' }
      ],
      entschuldigt: [
        { id: '5', name: 'Clara Weber', klasse: '3A', status: 'Entschuldigt', time: '07:45 MW', details: 'Arzttermin', contact: '' },
        { id: '6', name: 'Hannah Bauer', klasse: '4B', status: 'Entschuldigt', time: '07:30 Eltern', details: 'Familiärer Termin', contact: '' }
      ],
      ausstehend: [
        { id: '7', name: 'Ben Müller', klasse: '4B', status: 'Ausstehend', time: '08:00', details: 'Auto', contact: '1006 (TH): Anruf bei Eltern' },
        { id: '8', name: 'Greta Wolf', klasse: '5A', status: 'Ausstehend', time: '08:00', details: 'Auto', contact: '' },
        { id: '9', name: 'Igor Petrov', klasse: '3A', status: 'Ausstehend', time: '08:00', details: 'Auto', contact: '' }
      ],
      anwesend: [
        { id: '10', name: 'Anna Schmidt', klasse: '3A', status: 'Anwesend', time: '08:15', details: 'Ankunft: 08:10', contact: 'MS' },
        { id: '11', name: 'David Klein', klasse: '3A', status: 'Anwesend', time: '08:10', details: 'Ankunft: 08:05', contact: 'MS' },
        { id: '12', name: 'Felix Meyer', klasse: '3A', status: 'Anwesend', time: '08:20', details: 'Ankunft: 08:15', contact: 'MS' },
        { id: '13', name: 'Jana Hoffmann', klasse: '5A', status: 'Anwesend', time: '08:25', details: 'Ankunft: 08:20', contact: 'MS' }
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
    let filtered = allStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'alle-klassen' || student.klasse === selectedClass;
      return matchesSearch && matchesClass;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField].toLowerCase();
        const bValue = b[sortField].toLowerCase();
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filtered;
  }, [allStudents, searchTerm, selectedClass, sortField, sortDirection]);

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
        return 'Schüler*innen';
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
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
              <button
                className="col-span-2 text-left hover:text-gray-900 flex items-center gap-1"
                onClick={() => handleSort('name')}
              >
                Schüler*in {getSortIcon('name')}
              </button>
              <button
                className="col-span-1 text-left hover:text-gray-900 flex items-center gap-1"
                onClick={() => handleSort('klasse')}
              >
                Klasse {getSortIcon('klasse')}
              </button>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Kontakt</div>
              <div className="col-span-2">Letztes Update</div>
              <div className="col-span-2">Details</div>
              <div className="col-span-1">Aktion</div>
            </div>

            {/* Dynamic Student List */}
            {filteredAndSortedStudents.map((student) => (
              <div key={student.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                <div className="col-span-2 font-medium">{student.name}</div>
                <div className="col-span-1">{student.klasse}</div>
                <div className="col-span-2">
                  <Badge className={`${
                    student.status === 'Überfällig' ? 'bg-red-100 text-red-700' :
                    student.status === 'Unentschuldigt' ? 'bg-red-100 text-red-700' :
                    student.status === 'Entschuldigt' ? 'bg-blue-100 text-blue-700' :
                    student.status === 'Ausstehend' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {student.status}
                  </Badge>
                  {student.status === 'Überfällig' && (
                    <span className="text-xs text-gray-500 ml-1">(seit 15:45)</span>
                  )}
                </div>
                <div className="col-span-2">
                  <div className="text-xs">{student.time}</div>
                  {student.contact && (
                    <div className="text-xs text-gray-500">{student.contact}</div>
                  )}
                </div>
                <div className="col-span-2">
                  <div className="text-xs">{student.details}</div>
                  {student.status === 'Überfällig' && student.name === 'Lena Müller' && (
                    <div className="text-xs text-red-600">Kein Hort</div>
                  )}
                  {student.status === 'Überfällig' && student.name === 'Tim Weber' && (
                    <div className="text-xs text-green-600">Kein Hort</div>
                  )}
                </div>
                <div className="col-span-2">
                  {student.status === 'Überfällig' ? (
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
                  ) : (
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Aktion
                    </Button>
                  )}
                </div>
                <div className="col-span-1">
                  {student.status === 'Überfällig' ? (
                    <Button size="sm" variant="outline">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Auschecken
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Aktion
                    </Button>
                  )}
                </div>
              </div>
            ))}

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
    </div>
  );
}
