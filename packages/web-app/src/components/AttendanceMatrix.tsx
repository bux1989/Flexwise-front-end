import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DebugOverlay } from '../debug';
import { Badge } from './ui/badge';
import { X, Minus, Check } from 'lucide-react';

interface ClassData {
  name: string;
  attendanceStatus: 'none' | 'partial' | 'complete';
  totalStudents: number;
  markedStudents: number;
}

interface AttendanceMatrixProps {
  onClassClick: (className: string) => void;
  onStatusClick: (status: string) => void;
}

export function AttendanceMatrix({ onClassClick, onStatusClick }: AttendanceMatrixProps) {
  const classes: ClassData[] = [
    { name: '1A', attendanceStatus: 'none', totalStudents: 24, markedStudents: 0 },
    { name: '1B', attendanceStatus: 'partial', totalStudents: 22, markedStudents: 15 },
    { name: '2A', attendanceStatus: 'none', totalStudents: 25, markedStudents: 0 },
    { name: '2B', attendanceStatus: 'partial', totalStudents: 23, markedStudents: 18 },
    { name: '2C', attendanceStatus: 'none', totalStudents: 21, markedStudents: 0 },
    { name: '3A', attendanceStatus: 'partial', totalStudents: 26, markedStudents: 20 },
    { name: '3B', attendanceStatus: 'none', totalStudents: 24, markedStudents: 0 },
    { name: '3C', attendanceStatus: 'partial', totalStudents: 22, markedStudents: 12 },
    { name: '4A', attendanceStatus: 'complete', totalStudents: 25, markedStudents: 25 },
    { name: '4B', attendanceStatus: 'none', totalStudents: 23, markedStudents: 0 },
    { name: '5A', attendanceStatus: 'complete', totalStudents: 24, markedStudents: 24 },
    { name: '5B', attendanceStatus: 'partial', totalStudents: 22, markedStudents: 16 },
    { name: '6A', attendanceStatus: 'complete', totalStudents: 26, markedStudents: 26 },
    { name: '6B', attendanceStatus: 'partial', totalStudents: 25, markedStudents: 19 }
  ];

  const footerStats = {
    anwesend: 317,
    ausstehend: 23,
    entschuldigt: 8,
    unentschuldigt: 2,
    ueberfaellig: 3
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <Check className="h-3 w-3 stroke-[2.5]" />;
      case 'partial':
        return <Minus className="h-3 w-3 stroke-[2.5]" />;
      case 'none':
      default:
        return <X className="h-3 w-3 stroke-[2.5]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-green-700';
      case 'partial':
        return 'text-orange-700';
      case 'none':
      default:
        return 'text-red-700';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-50 hover:bg-green-100 border-green-300';
      case 'partial':
        return 'bg-orange-50 hover:bg-orange-100 border-orange-300';
      case 'none':
      default:
        return 'bg-red-50 hover:bg-red-100 border-red-300';
    }
  };

  const getStatusTitle = (classData: ClassData) => {
    switch (classData.attendanceStatus) {
      case 'complete':
        return `${classData.name}: Alle ${classData.totalStudents} Schüler*innen erfasst`;
      case 'partial':
        return `${classData.name}: ${classData.markedStudents} von ${classData.totalStudents} Schüler*innen erfasst`;
      case 'none':
      default:
        return `${classData.name}: Noch keine Anwesenheit erfasst (${classData.totalStudents} Schüler*innen)`;
    }
  };

  return (
    <DebugOverlay name="AttendanceMatrix">
      <Card className="h-full">
      <CardHeader>
        <CardTitle>Anwesenheit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3 mb-6">
          {classes.map((classItem) => (
            <button
              key={classItem.name}
              onClick={() => onClassClick(classItem.name)}
              className={`relative aspect-square rounded-lg border transition-all duration-200 flex flex-col items-center justify-center group shadow-sm hover:shadow-md p-2 ${getStatusBgColor(classItem.attendanceStatus)}`}
              title={getStatusTitle(classItem)}
            >
              {/* Class name */}
              <span className="font-medium text-sm text-foreground mb-1">{classItem.name}</span>
              
              {/* Status indicator with icon only */}
              <div className={`flex items-center justify-center ${getStatusColor(classItem.attendanceStatus)}`}>
                {getStatusIcon(classItem.attendanceStatus)}
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Anwesend</span>
            <button onClick={() => onStatusClick('anwesend')}>
              <Badge 
                variant="secondary" 
                className="bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
              >
                {footerStats.anwesend}
              </Badge>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Ausstehend</span>
            <button onClick={() => onStatusClick('ausstehend')}>
              <Badge 
                variant="secondary" 
                className="bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer"
              >
                {footerStats.ausstehend}
              </Badge>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Entschuldigt</span>
            <button onClick={() => onStatusClick('entschuldigt')}>
              <Badge 
                variant="secondary" 
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                {footerStats.entschuldigt}
              </Badge>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Unentschuldigt</span>
            <button onClick={() => onStatusClick('unentschuldigt')}>
              <Badge 
                variant="secondary" 
                className="bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                {footerStats.unentschuldigt}
              </Badge>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Überfällig</span>
            <button onClick={() => onStatusClick('ueberfaellig')}>
              <Badge 
                variant="secondary" 
                className="bg-red-100 text-red-800 hover:bg-red-200 transition-colors cursor-pointer"
              >
                {footerStats.ueberfaellig}
              </Badge>
            </button>
          </div>
        </div>
      </CardContent>
      </Card>
    </DebugOverlay>
  );
}
