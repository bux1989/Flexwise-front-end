import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BarChart3, Users, User, BookOpen } from 'lucide-react';
import { getStudentStatisticsForClass, getAllStudentStatistics } from './data/mockData';
import { useIsMobile } from '../ui/use-mobile';

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
  type?: 'class' | 'course' | 'teacher';
}

interface StatisticsViewProps {
  selectedClass: Class;
  onViewTypeChange: (viewType: 'class' | 'student' | 'course') => void;
  selectedStudent: string;
  onStudentSelect: (studentId: string) => void;
}

export function StatisticsView({
  selectedClass,
  onViewTypeChange,
  selectedStudent,
  onStudentSelect
}: StatisticsViewProps) {
  const isMobile = useIsMobile();
  const [currentViewType, setCurrentViewType] = React.useState<'class' | 'student' | 'course'>('class');

  const handleViewTypeChange = (viewType: 'class' | 'student' | 'course') => {
    setCurrentViewType(viewType);
    onViewTypeChange(viewType);
  };

  const studentStats = getStudentStatisticsForClass(selectedClass.id);

  const renderClassView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Klassenstatistiken - {selectedClass.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Schüler</th>
                <th className="text-center p-2">Anwesenheit</th>
                <th className="text-center p-2">Fehltage</th>
                <th className="text-center p-2">Fehlstunden</th>
                <th className="text-center p-2">Verspätung (Min)</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.map((student) => (
                <tr key={student.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{student.name}</td>
                  <td className="text-center p-2">
                    <Badge variant={student.attendanceRate >= 90 ? 'default' : student.attendanceRate >= 80 ? 'secondary' : 'destructive'}>
                      {student.attendanceRate}%
                    </Badge>
                  </td>
                  <td className="text-center p-2">
                    <span className="text-green-600">{student.excusedFehltage}</span>
                    {student.unexcusedFehltage > 0 && (
                      <span className="text-red-600"> / {student.unexcusedFehltage}</span>
                    )}
                  </td>
                  <td className="text-center p-2">
                    <span className="text-green-600">{student.excusedFehlstunden}</span>
                    {student.unexcusedFehlstunden > 0 && (
                      <span className="text-red-600"> / {student.unexcusedFehlstunden}</span>
                    )}
                  </td>
                  <td className="text-center p-2">
                    <span className="text-green-600">{student.excusedLatenessMinutes}</span>
                    {student.unexcusedLatenessMinutes > 0 && (
                      <span className="text-red-600"> / {student.unexcusedLatenessMinutes}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderStudentView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Schülerstatistiken
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center text-muted-foreground">
            Wählen Sie einen Schüler aus der Klassenliste aus
          </div>
          <div className="grid gap-2">
            {getAllStudentStatistics().slice(0, 10).map((student) => (
              <Button
                key={student.id}
                variant="outline"
                className="justify-start"
                onClick={() => onStudentSelect(student.id)}
              >
                {student.name} - Klasse {student.classId === '1' ? '9A' : student.classId === '2' ? '9B' : '10A'}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCourseView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Kursstatistiken
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">
          Kursstatistiken werden hier angezeigt
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* View Type Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={currentViewType === 'class' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewTypeChange('class')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Klasse
            </Button>
            <Button
              variant={currentViewType === 'student' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewTypeChange('student')}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Schüler
            </Button>
            <Button
              variant={currentViewType === 'course' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewTypeChange('course')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Kurs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content based on selected view type */}
      {currentViewType === 'class' && renderClassView()}
      {currentViewType === 'student' && renderStudentView()}
      {currentViewType === 'course' && renderCourseView()}
    </div>
  );
}
