import { BookOpen, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface HeaderProps {
  currentTeacher: string;
  dateString: string;
  onButtonClick: (action: string) => void;
  showKlassenbuch?: boolean;
  klassenbuchView?: 'live' | 'statistics';
  onKlassenbuchViewChange?: (view: 'live' | 'statistics') => void;
}

export function Header({ currentTeacher, dateString, onButtonClick, showKlassenbuch = false, klassenbuchView = 'live', onKlassenbuchViewChange }: HeaderProps) {
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
