import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Info, Clock, Monitor, Users, School, Plus, ChevronDown, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

interface CreatePostForm {
  title: string;
  description: string;
  time: string;
  visibility: 'everyone' | 'screen' | 'group';
  groupName: string;
  multipleDays: boolean;
  startDate: Date;
  endDate: Date;
}

export function Infoboard() {
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [createForm, setCreateForm] = useState<CreatePostForm>({
    title: '',
    description: '',
    time: '',
    visibility: 'everyone',
    groupName: '',
    multipleDays: false,
    startDate: new Date(),
    endDate: new Date()
  });

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
    },
    {
      id: '7',
      title: 'Neue Schulbücher',
      description: 'Die neuen Mathematikbücher für die Klassen 8-10 sind eingetroffen und können abgeholt werden.',
      visibility: {
        type: 'team',
        teamName: 'Lehrkräfte'
      },
      author: 'Bibliothek',
      createdAt: '20.08.2025 13:45',
      category: 'Material'
    },
    {
      id: '8',
      title: 'Wartungsarbeiten Heizung',
      description: 'Am Wochenende finden Wartungsarbeiten an der Heizungsanlage statt. Temperaturschwankungen möglich.',
      visibility: {
        type: 'screen'
      },
      author: 'Verwaltung',
      createdAt: '19.08.2025 10:30',
      category: 'Wartung'
    },
    {
      id: '9',
      title: 'Sportfest Vorbereitung',
      description: 'Lehrkräfte treffen sich um 15:00 Uhr zur Vorbesprechung des Sportfests nächste Woche.',
      time: '15:00',
      visibility: {
        type: 'team',
        teamName: 'Lehrkräfte'
      },
      author: 'Frau Zimmermann',
      createdAt: '18.08.2025 12:15',
      category: 'Sport'
    },
    {
      id: '10',
      title: 'Mensa Speiseplan',
      description: 'Der neue Speiseplan für nächste Woche ist online verfügbar.',
      visibility: {
        type: 'everyone'
      },
      author: 'Mensa-Team',
      createdAt: '17.08.2025 14:00',
      category: 'Verpflegung'
    },
    {
      id: '11',
      title: 'Klassenfahrt 9B',
      description: 'Informationen zur Klassenfahrt der 9B nach Berlin sind verfügbar.',
      visibility: {
        type: 'everyone'
      },
      author: 'Herr Bauer',
      createdAt: '16.08.2025 09:30',
      category: 'Klassenfahrt'
    },
    {
      id: '12',
      title: 'PC-Raum Wartung',
      description: 'Dienstag ist der PC-Raum aufgrund von Wartungsarbeiten nicht verfügbar.',
      visibility: {
        type: 'screen'
      },
      author: 'IT-Support',
      createdAt: '15.08.2025 16:20',
      category: 'Wartung'
    },
    {
      id: '13',
      title: 'Bibliothek Öffnungszeiten',
      description: 'Neue Öffnungszeiten der Schulbibliothek: Mo-Fr 8:00-16:00 Uhr.',
      visibility: {
        type: 'everyone'
      },
      author: 'Bibliothek',
      createdAt: '14.08.2025 11:45',
      category: 'Service'
    }
  ];

  const availableGroups = [
    'Lehrkräfte',
    'Verwaltung',
    'Hausmeister',
    'IT-Support',
    'Schulleitung'
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
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    // Reset form
    setCreateForm({
      title: '',
      description: '',
      time: '',
      visibility: 'everyone',
      groupName: '',
      multipleDays: false,
      startDate: new Date(),
      endDate: new Date()
    });
  };

  const handleSubmitPost = () => {
    if (!createForm.title.trim()) {
      alert('Titel ist erforderlich');
      return;
    }

    console.log('Creating new post:', createForm);
    // Here you would typically send the data to your backend
    
    handleCloseDialog();
  };

  const formatSelectedDates = () => {
    if (!createForm.multipleDays) {
      return format(createForm.startDate, 'dd.MM.yyyy', { locale: de });
    }
    
    const startFormatted = format(createForm.startDate, 'dd.MM.yyyy', { locale: de });
    const endFormatted = format(createForm.endDate, 'dd.MM.yyyy', { locale: de });
    
    if (createForm.startDate.toDateString() === createForm.endDate.toDateString()) {
      return startFormatted;
    }
    
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <>
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

      {/* Create Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neuen Post erstellen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={createForm.title}
                onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Post-Titel eingeben..."
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detaillierte Beschreibung..."
                rows={3}
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time">Uhrzeit (optional)</Label>
              <Input
                id="time"
                type="time"
                value={createForm.time}
                onChange={(e) => setCreateForm(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label>Sichtbarkeit</Label>
              <Select
                value={createForm.visibility}
                onValueChange={(value: 'everyone' | 'screen' | 'group') => 
                  setCreateForm(prev => ({ ...prev, visibility: value, groupName: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-purple-500" />
                      Alle
                    </div>
                  </SelectItem>
                  <SelectItem value="screen">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-blue-500" />
                      Bildschirm-Übersicht
                    </div>
                  </SelectItem>
                  <SelectItem value="group">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      Gruppe
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group Selection */}
            {createForm.visibility === 'group' && (
              <div className="space-y-2">
                <Label>Gruppe auswählen</Label>
                <Select
                  value={createForm.groupName}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, groupName: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gruppe wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Visible Days */}
            <div className="space-y-3">
              <Label>Sichtbare Tage</Label>
              
              {/* Multiple Days Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="multiple-days"
                  checked={createForm.multipleDays}
                  onCheckedChange={(checked) => 
                    setCreateForm(prev => ({ 
                      ...prev, 
                      multipleDays: !!checked,
                      endDate: checked ? prev.endDate : prev.startDate
                    }))
                  }
                />
                <label 
                  htmlFor="multiple-days" 
                  className="text-sm cursor-pointer"
                >
                  Mehrere Tage
                </label>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {createForm.multipleDays ? 'Startdatum' : 'Datum'}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(createForm.startDate, 'dd.MM.yyyy', { locale: de })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={createForm.startDate}
                      onSelect={(date) => {
                        if (date) {
                          setCreateForm(prev => ({ 
                            ...prev, 
                            startDate: date,
                            endDate: prev.multipleDays ? prev.endDate : date
                          }));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date - only show when multiple days is enabled */}
              {createForm.multipleDays && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Enddatum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(createForm.endDate, 'dd.MM.yyyy', { locale: de })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={createForm.endDate}
                        onSelect={(date) => {
                          if (date) {
                            setCreateForm(prev => ({ ...prev, endDate: date }));
                          }
                        }}
                        disabled={(date) => date < createForm.startDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Wählen Sie das Datum oder den Zeitraum für die Sichtbarkeit des Posts. Administratoren können alle Posts sehen, auch zukünftige.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmitPost}>
              Post erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}