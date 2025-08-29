# FlexWise Architecture Guide

**Comprehensive Developer & AI Guide for Feature-Driven School Management System**

---

## 🎯 Strategic Overview

FlexWise is a school management system with role-based dashboards designed to scale to support both web and mobile platforms while maintaining feature licensing capabilities for the beta-to-paywall transition.

### Current State ✅
- **Working React web app** with multi-role routing
- **Role-based dashboards**: Teacher, Parent, Admin, Student
- **6 implemented features** with 9/19 target modules working
- **Real-time data**: Supabase integration with attendance badges, lesson data
- **Responsive UI**: Works on desktop and mobile browsers
- **Debug overlay system** for development and testing

---

## 🏗️ Current Architecture

### Project Structure (Current Reality)
```
packages/
├── shared/                    # Shared utilities and domain logic
│   ├── domains/              # Business domain utilities (basic utilities only)
│   ├── utils/                # Helper functions
│   └── lib/                  # Shared libraries
├── web-app/                  # Main React application
│   └── src/
│       ├── app/              # App-level components and routing
│       │   └── dashboard/    # Dashboard entry points
│       ├── components/       # Shared UI components
│       ├── features/         # 🔥 MAIN FEATURE IMPLEMENTATION (current structure)
│       │   ├── communications/
│       │   ├── klassenbuch/
│       │   ├── lessons/
│       │   ├── reports/
│       │   ├── task-management/
│       │   └── user-management/
│       ├── lib/              # App-specific utilities
│       └── constants/        # Application constants
└── mobile-app/               # Future mobile application (will share features)
```

### Feature-Driven Core Principle
> **Each feature is a self-contained module that can be used across multiple dashboard types and licensed independently**

---

## 🧩 Current Features & 19 Modules Implementation Status

### Working Features (6/6) ✅

#### 1. **Communications** (`communications/`)
**Purpose**: Handle messages, events, notifications across all user types  
**Modules Implemented**: 2/4
- ✅ **Info-Board** - InfoBoard component with real-time data
- ✅ **Eltern-App** - ParentDashboard with comprehensive functionality
- ❌ **Elternbriefe** - Not implemented
- ❌ **Steckboard** - Not implemented

#### 2. **Klassenbuch** (`klassenbuch/`)
**Purpose**: Digital class book and attendance management  
**Modules Implemented**: 2/2
- ✅ **Klassenbuch** - Full KlassenbuchApp with LiveView
- ✅ **Digitales Klassenbuch** - KlassenbuchStatisticsView

#### 3. **Lessons** (`lessons/`)
**Purpose**: Lesson planning, scheduling, and management  
**Modules Implemented**: 1/3
- ✅ **Stundenplan** - LessonSchedule component
- ❌ **Stundenplanung** - Not implemented
- ❌ **Vertretungsplan** - Not implemented

#### 4. **Task Management** (`task-management/`)
**Purpose**: Create, assign, track, and manage tasks  
**Modules Implemented**: 1/2
- ✅ **To-Do-List** - TaskManagement component
- 🟡 **Termine** - Basic UI in ParentDashboard, needs expansion

#### 5. **User Management** (`user-management/`)
**Purpose**: Handle user administration, system statistics  
**Modules Implemented**: 1/1
- ✅ **Schulinformationen** - Settings component

#### 6. **Reports** (`reports/`)
**Purpose**: Generate and display reports, analytics, insights  
**Modules Implemented**: 2/2
- ✅ **Berichte** - Reports feature with AvailableReports, ExternalDashboard
- ✅ **Statistiken** - Multiple stats components (SystemStats, ExternalStats)

### Missing Features (Need to be created)

#### 7. **Attendance** (Future Feature)
**Purpose**: Track student attendance, absences, related metrics  
**Modules to Implement**: 3/3
- ❌ **Fehlzeiten** - Partially in KlassenbuchStatisticsView, needs standalone feature
- ❌ **Beurlaubung** - Partially in SickReportModal, needs full feature
- ❌ **Check-In/Out** - Navigation item exists, no functionality

#### 8. **Academic** (Future Feature)
**Purpose**: Academic course and curriculum management  
**Modules to Implement**: 1/1
- ❌ **Wahlfächer** - Not implemented

#### 9. **Scheduling** (Future Feature) 
**Purpose**: Advanced scheduling and planning tools  
**Modules to Implement**: 1/1
- ❌ **Flex-Planer** - Not implemented

### Implementation Summary
- **9/19 modules fully implemented** ✅
- **4/19 modules partially implemented** 🟡
- **6/19 modules not yet implemented** ❌
- **6/9 target features working** ✅

---

## 🎨 Dashboard Composition

### Current Dashboard Feature Mapping
```typescript
const DASHBOARD_FEATURES = {
  admin: [
    'user-management',    // ✅ System stats, user admin
    'klassenbuch',        // ✅ School-wide class book access
    'lessons',           // ✅ Schedule management
    'communications',    // ✅ Messages & events
    'reports',          // ✅ Analytics & reports
    'task-management'   // ✅ Administrative tasks
  ],
  teacher: [
    'task-management',   // ✅ Assign & track tasks
    'lessons',          // ✅ Lesson planning & notes
    'klassenbuch',      // ✅ Class attendance
    'communications',   // ✅ Messages & events
  ],
  parent: [
    'communications'    // ✅ Messages, events, parent dashboard
  ],
  external: [
    'reports',          // ✅ Limited access reports
    'communications'    // ✅ Limited access communications
  ]
} as const;
```

### Dashboard Implementation Pattern
```typescript
// ✅ CURRENT: Feature-composed dashboard
export default function TeacherDashboard({ user }) {
  return (
    <div>
      <TaskManagement currentTeacher={getTeacherName(user)} />
      <LessonSchedule teacherId={user.id} />
      <InfoBoard schoolId={user.school_id} />
      <Events events={events} onEventRSVP={handleRSVP} />
    </div>
  )
}
```

---

## 🐛 Debug Overlay Standards

**MANDATORY**: All new components must include debug overlays for development and testing.

### Requirements
- Import `DebugOverlay` from appropriate debug path
- Wrap main component with systematic ID: `{PREFIX}-014`
- Wrap major sections with: `{PREFIX}-001`, `{PREFIX}-002`, etc.
- Use descriptive names: `{ComponentName}.{SectionDescription}`

### Implementation Example
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

### Debug ID Prefix Guide
- `COM`: Communications features
- `KLA`: Klassenbuch features
- `LES`: Lessons features  
- `TSK`: Task Management features
- `USR`: User Management features
- `REP`: Reports features
- `ATT`: Attendance features (future)
- `ACA`: Academic features (future)
- `SCH`: Scheduling features (future)

---

## 🔧 Development Guidelines

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

3. **Create main component with debug overlays** (`components/NewFeature.tsx`):
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

4. **Create exports** (`index.ts`):
   ```typescript
   export * from './components/NewFeature';
   export * from './hooks/useNewFeature';
   export * from './types/newFeature';
   ```

---

## 💰 Beta-to-Paywall Licensing Strategy

### Current Reality: Ready for Licensing ✅
The **9 working modules are already properly organized** in the current feature structure and can be easily put behind paywalls without major restructuring.

### Licensing Implementation Approach

#### 1. **Feature-Level Licensing** (Recommended for Phase 1)
```typescript
// Example: License entire communications feature
const hasFeature = (featureName: string) => {
  return userLicense.features.includes(featureName);
};

// In dashboard composition
{hasFeature('communications') && (
  <InfoBoard />
)}
```

#### 2. **Module-Level Licensing** (Future Enhancement)
```typescript
// Example: License individual modules within features
const hasModule = (moduleName: string) => {
  return userLicense.modules.includes(moduleName);
};

// Within communications feature
{hasModule('info-board') && (
  <InfoBoard />
)}
```

### Beta Transition Plan
**Phase 1 (Beta - 6 months)**: All features available  
**Phase 2 (Post-Beta)**: Feature-level licensing activated  
**Phase 3 (Future)**: Module-level granular licensing

---

## 🎯 Benefits of Current Architecture

### 1. **Beta-to-Paywall Ready**
- 9 working modules can be individually licensed
- Clean feature boundaries prevent licensing conflicts
- No major restructuring needed for paywall implementation

### 2. **Modularity**
- Each feature is completely self-contained
- Features can be developed and tested independently
- Easy to add/remove features from dashboards

### 3. **Reusability**
- Same feature used across multiple dashboard types
- Mobile app can reuse the same feature logic
- Components can be composed differently for different users

### 4. **Maintainability**
- Bug fixes are isolated to specific features
- Clear boundaries make code easier to understand
- Debug overlay system for easy component identification

### 5. **Scalability**
- New dashboard types can be created by composing existing features
- Features can be extended without affecting others
- Performance can be optimized per feature

---

## 🚀 Implementation Status & Next Steps

### Successfully Implemented ✅
- **Feature-driven architecture**: 6 working features
- **9/19 modules working**: Core functionality operational
- **Debug overlay system**: Consistent component identification
- **Role-based dashboards**: All dashboard types functional
- **Licensing-ready structure**: Features prepared for paywall

### Immediate Priorities (Post-Beta)
1. **Complete missing modules** in existing features:
   - Elternbriefe, Steckboard (communications)
   - Stundenplanung, Vertretungsplan (lessons)
   - Termine expansion (task-management)

2. **Create missing features**:
   - `attendance/` feature (Fehlzeiten, Beurlaubung, Check-In/Out)
   - `academic/` feature (Wahlfächer)
   - `scheduling/` feature (Flex-Planer)

3. **Licensing implementation**:
   - Feature-level show/hide logic
   - Module-level granular controls
   - Beta-to-paywall transition

### Development Principles
When building new functionality, always ask:
1. **Which feature does this belong to?**
2. **Can this be reused across dashboard types?**
3. **Does this feature need to communicate with others?**
4. **How can I keep this feature self-contained?**
5. **What debug overlay structure should I use?**
6. **How will this be licensed post-beta?**

---

## 🎯 Quick Reference Commands

### Create New Feature Structure
```bash
# Create new feature directory structure
mkdir -p packages/web-app/src/features/new-feature/{components,hooks,services,types}

# Move components during migration
mv src/components/ComponentName.tsx src/features/feature-name/components/
```

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking across features
npm run type-check

# Run specific feature tests
npm test -- --testPathPattern=features/task-management

# Run all tests
npm test
```

### Feature Development Workflow
```bash
# 1. Create feature structure
mkdir -p packages/web-app/src/features/your-feature/{components,hooks,services,types}

# 2. Create main component with debug overlays
# Edit: packages/web-app/src/features/your-feature/components/YourFeature.tsx

# 3. Create feature exports
# Edit: packages/web-app/src/features/your-feature/index.ts

# 4. Update main features index
# Edit: packages/web-app/src/features/index.ts

# 5. Test the feature
npm run dev
npm run type-check
```

---

**The application is now ready for scalable, maintainable development and smooth beta-to-paywall transition!** 🎉
