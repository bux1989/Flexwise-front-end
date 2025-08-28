import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, CalendarCheck } from 'lucide-react';
import { getClassesForStatistics, getCoursesForStatistics } from '../../../shared/domains/academic/klassenbuch';

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
  isMobile?: boolean;
}

export function Header({
  currentView,
  onViewChange,
  selectedWeek,
  onWeekChange,
  selectedClass,
  onClassChange,
  classes,
  statisticsViewType = 'class',
  isMobile = false
}: HeaderProps) {

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

  const goToCurrentWeek = () => {
    onWeekChange(new Date());
  };

  return (
    <Card className="mb-6">
      <div className="p-4 space-y-4">
        {/* View Toggle */}
        <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={currentView === 'live' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('live')}
            className="flex-1 flex items-center gap-2"
          >
            <CalendarCheck className="h-4 w-4" />
            {!isMobile && 'Stundenplan'} Live Ansicht
          </Button>
          <Button
            variant={currentView === 'statistics' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('statistics')}
            className="flex-1 flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Statistiken
          </Button>
        </div>

        {/* Week Navigation and Class Selection */}
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek('prev')}
              disabled={false}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
                {formatWeekRange(selectedWeek)}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
            >
              Heute
            </Button>
          </div>

          {/* Class Selection */}
          {filteredClasses.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={selectedClass.id} onValueChange={handleClassChange}>
                <SelectTrigger className={isMobile ? 'w-full' : 'w-[280px]'}>
                  <SelectValue>
                    {selectedClass.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      <div className="flex items-center gap-2">
                        <span>{classItem.name}</span>
                        {classItem.type === 'teacher' && (
                          <Badge variant="secondary" className="text-xs">
                            {classItem.grade}
                          </Badge>
                        )}
                        {classItem.type === 'course' && (
                          <Badge variant="outline" className="text-xs">
                            Kurs
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
      </div>
    </Card>
  );
}
