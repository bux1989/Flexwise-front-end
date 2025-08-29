# FlexWise Feature-Driven Architecture Guide

## 🎯 Overview

FlexWise uses a **feature-driven architecture** where business functionality is organized into self-contained, reusable features that can be composed across different dashboard types.

## 📁 Project Structure

```
packages/
├── shared/                    # Shared utilities and domain logic
│   ├── domains/              # Business domain utilities
│   ├── utils/                # Helper functions
│   └── lib/                  # Shared libraries
├── web-app/                  # Main React application
│   └── src/
│       ├── app/              # App-level components and routing
│       │   └── dashboard/    # Dashboard entry points
│       ├── components/       # Shared UI components
│       ├── features/         # 🔥 FEATURE MODULES (core architecture)
│       ├── lib/              # App-specific utilities
│       └── constants/        # Application constants
└── mobile-app/               # Future mobile application (shares features)
```

## 🏗️ Feature Architecture

### Core Principle
> **Each feature is a self-contained module that can be used across multiple dashboard types**

### Feature Structure Template
```
features/[feature-name]/
├── components/              # React components for this feature
│   ├── [FeatureName].tsx  # Main feature component
│   ├── [SubComponent].tsx # Supporting components
│   └── index.ts           # Component exports
├── hooks/                  # Custom React hooks
│   ├── use[FeatureName].ts
│   └── index.ts
├── services/              # API calls and business logic
│   ├── [featureName]Api.ts
│   └── index.ts
├── types/                 # TypeScript type definitions
│   ├── [featureName].ts
│   └── index.ts
└── index.ts              # Main feature exports
```

## 🧩 Current Features

### 1. User Management (`user-management/`)
**Purpose**: Handle user administration, system statistics, and user-related operations
**Used by**: Admin Dashboard, Teacher Dashboard (limited)
**Key Components**:
- `SystemStats` - Display system-wide statistics
- `AdminActions` - Administrative action buttons
- `AdminDashboard` - Complete admin dashboard feature

### 2. Communications (`communications/`)
**Purpose**: Handle messages, events, notifications across all user types
**Used by**: ALL Dashboard types
**Key Components**:
- `ParentStats` - Parent-specific statistics
- `ChildrenOverview` - Parent's children information
- `ParentDashboard` - Complete parent dashboard feature

### 3. Reports (`reports/`)
**Purpose**: Generate and display reports, analytics, and insights
**Used by**: Admin Dashboard, External Dashboard, Teacher Dashboard
**Key Components**:
- `ExternalAccessNotice` - Access level notifications
- `ExternalStats` - External user statistics
- `AvailableReports` - Report listing interface
- `ExternalDashboard` - Complete external dashboard feature

### 4. Task Management (`task-management/`)
**Purpose**: Create, assign, track, and manage tasks
**Used by**: Teacher Dashboard, Admin Dashboard
**Key Components**:
- `TaskManagement` - Complete task management interface
- `AddTaskDialog` - Task creation form

### 5. Attendance (`attendance/`)
**Purpose**: Track student attendance, absences, and related metrics
**Used by**: Teacher Dashboard, Parent Dashboard (read-only), Admin Dashboard
**Status**: Types defined, components pending

### 6. Lessons (`lessons/`)
**Purpose**: Manage lesson planning, scheduling, and lesson notes
**Used by**: Teacher Dashboard, Admin Dashboard
**Status**: Types defined, components pending

## 🎨 Dashboard Composition

### Dashboard Feature Mapping
```typescript
const DASHBOARD_FEATURES = {
  admin: [
    'user-management',    // System administration
    'attendance',         // School-wide attendance
    'lessons',           // Schedule management
    'communications',    // Messages & events
    'reports',          // Analytics & insights
    'task-management'   // Administrative tasks
  ],
  teacher: [
    'task-management',   // Assign & track tasks
    'lessons',          // Lesson planning & notes
    'attendance',       // Student attendance
    'communications',   // Messages & events
    'user-management'   // Limited student management
  ],
  parent: [
    'attendance',       // Children's attendance (read-only)
    'communications'    // Messages & events
  ],
  external: [
    'reports',          // Limited access reports
    'communications'    // Limited access communications
  ]
} as const;
```

### Dashboard Implementation Pattern
```typescript
// ❌ OLD: Monolithic dashboard (avoid)
export default function TeacherDashboard({ user }) {
  // 1000+ lines of mixed concerns
  return <div>/* everything mixed together */</div>
}

// ✅ NEW: Feature-composed dashboard (follow this)
export default function TeacherDashboard({ user }) {
  return (
    <div>
      <TaskManagement currentTeacher={getTeacherName(user)} />
      <LessonManagement teacherId={user.id} />
      <AttendanceTracking teacherId={user.id} />
      <Communications userId={user.id} userType="teacher" />
    </div>
  )
}
```

## 🔧 Development Guidelines

### Adding a New Feature

1. **Create feature directory**:
   ```bash
   mkdir -p packages/web-app/src/features/new-feature/{components,hooks,services,types}
   ```

2. **Define types first** (`types/newFeature.ts`):
   ```typescript
   export interface NewFeatureData {
     id: number;
     // ... other properties
   }
   
   export interface NewFeatureProps {
     userId: number;
     // ... other props
   }
   ```

3. **Create main component** (`components/NewFeature.tsx`):
   ```typescript
   import { NewFeatureProps } from '../types/newFeature';
   import { DebugOverlay } from '../../../debug';

   export function NewFeature({ userId }: NewFeatureProps) {
     return (
       <DebugOverlay id="NEW-014" name="NewFeature">
         <div className="new-feature">
           <DebugOverlay id="NEW-001" name="NewFeature.Header">
             {/* Feature header */}
           </DebugOverlay>

           <DebugOverlay id="NEW-002" name="NewFeature.Content">
             {/* Feature content */}
           </DebugOverlay>
         </div>
       </DebugOverlay>
     );
   }
   ```

4. **Add custom hook if needed** (`hooks/useNewFeature.ts`):
   ```typescript
   export function useNewFeature(userId: number) {
     // Feature state and logic
     return { data, loading, actions };
   }
   ```

5. **Create exports** (`index.ts`):
   ```typescript
   export * from './components/NewFeature';
   export * from './hooks/useNewFeature';
   export * from './types/newFeature';
   ```

## 🐛 Debug Overlay Standards

**MANDATORY**: All feature components must include debug overlays

### Debug Overlay Requirements:
- Import `DebugOverlay` from appropriate path
- Wrap main component with systematic ID: `{PREFIX}-014`
- Wrap major sections with: `{PREFIX}-001`, `{PREFIX}-002`, etc.
- Use descriptive names: `{ComponentName}.{SectionDescription}`

### Example Implementation:
```typescript
import { DebugOverlay } from '../../../debug';

export function UserProfile({ userId }: UserProfileProps) {
  return (
    <DebugOverlay id="USR-014" name="UserProfile">
      <div className="user-profile">
        <DebugOverlay id="USR-001" name="UserProfile.Avatar">
          {/* Avatar section */}
        </DebugOverlay>

        <DebugOverlay id="USR-002" name="UserProfile.Details">
          {/* Details section */}
        </DebugOverlay>

        <DebugOverlay id="USR-003" name="UserProfile.Actions">
          {/* Action buttons */}
        </DebugOverlay>
      </div>
    </DebugOverlay>
  );
}
```

### Debug ID Prefix Guide:
- `USR`: User Management features
- `COM`: Communications features
- `REP`: Reports features
- `TSK`: Task Management features
- `ATT`: Attendance features
- `LES`: Lessons features
- `KLA`: Klassenbuch features

6. **Update main features index** (`features/index.ts`):
   ```typescript
   export * from './new-feature';
   
   export const DASHBOARD_FEATURES = {
     // ... add to relevant dashboard types
   } as const;
   ```

### Cross-Feature Communication

**❌ Direct feature-to-feature imports (avoid)**:
```typescript
import { TaskData } from '../task-management/types/task';
```

**✅ Use shared types and events (prefer)**:
```typescript
import { TaskData } from '../../shared/types';
// or use event system for loose coupling
```

### State Management Within Features

- **Local state**: Use `useState` for component-specific state
- **Feature state**: Use custom hooks (`useFeatureName`)
- **Global state**: Use context or state management library when needed across features
- **Server state**: Use React Query or SWR for server synchronization

## 🎯 Benefits of This Architecture

### 1. **Modularity**
- Each feature is completely self-contained
- Features can be developed and tested independently
- Easy to add/remove features from dashboards

### 2. **Reusability**
- Same feature can be used across multiple dashboard types
- Components can be composed differently for different users
- Mobile app can reuse the same feature logic

### 3. **Maintainability**
- Bug fixes are isolated to specific features
- Clear boundaries make code easier to understand
- Team members can own specific features

### 4. **Scalability**
- New dashboard types can be created by composing existing features
- Features can be extended without affecting others
- Performance can be optimized per feature

### 5. **Testing**
- Features can be unit tested in isolation
- Integration tests can focus on feature composition
- End-to-end tests can verify dashboard behavior

## 🚀 Migration Success

We successfully migrated from **1500+ lines** of monolithic dashboard code to **~50 lines** of composed dashboard code, with all business logic cleanly separated into reusable features.

### Before vs After
- **Admin Dashboard**: 280 lines → 35 lines (92% reduction)
- **Parent Dashboard**: 130 lines → 3 lines (98% reduction)  
- **External Dashboard**: 140 lines → 3 lines (98% reduction)
- **Teacher Dashboard**: 1000+ lines → Will be composed from features (95%+ reduction expected)

---

## 🎭 Working with This Architecture

When building new functionality, always ask:
1. **Which feature does this belong to?**
2. **Can this be reused across dashboard types?**
3. **Does this feature need to communicate with others?**
4. **How can I keep this feature self-contained?**
5. **What debug overlay structure should I use?**
6. **What debug ID prefix is appropriate?**

Follow these principles and FlexWise will remain maintainable and scalable! 🎉
