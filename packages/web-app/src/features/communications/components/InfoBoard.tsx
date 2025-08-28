import { useState } from 'react';
import { Info, Clock, UserPlus, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';

// Import substitute lessons from shared domains
import { getSubstituteLessons } from '../../../../shared/domains/academic/klassenbuch/utils';

interface InfoBoardProps {
  isMobile?: boolean;
}

export function InfoBoard({ isMobile = false }: InfoBoardProps) {
  const [expandedInfoItems, setExpandedInfoItems] = useState<Set<string>>(new Set());
  const [expandedInfoBoardPosts, setExpandedInfoBoardPosts] = useState<Set<string>>(new Set());
  const [showSubstituteLessons, setShowSubstituteLessons] = useState(!isMobile);

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

  const toggleInfoBoardPost = (postId: string) => {
    setExpandedInfoBoardPosts(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(postId)) {
        newExpanded.delete(postId);
      } else {
        newExpanded.add(postId);
      }
      return newExpanded;
    });
  };

  const substituteLessons = getSubstituteLessons();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Info className="h-6 w-6 text-blue-500" />
            Info-Board
          </CardTitle>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleInfoItemExpansion('info-board')}
              className="h-6 w-6 p-0"
            >
              {expandedInfoItems.has('info-board') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Regular info items - always show titles */}
        <div 
          className={`p-2 rounded-lg bg-gray-50 ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={isMobile ? () => toggleInfoBoardPost('schulversammlung') : undefined}
        >
          <div className="flex justify-between items-start">
            <h4 className="font-semibold">Schulversammlung</h4>
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              14:30
            </div>
          </div>
          {(!isMobile || expandedInfoBoardPosts.has('schulversammlung')) && (
            <div className="text-xs text-gray-600 mt-1">Heute in der Aula</div>
          )}
        </div>
        
        <div 
          className={`p-2 rounded-lg bg-gray-50 ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={isMobile ? () => toggleInfoBoardPost('lehrerkonferenz') : undefined}
        >
          <div className="flex justify-between items-start">
            <h4 className="font-semibold">Lehrerkonferenz</h4>
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              16:30
            </div>
          </div>
          {(!isMobile || expandedInfoBoardPosts.has('lehrerkonferenz')) && (
            <div className="text-xs text-gray-600 mt-1">Morgen im Konferenzraum</div>
          )}
        </div>

        <div 
          className={`p-2 rounded-lg bg-gray-50 ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={isMobile ? () => toggleInfoBoardPost('it-systemupdate') : undefined}
        >
          <h4 className="font-semibold">IT-Systemupdate</h4>
          {(!isMobile || expandedInfoBoardPosts.has('it-systemupdate')) && (
            <div className="text-xs text-gray-600 mt-1">
              Freitag geplant, voraussichtlich am Wochenende abgeschlossen
            </div>
          )}
        </div>

        {/* Vertretungsstunden section */}
        {substituteLessons.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-purple-500" />
                Vertretungsstunden
              </h4>
              {isMobile && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-substitute-lessons"
                    checked={showSubstituteLessons}
                    onCheckedChange={setShowSubstituteLessons}
                  />
                  <Label htmlFor="show-substitute-lessons" className="text-xs">
                    Anzeigen
                  </Label>
                </div>
              )}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubstituteLessons(!showSubstituteLessons)}
                  className="h-6 w-6 p-0"
                >
                  {showSubstituteLessons ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {showSubstituteLessons && (
              <div className="space-y-2">
                {substituteLessons.map((substitute, index) => (
                  <div key={index} className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-purple-800">
                          {substitute.subject} {substitute.class}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          für {substitute.forTeacher}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-purple-700 font-medium">
                          {substitute.time}
                        </div>
                        <div className="text-xs text-purple-600">
                          {substitute.room}
                        </div>
                      </div>
                    </div>
                    {!isMobile && (
                      <div className="text-xs text-purple-600 mt-2">
                        {substitute.date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
