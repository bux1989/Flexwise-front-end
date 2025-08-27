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

export default function TeacherDashboard({ user, profile }: TeacherDashboardProps) {
  const isMobile = useIsMobile();
  
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'overview' | 'edit'>('edit');
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] = useState<number | null>(null);
  const [tempAttendance, setTempAttendance] = useState<{[studentId: number]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}}>({});
  const [lessonNote, setLessonNote] = useState('');
  
  // Task management state
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedTaskForComment, setSelectedTaskForComment] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  
  // New task creation state
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  
  // Mobile-specific expansion state
  const [expandedInfoItems, setExpandedInfoItems] = useState<Set<string>>(new Set());
  const [expandedMobileEvents, setExpandedMobileEvents] = useState<Set<number>>(new Set());
  const [expandedMobileTasks, setExpandedMobileTasks] = useState<Set<number>>(new Set());
  
  // Expansion state for tasks and events
  const [taskDisplayCount, setTaskDisplayCount] = useState(3);
  const [eventDisplayCount, setEventDisplayCount] = useState(3);
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  // Mock user permissions
  const canAssignTasks = true;
  
  const substituteLessons = getSubstituteLessons();

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => 
      t.id === id ? { 
        ...t, 
        completed: !t.completed,
        completedAt: !t.completed ? formatTimestamp() : null,
        completedBy: !t.completed ? CURRENT_TEACHER : null
      } : t
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
  }, [tasks, taskSearchQuery, taskPriorityFilter, showCompletedTasks]);

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

  const handleAddComment = () => {
    if (selectedTaskForComment && newComment.trim()) {
      addCommentToTask(selectedTaskForComment, newComment.trim());
      setNewComment('');
      setCommentDialogOpen(false);
      setSelectedTaskForComment(null);
    }
  };

  const handleHeaderButtonClick = (action: string) => {
    if (action === 'Ausloggen') {
      // Handle logout
      window.location.href = '/login';
    } else {
      alert(`Clicked: ${action}`);
    }
  };

  const currentDate = new Date();
  const dateString = formatDateTime();
  const isToday = selectedDate.toDateString() === currentDate.toDateString();

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
                  {lessons.map((lesson) => {
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
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-gray-600 min-w-[50px] leading-tight text-sm">
                            <div>{lesson.time} -</div>
                            <div>{lesson.endTime}</div>
                          </div>
                          <div className="flex-1">
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
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              {lesson.isCancelled ? (
                                <div>
                                  <span className="line-through text-red-500">{lesson.class}</span>
                                </div>
                              ) : (
                                <>
                                  {lesson.class} • {lesson.room}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Attendance button for non-cancelled lessons */}
                        {!lesson.isCancelled && needsAttendanceTracking(lesson.time, lesson.endTime, selectedDate, lesson.isCurrent) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`ml-2 ${
                              attendanceStatus === 'complete' 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : attendanceStatus === 'incomplete'
                                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                            onClick={() => {
                              setSelectedLessonForAttendance(lesson.id);
                              setAttendanceDialogOpen(true);
                            }}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            {attendanceStatus === 'complete' 
                              ? `${attendanceNumbers.present}/${lesson.enrolled}`
                              : attendanceStatus === 'incomplete'
                              ? `${attendanceNumbers.present}/${lesson.enrolled}`
                              : 'Anwesenheit'
                            }
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          {/* Aufgaben */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-green-500" />
                Aufgaben
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  onClick={() => setAddTaskDialogOpen(true)}
                  className="h-8 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Neu
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayedTasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`p-3 rounded-lg border ${
                      task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                          {task.hotList && <Star className="inline h-4 w-4 text-yellow-500 ml-1" />}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {task.description}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Badge variant={
                            task.priority === 'urgent' ? 'destructive' :
                            task.priority === 'high' ? 'destructive' :
                            task.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {task.priority === 'urgent' ? 'Dringend' :
                             task.priority === 'high' ? 'Hoch' :
                             task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                          </Badge>
                          <span>Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}</span>
                        </div>
                        {task.comments.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCommentDialog(task.id)}
                            className="mt-2 h-6 px-2 text-xs"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            {task.comments.length} Kommentar{task.comments.length !== 1 ? 'e' : ''}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Card */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-6 w-6 text-purple-500" />
              Termine & Veranstaltungen
            </CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-past-events"
                checked={showPastEvents}
                onCheckedChange={setShowPastEvents}
              />
              <Label htmlFor="show-past-events" className="text-sm">
                Vergangene anzeigen
              </Label>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayedEvents.map((event) => (
                <div key={event.id} className="p-3 rounded-lg border bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{event.date.day}. {event.date.month} {event.date.year}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{event.time}</span>
                        <MapPin className="h-3 w-3 ml-2" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-3">
                      <Button
                        variant={event.rsvp === 'attending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleEventRSVP(event.id, 'attending')}
                        className="h-7 px-2"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={event.rsvp === 'maybe' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleEventRSVP(event.id, 'maybe')}
                        className="h-7 px-2"
                      >
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={event.rsvp === 'not_attending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleEventRSVP(event.id, 'not_attending')}
                        className="h-7 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        currentTeacher={CURRENT_TEACHER}
        canAssignTasks={canAssignTasks}
        onCreateTask={createNewTask}
      />

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kommentar hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Kommentar eingeben..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Kommentar hinzufügen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
