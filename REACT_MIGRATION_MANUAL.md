# React Migration Manual: From Monolithic to Feature-Driven Architecture

## 📋 Overview

This manual provides step-by-step instructions for migrating complex React components from a monolithic structure to our feature-driven architecture. It covers common pitfalls, troubleshooting steps, and best practices.

## 🎯 Migration Goals

- **Modular Architecture**: Break down monolithic components into reusable features
- **Shared Resources**: Centralize common utilities, data, and components
- **Clean Imports**: Establish consistent import patterns
- **Maintainable Code**: Create organized, scalable component structure

## 📁 Project Structure Overview

```
packages/
├── shared/                    # Shared utilities and data
│   ├── data/
│   │   └── mockData.ts       # Centralized mock data
│   ├── domains/              # Business logic domains
│   │   ├── academic/
│   │   ├── attendance/
│   │   └── management/
│   └── utils/                # Shared utility functions
│
└── web-app/                  # Main application
    ├── src/
    │   ├── app/              # Main application pages
    │   ├── components/       # Shared UI components
    │   └── features/         # Feature modules
    │       ├── lessons/
    │       ├── communications/
    │       ├── task-management/
    │       └── user-management/
```

## 🚀 Pre-Migration Checklist

### 1. Analyze the Source Component
- [ ] **Identify dependencies**: What components, utilities, and data does it use?
- [ ] **Map functionality**: What features does the component contain?
- [ ] **Check imports**: What external libraries and internal modules are imported?
- [ ] **Find data sources**: Where does the component get its data from?

### 2. Plan the Feature Structure
- [ ] **Define feature boundaries**: What belongs in each feature module?
- [ ] **Identify shared components**: What can be reused across features?
- [ ] **Plan data flow**: How will data be shared between features?
- [ ] **Design interfaces**: What props will each feature component need?

## 📝 Step-by-Step Migration Process

### Phase 1: Preparation

#### 1.1 Create Feature Directory Structure
```bash
mkdir -p packages/web-app/src/features/[feature-name]/components
mkdir -p packages/web-app/src/features/[feature-name]/hooks
mkdir -p packages/web-app/src/features/[feature-name]/types
touch packages/web-app/src/features/[feature-name]/index.ts
```

#### 1.2 Audit Dependencies
**Create a dependency map:**
```typescript
// Example dependency audit
const COMPONENT_DEPENDENCIES = {
  imports: [
    '../../components/Header',           // ❌ Missing component
    '../constants/mockData',             // ❌ Wrong path to shared data
    './utils/helpers'                    // ❌ Local utilities to extract
  ],
  data: [
    'INITIAL_TASKS',                     // ✅ Already in shared
    'INITIAL_LESSONS',                   // ❌ Missing in shared
    'ASSIGNEE_GROUPS'                    // ❌ Missing in shared
  ],
  components: [
    'AddTaskDialog',                     // ❌ Missing in web-app
    'TaskManagement'                     // ✅ Already extracted
  ]
};
```

### Phase 2: Extract and Copy Components

#### 2.1 Copy Missing Shared Components
```bash
# Copy components that are used across features
cp "Source/components/Header.tsx" "packages/web-app/src/components/"
cp "Source/components/AddTaskDialog.tsx" "packages/web-app/src/components/"
```

#### 2.2 Extract Feature-Specific Components
```typescript
// For each feature component:
// 1. Copy the relevant section from the monolithic component
// 2. Create the component file
// 3. Define proper interfaces
// 4. Add debug overlays with systematic IDs

// Example: LessonSchedule.tsx
import { DebugOverlay } from '../../../debug';

interface LessonScheduleProps {
  lessons: any[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAttendanceClick: (lessonId: number, viewMode?: 'overview' | 'edit') => void;
  isMobile?: boolean;
}

export function LessonSchedule({
  lessons,
  selectedDate,
  onDateChange,
  onAttendanceClick,
  isMobile = false
}: LessonScheduleProps) {
  return (
    <DebugOverlay id="LES-014" name="LessonSchedule">
      <div className="lesson-schedule">
        <DebugOverlay id="LES-001" name="LessonSchedule.Header">
          <header>
            {/* Header implementation */}
          </header>
        </DebugOverlay>

        <DebugOverlay id="LES-002" name="LessonSchedule.Grid">
          <div className="schedule-grid">
            {/* Schedule grid implementation */}
          </div>
        </DebugOverlay>
      </div>
    </DebugOverlay>
  );
}
```

### Phase 3: Handle Data and Utilities

#### 3.1 Move Data to Shared Package
```typescript
// Add missing data exports to packages/shared/data/mockData.ts
export const INITIAL_LESSONS = [
  // ... lesson data
];

export const ASSIGNEE_GROUPS = [
  {
    id: 'group-id',           // ⚠️ Always include IDs for groups
    name: 'Group Name',
    members: ['Member 1', 'Member 2']
  }
];
```

#### 3.2 Extract Utilities to Shared Domains
```typescript
// Move utility functions to appropriate domain
// packages/shared/domains/academic/klassenbuch/utils.ts
export const needsAttendanceTracking = (/* ... */) => {
  // Implementation
};

export const getAttendanceStatus = (/* ... */) => {
  // Implementation
};
```

### Phase 4: Fix Import Paths

#### 4.1 Calculate Correct Relative Paths
```typescript
// From: packages/web-app/src/features/lessons/components/LessonSchedule.tsx
// To: packages/shared/domains/academic/klassenbuch/utils.ts

// Count directories up: features -> lessons -> components = 3 levels
// Count directories down: shared -> domains -> academic -> klassenbuch = 4 levels
// Result: '../../../../../shared/domains/academic/klassenbuch/utils'

import { 
  needsAttendanceTracking,
  getAttendanceStatus 
} from '../../../../../shared/domains/academic/klassenbuch/utils';
```

#### 4.2 Fix Component Imports
```typescript
// ✅ Correct paths for different component locations:

// From feature component to shared component:
import { Header } from '../../../components/Header';

// From feature component to shared data:
import { INITIAL_TASKS } from '../../../../../shared/data/mockData';

// From dashboard to feature:
import { LessonSchedule } from '../../features/lessons/components/LessonSchedule';
```

### Phase 5: Update Feature Exports

#### 5.1 Create Feature Index File
```typescript
// packages/web-app/src/features/lessons/index.ts
export { LessonSchedule } from './components/LessonSchedule';
// Add other exports as needed
```

#### 5.2 Update Main Feature Index
```typescript
// packages/web-app/src/features/index.ts
export * from './lessons';
export * from './communications';
export * from './task-management';
// etc.
```

### Phase 5.5: Add Debug Overlays

#### 5.5.1 Debug Overlay Requirements
**MANDATORY**: All migrated components must include debug overlays

```typescript
// Import debug overlay in every component
import { DebugOverlay } from '../../../debug';

// Wrap main component and major sections
export function ComponentName(props) {
  return (
    <DebugOverlay id="ABC-014" name="ComponentName">
      <div className="component-wrapper">
        <DebugOverlay id="ABC-001" name="ComponentName.Section1">
          {/* Section 1 content */}
        </DebugOverlay>

        <DebugOverlay id="ABC-002" name="ComponentName.Section2">
          {/* Section 2 content */}
        </DebugOverlay>
      </div>
    </DebugOverlay>
  );
}
```

#### 5.5.2 Debug ID Convention
- **Component ID**: `{PREFIX}-014` (main component identifier)
- **Section IDs**: `{PREFIX}-001`, `{PREFIX}-002`, etc.
- **Names**: `{ComponentName}.{SectionDescription}`
- **Prefixes**: 3-letter codes (LES=Lessons, COM=Communications, TSK=Tasks, etc.)

### Phase 6: Create Dashboard Component

#### 6.1 Build the New Dashboard
```typescript
// packages/web-app/src/app/dashboard/teacher.tsx
import { LessonSchedule } from '../../features/lessons/components/LessonSchedule';
import { InfoBoard } from '../../features/communications/components/InfoBoard';
import { Events } from '../../features/communications/components/Events';
import { TaskManagement } from '../../features/task-management/components/TaskManagement';

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
  // State management
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  
  // Event handlers
  const handleDateChange = (date: Date) => setSelectedDate(date);
  const handleAttendanceClick = (lessonId: number, viewMode?: 'overview' | 'edit') => {
    // Implementation
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-6">
        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <LessonSchedule 
            lessons={lessons}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onAttendanceClick={handleAttendanceClick}
          />
          <InfoBoard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Events />
          <TaskManagement />
        </div>
      </div>
    </div>
  );
}
```

## ⚠️ Common Pitfalls and Solutions

### 1. Import Path Calculation Errors
**Problem**: `Failed to resolve import` errors
**Solution**: 
- Count directory levels carefully
- Use file system to verify paths
- Test imports step by step

```bash
# Verify path exists
ls packages/shared/domains/academic/klassenbuch/utils.ts
```

### 2. Missing Data Exports
**Problem**: `No matching export for import "INITIAL_LESSONS"`
**Solution**:
- Check what data is actually exported from shared package
- Add missing exports to `packages/shared/data/mockData.ts`
- Ensure data structure matches expected interface

### 3. Component Interface Mismatches
**Problem**: Component props don't match expected interface
**Solution**:
- Define clear TypeScript interfaces
- Check original component usage
- Align prop names and types

```typescript
// ❌ Wrong props
<AddTaskDialog assigneeGroups={ASSIGNEE_GROUPS} />

// ✅ Correct props  
<AddTaskDialog 
  currentTeacher={currentTeacher}
  canAssignTasks={canAssignTasks}
/>
```

### 4. Missing Component Dependencies
**Problem**: Components import other components that don't exist
**Solution**:
- Copy all dependent components first
- Create a dependency tree
- Migration in dependency order

## 🛠 Troubleshooting Guide

### Dev Server Errors

#### "Failed to resolve import"
1. **Check file exists**: Verify the target file exists at the path
2. **Verify relative path**: Count directory levels carefully
3. **Check exports**: Ensure the imported item is exported
4. **Restart dev server**: Sometimes cache issues require restart

#### "No matching export"
1. **Check export syntax**: `export const` vs `export default`
2. **Verify export name**: Exact name match required
3. **Add missing exports**: Add to appropriate shared file

#### Component Props Errors
1. **Check interfaces**: Verify TypeScript interfaces match
2. **Review original usage**: How was component used before?
3. **Update prop names**: Align with new component interface

### Build Process

```bash
# Clean build to resolve cache issues
rm -rf node_modules/.vite
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Restart dev server completely
npm run dev
```

## ✅ Migration Checklist

### Pre-Migration
- [ ] Source component analyzed
- [ ] Dependencies mapped
- [ ] Feature boundaries defined
- [ ] Directory structure created

### During Migration
- [ ] Components copied and extracted
- [ ] Debug overlays added to all components
- [ ] Data moved to shared package
- [ ] Utilities moved to appropriate domains
- [ ] Import paths fixed
- [ ] Feature exports updated

### Post-Migration
- [ ] Dev server starts without errors
- [ ] All components render correctly
- [ ] Functionality works as expected
- [ ] No TypeScript errors
- [ ] No console errors

### Testing
- [ ] Feature components work independently
- [ ] Dashboard layout matches original
- [ ] All interactions function properly
- [ ] Mobile responsiveness maintained
- [ ] Data flows correctly between components

## 📚 Best Practices

### 1. Incremental Migration
- Migrate one feature at a time
- Test thoroughly after each feature
- Keep original working until complete

### 2. Clear Interfaces
- Define TypeScript interfaces for all props
- Document component purposes
- Use descriptive prop names

### 3. Consistent Naming
- Follow established naming conventions
- Use consistent file organization
- Match feature names across files
- Use systematic debug overlay IDs

### 4. Debug Overlay Standards
- Add debug overlays to ALL new components
- Use consistent ID prefixes per feature
- Wrap major component sections
- Include descriptive overlay names

### 5. Proper State Management
- Keep state in appropriate components
- Pass data down through props
- Use callback functions for state updates

### 6. Error Handling
- Check for missing dependencies early
- Use TypeScript for type safety
- Test import paths before committing

## 🎯 Success Metrics

A successful migration should result in:
- ✅ **Zero import errors**
- ✅ **Functional feature components** 
- ✅ **Matching original layout**
- ✅ **Working interactions**
- ✅ **Clean TypeScript compilation**
- ✅ **Maintainable code structure**

## 📞 Getting Help

If you encounter issues during migration:

1. **Check this manual** for common solutions
2. **Review recent migrations** for similar patterns  
3. **Test import paths** manually with file system
4. **Use TypeScript errors** as guides for missing pieces
5. **Break down complex components** into smaller parts

Remember: Migration is an iterative process. Take it step by step, test frequently, and don't hesitate to break large components into smaller, manageable pieces.
