# Debug Overlay Status Report

## Summary: 35+ Components Need Debug Overlays

### ✅ HAVE Debug Overlays (5 components):
1. `packages/web-app/src/features/communications/components/ComprehensiveParentDashboard.tsx` ✅
2. `packages/web-app/src/features/communications/components/ChildrenOverview.tsx` ✅
3. `packages/web-app/src/features/communications/components/InfoBoard.tsx` ✅ (partial)
4. `packages/web-app/src/app/dashboard/parent.jsx` ✅ (wrapper)
5. `packages/web-app/src/app/dashboard/admin.jsx` ✅ (wrapper)
6. `packages/web-app/src/app/dashboard/external.jsx` ✅ (wrapper)

### 🚧 PARTIAL Debug Overlays (1 component):
1. `packages/web-app/src/app/dashboard/teacher.tsx` 🚧 (needs fixing)

### ❌ MISSING Debug Overlays (30+ components):

#### Communications Features (8 missing):
- `packages/web-app/src/features/communications/components/AddChildModal.tsx` ❌
- `packages/web-app/src/features/communications/components/ChildDetailView.tsx` ❌  
- `packages/web-app/src/features/communications/components/Events.tsx` ❌
- `packages/web-app/src/features/communications/components/ParentDashboard.tsx` ❌
- `packages/web-app/src/features/communications/components/ParentProfileModal.tsx` ❌
- `packages/web-app/src/features/communications/components/ParentStats.tsx` ❌
- `packages/web-app/src/features/communications/components/PickupRequestModal.tsx` ❌
- `packages/web-app/src/features/communications/components/SickReportModal.tsx` ❌

#### Klassenbuch Features (7 missing):
- `packages/web-app/src/features/klassenbuch/components/AddExcuseModal.tsx` ❌
- `packages/web-app/src/features/klassenbuch/components/ExcuseEditModal.tsx` ❌
- `packages/web-app/src/features/klassenbuch/components/KlassenbuchApp.tsx` ❌
- `packages/web-app/src/features/klassenbuch/components/KlassenbuchAttendanceModal.tsx` ❌
- `packages/web-app/src/features/klassenbuch/components/KlassenbuchHeader.tsx` ❌
- `packages/web-app/src/features/klassenbuch/components/KlassenbuchLiveView.tsx` ❌
- `packages/web-app/src/features/klassenbuch/components/KlassenbuchStatisticsView.tsx` ❌

#### Lessons Features (1 missing):
- `packages/web-app/src/features/lessons/components/LessonSchedule.tsx` ❌

#### Reports Features (4 missing):
- `packages/web-app/src/features/reports/components/AvailableReports.tsx` ❌
- `packages/web-app/src/features/reports/components/ExternalAccessNotice.tsx` ❌
- `packages/web-app/src/features/reports/components/ExternalDashboard.tsx` ❌
- `packages/web-app/src/features/reports/components/ExternalStats.tsx` ❌

#### Task Management Features (2 missing):
- `packages/web-app/src/features/task-management/components/AddTaskDialog.tsx` ❌
- `packages/web-app/src/features/task-management/components/TaskManagement.tsx` ❌

#### User Management Features (3 missing):
- `packages/web-app/src/features/user-management/components/AdminActions.tsx` ❌
- `packages/web-app/src/features/user-management/components/AdminDashboard.tsx` ❌
- `packages/web-app/src/features/user-management/components/SystemStats.tsx` ❌

#### Core Components (13 missing):
- `packages/web-app/src/components/AddTaskDialog.tsx` ❌
- `packages/web-app/src/components/AttendanceMatrix.tsx` ❌
- `packages/web-app/src/components/Header.tsx` ❌
- `packages/web-app/src/components/Infoboard.tsx` ❌
- `packages/web-app/src/components/MissingStaff.tsx` ❌
- `packages/web-app/src/components/Navigation.tsx` ❌
- `packages/web-app/src/components/TodosPlaceholder.tsx` ❌
- `packages/web-app/src/components/Veranstaltungen.tsx` ❌
- `packages/web-app/src/components/AuthStatus.jsx` ❌
- `packages/web-app/src/components/LoadingScreen.jsx` ❌
- `packages/web-app/src/components/PWAInstallBanner.jsx` ❌
- `packages/web-app/src/components/PWANotifications.jsx` ❌
- `packages/web-app/src/components/Settings.jsx` ❌

## Progress: 6/35+ = ~17% Complete

**We need to add debug overlays to 30+ more components!**

## Recommended Next Steps:
1. Focus on high-priority components first (Header, LessonSchedule, Events)
2. Add overlays to all modal components 
3. Add overlays to all dashboard components
4. Add overlays to all feature components
5. Add overlays to all utility components

## Pattern to Add:
```jsx
import { DebugOverlay } from '../../../debug';

return (
  <DebugOverlay name="ComponentName">
    {/* existing component */}
  </DebugOverlay>
);
```
