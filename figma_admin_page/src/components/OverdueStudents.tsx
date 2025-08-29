import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Phone, ExternalLink, Clock } from 'lucide-react';

interface OverdueStudent {
  name: string;
  class: string;
  since: string;
  note: string;
  hasContact: boolean;
}

export function OverdueStudents({ onNavigateToCheckInOut }: { onNavigateToCheckInOut: (studentName: string) => void }) {
  const overdueStudents: OverdueStudent[] = [
    {
      name: 'Lena Müller',
      class: '3A',
      since: '15:45',
      note: 'Keine Hortbuchung',
      hasContact: true
    },
    {
      name: 'Tim Weber',
      class: '4B',
      since: '16:10',
      note: 'Eltern kontaktiert',
      hasContact: false
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Überfällig (nach Entlasszeit)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {overdueStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Keine Überfälligen – alles im grünen Bereich.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueStudents.map((student, index) => (
              <div key={index} className="p-3 rounded-lg border bg-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{student.name}</span>
                      <Badge variant="outline">{student.class}</Badge>
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        Überfällig
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Seit {student.since} • {student.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {student.hasContact && (
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 text-xs"
                      onClick={() => onNavigateToCheckInOut(student.name)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Check In/Out
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}