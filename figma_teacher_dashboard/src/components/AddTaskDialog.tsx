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
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleTaskDateSelect = (date: Date | undefined) => {
    setNewTaskDueDate(date);
    setIsTaskCalendarOpen(false);
  };

  const handleAssigneeToggle = (assignee: string) => {
    setNewTaskAssignedTo(prev => 
      prev.includes(assignee) 
        ? prev.filter(a => a !== assignee)
        : [...prev, assignee]
    );
  };

  const handleGroupToggle = (groupName: string, members: string[]) => {
    const allMembersSelected = members.every(member => newTaskAssignedTo.includes(member));
    
    if (allMembersSelected) {
      setNewTaskAssignedTo(prev => prev.filter(assignee => !members.includes(assignee)));
    } else {
      const newAssignees = [...new Set([...newTaskAssignedTo, ...members])];
      setNewTaskAssignedTo(newAssignees);
    }
  };

  const handleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return newExpanded;
    });
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
    setAssigneeSearchQuery('');
    setExpandedGroups(new Set());
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
      setAssigneeSearchQuery('');
      setExpandedGroups(new Set());
    }
  };

  // Fixed search logic - only show groups when group name matches, not member names
  const filteredAssignees = (() => {
    if (!assigneeSearchQuery) {
      return { groups: ASSIGNEE_GROUPS, individuals: INDIVIDUAL_ASSIGNEES };
    }
    
    const query = assigneeSearchQuery.toLowerCase();
    
    // Only show groups if the GROUP NAME itself matches the search query
    const filteredGroups = ASSIGNEE_GROUPS.filter(group => 
      group.name.toLowerCase().includes(query)
    );
    
    // Show individuals if their name matches
    const filteredIndividuals = INDIVIDUAL_ASSIGNEES.filter(assignee =>
      assignee.toLowerCase().includes(query)
    );
    
    return { groups: filteredGroups, individuals: filteredIndividuals };
  })();

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

          {/* Only show assignment field if user has permission */}
          {canAssignTasks && (
            <div>
              <Label>Zuweisen an *</Label>
              
              {/* Search Field */}
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Personen oder Gruppen suchen..."
                  value={assigneeSearchQuery}
                  onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Assignee Selection */}
              <div className="mt-2 space-y-3 max-h-48 overflow-y-auto border rounded p-3">
                {/* Current User (Ich) - Always at top */}
                <div className="border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assignee-self"
                      checked={newTaskAssignedTo.includes(currentTeacher)}
                      onCheckedChange={() => handleAssigneeToggle(currentTeacher)}
                    />
                    <Label htmlFor="assignee-self" className="text-sm cursor-pointer font-medium">
                      Ich ({currentTeacher})
                    </Label>
                  </div>
                </div>

                {/* Groups */}
                {filteredAssignees.groups.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 uppercase">Gruppen</div>
                    {filteredAssignees.groups.map(group => {
                      const allMembersSelected = group.members.every(member => newTaskAssignedTo.includes(member));
                      const isExpanded = expandedGroups.has(group.id);
                      
                      return (
                        <div key={group.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`group-${group.id}`}
                                checked={allMembersSelected}
                                onCheckedChange={() => handleGroupToggle(group.name, group.members)}
                              />
                              <Label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer">
                                {group.name}
                              </Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGroupExpand(group.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                          </div>
                          
                          {/* Group Members */}
                          {isExpanded && (
                            <div className="ml-6 space-y-1">
                              {group.members.map(member => (
                                <div key={member} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`member-${member}`}
                                    checked={newTaskAssignedTo.includes(member)}
                                    onCheckedChange={() => handleAssigneeToggle(member)}
                                  />
                                  <Label htmlFor={`member-${member}`} className="text-xs cursor-pointer text-gray-600">
                                    {member}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Individual Assignees (excluding current user) */}
                {filteredAssignees.individuals.filter(assignee => assignee !== currentTeacher).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 uppercase">Einzelpersonen</div>
                    {filteredAssignees.individuals
                      .filter(assignee => assignee !== currentTeacher)
                      .map(assignee => (
                        <div key={assignee} className="flex items-center space-x-2">
                          <Checkbox
                            id={`assignee-${assignee}`}
                            checked={newTaskAssignedTo.includes(assignee)}
                            onCheckedChange={() => handleAssigneeToggle(assignee)}
                          />
                          <Label htmlFor={`assignee-${assignee}`} className="text-sm cursor-pointer">
                            {assignee}
                          </Label>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              
              {newTaskAssignedTo.length > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  Ausgewählt: {newTaskAssignedTo.join(', ')}
                </div>
              )}
            </div>
          )}

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