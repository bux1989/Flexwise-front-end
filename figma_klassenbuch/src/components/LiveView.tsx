import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Check, AlertTriangle, AlertCircle, X, RefreshCw, MessageSquare } from 'lucide-react';
import { AttendanceModal } from './AttendanceModal';
import { getTimetableForClass, getStudentsForClass, Lesson } from '../data/mockData';
import { useIsMobile } from './ui/use-mobile';

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
}

interface LiveViewProps {
  selectedWeek: Date;
  selectedClass: Class;
}

const timeSlots = [
  { period: 1, time: '08:00-08:45' },
  { period: 2, time: '08:50-09:35' },
  { period: 3, time: '09:55-10:40' },
  { period: 4, time: '10:45-11:30' },
  { period: 5, time: '11:50-12:35' },
  { period: 6, time: '12:40-13:25' },
  { period: 7, time: '13:45-14:30' },
  { period: 8, time: '14:35-15:20' },
  { period: 9, time: '15:25-16:10' },
  { period: 10, time: '16:15-17:00' },
];

export function LiveView({ selectedWeek, selectedClass }: LiveViewProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [commentModalLesson, setCommentModalLesson] = useState<Lesson | null>(null);
  const isMobile = useIsMobile();

  // Get class-specific data
  const classTimetable = getTimetableForClass(selectedClass.id);

  // Check if a time slot has any lessons across all days
  const hasLessonsInPeriod = (period: number) => {
    const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
    return weekDays.some(day => {
      const lesson = classTimetable.find(lesson => lesson.period === period && lesson.day === day);
      return lesson !== undefined;
    });
  };

  const getWeekDates = (selectedWeek: Date) => {
    const startOfWeek = new Date(selectedWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getStatusIcon = (lesson: Lesson) => {
    // Don't show any icon for future lessons
    if (lesson.attendanceStatus === 'future') {
      return null;
    }

    switch (lesson.attendanceStatus) {
      case 'complete':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'missing':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'incomplete':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getChangeIcon = (lesson: Lesson) => {
    switch (lesson.status) {
      case 'cancelled':
        return <X className="h-3 w-3 text-red-600" />;
      case 'room_changed':
      case 'teacher_changed':
        return <RefreshCw className="h-3 w-3 text-blue-600" />;
      default:
        return null;
    }
  };

  const getCommentIcon = (lesson: Lesson) => {
    if (!lesson.adminComment) return null;
    
    if (isMobile) {
      // On mobile, return a clickable icon that opens modal
      return (
        <MessageSquare 
          className="h-3 w-3 text-blue-600 cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation();
            setCommentModalLesson(lesson);
          }}
        />
      );
    }

    // On desktop, use tooltip as before
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <MessageSquare className="h-3 w-3 text-blue-600 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64">
          <p className="text-sm">{lesson.adminComment}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const getLessonBackgroundColor = (lesson: Lesson) => {
    switch (lesson.status) {
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      case 'room_changed':
        return 'bg-blue-50 border-blue-200';
      case 'teacher_changed':
        return 'bg-amber-50 border-amber-200';
      default:
        return '';
    }
  };

  const canEditAttendance = (lesson: Lesson) => {
    return lesson.status !== 'cancelled' && (lesson.isPast || lesson.isOngoing);
  };

  const getLessonForSlot = (period: number, day: string) => {
    return classTimetable.find(lesson => lesson.period === period && lesson.day === day);
  };

  // Handle lesson click - mobile vs desktop behavior
  const handleLessonClick = (lesson: Lesson) => {
    if (canEditAttendance(lesson)) {
      setSelectedLesson(lesson);
    }
  };

  const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
  const mobileWeekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
  const displayWeekDays = isMobile ? mobileWeekDays : weekDays;
  const weekDates = getWeekDates(selectedWeek);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-4' : 'justify-between'}`}>
          <div className={isMobile ? 'w-full text-center' : ''}>
            <h2 className="text-2xl font-semibold">Stundenplan - Live Ansicht</h2>
            <p className="text-muted-foreground">{selectedClass.name}</p>
          </div>
          
          {/* Hide legend on mobile */}
          {!isMobile && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Anwesenheit erfasst</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span>Unvollständig</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Anwesenheit fehlt</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>Kommentar</span>
              </div>
            </div>
          )}
        </div>

        {/* Timetable Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Wochenstundenplan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className={`p-3 text-left font-medium bg-muted ${isMobile ? 'min-w-8' : 'min-w-20'}`}>
                      {isMobile ? 'St.' : 'Stunde'}
                    </th>
                    {displayWeekDays.map((day, index) => (
                      <th key={day} className={`p-3 text-center font-medium bg-muted ${isMobile ? 'min-w-16' : 'min-w-40'}`}>
                        <div>
                          <div>{day}</div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {weekDates[index].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => {
                    const hasLessons = hasLessonsInPeriod(slot.period);
                    const rowHeight = hasLessons ? (isMobile ? 'min-h-20' : 'min-h-16') : 'h-8';
                    
                    return (
                      <tr key={slot.period} className="border-b hover:bg-muted/30">
                        <td className={`p-3 border-r bg-muted/50 ${!hasLessons ? 'py-1' : ''}`}>
                          <div className="text-center">
                            <div className="font-semibold">{slot.period}</div>
                            {/* Hide time on mobile */}
                            {!isMobile && !hasLessons && (
                              <div className="text-xs text-muted-foreground">{slot.time}</div>
                            )}
                            {!isMobile && hasLessons && (
                              <div className="text-xs text-muted-foreground">{slot.time}</div>
                            )}
                          </div>
                        </td>
                        {weekDays.map((day, dayIndex) => {
                          const lesson = getLessonForSlot(slot.period, day);
                          return (
                            <td key={`${slot.period}-${day}`} className={`border-r ${isMobile ? 'p-1' : 'p-2'} ${!hasLessons ? 'py-1' : ''}`}>
                              {lesson ? (
                                <div
                                  className={`p-2 rounded-md transition-all border ${
                                    canEditAttendance(lesson) 
                                      ? 'cursor-pointer hover:shadow-md hover:border-primary' 
                                      : lesson.status === 'cancelled' 
                                        ? 'opacity-60' 
                                        : 'opacity-75'
                                  } ${lesson.subjectColor} ${getLessonBackgroundColor(lesson)} ${rowHeight}`}
                                  onClick={() => handleLessonClick(lesson)}
                                >
                                  <div className={`space-y-1 ${isMobile ? 'text-xs' : ''}`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1">
                                        <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                          {lesson.subject}
                                        </span>
                                        {getChangeIcon(lesson)}
                                        {getCommentIcon(lesson)}
                                      </div>
                                      {getStatusIcon(lesson)}
                                    </div>
                                    {lesson.teacher && (
                                      <div className={`text-blue-600 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                        {lesson.teacher}
                                        {/* Remove explaining text on mobile */}
                                        {!isMobile && lesson.status === 'teacher_changed' && lesson.originalTeacher && (
                                          <span className="text-muted-foreground"> (war: {lesson.originalTeacher})</span>
                                        )}
                                      </div>
                                    )}
                                    {lesson.room && (
                                      <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                        {lesson.room}
                                        {/* Remove explaining text on mobile */}
                                        {!isMobile && lesson.status === 'room_changed' && lesson.originalRoom && (
                                          <span className="text-muted-foreground"> (war: {lesson.originalRoom})</span>
                                        )}
                                      </div>
                                    )}
                                    {lesson.status === 'cancelled' && (
                                      <div className={`text-red-600 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                        ENTFÄLLT
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className={`flex items-center justify-center text-muted-foreground ${hasLessons ? (isMobile ? 'h-20' : 'h-16') : 'h-8'}`}>
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Hide Legends on mobile */}
        {!isMobile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subject Legend */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Fächer</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Array.from(new Set(classTimetable.map(lesson => lesson.subject))).map((subject) => {
                    const lesson = classTimetable.find(l => l.subject === subject);
                    if (!lesson) return null;
                    
                    const subjectLabels: Record<string, string> = {
                      'DAZ': 'DAZ (Deutsch als Zweitsprache)',
                      'En': 'En (Englisch)',
                      'Ma': 'Ma (Mathematik)',
                      'GeWi': 'GeWi (Gesellschaftswissenschaften)',
                      'NaWi': 'NaWi (Naturwissenschaften)',
                      'Sp': 'Sp (Sport)',
                      'De': 'De (Deutsch)',
                      'Ph': 'Ph (Physik)',
                      'Ge': 'Ge (Geschichte)',
                      'Bio': 'Bio (Biologie)',
                      'Ch': 'Ch (Chemie)',
                      'Mu': 'Mu (Musik)',
                      'Fr': 'Fr (Französisch)',
                      'Ku': 'Ku (Kunst)',
                      'Eth': 'Eth (Ethik)',
                      'Kla': 'Kla (Klassenleitung)',
                      'AUB': 'AUB (Arbeitsunterricht)',
                      'Inf': 'Inf (Informatik)',
                      'PoWi': 'PoWi (Politik und Wirtschaft)',
                      'AWT': 'AWT (Arbeitslehre)',
                      'WPU': 'WPU (Wahlpflichtunterricht)',
                      // Course subjects
                      'Bowling': 'Bowling (Wahlpflichtkurs)',
                      'Tischtennis': 'Tischtennis (Wahlpflichtkurs)',
                    };
                    
                    return (
                      <div key={subject} className="flex items-center space-x-2">
                        <div className={`w-4 h-4 border rounded ${lesson.subjectColor.replace('text-', 'border-')}`}></div>
                        <span>{subjectLabels[subject] || subject}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Status Legend */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Symbole</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                    <span>Admin-Kommentar (mit Maus berühren)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                    <X className="h-3 w-3 text-red-600" />
                    <span>Stunde entfällt</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                    <RefreshCw className="h-3 w-3 text-blue-600" />
                    <span>Raumänderung</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
                    <RefreshCw className="h-3 w-3 text-blue-600" />
                    <span>Lehrkraftwechsel</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Modal */}
        {selectedLesson && (
          <AttendanceModal
            lesson={selectedLesson}
            classData={selectedClass}
            isOpen={!!selectedLesson}
            onClose={() => setSelectedLesson(null)}
          />
        )}

        {/* Comment Modal for Mobile */}
        {commentModalLesson && (
          <Dialog open={!!commentModalLesson} onOpenChange={() => setCommentModalLesson(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Stundenkommentar</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{commentModalLesson.subject}</span>
                  <span>•</span>
                  <span>{commentModalLesson.teacher}</span>
                  <span>•</span>
                  <span>{commentModalLesson.room}</span>
                </div>
                <p className="text-sm">{commentModalLesson.adminComment}</p>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setCommentModalLesson(null)}>
                    Schließen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}