import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Users, User, BookOpen, CalendarDays, Clock, AlertTriangle, CheckCircle, Edit3, FileText, Calendar, ChevronDown, ChevronRight, BarChart3, Search, X } from 'lucide-react';
import { getStudentStatisticsForClass, getCourseDataForClass, getCourseStudentsForCourse, getStudentById, updateAbsenceDetails, updateLatenessDetails, convertToExcused, getStudentIdFromCourseName, getAllStudentStatistics, getClassNameById, SEMESTER_START_DATE, getCurrentDateString } from '@flexwise/shared/domains/academic';
import { ExcuseEditModal } from './ExcuseEditModal';
import { AddExcuseModal } from './AddExcuseModal';
import { useIsMobile } from '../ui/use-mobile';
import type { AbsenceDetail, LatenessDetail, ExcuseInfo, CourseAttendanceEntry } from '../../../shared/domains/academic';

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
  type?: 'class' | 'course' | 'teacher';
}

interface StatisticsViewProps {
  selectedClass: Class;
  onViewTypeChange?: (viewType: 'class' | 'student' | 'course') => void;
  selectedStudent?: string;
  onStudentSelect?: (studentId: string) => void;
}

type ViewType = 'class' | 'student' | 'course';
type DetailType = 'fehltage' | 'fehlstunden' | 'excused_fehltage' | 'unexcused_fehltage' | 'excused_fehlstunden' | 'unexcused_fehlstunden' | 'excused_lateness' | 'unexcused_lateness';

export function StatisticsView({ selectedClass, onViewTypeChange, selectedStudent = '', onStudentSelect }: StatisticsViewProps) {
  const [viewType, setViewType] = useState<ViewType>('class');
  const [localSelectedStudent, setLocalSelectedStudent] = useState<string>(selectedStudent);
  const [showDetails, setShowDetails] = useState<{ type: DetailType; studentId: string } | null>(null);
  const [editingExcuse, setEditingExcuse] = useState<{
    item: AbsenceDetail | LatenessDetail;
    type: 'absence' | 'lateness';
    studentId: string;
  } | null>(null);
  const [addingExcuse, setAddingExcuse] = useState<{
    item: AbsenceDetail | LatenessDetail;
    type: 'absence' | 'lateness';
    studentId: string;
  } | null>(null);
  const [expandedExcuses, setExpandedExcuses] = useState<Set<string>>(new Set());
  const [studentSearchFilter, setStudentSearchFilter] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const isMobile = useIsMobile();

  // Get class-specific data
  const classStudentStatistics = getStudentStatisticsForClass(selectedClass.id);
  const classCourseData = getCourseDataForClass(selectedClass.id);
  const courseStudents = getCourseStudentsForCourse(selectedClass.id);

  // Get all students for improved student selection
  const allStudentStatistics = getAllStudentStatistics();

  // Helper function to shorten student names on mobile - specifically for course view
  const formatStudentName = (fullName: string) => {
    if (!isMobile) return fullName;

    // Remove class info in parentheses if present (e.g., "Ben Schmidt (9A)" -> "Ben Schmidt")
    const nameWithoutClass = fullName.replace(/\s*\([^)]*\)$/, '').trim();

    const nameParts = nameWithoutClass.split(' ');
    if (nameParts.length < 2) return fullName;

    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    // Ensure we always get exactly 2 characters from last name, or use full if shorter
    const lastNameShort = lastName.length >= 2 ? lastName.substring(0, 2) : lastName;

    return `${firstName} ${lastNameShort}`;
  };

  // Update local state when selectedStudent prop changes
  React.useEffect(() => {
    if (selectedStudent) {
      setLocalSelectedStudent(selectedStudent);
      setViewType('student');
    }
  }, [selectedStudent]);

  // Clear details when selected student changes - FIX FOR THE BUG
  React.useEffect(() => {
    setShowDetails(null);
  }, [localSelectedStudent]);

  // Handle view type change
  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    onViewTypeChange?.(newViewType);
    setShowDetails(null);

    // Reset filters when changing view types
    if (newViewType !== 'student') {
      setStudentSearchFilter('');
      setShowSearchResults(false);
    }
  };

  // Handle student selection from class view
  const handleStudentClick = (studentId: string) => {
    setLocalSelectedStudent(studentId);
    setViewType('student');
    onViewTypeChange?.('student');
    onStudentSelect?.(studentId);
  };

  // Handle course student name click - FIXED
  const handleCourseStudentClick = (studentName: string) => {
    const studentId = getStudentIdFromCourseName(studentName);
    if (studentId) {
      handleStudentClick(studentId);
    }
  };

  // Handle student selection from search results
  const handleStudentSelectFromSearch = (studentId: string) => {
    setLocalSelectedStudent(studentId);
    setShowSearchResults(false);
    // Clear search to show selected student name in search field
    const selectedStudent = allStudentStatistics.find(s => s.id === studentId);
    if (selectedStudent) {
      setStudentSearchFilter(`${selectedStudent.name} (${getClassNameById(selectedStudent.classId)})`);
    }
    onStudentSelect?.(studentId);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStudentSearchFilter(value);
    setShowSearchResults(value.trim().length > 0);

    // Clear selected student if search is modified
    if (localSelectedStudent && value !== `${allStudentStatistics.find(s => s.id === localSelectedStudent)?.name} (${getClassNameById(allStudentStatistics.find(s => s.id === localSelectedStudent)?.classId || '')})`) {
      setLocalSelectedStudent('');
    }
  };

  // Handle clearing the search field - NEW
  const handleClearSearch = () => {
    setStudentSearchFilter('');
    setLocalSelectedStudent('');
    setShowSearchResults(false);
    onStudentSelect?.('');
  };

  // Handle statistics number clicks
  const handleStatisticClick = (type: DetailType, studentId: string) => {
    setShowDetails({ type, studentId });
  };

  // Handle closing details - ADDED
  const handleCloseDetails = () => {
    setShowDetails(null);
  };

  // Handle excuse editing
  const handleEditExcuse = (item: AbsenceDetail | LatenessDetail, type: 'absence' | 'lateness', studentId: string) => {
    setEditingExcuse({ item, type, studentId });
  };

  // Handle adding excuse to unexcused item
  const handleAddExcuse = (item: AbsenceDetail | LatenessDetail, type: 'absence' | 'lateness', studentId: string) => {
    setAddingExcuse({ item, type, studentId });
  };

  // Save edited excuse
  const handleSaveExcuse = (updatedExcuse: ExcuseInfo) => {
    if (!editingExcuse) return;

    const { item, type, studentId } = editingExcuse;
    const updates = { excuseInfo: updatedExcuse };

    if (type === 'absence') {
      updateAbsenceDetails(studentId, item.id, updates);
    } else {
      updateLatenessDetails(studentId, item.id, updates);
    }

    setEditingExcuse(null);
    // Force re-render by updating showDetails
    if (showDetails) {
      setShowDetails({ ...showDetails });
    }
  };

  // Handle excuse deletion
  const handleDeleteExcuse = () => {
    if (!editingExcuse) return;

    const { item, type, studentId } = editingExcuse;

    if (type === 'absence') {
      const updates = { type: 'unexcused' as const, excuseInfo: undefined };
      updateAbsenceDetails(studentId, item.id, updates);

      // Update student statistics
      const student = allStudentStatistics.find(s => s.id === studentId);
      if (student && 'absenceType' in item) {
        if (item.absenceType === 'fehltag') {
          student.excusedFehltage--;
          student.unexcusedFehltage++;
        } else {
          student.excusedFehlstunden--;
          student.unexcusedFehlstunden++;
        }
      }
    } else {
      const updates = { type: 'unexcused' as const, excuseInfo: undefined };
      updateLatenessDetails(studentId, item.id, updates);

      // Update student statistics
      const student = allStudentStatistics.find(s => s.id === studentId);
      if (student) {
        student.excusedLatenessMinutes -= item.minutes;
        student.unexcusedLatenessMinutes += item.minutes;
      }
    }

    setEditingExcuse(null);
    // Force re-render by updating showDetails
    if (showDetails) {
      setShowDetails({ ...showDetails });
    }
  };

  // Save new excuse for unexcused item
  const handleSaveNewExcuse = (excuseText: string) => {
    if (!addingExcuse) return;

    const { item, type, studentId } = addingExcuse;
    convertToExcused(studentId, item.id, type, excuseText);

    setAddingExcuse(null);
    // Force re-render by updating showDetails
    if (showDetails) {
      setShowDetails({ ...showDetails });
    }
  };

  // Handle excuse toggle in course view
  const toggleExcuseExpansion = (studentName: string, dateIndex: number) => {
    const key = `${studentName}-${dateIndex}`;
    const newExpanded = new Set(expandedExcuses);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedExcuses(newExpanded);
  };

  // Close specific excuse expansion
  const closeExcuseExpansion = (studentName: string, dateIndex: number) => {
    const key = `${studentName}-${dateIndex}`;
    const newExpanded = new Set(expandedExcuses);
    newExpanded.delete(key);
    setExpandedExcuses(newExpanded);
  };

  // Get subject breakdown for missed individual lessons (fehlstunden only)
  const getSubjectBreakdown = (studentId: string) => {
    const student = getStudentById(studentId);
    if (!student) return {};

    const subjectCounts: Record<string, number> = {};

    // Only count individual lessons (fehlstunde), not whole days (fehltag)
    student.absenceDetails
      .filter(detail => detail.absenceType === 'fehlstunde')
      .forEach(detail => {
        subjectCounts[detail.subject] = (subjectCounts[detail.subject] || 0) + 1;
      });

    // Remove subjects with 0 absences and sort by count
    const filteredCounts = Object.entries(subjectCounts)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);

    return Object.fromEntries(filteredCounts);
  };

  // Filter students for improved student selection - FIXED
  const getFilteredStudents = () => {
    if (!studentSearchFilter.trim()) return [];

    const searchLower = studentSearchFilter.toLowerCase();
    return allStudentStatistics.filter(student =>
      student.name.toLowerCase().includes(searchLower)
    );
  };

  // Check if a student is currently selected - NEW
  const isStudentSelected = () => {
    return localSelectedStudent && studentSearchFilter.includes('(');
  };

  const getAttendanceBadge = (entry: CourseAttendanceEntry, studentName: string, dateIndex: number, onExcuseClick?: () => void) => {
    const { code, excuseInfo } = entry;
    const hasExcuse = !!excuseInfo;
    const isClickable = (code === 'E') || (code === 'S' && hasExcuse);

    const baseClasses = isClickable
      ? "cursor-pointer underline hover:bg-opacity-80 transition-colors"
      : "";

    const badges = {
      'A': <Badge className={`bg-green-100 text-green-800 ${baseClasses}`}>A</Badge>,
      'S': <Badge
        className={`bg-yellow-100 text-yellow-800 ${baseClasses}`}
        onClick={isClickable ? onExcuseClick : undefined}
      >
        S
      </Badge>,
      'E': <Badge
        className={`bg-blue-100 text-blue-800 ${baseClasses}`}
        onClick={onExcuseClick}
      >
        E
      </Badge>,
      'U': <Badge className={`bg-red-100 text-red-800 ${baseClasses}`}>U</Badge>,
    };

    return badges[code] || code;
  };

  const formatExcuseHistory = (excuseInfo: ExcuseInfo) => {
    if (excuseInfo.editHistory.length === 0) {
      return `(${excuseInfo.createdBy}: ${excuseInfo.createdAt})`;
    }

    const lastEdit = excuseInfo.editHistory[excuseInfo.editHistory.length - 1];
    return `(${excuseInfo.createdBy}: ${excuseInfo.createdAt}; zuletzt: ${lastEdit.editorId} ${lastEdit.timestamp})`;
  };

  const renderDetailsSection = () => {
    if (!showDetails) return null;

    const student = getStudentById(showDetails.studentId);
    if (!student) return null;

    let title = '';
    let data: AbsenceDetail[] = [];
    let icon = null;
    let itemType: 'absence' | 'lateness' = 'absence';

    switch (showDetails.type) {
      case 'fehltage':
        title = 'Alle Fehltage';
        data = student.absenceDetails.filter(d => d.absenceType === 'fehltag');
        icon = <Calendar className="h-4 w-4" />;
        itemType = 'absence';
        break;
      case 'fehlstunden':
        title = 'Alle Fehlstunden';
        data = student.absenceDetails.filter(d => d.absenceType === 'fehlstunde');
        icon = <AlertTriangle className="h-4 w-4" />;
        itemType = 'absence';
        break;
      case 'excused_fehltage':
        title = 'Entschuldigte Fehltage';
        data = student.absenceDetails.filter(d => d.absenceType === 'fehltag' && d.type === 'excused');
        icon = <CheckCircle className="h-4 w-4 text-blue-600" />;
        itemType = 'absence';
        break;
      case 'unexcused_fehltage':
        title = 'Unentschuldigte Fehltage';
        data = student.absenceDetails.filter(d => d.absenceType === 'fehltag' && d.type === 'unexcused');
        icon = <Calendar className="h-4 w-4 text-red-600" />;
        itemType = 'absence';
        break;
      case 'excused_fehlstunden':
        title = 'Entschuldigte Fehlstunden';
        data = student.absenceDetails.filter(d => d.absenceType === 'fehlstunde' && d.type === 'excused');
        icon = <CheckCircle className="h-4 w-4 text-blue-600" />;
        itemType = 'absence';
        break;
      case 'unexcused_fehlstunden':
        title = 'Unentschuldigte Fehlstunden';
        data = student.absenceDetails.filter(d => d.absenceType === 'fehlstunde' && d.type === 'unexcused');
        icon = <AlertTriangle className="h-4 w-4 text-red-600" />;
        itemType = 'absence';
        break;
      case 'excused_lateness':
        title = 'Entschuldigte Verspätungen';
        data = student.latenessDetails.filter(d => d.type === 'excused') as any;
        icon = <Clock className="h-4 w-4 text-blue-600" />;
        itemType = 'lateness';
        break;
      case 'unexcused_lateness':
        title = 'Unentschuldigte Verspätungen';
        data = student.latenessDetails.filter(d => d.type === 'unexcused') as any;
        icon = <Clock className="h-4 w-4 text-red-600" />;
        itemType = 'lateness';
        break;
    }

    return (
      <Card className="mt-6">
        <CardHeader className="pb-4">
          <CardTitle className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'justify-between'}`}>
            <div className="flex items-center space-x-2">
              {icon}
              <span className={isMobile ? 'text-center text-sm' : ''}>{title} - {student.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseDetails}
              className={`flex items-center ${isMobile ? 'self-end' : 'space-x-1'}`}
            >
              <X className="h-3 w-3" />
              {!isMobile && <span>Schließen</span>}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Keine Einträge vorhanden</p>
          ) : (
            <div className="space-y-3">
              {data.map((entry, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-md">
                  <div className={`flex items-start ${isMobile ? 'flex-col space-y-2' : 'justify-between'}`}>
                    <div className="flex items-center space-x-3 flex-wrap">
                      <div className="text-sm font-medium">{entry.date}</div>
                      <Badge variant="outline">{entry.subject}</Badge>

                      {/* Only show minutes for fehlstunden (individual lessons), not for fehltage (whole days) */}
                      {'absenceType' in entry && entry.absenceType === 'fehlstunde' && (
                        <div className="text-sm text-muted-foreground">{entry.minutes} min</div>
                      )}

                      {entry.type === 'excused' && (
                        <Badge className="bg-blue-100 text-blue-800">E</Badge>
                      )}
                      {entry.type === 'unexcused' && (
                        <Badge className="bg-red-100 text-red-800">U</Badge>
                      )}
                    </div>

                    <div className={`flex items-center space-x-2 ${isMobile ? 'w-full' : ''}`}>
                      {entry.type === 'excused' && entry.excuseInfo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExcuse(entry, itemType, student.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                      {entry.type === 'unexcused' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleAddExcuse(entry, itemType, student.id)}
                          className={`text-xs ${isMobile ? 'flex-1' : ''}`}
                        >
                          unentschuldigt
                        </Button>
                      )}
                    </div>
                  </div>

                  {entry.type === 'excused' && entry.excuseInfo && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm">{entry.excuseInfo.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatExcuseHistory(entry.excuseInfo)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {entry.reason && entry.type === 'unexcused' && (
                    <div className="mt-2 text-sm text-muted-foreground italic">
                      {entry.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSubjectBreakdown = (studentId: string) => {
    const subjectBreakdown = getSubjectBreakdown(studentId);
    const hasFehlstunden = Object.keys(subjectBreakdown).length > 0;

    if (!hasFehlstunden) return null;

    return (
      <Card className="mt-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Fehlstunden nach Fächern</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Anzahl versäumter Einzelstunden pro Fach (ohne ganze Fehltage)
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(subjectBreakdown).map(([subject, count]) => (
              <div key={subject} className="text-center p-3 bg-muted/30 rounded-md">
                <p className="text-2xl font-bold text-red-600">{count}</p>
                <p className="text-sm text-muted-foreground">{subject}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderClassView = () => {
    // If it's teacher's schedule, show a message about class view
    if (selectedClass.type === 'teacher') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Klassenübersicht - Fehlzeiten</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Klassenansicht ist für "Mein Stundenplan" nicht verfügbar.
                <br />
                Bitte wählen Sie eine spezifische Klasse aus dem Dropdown-Menü.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Time period display */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Statistikzeitraum:</strong> {SEMESTER_START_DATE} bis {getCurrentDate()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Klassenübersicht - Fehlzeiten</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={`${isMobile ? 'sticky left-0 bg-background min-w-20' : ''}`}>
                      {isMobile ? 'SuS' : 'Schüler*innen'}
                    </TableHead>
                    {!isMobile && <TableHead>Anwesenheitsrate</TableHead>}
                    <TableHead>{isMobile ? 'Tage' : 'Fehltage'}</TableHead>
                    <TableHead>{isMobile ? 'Tage (E)' : 'Fehltage (E)'}</TableHead>
                    <TableHead>{isMobile ? 'Tage (U)' : 'Fehltage (U)'}</TableHead>
                    <TableHead>{isMobile ? 'Stunden' : 'Fehlstunden'}</TableHead>
                    <TableHead>{isMobile ? 'Stunden (E)' : 'Fehlstunden (E)'}</TableHead>
                    <TableHead>{isMobile ? 'Stunden (U)' : 'Fehlstunden (U)'}</TableHead>
                    <TableHead>{isMobile ? 'Spät (E)' : 'Verspätung (E)'}</TableHead>
                    <TableHead>{isMobile ? 'Spät (U)' : 'Verspätung (U)'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudentStatistics.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell
                        className={`font-medium cursor-pointer hover:text-primary hover:underline ${isMobile ? 'sticky left-0 bg-background' : ''}`}
                        onClick={() => handleStudentClick(student.id)}
                      >
                        {formatStudentName(student.name)}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={student.attendanceRate} className="w-16" />
                            <span className="text-sm">{student.attendanceRate}%</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{student.totalFehltage}</TableCell>
                      <TableCell className="text-blue-600">{student.excusedFehltage}</TableCell>
                      <TableCell className="text-red-600">{student.unexcusedFehltage}</TableCell>
                      <TableCell>{student.totalFehlstunden}</TableCell>
                      <TableCell className="text-blue-600">{student.excusedFehlstunden}</TableCell>
                      <TableCell className="text-red-600">{student.unexcusedFehlstunden}</TableCell>
                      <TableCell className="text-blue-600">{student.excusedLatenessMinutes} min</TableCell>
                      <TableCell className="text-red-600">{student.unexcusedLatenessMinutes} min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStudentView = () => {
    const filteredStudents = getFilteredStudents();

    return (
      <div className="space-y-4">
        {/* Improved student search card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Schüler*innen suchen</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Search input with immediate results and clear button */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name eingeben..."
                value={studentSearchFilter}
                onChange={handleSearchChange}
                className={`pl-10 ${isStudentSelected() ? 'pr-10' : ''}`}
                onFocus={() => setShowSearchResults(studentSearchFilter.trim().length > 0)}
              />

              {/* Clear button - only show when student is selected */}
              {isStudentSelected() && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Auswahl löschen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Immediate search results */}
              {showSearchResults && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleStudentSelectFromSearch(student.id)}
                      >
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Klasse {getClassNameById(student.classId)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-muted-foreground text-center">
                      Keine Schüler*innen gefunden
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clear search results when clicking outside */}
            {showSearchResults && (
              <div
                className="fixed inset-0 z-5"
                onClick={() => setShowSearchResults(false)}
              />
            )}
          </CardContent>
        </Card>

        {localSelectedStudent && (
          <>
            {/* Time period display */}
            <Card>
              <CardContent className="p-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    <strong>Statistikzeitraum:</strong> {SEMESTER_START_DATE} bis {getCurrentDate()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Individual statistics card - REDUCED PADDING */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Individuelle Anwesenheitsstatistik</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {(() => {
                  const student = allStudentStatistics.find(s => s.id === localSelectedStudent);
                  if (!student) return null;

                  // Create array of statistics to display
                  const stats = [
                    { value: student.attendanceRate, label: 'Anwesenheitsrate', unit: '%', color: 'text-green-600', type: null, show: true },
                    { value: student.totalFehltage, label: 'Fehltage', unit: '', color: 'hover:text-primary', type: 'fehltage', show: true }, // Always show
                    { value: student.excusedFehltage, label: 'Fehltage (E)', unit: '', color: 'text-blue-600 hover:text-blue-800', type: 'excused_fehltage', show: student.excusedFehltage > 0 },
                    { value: student.unexcusedFehltage, label: 'Fehltage (U)', unit: '', color: 'text-red-600 hover:text-red-800', type: 'unexcused_fehltage', show: student.unexcusedFehltage > 0 },
                    { value: student.totalFehlstunden, label: 'Fehlstunden', unit: '', color: 'hover:text-primary', type: 'fehlstunden', show: student.totalFehlstunden > 0 },
                    { value: student.excusedFehlstunden, label: 'Fehlstunden (E)', unit: '', color: 'text-blue-600 hover:text-blue-800', type: 'excused_fehlstunden', show: student.excusedFehlstunden > 0 },
                    { value: student.unexcusedFehlstunden, label: 'Fehlstunden (U)', unit: '', color: 'text-red-600 hover:text-red-800', type: 'unexcused_fehlstunden', show: student.unexcusedFehlstunden > 0 },
                    { value: student.excusedLatenessMinutes, label: 'Verspätung (E) min', unit: '', color: 'text-blue-600 hover:text-blue-800', type: 'excused_lateness', show: student.excusedLatenessMinutes > 0 },
                    { value: student.unexcusedLatenessMinutes, label: 'Verspätung (U) min', unit: '', color: 'text-red-600 hover:text-red-800', type: 'unexcused_lateness', show: student.unexcusedLatenessMinutes > 0 }
                  ];

                  const visibleStats = stats.filter(stat => stat.show);

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {visibleStats.map((stat, index) => (
                          <div
                            key={index}
                            className={`text-center ${stat.type ? 'cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors' : 'p-2'}`}
                            onClick={stat.type ? () => handleStatisticClick(stat.type as DetailType, student.id) : undefined}
                          >
                            <p className={`text-2xl font-bold ${stat.color}`}>
                              {stat.value}{stat.unit}
                            </p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="text-sm text-muted-foreground text-center">
                        <p>Klicken Sie auf die Zahlen, um detaillierte Listen zu sehen</p>
                        <p className="text-xs mt-1">
                          <strong>Fehltage:</strong> Ganze Schultage versäumt |
                          <strong> Fehlstunden:</strong> Einzelne Unterrichtsstunden versäumt
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Details section (when numbers are clicked) */}
            {renderDetailsSection()}

            {/* Subject breakdown for individual lessons (moved to bottom) */}
            {renderSubjectBreakdown(localSelectedStudent)}
          </>
        )}

        {/* Modals */}
        {editingExcuse && (
          <ExcuseEditModal
            isOpen={true}
            onClose={() => setEditingExcuse(null)}
            excuseInfo={editingExcuse.item.excuseInfo!}
            onSave={handleSaveExcuse}
            onDelete={handleDeleteExcuse}
            itemType={editingExcuse.type}
            studentName={allStudentStatistics.find(s => s.id === editingExcuse.studentId)?.name || ''}
            date={editingExcuse.item.date}
            subject={editingExcuse.item.subject}
          />
        )}

        {addingExcuse && (
          <AddExcuseModal
            isOpen={true}
            onClose={() => setAddingExcuse(null)}
            onSave={handleSaveNewExcuse}
            itemType={addingExcuse.type}
            studentName={allStudentStatistics.find(s => s.id === addingExcuse.studentId)?.name || ''}
            date={addingExcuse.item.date}
            subject={addingExcuse.item.subject}
          />
        )}
      </div>
    );
  };

  const renderCourseView = () => (
    <div className="space-y-4">
      {/* Time period display */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Statistikzeitraum:</strong> {SEMESTER_START_DATE} bis {getCurrentDate()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>
              {selectedClass.type === 'course' ? 'Kursübersicht' : selectedClass.type === 'teacher' ? 'Mein Stundenplan' : 'Kursübersicht'} - Anwesenheitstabelle
            </span>
          </CardTitle>
          <div className={`flex items-center ${isMobile ? 'flex-col space-y-2 items-start' : 'justify-between'}`}>
            {isMobile ? (
              // Mobile: 2x2 grid layout
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm w-full">
                <div className="flex items-center space-x-1">
                  <Badge className="bg-green-100 text-green-800">A</Badge>
                  <span>Anwesend</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className="bg-yellow-100 text-yellow-800">S</Badge>
                  <span>Verspätet</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className="bg-blue-100 text-blue-800">E</Badge>
                  <span>Entschuldigt</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className="bg-red-100 text-red-800">U</Badge>
                  <span>Unentschuldigt</span>
                </div>
              </div>
            ) : (
              // Desktop: horizontal layout with clickable hints
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Badge className="bg-green-100 text-green-800">A</Badge>
                  <span>Anwesend</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className="bg-yellow-100 text-yellow-800 underline">S</Badge>
                  <span>Verspätet (klickbar bei Entschuldigung)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className="bg-blue-100 text-blue-800 underline">E</Badge>
                  <span>Entschuldigt (klickbar)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className="bg-red-100 text-red-800">U</Badge>
                  <span>Unentschuldigt</span>
                </div>
              </div>
            )}

            {(selectedClass.type === 'course' || selectedClass.type === 'teacher') && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{classCourseData.dates?.length || 0} {selectedClass.type === 'course' ? 'Wochen' : 'Tage'}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={`${isMobile ? 'sticky left-0 bg-background min-w-20' : 'sticky left-0 bg-background min-w-48'}`}>
                    {isMobile ? 'SuS' : (selectedClass.type === 'teacher' ? 'Klasse/Schüler*innen' : 'Schüler*innen')}
                  </TableHead>
                  {classCourseData.dates?.map((date: string) => (
                    <TableHead key={date} className="text-center min-w-16">{date}</TableHead>
                  ))}
                  {/* Mobile: Remove sticky positioning from totals */}
                  <TableHead className={`text-center ${isMobile ? 'min-w-12' : 'sticky right-16 bg-background min-w-12'}`}>A</TableHead>
                  <TableHead className={`text-center ${isMobile ? 'min-w-12' : 'sticky right-12 bg-background min-w-12'}`}>S</TableHead>
                  <TableHead className={`text-center ${isMobile ? 'min-w-12' : 'sticky right-8 bg-background min-w-12'}`}>E</TableHead>
                  <TableHead className={`text-center ${isMobile ? 'min-w-12' : 'sticky right-0 bg-background min-w-12'}`}>U</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classCourseData.studentAttendance?.map((student: any, studentIndex: number) => (
                  <React.Fragment key={studentIndex}>
                    <TableRow>
                      <TableCell
                        className={`font-medium cursor-pointer hover:text-primary hover:underline ${isMobile ? 'sticky left-0 bg-background' : 'sticky left-0 bg-background'}`}
                        onClick={() => handleCourseStudentClick(student.name)}
                      >
                        {formatStudentName(student.name)}
                      </TableCell>
                      {student.attendance.map((entry: CourseAttendanceEntry, dateIndex: number) => (
                        <TableCell key={dateIndex} className="text-center">
                          {getAttendanceBadge(
                            entry,
                            student.name,
                            dateIndex,
                            () => toggleExcuseExpansion(student.name, dateIndex)
                          )}
                        </TableCell>
                      ))}
                      {/* Mobile: Remove sticky positioning from totals */}
                      <TableCell className={`text-center font-semibold ${isMobile ? '' : 'sticky right-16 bg-background'}`}>{student.totals.present}</TableCell>
                      <TableCell className={`text-center font-semibold ${isMobile ? '' : 'sticky right-12 bg-background'}`}>{student.totals.late}</TableCell>
                      <TableCell className={`text-center font-semibold ${isMobile ? '' : 'sticky right-8 bg-background'}`}>{student.totals.excused}</TableCell>
                      <TableCell className={`text-center font-semibold ${isMobile ? '' : 'sticky right-0 bg-background'}`}>{student.totals.unexcused}</TableCell>
                    </TableRow>

                    {/* Render expanded excuse details with close button on right */}
                    {student.attendance.map((entry: CourseAttendanceEntry, dateIndex: number) => {
                      const key = `${student.name}-${dateIndex}`;
                      const isExpanded = expandedExcuses.has(key);
                      const shouldShow = isExpanded && entry.excuseInfo && (entry.code === 'E' || entry.code === 'S');

                      if (!shouldShow) return null;

                      return (
                        <TableRow key={`${studentIndex}-excuse-${dateIndex}`} className="bg-muted/20">
                          <TableCell className={`text-sm text-muted-foreground ${isMobile ? 'sticky left-0 bg-muted/20' : 'sticky left-0 bg-muted/20'}`}>
                            <div className="flex items-center space-x-2">
                              <ChevronDown className="h-3 w-3" />
                              <span>Entschuldigung</span>
                            </div>
                          </TableCell>
                          <TableCell
                            colSpan={classCourseData.dates.length + 3}
                            className="text-sm bg-muted/20"
                          >
                            <div className="flex items-start space-x-2 max-w-2xl">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p>{entry.excuseInfo!.text}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatExcuseHistory(entry.excuseInfo!)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className={`text-center ${isMobile ? 'bg-muted/20' : 'sticky right-0 bg-muted/20'}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => closeExcuseExpansion(student.name, dateIndex)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {(selectedClass.type === 'course' && classCourseData.dates?.length > 10) && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              <p>Horizontal scrollen für weitere Termine →</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Statistiken</h2>
          {/* Show selected student info for student view */}
          {viewType === 'student' && localSelectedStudent ? (
            (() => {
              const student = allStudentStatistics.find(s => s.id === localSelectedStudent);
              return student ? (
                <p className="text-muted-foreground">{student.name} ({getClassNameById(student.classId)})</p>
              ) : (
                <p className="text-muted-foreground">Schüler*in auswählen</p>
              );
            })()
          ) : (
            <p className="text-muted-foreground">{selectedClass.name}</p>
          )}
        </div>

        {/* Always show all three buttons */}
        <div className="flex space-x-2">
          <Button
            variant={viewType === 'class' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewTypeChange('class')}
          >
            Klasse
          </Button>
          <Button
            variant={viewType === 'student' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewTypeChange('student')}
          >
            Schüler*innen
          </Button>
          <Button
            variant={viewType === 'course' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewTypeChange('course')}
          >
            Kurse
          </Button>
        </div>
      </div>

      {viewType === 'class' && renderClassView()}
      {viewType === 'student' && renderStudentView()}
      {viewType === 'course' && renderCourseView()}

      {/* Floating scroll indicator for class view on mobile */}
      {isMobile && viewType === 'class' && selectedClass.type !== 'teacher' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-xs font-medium">
            ← Horizontal scrollen für alle Spalten →
          </div>
        </div>
      )}

      {/* Modals */}
      {editingExcuse && (
        <ExcuseEditModal
          isOpen={true}
          onClose={() => setEditingExcuse(null)}
          excuseInfo={editingExcuse.item.excuseInfo!}
          onSave={handleSaveExcuse}
          onDelete={handleDeleteExcuse}
          itemType={editingExcuse.type}
          studentName={allStudentStatistics.find(s => s.id === editingExcuse.studentId)?.name || ''}
          date={editingExcuse.item.date}
          subject={editingExcuse.item.subject}
        />
      )}

      {addingExcuse && (
        <AddExcuseModal
          isOpen={true}
          onClose={() => setAddingExcuse(null)}
          onSave={handleSaveNewExcuse}
          itemType={addingExcuse.type}
          studentName={allStudentStatistics.find(s => s.id === addingExcuse.studentId)?.name || ''}
          date={addingExcuse.item.date}
          subject={addingExcuse.item.subject}
        />
      )}
    </div>
  );
}
