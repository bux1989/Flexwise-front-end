import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Info, ArrowRight, Users } from 'lucide-react';
import { DebugOverlay } from '../debug';

interface MissingStaffEntry {
  name: string;
  subject: string;
  timeSlot: string;
  classes: string[];
  hasSubstitute: boolean;
  substituteName?: string;
  status: 'offen' | 'geloest';
}

export function MissingStaff() {
  const [activeTab, setActiveTab] = useState('heute');
  const [showAll, setShowAll] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [showAllEntries, setShowAllEntries] = useState(false);

  const staffData = {
    heute: [
      {
        name: 'Felix Meyer',
        subject: 'Mathematik',
        timeSlot: '08:00-09:30',
        classes: ['5A', '5B'],
        hasSubstitute: false,
        status: 'offen' as const
      },
      {
        name: 'Anna Schmidt',
        subject: 'Englisch',
        timeSlot: '11:45-13:15',
        classes: ['6C'],
        hasSubstitute: true,
        substituteName: 'Maria Müller',
        status: 'geloest' as const
      },
      {
        name: 'Klaus Weber',
        subject: 'Physik',
        timeSlot: '09:45-11:15',
        classes: ['7B'],
        hasSubstitute: false,
        status: 'offen' as const
      },
      {
        name: 'Sandra Müller',
        subject: 'Chemie',
        timeSlot: '13:00-14:30',
        classes: ['8A', '8B'],
        hasSubstitute: true,
        substituteName: 'Dr. Frank Schmidt',
        status: 'geloest' as const
      }
    ],
    morgen: [
      {
        name: 'Sarah Weber',
        subject: 'Deutsch',
        timeSlot: '10:00-11:30',
        classes: ['3A'],
        hasSubstitute: true,
        substituteName: 'Thomas Lang',
        status: 'geloest' as const
      },
      {
        name: 'Tom Klein',
        subject: 'Sport',
        timeSlot: '13:00-14:30',
        classes: ['4B', '4C'],
        hasSubstitute: false,
        status: 'offen' as const
      }
    ],
    uebermorgen: [
      {
        name: 'Peter Braun',
        subject: 'Geschichte',
        timeSlot: '08:00-09:30',
        classes: ['8A', '8B'],
        hasSubstitute: false,
        status: 'offen' as const
      }
    ]
  };

  const handleSubstituteClick = () => {
    console.log('Navigate to substitute planning');
  };

  const toggleEntryExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getFilteredStaff = (staff: MissingStaffEntry[]) => {
    if (showAll) {
      return staff;
    }
    return staff.filter(entry => entry.status === 'offen');
  };

  const getLimitedStaff = (staff: MissingStaffEntry[]) => {
    const filtered = getFilteredStaff(staff);
    if (showAllEntries || filtered.length <= 5) {
      return filtered;
    }
    return filtered.slice(0, 5);
  };

  const renderStaffList = (staff: MissingStaffEntry[]) => {
    const filteredStaff = getFilteredStaff(staff);
    const limitedStaff = getLimitedStaff(staff);
    const hasMoreEntries = filteredStaff.length > 5;
    
    if (filteredStaff.length === 0) {
      const hasResolvedEntries = staff.some(entry => entry.status === 'geloest');
      
      return (
        <div className="text-center py-6 text-muted-foreground">
          <Info className="h-6 w-6 mx-auto mb-2 opacity-50" />
          {!showAll && hasResolvedEntries ? (
            <div>
              <p className="mb-1 text-sm">Keine offenen Vertretungen.</p>
              <p className="text-xs">Aktiviere "Alle zeigen" um erledigte Vertretungen zu sehen.</p>
            </div>
          ) : (
            <p className="text-sm">Keine Ausfälle.</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {limitedStaff.map((entry, index) => {
          const entryId = `${activeTab}-${index}`;
          const isExpanded = expandedEntries.has(entryId);
          
          return (
            <div 
              key={index} 
              className="p-2 rounded-md border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => toggleEntryExpansion(entryId)}
            >
              {/* Compact view - always visible */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm truncate">{entry.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {entry.timeSlot}
                  </span>
                  {entry.status === 'offen' ? (
                    <Badge variant="destructive" className="text-xs h-4 px-1.5 shrink-0">
                      Offen
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs h-4 px-1.5 bg-green-600 hover:bg-green-700 shrink-0">
                      Gelöst
                    </Badge>
                  )}
                </div>
                <ArrowRight className={`h-3 w-3 text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
              
              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-2 pt-2 border-t space-y-1.5">
                  <p className="text-sm text-muted-foreground">
                    {entry.subject}
                  </p>
                  {entry.substituteName && (
                    <p className="text-sm text-green-700 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Vertretung: {entry.substituteName}
                    </p>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Klassen:</span>
                    <div className="flex gap-1 flex-wrap">
                      {entry.classes.map((className) => (
                        <Badge key={className} variant="outline" className="text-xs h-4 px-1.5">
                          {className}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Show more/less buttons */}
        {hasMoreEntries && !showAllEntries && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllEntries(true);
            }}
            className="w-full mt-2 h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Mehr anzeigen ({filteredStaff.length - 5} weitere)
          </Button>
        )}
        
        {hasMoreEntries && showAllEntries && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllEntries(false);
            }}
            className="w-full mt-2 h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Weniger anzeigen
          </Button>
        )}
      </div>
    );
  };

  return (
    <DebugOverlay name="MissingStaff">
      <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          Fehlende Fachkräfte
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubstituteClick}
            className="gap-2 ml-2"
          >
            <Info className="h-3 w-3" />
            Vertretung
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Checkbox */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-md">
          <Checkbox
            id="show-all"
            checked={showAll}
            onCheckedChange={(checked) => {
              setShowAll(checked);
              setShowAllEntries(false);
            }}
          />
          <label
            htmlFor="show-all"
            className="text-sm cursor-pointer flex items-center gap-2"
          >
            Alle zeigen
            <span className="text-xs text-muted-foreground">
              (inkl. gelöste Vertretungen)
            </span>
          </label>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(tab) => {
            setActiveTab(tab);
            setShowAllEntries(false);
            setExpandedEntries(new Set());
          }}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="heute" className="gap-2">
              Heute
              {staffData.heute.filter(s => s.status === 'offen').length > 0 && (
                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                  {staffData.heute.filter(s => s.status === 'offen').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="morgen" className="gap-2">
              Morgen
              {staffData.morgen.filter(s => s.status === 'offen').length > 0 && (
                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                  {staffData.morgen.filter(s => s.status === 'offen').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="uebermorgen" className="gap-2">
              Übermorgen
              {staffData.uebermorgen.filter(s => s.status === 'offen').length > 0 && (
                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                  {staffData.uebermorgen.filter(s => s.status === 'offen').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="heute" className="mt-3">
            {renderStaffList(staffData.heute)}
          </TabsContent>
          
          <TabsContent value="morgen" className="mt-3">
            {renderStaffList(staffData.morgen)}
          </TabsContent>
          
          <TabsContent value="uebermorgen" className="mt-3">
            {renderStaffList(staffData.uebermorgen)}
          </TabsContent>
        </Tabs>
      </CardContent>
      </Card>
    </DebugOverlay>
  );
}
