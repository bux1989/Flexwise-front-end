# SRC Folder Migration Audit

## 🚨 CRITICAL - CANNOT MOVE (App Infrastructure)
**These files are essential for the running application:**

### Root App Files
- `App.jsx` ❌ **KEEP** - Main app component, routing logic
- `main.jsx` ❌ **KEEP** - React app entry point  
- `App.css` ❌ **KEEP** - App-level styles
- `index.css` ❌ **KEEP** - Global styles

### Pages (Routing)
- `pages/Login.jsx` ❌ **KEEP** - Authentication entry point
- `pages/TeacherDashboard.tsx` ⚠️ **REFACTOR IN PLACE** - Break down but keep routing
- `pages/AdminDashboard.jsx` ⚠️ **REFACTOR IN PLACE** - Break down but keep routing  
- `pages/ExternalDashboard.jsx` ⚠️ **REFACTOR IN PLACE** - Break down but keep routing
- `pages/ParentDashboard.jsx` ⚠️ **REFACTOR IN PLACE** - Break down but keep routing

### Core Infrastructure  
- `lib/supabase.js` ❌ **KEEP** - Database connection
- `contexts/FeatureLicensingContext.tsx` ❌ **KEEP** - App-wide context

## ✅ SAFE TO MOVE (Role-Specific Components)

### Klassenbuch Components → `dashboards/shared/klassenbuch/`
- `components/klassenbuch/AddExcuseModal.tsx` ✅ **MOVE**
- `components/klassenbuch/ExcuseEditModal.tsx` ✅ **MOVE**  
- `components/klassenbuch/Header.tsx` ✅ **MOVE**
- `components/klassenbuch/KlassenbuchApp.tsx` ✅ **MOVE**
- `components/klassenbuch/LiveView.tsx` ✅ **MOVE**
- `components/klassenbuch/StatisticsView.tsx` ✅ **MOVE**
- `components/klassenbuch/data/` ✅ **MOVE**

### Teacher-Specific Components → `dashboards/teacher/dashboard/`
- `components/AddTaskDialog.tsx` ✅ **MOVE** → `task-element/components/`
- `components/TimeInputWithArrows.tsx` ✅ **MOVE** → `lesson-element/components/`

### Data & Constants → `packages/shared/`
- `constants/mockData.ts` ✅ **MOVE** → `packages/shared/data/`
- `utils/helpers.ts` ✅ **MOVE** → `packages/shared/utils/`
- `shared/types/` ✅ **MOVE** → `packages/shared/types/`

## 🤔 EVALUATE CASE-BY-CASE

### Shared UI Components
- `components/ui/` ⚠️ **EVALUATE** - Check if used across roles
  - If shared across roles → Keep in `src/components/ui/`
  - If role-specific → Move to dashboard folders

### Shared Components  
- `components/Header.tsx` ⚠️ **EVALUATE** - Check usage
  - If app-wide → Keep in `src/components/`
  - If dashboard-specific → Move to appropriate dashboard

### Assets
- `assets/react.svg` ⚠️ **EVALUATE** - Probably can delete (default Vite asset)

## 📋 MIGRATION PRIORITY ORDER

### Phase 1: Low-Risk Moves
1. **Move klassenbuch components** → `dashboards/shared/klassenbuch/`
2. **Move data/constants** → `packages/shared/`  
3. **Move utilities** → `packages/shared/utils/`

### Phase 2: Component Extraction  
4. **Extract task functionality** from TeacherDashboard.tsx
5. **Extract lesson functionality** from TeacherDashboard.tsx
6. **Extract event functionality** from TeacherDashboard.tsx

### Phase 3: Dashboard Cleanup
7. **Refactor dashboard pages** to use new structure
8. **Remove unused imports** and old code
9. **Update routing** if needed

## 🎯 IMMEDIATE ACTIONABLE ITEMS

**Can move immediately without breaking anything:**
- ✅ `src/components/klassenbuch/` → `dashboards/shared/klassenbuch/components/`
- ✅ `src/constants/mockData.ts` → `packages/shared/data/mockData.ts`
- ✅ `src/utils/helpers.ts` → `packages/shared/utils/helpers.ts`
- ✅ `src/shared/types/` → `packages/shared/types/`

**Next after that:**
- ⚠️ Extract specific elements from TeacherDashboard.tsx one by one
- ⚠️ Update imports gradually to maintain functionality

## 🚫 DO NOT TOUCH YET
- `App.jsx` - Core routing and app logic
- `main.jsx` - App entry point  
- `pages/*.jsx` files - Keep routing intact during migration
- `lib/supabase.js` - Core database connection
