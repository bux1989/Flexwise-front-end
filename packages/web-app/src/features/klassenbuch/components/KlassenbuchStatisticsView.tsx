import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
  type?: 'class' | 'course' | 'teacher';
}

interface KlassenbuchStatisticsViewProps {
  selectedClass: Class;
  onViewTypeChange?: (viewType: 'class' | 'student' | 'course') => void;
  selectedStudent?: string;
  onStudentSelect?: (studentId: string) => void;
}

export function KlassenbuchStatisticsView({ 
  selectedClass, 
  onViewTypeChange, 
  selectedStudent = '', 
  onStudentSelect 
}: KlassenbuchStatisticsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Statistiken</h2>
        <p className="text-muted-foreground">{selectedClass.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anwesenheitsstatistiken</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Die Statistikfunktionen werden in einem späteren Schritt integriert.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
