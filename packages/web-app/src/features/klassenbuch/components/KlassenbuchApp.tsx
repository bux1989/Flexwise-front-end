import React, { useState } from 'react';
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
}

export function KlassenbuchApp({ onClose, currentTeacher, hideHeader = false }: KlassenbuchAppProps) {
  const [currentView, setCurrentView] = useState<'live' | 'statistics'>('live');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  // Default to teacher's personal schedule for live view
  const [selectedClass, setSelectedClass] = useState(allItems[0]);
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
    if (view === 'statistics') {
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
        {hideHeader && (
          <div className="mb-6 bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant={currentView === 'live' ? 'default' : 'outline'}
                  onClick={() => handleViewChange('live')}
                  className="flex items-center space-x-2"
                >
                  <span>Live Ansicht</span>
                </Button>
                <Button
                  variant={currentView === 'statistics' ? 'default' : 'outline'}
                  onClick={() => handleViewChange('statistics')}
                  className="flex items-center space-x-2"
                >
                  <span>Statistiken</span>
                </Button>
              </div>

              {/* Add class/course selection here if needed */}
              <div className="text-sm text-gray-600">
                {selectedClass.name}
              </div>
            </div>
          </div>
        )}

        {currentView === 'live' ? (
          <KlassenbuchLiveView
            selectedWeek={selectedWeek}
            selectedClass={selectedClass}
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
