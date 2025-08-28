import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { User } from 'lucide-react';
import { getStudentsForClass } from '../data/mockData';

interface Lesson {
  id: string;
  day: string;
  time: string;
  subject: string;
  room: string;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
}

interface Student {
  id: string;
  name: string;
  attendance: 'present' | 'late' | 'excused' | 'unexcused';
}

interface AttendanceModalProps {
  lesson: Lesson;
  classData: Class;
  isOpen: boolean;
  onClose: () => void;
}

const attendanceOptions = [
  { value: 'present', label: 'Anwesend', code: 'A', color: 'bg-green-100 text-green-800' },
  { value: 'late', label: 'Verspätet', code: 'S', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'excused', label: 'Entschuldigt', code: 'E', color: 'bg-blue-100 text-blue-800' },
  { value: 'unexcused', label: 'Unentschuldigt', code: 'U', color: 'bg-red-100 text-red-800' },
];

export function AttendanceModal({ lesson, classData, isOpen, onClose }: AttendanceModalProps) {
  // Get class-specific students
  const classStudents = getStudentsForClass(classData.id);
  
  // Initialize student attendance state with some mock attendance data
  const [students, setStudents] = useState<Student[]>(() => 
    classStudents.slice(0, 8).map((student, index) => ({
      id: student.id,
      name: student.name,
      attendance: index % 4 === 0 ? 'late' : 
                  index % 4 === 1 ? 'excused' : 
                  index % 4 === 2 ? 'unexcused' : 'present'
    }))
  );
  
  const [classNotes, setClassNotes] = useState('');

  const updateStudentAttendance = (studentId: string, attendance: Student['attendance']) => {
    setStudents(prev => 
      prev.map(student => 
        student.id === studentId ? { ...student, attendance } : student
      )
    );
  };

  const getAttendanceOption = (value: string) => {
    return attendanceOptions.find(option => option.value === value);
  };

  const handleSave = () => {
    // Here you would save the attendance data
    console.log('Saving attendance:', students);
    console.log('Class notes:', classNotes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Anwesenheit erfassen - {lesson.day}, {lesson.time}
          </DialogTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{classData.name}</span>
            <span>•</span>
            <span>{lesson.room}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Attendance Grid */}
          <div>
            <h3 className="font-semibold mb-4">Schüleranwesenheit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {students.map((student) => {
                const attendanceOption = getAttendanceOption(student.attendance);
                return (
                  <Card key={student.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={attendanceOption?.color}>
                            {attendanceOption?.code}
                          </Badge>
                          <Select
                            value={student.attendance}
                            onValueChange={(value) => 
                              updateStudentAttendance(student.id, value as Student['attendance'])
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {attendanceOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Class Notes */}
          <div>
            <Label htmlFor="class-notes" className="text-base font-semibold">
              Unterrichtsnotizen
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Behandelte Themen, Hausaufgaben, Bemerkungen
            </p>
            <Textarea
              id="class-notes"
              placeholder="Heute behandelte Themen, gestellte Hausaufgaben, besondere Vorkommnisse..."
              value={classNotes}
              onChange={(e) => setClassNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}