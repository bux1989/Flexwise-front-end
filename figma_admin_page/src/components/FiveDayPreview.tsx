import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Users, BookOpen } from 'lucide-react';

interface PreviewItem {
  date: string;
  day: string;
  events: {
    type: 'absence' | 'training' | 'event';
    description: string;
  }[];
}

export function FiveDayPreview() {
  const previewData: PreviewItem[] = [
    {
      date: '25.03',
      day: 'Mo',
      events: [
        { type: 'absence', description: '2 Krankmeldungen eingegangen' }
      ]
    },
    {
      date: '26.03',
      day: 'Di',
      events: [
        { type: 'training', description: 'Fortbildung "Digitale Medien" - 3 Lehrkräfte' }
      ]
    },
    {
      date: '27.03',
      day: 'Mi',
      events: [
        { type: 'event', description: 'Schulversammlung um 10:00' },
        { type: 'absence', description: '1 Krankmeldung' }
      ]
    },
    {
      date: '28.03',
      day: 'Do',
      events: []
    },
    {
      date: '29.03',
      day: 'Fr',
      events: [
        { type: 'event', description: 'Osterferien beginnen' }
      ]
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'absence':
        return <Users className="h-3 w-3" />;
      case 'training':
        return <BookOpen className="h-3 w-3" />;
      case 'event':
        return <Calendar className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'absence':
        return 'bg-red-50 text-red-700';
      case 'training':
        return 'bg-blue-50 text-blue-700';
      case 'event':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Vorschau der nächsten 5 Tage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {previewData.map((day) => (
            <div key={day.date} className="flex gap-3">
              <div className="flex flex-col items-center min-w-12">
                <span className="text-sm font-medium">{day.day}</span>
                <span className="text-xs text-muted-foreground">{day.date}</span>
              </div>
              <div className="flex-1">
                {day.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Keine besonderen Ereignisse</p>
                ) : (
                  <div className="space-y-2">
                    {day.events.map((event, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="secondary" className={`gap-1 text-xs ${getEventColor(event.type)}`}>
                          {getEventIcon(event.type)}
                          {event.description}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}