import { useState, useMemo } from 'react';
import { Calendar, Bell, MessageCircle, Menu, Info, Clock, MapPin, Plus, Check, AlertCircle, X, Edit, Trash2, HelpCircle, UserPlus, Search, Filter, Star, ChevronDown, ChevronUp, EyeOff, Eye, BookOpen, Users, UserX, User, FileText, LogOut, CalendarIcon, ClipboardList, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useIsMobile } from '../components/ui/use-mobile';

// Imported components and utilities
import { Header } from '../components/Header';
import { AddTaskDialog } from '../components/AddTaskDialog';
import { TimeInputWithArrows } from '../components/TimeInputWithArrows';
import { CURRENT_TEACHER, INITIAL_TASKS, INITIAL_EVENTS, INITIAL_LESSONS, ASSIGNEE_GROUPS } from '../constants/mockData';
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
} from '../utils/helpers';

interface TeacherDashboardProps {
  user: any;
  profile: any;
}

export default function App({ user, profile }: TeacherDashboardProps) {
  const isMobile = useIsMobile();
  
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
  
  // Mock user permissions - Frau Müller can assign tasks
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

  // This is just a simple placeholder component showing the main structure
  // The full implementation would include all the detailed components
  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Header 
        currentTeacher={CURRENT_TEACHER}
        dateString={dateString}
        onButtonClick={handleHeaderButtonClick}
      />

      <div className="p-6">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Teacher Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Welcome {CURRENT_TEACHER}
          </p>
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Overview</h2>
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span>Today's Lessons:</span>
                <span className="font-medium">{lessons.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Tasks:</span>
                <span className="font-medium">{tasks.filter(t => !t.completed).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Upcoming Events:</span>
                <span className="font-medium">{events.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        currentTeacher={CURRENT_TEACHER}
        canAssignTasks={canAssignTasks}
        onCreateTask={createNewTask}
      />
    </div>
  );
}
