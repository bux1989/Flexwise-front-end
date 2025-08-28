// Task Management Types

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface TaskComment {
  id: number;
  text: string;
  author: string;
  timestamp: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string;
  hotList: boolean;
  assignedTo: string[];
  assignedBy: string;
  timestamp: string;
  completedAt?: string;
  completedBy?: string;
  comments: TaskComment[];
}

export interface TaskFilters {
  searchQuery: string;
  priorityFilter: string;
  dueDateFilter: string;
  showHotListOnly: boolean;
  showCompletedTasks: boolean;
}
