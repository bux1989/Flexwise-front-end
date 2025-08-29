import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { KlassenbuchHeader } from './KlassenbuchHeader';
import { KlassenbuchLiveView } from './KlassenbuchLiveView';
import { KlassenbuchStatisticsView } from './KlassenbuchStatisticsView';
import { getAllCoursesAndClasses, getClassesForStatistics } from '../data/klassenbuchDataAdapter';

// Get both classes and courses
const { classes, courses } = getAllCoursesAndClasses();
const allItems = [...classes, ...courses];

interface KlassenbuchAppProps {
  onClose?: () => void;
  currentTeacher?: string;
  hideHeader?: boolean;
  currentView?: 'live' | 'statistics';
  onViewChange?: (view: 'live' | 'statistics') => void;
  selectedWeek?: Date;
  onWeekChange?: (week: Date) => void;
  selectedClass?: any;
  onClassChange?: (classItem: any) => void;
  onAttendanceClick?: (lessonId: string, viewMode?: 'overview' | 'edit') => void;
}

export function KlassenbuchApp({
  onClose,
  currentTeacher,
  hideHeader = false,
  currentView: externalCurrentView,
  onViewChange: externalOnViewChange,
  selectedWeek: externalSelectedWeek,
  onWeekChange: externalOnWeekChange,
  selectedClass: externalSelectedClass,
  onClassChange: externalOnClassChange,
  onAttendanceClick
}: KlassenbuchAppProps) {
  const [internalCurrentView, setInternalCurrentView] = useState<'live' | 'statistics'>('live');
  const [internalSelectedWeek, setInternalSelectedWeek] = useState(new Date());
  const [internalSelectedClass, setInternalSelectedClass] = useState(allItems[0]);

  // Use external control if provided, otherwise use internal state
  const currentView = externalCurrentView !== undefined ? externalCurrentView : internalCurrentView;
  const setCurrentView = externalOnViewChange || setInternalCurrentView;
  const selectedWeek = externalSelectedWeek !== undefined ? externalSelectedWeek : internalSelectedWeek;
  const setSelectedWeek = externalOnWeekChange || setInternalSelectedWeek;
  const selectedClass = externalSelectedClass !== undefined ? externalSelectedClass : internalSelectedClass;
  const setSelectedClass = externalOnClassChange || setInternalSelectedClass;
  const [statisticsViewType, setStatisticsViewType] = useState<'class' | 'student' | 'course'>('class');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    setCurrentView('statistics');
    setStatisticsViewType('student');
  };

  const handleViewChange = (view: 'live' | 'statistics') => {
    setCurrentView(view);

    // When switching to statistics view, default to first actual class if needed
    if (view === 'statistics' && selectedClass) {
      const classesForStats = getClassesForStatistics();
      if (selectedClass.type === 'teacher' && classesForStats.length > 0) {
        setSelectedClass(classesForStats[0]);
      }
    }
  };

  const handleStatisticsViewTypeChange = (viewType: 'class' | 'student' | 'course') => {
    setStatisticsViewType(viewType);
    
    // Clear selected student when changing away from student view
    if (viewType !== 'student') {
      setSelectedStudent('');
    }
  };

  return (
    <div className={hideHeader ? "" : "min-h-screen bg-background"}>
      {!hideHeader && (
        <KlassenbuchHeader
          currentView={currentView}
          onViewChange={handleViewChange}
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
          classes={allItems}
          statisticsViewType={statisticsViewType}
          onClose={onClose}
        />
      )}

      <main className={hideHeader ? "" : "mx-auto container px-6 py-8"}>
        {currentView === 'live' ? (
          <KlassenbuchLiveView
            selectedWeek={selectedWeek}
            selectedClass={selectedClass}
            onAttendanceClick={onAttendanceClick}
          />
        ) : (
          <KlassenbuchStatisticsView
            selectedClass={selectedClass}
            onViewTypeChange={handleStatisticsViewTypeChange}
            selectedStudent={selectedStudent}
            onStudentSelect={handleStudentSelect}
          />
        )}
      </main>
    </div>
  );
}
