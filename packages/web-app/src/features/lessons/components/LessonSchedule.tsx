import { useState, useMemo } from 'react';
import { Calendar, Check, AlertCircle, Info, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { CompactDatePicker } from '../../../components/ui/date-picker';
import { TooltipProvider } from '../../../components/ui/tooltip';
import dayjs, { Dayjs } from 'dayjs';

// Import from shared domains
import { 
  getSubstituteLessons, 
  needsAttendanceTracking, 
  getAttendanceStatus, 
  getAttendanceSummary, 
  getAttendanceNumbers,
  formatDateTime
} from '../../../../../shared/domains/academic/klassenbuch/utils';

interface LessonScheduleProps {
  lessons: any[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAttendanceClick: (lessonId: string, viewMode?: 'overview' | 'edit') => void;
  isMobile?: boolean;
}

export function LessonSchedule({
  lessons,
  selectedDate,
  onDateChange,
  onAttendanceClick,
  isMobile = false
}: LessonScheduleProps) {
  const [showAllLessonsOnMobile, setShowAllLessonsOnMobile] = useState(false);
  const [expandedMobileLessonDetails, setExpandedMobileLessonDetails] = useState<Set<number>>(new Set());

  // Convert Date to dayjs for the DatePicker
  const selectedDayjs = dayjs(selectedDate);

  // Helper function for mobile lesson abbreviations
  const getMobileSubjectAbbreviation = (subject: string): string => {
    const abbreviations: { [key: string]: string } = {
      'Mathematik': 'MA',
      'Deutsch': 'DE',
      'Englisch': 'EN',
      'Französisch': 'FR',
      'Spanisch': 'SP',
      'Geschichte': 'GE',
      'Erdkunde': 'EK',
      'Biologie': 'BIO',
      'Chemie': 'CH',
      'Physik': 'PH',
      'Sport': 'SP',
      'Kunst': 'KU',
      'Musik': 'MU',
      'Religion': 'REL',
      'Ethik': 'ETH',
      'Informatik': 'INF',
      'Sozialkunde': 'SK',
      'Wirtschaft': 'WI'
    };
    return abbreviations[subject] || subject.substring(0, 3).toUpperCase();
  };

  const toggleMobileLessonDetails = (lessonId: number) => {
    setExpandedMobileLessonDetails(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(lessonId)) {
        newExpanded.delete(lessonId);
      } else {
        newExpanded.add(lessonId);
      }
      return newExpanded;
    });
  };


  // Filter lessons for mobile display
  const displayedLessons = useMemo(() => {
    if (!isMobile || showAllLessonsOnMobile) {
      return lessons; // Show all lessons on desktop or when "show all" is enabled on mobile
    }
    
    // On mobile, hide past lessons where attendance is complete by default
    return lessons.filter(lesson => {
      // Always show current lesson
      if (lesson.isCurrent) return true;
      
      // Always show future lessons
      const now = new Date();
      const [lessonHours, lessonMinutes] = lesson.time.split(':').map(Number);
      const lessonTime = new Date();
      lessonTime.setHours(lessonHours, lessonMinutes, 0, 0);
      
      if (lessonTime > now) return true;
      
      // For past lessons, only hide if attendance is complete
      const attendanceStatus = getAttendanceStatus(lesson);
      return attendanceStatus !== 'complete';
    });
  }, [lessons, isMobile, showAllLessonsOnMobile]);

  const handleDatePickerChange = (newValue: Dayjs | null) => {
    if (newValue) {
      onDateChange(newValue.toDate());
    }
  };

  return (
    <DebugOverlay name="LessonSchedule">
      <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-500" />
          Stundenplan
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* Mobile toggle for showing all lessons */}
          {isMobile && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-all-lessons-mobile"
                checked={showAllLessonsOnMobile}
                onCheckedChange={setShowAllLessonsOnMobile}
              />
              <Label htmlFor="show-all-lessons-mobile" className="text-xs">
                Alle
              </Label>
            </div>
          )}
          <CompactDatePicker
            value={selectedDayjs}
            onChange={handleDatePickerChange}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="space-y-1">
          <TooltipProvider>
            {displayedLessons.map((lesson) => {
              const attendanceStatus = getAttendanceStatus(lesson);
              const attendanceNumbers = getAttendanceNumbers(lesson);
              
              return (
                <div 
                  key={lesson.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    lesson.isCurrent 
                      ? 'bg-blue-50 border-l-4 border-blue-400' 
                      : lesson.isSubstitute
                      ? 'bg-purple-50'
                      : lesson.isCancelled
                      ? 'bg-red-50'
                      : 'bg-gray-50'
                  }`}
                  onClick={isMobile ? () => toggleMobileLessonDetails(lesson.id) : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className={`font-medium text-gray-600 min-w-[50px] leading-tight ${isMobile ? 'text-base' : 'text-sm'}`}>
                      <div>{lesson.time} -</div>
                      <div>{lesson.endTime}</div>
                    </div>
                    <div className="flex-1">
                      {isMobile ? (
                        // Mobile Layout - Larger text with expandable details
                        <>
                          <div className={`flex items-center justify-between`}>
                            <div className={`flex items-center gap-2 flex-wrap ${lesson.isCancelled ? 'text-red-600' : ''}`}>
                              {lesson.isCancelled ? (
                                <span className="text-base font-medium">
                                  {getMobileSubjectAbbreviation(lesson.subject)} {lesson.class} – Entfällt
                                </span>
                              ) : (
                                <>
                                  <span className="text-base font-medium">
                                    {getMobileSubjectAbbreviation(lesson.subject)} {lesson.class}
                                    {lesson.isSubstitute && <span className="text-purple-600"> Vertretung</span>}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {/* Show expand arrow only if there are details to show */}
                            {(lesson.location || lesson.adminComment || lesson.otherTeachers?.length > 0) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMobileLessonDetails(lesson.id);
                                }}
                              >
                                {expandedMobileLessonDetails.has(lesson.id) ? 
                                  <ChevronUp className="h-3 w-3" /> : 
                                  <ChevronDown className="h-3 w-3" />
                                }
                              </Button>
                            )}
                          </div>
                          
                          {/* Expanded mobile details */}
                          {expandedMobileLessonDetails.has(lesson.id) && (
                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                              {lesson.location && (
                                <div>📍 {lesson.location}</div>
                              )}
                              {lesson.otherTeachers && lesson.otherTeachers.length > 0 && (
                                <div>
                                  👥 Mit: {lesson.otherTeachers.map((teacher: any, index: number) => (
                                    <span key={teacher.id}>
                                      {teacher.name}
                                      {index < lesson.otherTeachers.length - 1 && ', '}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {lesson.adminComment && (
                                <div className="text-blue-600 bg-blue-50 p-1 rounded">
                                  <Info className="h-3 w-3 inline mr-1" />
                                  {lesson.adminComment}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        // Desktop Layout - More compact
                        <>
                          <div className={`flex items-center gap-2 flex-wrap ${lesson.isCancelled ? 'text-red-600' : ''}`}>
                            <span className="font-medium">
                              {lesson.subject} {lesson.class}
                              {lesson.isCancelled && ' – Entfällt'}
                              {lesson.isSubstitute && <span className="text-purple-600"> (Vertretung)</span>}
                            </span>
                            {lesson.location && (
                              <span className="text-gray-500 text-sm">• {lesson.location}</span>
                            )}
                            {lesson.otherTeachers && lesson.otherTeachers.length > 0 && (
                              <>
                                <span className="text-gray-500 text-sm">• mit </span>
                                {lesson.otherTeachers.map((teacher: any, index: number) => (
                                  <span key={teacher.id} className="text-gray-500 text-sm">
                                    {teacher.name}
                                    {index < lesson.otherTeachers.length - 1 && ', '}
                                  </span>
                                ))}
                              </>
                            )}
                            {lesson.isSubstitute && (
                              <span className="text-purple-600"> • für {lesson.substituteFor}</span>
                            )}
                          </div>
                          
                          {/* Desktop admin comment - shown inline */}
                          {lesson.adminComment && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded mt-1">
                              <Info className="h-3 w-3 inline mr-1" />
                              {lesson.adminComment}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {lesson.isCurrent && !isMobile && (
                      <span className="text-xs text-blue-600">Aktuell</span>
                    )}

                    {!lesson.isCancelled && needsAttendanceTracking(lesson.time, lesson.endTime, selectedDate, lesson.isCurrent) && (
                      <>
                        {attendanceStatus === 'complete' ? (
                          <Badge
                            className="cursor-pointer bg-green-50 hover:bg-green-100 text-green-700 border-green-200 flex items-center gap-1 px-2 py-1"
                            onClick={() => onAttendanceClick(lesson.id, 'overview')}
                          >
                            <Check className="h-3 w-3" />
                            <span className="text-xs">
                              {getAttendanceSummary(lesson)?.present}/{getAttendanceSummary(lesson)?.late}/{getAttendanceSummary(lesson)?.absent}
                            </span>
                          </Badge>
                        ) : attendanceStatus === 'incomplete' ? (
                          <Badge
                            className="cursor-pointer bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 flex items-center gap-1 px-2 py-1"
                            onClick={() => onAttendanceClick(lesson.id, 'edit')}
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs">
                              {attendanceNumbers.present}/<span className="text-red-600">{attendanceNumbers.missing}</span>?/{attendanceNumbers.absent}
                            </span>
                          </Badge>
                        ) : (
                          <Badge
                            className="cursor-pointer bg-red-50 hover:bg-red-100 text-red-600 border-red-200 flex items-center gap-1 px-2 py-1"
                            onClick={() => onAttendanceClick(lesson.id, 'edit')}
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs">
                              ({attendanceNumbers.potentialPresent}?/{attendanceNumbers.absent})
                            </span>
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
      </Card>
    </DebugOverlay>
  );
}
