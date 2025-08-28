import React from 'react';
import { Header } from './Header';
import { LiveView } from './LiveView';
import { StatisticsView } from './StatisticsView';
import { useIsMobile } from '../ui/use-mobile';
import { useKlassenbuchState } from '../../../shared/domains/academic';

export default function KlassenbuchApp() {
  const isMobile = useIsMobile();

  // Use domain hook for state management
  const {
    currentView,
    selectedWeek,
    selectedClass,
    statisticsViewType,
    selectedStudent,
    allItems,
    setCurrentView,
    setSelectedWeek,
    setSelectedClass,
    setStatisticsViewType,
    setSelectedStudent,
    changeWeek,
    goToCurrentWeek,
    weekRange,
    filteredClasses
  } = useKlassenbuchState();

  // Domain hook provides all the handler functions

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        classes={allItems}
        statisticsViewType={statisticsViewType}
        isMobile={isMobile}
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
            onViewTypeChange={setStatisticsViewType}
            selectedStudent={selectedStudent}
            onStudentSelect={setSelectedStudent}
          />
        )}
      </main>
    </div>
  );
}
