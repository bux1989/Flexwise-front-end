import React from 'react';
import { Calendar, AlertCircle, Check, ChevronUp, ChevronDown, Clock, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { DatePicker } from './ui/date-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface LessonsElementProps {
  lessons: any[];
  selectedDate: Date;
  isToday: boolean;
  isLoadingLessons: boolean;
  lessonsError: string | null;
  isMobile: boolean;
  showAllLessonsOnMobile: boolean;
  expandedMobileLessonDetails: Set<number>;
  onDateSelect: (date: Date | undefined) => void;
  onTodayClick: () => void;
  onToggleShowAllLessons: (checked: boolean) => void;
  onToggleMobileLessonDetails: (id: number) => void;
  onAttendanceClick: (lessonId: number, mode: string) => void;
  needsAttendanceTracking: (time: string, endTime: string, date: Date, isCurrent: boolean) => boolean;
  getAttendanceStatus: (lesson: any) => string;
  getAttendanceNumbers: (lesson: any) => any;
  getAttendanceSummary: (lesson: any) => any;
  getMobileSubjectAbbreviation: (subject: string) => string;
  getMobileTeacherAbbreviation: (name: string) => string;
}

export function LessonsElement({
  lessons,
  selectedDate,
  isToday,
  isLoadingLessons,
  lessonsError,
  isMobile,
  showAllLessonsOnMobile,
  expandedMobileLessonDetails,
  onDateSelect,
  onTodayClick,
  onToggleShowAllLessons,
  onToggleMobileLessonDetails,
  onAttendanceClick,
  needsAttendanceTracking,
  getAttendanceStatus,
  getAttendanceNumbers,
  getAttendanceSummary,
  getMobileSubjectAbbreviation,
  getMobileTeacherAbbreviation,
}: LessonsElementProps) {
  // Filter lessons for mobile display
  const displayedLessons = isMobile && !showAllLessonsOnMobile 
    ? lessons.filter(lesson => lesson.isCurrent || lesson.isUpcoming || lesson.isSubstitute || lesson.substitute_detected)
    : lessons;

  return (
    <Card className="lessons-element">
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
                onCheckedChange={onToggleShowAllLessons}
              />
              <Label htmlFor="show-all-lessons-mobile" className="text-xs">
                Alle
              </Label>
            </div>
          )}
          <Button 
            size="sm" 
            className={`${isToday ? 'bg-cyan-400 hover:bg-cyan-500' : 'bg-gray-200 hover:bg-gray-300'} text-black h-8 px-3`}
            onClick={onTodayClick}
          >
            Heute
          </Button>
          <div className="max-w-[280px]">
            <DatePicker
              date={selectedDate}
              onDateChange={onDateSelect}
              placeholder="Datum auswählen"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="space-y-1">
          {isLoadingLessons ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Lade Stundenplan...
            </div>
          ) : lessonsError ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <div>Fehler beim Laden des Stundenplans</div>
              <div className="text-sm text-gray-500 mt-1">{lessonsError}</div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              Keine Stunden für diesen Tag
            </div>
          ) : (
            <TooltipProvider>
              {displayedLessons.map((lesson) => {
                if (!lesson || typeof lesson !== 'object') {
                  console.warn('Invalid lesson data:', lesson);
                  return null;
                }

                const attendanceStatus = getAttendanceStatus(lesson);
                const attendanceNumbers = getAttendanceNumbers(lesson);

                return (
                  <div 
                    key={lesson.id || lesson.lesson_id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      lesson.isCurrent 
                        ? 'bg-blue-50 border-l-4 border-blue-400' 
                        : lesson.isSubstitute || lesson.substitute_detected
                        ? 'bg-purple-50'
                        : lesson.isCancelled
                        ? 'bg-red-50'
                        : 'bg-gray-50'
                    }`}
                    onClick={isMobile ? () => onToggleMobileLessonDetails(lesson.id) : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`font-medium text-gray-600 min-w-[50px] leading-tight ${isMobile ? 'text-base' : 'text-sm'}`}>
                        <div>{lesson.time || (lesson.start_datetime ? new Date(lesson.start_datetime).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}) : '')} -</div>
                        <div>{lesson.endTime || (lesson.end_datetime ? new Date(lesson.end_datetime).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}) : '')}</div>
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
                                      {getMobileSubjectAbbreviation(lesson.subject || lesson.subject_name)} {lesson.class || lesson.class_name}
                                      {(lesson.isSubstitute || lesson.substitute_detected) && <span className="text-purple-600"> Vertretung</span>}
                                    </span>
                                  </>
                                )}
                              </div>
                              
                              {/* Show expand arrow only if there are details to show */}
                              {(lesson.roomChanged || lesson.adminComment || lesson.teacherRole === 'support') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleMobileLessonDetails(lesson.id || lesson.lesson_id);
                                  }}
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                >
                                  {expandedMobileLessonDetails.has(lesson.id || lesson.lesson_id) ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                            
                            {!lesson.isCancelled && (
                              <div className="text-sm text-gray-600 mt-1">
                                {lesson.room || lesson.room_name}
                                {lesson.otherTeachers && lesson.otherTeachers.length > 0 && (
                                  <span>
                                    {' • '}
                                    {lesson.otherTeachers
                                      ?.filter(t => lesson.teacherRole !== 'support' || t.isMainResponsible)
                                      ?.map((teacher, index) => (
                                        <span key={index}>
                                          {getMobileTeacherAbbreviation(teacher.name)}
                                          {index < (lesson.otherTeachers?.filter(t => lesson.teacherRole !== 'support' || t.isMainResponsible)?.length || 0) - 1 && ', '}
                                        </span>
                                      ))}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Expandable details section on mobile */}
                            {expandedMobileLessonDetails.has(lesson.id) && (
                              <div className="mt-2 space-y-1">
                                {lesson.teacherRole === 'support' && (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                      UB
                                    </Badge>
                                    <span className="text-xs text-gray-600">Unterrichtsbegleitung</span>
                                  </div>
                                )}
                                
                                {lesson.roomChanged && (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                      Raumwechsel
                                    </Badge>
                                    <span className="text-xs text-gray-600">
                                      Von {lesson.originalRoom} nach {lesson.room}
                                    </span>
                                  </div>
                                )}
                                
                                {lesson.adminComment && (
                                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded -mx-1">
                                    <div className="flex items-start gap-1">
                                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">{lesson.adminComment}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          // Desktop Layout - Full text
                          <>
                            <div className="font-medium flex items-center gap-2 flex-wrap">
                              {lesson.isCancelled ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600 line-through">{lesson.subject || lesson.subject_name}</span>
                                  <span className="text-red-600">Entfällt</span>
                                </div>
                              ) : (lesson.isSubstitute || lesson.substitute_detected) ? (
                                <div className="flex items-center gap-2">
                                  <span>{lesson.subject || lesson.subject_name}</span>
                                  <span className="text-purple-600">Vertretung</span>
                                </div>
                              ) : (
                                lesson.subject || lesson.subject_name
                              )}
                              
                              {lesson.teacherRole === 'support' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                      UB
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Unterrichtsbegleitung</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {lesson.roomChanged && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                      Raumwechsel
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Von {lesson.originalRoom} nach {lesson.room}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              {lesson.isCancelled ? (
                                <div>
                                  <span className="line-through text-red-500">{lesson.class || lesson.class_name}</span>
                                  <span className="text-red-600 ml-2">{lesson.cancellationReason}</span>
                                </div>
                              ) : (
                                <>
                                  {lesson.class || lesson.class_name} • {lesson.room || lesson.room_name}
                                  {lesson.otherTeachers && lesson.otherTeachers.length > 0 && (
                                    <>
                                      {' • '}
                                      {lesson.otherTeachers?.map((teacher, index) => (
                                        <span key={index}>
                                          <span className={teacher.isMainResponsible && lesson.teacherRole === 'support' ? 'underline' : ''}>
                                            {teacher.name}
                                          </span>
                                          {index < (lesson.otherTeachers?.length || 0) - 1 && ', '}
                                        </span>
                                      ))}
                                    </>
                                  )}
                                  {(lesson.isSubstitute || lesson.substitute_detected) && (
                                    <span className="text-purple-600"> • für {lesson.substituteFor}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </>
                        )}
                        
                        {/* Desktop admin comment - shown inline */}
                        {!isMobile && lesson.adminComment && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded mt-1">
                            <Info className="h-3 w-3 inline mr-1" />
                            {lesson.adminComment}
                          </div>
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
