import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, CalendarCheck } from 'lucide-react';
import { getClassesForStatistics, getCoursesForStatistics } from '../data/mockData';
import { useIsMobile } from './ui/use-mobile';

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
  type?: 'class' | 'course' | 'teacher';
}

interface HeaderProps {
  currentView: 'live' | 'statistics';
  onViewChange: (view: 'live' | 'statistics') => void;
  selectedWeek: Date;
  onWeekChange: (week: Date) => void;
  selectedClass: Class;
  onClassChange: (classItem: Class) => void;
  classes: Class[];
  statisticsViewType?: 'class' | 'student' | 'course';
}

export function Header({
  currentView,
  onViewChange,
  selectedWeek,
  onWeekChange,
  selectedClass,
  onClassChange,
  classes,
  statisticsViewType = 'class'
}: HeaderProps) {
  const isMobile = useIsMobile();

  // Get filtered classes based on current view and statistics view type
  const getFilteredClasses = () => {
    if (currentView === 'live') {
      // For live view, show all items (including teacher schedule)
      return classes;
    } else {
      // For statistics view, filter based on the view type
      if (statisticsViewType === 'class') {
        return getClassesForStatistics();
      } else if (statisticsViewType === 'course') {
        return getCoursesForStatistics();
      } else {
        // For student view, don't show class selection
        return [];
      }
    }
  };

  const filteredClasses = getFilteredClasses();

  // Handle class change with fallback to first available class
  const handleClassChange = (classId: string) => {
    const selectedClassItem = filteredClasses.find(c => c.id === classId);
    if (selectedClassItem) {
      onClassChange(selectedClassItem);
    }
  };

  // Ensure selected class is valid for current view
  React.useEffect(() => {
    const isCurrentClassValid = filteredClasses.some(c => c.id === selectedClass.id);
    if (!isCurrentClassValid && filteredClasses.length > 0) {
      // Default to first class in the filtered list
      onClassChange(filteredClasses[0]);
    }
  }, [currentView, statisticsViewType, filteredClasses, selectedClass.id, onClassChange]);

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4);
    
    const formatDate = (d: Date) => d.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit',
      year: isMobile ? undefined : 'numeric' // Hide year on mobile to save space
    });
    
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    onWeekChange(newWeek);
  };

  const getCurrentWeek = () => {
    const today = new Date();
    onWeekChange(today);
  };

  const getSelectLabel = () => {
    if (currentView === 'statistics') {
      switch (statisticsViewType) {
        case 'class':
          return isMobile ? 'Klasse' : 'Klasse auswählen';
        case 'course':
          return isMobile ? 'Kurs' : 'Kurs auswählen';
        default:
          return null; // No selection for student view
      }
    }
    return isMobile ? 'Klasse/Kurs' : 'Klasse/Kurs auswählen';
  };

  const shouldShowClassSelection = () => {
    if (currentView === 'live') return true;
    if (currentView === 'statistics' && statisticsViewType === 'student') return false;
    return filteredClasses.length > 0;
  };

  if (isMobile) {
    return (
      <Card className="p-4 mx-2 mt-2">
        <div className="space-y-4">
          {/* Navigation Buttons - Full Width */}
          <div className="flex space-x-2 w-full">
            <Button
              variant={currentView === 'live' ? 'default' : 'outline'}
              onClick={() => onViewChange('live')}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Live</span>
            </Button>
            <Button
              variant={currentView === 'statistics' ? 'default' : 'outline'}
              onClick={() => onViewChange('statistics')}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Statistiken</span>
            </Button>
          </div>

          {/* Week Navigation (only for Live view) */}
          {currentView === 'live' && (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeWeek('prev')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-2 flex-1 justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-center">
                    {formatWeekRange(selectedWeek)}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeWeek('next')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentWeek}
                  className="text-xs"
                >
                  Heute
                </Button>
              </div>
            </div>
          )}

          {/* Class Selection */}
          {shouldShowClassSelection() && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-center">{getSelectLabel()}:</div>
              <Select value={selectedClass.id} onValueChange={handleClassChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      <div className="flex items-center space-x-2">
                        <span>{classItem.name}</span>
                        {classItem.type === 'course' && (
                          <Badge variant="secondary" className="text-xs">
                            Kurs
                          </Badge>
                        )}
                        {classItem.type === 'teacher' && (
                          <Badge variant="outline" className="text-xs">
                            Eigene
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Desktop layout (existing)
  return (
    <Card className="p-6 mx-6 mt-6">
      <div className="flex items-center justify-between">
        {/* Left side - Navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={currentView === 'live' ? 'default' : 'outline'}
              onClick={() => onViewChange('live')}
              className="flex items-center space-x-2"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Live</span>
            </Button>
            <Button
              variant={currentView === 'statistics' ? 'default' : 'outline'}
              onClick={() => onViewChange('statistics')}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Statistiken</span>
            </Button>
          </div>
        </div>

        {/* Center - Week Navigation (only for Live view) */}
        {currentView === 'live' && (
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium min-w-48 text-center">
                {formatWeekRange(selectedWeek)}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentWeek}
              className="text-xs"
            >
              Heute
            </Button>
          </div>
        )}

        {/* Right side - Class Selection (conditional) */}
        {shouldShowClassSelection() && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{getSelectLabel()}:</span>
              <Select value={selectedClass.id} onValueChange={handleClassChange}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      <div className="flex items-center space-x-2">
                        <span>{classItem.name}</span>
                        {classItem.type === 'course' && (
                          <Badge variant="secondary" className="text-xs">
                            Kurs
                          </Badge>
                        )}
                        {classItem.type === 'teacher' && (
                          <Badge variant="outline" className="text-xs">
                            Eigene
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Spacer when no class selection is shown */}
        {!shouldShowClassSelection() && <div />}
      </div>
    </Card>
  );
}