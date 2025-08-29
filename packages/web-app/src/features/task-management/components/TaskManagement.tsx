import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Star, Check, MessageCircle, Edit, Trash2, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { AddTaskDialog } from '../../../components/AddTaskDialog';
import { INITIAL_TASKS, ASSIGNEE_GROUPS } from '../../../../../shared/data/mockData';
import { formatTimestamp } from '../../../../../shared/utils/dateHelpers';
import { getPriorityValue } from '../../../../../shared/domains/management/to-do-list/utils';

interface TaskManagementProps {
  currentTeacher: string;
  canAssignTasks: boolean;
  isMobile?: boolean;
}

export function TaskManagement({ currentTeacher, canAssignTasks, isMobile = false }: TaskManagementProps) {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');
  const [taskDueDateFilter, setTaskDueDateFilter] = useState<string>('all');
  const [showHotListOnly, setShowHotListOnly] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedTaskForComment, setSelectedTaskForComment] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [taskDisplayCount, setTaskDisplayCount] = useState(3);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editTaskData, setEditTaskData] = useState<{title: string, description: string, priority: string, dueDate: string, hotList: boolean, assignedTo: string[]}>({
    title: '', description: '', priority: 'medium', dueDate: '', hotList: false, assignedTo: []
  });
  const [completionCommentDialog, setCompletionCommentDialog] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<number | null>(null);
  const [completionComment, setCompletionComment] = useState('');
  const [expandedGroupAssignees, setExpandedGroupAssignees] = useState<Set<number>>(new Set());
  const [expandedMobileTasks, setExpandedMobileTasks] = useState<Set<number>>(new Set());

  const getCurrentTeacherName = () => currentTeacher;

  const toggleTask = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    if (!task.completed) {
      setTaskToComplete(id);
      setCompletionCommentDialog(true);
    } else {
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
        completedBy: getCurrentTeacherName(),
        comments: completionComment.trim() ? [
          ...task.comments,
          {
            id: task.comments.length + 1,
            text: completionComment.trim(),
            timestamp: now,
            author: getCurrentTeacherName()
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
          author: getCurrentTeacherName()
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
      assignedBy: getCurrentTeacherName(),
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

  const displayedTasks = filteredAndSortedTasks.slice(0, taskDisplayCount);

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

  return (
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
                          {task.assignedTo.length > 0 && !task.assignedTo.includes(currentTeacher) && assignedGroups.length === 0 && (
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

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        onCreateTask={createNewTask}
        currentTeacher={currentTeacher}
        canAssignTasks={canAssignTasks}
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
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddComment}>
                Kommentar hinzufügen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Comment Dialog */}
      <Dialog open={completionCommentDialog} onOpenChange={setCompletionCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aufgabe abschließen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Fügen Sie einen optionalen Kommentar zum Abschluss dieser Aufgabe hinzu:
            </p>
            <Textarea
              placeholder="Notizen zum Aufgabenabschluss (optional)..."
              value={completionComment}
              onChange={(e) => setCompletionComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCompletionCommentDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={completeTaskWithComment}>
                <Check className="h-4 w-4 mr-2" />
                Aufgabe abschließen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
