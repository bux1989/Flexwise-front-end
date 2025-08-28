import { BookOpen, User, LogOut, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface HeaderProps {
  currentTeacher: string;
  dateString: string;
  onButtonClick: (action: string) => void;
  showKlassenbuch?: boolean;
  klassenbuchView?: 'live' | 'statistics';
  onKlassenbuchViewChange?: (view: 'live' | 'statistics') => void;
  // Klassenbuch specific props
  selectedWeek?: Date;
  onWeekChange?: (week: Date) => void;
  selectedClass?: any;
  onClassChange?: (classItem: any) => void;
  klassenbuchClasses?: any[];
}

export function Header({
  currentTeacher,
  dateString,
  onButtonClick,
  showKlassenbuch = false,
  klassenbuchView = 'live',
  onKlassenbuchViewChange,
  selectedWeek,
  onWeekChange,
  selectedClass,
  onClassChange,
  klassenbuchClasses = []
}: HeaderProps) {
  // Helper functions for Klassenbuch
  const formatWeekRange = (date: Date) => {
    if (!date) return '';
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4);

    const formatDate = (d: Date) => d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    if (!selectedWeek || !onWeekChange) return;
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    onWeekChange(newWeek);
  };

  const getCurrentWeek = () => {
    if (!onWeekChange) return;
    const today = new Date();
    onWeekChange(today);
  };

  const shouldShowClassSelection = () => {
    if (!showKlassenbuch) return false;
    if (klassenbuchView === 'statistics') return false; // Hide for statistics for now
    return klassenbuchClasses.length > 0;
  };

  return (
    <header className="bg-white border-b px-3 py-2 lg:px-6 lg:py-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg lg:text-2xl font-semibold text-gray-900 truncate">
            {showKlassenbuch ? 'Klassenbuch' : `Hallo ${currentTeacher} 👋`}
          </h1>
          <p className="text-xs lg:text-sm text-gray-600 truncate">{dateString}</p>
        </div>

        {/* Klassenbuch Navigation */}
        {showKlassenbuch && onKlassenbuchViewChange && (
          <div className="flex items-center space-x-2 mr-4">
            <Button
              variant={klassenbuchView === 'live' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onKlassenbuchViewChange('live')}
            >
              Live Ansicht
            </Button>
            <Button
              variant={klassenbuchView === 'statistics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onKlassenbuchViewChange('statistics')}
            >
              Statistiken
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onButtonClick(showKlassenbuch ? 'Klassenbuch-Close' : 'Klassenbuch')}
                  className="h-8 w-8 lg:h-10 lg:w-10 p-0"
                >
                  {showKlassenbuch ? (
                    <LogOut className="h-4 w-4 lg:h-6 lg:w-6" />
                  ) : (
                    <BookOpen className="h-4 w-4 lg:h-6 lg:w-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showKlassenbuch ? 'Schließen' : 'Klassenbuch'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onButtonClick('Mein Account')}
                  className="h-8 w-8 lg:h-10 lg:w-10 p-0"
                >
                  <User className="h-4 w-4 lg:h-6 lg:w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mein Account</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onButtonClick('Ausloggen')}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 lg:h-10 lg:w-10 p-0"
                >
                  <LogOut className="h-4 w-4 lg:h-6 lg:w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ausloggen</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
