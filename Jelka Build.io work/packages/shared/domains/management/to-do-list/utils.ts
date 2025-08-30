// Task management utility functions for To-Do-List module

export interface TaskComment {
  id: number;
  author: string;
  content: string;
  timestamp: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  completed: boolean;
  hotList: boolean;
  assignedTo: string[];
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  completionComment?: string;
  comments: TaskComment[];
}

// Utility functions for task management functionality
export function getPriorityValue(priority: string): number {
  switch (priority) {
    case 'urgent': return 3;
    case 'high': return 2;
    case 'medium': return 1;
    default: return 0;
  }
}

export function filterTasksBySearch(tasks: Task[], searchQuery: string): Task[] {
  if (!searchQuery.trim()) return tasks;
  
  return tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
}

export function filterTasksByPriority(tasks: Task[], priorityFilter: string): Task[] {
  if (priorityFilter === 'all') return tasks;
  return tasks.filter(task => task.priority === priorityFilter);
}

export function filterTasksByDueDate(tasks: Task[], dueDateFilter: string): Task[] {
  if (dueDateFilter === 'all') return tasks;
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    switch (dueDateFilter) {
      case 'today':
        return dueDate.toDateString() === today.toDateString();
      case 'tomorrow':
        return dueDate.toDateString() === tomorrow.toDateString();
      case 'this_week':
        return dueDate <= nextWeek && dueDate >= today;
      case 'overdue':
        return dueDate < today && !task.completed;
      default:
        return true;
    }
  });
}

export function filterTasksByHotList(tasks: Task[], showHotListOnly: boolean): Task[] {
  if (!showHotListOnly) return tasks;
  return tasks.filter(task => task.hotList);
}

export function filterTasksByCompletion(tasks: Task[], showCompletedTasks: boolean): Task[] {
  if (showCompletedTasks) return tasks;
  return tasks.filter(task => !task.completed);
}

export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
}

export function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}
