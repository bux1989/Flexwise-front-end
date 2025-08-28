import { useState } from 'react';
import { CalendarIcon, Search, ChevronUp, ChevronDown, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Checkbox } from './ui/checkbox';
import { ASSIGNEE_GROUPS, INDIVIDUAL_ASSIGNEES } from '../constants/mockData';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTeacher: string;
  canAssignTasks: boolean;
  onCreateTask: (taskData: {
    title: string;
    description: string;
    priority: string;
    dueDate: Date | undefined;
    hotList: boolean;
    assignedTo: string[];
  }) => void;
}

export function AddTaskDialog({ 
  open, 
  onOpenChange, 
  currentTeacher, 
  canAssignTasks, 
  onCreateTask 
}: AddTaskDialogProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined);
  const [newTaskHotList, setNewTaskHotList] = useState(false);
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string[]>([currentTeacher]);
  const [isTaskCalendarOpen, setIsTaskCalendarOpen] = useState(false);

  const handleTaskDateSelect = (date: Date | undefined) => {
    setNewTaskDueDate(date);
    setIsTaskCalendarOpen(false);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || newTaskAssignedTo.length === 0) return;

    onCreateTask({
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      hotList: newTaskHotList,
      assignedTo: newTaskAssignedTo
    });

    // Reset form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskDueDate(undefined);
    setNewTaskHotList(false);
    setNewTaskAssignedTo([currentTeacher]);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // Reset form when closing
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskDueDate(undefined);
      setNewTaskHotList(false);
      setNewTaskAssignedTo([currentTeacher]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Aufgabe hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="task-title">Titel *</Label>
            <Input
              id="task-title"
              placeholder="Aufgabentitel eingeben..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="task-description">Beschreibung</Label>
            <Textarea
              id="task-description"
              placeholder="Detaillierte Beschreibung der Aufgabe..."
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-priority">Priorität</Label>
              <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fälligkeitsdatum</Label>
              <Popover open={isTaskCalendarOpen} onOpenChange={setIsTaskCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {newTaskDueDate ? newTaskDueDate.toLocaleDateString('de-DE') : 'Datum wählen'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newTaskDueDate}
                    onSelect={handleTaskDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="task-hotlist"
              checked={newTaskHotList}
              onCheckedChange={setNewTaskHotList}
            />
            <Label htmlFor="task-hotlist" className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              Zur Hot List hinzufügen
            </Label>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim() || newTaskAssignedTo.length === 0}>
              Aufgabe erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
