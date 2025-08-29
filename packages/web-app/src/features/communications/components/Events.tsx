import { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Check, HelpCircle, X, ChevronUp, ChevronDown } from 'lucide-react';
import { DebugOverlay } from '../../../debug';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

interface Event {
  id: number;
  title: string;
  description: string;
  date: { day: number; month: string; year: number };
  time: string;
  location: string;
  rsvp: 'attending' | 'maybe' | 'not_attending' | null;
}

interface EventsProps {
  events: Event[];
  onEventRSVP: (eventId: number, response: 'attending' | 'maybe' | 'not_attending') => void;
  isMobile?: boolean;
}

export function Events({ events, onEventRSVP, isMobile = false }: EventsProps) {
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [eventDisplayCount, setEventDisplayCount] = useState(3);
  const [expandedEventDescriptions, setExpandedEventDescriptions] = useState<Set<number>>(new Set());
  const [expandedMobileEvents, setExpandedMobileEvents] = useState<Set<number>>(new Set());
  const [expandedInfoItems, setExpandedInfoItems] = useState<Set<string>>(new Set());

  const toggleInfoItemExpansion = (itemId: string) => {
    setExpandedInfoItems(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return newExpanded;
    });
  };

  const toggleMobileEventExpansion = (eventId: number) => {
    setExpandedMobileEvents(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(eventId)) {
        newExpanded.delete(eventId);
      } else {
        newExpanded.add(eventId);
      }
      return newExpanded;
    });
  };

  const handleToggleEventDescription = (eventId: number) => {
    setExpandedEventDescriptions(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(eventId)) {
        newExpanded.delete(eventId);
      } else {
        newExpanded.add(eventId);
      }
      return newExpanded;
    });
  };

  const handleTogglePastEvents = (checked: boolean) => {
    setShowPastEvents(checked);
    setEventDisplayCount(3); // Reset to initial count
  };

  const truncateDescription = (description: string, maxLength: number = 80) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim();
  };

  // Helper function to convert month names to numbers
  const getMonthNumber = (month: string): string => {
    const monthMap: { [key: string]: string } = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    return monthMap[month] || '01';
  };

  // Helper function to create a proper Date object from event data
  const createEventDate = (event: Event): Date => {
    const year = event.date.year;
    const month = getMonthNumber(event.date.month);
    const day = event.date.day.toString().padStart(2, '0');
    return new Date(`${year}-${month}-${day}`);
  };

  const currentDate = new Date();

  // Filter events by past/future with corrected date logic
  const filteredEvents = useMemo(() => {
    const filtered = showPastEvents 
      ? events.filter(event => {
          const eventDate = createEventDate(event);
          return eventDate < currentDate;
        }).sort((a, b) => {
          const dateA = createEventDate(a);
          const dateB = createEventDate(b);
          return dateB.getTime() - dateA.getTime(); // Latest first
        })
      : events.filter(event => {
          const eventDate = createEventDate(event);
          return eventDate >= currentDate;
        }).sort((a, b) => {
          const dateA = createEventDate(a);
          const dateB = createEventDate(b);
          return dateA.getTime() - dateB.getTime(); // Earliest first
        });
    
    return filtered;
  }, [events, showPastEvents, currentDate]);

  // Get displayed events with progressive limits
  const displayedEvents = filteredEvents.slice(0, eventDisplayCount);

  return (
    <DebugOverlay name="Events">
      <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-500" />
            Veranstaltungen
          </CardTitle>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleInfoItemExpansion('events')}
              className="h-6 w-6 p-0"
            >
              {expandedInfoItems.has('events') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {/* Only show filters on desktop or when mobile section is expanded */}
        {(!isMobile || expandedInfoItems.has('events')) && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-past-events"
              checked={showPastEvents}
              onCheckedChange={handleTogglePastEvents}
            />
            <Label htmlFor="show-past-events" className="text-sm">
              Vergangene Veranstaltungen
            </Label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Only show event list on desktop or when mobile section is expanded */}
        {(!isMobile || expandedInfoItems.has('events')) && (
        <div className="space-y-3">
          {displayedEvents.map((event) => {
            const isExpanded = expandedEventDescriptions.has(event.id);
            const isMobileExpanded = expandedMobileEvents.has(event.id);
            const shouldTruncate = event.description.length > 80;
            const truncatedDesc = truncateDescription(event.description);
            
            return (
              <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="bg-blue-500 text-white rounded-lg p-2 text-center min-w-[40px] flex-shrink-0">
                  <div className="font-bold text-sm">{event.date.day}</div>
                  <div className="text-xs">{event.date.month}</div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{event.title}</h4>
                        {isMobile && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMobileEventExpansion(event.id)}
                            className="h-6 w-6 p-0 flex-shrink-0"
                          >
                            {isMobileExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        )}
                        {!isMobile && (
                          <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Mobile RSVP under title */}
                      {isMobile && !showPastEvents && (
                        <div className="flex gap-1 mb-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 ${
                                    event.rsvp === 'attending' 
                                      ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                      : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                                  }`}
                                  onClick={() => onEventRSVP(event.id, 'attending')}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Nehme teil</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 ${
                                    event.rsvp === 'maybe' 
                                      ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                                      : 'text-gray-300 hover:text-orange-600 hover:bg-orange-50'
                                  }`}
                                  onClick={() => onEventRSVP(event.id, 'maybe')}
                                >
                                  <HelpCircle className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Noch unsicher</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 ${
                                    event.rsvp === 'not_attending' 
                                      ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                      : 'text-gray-300 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                  onClick={() => onEventRSVP(event.id, 'not_attending')}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Kann nicht teilnehmen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                      
                      {/* Mobile time and location when expanded */}
                      {isMobile && isMobileExpanded && (
                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        </div>
                      )}
                      
                      {/* Event description */}
                      {(!isMobile || isMobileExpanded) && (
                        <div className="text-sm text-gray-600">
                          {isExpanded || !shouldTruncate ? event.description : (
                            <div className="flex items-center gap-2">
                              <span>{truncatedDesc}</span>
                              {shouldTruncate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleEventDescription(event.id)}
                                  className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-blue-50">
                                    (...)
                                  </Badge>
                                </Button>
                              )}
                            </div>
                          )}
                          {isExpanded && shouldTruncate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleEventDescription(event.id)}
                              className="h-auto p-0 ml-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              weniger
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Desktop RSVP buttons */}
                    {!isMobile && !showPastEvents && (
                      <div className="flex gap-1 flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  event.rsvp === 'attending' 
                                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                    : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                                }`}
                                onClick={() => onEventRSVP(event.id, 'attending')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Nehme teil</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  event.rsvp === 'maybe' 
                                    ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                                    : 'text-gray-300 hover:text-orange-600 hover:bg-orange-50'
                                }`}
                                onClick={() => onEventRSVP(event.id, 'maybe')}
                              >
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Noch unsicher</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  event.rsvp === 'not_attending' 
                                    ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                    : 'text-gray-300 hover:text-red-600 hover:bg-red-50'
                                }`}
                                onClick={() => onEventRSVP(event.id, 'not_attending')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Kann nicht teilnehmen</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Enhanced Event Navigation with "weniger anzeigen" functionality */}
          {filteredEvents.length > 3 && (
            <div className="text-center pt-2 space-y-2">
              {filteredEvents.length > eventDisplayCount && (
                <Button
                  variant="ghost"
                  size="sm"  
                  onClick={() => setEventDisplayCount(prev => prev + 10)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  mehr anzeigen ({filteredEvents.length - eventDisplayCount} weitere)
                </Button>
              )}
              {eventDisplayCount > 3 && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEventDisplayCount(3)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ChevronUp className="h-4 w-4 mr-1" />
                    weniger anzeigen
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </CardContent>
      </Card>
    </DebugOverlay>
  );
}
