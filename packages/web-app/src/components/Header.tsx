import { BookOpen, User, LogOut, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { DebugOverlay } from '../debug';

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
    <DebugOverlay name="Header">
      <header className="bg-white border-b px-3 py-2 lg:px-6 lg:py-4">
      {showKlassenbuch ? (
        /* Klassenbuch Header Layout */
        <div className="space-y-3">
          {/* Top Row - Title and Actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg lg:text-2xl font-semibold text-gray-900">Klassenbuch</h1>
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onButtonClick('Klassenbuch-Close')}
                      className="h-8 w-8 lg:h-10 lg:w-10 p-0"
                    >
                      <LogOut className="h-4 w-4 lg:h-6 lg:w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Schließen</p>
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

          {/* Bottom Row - Navigation and Controls */}
          <div className="flex items-center justify-between">
            {/* Left side - View Navigation */}
            <div className="flex items-center space-x-2">
              {onKlassenbuchViewChange && (
                <>
                  <Button
                    variant={klassenbuchView === 'live' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onKlassenbuchViewChange('live')}
                  >
                    Live
                  </Button>
                  <Button
                    variant={klassenbuchView === 'statistics' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onKlassenbuchViewChange('statistics')}
                    className="hidden"
                    style={{ display: 'none' }}
                  >
                    Statistiken
                  </Button>
                </>
              )}
            </div>

            {/* Center - Week Navigation (only for Live view) */}
            {klassenbuchView === 'live' && selectedWeek && onWeekChange && (
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

            {/* Right side - Class Selection */}
            {shouldShowClassSelection() && selectedClass && onClassChange && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Klasse/Kurs:</span>
                <Select value={selectedClass.id} onValueChange={(classId) => {
                  const selectedClassItem = klassenbuchClasses.find(c => c.id === classId);
                  if (selectedClassItem && onClassChange) {
                    onClassChange(selectedClassItem);
                  }
                }}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {klassenbuchClasses.map((classItem) => (
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
        </div>
      ) : (
        /* Normal Dashboard Header */
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 flex items-center space-x-3">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F020295f4dae640e8b44edc48cd1c867a%2Fccb040ecd5f34c9d92625e0548970cb8?format=webp&width=800"
              alt="FlexWise"
              className="h-8 w-auto lg:h-10 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-lg lg:text-2xl font-semibold text-gray-900 truncate">Hallo {currentTeacher}</h1>
              <p className="text-xs lg:text-sm text-gray-600 truncate">{dateString}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onButtonClick('Klassenbuch')}
                    className="h-8 w-8 lg:h-10 lg:w-10 p-0"
                  >
                    <BookOpen className="h-4 w-4 lg:h-6 lg:w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Klassenbuch</p>
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
      )}
      </header>
    </DebugOverlay>
  );
}
