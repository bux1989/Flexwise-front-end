# Figma-to-Features Migration Manual

## 📋 Overview

This manual provides step-by-step instructions for migrating Figma templates into our feature-driven architecture. It covers two primary migration strategies: wholesale replacement and selective extraction, along with best practices for maintaining code quality and functionality.

## 🎯 Migration Goals

- **Figma Integration**: Import Figma templates into production features
- **Feature Architecture**: Maintain our established feature-driven structure  
- **Debug Integration**: Add systematic debug overlays during import
- **Staged Data Migration**: Keep mock data initially, migrate to Supabase step-by-step
- **Design System Compliance**: Convert styling only when explicitly instructed

## 📁 Current Project Structure

```
Root Level:
├── figma_klassenbuch/         # Figma template → klassenbuch feature
├── figma_teacher_dashboard/   # Figma template → lessons/task-management features  
├── figma_admin_page/          # Figma template → user-management feature
├── figma_parent_page/         # Figma template → communications feature
├── [future figma templates]   # Additional templates as needed
└── packages/web-app/          # Main application
    └── src/
        ├── app/dashboard/     # Dashboard entry points
        ├── components/        # Shared UI components  
        ├── features/          # 🎯 TARGET: Feature modules
        │   ├── klassenbuch/
        │   ├── lessons/
        │   ├── communications/
        │   ├── task-management/
        │   └── user-management/
        └── debug/             # Debug overlay system
```

---

## 🚀 Migration Strategies

### Strategy 1: Wholesale Replacement
**Use Case**: "Drop the whole Figma admin page in and make this the new admin page"
- Complete dashboard replacement
- Extract features and replace existing functionality
- Integrate with current architecture

### Strategy 2: Selective Extraction  
**Use Case**: Extract specific components from Figma templates
- Pick and choose components to migrate
- Integrate into existing feature structure
- Preserve existing functionality

---

## 📋 Pre-Migration Checklist

### 1. Analyze the Figma Template
- [ ] **Identify main components**: What are the primary UI sections?
- [ ] **Map to existing features**: Which feature folders should receive components?
- [ ] **Check for overlaps**: Does functionality already exist in current features?
- [ ] **Evaluate data structure**: What mock data is used?

### 2. Plan the Migration Strategy
- [ ] **Choose strategy**: Wholesale replacement vs. selective extraction
- [ ] **Define target features**: Which `packages/web-app/src/features/` folders to update
- [ ] **Plan debug IDs**: What systematic debug overlay IDs to use
- [ ] **Data migration plan**: Mock data → Supabase transition strategy

---

## 🔄 Strategy 1: Wholesale Replacement

### Phase 1: Pre-Import Analysis

#### 1.1 Evaluate Figma Template Structure
```bash
# Examine the figma template structure
ls -la figma_admin_page/src/
ls -la figma_admin_page/src/components/

# Identify main App component
cat figma_admin_page/src/App.tsx | head -20
```

#### 1.2 Identify Target Features
```typescript
// Example mapping for figma_admin_page:
figma_admin_page/src/components/
├── AdminDashboard.tsx    → packages/web-app/src/features/user-management/components/
├── SystemStats.tsx       → packages/web-app/src/features/user-management/components/
├── UserActions.tsx       → packages/web-app/src/features/user-management/components/
└── Navigation.tsx        → packages/web-app/src/components/ (shared)
```

### Phase 2: Component Extraction

#### 2.1 Extract Components with Debug Overlays
```typescript
// DURING extraction, add debug overlays immediately:
import { DebugOverlay } from '../../../debug';

export function AdminDashboard({ stats, onAction }: AdminDashboardProps) {
  return (
    <DebugOverlay id="ADM-014" name="AdminDashboard">
      <div className="admin-dashboard">
        <DebugOverlay id="ADM-001" name="AdminDashboard.Header">
          <header>
            {/* Keep original Figma styling initially */}
          </header>
        </DebugOverlay>
        
        <DebugOverlay id="ADM-002" name="AdminDashboard.Stats">
          <div className="stats-grid">
            {/* Keep original Figma styling initially */}
          </div>
        </DebugOverlay>
        
        <DebugOverlay id="ADM-003" name="AdminDashboard.Actions">
          <div className="action-buttons">
            {/* Keep original Figma styling initially */}
          </div>
        </DebugOverlay>
      </div>
    </DebugOverlay>
  );
}
```

#### 2.2 Preserve Mock Data Initially
```typescript
// Keep Figma mock data for functionality testing
// packages/web-app/src/features/user-management/data/mockData.ts
export const ADMIN_STATS = {
  totalUsers: 1247,
  activeProjects: 43,
  systemHealth: "Excellent"
  // ... keep all Figma mock data initially
};

// Use in component:
import { ADMIN_STATS } from '../data/mockData';
```

### Phase 3: Integration

#### 3.1 Update Dashboard Entry Point
```typescript
// packages/web-app/src/app/dashboard/admin.jsx
import { AdminDashboard } from '../../features/user-management/components/AdminDashboard';
import { Navigation } from '../../components/Navigation';

export default function AdminDashboardPage({ user }) {
  return (
    <div className="min-h-screen">
      <Navigation />
      <AdminDashboard 
        stats={ADMIN_STATS}  {/* Use mock data initially */}
        onAction={handleAdminAction}
      />
    </div>
  );
}
```

#### 3.2 Feature Exports
```typescript
// packages/web-app/src/features/user-management/index.ts
export { AdminDashboard } from './components/AdminDashboard';
export { SystemStats } from './components/SystemStats';
export { ADMIN_STATS } from './data/mockData';
```

---

## 🧩 Strategy 2: Selective Extraction

### Phase 1: Component Selection

#### 1.1 Identify Target Components
```typescript
// From figma_klassenbuch, extract specific components:
figma_klassenbuch/src/components/
├── AttendanceModal.tsx     → Extract to features/klassenbuch/components/
├── StudentList.tsx         → Extract to features/klassenbuch/components/
├── Header.tsx              → Skip (already have shared header)
└── Navigation.tsx          → Skip (already have navigation)
```

#### 1.2 Analyze Dependencies
```typescript
// Check what the component imports
import './StudentList.css';           // ⚠️ Keep initially
import { mockStudents } from '../data'; // ✅ Extract to mock data
import { Button } from './ui/Button';   // ❌ Replace with our Button
```

### Phase 2: Component Migration

#### 2.1 Extract with Debug Overlays
```typescript
// Create: packages/web-app/src/features/klassenbuch/components/StudentList.tsx
import { DebugOverlay } from '../../../debug';
import { Button } from '../../../components/ui/button'; // Use our design system

export function StudentList({ students, onStudentClick }: StudentListProps) {
  return (
    <DebugOverlay id="KLA-015" name="StudentList">
      <div className="student-list">
        <DebugOverlay id="KLA-016" name="StudentList.Header">
          <header>
            {/* Keep Figma styling initially */}
          </header>
        </DebugOverlay>
        
        <DebugOverlay id="KLA-017" name="StudentList.Grid">
          <div className="students-grid">
            {students.map(student => (
              <div key={student.id}>
                {/* Keep Figma styling initially */}
                <Button onClick={() => onStudentClick(student.id)}>
                  {/* Use our Button component */}
                </Button>
              </div>
            ))}
          </div>
        </DebugOverlay>
      </div>
    </DebugOverlay>
  );
}
```

#### 2.2 Integrate into Existing Feature
```typescript
// Update: packages/web-app/src/features/klassenbuch/components/KlassenbuchApp.tsx
import { StudentList } from './StudentList';

export function KlassenbuchApp() {
  return (
    <DebugOverlay id="KLA-014" name="KlassenbuchApp">
      <div className="klassenbuch-app">
        {/* Existing components */}
        <KlassenbuchHeader />
        
        {/* New Figma component */}
        <StudentList 
          students={MOCK_STUDENTS} 
          onStudentClick={handleStudentClick}
        />
        
        {/* Existing components */}
        <KlassenbuchLiveView />
      </div>
    </DebugOverlay>
  );
}
```

---

## ⚠️ Critical Guidelines

### 🚨 DO NOT Change Without Permission

#### Styling Conversion
```typescript
// ❌ DO NOT convert Figma styling until explicitly instructed
// Keep original:
<div className="bg-blue-500 p-4 rounded-lg shadow-md">

// Don't change to design system until told:
// <div className="bg-primary p-4 rounded-md shadow-sm">
```

#### Data Integration  
```typescript
// ❌ DO NOT attempt Supabase integration without human discussion
// Keep mock data initially:
const [students, setStudents] = useState(MOCK_STUDENTS);

// Don't implement Supabase calls until discussed:
// const { data: students } = useStudents(classId);
```

### ✅ DO Add During Import

#### Debug Overlays (Mandatory)
```typescript
// ✅ ALWAYS add debug overlays during component extraction
import { DebugOverlay } from '../../../debug';

// ✅ Use systematic ID naming:
<DebugOverlay id="KLA-015" name="ComponentName">
<DebugOverlay id="KLA-016" name="ComponentName.Section">
```

#### TypeScript Interfaces
```typescript
// ✅ Define clear interfaces for extracted components
interface StudentListProps {
  students: Student[];
  onStudentClick: (studentId: string) => void;
  className?: string;
}
```

---

## 📂 Debug Overlay System

### Debug ID Conventions

#### Feature Prefixes
```typescript
// Use consistent 3-letter prefixes:
KLA-xxx  // Klassenbuch features
LES-xxx  // Lessons features  
COM-xxx  // Communications features
TSK-xxx  // Task management features
USR-xxx  // User management features
REP-xxx  // Reports features
```

#### ID Numbering
```typescript
// Main component: {PREFIX}-014 (component identifier)
<DebugOverlay id="KLA-014" name="KlassenbuchApp">

// Sections: {PREFIX}-001, {PREFIX}-002, etc.
<DebugOverlay id="KLA-001" name="KlassenbuchApp.Header">
<DebugOverlay id="KLA-002" name="KlassenbuchApp.Content">
```

### Implementation Example
```typescript
export function ExtractedComponent({ data }: Props) {
  return (
    <DebugOverlay id="NEW-014" name="ExtractedComponent">
      <div className="extracted-component">
        <DebugOverlay id="NEW-001" name="ExtractedComponent.Title">
          <h2>{data.title}</h2>
        </DebugOverlay>
        
        <DebugOverlay id="NEW-002" name="ExtractedComponent.Content">
          <div className="content">
            {/* Keep Figma styling initially */}
          </div>
        </DebugOverlay>
        
        <DebugOverlay id="NEW-003" name="ExtractedComponent.Actions">
          <div className="actions">
            {/* Use our Button components where appropriate */}
          </div>
        </DebugOverlay>
      </div>
    </DebugOverlay>
  );
}
```

---

## 🛠 Data Migration Workflow

### Phase 1: Mock Data Preservation
```typescript
// Step 1: Extract and preserve Figma mock data
// packages/web-app/src/features/klassenbuch/data/figmaMockData.ts
export const FIGMA_STUDENTS = [
  {
    id: "1",
    name: "Max Mustermann", 
    class: "8A",
    attendance: "present"
    // ... keep all original Figma data structure
  }
];
```

### Phase 2: Functionality Testing
```typescript
// Step 2: Test all functionality with mock data
export function StudentList({ students = FIGMA_STUDENTS }: Props) {
  // Verify all interactions work
  const handleStudentClick = (studentId: string) => {
    console.log('Student clicked:', studentId);
    // Test all click handlers, modals, etc.
  };
}
```

### Phase 3: Gradual Supabase Integration
```typescript
// Step 3: Discuss data structure alignment with human oversight
// Only after explicit discussion:

// 3.1 Define Supabase types
interface SupabaseStudent {
  id: string;
  full_name: string;     // Map from figma 'name'
  class_id: string;      // Map from figma 'class'  
  attendance_status: string; // Map from figma 'attendance'
}

// 3.2 Create data adapter
const adaptFigmaToSupabase = (figmaStudent: FigmaStudent): SupabaseStudent => {
  return {
    id: figmaStudent.id,
    full_name: figmaStudent.name,
    class_id: figmaStudent.class,
    attendance_status: figmaStudent.attendance
  };
};

// 3.3 Implement Supabase integration
const { data: supabaseStudents } = useStudents(classId);
const students = supabaseStudents?.map(adaptFigmaToSupabase) || FIGMA_STUDENTS;
```

---

## 🧪 Testing Strategy

### Functionality Testing
```typescript
// Test with mock data first
describe('StudentList Component', () => {
  it('renders with Figma mock data', () => {
    render(<StudentList students={FIGMA_STUDENTS} />);
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
  });
  
  it('handles student click interactions', () => {
    const mockClick = jest.fn();
    render(<StudentList students={FIGMA_STUDENTS} onStudentClick={mockClick} />);
    // Test all interactions work
  });
});
```

### Integration Testing
```typescript
// Test integration with existing features
describe('KlassenbuchApp Integration', () => {
  it('integrates new StudentList component', () => {
    render(<KlassenbuchApp />);
    // Verify new component works with existing features
  });
});
```

---

## ⚠️ Common Pitfalls and Solutions

### 1. Styling Conflicts
**Problem**: Figma styles conflict with existing design system
**Solution**: 
- Keep Figma styles initially
- Test functionality first
- Convert styles only when explicitly instructed

### 2. Component Dependencies
**Problem**: Figma components use different UI components
**Solution**:
- Map Figma Button → our Button component
- Keep Figma styling but use our components where possible
- Document any custom components needed

### 3. Data Structure Mismatches
**Problem**: Figma mock data doesn't match Supabase structure
**Solution**:
- Keep Figma data initially
- Test all functionality with mock data
- Discuss data mapping with human oversight
- Create adapters when integrating Supabase

### 4. Import Path Errors
**Problem**: Import paths from Figma don't match our structure
**Solution**:
```typescript
// ❌ Figma import:
import { Component } from './components/Component';

// ✅ Our structure:
import { Component } from '../../../features/klassenbuch/components/Component';
```

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] Figma template analyzed
- [ ] Migration strategy chosen (wholesale vs. selective)
- [ ] Target features identified
- [ ] Debug ID prefix planned

### During Migration
- [ ] Debug overlays added to ALL extracted components
- [ ] Original Figma styling preserved
- [ ] Mock data extracted and preserved
- [ ] TypeScript interfaces defined
- [ ] Components integrated into feature structure

### Post-Migration
- [ ] All functionality tested with mock data
- [ ] Debug overlays working correctly
- [ ] No TypeScript errors
- [ ] Components render correctly
- [ ] Integration with existing features successful

### Before Supabase Integration
- [ ] **Human discussion completed** for data structure decisions
- [ ] Data mapping strategy defined
- [ ] Adapter functions created
- [ ] Gradual migration plan established

---

## 🎯 Success Metrics

A successful Figma migration should result in:
- ✅ **Working functionality** with original mock data
- ✅ **Debug overlays** on all new components
- ✅ **Clean integration** with existing features
- ✅ **Preserved styling** until conversion is explicitly approved
- ✅ **TypeScript compilation** without errors
- ✅ **Feature structure** maintained and enhanced

---

## 📞 Human Oversight Required

### Always Discuss Before:
1. **Converting Figma styling** to design system tokens
2. **Integrating with Supabase** data
3. **Modifying existing feature architecture**
4. **Removing or replacing working functionality**

### Safe to Proceed Independently:
1. **Adding debug overlays** during component extraction
2. **Preserving mock data** for functionality testing
3. **Creating TypeScript interfaces** for components
4. **Integrating into established feature structure**

---

**Remember**: This is a collaborative process. Keep functionality working, add debug overlays systematically, and always discuss data integration before implementation!
