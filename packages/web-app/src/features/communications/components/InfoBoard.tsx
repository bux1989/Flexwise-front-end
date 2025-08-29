import { useState } from 'react';
import { Info, Clock, UserPlus, ChevronUp, ChevronDown, Eye, EyeOff, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';

// Import real-time hook for Info-Board data
import { useInfoBoardRealtime, formatSubstitutionText } from '../../../hooks/useInfoBoardRealtime';

interface InfoBoardProps {
  schoolId?: string;
  isMobile?: boolean;
}

export function InfoBoard({ schoolId, isMobile = false }: InfoBoardProps) {
  const [expandedInfoItems, setExpandedInfoItems] = useState<Set<string>>(new Set());
  const [expandedInfoBoardPosts, setExpandedInfoBoardPosts] = useState<Set<string>>(new Set());
  const [showSubstituteLessons, setShowSubstituteLessons] = useState(!isMobile);

  // Real-time data fetching - now enabled with updated database schema
  const { bulletinPosts, substitutions, loading, error, refresh } = useInfoBoardRealtime(schoolId, true);

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

        {/* Loading and Error States */}
        {loading && (
          <div className="p-2 bg-blue-50 rounded-lg text-center">
            <div className="text-sm text-blue-600">Lade Info-Board Daten...</div>
          </div>
        )}

        {error && (
          <div className="p-2 bg-red-50 rounded-lg text-center">
            <div className="text-sm text-red-600">Fehler: {error}</div>
            <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
              Neu laden
            </Button>
          </div>
        )}

        {/* Real-time Bulletin Posts - only show if not mobile or section is expanded */}
        {bulletinPosts.length > 0 && (!isMobile || expandedInfoItems.has('info-board')) && (
          <div className="space-y-2">
            {bulletinPosts.map((post) => (
              <div
                key={post.id}
                className={`p-2 rounded-lg ${post.priority === 'high' ? 'bg-red-50 border border-red-200' : 'bg-blue-50'} ${isMobile ? 'cursor-pointer' : ''}`}
                onClick={isMobile ? () => toggleInfoBoardPost(post.id) : undefined}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">{post.title}</h4>
                  <div className="text-xs text-gray-600">{post.timestamp}</div>
                </div>
                {(!isMobile || expandedInfoBoardPosts.has(post.id)) && (
                  <div className="text-xs text-gray-600 mt-1">{post.content}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Vertretungsstunden section - only show if not mobile or section is expanded */}
        {substitutions.length > 0 && (!isMobile || expandedInfoItems.has('info-board')) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-purple-500" />
                Vertretungsstunden ({substitutions.length})
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
                {substitutions.map((substitute) => (
                  <div key={substitute.id} className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-purple-800">
                          {substitute.subject} {substitute.class}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          {substitute.reason}
                        </div>
                        {substitute.notes && (
                          <div className="text-xs text-purple-600 italic">
                            {substitute.notes}
                          </div>
                        )}
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
                    {!isMobile && substitute.date && (
                      <div className="text-xs text-purple-600 mt-2">
                        {new Date(substitute.date).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state when no data is available - only show if not mobile or section is expanded */}
        {!loading && !error && substitutions.length === 0 && bulletinPosts.length === 0 && (!isMobile || expandedInfoItems.has('info-board')) && (
          <div className="p-4 text-center text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <div className="text-sm">Keine aktuellen Informationen verfügbar</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
