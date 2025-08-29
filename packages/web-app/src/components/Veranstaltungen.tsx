import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Calendar, Clock, MapPin, ChevronDown, ChevronRight, Plus, User, CheckCircle, XCircle, Clock as ClockIcon, Eye } from 'lucide-react';

interface RSVPResponse {
  name: string;
  status: 'zusage' | 'absage' | 'ausstehend';
  respondedAt?: string;
  note?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  month: string;
  time: string;
  location: string;
  description: string;
  isPast: boolean;
  visibility?: 'everyone' | 'groups' | 'individuals';
  selectedGroups?: string[];
  selectedIndividuals?: string[];
  enableRSVP?: boolean;
  organizer?: string;
  category?: string;
  capacity?: number;
  requirements?: string[];
  rsvpResponses?: RSVPResponse[];
  createdAt?: string;
  endTime?: string;
}

export function Veranstaltungen() {
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [showAllEvents, setShowAllEvents] = useState(false);

  const events: Event[] = [
    {
      id: '1',
      title: 'Tag der offenen Tür',
      date: '25',
      month: 'Sep',
      time: '10:00',
      endTime: '16:00',
      location: 'Gesamte Schule',
      description: 'Präsentation der Schule für interessierte Eltern und Schüler. Verschiedene Fachbereiche stellen sich vor, Rundgänge durch die Gebäude und Informationsstände.',
      isPast: false,
      organizer: 'Schulleitung',
      category: 'Öffentlichkeitsarbeit',
      capacity: 200,
      requirements: ['Präsentationsmaterial vorbereiten', 'Räume herrichten', 'Parkplätze freihalten'],
      enableRSVP: true,
      visibility: 'everyone',
      createdAt: '20.08.2025 14:30',
      rsvpResponses: [
        { name: 'Herr Müller', status: 'zusage', respondedAt: '21.08.2025 09:15', note: 'Übernehme Mathematik-Stand' },
        { name: 'Frau Schmidt', status: 'zusage', respondedAt: '21.08.2025 10:30' },
        { name: 'Herr Weber', status: 'absage', respondedAt: '22.08.2025 08:20', note: 'Familiäre Verpflichtung' },
        { name: 'Frau Fischer', status: 'zusage', respondedAt: '22.08.2025 11:45' },
        { name: 'Herr Bauer', status: 'ausstehend' },
        { name: 'Frau Zimmermann', status: 'zusage', respondedAt: '23.08.2025 16:10', note: 'Helfe bei Rundführungen' },
        { name: 'Herr Klein', status: 'ausstehend' }
      ]
    },
    {
      id: '2',
      title: 'Abiturprüfungen Mathematik',
      date: '15',
      month: 'Sep',
      time: '09:00',
      endTime: '14:00',
      location: 'Sporthalle',
      description: 'Schriftliche Abiturprüfung im Fach Mathematik. Aufsicht und Korrektur durch Fachlehrkräfte. Dauer: 5 Zeitstunden (300 Minuten).',
      isPast: false,
      organizer: 'Oberstufenkoordination',
      category: 'Prüfung',
      requirements: ['Klausurenaufsicht', 'Prüfungsmaterial bereitstellen', 'Ruhe gewährleisten'],
      enableRSVP: true,
      visibility: 'groups',
      selectedGroups: ['Lehrkräfte', 'Verwaltung'],
      createdAt: '15.08.2025 11:20',
      rsvpResponses: [
        { name: 'Herr Dr. Lange', status: 'zusage', respondedAt: '16.08.2025 14:20', note: 'Fachaufsicht Mathematik' },
        { name: 'Frau Prof. Neumann', status: 'zusage', respondedAt: '17.08.2025 09:30' },
        { name: 'Herr Richter', status: 'zusage', respondedAt: '18.08.2025 13:15', note: 'Zweitaufsicht verfügbar' }
      ]
    },
    {
      id: '3',
      title: 'Schulausflug Klasse 8a',
      date: '12',
      month: 'Sep',
      time: '08:30',
      endTime: '16:00',
      location: 'Technikmuseum',
      description: 'Besuch des Technikmuseums mit anschließender Stadtrallye. Begleitung durch zwei Lehrkräfte und einen Elternbeirat.',
      isPast: false,
      organizer: 'Frau Hartmann',
      category: 'Klassenfahrt',
      capacity: 25,
      requirements: ['Busfahrt organisieren', 'Einverständniserklärungen einsammeln', 'Notfallkontakte bereitstellen'],
      enableRSVP: true,
      visibility: 'individuals',
      selectedIndividuals: ['Herr Weber', 'Frau Schmidt', 'Frau Hartmann'],
      createdAt: '10.08.2025 16:45',
      rsvpResponses: [
        { name: 'Herr Weber', status: 'zusage', respondedAt: '11.08.2025 08:30', note: 'Übernehme Begleitaufsicht' },
        { name: 'Frau Schmidt', status: 'absage', respondedAt: '12.08.2025 14:20', note: 'Anderer Termin' },
        { name: 'Frau Hartmann', status: 'zusage', respondedAt: '10.08.2025 16:50', note: 'Klassenleitung' }
      ]
    }
  ];

  const filteredEvents = showPastEvents ? events : events.filter(event => !event.isPast);
  const visibleEvents = showAllEvents ? filteredEvents : filteredEvents.slice(0, 5);

  const toggleEventExpansion = (eventId: string) => {
    const newExpandedEvents = new Set(expandedEvents);
    if (newExpandedEvents.has(eventId)) {
      newExpandedEvents.delete(eventId);
    } else {
      newExpandedEvents.add(eventId);
    }
    setExpandedEvents(newExpandedEvents);
  };

  const handleAddEvent = () => {
    console.log('Create event dialog would open here');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        {/* Title row with plus button */}
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Veranstaltungen
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={handleAddEvent}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Controls row */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="past-events"
            checked={showPastEvents}
            onCheckedChange={setShowPastEvents}
          />
          <label 
            htmlFor="past-events" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Vergangene Veranstaltungen
          </label>
        </div>
      </CardHeader>
    <CardContent>
      {visibleEvents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Keine Veranstaltungen vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleEvents.map((event) => (
            <div key={event.id} className="space-y-1">
              <div 
                className="flex gap-3 items-start cursor-pointer hover:bg-accent/50 p-1.5 rounded-lg transition-colors"
                onClick={() => toggleEventExpansion(event.id)}
              >
                {/* Date Block */}
                <div className="flex-shrink-0">
                  <div className="bg-blue-500 text-white rounded-md p-1.5 text-center min-w-[38px]">
                    <div className="font-bold text-xs leading-none">{event.date}</div>
                    <div className="text-xs mt-0.5 opacity-90">{event.month}</div>
                  </div>
                </div>
                
                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm leading-tight">{event.title}</h3>
                    <div className="text-muted-foreground">
                      {expandedEvents.has(event.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {event.location}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expandable Event Details */}
              {expandedEvents.has(event.id) && (
                <div className="ml-[50px] pl-3 border-l-2 border-blue-200 space-y-2">
                  {/* Description */}
                  <div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                  
                  {/* Event Details */}
                  <div className="space-y-1 text-xs">
                    {event.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Erstellt am:</span>
                        <span>{event.createdAt}</span>
                      </div>
                    )}
                    
                    {event.organizer && (
                      <div className="flex items-center gap-2">
                        <User className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-muted-foreground">von:</span>
                        <span>{event.organizer}</span>
                      </div>
                    )}
                    
                    {event.visibility && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Sichtbarkeit:</span>
                        <span>
                          {event.visibility === 'everyone' && 'Alle'}
                          {event.visibility === 'groups' && `Gruppen (${event.selectedGroups?.length || 0})`}
                          {event.visibility === 'individuals' && `Personen (${event.selectedIndividuals?.length || 0})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* RSVP Section */}
                  {event.enableRSVP && event.rsvpResponses && event.rsvpResponses.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/30">
                      {/* Zusagen */}
                      {event.rsvpResponses.filter(r => r.status === 'zusage').length > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                          <CheckCircle className="h-2.5 w-2.5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-green-600 font-medium">{event.rsvpResponses.filter(r => r.status === 'zusage').length}:</span>
                          <span className="text-muted-foreground">
                            {event.rsvpResponses.filter(r => r.status === 'zusage').map(r => r.name).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Ausstehend */}
                      {event.rsvpResponses.filter(r => r.status === 'ausstehend').length > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                          <ClockIcon className="h-2.5 w-2.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-amber-600 font-medium">{event.rsvpResponses.filter(r => r.status === 'ausstehend').length}:</span>
                          <span className="text-muted-foreground">
                            {event.rsvpResponses.filter(r => r.status === 'ausstehend').map(r => r.name).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Absagen */}
                      {event.rsvpResponses.filter(r => r.status === 'absage').length > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                          <XCircle className="h-2.5 w-2.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-red-600 font-medium">{event.rsvpResponses.filter(r => r.status === 'absage').length}:</span>
                          <span className="text-muted-foreground">
                            {event.rsvpResponses.filter(r => r.status === 'absage').map(r => r.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* More events link */}
          {filteredEvents.length > 5 && (
            <div className="flex justify-center pt-2">
              <Button 
                variant="ghost" 
                className="text-blue-500 hover:text-blue-600 gap-1 text-sm h-8"
                onClick={() => setShowAllEvents(!showAllEvents)}
              >
                {showAllEvents ? (
                  <>
                    <ChevronDown className="h-3 w-3 rotate-180" />
                    weniger anzeigen
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    mehr anzeigen ({filteredEvents.length - 5} weitere)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </CardContent>
  </Card>
  );
}
