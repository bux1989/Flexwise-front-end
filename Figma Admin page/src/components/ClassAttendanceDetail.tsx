import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface Student {
  name: string;
  status: 'anwesend' | 'ausstehend' | 'entschuldigt' | 'unentschuldigt';
  lastUpdate: {
    time: string;
    by: string;
  };
  note?: string;
}

interface ClassAttendanceDetailProps {
  className: string;
  onBack: () => void;
  onNavigateToCheckInOut: () => void;
}

export function ClassAttendanceDetail({ className, onBack, onNavigateToCheckInOut }: ClassAttendanceDetailProps) {
  const students: Student[] = [
    {
      name: 'Anna Schmidt',
      status: 'anwesend',
      lastUpdate: { time: '08:15', by: 'MS' },
    },
    {
      name: 'Ben Müller',
      status: 'ausstehend',
      lastUpdate: { time: '08:00', by: 'Auto' },
    },
    {
      name: 'Clara Weber',
      status: 'entschuldigt',
      lastUpdate: { time: '07:45', by: 'MW' },
      note: 'Arzttermin'
    },
    {
      name: 'David Klein',
      status: 'anwesend',
      lastUpdate: { time: '08:10', by: 'MS' },
    },
    {
      name: 'Emma Fischer',
      status: 'unentschuldigt',
      lastUpdate: { time: '09:00', by: 'Auto' },
      note: 'Nicht erschienen'
    }
  ];

  const getStatusBadge = (status: string) => {
    const configs = {
      anwesend: { label: 'Anwesend', className: 'bg-green-50 text-green-700' },
      ausstehend: { label: 'Ausstehend', className: 'bg-orange-50 text-orange-700' },
      entschuldigt: { label: 'Entschuldigt', className: 'bg-blue-50 text-blue-700' },
      unentschuldigt: { label: 'Unentschuldigt', className: 'bg-red-50 text-red-700' }
    };

    const config = configs[status as keyof typeof configs] || configs.ausstehend;
    
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Tagesansicht – Klasse {className}</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={onNavigateToCheckInOut} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Zur Check In/Out
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schüler*in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Letztes Update</TableHead>
                <TableHead>Hinweis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{student.lastUpdate.time}</div>
                      <div className="text-muted-foreground">{student.lastUpdate.by}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.note && (
                      <span className="text-sm text-muted-foreground">{student.note}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Diese Ansicht ist schreibgeschützt im Admin-Dashboard. 
            Änderungen können über "Check In/Out" vorgenommen werden.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}