# Klassenbuch Module Structure Breakdown

## Current State Analysis
The klassenbuch functionality is currently scattered across multiple locations:
- `Klassen buch/` - Standalone app with own package.json
- `packages/react-app/src/components/klassenbuch/` - React components  
- `packages/shared/domains/academic/klassenbuch/` - Shared business logic

## New Proposed Structure: `packages-new/`

### 1. Shared Business Logic
```
packages-new/shared/domains/academic/klassenbuch/
├── api/
│   ├── klassenbuchApi.ts           # Supabase API calls
│   ├── attendanceApi.ts            # Attendance-related API
│   └── excuseApi.ts               # Excuse management API
├── hooks/
│   ├── useKlassenbuchState.ts     # Main state management hook
│   ├── useAttendance.ts           # Attendance logic
│   ├── useExcuses.ts              # Excuse management
│   └── useStatistics.ts           # Statistics calculations
├── types/
│   ├── klassenbuch.ts             # Core types
│   ├── attendance.ts              # Attendance types
│   ├── excuse.ts                  # Excuse types
│   └── statistics.ts              # Statistics types
├── utils/
│   ├── dateHelpers.ts             # Date calculations
│   ├── attendanceHelpers.ts       # Attendance calculations
│   ├── statisticsHelpers.ts       # Statistics calculations
│   └── validation.ts              # Form validation
└── data/
    ├── mockData.ts                # Mock data for development
    └── constants.ts               # Constants and enums
```

### 2. Web Application Components
```
packages-new/web-app/dashboards/teacher/klassenbuch/
├── components/
│   ├── core/
│   │   ├── KlassenbuchApp.tsx     # Main container component
│   │   ├── Header.tsx             # Navigation header
│   │   └── ClassSelector.tsx      # Class selection component
│   ├── views/
│   │   ├── LiveView/
│   │   │   ├── LiveView.tsx       # Live attendance view
│   │   │   ├── AttendanceGrid.tsx # Grid layout for attendance
│   │   │   ├── StudentRow.tsx     # Individual student row
│   │   │   └── TimeSlotColumn.tsx # Time slot columns
│   │   ├── StatisticsView/
│   │   │   ├── StatisticsView.tsx # Statistics overview
│   │   │   ├── AttendanceChart.tsx# Chart components
│   │   │   ├── AbsenceReport.tsx  # Absence reporting
│   │   │   └── WeeklyOverview.tsx # Weekly statistics
│   │   └── HistoryView/
│   │       ├── HistoryView.tsx    # Historical data view
│   │       └── DateRangePicker.tsx# Date selection
│   ├── modals/
│   │   ├── AddExcuseModal.tsx     # Add excuse dialog
│   │   ├── ExcuseEditModal.tsx    # Edit excuse dialog
│   │   ├── AttendanceModal.tsx    # Attendance details modal
│   │   └── BulkActionModal.tsx    # Bulk operations modal
│   ├── forms/
│   │   ├── ExcuseForm.tsx         # Excuse entry form
│   │   ├── AttendanceForm.tsx     # Manual attendance form
│   │   └── NotesForm.tsx          # Notes and comments form
│   └── ui/
│       ├── AttendanceStatus.tsx   # Status indicators
│       ├── StudentCard.tsx        # Student information card
│       ├── WeekNavigation.tsx     # Week navigation controls
│       └── ExportButton.tsx       # Data export functionality
├── hooks/
│   ├── useKlassenbuchUI.ts        # UI-specific state
│   ├── useModalState.ts           # Modal management
│   └── useViewTransitions.ts      # View switching logic
├── styles/
│   ├── klassenbuch.css           # Module-specific styles
│   └── attendance-grid.css       # Grid layout styles
└── index.tsx                     # Entry point
```

### 3. Mobile Application Components
```
packages-new/mobile-app/screens/modules/klassenbuch/
├── KlassenbuchScreen.tsx          # Main screen
├── AttendanceScreen.tsx           # Mobile attendance view
├── StatisticsScreen.tsx           # Mobile statistics
├── ExcuseManagementScreen.tsx     # Mobile excuse management
└── components/
    ├── MobileAttendanceGrid.tsx   # Touch-optimized grid
    ├── SwipeableStudentCard.tsx   # Swipeable student cards
    └── MobileHeader.tsx           # Mobile navigation header
```

### 4. Feature Breakdown by Functionality

#### **Core Features:**
1. **Live Attendance View**
   - Real-time attendance marking
   - Grid layout (students x time slots)
   - Quick status changes (present, absent, late, excused)
   - Bulk operations

2. **Statistics & Reporting**
   - Weekly/monthly attendance overview
   - Individual student statistics
   - Class-wide analytics
   - Export functionality (PDF, Excel)

3. **Excuse Management**
   - Add/edit/delete excuses
   - Excuse approval workflow
   - Attach documents/notes
   - Parent communication integration

4. **Historical Data**
   - Browse past attendance records
   - Filter by date ranges
   - Search functionality
   - Data archiving

#### **Integration Points:**
- **Stundenplan Module**: Sync with timetable data
- **Eltern-App Module**: Send notifications to parents
- **Berichte Module**: Generate attendance reports
- **User Management**: Role-based permissions

### 5. Migration Plan for Klassenbuch

#### **Phase 1: Shared Foundation**
1. Extract business logic from existing components
2. Create unified TypeScript types
3. Consolidate API calls into shared services
4. Set up shared hooks for state management

#### **Phase 2: Web Components**
1. Migrate React components to new structure
2. Update imports to use shared business logic
3. Implement responsive design patterns
4. Add proper error handling and loading states

#### **Phase 3: Mobile Optimization**
1. Create mobile-specific components
2. Implement touch-friendly interactions
3. Optimize for smaller screens
4. Add offline capability

#### **Phase 4: Integration & Testing**
1. Connect with other modules
2. End-to-end testing
3. Performance optimization
4. User acceptance testing

### 6. Dependencies & Technical Considerations

#### **Shared Dependencies:**
- React Query for data fetching
- Zustand for state management
- Date-fns for date calculations
- React Hook Form for form handling

#### **Web-Specific:**
- React Router for navigation
- Tailwind CSS for styling
- Framer Motion for animations

#### **Mobile-Specific:**
- React Navigation
- React Native Gesture Handler
- Async Storage for offline data

### 7. Data Flow Architecture

```
User Action → UI Component → Custom Hook → Shared Business Logic → API Call → Database
                ↑                            ↓
            UI Updates ← State Update ← Data Processing ← Response Data ← API Response
```

This structure ensures:
- **Separation of Concerns**: UI, business logic, and data access are clearly separated
- **Reusability**: Shared logic can be used across web and mobile
- **Maintainability**: Clear organization makes debugging and updates easier
- **Scalability**: Easy to add new features or modify existing ones
- **Testing**: Each layer can be tested independently
