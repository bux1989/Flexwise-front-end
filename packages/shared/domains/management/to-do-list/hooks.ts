// Task management hooks for To-Do-List module
import { useState, useEffect } from 'react';

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

// Custom hooks for task management functionality
export function usePriorityValue(priority: string): number {
  switch (priority) {
    case 'urgent': return 3;
    case 'high': return 2;
    case 'medium': return 1;
    default: return 0;
  }
}

export function useTaskFiltering(
  tasks: Task[],
  searchQuery: string,
  priorityFilter: string,
  dueDateFilter: string,
  showHotListOnly: boolean,
  showCompletedTasks: boolean
) {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    let filtered = tasks;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Due date filter
    if (dueDateFilter !== 'all') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      filtered = filtered.filter(task => {
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

    // Hot list filter
    if (showHotListOnly) {
      filtered = filtered.filter(task => task.hotList);
    }

    // Completed tasks filter
    if (!showCompletedTasks) {
      filtered = filtered.filter(task => !task.completed);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, priorityFilter, dueDateFilter, showHotListOnly, showCompletedTasks]);

  return filteredTasks;
}

export function useTaskActions() {
  const completeTask = (taskId: number, completionComment: string = '') => {
    // Task completion logic
    console.log(`Completing task ${taskId} with comment: ${completionComment}`);
  };

  const addComment = (taskId: number, comment: string) => {
    // Add comment logic
    console.log(`Adding comment to task ${taskId}: ${comment}`);
  };

  const updateTask = (taskId: number, updates: Partial<Task>) => {
    // Update task logic
    console.log(`Updating task ${taskId}:`, updates);
  };

  const deleteTask = (taskId: number) => {
    // Delete task logic
    console.log(`Deleting task ${taskId}`);
  };

  return {
    completeTask,
    addComment,
    updateTask,
    deleteTask
  };
}
