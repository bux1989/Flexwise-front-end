import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, AlertTriangle, AlertCircle, X, RefreshCw, MessageSquare } from 'lucide-react';
import { getTimetableForClass, getStudentsForClass, Lesson, TIME_SLOTS } from '@flexwise/shared/domains/academic';
import { useIsMobile } from '../ui/use-mobile';

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

const timeSlots = TIME_SLOTS;

export function LiveView({ selectedWeek, selectedClass }: LiveViewProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
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
    return <MessageSquare className="h-3 w-3 text-blue-600" />;
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    // Here you would open the attendance modal
    // For now, just show an alert
    alert(`Clicked on ${lesson.subject} lesson - ${lesson.attendanceStatus}`);
  };

  const renderLessonCard = (lesson: Lesson) => (
    <div
      key={lesson.id}
      className={`p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
        lesson.status === 'cancelled' ? 'opacity-60' : ''
      } ${lesson.subjectColor} border-l-current`}
      onClick={() => handleLessonClick(lesson)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <h4 className={`font-medium text-sm ${lesson.status === 'cancelled' ? 'line-through' : ''}`}>
              {lesson.subject}
            </h4>
            {getChangeIcon(lesson)}
            {getCommentIcon(lesson)}
          </div>
          
          {lesson.status !== 'cancelled' && (
            <>
              <p className="text-xs text-muted-foreground">
                {lesson.teacher} • {lesson.room}
              </p>
              {lesson.adminComment && (
                <p className="text-xs text-blue-600 mt-1 italic">
                  {lesson.adminComment}
                </p>
              )}
            </>
          )}
          
          {lesson.status === 'cancelled' && (
            <p className="text-xs text-red-600">Entfällt</p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {getStatusIcon(lesson)}
          {lesson.isOngoing && (
            <Badge variant="default" className="text-xs">
              Läuft
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Timetable Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Stundenplan - {selectedClass.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            // Mobile: List view
            <div className="space-y-4">
              {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].map(day => (
                <div key={day}>
                  <h3 className="font-semibold mb-2 text-primary">{day}</h3>
                  <div className="space-y-2">
                    {timeSlots.map(slot => {
                      const lesson = classTimetable.find(l => l.day === day && l.period === slot.period);
                      if (!lesson) return null;
                      
                      return (
                        <div key={`${day}-${slot.period}`} className="flex gap-2">
                          <div className="w-20 text-xs text-muted-foreground flex-shrink-0 pt-2">
                            {slot.time}
                          </div>
                          <div className="flex-1">
                            {renderLessonCard(lesson)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Grid view
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-2 min-w-[800px]">
                {/* Header */}
                <div></div>
                {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].map(day => (
                  <div key={day} className="font-semibold text-center p-2 bg-muted rounded">
                    {day}
                  </div>
                ))}
                
                {/* Time slots and lessons */}
                {timeSlots.filter(slot => hasLessonsInPeriod(slot.period)).map(slot => (
                  <React.Fragment key={slot.period}>
                    <div className="flex flex-col items-center justify-center p-2 bg-muted rounded text-xs">
                      <div className="font-medium">{slot.period}.</div>
                      <div className="text-muted-foreground">{slot.time}</div>
                    </div>
                    
                    {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].map(day => {
                      const lesson = classTimetable.find(l => l.day === day && l.period === slot.period);
                      
                      return (
                        <div key={`${day}-${slot.period}`} className="min-h-[80px]">
                          {lesson ? renderLessonCard(lesson) : <div className="h-full"></div>}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Anwesenheit vollständig</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span>Anwesenheit unvollständig</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span>Anwesenheit fehlt</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 text-blue-600" />
              <span>Änderung</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
