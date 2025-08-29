import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Info, Clock, Monitor, Users, School, Plus, ChevronDown, ChevronRight } from 'lucide-react';

interface InfoItem {
  id: string;
  title: string;
  description: string;
  time?: string;
  visibility: {
    type: 'screen' | 'team' | 'everyone';
    teamName?: string;
  };
  visibleDates?: Date[];
  author?: string;
  createdAt?: string;
  category?: string;
}

export function Infoboard() {
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showAllPosts, setShowAllPosts] = useState(false);

  const infoItems: InfoItem[] = [
    {
      id: '1',
      title: 'Schulversammlung',
      description: 'Heute in der Aula um 14:30 Uhr findet die monatliche Schulversammlung statt. Alle Schüler und Lehrkräfte sind eingeladen.',
      time: '14:30',
      visibility: {
        type: 'everyone'
      },
      author: 'Schulleitung',
      createdAt: '25.08.2025 09:15',
      category: 'Veranstaltung'
    },
    {
      id: '2',
      title: 'Lehrerkonferenz',
      description: 'Morgen im Konferenzraum findet die wöchentliche Lehrerkonferenz statt. Themen: Notenkonferenz und neue Schulrichtlinien.',
      time: '16:30',
      visibility: {
        type: 'team',
        teamName: 'Lehrkräfte'
      },
      author: 'Herr Müller',
      createdAt: '24.08.2025 14:22',
      category: 'Besprechung'
    },
    {
      id: '3',
      title: 'IT-Systemupdate',
      description: 'Freitag geplant, voraussichtlich am Wochenende abgeschlossen. Das Schulnetzwerk wird temporär nicht verfügbar sein.',
      visibility: {
        type: 'screen'
      },
      author: 'IT-Admin',
      createdAt: '23.08.2025 16:45',
      category: 'Wartung'
    },
    {
      id: '4',
      title: 'Pausenaufsicht Änderung',
      description: 'Ab morgen übernimmt Frau Schmidt die Pausenaufsicht auf dem Schulhof.',
      time: '10:15',
      visibility: {
        type: 'team',
        teamName: 'Lehrkräfte'
      },
      author: 'Frau Weber',
      createdAt: '25.08.2025 08:30',
      category: 'Organisation'
    },
    {
      id: '5',
      title: 'Elternabend Klasse 7A',
      description: 'Donnerstag um 19:00 Uhr findet der Elternabend für die Klasse 7A statt.',
      time: '19:00',
      visibility: {
        type: 'everyone'
      },
      author: 'Herr Fischer',
      createdAt: '22.08.2025 11:20',
      category: 'Veranstaltung'
    },
    {
      id: '6',
      title: 'Feueralarm Test',
      description: 'Mittwoch findet ein geplanter Feueralarm-Test statt. Alle Klassen verlassen ordnungsgemäß das Gebäude.',
      time: '11:00',
      visibility: {
        type: 'everyone'
      },
      author: 'Hausmeister Schmidt',
      createdAt: '21.08.2025 15:10',
      category: 'Sicherheit'
    }
  ];

  const togglePostExpansion = (postId: string) => {
    const newExpandedPosts = new Set(expandedPosts);
    if (newExpandedPosts.has(postId)) {
      newExpandedPosts.delete(postId);
    } else {
      newExpandedPosts.add(postId);
    }
    setExpandedPosts(newExpandedPosts);
  };

  const getVisiblePosts = () => {
    if (showAllPosts || infoItems.length <= 5) {
      return infoItems;
    }
    return infoItems.slice(0, 5);
  };

  const getVisibilityIcon = (visibility: InfoItem['visibility']) => {
    switch (visibility.type) {
      case 'screen':
        return <Monitor className="h-3 w-3 text-blue-500" />;
      case 'team':
        return <Users className="h-3 w-3 text-green-500" />;
      case 'everyone':
        return <School className="h-3 w-3 text-purple-500" />;
      default:
        return <Monitor className="h-3 w-3 text-gray-400" />;
    }
  };

  const getVisibilityLabel = (visibility: InfoItem['visibility']) => {
    switch (visibility.type) {
      case 'screen':
        return 'Übersicht';
      case 'team':
        return visibility.teamName || 'Team';
      case 'everyone':
        return 'Alle';
      default:
        return '';
    }
  };

  const handleCreatePost = () => {
    console.log('Create post dialog would open here');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Info-Board
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCreatePost}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {getVisiblePosts().map((item) => (
            <div key={item.id} className="space-y-1">
              <div 
                className="cursor-pointer hover:bg-accent/50 p-1.5 rounded-md transition-colors"
                onClick={() => togglePostExpansion(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getVisibilityIcon(item.visibility)}
                      <span className="text-sm truncate">{item.title}</span>
                      {item.time && (
                        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{item.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-muted-foreground shrink-0 ml-2">
                    {expandedPosts.has(item.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expandable Post Details */}
              {expandedPosts.has(item.id) && (
                <div className="ml-3 pl-3 border-l-2 border-blue-200 space-y-2">
                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  
                  {/* Post Metadata */}
                  <div className="space-y-1 pt-1 border-t border-border/30">
                    {/* Visibility and Category */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getVisibilityIcon(item.visibility)}
                        <span>Sichtbar für: {getVisibilityLabel(item.visibility)}</span>
                      </div>
                      {item.category && (
                        <div className="bg-muted px-2 py-0.5 rounded text-xs">
                          {item.category}
                        </div>
                      )}
                    </div>
                    
                    {/* Author and Date */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {item.author && (
                        <span>Erstellt von: {item.author}</span>
                      )}
                      {item.createdAt && (
                        <span>am {item.createdAt}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Show More/Less Buttons */}
          {infoItems.length > 5 && !showAllPosts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllPosts(true)}
              className="w-full mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Mehr anzeigen ({infoItems.length - 5} weitere)
            </Button>
          )}
          
          {infoItems.length > 5 && showAllPosts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllPosts(false)}
              className="w-full mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Weniger anzeigen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
