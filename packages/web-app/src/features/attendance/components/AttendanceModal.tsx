import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Card, CardContent } from '../../../components/ui/card';
import { User, Loader2 } from 'lucide-react';
import { fetchLessonAttendance, bulkSaveAttendance } from '../../../lib/supabase';

interface Student {
  id: string;
  name: string;
  attendance: 'present' | 'late' | 'absent_excused' | 'absent_unexcused';
}

interface AttendanceModalProps {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
  viewMode?: 'overview' | 'edit';
}

const attendanceOptions = [
  { value: 'present', label: 'Anwesend', code: 'A', color: 'bg-green-100 text-green-800' },
  { value: 'late', label: 'Verspätet', code: 'S', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'absent_excused', label: 'Entschuldigt', code: 'E', color: 'bg-blue-100 text-blue-800' },
  { value: 'absent_unexcused', label: 'Unentschuldigt', code: 'U', color: 'bg-red-100 text-red-800' },
];

export function AttendanceModal({ lessonId, isOpen, onClose, viewMode = 'edit' }: AttendanceModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classNotes, setClassNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lessonInfo, setLessonInfo] = useState<any>(null);

  // Load attendance data when modal opens
  useEffect(() => {
    if (isOpen && lessonId) {
      loadAttendanceData();
    }
  }, [isOpen, lessonId]);

  const loadAttendanceData = async () => {
    if (!lessonId) return;
    
    try {
      setLoading(true);
      console.log('📚 Loading attendance for lesson:', lessonId);
      
      // Fetch attendance records grouped by status
      const attendanceData = await fetchLessonAttendance(lessonId);
      
      // Combine all students from different status groups
      const allStudents: Student[] = [];
      
      // Add present students
      attendanceData.present?.forEach((record: any) => {
        allStudents.push({
          id: record.student_id,
          name: record.user_profiles?.first_name && record.user_profiles?.last_name 
            ? `${record.user_profiles.first_name} ${record.user_profiles.last_name}`
            : `Student ${record.student_id}`,
          attendance: 'present'
        });
      });
      
      // Add late students
      attendanceData.late?.forEach((record: any) => {
        allStudents.push({
          id: record.student_id,
          name: record.user_profiles?.first_name && record.user_profiles?.last_name 
            ? `${record.user_profiles.first_name} ${record.user_profiles.last_name}`
            : `Student ${record.student_id}`,
          attendance: 'late'
        });
      });
      
      // Add absent students (both excused and unexcused)
      attendanceData.absent?.forEach((record: any) => {
        allStudents.push({
          id: record.student_id,
          name: record.user_profiles?.first_name && record.user_profiles?.last_name 
            ? `${record.user_profiles.first_name} ${record.user_profiles.last_name}`
            : `Student ${record.student_id}`,
          attendance: record.status === 'absent_excused' ? 'absent_excused' : 'absent_unexcused'
        });
      });
      
      setStudents(allStudents);
      console.log('✅ Attendance data loaded:', allStudents.length, 'students');
      
    } catch (error) {
      console.error('❌ Error loading attendance:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!lessonId) return;
    
    try {
      setSaving(true);
      console.log('💾 Saving attendance for lesson:', lessonId);
      
      // Convert students to attendance records format
      const attendanceRecords = students.map(student => ({
        studentId: student.id,
        status: student.attendance,
        notes: classNotes || null
      }));
      
      // Save to Supabase
      await bulkSaveAttendance(lessonId, attendanceRecords);
      
      console.log('✅ Attendance saved successfully');
      onClose();
      
    } catch (error) {
      console.error('❌ Error saving attendance:', error);
      // TODO: Show error message to user
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStudents([]);
    setClassNotes('');
    setLessonInfo(null);
    onClose();
  };

  if (!isOpen || !lessonId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {viewMode === 'overview' ? 'Anwesenheit ansehen' : 'Anwesenheit erfassen'}
          </DialogTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Stunde ID: {lessonId}</span>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Anwesenheitsdaten werden geladen...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Attendance Grid */}
            <div>
              <h3 className="font-semibold mb-4">
                Schüleranwesenheit ({students.length} Schüler)
              </h3>
              
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Keine Anwesenheitsdaten gefunden.</p>
                  <p className="text-sm mt-2">Die Anwesenheit wurde möglicherweise noch nicht erfasst.</p>
                </div>
              ) : (
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
                              
                              {viewMode === 'edit' && (
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
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Class Notes - only in edit mode */}
            {viewMode === 'edit' && (
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
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                {viewMode === 'overview' ? 'Schließen' : 'Abbrechen'}
              </Button>
              
              {viewMode === 'edit' && (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Speichern...
                    </>
                  ) : (
                    'Speichern'
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
