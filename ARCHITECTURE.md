# Flexwise Frontend Architecture
**Scaling for Web + Mobile Multi-Role Dashboard System**

---

## Overview
Flexwise is a school management system with role-based dashboards that needs to scale to support both web and mobile platforms while maintaining feature licensing capabilities.

## Current State ✅
- **Working React web app** with multi-role routing
- **Role-based dashboards**: Teacher, Parent, Admin, Student
- **Complex features**: Attendance tracking, lesson scheduling, task management, messaging
- **Real-time data**: Supabase integration with attendance badges, lesson data
- **Responsive UI**: Works on desktop and mobile browsers

## Architecture Decisions

### 1. Mobile Platform Strategy ✅
**Decision**: Single React Native app with role-based navigation
- **Rationale**: Cleaner maintenance, shared codebase, consistent UX
- **Alternative rejected**: Separate apps per role (would create 4 codebases to maintain)
- **Implementation**: Mirror current web routing pattern (`/dashboard/teacher`, `/dashboard/parent`, etc.)

### 2. Code Organization Strategy ✅  
**Decision**: Domain-based structure for shared business logic
- **Rationale**: Organize by business domains rather than technical features
- **Structure**: 
  ```
  shared/domains/lessons/     # Lesson management, scheduling, attendance
  shared/domains/students/    # Student data, profiles, enrollment
  shared/domains/communications/ # Messaging, notifications, announcements
  shared/domains/tasks/       # Task management, assignments
  shared/domains/analytics/   # Reporting, insights, dashboard metrics
  ```

### 3. Platform Architecture
**Target Structure**:
```
packages/
├── shared/                    # Platform-agnostic business logic
│   ├── domains/              # Business domain modules
│   ├── api/                  # Supabase API calls
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   └── types/                # TypeScript definitions
├── web-app/                  # Web-specific React components
│   ├── dashboards/           # Role-specific dashboard layouts
│   ├── components/           # Web UI components
│   └── pages/                # Web routing components
└── mobile-app/               # React Native app
    ├── screens/              # Mobile screen components
    ├── navigation/           # Mobile navigation setup
    └── components/           # Mobile-specific UI components
```

## Current Features to Organize

Based on the working application, these features need domain organization:

### Lessons Domain
- **Attendance tracking** with badges (currently showing "(23?/0)" format)
- **Lesson scheduling** with time slots (09:50-10:35, etc.)
- **Substitute teacher management** 
- **Room assignments** (6A Klassenraum, etc.)
- **Teacher assignments** (Clarissa D, Güküstan T, etc.)

### Communications Domain  
- **Info Board** with announcements (Schulversammlung, Lehrerkonferenz)
- **Messaging system** (visible in current UI)
- **Notifications** and alerts

### Tasks Domain
- **Task management** with priorities (currently showing "Klassenarbeiten Mathematik 8a korrigieren")
- **Assignment creation** and tracking
- **Due date management**
- **Task filtering** (Priority, Due date, Hot List, Completed)

### Students Domain
- **Student profiles** and class assignments (6A, 5C classes visible)
- **Enrollment management**
- **Parent-student relationships**

## Next Questions to Address

### 3. Feature Licensing Integration
How should licensed features be controlled?

**A)** **Component-level** gating:
```jsx
<FeatureGate feature="advanced_attendance">
  <AttendanceAnalytics />
</FeatureGate>
```

**B)** **Domain-level** licensing:
```jsx
const { hasAccess } = useDomainAccess('lessons', 'advanced_features');
```

**C)** **Route-level** protection at the dashboard level?

---

## Implementation Status
- [x] Architecture decisions documented
- [ ] Question 3: Feature licensing approach
- [ ] Question 4: Mobile navigation structure  
- [ ] Question 5: Data synchronization strategy
- [ ] Begin code reorganization

---
*Document updated: [Current Date]*
