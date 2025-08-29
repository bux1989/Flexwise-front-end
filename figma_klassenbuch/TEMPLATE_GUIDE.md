# Template Guide: Klassenbuch (Class Book)

## Overview
This Figma template implements a comprehensive digital class book system for tracking student attendance, managing excuses, and generating statistics. It focuses on teacher workflow optimization and detailed attendance tracking.

## Special Features

### 1. Dual View System
- **Live View**: Real-time attendance tracking with quick status updates
- **Statistics View**: Comprehensive student absence analytics with detailed breakdowns

### 2. Advanced Attendance Management
- **Multi-status Tracking**: Present, Late, Excused, Unexcused
- **Excuse System**: Full excuse lifecycle management with edit history
- **Time Tracking**: Precise lateness recording with minute accuracy
- **Bulk Operations**: Mark all students with single action

### 3. Statistical Analytics
- **Fehltage vs Fehlstunden**: Distinction between whole-day and individual lesson absences
- **Excuse Categorization**: Detailed excuse information with creator tracking
- **Historical Data**: Absence details with dates and reasons
- **Performance Metrics**: Attendance rates and trending data

### 4. Teacher Schedule Integration
- **Personal Schedule**: Teacher's own 25-lesson weekly schedule
- **Course Management**: Support for cross-class courses (Bowling AG, Tischtennis AG)
- **Class Filtering**: Easy switching between different class responsibilities

## Component Breakdown

### Core Components
- **`Header.tsx`**: Navigation and class selection with view switching
- **`LiveView.tsx`**: Main attendance interface with student list
- **`StatisticsView.tsx`**: Analytics dashboard with charts and filters
- **`AttendanceModal.tsx`**: Detailed attendance entry form
- **`AddExcuseModal.tsx`**: Excuse creation and management
- **`ExcuseEditModal.tsx`**: Excuse modification with history tracking

### Data Structure Components
- **Mock Data Schema**: Complex student statistics with fehltage/fehlstunden separation
- **Attendance Records**: Detailed tracking with metadata and timestamps
- **Course Integration**: Support for cross-class activities

## Data Structures

### Student Statistics
```typescript
interface StudentStatistics {
  totalFehltage: number;      // Whole day absences
  excusedFehltage: number;
  unexcusedFehltage: number;
  totalFehlstunden: number;   // Individual lesson absences
  excusedFehlstunden: number;
  unexcusedFehlstunden: number;
  totalMinutes: number;       // Lateness tracking
  attendanceRate: number;
  absenceDetails: AbsenceDetail[];
  latenessDetails: LatenessDetail[];
}
```

### Excuse Information
```typescript
interface ExcuseInfo {
  text: string;
  createdBy: string;          // 'secretary' | 'Eltern' | teacher abbreviation
  createdAt: string;
  editHistory: ExcuseEditHistory[];
}
```

### Course Attendance
```typescript
interface CourseAttendanceEntry {
  code: 'A' | 'S' | 'E' | 'U';  // Present, Late, Excused, Unexcused
  excuseInfo?: ExcuseInfo;       // For excused absences/lateness
}
```

## Differences from Design System

### Custom UI Patterns
1. **Attendance Grid**: Custom grid layout for student status display
2. **Time Input**: Specialized time picker with arrow controls (imported component)
3. **Statistics Cards**: Custom card layouts for metrics display
4. **Excuse Management**: Multi-step forms with history tracking

### Color Coding
- **Subject Colors**: Specialized color system for different subjects
- **Status Indicators**: Custom color scheme for attendance states
- **Priority Highlighting**: Visual hierarchy for urgent items

### Mobile Adaptations
- **Compact Student Lists**: Abbreviated names and condensed layouts
- **Responsive Statistics**: Adaptive chart displays
- **Touch-Optimized Controls**: Enhanced mobile interaction patterns

## Integration Points

### Design System Dependencies
- **UI Components**: Uses standard button, card, modal, and form components
- **Typography**: Follows design system font scales
- **Spacing**: Adheres to design system spacing tokens

### External Data Sources
- **Student Database**: Requires integration with student management system
- **Teacher Schedules**: Connects to timetabling system
- **Excuse Management**: Interfaces with school administration systems

## Known Issues & Considerations

### Performance Considerations
- **Large Class Sizes**: Statistics calculations can be intensive for classes >30 students
- **Historical Data**: Long-term absence data may require pagination
- **Real-time Updates**: Consider implementing WebSocket connections for live updates

### Data Migration Challenges
- **Complex Statistics**: Multi-dimensional absence tracking requires careful data mapping
- **Excuse History**: Edit history and metadata must be preserved
- **Cross-Class Courses**: Course student associations need special handling

### UX Considerations
- **Mobile Statistics**: Complex charts may need simplified mobile versions
- **Bulk Operations**: Need clear confirmation for mass attendance changes
- **Excuse Workflow**: Multi-step process may confuse new users

## Migration Priority
**HIGH** - Core school functionality with complex data relationships requiring careful migration planning.

## Related Templates
- Links to `figma_teacher_dashboard` for task management
- Integrates with `figma_admin_page` for system-wide statistics
- Connects to `figma_parent_page` for absence notifications

---
*Last Updated: AI Analysis - [Current Date]*
*This document should be updated when template features change or new components are added.*
