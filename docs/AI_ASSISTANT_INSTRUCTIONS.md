# AI Assistant Instructions - FlexWise Project

## 🚀 Quick Start Guide

This document provides streamlined guidelines for AI assistants working on the FlexWise school management system. Focus on **speed and consistency** without bureaucracy.

---

## 🤖 AI Model Selection Strategy

### Auto Mode (Recommended)
- **Enable "auto" mode** in Builder.io for optimal model selection
- Let the platform choose based on task complexity
- Simple tasks → faster models, complex tasks → advanced models

### Manual Selection Guidelines
| Task Type | Model Recommendation | Examples |
|-----------|---------------------|----------|
| **Simple** | Fast model | Bug fixes, imports, documentation updates, styling |
| **Complex** | Advanced (Sonnet) | Figma migration, database design, architecture decisions |
| **Code Generation** | Advanced (Sonnet) | New features, component creation, Supabase integration |

---

## ⚡ Interactive Workflow Rules

### 🚀 Fast Track (No confirmation needed)
**Just do it** for these tasks:
- Import/export fixes (like DebugOverlay imports)
- Small bug fixes and styling changes
- Documentation updates to existing files
- Simple component improvements
- Basic UI tweaks

### ⚠️ Ask First (Confirmation required)
**Always ask:** "Okay, I will [specific task]. Should we continue?"

**For these tasks:**
- Database schema changes or Supabase integration
- Major component migrations (Figma → features)
- Breaking changes to existing features
- New feature implementation
- File structure changes

**Format:** Explain approach first, then ask for approval.

---

## 📋 Documentation Integration (Background Updates)

### Always Update These (Automatically)
- **MIGRATION_CHECKLIST.md** → Mark components as completed when migrated
- **SUPABASE_INTEGRATION_TRACKER.md** → Update when connecting to database
- **Debug overlays** → Add to all new components

### Reference These (Before Starting Work)
- **TEMPLATE_GUIDE.md** → Understand Figma template features before migration
- **FIGMA_MIGRATION_TRACKER.md** → Check overall project status
- **SUPABASE_INTEGRATION_TRACKER.md** → See what's connected vs. mock data

### Update Format for Checklists
```markdown
- [x] **ComponentName** - Completed
  - Status: Completed
  - Target: `actual/path/here`
  - Notes: Brief description of what was done
  - Migrated By: AI Assistant
  - Migration Date: [Current Date]
```

---

## 🔧 Technical Standards (Always Follow)

### 1. Debug Overlay System
**ALWAYS** wrap components with DebugOverlay:
```typescript
import { DebugOverlay } from '../debug';

export function MyComponent() {
  return (
    <DebugOverlay name="MyComponent">
      {/* component content */}
    </DebugOverlay>
  );
}
```

### 2. Feature-Driven Architecture
**Follow the structure:**
```
packages/web-app/src/features/
├── klassenbuch/          # Attendance tracking
├── task-management/      # Teacher tasks
├── user-management/      # Admin features
├── communications/       # Parent/teacher messaging
└── lessons/             # Lesson scheduling
```

### 3. Import Patterns
```typescript
// Shared components
import { Button } from '../../../components/ui/button';
import { DebugOverlay } from '../../../debug';

// Feature-specific
import { FeatureComponent } from '../components/FeatureComponent';
```

### 4. Code Style
- Use TypeScript interfaces for props
- Follow existing naming conventions
- Maintain responsive design patterns
- Keep German text for UI (school system requirement)

---

## 🗄️ Supabase Integration Workflow

### When Moving from Mock → Supabase
1. **Check current status** in `SUPABASE_INTEGRATION_TRACKER.md`
2. **Ask first** before major database connections
3. **Update tracker** immediately after connection
4. **Preserve mock data** initially for fallback

### Integration Tracking
Update the tracker with:
```markdown
- [x] **ComponentName** → Supabase connected
  - Status: Fully Connected
  - Tables: `table_name`, `related_table`
  - Features: Real-time updates, data persistence
  - Real-time: ✅ Active subscriptions
```

### Priority Order
1. **Critical:** Attendance system, staff management
2. **High:** Task management, lesson scheduling  
3. **Medium:** Analytics, reporting, parent portal

---

## 🏫 Project Context & Constraints

### German School System
- **Language:** Keep German UI text
- **Data structures:** Fehltage (whole days) vs. Fehlstunden (individual lessons)
- **Roles:** Teacher, Admin, Parent access levels
- **Academic year:** Semester-based system

### Builder.io Environment
- **Dev server:** Changes reflect in real-time iframe
- **File paths:** Always use relative paths
- **Debug mode:** Available for testing overlays
- **Live preview:** User sees changes immediately

### FlexWise-Specific
- **AttendanceMatrix:** School-wide attendance overview (working)
- **MissingStaff:** Staff absence tracking (working) 
- **InfoBoard:** Real-time announcements (Supabase connected)
- **KlassenbuchApp:** Class attendance tracking (mock data)

---

## 🎯 Common Task Patterns

### Bug Fixes (Fast Track)
```typescript
// Missing import? Just fix it
import { DebugOverlay } from '../debug';
```

### Component Migration (Ask First)
1. "I'll migrate [Component] from [figma_folder] to [target_location]. Should we continue?"
2. Move component with DebugOverlay
3. Update migration checklist
4. Test in browser

### Supabase Integration (Ask First)
1. "I'll connect [Component] to Supabase using [tables]. Should we continue?"
2. Replace mock data with real queries
3. Add real-time subscriptions if needed
4. Update integration tracker

---

## 📊 Success Metrics

### What Good Looks Like
- ✅ Components work immediately after migration
- ✅ Debug overlays present and functional
- ✅ Documentation stays current
- ✅ Real-time features work smoothly
- ✅ No breaking changes to existing functionality

### Red Flags
- ❌ Missing DebugOverlay imports
- ❌ Outdated migration checklists
- ❌ Broken Supabase connections
- ❌ Missing error handling

---

## 🔗 Quick Reference Links

- **Figma Templates:** `figma_klassenbuch/`, `figma_teacher_dashboard/`, `figma_admin_page/`, `figma_parent_page/`
- **Feature Modules:** `packages/web-app/src/features/`
- **Shared Components:** `packages/web-app/src/components/`
- **Documentation:** `docs/` folder
- **Debug System:** `packages/web-app/src/debug/`

---

*Last Updated: AI Analysis - [Current Date]*  
*Keep this document updated as project patterns evolve*
