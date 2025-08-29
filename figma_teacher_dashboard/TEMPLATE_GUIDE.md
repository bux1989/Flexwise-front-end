# Template Guide: Teacher Dashboard

## Overview
This Figma template implements a comprehensive teacher productivity dashboard focusing on task management, lesson planning, and information aggregation. It serves as a central hub for daily teacher activities.

## Special Features

### 1. Integrated Task Management System
- **Priority-Based Filtering**: High, Medium, Low priority with visual indicators
- **Due Date Management**: Smart filtering by overdue, today, tomorrow, this week
- **Hot List Functionality**: Star system for urgent items requiring immediate attention
- **Collaborative Assignment**: Multi-user task assignment with group support

### 2. Lesson Schedule Integration
- **Real-Time Status**: Live lesson tracking with current/past/future states
- **Attendance Integration**: Quick access to attendance tracking from schedule
- **Room Change Notifications**: Visual indicators for schedule changes
- **Substitute Teaching**: Special handling for replacement lessons

### 3. Advanced Comment System
- **Threaded Comments**: Full conversation history on tasks
- **Completion Comments**: Required comments when marking tasks complete
- **Timestamped History**: Full audit trail with user attribution
- **Expandable Interface**: Progressive disclosure of comment threads

### 4. Mobile-First Design
- **Adaptive Layouts**: Responsive design with mobile-specific UI patterns
- **Abbreviated Displays**: Smart text truncation and abbreviation systems
- **Touch Optimization**: Enhanced mobile interaction patterns
- **Progressive Enhancement**: Desktop features gracefully degrade on mobile

## Component Breakdown

### Core Dashboard Components
- **`Header.tsx`**: Main navigation with user profile and quick actions
- **`AddTaskDialog.tsx`**: Comprehensive task creation form with assignment capabilities
- **`TimeInputWithArrows.tsx`**: Specialized time picker for lesson planning

### Task Management
- **Task Cards**: Rich task display with metadata, comments, and actions
- **Filter System**: Advanced filtering with search, priority, and date controls
- **Comment Interface**: Expandable comment system with threading
- **Assignment Logic**: Group-based assignment with individual and team options

### Schedule Management
- **Lesson Display**: Comprehensive lesson information with status indicators
- **Attendance Integration**: One-click access to attendance management
- **Schedule Notifications**: Admin comments and room change alerts
- **Mobile Schedule**: Compact schedule view with expandable details

## Data Structures

### Task Management
```typescript
interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  hotList: boolean;
  assignedTo: string[];        // Multi-user assignment
  assignedBy: string;
  assignedAt: string;
  completedAt?: string;
  completedBy?: string;
  comments: Comment[];
}
```

### Lesson Structure
```typescript
interface Lesson {
  id: number;
  time: string;
  endTime: string;
  subject: string;
  class: string;
  room: string;
  isCurrent: boolean;
  isSubstitute: boolean;
  isCancelled: boolean;
  teacherRole: 'main' | 'support';
  attendance?: AttendanceData;
  lessonNote?: string;
}
```

### Comment System
```typescript
interface Comment {
  id: number;
  text: string;
  timestamp: string;
  author: string;
}
```

## Differences from Design System

### Custom UI Patterns
1. **Task Priority Visualization**: Custom color coding and badge system
2. **Date Picker Integration**: Enhanced calendar component with quick actions
3. **Expandable Cards**: Progressive disclosure pattern for complex information
4. **Mobile Abbreviations**: Custom text shortening algorithms

### Specialized Components
- **Time Input with Arrows**: Unique time picker not in standard design system
- **Hot List Toggle**: Star-based priority system with custom interactions
- **Assignment Groups**: Multi-select interface for team assignments
- **Comment Threading**: Nested comment display system

### Mobile Adaptations
- **Responsive Typography**: Dynamic text sizing based on viewport
- **Touch Targets**: Enlarged interaction areas for mobile use
- **Swipe Gestures**: Gesture-based navigation for mobile efficiency
- **Compact Information**: Intelligent information hierarchy for small screens

## Integration Points

### External Systems
- **User Authentication**: Integrates with Supabase user profiles
- **Real-Time Updates**: Uses Supabase real-time subscriptions
- **File Storage**: Connects to shared assets and documents
- **Notification System**: Integrates with school-wide alerts

### Cross-Template Dependencies
- **Klassenbuch Integration**: Direct links to attendance management
- **Admin Dashboard**: Shares task assignment with administrative functions
- **Parent Portal**: Task notifications may be shared with parents

## Mock Data Specifications

### Task Data
- **INITIAL_TASKS**: Comprehensive task examples with various priorities and states
- **ASSIGNEE_GROUPS**: Predefined groups for common task assignments
- **CURRENT_TEACHER**: User profile integration with fallback data

### Schedule Data
- **INITIAL_LESSONS**: Full lesson schedule with all status variations
- **INITIAL_EVENTS**: School events and important dates
- **Time Management**: Precise time calculation utilities

## Known Issues & Considerations

### Performance Considerations
- **Large Task Lists**: Filtering and sorting can be intensive with >100 tasks
- **Real-Time Updates**: Consider debouncing for frequent updates
- **Mobile Performance**: Complex layouts may impact mobile performance

### UX Considerations
- **Task Overload**: Risk of overwhelming users with too many features
- **Mobile Limitations**: Complex task creation may be difficult on mobile
- **Assignment Confusion**: Multi-user assignments need clear ownership

### Data Synchronization
- **Offline Support**: Tasks created offline need conflict resolution
- **Cross-Device Sync**: Changes on one device must reflect everywhere
- **Version Control**: Task edits need proper version management

### Security Considerations
- **Task Privacy**: Sensitive tasks need appropriate access controls
- **User Authentication**: Robust user verification for task assignment
- **Data Validation**: Input sanitization for all user-generated content

## Migration Priority
**HIGH** - Central teacher workflow tool requiring careful feature preservation and data migration.

## Related Templates
- Primary integration with `figma_klassenbuch` for attendance workflows
- Shares administrative functions with `figma_admin_page`
- Provides parent communication features linking to `figma_parent_page`

---
*Last Updated: AI Analysis - [Current Date]*
*This document should be updated when template features change or new components are added.*
