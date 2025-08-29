# Debug Overlay Implementation Plan

## Components That Need Debug Overlays

### ✅ Already Have Debug Overlays:
- `packages/web-app/src/features/communications/components/ComprehensiveParentDashboard.tsx`
- `packages/web-app/src/features/communications/components/ChildrenOverview.tsx`
- `packages/web-app/src/features/communications/components/InfoBoard.tsx` (partially)

### 🚧 Need Debug Overlays Added:

#### Dashboard Components:
- `packages/web-app/src/app/dashboard/teacher.tsx` (partially done, needs fixing)

#### Communication Components:
- `packages/web-app/src/features/communications/components/AddChildModal.tsx`
- `packages/web-app/src/features/communications/components/ChildDetailView.tsx`  
- `packages/web-app/src/features/communications/components/Events.tsx`
- `packages/web-app/src/features/communications/components/ParentDashboard.tsx`
- `packages/web-app/src/features/communications/components/ParentProfileModal.tsx`
- `packages/web-app/src/features/communications/components/ParentStats.tsx`
- `packages/web-app/src/features/communications/components/PickupRequestModal.tsx`
- `packages/web-app/src/features/communications/components/SickReportModal.tsx`

#### Lesson Components:
- `packages/web-app/src/features/lessons/components/LessonSchedule.tsx`

#### Task Management Components:
- `packages/web-app/src/features/task-management/components/TaskManagement.tsx`
- `packages/web-app/src/features/task-management/components/AddTaskDialog.tsx`

#### User Management Components:
- `packages/web-app/src/features/user-management/components/AdminDashboard.tsx`
- `packages/web-app/src/features/user-management/components/AdminActions.tsx`
- `packages/web-app/src/features/user-management/components/SystemStats.tsx`

#### Reports Components:
- `packages/web-app/src/features/reports/components/ExternalDashboard.tsx`
- `packages/web-app/src/features/reports/components/AvailableReports.tsx`
- `packages/web-app/src/features/reports/components/ExternalAccessNotice.tsx`
- `packages/web-app/src/features/reports/components/ExternalStats.tsx`

#### Klassenbuch Components:
- `packages/web-app/src/features/klassenbuch/components/KlassenbuchApp.tsx`
- `packages/web-app/src/features/klassenbuch/components/KlassenbuchHeader.tsx`
- `packages/web-app/src/features/klassenbuch/components/KlassenbuchLiveView.tsx`
- `packages/web-app/src/features/klassenbuch/components/KlassenbuchStatisticsView.tsx`

#### Core Components:
- `packages/web-app/src/components/Header.tsx`
- `packages/web-app/src/components/AttendanceMatrix.tsx`
- `packages/web-app/src/components/Infoboard.tsx`
- `packages/web-app/src/components/PWANotifications.jsx`

## Pattern for Adding Debug Overlays:

```jsx
// 1. Add import
import { DebugOverlay } from '../../../debug';

// 2. Wrap main return with DebugOverlay
return (
  <DebugOverlay name="ComponentName">
    {/* existing component content */}
  </DebugOverlay>
);
```

## Debug ID Naming Convention:
- 3-letter prefix based on component name
- 3-digit counter (001, 002, etc.)
- Examples: EVT-001 (Events), LES-002 (LessonSchedule), ADM-003 (AdminDashboard)
