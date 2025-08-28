import { useState, useMemo, useEffect } from 'react';
import { Calendar, Bell, MessageCircle, Menu, Info, Clock, MapPin, Plus, Check, AlertCircle, X, Edit, Trash2, HelpCircle, UserPlus, Search, Filter, Star, ChevronDown, ChevronUp, EyeOff, Eye, BookOpen, Users, UserX, User, FileText, LogOut, CalendarIcon, ClipboardList, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Checkbox } from './components/ui/checkbox';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Calendar as CalendarComponent } from './components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { useIsMobile } from './components/ui/use-mobile';

// Imported components and utilities
import { Header } from './components/Header';
import { AddTaskDialog } from './components/AddTaskDialog';
import { TimeInputWithArrows } from './components/TimeInputWithArrows';
import { CURRENT_TEACHER, INITIAL_TASKS, INITIAL_EVENTS, INITIAL_LESSONS, ASSIGNEE_GROUPS } from './constants/mockData';
import {
  getSubstituteLessons,
  getPriorityValue,
  needsAttendanceTracking,
  getAttendanceStatus,
  getAttendanceSummary,
  getAttendanceNumbers,
  formatDateTime,
  formatTimestamp,
  formatCompactTimestamp,
  getTeacherAbbreviation,
  createLessonNoteWithMetadata,
  parseLessonNote
} from './utils/helpers';

// Import Supabase helper
import { getCurrentUserProfile } from '../../packages/shared/lib/supabaseClient';

export default function App() {
  const isMobile = useIsMobile();

  // User profile state
  const [currentTeacher, setCurrentTeacher] = useState(CURRENT_TEACHER); // fallback to mock data
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getCurrentUserProfile();
        if (profile && profile.first_name && profile.last_name) {
          // Format the teacher name (e.g., "Frau Anna Müller" or "Herr John Schmidt")
          const salutation = profile.role === 'Teacher' ?
            (profile.first_name.endsWith('a') || profile.first_name.endsWith('e') ? 'Frau' : 'Herr') : 'Frau';
          const fullName = `${salutation} ${profile.first_name} ${profile.last_name}`;
          setCurrentTeacher(fullName);
        }
      } catch (error) {
        console.warn('Could not load user profile, using fallback:', error);
        // Keep the fallback value (CURRENT_TEACHER)
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'overview' | 'edit'>('edit');
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] = useState<number | null>(null);
  const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
  const [selectedStudentForExcuse, setSelectedStudentForExcuse] = useState<{lessonId: number, studentId: number, isEdit?: boolean} | null>(null);
  const [excuseReason, setExcuseReason] = useState('');
  const [tempAttendance, setTempAttendance] = useState<{[studentId: number]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}}>({});
  const [lessonNote, setLessonNote] = useState('');
  const [editingLessonNote, setEditingLessonNote] = useState<number | null>(null);
  const [tempLessonNote, setTempLessonNote] = useState('');
  
  // Task management state
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');
  const [taskDueDateFilter, setTaskDueDateFilter] = useState<string>('all');
  const [showHotListOnly, setShowHotListOnly] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedTaskForComment, setSelectedTaskForComment] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  
  // New task creation state
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  
  // Info board state - Default hide Vertretungsstunden on mobile
  const [showSubstituteLessons, setShowSubstituteLessons] = useState(!isMobile);
  
  // Mobile-specific expansion state
  const [expandedInfoItems, setExpandedInfoItems] = useState<Set<string>>(new Set());
  const [expandedMobileEvents, setExpandedMobileEvents] = useState<Set<number>>(new Set());
  const [expandedMobileTasks, setExpandedMobileTasks] = useState<Set<number>>(new Set());
  const [expandedInfoBoardPosts, setExpandedInfoBoardPosts] = useState<Set<string>>(new Set());
  
  // Mobile-specific schedule state
  const [showAllLessonsOnMobile, setShowAllLessonsOnMobile] = useState(false);
  const [expandedMobileLessonComments, setExpandedMobileLessonComments] = useState<Set<number>>(new Set());
  const [expandedMobileLessonDetails, setExpandedMobileLessonDetails] = useState<Set<number>>(new Set());
  
  // Expansion state for tasks and events
  const [taskDisplayCount, setTaskDisplayCount] = useState(3);
  const [eventDisplayCount, setEventDisplayCount] = useState(3);
  const [expandedEventDescriptions, setExpandedEventDescriptions] = useState<Set<number>>(new Set());
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  // Reset event display count when toggling past/future events
  const handleTogglePastEvents = (checked: boolean) => {
    setShowPastEvents(checked);
    setEventDisplayCount(3); // Reset to initial count
  };
  
  // Task editing and completion state
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editTaskData, setEditTaskData] = useState<{title: string, description: string, priority: string, dueDate: string, hotList: boolean, assignedTo: string[]}>({
    title: '', description: '', priority: 'medium', dueDate: '', hotList: false, assignedTo: []
  });
  const [completionCommentDialog, setCompletionCommentDialog] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<number | null>(null);
  const [completionComment, setCompletionComment] = useState('');
  const [expandedGroupAssignees, setExpandedGroupAssignees] = useState<Set<number>>(new Set());
  
  // Mock user permissions - user can assign tasks if they are a teacher
  const canAssignTasks = true;

  const substituteLessons = getSubstituteLessons();

  // Mobile-specific toggle functions
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

  const toggleMobileEventExpansion = (eventId: number) => {
    setExpandedMobileEvents(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(eventId)) {
        newExpanded.delete(eventId);
      } else {
        newExpanded.add(eventId);
      }
      return newExpanded;
    });
  };

  const toggleMobileTaskExpansion = (taskId: number) => {
    setExpandedMobileTasks(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return newExpanded;
    });
  };

  const toggleMobileLessonCommentExpansion = (lessonId: number) => {
    setExpandedMobileLessonComments(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(lessonId)) {
        newExpanded.delete(lessonId);
      } else {
        newExpanded.add(lessonId);
      }
      return newExpanded;
    });
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

  // Helper function for mobile teacher abbreviations
  const getMobileTeacherAbbreviation = (teacherName: string): string => {
    const parts = teacherName.split(' ');
    if (parts.length >= 2) {
      const firstInitial = parts[0].charAt(0);
      const lastName = parts[parts.length - 1];
      return firstInitial + lastName.substring(0, 2);
    }
    return teacherName.substring(0, 3);
  };

  // Helper function for mobile student name abbreviations
  const getMobileStudentName = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      // First name + first 2 letters of last name
      return `${firstName} ${lastName.substring(0, 2)}`;
    }
    return fullName; // fallback for single names
  };

  const toggleTask = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    if (!task.completed) {
      // Task is being completed - ask for completion comment
      setTaskToComplete(id);
      setCompletionCommentDialog(true);
    } else {
      // Task is being uncompleted
      setTasks(tasks.map(t => 
        t.id === id ? { 
          ...t, 
          completed: false,
          completedAt: null,
          completedBy: null
        } : t
      ));
    }
  };

  const completeTaskWithComment = () => {
    if (!taskToComplete) return;
    
    const now = formatTimestamp();
    setTasks(tasks.map(task => 
      task.id === taskToComplete ? { 
        ...task, 
        completed: true,
        completedAt: now,
        completedBy: CURRENT_TEACHER,
        comments: completionComment.trim() ? [
          ...task.comments,
          {
            id: task.comments.length + 1,
            text: completionComment.trim(),
            timestamp: now,
            author: CURRENT_TEACHER
          }
        ] : task.comments
      } : task
    ));
    
    setCompletionComment('');
    setCompletionCommentDialog(false);
    setTaskToComplete(null);
  };

  const toggleTaskHotList = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, hotList: !task.hotList } : task
    ));
  };

  const addCommentToTask = (taskId: number, commentText: string) => {
    const timestamp = formatTimestamp();
    setTasks(tasks.map(task => 
      task.id === taskId ? { 
        ...task, 
        comments: [...task.comments, { 
          id: task.comments.length + 1, 
          text: commentText, 
          timestamp,
          author: CURRENT_TEACHER
        }] 
      } : task
    ));
  };

  const createNewTask = (taskData: {
    title: string;
    description: string;
    priority: string;
    dueDate: Date | undefined;
    hotList: boolean;
    assignedTo: string[];
  }) => {
    const now = formatTimestamp();
    const newTask = {
      id: Math.max(...tasks.map(t => t.id)) + 1,
      title: taskData.title,
      description: taskData.description,
      completed: false,
      priority: taskData.priority,
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hotList: taskData.hotList,
      assignedTo: taskData.assignedTo,
      assignedBy: CURRENT_TEACHER,
      assignedAt: now,
      completedAt: null,
      completedBy: null,
      comments: []
    };

    setTasks([newTask, ...tasks]);
    setAddTaskDialogOpen(false);
  };

  const startEditingTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setEditTaskData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      hotList: task.hotList,
      assignedTo: task.assignedTo
    });
    setEditingTask(taskId);
  };

  const saveTaskEdit = () => {
    if (!editingTask) return;
    
    setTasks(tasks.map(task => 
      task.id === editingTask ? {
        ...task,
        title: editTaskData.title,
        description: editTaskData.description,
        priority: editTaskData.priority,
        dueDate: editTaskData.dueDate,
        hotList: editTaskData.hotList,
        assignedTo: editTaskData.assignedTo
      } : task
    ));
    
    setEditingTask(null);
    setEditTaskData({title: '', description: '', priority: 'medium', dueDate: '', hotList: false, assignedTo: []});
  };

  const cancelTaskEdit = () => {
    setEditingTask(null);
    setEditTaskData({title: '', description: '', priority: 'medium', dueDate: '', hotList: false, assignedTo: []});
  };

  const toggleGroupAssigneeExpansion = (taskId: number) => {
    setExpandedGroupAssignees(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return newExpanded;
    });
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      if (showCompletedTasks) {
        if (!task.completed) return false;
      } else {
        if (task.completed) return false;
      }
      
      if (taskSearchQuery && !task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) && 
          !task.description.toLowerCase().includes(taskSearchQuery.toLowerCase())) {
        return false;
      }
      
      if (taskPriorityFilter !== 'all' && task.priority !== taskPriorityFilter) return false;
      
      if (taskDueDateFilter !== 'all') {
        const today = new Date();
        const taskDue = new Date(task.dueDate);
        const diffTime = taskDue.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (taskDueDateFilter) {
          case 'overdue':
            if (diffDays >= 0) return false;
            break;
          case 'today':
            if (diffDays !== 0) return false;
            break;
          case 'tomorrow':
            if (diffDays !== 1) return false;
            break;
          case 'this_week':
            if (diffDays < 0 || diffDays > 7) return false;
            break;
        }
      }
      
      if (showHotListOnly && !task.hotList) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (showCompletedTasks) {
        if (a.completedAt && b.completedAt) {
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        }
        return 0;
      } else {
        const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

    return filtered;
  }, [tasks, taskSearchQuery, taskPriorityFilter, taskDueDateFilter, showHotListOnly, showCompletedTasks]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDatePickerOpen(false);
    }
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  const handleEventRSVP = (eventId: number, response: 'attending' | 'maybe' | 'not_attending') => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, rsvp: event.rsvp === response ? null : response }
        : event
    ));
  };

  const handleOpenCommentDialog = (taskId: number) => {
    setSelectedTaskForComment(taskId);
    setCommentDialogOpen(true);
  };

  const handleToggleComments = (taskId: number) => {
    setExpandedComments(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return newExpanded;
    });
  };

  const handleAddComment = () => {
    if (selectedTaskForComment && newComment.trim()) {
      addCommentToTask(selectedTaskForComment, newComment.trim());
      setNewComment('');
      setCommentDialogOpen(false);
      setSelectedTaskForComment(null);
    }
  };

  const handleHeaderButtonClick = (action: string) => {
    alert(`Clicked: ${action}`);
  };

  const handleToggleEventDescription = (eventId: number) => {
    setExpandedEventDescriptions(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(eventId)) {
        newExpanded.delete(eventId);
      } else {
        newExpanded.add(eventId);
      }
      return newExpanded;
    });
  };

  const truncateDescription = (description: string, maxLength: number = 80) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim();
  };

  const currentDate = new Date();
  const dateString = formatDateTime();
  const isToday = selectedDate.toDateString() === currentDate.toDateString();

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

  // Helper function to convert month names to numbers
  const getMonthNumber = (month: string): string => {
    const monthMap: { [key: string]: string } = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    return monthMap[month] || '01';
  };

  // Helper function to create a proper Date object from event data
  const createEventDate = (event: any): Date => {
    const year = event.date.year;
    const month = getMonthNumber(event.date.month);
    const day = event.date.day.toString().padStart(2, '0');
    return new Date(`${year}-${month}-${day}`);
  };

  // Filter events by past/future with corrected date logic
  const filteredEvents = showPastEvents 
    ? events.filter(event => {
        const eventDate = createEventDate(event);
        return eventDate < currentDate;
      }).sort((a, b) => {
        const dateA = createEventDate(a);
        const dateB = createEventDate(b);
        return dateB.getTime() - dateA.getTime(); // Latest first
      })
    : events.filter(event => {
        const eventDate = createEventDate(event);
        return eventDate >= currentDate;
      }).sort((a, b) => {
        const dateA = createEventDate(a);
        const dateB = createEventDate(b);
        return dateA.getTime() - dateB.getTime(); // Earliest first
      });

  // Get displayed tasks and events with progressive limits
  const displayedTasks = filteredAndSortedTasks.slice(0, taskDisplayCount);
  const displayedEvents = filteredEvents.slice(0, eventDisplayCount);

  // Attendance functions
  const handleAttendanceClick = (lessonId: number, viewMode: 'overview' | 'edit' = 'edit') => {
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (lesson) {
      if (lesson.attendance && getAttendanceStatus(lesson) === 'complete' && viewMode === 'edit') {
        setAttendanceViewMode('overview');
      } else {
        setAttendanceViewMode(viewMode);
      }

      if (lesson.attendance && viewMode === 'edit') {
        const editAttendance: {[studentId: number]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};
        
        lesson.attendance.present.forEach(student => {
          editAttendance[student.id] = { status: 'present' };
        });
        
        lesson.attendance.late.forEach(student => {
          let arrivalTime = student.arrivalTime;
          if (!arrivalTime) {
            const [hours, minutes] = lesson.time.split(':').map(Number);
            const lessonStart = new Date();
            lessonStart.setHours(hours, minutes, 0, 0);
            const calculatedArrival = new Date(lessonStart.getTime() + (student.minutesLate * 60000));
            arrivalTime = calculatedArrival.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          }
          
          editAttendance[student.id] = { 
            status: 'late', 
            minutesLate: student.minutesLate,
            arrivalTime: arrivalTime,
            lateExcused: student.lateExcused || false
          };
        });
        
        lesson.attendance.absent.forEach(student => {
          editAttendance[student.id] = { 
            status: student.excused ? 'excused' : 'unexcused',
            excuseReason: student.reason || ''
          };
        });
        
        setTempAttendance(editAttendance);
        const parsedNote = parseLessonNote(lesson.lessonNote || '');
        setLessonNote(parsedNote.content);
      } else {
        // Initialize with pre-existing absences if no attendance data exists yet
        const initialAttendance: {[studentId: number]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};
        
        // Prefill pre-existing absences as excused
        if (lesson.preExistingAbsences) {
          lesson.preExistingAbsences.forEach(absence => {
            initialAttendance[absence.studentId] = {
              status: 'excused',
              excuseReason: absence.reason
            };
          });
        }
        
        setTempAttendance(initialAttendance);
        const parsedNote = parseLessonNote(lesson.lessonNote || '');
        setLessonNote(parsedNote.content);
      }
    }
    
    setSelectedLessonForAttendance(lessonId);
    setAttendanceDialogOpen(true);
  };

  const switchToEditMode = () => {
    const lesson = selectedLesson;
    if (lesson && lesson.attendance) {
      const editAttendance: {[studentId: number]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};
      
      lesson.attendance.present.forEach(student => {
        editAttendance[student.id] = { status: 'present' };
      });
      
      lesson.attendance.late.forEach(student => {
        let arrivalTime = student.arrivalTime;
        if (!arrivalTime) {
          const [hours, minutes] = lesson.time.split(':').map(Number);
          const lessonStart = new Date();
          lessonStart.setHours(hours, minutes, 0, 0);
          const calculatedArrival = new Date(lessonStart.getTime() + (student.minutesLate * 60000));
          arrivalTime = calculatedArrival.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }
        
        editAttendance[student.id] = { 
          status: 'late', 
          minutesLate: student.minutesLate,
          arrivalTime: arrivalTime,
          lateExcused: student.lateExcused || false
        };
      });
      
      lesson.attendance.absent.forEach(student => {
        editAttendance[student.id] = { 
          status: student.excused ? 'excused' : 'unexcused',
          excuseReason: student.reason || ''
        };
      });
      
      setTempAttendance(editAttendance);
      const parsedNote = parseLessonNote(lesson.lessonNote || '');
      setLessonNote(parsedNote.content);
    } else if (lesson) {
      // Initialize with pre-existing absences if no attendance data exists yet
      const initialAttendance: {[studentId: number]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};
      
      // Prefill pre-existing absences as excused
      if (lesson.preExistingAbsences) {
        lesson.preExistingAbsences.forEach(absence => {
          initialAttendance[absence.studentId] = {
            status: 'excused',
            excuseReason: absence.reason
          };
        });
      }
      
      setTempAttendance(initialAttendance);
      const parsedNote = parseLessonNote(lesson.lessonNote || '');
      setLessonNote(parsedNote.content);
    }
    setAttendanceViewMode('edit');
  };

  // Helper function to determine if lesson is currently running
  const isLessonCurrentlyRunning = (lesson: any): boolean => {
    if (!lesson) return false;
    
    // If lesson is marked as current, it's running
    if (lesson.isCurrent) return true;
    
    // Check if current time is within lesson time bounds
    const now = new Date();
    const [startHours, startMinutes] = lesson.time.split(':').map(Number);
    const [endHours, endMinutes] = lesson.endTime.split(':').map(Number);
    
    const lessonStart = new Date();
    lessonStart.setHours(startHours, startMinutes, 0, 0);
    
    const lessonEnd = new Date();
    lessonEnd.setHours(endHours, endMinutes, 0, 0);
    
    return now >= lessonStart && now <= lessonEnd;
  };

  // Helper function to get appropriate default late time
  const getDefaultLateTime = (lesson: any): string => {
    if (!lesson) return '';
    
    const now = new Date();
    const [startHours, startMinutes] = lesson.time.split(':').map(Number);
    const [endHours, endMinutes] = lesson.endTime.split(':').map(Number);
    
    const lessonStart = new Date();
    lessonStart.setHours(startHours, startMinutes, 0, 0);
    
    const lessonEnd = new Date();
    lessonEnd.setHours(endHours, endMinutes, 0, 0);
    
    let defaultTime: Date;
    
    // If lesson is currently running
    if (isLessonCurrentlyRunning(lesson)) {
      if (now <= lessonStart) {
        // Current time is before lesson start, use lesson start + 1 minute
        defaultTime = new Date(lessonStart.getTime() + (1 * 60000));
      } else if (now >= lessonEnd) {
        // Current time is after lesson end, use lesson start + 5 minutes (fallback)
        defaultTime = new Date(lessonStart.getTime() + (5 * 60000));
      } else {
        // Use current time (lesson is running and we're within bounds)
        defaultTime = new Date(now);
      }
    } else {
      // Lesson has passed, use lesson start + 5 minutes
      defaultTime = new Date(lessonStart.getTime() + (5 * 60000));
    }
    
    // Final safety check: ensure default time is within lesson bounds
    if (defaultTime <= lessonStart) {
      defaultTime = new Date(lessonStart.getTime() + (1 * 60000)); // 1 minute after start
    } else if (defaultTime >= lessonEnd) {
      defaultTime = new Date(lessonStart.getTime() + (5 * 60000)); // 5 minutes after start (safe default)
    }
    
    return defaultTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const setStudentStatus = (studentId: number, status: 'present' | 'late' | 'excused' | 'unexcused') => {
    setTempAttendance(prev => {
      let minutesLate: number | undefined;
      let arrivalTime: string | undefined;
      let lateExcused: boolean | undefined;
      const currentAttendance = prev[studentId];
      
      if (status === 'late') {
        // Always get a fresh default time to ensure it's valid
        const defaultTime = getDefaultLateTime(selectedLesson);
        
        // Use existing arrival time only if it's valid, otherwise use default
        if (currentAttendance?.arrivalTime && selectedLesson) {
          // Strict validation of existing time
          try {
            const [startHours, startMinutes] = selectedLesson.time.split(':').map(Number);
            const [endHours, endMinutes] = selectedLesson.endTime.split(':').map(Number);
            const [arrivalHours, arrivalMinutesStr] = currentAttendance.arrivalTime.split(':').map(Number);
            
            const lessonStart = new Date();
            lessonStart.setHours(startHours, startMinutes, 0, 0);
            
            const lessonEnd = new Date();
            lessonEnd.setHours(endHours, endMinutes, 0, 0);
            
            const arrival = new Date();
            arrival.setHours(arrivalHours, arrivalMinutesStr, 0, 0);
            
            // If existing time is invalid, use default
            if (arrival <= lessonStart || arrival >= lessonEnd) {
              arrivalTime = defaultTime;
            } else {
              arrivalTime = currentAttendance.arrivalTime;
            }
          } catch (error) {
            // If parsing fails, use default
            arrivalTime = defaultTime;
          }
        } else {
          // No existing time, use default
          arrivalTime = defaultTime;
        }
        
        // Calculate minutes late based on validated arrival time
        if (selectedLesson && arrivalTime) {
          try {
            const [lessonHours, lessonMinutes] = selectedLesson.time.split(':').map(Number);
            const [arrivalHours, arrivalMinutesStr] = arrivalTime.split(':').map(Number);
            
            const lessonStart = new Date();
            lessonStart.setHours(lessonHours, lessonMinutes, 0, 0);
            
            const arrival = new Date();
            arrival.setHours(arrivalHours, arrivalMinutesStr, 0, 0);
            
            minutesLate = Math.max(1, Math.floor((arrival.getTime() - lessonStart.getTime()) / (1000 * 60)));
            
            // Sanity check: ensure minutes late is reasonable
            const lessonDurationMinutes = Math.floor((new Date().setHours(endHours, endMinutes, 0, 0) - lessonStart.getTime()) / (1000 * 60));
            if (minutesLate >= lessonDurationMinutes) {
              minutesLate = Math.max(1, lessonDurationMinutes - 1); // At most lesson duration - 1 minute
            }
          } catch (error) {
            console.warn('Error calculating minutes late:', error);
            minutesLate = 5; // Safe default for past lessons
          }
        } else {
          minutesLate = 5; // Safe default
        }
        
        lateExcused = currentAttendance?.lateExcused || false;
      }
      
      return {
        ...prev,
        [studentId]: { 
          status, 
          minutesLate,
          arrivalTime,
          lateExcused,
          excuseReason: status === 'excused' ? (currentAttendance?.excuseReason || '') : undefined
        }
      };
    });
  };

  const setStudentExcuseReason = (studentId: number, reason: string) => {
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        excuseReason: reason
      }
    }));
  };

  const setStudentArrivalTime = (studentId: number, time: string) => {
    setTempAttendance(prev => {
      const current = prev[studentId];
      if (!current || current.status !== 'late') return prev;

      if (selectedLesson && time) {
        try {
          const [startHours, startMinutes] = selectedLesson.time.split(':').map(Number);
          const [endHours, endMinutes] = selectedLesson.endTime.split(':').map(Number);
          const [arrivalHours, arrivalMinutesStr] = time.split(':').map(Number);
          
          // Validate time format
          if (isNaN(arrivalHours) || isNaN(arrivalMinutesStr) || 
              arrivalHours < 0 || arrivalHours > 23 || 
              arrivalMinutesStr < 0 || arrivalMinutesStr > 59) {
            alert('Ungültige Zeitangabe. Bitte verwenden Sie das Format HH:MM.');
            return prev;
          }
          
          const lessonStart = new Date();
          lessonStart.setHours(startHours, startMinutes, 0, 0);
          
          const lessonEnd = new Date();
          lessonEnd.setHours(endHours, endMinutes, 0, 0);
          
          const arrival = new Date();
          arrival.setHours(arrivalHours, arrivalMinutesStr, 0, 0);
          
          // Strict validation: arrival must be after lesson start and before lesson end
          if (arrival <= lessonStart) {
            alert(`Ankunftszeit (${time}) kann nicht vor oder gleich dem Stundenbeginn (${selectedLesson.time}) liegen.`);
            return prev;
          }
          
          if (arrival >= lessonEnd) {
            alert(`Ankunftszeit (${time}) kann nicht nach oder gleich dem Stundenende (${selectedLesson.endTime}) liegen. Der Schüler sollte als abwesend markiert werden.`);
            return prev;
          }
          
          // Additional sanity check: calculate minutes late and ensure it's reasonable
          const minutesLateCalc = Math.floor((arrival.getTime() - lessonStart.getTime()) / (1000 * 60));
          if (minutesLateCalc <= 0) {
            alert('Fehler: Berechnete Verspätung ist ungültig.');
            return prev;
          }
          
          // Prevent excessive late times (more than lesson duration)
          const lessonDurationMinutes = Math.floor((lessonEnd.getTime() - lessonStart.getTime()) / (1000 * 60));
          if (minutesLateCalc >= lessonDurationMinutes) {
            alert(`Verspätung von ${minutesLateCalc} Minuten ist zu hoch für eine ${lessonDurationMinutes}-Minuten-Stunde. Schüler sollte als abwesend markiert werden.`);
            return prev;
          }
          
        } catch (error) {
          console.warn('Error validating arrival time:', error);
          alert('Fehler bei der Zeitvalidierung. Bitte versuchen Sie es erneut.');
          return prev;
        }
      }

      // If we get here, the time is valid - calculate minutes late
      let minutesLate = 1;
      if (selectedLesson && time) {
        try {
          const [lessonHours, lessonMinutes] = selectedLesson.time.split(':').map(Number);
          const [arrivalHours, arrivalMinutesStr] = time.split(':').map(Number);
          
          const lessonStart = new Date();
          lessonStart.setHours(lessonHours, lessonMinutes, 0, 0);
          
          const arrival = new Date();
          arrival.setHours(arrivalHours, arrivalMinutesStr, 0, 0);
          
          minutesLate = Math.max(1, Math.floor((arrival.getTime() - lessonStart.getTime()) / (1000 * 60)));
        } catch (error) {
          console.warn('Error calculating minutes late:', error);
          minutesLate = 1;
        }
      }

      return {
        ...prev,
        [studentId]: {
          ...current,
          arrivalTime: time,
          minutesLate
        }
      };
    });
  };

  const setStudentLateExcused = (studentId: number, excused: boolean) => {
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        lateExcused: excused
      }
    }));
  };

  const setAllStudentsStatus = (status: 'present' | 'late' | 'excused' | 'unexcused') => {
    if (!selectedLesson) return;
    
    const newAttendance: {[studentId: number]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};
    
    selectedLesson.students?.forEach(student => {
      let minutesLate: number | undefined;
      let arrivalTime: string | undefined;
      let lateExcused: boolean | undefined;
      
      if (status === 'late') {
        // Use the same default time logic for all students
        arrivalTime = getDefaultLateTime(selectedLesson);
        
        try {
          const [lessonHours, lessonMinutes] = selectedLesson.time.split(':').map(Number);
          const [arrivalHours, arrivalMinutesStr] = arrivalTime.split(':').map(Number);
          
          const lessonStart = new Date();
          lessonStart.setHours(lessonHours, lessonMinutes, 0, 0);
          
          const arrival = new Date();
          arrival.setHours(arrivalHours, arrivalMinutesStr, 0, 0);
          
          minutesLate = Math.max(1, Math.floor((arrival.getTime() - lessonStart.getTime()) / (1000 * 60)));
        } catch (error) {
          console.warn('Error calculating minutes late for all students:', error);
          minutesLate = 1;
        }
        lateExcused = false;
      }
      
      newAttendance[student.id] = { 
        status, 
        minutesLate,
        arrivalTime,
        lateExcused,
        excuseReason: status === 'excused' ? '' : undefined
      };
    });
    
    setTempAttendance(newAttendance);
  };

  const saveAttendance = () => {
    if (!selectedLesson) return;
    
    const present: any[] = [];
    const late: any[] = [];
    const absent: any[] = [];
    
    selectedLesson.students?.forEach(student => {
      const attendance = tempAttendance[student.id];
      
      if (!attendance) return;
      
      switch (attendance.status) {
        case 'present':
          present.push({ name: student.name, id: student.id });
          break;
        case 'late':
          late.push({ 
            name: student.name, 
            id: student.id, 
            minutesLate: attendance.minutesLate || 1,
            arrivalTime: attendance.arrivalTime,
            lateExcused: attendance.lateExcused || false
          });
          break;
        case 'excused':
          absent.push({
            name: student.name,
            id: student.id,
            excused: true,
            reason: attendance.excuseReason || 'Entschuldigt',
            excusedBy: currentTeacher,
            excusedAt: new Date().toLocaleString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          });
          break;
        case 'unexcused':
          absent.push({ 
            name: student.name, 
            id: student.id, 
            excused: false, 
            reason: null 
          });
          break;
      }
    });

    const totalStudentsWithAttendance = present.length + late.length + absent.length;
    const isAttendanceComplete = totalStudentsWithAttendance === selectedLesson.enrolled;
    const timestamp = formatCompactTimestamp();
    const wasFirstTime = !selectedLesson.attendance;

    // Create the structured lesson note with metadata
    let updatedLessonNote: string;
    
    if (wasFirstTime) {
      // First time taking attendance - create new format
      updatedLessonNote = createLessonNoteWithMetadata(
        lessonNote,
        CURRENT_TEACHER,
        timestamp
      );
    } else {
      // Editing existing attendance - update with edit info
      const existingMeta = selectedLesson.attendanceTakenBy && selectedLesson.attendanceTakenAt;
      if (existingMeta) {
        updatedLessonNote = createLessonNoteWithMetadata(
          lessonNote,
          selectedLesson.attendanceTakenBy,
          selectedLesson.attendanceTakenAt,
          CURRENT_TEACHER,
          timestamp
        );
      } else {
        // Fallback for existing lessons without metadata
        updatedLessonNote = createLessonNoteWithMetadata(
          lessonNote,
          CURRENT_TEACHER,
          timestamp
        );
      }
    }

    setLessons(lessons.map(lesson => 
      lesson.id === selectedLesson.id 
        ? { 
            ...lesson, 
            attendanceTaken: isAttendanceComplete,
            attendance: totalStudentsWithAttendance > 0 ? { present, late, absent } : undefined,
            lessonNote: updatedLessonNote,
            ...(wasFirstTime ? {
              attendanceTakenBy: CURRENT_TEACHER,
              attendanceTakenAt: timestamp
            } : {
              attendanceLastEditedBy: CURRENT_TEACHER,
              attendanceLastEditedAt: timestamp
            })
          }
        : lesson
    ));
    
    setTempAttendance({});
    setLessonNote('');
    setAttendanceDialogOpen(false);
    setSelectedLessonForAttendance(null);
    setAttendanceViewMode('edit');
  };

  const selectedLesson = lessons.find(l => l.id === selectedLessonForAttendance);

  const handleExcuseStudent = (lessonId: number, studentId: number, isEdit = false) => {
    setSelectedStudentForExcuse({ lessonId, studentId, isEdit });
    setExcuseDialogOpen(true);
    
    if (isEdit) {
      const lesson = lessons.find(l => l.id === lessonId);
      const student = lesson?.attendance?.absent.find(s => s.id === studentId);
      setExcuseReason(student?.reason || '');
    } else {
      setExcuseReason('');
    }
  };

  const confirmExcuseStudent = () => {
    if (!selectedStudentForExcuse) return;
    
    const timestamp = formatTimestamp();
    
    setLessons(lessons.map(lesson => {
      if (lesson.id === selectedStudentForExcuse.lessonId && lesson.attendance) {
        return {
          ...lesson,
          attendance: {
            ...lesson.attendance,
            absent: lesson.attendance.absent.map(student => 
              student.id === selectedStudentForExcuse.studentId 
                ? { 
                    ...student, 
                    excused: true, 
                    reason: excuseReason || 'Entschuldigt',
                    excusedBy: CURRENT_TEACHER,
                    excusedAt: timestamp
                  }
                : student
            )
          }
        };
      }
      return lesson;
    }));
    
    setExcuseDialogOpen(false);
    setSelectedStudentForExcuse(null);
    setExcuseReason('');
  };

  const deleteExcuseStudent = () => {
    if (!selectedStudentForExcuse) return;
    
    setLessons(lessons.map(lesson => {
      if (lesson.id === selectedStudentForExcuse.lessonId && lesson.attendance) {
        return {
          ...lesson,
          attendance: {
            ...lesson.attendance,
            absent: lesson.attendance.absent.map(student => 
              student.id === selectedStudentForExcuse.studentId 
                ? { 
                    ...student, 
                    excused: false, 
                    reason: null,
                    excusedBy: undefined,
                    excusedAt: undefined
                  }
                : student
            )
          }
        };
      }
      return lesson;
    }));
    
    setExcuseDialogOpen(false);
    setSelectedStudentForExcuse(null);
    setExcuseReason('');
  };

  const startEditingLessonNote = (lessonId: number, currentNote: string) => {
    setEditingLessonNote(lessonId);
    setTempLessonNote(currentNote || '');
  };

  const saveLessonNote = (lessonId: number) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    const parsedNote = parseLessonNote(lesson.lessonNote || '');
    const timestamp = formatCompactTimestamp();
    
    let updatedLessonNote: string;
    
    if (parsedNote.hasMetadata && lesson.attendanceTakenBy && lesson.attendanceTakenAt) {
      // Update existing structured note with edit info
      updatedLessonNote = createLessonNoteWithMetadata(
        tempLessonNote,
        lesson.attendanceTakenBy,
        lesson.attendanceTakenAt,
        CURRENT_TEACHER,
        timestamp
      );
    } else if (lesson.attendanceTakenBy && lesson.attendanceTakenAt) {
      // Create new structured note with existing attendance data
      updatedLessonNote = createLessonNoteWithMetadata(
        tempLessonNote,
        lesson.attendanceTakenBy,
        lesson.attendanceTakenAt
      );
    } else {
      // No attendance data yet, just save content
      updatedLessonNote = tempLessonNote;
    }
    
    setLessons(lessons.map(l => 
      l.id === lessonId 
        ? { 
            ...l, 
            lessonNote: updatedLessonNote,
            ...(parsedNote.hasMetadata && lesson.attendanceTakenBy && lesson.attendanceTakenAt ? {
              attendanceLastEditedBy: CURRENT_TEACHER,
              attendanceLastEditedAt: timestamp
            } : {})
          }
        : l
    ));
    setEditingLessonNote(null);
    setTempLessonNote('');
  };

  const cancelEditingLessonNote = () => {
    setEditingLessonNote(null);
    setTempLessonNote('');
  };

  // Check if attendance has never been taken (no attendance data exists)
  const shouldShowPreExistingAbsences = (lesson: any) => {
    return !lesson.attendance || (
      lesson.attendance.present.length === 0 && 
      lesson.attendance.late.length === 0 && 
      lesson.attendance.absent.length === 0
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Header 
        currentTeacher={CURRENT_TEACHER}
        dateString={dateString}
        onButtonClick={handleHeaderButtonClick}
      />

      <div className="p-6">
        {/* Top Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Stundenplan */}
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
                <Button 
                  size="sm" 
                  className={`${isToday ? 'bg-cyan-400 hover:bg-cyan-500' : 'bg-gray-200 hover:bg-gray-300'} text-black h-8 px-3`}
                  onClick={handleTodayClick}
                >
                  Heute
                </Button>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                                  {(lesson.roomChanged || lesson.adminComment || lesson.teacherRole === 'support') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMobileLessonDetails(lesson.id);
                                      }}
                                      className="h-6 w-6 p-0 flex-shrink-0"
                                    >
                                      {expandedMobileLessonDetails.has(lesson.id) ? (
                                        <ChevronUp className="h-3 w-3" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                                
                                {!lesson.isCancelled && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {lesson.room}
                                    {lesson.otherTeachers.length > 0 && (
                                      <span>
                                        {' • '}
                                        {lesson.otherTeachers
                                          .filter(t => lesson.teacherRole !== 'support' || t.isMainResponsible)
                                          .map((teacher, index) => (
                                            <span key={index}>
                                              {getMobileTeacherAbbreviation(teacher.name)}
                                              {index < lesson.otherTeachers.filter(t => lesson.teacherRole !== 'support' || t.isMainResponsible).length - 1 && ', '}
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
                                      <span className="text-red-600 line-through">{lesson.subject}</span>
                                      <span className="text-red-600">Entfällt</span>
                                    </div>
                                  ) : lesson.isSubstitute ? (
                                    <div className="flex items-center gap-2">
                                      <span>{lesson.subject}</span>
                                      <span className="text-purple-600">Vertretung</span>
                                    </div>
                                  ) : (
                                    lesson.subject
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
                                      <span className="line-through text-red-500">{lesson.class}</span>
                                      <span className="text-red-600 ml-2">{lesson.cancellationReason}</span>
                                    </div>
                                  ) : (
                                    <>
                                      {lesson.class} • {lesson.room}
                                      {lesson.otherTeachers.length > 0 && (
                                        <>
                                          {' • '}
                                          {lesson.otherTeachers.map((teacher, index) => (
                                            <span key={index}>
                                              <span className={teacher.isMainResponsible && lesson.teacherRole === 'support' ? 'underline' : ''}>
                                                {teacher.name}
                                              </span>
                                              {index < lesson.otherTeachers.length - 1 && ', '}
                                            </span>
                                          ))}
                                        </>
                                      )}
                                      {lesson.isSubstitute && (
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
                                  onClick={() => handleAttendanceClick(lesson.id, 'overview')}
                                >
                                  <Check className="h-3 w-3" />
                                  <span className="text-xs">
                                    {getAttendanceSummary(lesson)?.present}/{getAttendanceSummary(lesson)?.late}/{getAttendanceSummary(lesson)?.absent}
                                  </span>
                                </Badge>
                              ) : attendanceStatus === 'incomplete' ? (
                                <Badge 
                                  className="cursor-pointer bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 flex items-center gap-1 px-2 py-1"
                                  onClick={() => handleAttendanceClick(lesson.id, 'edit')}
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  <span className="text-xs">
                                    {attendanceNumbers.present}/<span className="text-red-600">{attendanceNumbers.missing}</span>?/{attendanceNumbers.absent}
                                  </span>
                                </Badge>
                              ) : (
                                <Badge 
                                  className="cursor-pointer bg-red-50 hover:bg-red-100 text-red-600 border-red-200 flex items-center gap-1 px-2 py-1"
                                  onClick={() => handleAttendanceClick(lesson.id, 'edit')}
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

          {/* Info Board - Mobile responsive */}
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
              {/* Regular info items - always show titles */}
              <div 
                className={`p-2 rounded-lg bg-gray-50 ${isMobile ? 'cursor-pointer' : ''}`}
                onClick={isMobile ? () => toggleInfoBoardPost('schulversammlung') : undefined}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">Schulversammlung</h4>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    14:30
                  </div>
                </div>
                {(!isMobile || expandedInfoBoardPosts.has('schulversammlung')) && (
                  <div className="text-xs text-gray-600 mt-1">Heute in der Aula</div>
                )}
              </div>
              
              <div 
                className={`p-2 rounded-lg bg-gray-50 ${isMobile ? 'cursor-pointer' : ''}`}
                onClick={isMobile ? () => toggleInfoBoardPost('lehrerkonferenz') : undefined}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">Lehrerkonferenz</h4>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    16:30
                  </div>
                </div>
                {(!isMobile || expandedInfoBoardPosts.has('lehrerkonferenz')) && (
                  <div className="text-xs text-gray-600 mt-1">Morgen im Konferenzraum</div>
                )}
              </div>

              <div 
                className={`p-2 rounded-lg bg-gray-50 ${isMobile ? 'cursor-pointer' : ''}`}
                onClick={isMobile ? () => toggleInfoBoardPost('it-systemupdate') : undefined}
              >
                <h4 className="font-semibold">IT-Systemupdate</h4>
                {(!isMobile || expandedInfoBoardPosts.has('it-systemupdate')) && (
                  <div className="text-xs text-gray-600 mt-1">
                    Freitag geplant, voraussichtlich am Wochenende abgeschlossen
                  </div>
                )}
              </div>

              {/* Vertretungsstunden section */}
              {substituteLessons.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-purple-500" />
                      Vertretungsstunden
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSubstituteLessons(!showSubstituteLessons)}
                      className="h-6 w-6 p-0"
                    >
                      {showSubstituteLessons ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  {showSubstituteLessons && (
                    <div className="space-y-1">
                      {substituteLessons.map((substitute, index) => (
                        <div key={index} className="bg-purple-50 p-2 rounded text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-purple-900">{substitute.date}</span>
                              <span className="text-purple-700 ml-2">{substitute.time}</span>
                            </div>
                            <div className="text-right text-purple-700">
                              {substitute.subject} - {substitute.class}
                            </div>
                          </div>
                          <div className="text-purple-600 mt-1">
                            {substitute.room} • für {substitute.forTeacher}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events - Mobile responsive */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-blue-500" />
                  Veranstaltungen
                </CardTitle>
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleInfoItemExpansion('events')}
                    className="h-6 w-6 p-0"
                  >
                    {expandedInfoItems.has('events') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-past-events"
                  checked={showPastEvents}
                  onCheckedChange={handleTogglePastEvents}
                />
                <Label htmlFor="show-past-events" className="text-sm">
                  Vergangene Veranstaltungen
                </Label>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayedEvents.map((event) => {
                  const isExpanded = expandedEventDescriptions.has(event.id);
                  const isMobileExpanded = expandedMobileEvents.has(event.id);
                  const shouldTruncate = event.description.length > 80;
                  const truncatedDesc = truncateDescription(event.description);
                  
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="bg-blue-500 text-white rounded-lg p-2 text-center min-w-[40px] flex-shrink-0">
                        <div className="font-bold text-sm">{event.date.day}</div>
                        <div className="text-xs">{event.date.month}</div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate">{event.title}</h4>
                              {isMobile && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMobileEventExpansion(event.id)}
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                >
                                  {isMobileExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </Button>
                              )}
                              {!isMobile && (
                                <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {event.time}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Mobile RSVP under title */}
                            {isMobile && !showPastEvents && (
                              <div className="flex gap-1 mb-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-6 w-6 p-0 ${
                                          event.rsvp === 'attending' 
                                            ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                            : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                                        }`}
                                        onClick={() => handleEventRSVP(event.id, 'attending')}
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Nehme teil</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-6 w-6 p-0 ${
                                          event.rsvp === 'maybe' 
                                            ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                                            : 'text-gray-300 hover:text-orange-600 hover:bg-orange-50'
                                        }`}
                                        onClick={() => handleEventRSVP(event.id, 'maybe')}
                                      >
                                        <HelpCircle className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Noch unsicher</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-6 w-6 p-0 ${
                                          event.rsvp === 'not_attending' 
                                            ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                            : 'text-gray-300 hover:text-red-600 hover:bg-red-50'
                                        }`}
                                        onClick={() => handleEventRSVP(event.id, 'not_attending')}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Kann nicht teilnehmen</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}

                            {/* Time and location on mobile when expanded */}
                            {isMobile && isMobileExpanded && (
                              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </div>
                              </div>
                            )}
                            
                            {/* Description - always show on desktop, conditional on mobile */}
                            {(!isMobile || (isMobile && (expandedInfoItems.has('events') || isMobileExpanded))) && (
                              <div className="text-sm text-gray-600 leading-relaxed">
                                {isExpanded || !shouldTruncate ? event.description : (
                                  <div className="flex items-center gap-2">
                                    <span>{truncatedDesc}</span>
                                    {shouldTruncate && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleEventDescription(event.id)}
                                        className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                                      >
                                        <Badge variant="outline" className="text-xs cursor-pointer hover:bg-blue-50">
                                          (...)
                                        </Badge>
                                      </Button>
                                    )}
                                  </div>
                                )}
                                {isExpanded && shouldTruncate && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleEventDescription(event.id)}
                                    className="h-auto p-0 ml-2 text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    weniger
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Desktop RSVP buttons */}
                          {!isMobile && !showPastEvents && (
                            <div className="flex gap-1 flex-shrink-0">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-8 w-8 p-0 ${
                                        event.rsvp === 'attending' 
                                          ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                          : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                                      }`}
                                      onClick={() => handleEventRSVP(event.id, 'attending')}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Nehme teil</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-8 w-8 p-0 ${
                                        event.rsvp === 'maybe' 
                                          ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                                          : 'text-gray-300 hover:text-orange-600 hover:bg-orange-50'
                                      }`}
                                      onClick={() => handleEventRSVP(event.id, 'maybe')}
                                    >
                                      <HelpCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Noch unsicher</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-8 w-8 p-0 ${
                                        event.rsvp === 'not_attending' 
                                          ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                          : 'text-gray-300 hover:text-red-600 hover:bg-red-50'
                                      }`}
                                      onClick={() => handleEventRSVP(event.id, 'not_attending')}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Kann nicht teilnehmen</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Enhanced Event Navigation with "weniger anzeigen" functionality */}
                {filteredEvents.length > 3 && (
                  <div className="text-center pt-2 space-y-2">
                    {filteredEvents.length > eventDisplayCount && (
                      <Button
                        variant="ghost"
                        size="sm"  
                        onClick={() => setEventDisplayCount(prev => prev + 10)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ChevronDown className="h-4 w-4 mr-1" />
                        mehr anzeigen ({filteredEvents.length - eventDisplayCount} weitere)
                      </Button>
                    )}
                    {eventDisplayCount > 3 && (
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEventDisplayCount(3)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ChevronUp className="h-4 w-4 mr-1" />
                          weniger anzeigen
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasks - Mobile responsive */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-blue-500" />
                Aufgaben
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setAddTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Aufgabe hinzufügen
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search and Filters - Desktop Version */}
              {!isMobile && (
                <div className="flex gap-2 flex-wrap items-center">
                  {/* Smaller Search Bar */}
                  <div className="relative flex-1 min-w-[150px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Suchen..."
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                    <SelectTrigger className="w-20">
                      <SelectValue>
                        {taskPriorityFilter === 'all' ? 'Prio' : 
                         taskPriorityFilter === 'urgent' ? 'Dringend' : 
                         taskPriorityFilter === 'high' ? 'Hoch' : 
                         taskPriorityFilter === 'medium' ? 'Mittel' : 'Niedrig'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="urgent">Dringend</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="low">Niedrig</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={taskDueDateFilter} onValueChange={setTaskDueDateFilter}>
                    <SelectTrigger className="w-24">
                      <SelectValue>
                        {taskDueDateFilter === 'all' ? 'Fällig' :
                         taskDueDateFilter === 'overdue' ? 'Überfällig' :
                         taskDueDateFilter === 'today' ? 'Heute' :
                         taskDueDateFilter === 'tomorrow' ? 'Morgen' : 'Diese Woche'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="overdue">Überfällig</SelectItem>
                      <SelectItem value="today">Heute</SelectItem>
                      <SelectItem value="tomorrow">Morgen</SelectItem>
                      <SelectItem value="this_week">Diese Woche</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant={showHotListOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowHotListOnly(!showHotListOnly)}
                    className="flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" />
                    Hot List
                  </Button>
                  
                  <Button
                    variant={showCompletedTasks ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Erledigt
                  </Button>
                </div>
              )}

              {/* Mobile Search and Filters - Compact Version */}
              {isMobile && (
                <div className="flex gap-2 items-center">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Suchen..."
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {/* Hot List Button - Icon Only */}
                  <Button
                    variant={showHotListOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowHotListOnly(!showHotListOnly)}
                    className="h-10 w-10 p-0"
                    title="Hot List"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  
                  {/* Completed Tasks Button - Icon Only */}
                  <Button
                    variant={showCompletedTasks ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                    className="h-10 w-10 p-0"
                    title="Erledigte Aufgaben"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Enhanced Task Navigation with "weniger anzeigen" functionality - Between filters and list */}
              {!isMobile && filteredAndSortedTasks.length > 3 && taskDisplayCount > 3 && (
                <div className="text-center pb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTaskDisplayCount(3)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ChevronUp className="h-4 w-4 mr-1" />
                    weniger anzeigen
                  </Button>
                </div>
              )}

              {/* Task List */}
              <div className="space-y-2">
                {displayedTasks.map((task) => {
                  const isEditing = editingTask === task.id;
                  const isGroupExpanded = expandedGroupAssignees.has(task.id);
                  const isMobileExpanded = expandedMobileTasks.has(task.id);
                  
                  // Find groups that this task is assigned to
                  const assignedGroups = ASSIGNEE_GROUPS.filter(group => 
                    group.members.some(member => task.assignedTo.includes(member)) &&
                    group.members.every(member => task.assignedTo.includes(member))
                  );
                  
                  return (
                    <div key={task.id} className="border rounded-lg p-3 space-y-2">
                      {isEditing ? (
                        // Edit Mode - keep full functionality for now
                        <div className="space-y-3">
                          <div>
                            <Input
                              value={editTaskData.title}
                              onChange={(e) => setEditTaskData(prev => ({...prev, title: e.target.value}))}
                              placeholder="Aufgabentitel"
                              className="font-medium"
                            />
                          </div>
                          <div>
                            <Textarea
                              value={editTaskData.description}
                              onChange={(e) => setEditTaskData(prev => ({...prev, description: e.target.value}))}
                              placeholder="Beschreibung"
                              className="min-h-[60px]"
                            />
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Select value={editTaskData.priority} onValueChange={(value) => setEditTaskData(prev => ({...prev, priority: value}))}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Niedrig</SelectItem>
                                <SelectItem value="medium">Mittel</SelectItem>
                                <SelectItem value="high">Hoch</SelectItem>
                                <SelectItem value="urgent">Dringend</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={editTaskData.dueDate}
                              onChange={(e) => setEditTaskData(prev => ({...prev, dueDate: e.target.value}))}
                              className="w-40"
                            />
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={editTaskData.hotList}
                                onCheckedChange={(checked) => setEditTaskData(prev => ({...prev, hotList: !!checked}))}
                              />
                              <Label className="text-sm">Hot List</Label>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveTaskEdit}>Speichern</Button>
                            <Button size="sm" variant="outline" onClick={cancelTaskEdit}>Abbrechen</Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode - Mobile responsive
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                    {task.title}
                                  </div>
                                  {isMobile && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleMobileTaskExpansion(task.id)}
                                      className="h-6 w-6 p-0 flex-shrink-0"
                                    >
                                      {isMobileExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    </Button>
                                  )}
                                  <Badge variant={
                                    task.priority === 'urgent' ? 'destructive' : 
                                    task.priority === 'high' ? 'default' : 
                                    task.priority === 'medium' ? 'secondary' : 
                                    'outline'
                                  } className="text-xs">
                                    {task.priority === 'urgent' ? 'Dringend' : 
                                     task.priority === 'high' ? 'Hoch' : 
                                     task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(task.dueDate).toLocaleDateString('de-DE')}
                                  </span>
                                </div>
                                
                                {/* Mobile: Only show description when expanded */}
                                {(!isMobile || isMobileExpanded) && (
                                  <div className={`text-sm text-gray-600 ${task.completed ? 'line-through' : ''}`}>
                                    {task.description}
                                  </div>
                                )}
                              </div>
                              
                              {/* Mobile: Only show action buttons when expanded */}
                              {(!isMobile || isMobileExpanded) && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {/* Comment button */}
                                  {task.comments.length > 0 ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleComments(task.id)}
                                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    >
                                      Kommentar
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenCommentDialog(task.id)}
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                    >
                                      <MessageCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                  
                                  {/* Edit button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditingTask(task.id)}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  
                                  {/* Star button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleTaskHotList(task.id)}
                                    className={`h-6 w-6 p-0 ${task.hotList ? 'text-yellow-500' : 'text-gray-300'}`}
                                  >
                                    <Star className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* Mobile: Only show assignee info when expanded */}
                            {(!isMobile || isMobileExpanded) && (
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                {/* Show assigned groups as clickable */}
                                {assignedGroups.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleGroupAssigneeExpansion(task.id)}
                                      className="h-auto p-0 text-purple-600 hover:text-purple-800 underline"
                                    >
                                      {assignedGroups.map(g => g.name).join(', ')}
                                    </Button>
                                    {isGroupExpanded && (
                                      <span className="text-gray-500">
                                        ({assignedGroups.flatMap(g => g.members).join(', ')})
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Show individual assignees */}
                                {task.assignedTo.length > 0 && !task.assignedTo.includes(CURRENT_TEACHER) && assignedGroups.length === 0 && (
                                  <span className="text-purple-600">
                                    → {task.assignedTo.join(', ')}
                                  </span>
                                )}
                                
                                {task.assignedTo.length > 1 && (
                                  <span className="text-blue-600">
                                    Team: {task.assignedTo.length} Personen
                                  </span>
                                )}
                                
                                {showCompletedTasks && task.completedAt && (
                                  <span className="text-green-600">
                                    ✓ {task.completedAt} ({task.completedBy})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Inline Comments - Only show when expanded on mobile */}
                      {(!isMobile || isMobileExpanded) && expandedComments.has(task.id) && task.comments.length > 0 && (
                        <div className="ml-8 space-y-2 border-t pt-2 mt-2">
                          {task.comments.map(comment => (
                            <div key={comment.id} className="text-sm bg-gray-50 p-2 rounded">
                              <div>{comment.text}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {comment.timestamp} - {comment.author}
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCommentDialog(task.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Kommentar hinzufügen
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              
                {displayedTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {showCompletedTasks ? 'Keine erledigten Aufgaben gefunden' : 'Keine Aufgaben gefunden'}
                  </div>
                )}
                
                {/* Enhanced Task Navigation with "weniger anzeigen" functionality */}
                {filteredAndSortedTasks.length > 3 && (
                  <div className="text-center pt-2 space-y-2">
                    {filteredAndSortedTasks.length > taskDisplayCount && (
                      <Button
                        variant="ghost"
                        size="sm"  
                        onClick={() => setTaskDisplayCount(prev => prev + 10)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ChevronDown className="h-4 w-4 mr-1" />
                        mehr anzeigen ({filteredAndSortedTasks.length - taskDisplayCount} weitere)
                      </Button>
                    )}
                    {taskDisplayCount > 3 && (
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskDisplayCount(3)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ChevronUp className="h-4 w-4 mr-1" />
                          weniger anzeigen
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Impressum Footer Link */}
      <div className="fixed bottom-4 right-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleHeaderButtonClick('Impressum')}
          className="text-gray-500 hover:text-gray-700 text-xs"
        >
          Impressum
        </Button>
      </div>

      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        currentTeacher={CURRENT_TEACHER}
        canAssignTasks={canAssignTasks}
        onCreateTask={createNewTask}
      />

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tasks.find(t => t.id === selectedTaskForComment)?.comments.length > 0 ? 'Kommentare' : 'Kommentar hinzufügen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTaskForComment && (
              <>
                <div>
                  <Label>Aufgabe</Label>
                  <div className="font-medium">
                    {tasks.find(t => t.id === selectedTaskForComment)?.title}
                  </div>
                </div>
                
                {tasks.find(t => t.id === selectedTaskForComment)?.comments.length > 0 && (
                  <div>
                    <Label>Bisherige Kommentare</Label>
                    <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                      {tasks.find(t => t.id === selectedTaskForComment)?.comments.map(comment => (
                        <div key={comment.id} className="text-sm bg-gray-50 p-2 rounded">
                          <div>{comment.text}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {comment.timestamp} - {comment.author}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="new-comment">Neuer Kommentar</Label>
                  <Textarea
                    id="new-comment"
                    placeholder="Fortschritt, Notizen oder Updates..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            )}
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
                {tasks.find(t => t.id === selectedTaskForComment)?.comments.length > 0 ? 'Schließen' : 'Abbrechen'}
              </Button>
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Kommentar hinzufügen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={(open) => {
        setAttendanceDialogOpen(open);
        if (!open) {
          setSelectedLessonForAttendance(null);
          setAttendanceViewMode('edit');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                Anwesenheit - {selectedLesson?.subject} {selectedLesson?.class}
                <div className="text-sm font-normal text-gray-600 mt-1">
                  {selectedDate.toLocaleDateString('de-DE', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })} um {selectedLesson?.time} Uhr
                </div>
              </div>
              {attendanceViewMode === 'overview' && selectedLesson?.attendance && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={switchToEditMode}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Anwesenheit bearbeiten
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLesson && (
            <div>
              {/* Show pre-existing absences only if attendance has never been taken */}
              {shouldShowPreExistingAbsences(selectedLesson) && selectedLesson.preExistingAbsences && selectedLesson.preExistingAbsences.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Bereits gemeldete Abwesenheiten:</h4>
                  <div className="space-y-1">
                    {selectedLesson.preExistingAbsences.map((absence, index) => (
                      <div key={index} className="text-sm text-yellow-700">
                        • {isMobile ? 
                            `${absence.studentName} – ${absence.reason}` :
                            `${absence.studentName} - ${absence.reason} (gemeldet von ${absence.reportedBy} um ${absence.reportedAt})`
                          }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {attendanceViewMode === 'overview' && selectedLesson.attendance ? (
                // Overview Mode - Clean summary view
                <div className="space-y-6">
                  {/* Lesson Note Section */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    {(() => {
                      const parsedNote = parseLessonNote(selectedLesson.lessonNote || '');
                      
                      return (
                        <div className="space-y-3">
                          {editingLessonNote === selectedLesson.id ? (
                            // Editing mode - full width layout
                            <div className="space-y-3">
                              {/* Metadata header when editing */}
                              {parsedNote.hasMetadata ? (
                                <div 
                                  className="text-blue-700"
                                  dangerouslySetInnerHTML={{
                                    __html: parsedNote.metadata
                                      .replace('**Klassenbuch-Eintrag**', '<span class="font-bold text-base">Klassenbuch-Eintrag</span>')
                                      .replace('**Klassenbuch-Eintrag:**', '<strong>Klassenbuch-Eintrag:</strong>')
                                      .replace(/\n/g, '<br />') 
                                      .replace(/\((.*?)\)/g, '<span class="text-xs">($1)</span>')
                                  }}
                                />
                              ) : (
                                <h4 className="font-medium text-blue-900">Klassenbuch-Eintrag</h4>
                              )}
                              
                              {/* Full-width textarea */}
                              <Textarea
                                value={tempLessonNote}
                                onChange={(e) => setTempLessonNote(e.target.value)}
                                placeholder="Notizen zur Stunde, behandelte Themen, besondere Vorkommnisse..."
                                className="min-h-[120px] bg-white text-sm w-full"
                              />
                              
                              {/* Edit buttons below textarea */}
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditingLessonNote}
                                  className="h-7 px-2 text-xs"
                                >
                                  Abbrechen
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => saveLessonNote(selectedLesson.id)}
                                  className="h-7 px-2 text-xs"
                                >
                                  Speichern
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Display mode - with edit button on the side
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* Compact inline metadata */}
                                {parsedNote.hasMetadata ? (
                                  <div className="space-y-2">
                                    <div 
                                      className="text-blue-700"
                                      dangerouslySetInnerHTML={{
                                        __html: parsedNote.metadata
                                          .replace('**Klassenbuch-Eintrag**', '<span class="font-bold text-base">Klassenbuch-Eintrag</span>')
                                          .replace('**Klassenbuch-Eintrag:**', '<strong>Klassenbuch-Eintrag:</strong>')
                                          .replace(/\n/g, '<br />') 
                                          .replace(/\((.*?)\)/g, '<span class="text-xs">($1)</span>')
                                      }}
                                    />
                                    <div className="text-sm text-blue-800">
                                      {parsedNote.content || (
                                        <span className="text-gray-500 italic">
                                          Kein Eintrag vorhanden - 
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => startEditingLessonNote(selectedLesson.id, '')}
                                            className="h-auto p-0 ml-1 underline text-blue-600"
                                          >
                                            hinzufügen
                                          </Button>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-blue-900">Klassenbuch-Eintrag</h4>
                                    <p className="text-sm text-blue-800">
                                      {parsedNote.content || (
                                        <span className="text-gray-500 italic">
                                          Kein Eintrag vorhanden - 
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => startEditingLessonNote(selectedLesson.id, '')}
                                            className="h-auto p-0 ml-1 underline text-blue-600"
                                          >
                                            hinzufügen
                                          </Button>
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Edit button */}
                              <div className="ml-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingLessonNote(selectedLesson.id, parsedNote.content)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Present Students */}
                  <div>
                    <h4 className="flex items-center gap-2 mb-3">
                      <Check className="h-5 w-5 text-green-600" />
                      Anwesend ({selectedLesson.attendance.present.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedLesson.attendance.present.map((student) => (
                        <div key={student.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">{isMobile ? getMobileStudentName(student.name) : student.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Late Students */}
                  {selectedLesson.attendance.late.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 mb-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        Verspätet ({selectedLesson.attendance.late.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedLesson.attendance.late.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-sm">{isMobile ? getMobileStudentName(student.name) : student.name}</span>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                {student.minutesLate || 1} Min. verspätet
                              </Badge>
                              {student.arrivalTime && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Ankunft: {student.arrivalTime}
                                </div>
                              )}
                              {student.lateExcused && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Entschuldigt
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Absent Students */}
                  {selectedLesson.attendance.absent.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 mb-3">
                        <X className="h-5 w-5 text-red-500" />
                        Abwesend ({selectedLesson.attendance.absent.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedLesson.attendance.absent.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm">{isMobile ? getMobileStudentName(student.name) : student.name}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {student.excused ? (
                                <div className="flex flex-col items-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0"
                                    onClick={() => handleExcuseStudent(selectedLesson.id, student.id, true)}
                                  >
                                    <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-gray-300 flex items-center gap-1">
                                      <Edit className="h-3 w-3" />
                                      Entschuldigt{student.reason && ` - ${student.reason}`}
                                    </Badge>
                                  </Button>
                                  {student.excusedBy && (
                                    <div className="text-xs text-gray-500">
                                      von {student.excusedBy} um {student.excusedAt}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0"
                                  onClick={() => handleExcuseStudent(selectedLesson.id, student.id)}
                                >
                                  <Badge variant="destructive" className="text-xs cursor-pointer hover:bg-red-600">
                                    Unentschuldigt
                                  </Badge>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode - Full attendance taking interface
                <div className="space-y-4">
                  {/* Lesson Note Section */}
                  <div className="space-y-2">
                    {(() => {
                      const parsedNote = parseLessonNote(selectedLesson.lessonNote || '');
                      
                      return (
                        <>
                          {/* Show compact metadata header if it exists */}
                          {parsedNote.hasMetadata && (
                            <div 
                              className="text-blue-700 mb-2"
                              dangerouslySetInnerHTML={{
                                __html: parsedNote.metadata
                                  .replace('**Klassenbuch-Eintrag**', '<span class="font-bold text-base">Klassenbuch-Eintrag</span>')
                                  .replace('**Klassenbuch-Eintrag:**', '<strong>Klassenbuch-Eintrag:</strong>')
                                  .replace(/\n/g, '<br />') 
                                  .replace(/\((.*?)\)/g, '<span class="text-xs">($1)</span>')
                              }}
                            />
                          )}
                          
                          <Label htmlFor="lesson-note" className="font-medium">
                            {parsedNote.hasMetadata ? '' : 'Klassenbuch-Eintrag'}
                          </Label>
                          <Textarea
                            id="lesson-note"
                            placeholder="Notizen zur Stunde, behandelte Themen, besondere Vorkommnisse..."
                            value={lessonNote}
                            onChange={(e) => setLessonNote(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {!isMobile && (
                      <div className="text-sm text-gray-600">
                        Klicken Sie auf die Symbole, um die Anwesenheit zu markieren
                      </div>
                    )}
                    <Button onClick={saveAttendance} className="bg-green-600 hover:bg-green-700 ml-auto">
                      Anwesenheit speichern
                    </Button>
                  </div>
                  
                  {/* Grid Header */}
                  <div className="grid grid-cols-5 gap-2 border-b pb-3">
                    <div className="font-medium text-sm">{isMobile ? 'SuS' : 'Schüler'}</div>
                    <div className="font-medium text-sm text-center">{isMobile ? 'Anw' : 'Anwesend'}</div>
                    <div className="font-medium text-sm text-center">{isMobile ? 'Spät' : 'Verspätet'}</div>
                    <div className="font-medium text-sm text-center">{isMobile ? 'Abw. E' : 'Abwesend (E)'}</div>
                    <div className="font-medium text-sm text-center">{isMobile ? 'Abw. U' : 'Abwesend (U)'}</div>
                  </div>
                  
                  {/* Alle Buttons */}
                  <div className="grid grid-cols-5 gap-2 pb-2 border-b">
                    <div></div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-7"
                        onClick={() => setAllStudentsStatus('present')}
                      >
                        Alle
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-7"
                        onClick={() => setAllStudentsStatus('late')}
                      >
                        Alle
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-7"
                        onClick={() => setAllStudentsStatus('excused')}
                      >
                        Alle
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-7"
                        onClick={() => setAllStudentsStatus('unexcused')}
                      >
                        Alle
                      </Button>
                    </div>
                  </div>
                  
                  {/* Student Rows */}
                  <div className="space-y-1">
                    {selectedLesson.students?.map((student) => {
                      const attendance = tempAttendance[student.id];
                      const isPreExistingAbsent = selectedLesson.preExistingAbsences?.some(abs => abs.studentId === student.id);
                      
                      return (
                        <div key={student.id} className="space-y-2">
                          <div className={`grid grid-cols-5 gap-2 items-center py-2 px-2 hover:bg-gray-50 rounded ${isPreExistingAbsent ? 'bg-yellow-50' : ''}`}>
                            {/* Student Name */}
                            <div className="text-sm flex items-center gap-2">
                              {isMobile ? getMobileStudentName(student.name) : student.name}
                              {isPreExistingAbsent && (
                                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700">
                                  Vorgemeldet
                                </Badge>
                              )}
                            </div>
                            
                            {/* Present */}
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  attendance?.status === 'present' 
                                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                    : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                                }`}
                                onClick={() => setStudentStatus(student.id, 'present')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Late */}
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  attendance?.status === 'late' 
                                    ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                                    : 'text-gray-300 hover:text-yellow-600 hover:bg-yellow-50'
                                }`}
                                onClick={() => setStudentStatus(student.id, 'late')}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Excused Absent */}
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  attendance?.status === 'excused' 
                                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                                    : 'text-gray-300 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                onClick={() => setStudentStatus(student.id, 'excused')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Unexcused Absent */}
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  attendance?.status === 'unexcused' 
                                    ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                    : 'text-gray-300 hover:text-red-600 hover:bg-red-50'
                                }`}
                                onClick={() => setStudentStatus(student.id, 'unexcused')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Excuse reason field for excused students */}
                          {attendance?.status === 'excused' && (
                            <div className="ml-4 mr-2">
                              <Input
                                placeholder="Grund der Entschuldigung (z.B. Krankheit, Arzttermin...)"
                                value={attendance.excuseReason || ''}
                                onChange={(e) => setStudentExcuseReason(student.id, e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          )}

                          {/* Late student details */}
                          {attendance?.status === 'late' && (
                            <div className="ml-4 mr-2 space-y-2">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor={`arrival-${student.id}`} className="text-xs">Ankunftszeit</Label>
                                  <TimeInputWithArrows
                                    id={`arrival-${student.id}`}
                                    value={attendance.arrivalTime || ''}
                                    onChange={(inputTime) => {
                                      // Additional client-side validation before calling setStudentArrivalTime
                                      if (inputTime && selectedLesson) {
                                        try {
                                          const [inputHours, inputMinutes] = inputTime.split(':').map(Number);
                                          const [startHours, startMinutes] = selectedLesson.time.split(':').map(Number);
                                          const [endHours, endMinutes] = selectedLesson.endTime.split(':').map(Number);
                                          
                                          // Quick validation before processing
                                          if (inputHours >= 0 && inputHours <= 23 && inputMinutes >= 0 && inputMinutes <= 59) {
                                            const inputTimeAsMinutes = inputHours * 60 + inputMinutes;
                                            const startTimeAsMinutes = startHours * 60 + startMinutes;
                                            const endTimeAsMinutes = endHours * 60 + endMinutes;
                                            
                                            if (inputTimeAsMinutes > startTimeAsMinutes && inputTimeAsMinutes < endTimeAsMinutes) {
                                              setStudentArrivalTime(student.id, inputTime);
                                            }
                                          }
                                        } catch (error) {
                                          console.warn('Client-side time validation failed:', error);
                                        }
                                      } else if (!inputTime) {
                                        setStudentArrivalTime(student.id, inputTime);
                                      }
                                    }}
                                    min={selectedLesson?.time}
                                    max={selectedLesson?.endTime}
                                    className="text-sm h-8"
                                    title={`Ankunftszeit muss zwischen ${selectedLesson?.time} und ${selectedLesson?.endTime} liegen`}
                                  />
                                </div>
                                <div className="flex items-end">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`late-excused-${student.id}`}
                                      checked={attendance.lateExcused || false}
                                      onCheckedChange={(checked) => setStudentLateExcused(student.id, !!checked)}
                                    />
                                    <Label htmlFor={`late-excused-${student.id}`} className="text-xs">
                                      Entschuldigt
                                    </Label>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {attendance.minutesLate} Minuten verspätet
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Save Button - Duplicate of the top save button for better UX */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={saveAttendance} className="bg-green-600 hover:bg-green-700">
                      Anwesenheit speichern
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Excuse Student Dialog */}
      <Dialog open={excuseDialogOpen} onOpenChange={setExcuseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStudentForExcuse?.isEdit ? 'Entschuldigung bearbeiten' : 'Schüler entschuldigen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-name">Schüler</Label>
              <Input
                id="student-name"
                value={selectedStudentForExcuse ? 
                  (() => {
                    const studentName = lessons.find(l => l.id === selectedStudentForExcuse.lessonId)?.attendance?.absent.find(s => s.id === selectedStudentForExcuse.studentId)?.name || '';
                    return isMobile ? getMobileStudentName(studentName) : studentName;
                  })()
                  : ''
                }
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="excuse-reason">Grund (optional)</Label>
              <Textarea
                id="excuse-reason"
                placeholder="z.B. Krankheit, Arzttermin, etc."
                value={excuseReason}
                onChange={(e) => setExcuseReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setExcuseDialogOpen(false)}>
                Abbrechen
              </Button>
              {selectedStudentForExcuse?.isEdit && (
                <Button 
                  variant="destructive" 
                  onClick={deleteExcuseStudent}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Entschuldigung löschen
                </Button>
              )}
              <Button onClick={confirmExcuseStudent}>
                {selectedStudentForExcuse?.isEdit ? 'Speichern' : 'Entschuldigen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Completion Comment Dialog */}
      <Dialog open={completionCommentDialog} onOpenChange={setCompletionCommentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aufgabe abschließen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {taskToComplete && (
              <>
                <div>
                  <Label>Aufgabe</Label>
                  <div className="font-medium">
                    {tasks.find(t => t.id === taskToComplete)?.title}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="completion-comment">Abschlusskommentar (optional)</Label>
                  <Textarea
                    id="completion-comment"
                    placeholder="Wie wurde die Aufgabe gelöst? Besondere Erkenntnisse?"
                    value={completionComment}
                    onChange={(e) => setCompletionComment(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            )}
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCompletionCommentDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={completeTaskWithComment}>
                Aufgabe abschließen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
