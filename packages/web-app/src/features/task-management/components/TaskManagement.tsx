import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Star, Check, MessageCircle, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { AddTaskDialog } from '../../../components/AddTaskDialog';
import { INITIAL_TASKS, ASSIGNEE_GROUPS } from '../../../constants/mockData';
import { formatTimestamp, getPriorityValue } from '../../../../../shared/utils/dateHelpers';

interface TaskManagementProps {
  currentTeacher: string;
  canAssignTasks: boolean;
}

export function TaskManagement({ currentTeacher, canAssignTasks }: TaskManagementProps) {
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Task Management</CardTitle>
        {canAssignTasks && (
          <Button 
            onClick={() => setAddTaskDialogOpen(true)}
            size="sm"
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tasks..."
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={taskDueDateFilter} onValueChange={setTaskDueDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Due Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="today">Due Today</SelectItem>
              <SelectItem value="tomorrow">Due Tomorrow</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="hotlist"
              checked={showHotListOnly}
              onCheckedChange={setShowHotListOnly}
            />
            <label htmlFor="hotlist" className="text-sm">Hot List Only</label>
          </div>
        </div>

        {/* Task View Toggle */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="completed"
            checked={showCompletedTasks}
            onCheckedChange={setShowCompletedTasks}
          />
          <label htmlFor="completed" className="text-sm">
            Show Completed Tasks ({tasks.filter(t => t.completed).length})
          </label>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {displayedTasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h4>
                      {task.hotList && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className={`text-sm text-gray-600 mt-1 ${task.completed ? 'line-through' : ''}`}>
                      {task.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      <span>Assigned to: {task.assignedTo.join(', ')}</span>
                      {task.comments.length > 0 && (
                        <button
                          onClick={() => handleToggleComments(task.id)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>{task.comments.length}</span>
                          {expandedComments.has(task.id) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTaskHotList(task.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Star className={`h-4 w-4 ${task.hotList ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTaskForComment(task.id);
                      setCommentDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Comments Section */}
              {expandedComments.has(task.id) && task.comments.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <h5 className="text-sm font-medium mb-2">Comments</h5>
                  <div className="space-y-2">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded p-2">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {comment.author}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show More/Less Tasks */}
        {filteredAndSortedTasks.length > taskDisplayCount && (
          <Button
            variant="outline"
            onClick={() => setTaskDisplayCount(prev => prev + 3)}
            className="w-full"
          >
            Show More Tasks ({filteredAndSortedTasks.length - taskDisplayCount} remaining)
          </Button>
        )}

        {taskDisplayCount > 3 && (
          <Button
            variant="ghost"
            onClick={() => setTaskDisplayCount(3)}
            className="w-full"
          >
            Show Less
          </Button>
        )}
      </CardContent>

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        onCreateTask={createNewTask}
        assigneeGroups={ASSIGNEE_GROUPS}
      />

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddComment}>
                Add Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Comment Dialog */}
      <Dialog open={completionCommentDialog} onOpenChange={setCompletionCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add an optional comment about completing this task:
            </p>
            <Textarea
              placeholder="Task completion notes (optional)..."
              value={completionComment}
              onChange={(e) => setCompletionComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCompletionCommentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={completeTaskWithComment}>
                <Check className="h-4 w-4 mr-2" />
                Complete Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
