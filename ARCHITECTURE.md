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
**ACTUAL MODULES DISCOVERED** (19 active modules from admin dashboard):
- **Academic & Records**: Digitales Klassenbuch, Klassenbuch, Wahlfächer
- **Scheduling & Planning**: Stundenplan, Stundenplanung, Vertretungsplan, Termine, Flex-Planer
- **Attendance & Absence**: Fehlzeiten, Beurlaubung, Check-In/Out
- **Communication**: Eltern-App, Elternbriefe, Info-Board, Steckboard
- **Management & Reporting**: Berichte, Statistiken, To-Do-List, Schulinformationen

**OPTIONS FOR 19 MODULES:**

**A) Feature-based** (each module = separate folder):
```
shared/features/
├── digitales-klassenbuch/
├── stundenplan/
├── fehlzeiten/
├── eltern-app/
├── berichte/
... (19 separate modules)
```

**B) Domain-based** (group related modules):
```
shared/domains/
├── academic/          # Klassenbuch, Digitales Klassenbuch, Wahlfächer
├── scheduling/        # Stundenplan, Stundenplanung, Vertretungsplan
├── attendance/        # Fehlzeiten, Beurlaubung, Check-In/Out
├── communications/    # Eltern-App, Elternbriefe, Info-Board
└── management/        # Berichte, Statistiken, To-Do-List
```

**C) Hybrid** (domains with module subfolders): ✅ **SELECTED**
```
shared/domains/
├── academic/
│   ├── klassenbuch/
│   ├── digitales-klassenbuch/
│   └── wahlfächer/
├── scheduling/
│   ├── stundenplan/
│   ├── stundenplanung/
│   └── vertretungsplan/
├── attendance/
│   ├── fehlzeiten/
│   ├── beurlaubung/
│   └── check-in-out/
├── communications/
│   ├── eltern-app/
│   ├── elternbriefe/
│   ├── info-board/
│   └── steckboard/
└── management/
│   ├── berichte/
│   ├── statistiken/
│   ├── to-do-list/
│   ├── schulinformationen/
│   ├── termine/
│   └── flex-planer/
```

**Benefits:**
- Individual module licensing (schools can buy "Stundenplan" only)
- Domain package licensing (complete "Scheduling Suite")
- Shared utilities within domains
- Independent module development

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

### 3. Feature Licensing Model ✅

**Decision**: Basic version + add-on modules (graceful degradation)
- **Basic tier**: Core functionality for all 19 modules
- **Premium/Enterprise**: Enhanced features within each module
- **Implementation**: Modules always visible, features unlock with subscription

Example:
```jsx
// Stundenplan module - always available
<StundenplanModule>
  <BasicScheduleView />                    {/* Always available */}

  {hasFeature('advanced_scheduling') && (
    <AdvancedScheduleEditor />             {/* Premium feature */}
  )}

  {hasFeature('schedule_analytics') && (
    <ScheduleAnalytics />                  {/* Enterprise feature */}
  )}
</StundenplanModule>
```

**Benefits:**
- Users can try basic functionality
- Clear upgrade path within familiar interface
- No jarring "module not available" experiences

### 4. Mobile Navigation Structure ✅

**Decision**: Drawer navigation with overview dashboard
- **Overview dashboard**: Key metrics, recent activity, quick actions (like current web dashboards)
- **Drawer menu**: Side menu with all 19 modules organized by domain
- **Role-based filtering**: Teachers see relevant modules, Parents see their modules

Mobile Structure:
```
┌─────────────────┐
│ ☰ Dashboard    │ ← Overview screen (default)
│                │
│ 📊 Key Metrics │
│ 📋 Recent      │
│ ⚡ Quick Actions│
│                │
│ [Drawer Menu]  │ ← Side menu with modules:
│ Academic       │   - Academic (Klassenbuch, etc.)
│ Scheduling     │   - Scheduling (Stundenplan, etc.)
│ Attendance     │   - Attendance (Fehlzeiten, etc.)
│ Communication  │   - Communication (Eltern-App, etc.)
│ Management     │   - Management (Berichte, etc.)
└─────────────────┘
```

**Benefits:**
- Quick access to key info (overview dashboard)
- Organized access to all 19 modules (drawer)
- Familiar mobile pattern (hamburger menu)

**Note**: Admin dashboard needs quick select actions (TBD what these are)

### 5. Data Synchronization Strategy ✅

**Decision**: Real-time sync + offline capability with sync warnings

**Implementation**:
```jsx
// Web: Always real-time
const { lessons, isLoading } = useLessons(teacherId);

// Mobile: Offline-first with sync status
const { lessons, syncStatus, isOnline } = useOfflineLessons(teacherId);

// Sync status UI
{!isOnline && (
  <SyncWarning>
    ⚠️ Data not synced - Connect to internet to update
  </SyncWarning>
)}
```

**Benefits**:
- Teachers can mark attendance without internet
- Real-time updates when connected
- Clear warnings when data might be stale
- Automatic sync when connection restored

**User Experience**:
- Web: Always shows latest data (requires internet)
- Mobile: Works offline, shows sync status
- Conflict resolution: Last write wins with timestamps

## Architecture Summary

---

## Implementation Status
- [x] Architecture decisions documented
- [ ] Question 3: Feature licensing approach
- [ ] Question 4: Mobile navigation structure  
- [ ] Question 5: Data synchronization strategy
- [ ] Begin code reorganization

---
*Document updated: [Current Date]*
