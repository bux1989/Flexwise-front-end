import React, { useState } from 'react';
import { Header } from './components/Header';
import { LiveView } from './components/LiveView';
import { StatisticsView } from './components/StatisticsView';
import { getAllCoursesAndClasses, getClassesForStatistics } from './data/mockData';
import { useIsMobile } from './components/ui/use-mobile';

// Get both classes and courses
const { classes, courses } = getAllCoursesAndClasses();
const allItems = [...classes, ...courses];

export default function App() {
  const [currentView, setCurrentView] = useState<'live' | 'statistics'>('live');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  // Default to teacher's personal schedule for live view
  const [selectedClass, setSelectedClass] = useState(allItems[0]);
  const [statisticsViewType, setStatisticsViewType] = useState<'class' | 'student' | 'course'>('class');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const isMobile = useIsMobile();

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
    <div className="min-h-screen bg-background">
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        classes={allItems}
        statisticsViewType={statisticsViewType}
      />
      
      <main className={`mx-auto ${isMobile ? 'px-2 py-4' : 'container px-6 py-8'}`}>
        {currentView === 'live' ? (
          <LiveView
            selectedWeek={selectedWeek}
            selectedClass={selectedClass}
          />
        ) : (
          <StatisticsView
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