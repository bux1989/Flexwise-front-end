// Klassenbuch hooks for Academic domain
import { useState, useEffect, useMemo } from 'react';
import { 
  formatWeekRange, 
  getNextWeek, 
  getPreviousWeek, 
  getCurrentWeek,
  getFilteredClassesForView,
  type Class 
} from './utils';
import { 
  getAllCoursesAndClasses, 
  getClassesForStatistics,
  getTimetableForClass,
  getStudentStatisticsForClass 
} from './data';

// Hook for managing klassenbuch view state
export function useKlassenbuchState() {
  const [currentView, setCurrentView] = useState<'live' | 'statistics'>('live');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [statisticsViewType, setStatisticsViewType] = useState<'class' | 'student' | 'course'>('class');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  // Get all available classes and courses
  const { classes, courses } = getAllCoursesAndClasses();
  const allItems = [...classes, ...courses];
  const [selectedClass, setSelectedClass] = useState<Class>(allItems[0]);

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

  const changeWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'next' ? getNextWeek(selectedWeek) : getPreviousWeek(selectedWeek);
    setSelectedWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(getCurrentWeek());
  };

  return {
    // State
    currentView,
    selectedWeek,
    selectedClass,
    statisticsViewType,
    selectedStudent,
    allItems,
    
    // Actions
    setCurrentView: handleViewChange,
    setSelectedWeek,
    setSelectedClass,
    setStatisticsViewType: handleStatisticsViewTypeChange,
    setSelectedStudent: handleStudentSelect,
    changeWeek,
    goToCurrentWeek,
    
    // Computed
    weekRange: formatWeekRange(selectedWeek),
    filteredClasses: getFilteredClassesForView(allItems, currentView, statisticsViewType)
  };
}

// Hook for timetable data
export function useKlassenbuchTimetable(classId: string) {
  const timetable = useMemo(() => {
    return getTimetableForClass(classId);
  }, [classId]);

  return {
    timetable,
    isLoading: false,
    error: null
  };
}

// Hook for statistics data
export function useKlassenbuchStatistics(classId: string) {
  const statistics = useMemo(() => {
    if (!classId) return [];
    return getStudentStatisticsForClass(classId);
  }, [classId]);

  return {
    statistics,
    isLoading: false,
    error: null
  };
}

// Hook for managing lesson selection and attendance
export function useLessonSelection() {
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);

  const handleLessonClick = (lesson: any) => {
    setSelectedLesson(lesson);
    setAttendanceDialogOpen(true);
  };

  const closeAttendanceDialog = () => {
    setSelectedLesson(null);
    setAttendanceDialogOpen(false);
  };

  return {
    selectedLesson,
    attendanceDialogOpen,
    handleLessonClick,
    closeAttendanceDialog,
    setSelectedLesson,
    setAttendanceDialogOpen
  };
}
