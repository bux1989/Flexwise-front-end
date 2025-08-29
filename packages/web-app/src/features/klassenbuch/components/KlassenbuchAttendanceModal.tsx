import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { type Lesson } from '../data/klassenbuchDataAdapter';

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
}

interface KlassenbuchAttendanceModalProps {
  lesson: Lesson;
  classData: Class;
  isOpen: boolean;
  onClose: () => void;
}

export function KlassenbuchAttendanceModal({ 
  lesson, 
  classData, 
  isOpen, 
  onClose 
}: KlassenbuchAttendanceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Anwesenheit - {lesson.subject} {classData.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {lesson.day} um {lesson.time} Uhr
          </div>
          <p className="text-muted-foreground">
            Die Anwesenheitserfassung wird in einem späteren Schritt integriert.
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Schließen</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
