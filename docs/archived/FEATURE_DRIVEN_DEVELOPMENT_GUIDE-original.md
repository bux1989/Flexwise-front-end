# 🚀 Feature-Driven Development Guide

## 📁 New Structure Overview

We've restructured the codebase to follow **Robin Wieruch's feature-driven approach**. This makes the app more maintainable, scalable, and easier to understand.

```
packages/web-app/src/
├── app/                          # 🎯 ROUTING ONLY
│   ├── dashboard/
│   │   ├── teacher.tsx          # Route: /dashboard/teacher
│   │   ├── admin.jsx            # Route: /dashboard/admin  
│   │   ├── external.jsx         # Route: /dashboard/external
│   │   └── parent.jsx           # Route: /dashboard/parent
│   └── page.tsx                 # Root route
├── features/                     # 🎨 BUSINESS LOGIC
│   ├── task-management/         # Complete task feature
│   │   ├── components/          # TaskList, AddTaskDialog, etc.
│   │   ├── hooks/               # useTaskState, useTaskFilters, etc.
│   │   ├── services/            # taskApi.ts
│   │   └── index.ts             # Feature exports
│   ├── lesson-planning/         # Complete lesson feature
│   │   ├── components/          # LessonCard, AttendanceModal, etc.
│   │   ├── hooks/               # useLessons, useAttendance, etc.
│   │   ├── services/            # lessonApi.ts
│   │   └── index.ts
│   ├── events/                  # Complete events feature
│   │   ├── components/          # EventCard, RSVPButtons, etc.
│   │   ├── hooks/               # useEvents, useRSVP, etc.
│   │   └── index.ts
│   ├── klassenbuch/             # Complete klassenbuch feature
│   │   ├── components/          # KlassenbuchApp, LiveView, etc.
│   │   ├── hooks/               # useKlassenbuch, etc.
│   │   ├── services/            # klassenbuchApi.ts
│   │   └── index.ts
│   ├── info-board/              # Info board feature
│   │   ├── components/          # InfoPost, SubstituteLessons, etc.
│   │   ├── hooks/               # useInfoBoard, etc.
│   │   └── index.ts
│   └── index.ts                 # All feature exports
├── components/                   # 🧩 SHARED UI COMPONENTS
│   ├── ui/                      # Basic UI (buttons, cards, etc.)
│   └── layout/                  # Headers, navigation, etc.
├── hooks/                       # 🎣 SHARED HOOKS
├── services/                    # 🔌 SHARED SERVICES
├── lib/                         # 📚 UTILITIES
└── ... (existing files)
```

## 🎯 Key Principles

### 1. **Features are Self-Contained**
Each feature folder contains EVERYTHING related to that feature:
- UI components
- Business logic hooks
- API services
- Types (if needed)

### 2. **App Directory = Routing Only**
The `app/` directory only handles:
- Route definitions
- Page layouts
- Importing and composing features

### 3. **Shared = Actually Shared**
Only put things in `components/`, `hooks/`, `services/` if they're used by multiple features.

## 🔄 Migration Workflow

### Phase 1: Extract Task Management (FIRST)
**Goal:** Move all task-related code from TeacherDashboard.tsx to the task-management feature.

**Steps:**
1. **Extract task components:**
   ```bash
   # Move AddTaskDialog.tsx to feature
   mv src/components/AddTaskDialog.tsx src/features/task-management/components/
   ```

   **Add debug overlays to extracted components:**
   ```typescript
   // src/features/task-management/components/AddTaskDialog.tsx
   import { DebugOverlay } from '../../../debug';

   export function AddTaskDialog() {
     return (
       <DebugOverlay id="TSK-014" name="AddTaskDialog">
         <Dialog>
           <DebugOverlay id="TSK-001" name="AddTaskDialog.Form">
             {/* Dialog form content */}
           </DebugOverlay>
         </Dialog>
       </DebugOverlay>
     );
   }
   ```

2. **Create task hooks:**
   ```typescript
   // src/features/task-management/hooks/useTaskState.ts
   export const useTaskState = () => {
     // Extract task state logic from TeacherDashboard.tsx
   }
   ```

3. **Create task services:**
   ```typescript
   // src/features/task-management/services/taskApi.ts
   export const createTask = async (taskData) => {
     // Extract task API calls
   }
   ```

4. **Update TeacherDashboard:**
   ```typescript
   // src/app/dashboard/teacher.tsx
   import { TaskManagement } from '../../features/task-management';
   
   export default function TeacherDashboard() {
     return (
       <div>
         <TaskManagement />
         {/* Other features... */}
       </div>
     );
   }
   ```

### Phase 2: Extract Lesson Planning
**Goal:** Move lesson-related code to lesson-planning feature.

**What to extract:**
- Lesson cards and attendance
- Lesson notes functionality
- Attendance modals and forms

### Phase 3: Extract Events
**Goal:** Move events and RSVP functionality.

### Phase 4: Extract Info Board
**Goal:** Move substitute lessons and announcements.

### Phase 5: Extract Klassenbuch
**Goal:** Move klassenbuch to shared feature (already deleted from src).

## 📝 Development Guidelines

### ✅ DO: Feature-First Development

**When adding new functionality:**

1. **Identify the feature** it belongs to
2. **Add to existing feature** if it fits
3. **Create new feature** if it's distinct
4. **Add debug overlays** to all new components

**Example - Adding task comments:**
```
src/features/task-management/
├── components/
│   ├── TaskList.tsx
│   ├── TaskCard.tsx
│   └── TaskComments.tsx          # ← Add here (with debug overlays)
├── hooks/
│   ├── useTaskState.ts
│   └── useTaskComments.ts         # ← Add here
```

**TaskComments.tsx with debug overlays:**
```typescript
import { DebugOverlay } from '../../../debug';

export function TaskComments({ taskId }: TaskCommentsProps) {
  return (
    <DebugOverlay id="TSK-015" name="TaskComments">
      <div className="task-comments">
        <DebugOverlay id="TSK-016" name="TaskComments.List">
          {/* Comments list */}
        </DebugOverlay>

        <DebugOverlay id="TSK-017" name="TaskComments.Form">
          {/* Add comment form */}
        </DebugOverlay>
      </div>
    </DebugOverlay>
  );
}
```

### ✅ DO: Feature Exports

**Each feature has clean exports:**
```typescript
// src/features/task-management/index.ts
export { TaskManagement } from './components/TaskManagement';
export { useTaskState } from './hooks/useTaskState';
export { taskApi } from './services/taskApi';

// Usage in app
import { TaskManagement } from '../../features/task-management';
```

### ✅ DO: Role-Based Feature Composition

**Different roles use different feature combinations:**
```typescript
// src/app/dashboard/teacher.tsx
import { TaskManagement, LessonPlanning, Events } from '../../features';

// src/app/dashboard/admin.tsx  
import { Klassenbuch, InfoBoard } from '../../features';
```

### ❌ DON'T: Cross-Feature Dependencies

**Features should not directly import from each other:**
```typescript
// ❌ Bad
import { useLessons } from '../lesson-planning/hooks/useLessons';

// ✅ Good - go through shared services
import { useLessons } from '../../hooks/useLessons';
```

### ❌ DON'T: Put Everything in Shared

**Only move to shared when actually used by 2+ features:**
```typescript
// ❌ Don't put in shared if only tasks use it
src/hooks/useTaskFilters.ts

// ✅ Keep in feature
src/features/task-management/hooks/useTaskFilters.ts
```

## 🛠️ Implementation Steps

### Immediate Next Steps:

1. **Update App.jsx routing** to point to new app/dashboard files
2. **Extract AddTaskDialog** → task-management feature  
3. **Test one feature extraction** before continuing
4. **Update imports** in TeacherDashboard to use feature
5. **Verify app still works** after each extraction

### Week 1: Foundation
- [ ] Extract task-management feature completely
- [ ] Update TeacherDashboard to use new task feature
- [ ] Verify all task functionality works

### Week 2: Core Features  
- [ ] Extract lesson-planning feature
- [ ] Extract events feature
- [ ] Update all dashboards to use new features

### Week 3: Specialized Features
- [ ] Recreate klassenbuch feature properly
- [ ] Extract info-board feature
- [ ] Clean up old code

### Week 4: Polish
- [ ] Remove old unused files
- [ ] Add proper TypeScript types to features
- [ ] Add feature documentation

## 🧪 Testing Strategy

**Test each feature independently:**
```typescript
// src/features/task-management/__tests__/TaskManagement.test.tsx
import { render } from '@testing-library/react';
import { TaskManagement } from '../components/TaskManagement';

test('task management works independently', () => {
  // Test the feature in isolation
});
```

## 🎨 Benefits of This Approach

### ✅ **Maintainability**
- Features can be modified independently
- Clear boundaries between business logic
- Easy to understand what each folder does

### ✅ **Scalability**  
- Add new features without touching existing ones
- Different teams can own different features
- Features can be easily moved to separate packages

### ✅ **Reusability**
- Features can be used in multiple dashboards
- Easy to create role-specific experiences
- Components are focused and single-purpose

### ✅ **Developer Experience**
- No more hunting through deeply nested folders
- Clear mental model of the application
- Easy onboarding for new developers

## 🚨 Migration Safety

**The app continues working during migration because:**
- ✅ All existing files remain in place
- ✅ Features are extracted gradually  
- ✅ Old imports keep working until updated
- ✅ Each feature can be tested independently

**Safety checklist for each extraction:**
1. ✅ App still loads and renders
2. ✅ Feature works in original location
3. ✅ Feature works in new location  
4. ✅ Remove old code only after verification

## 🎯 Success Metrics

**We'll know this is working when:**
- [ ] TeacherDashboard.tsx is < 200 lines (currently 3400+)
- [ ] Each feature can be tested independently
- [ ] New features can be added without touching existing code
- [ ] Different roles easily get different feature combinations
- [ ] Codebase is easier to navigate and understand

---

**🚀 Ready to start? Begin with Phase 1: Extract Task Management!**
