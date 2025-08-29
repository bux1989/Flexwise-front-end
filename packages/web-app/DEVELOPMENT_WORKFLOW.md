# FlexWise Development Workflow

## 🔄 Daily Development Process

### Starting Work on a Feature

1. **Identify the feature domain**
   ```bash
   # Ask yourself: Which feature does this belong to?
   # - user-management: Admin/user operations
   # - communications: Messages/events/notifications  
   # - reports: Analytics/insights/data display
   # - task-management: Task assignment/tracking
   # - attendance: Student presence tracking
   # - lessons: Lesson planning/scheduling
   ```

2. **Navigate to feature directory**
   ```bash
   cd packages/web-app/src/features/[feature-name]
   ```

3. **Follow the feature structure**
   ```
   your-feature/
   ├── components/     # Add new components here
   ├── hooks/         # Add custom hooks here  
   ├── services/      # Add API calls here
   └── types/         # Add TypeScript types here
   ```

### Adding a New Component

```typescript
// packages/web-app/src/features/your-feature/components/NewComponent.tsx
import { YourFeatureProps } from '../types/yourFeature';
import { DebugOverlay } from '../../../debug';

export function NewComponent({ prop1, prop2 }: YourFeatureProps) {
  return (
    <DebugOverlay id="NEW-014" name="NewComponent">
      <div className="new-component">
        <DebugOverlay id="NEW-001" name="NewComponent.Header">
          {/* Header content */}
        </DebugOverlay>

        <DebugOverlay id="NEW-002" name="NewComponent.Content">
          {/* Main content */}
        </DebugOverlay>
      </div>
    </DebugOverlay>
  );
}

// Don't forget to export in components/index.ts
export * from './NewComponent';
```

**Debug Overlay Requirements:**
- **MANDATORY** for all new components
- Use systematic ID format: `{PREFIX}-014` for main component, `{PREFIX}-001`, `{PREFIX}-002` for sections
- Include descriptive names: `{ComponentName}.{SectionDescription}`
- Import from `../../../debug` (adjust path as needed)

### Adding a Custom Hook

```typescript
// packages/web-app/src/features/your-feature/hooks/useYourFeature.ts
import { useState, useEffect } from 'react';

export function useYourFeature(id: number) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch and manage feature state
  }, [id]);

  return { data, loading, /* actions */ };
}

// Export in hooks/index.ts
export * from './useYourFeature';
```

### Using Features in Dashboards

```typescript
// packages/web-app/src/app/dashboard/teacher.tsx
import { TaskManagement } from '../../features/task-management';
import { LessonManagement } from '../../features/lessons';

export default function TeacherDashboard({ user }) {
  return (
    <div className="dashboard-layout">
      <TaskManagement 
        currentTeacher={user.name} 
        canAssignTasks={user.permissions.canAssign} 
      />
      <LessonManagement 
        teacherId={user.id} 
        selectedDate={new Date()} 
      />
    </div>
  );
}
```

## 🧪 Testing Strategy

### Component Testing
```typescript
// packages/web-app/src/features/task-management/__tests__/TaskManagement.test.tsx
import { render, screen } from '@testing-library/react';
import { TaskManagement } from '../components/TaskManagement';

describe('TaskManagement', () => {
  it('renders task list', () => {
    render(
      <TaskManagement 
        currentTeacher="Test Teacher" 
        canAssignTasks={true} 
      />
    );
    
    expect(screen.getByText('Task Management')).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
// packages/web-app/src/features/task-management/__tests__/useTaskData.test.ts
import { renderHook } from '@testing-library/react';
import { useTaskData } from '../hooks/useTaskData';

describe('useTaskData', () => {
  it('loads tasks correctly', () => {
    const { result } = renderHook(() => useTaskData());
    
    expect(result.current.loading).toBe(true);
    // ... more assertions
  });
});
```

## 📦 Import Guidelines

### ✅ Correct Import Patterns

```typescript
// Feature internal imports (within same feature)
import { TaskProps } from '../types/task';
import { useTaskData } from '../hooks/useTaskData';

// Cross-feature imports (use shared types)
import { User } from '../../../shared/types';
import { formatDate } from '../../../shared/utils';

// UI component imports
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

// External library imports
import { useState } from 'react';
import { format } from 'date-fns';
```

### ❌ Avoid These Import Patterns

```typescript
// ❌ Don't import directly from other features
import { TaskData } from '../task-management/types/task';

// ❌ Don't import from deep component paths
import { SystemStats } from '../user-management/components/stats/SystemStats';

// ❌ Don't use relative imports to go up too many levels
import { helper } from '../../../../../../shared/utils/helper';
```

## 🎨 Styling Guidelines

### Component Styling
```typescript
// Use Tailwind classes consistently + debug overlays
import { DebugOverlay } from '../../../debug';

export function FeatureCard({ title, children }: FeatureCardProps) {
  return (
    <DebugOverlay id="FCD-014" name="FeatureCard">
      <div className="bg-white shadow rounded-lg p-6">
        <DebugOverlay id="FCD-001" name="FeatureCard.Header">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {title}
          </h3>
        </DebugOverlay>

        <DebugOverlay id="FCD-002" name="FeatureCard.Content">
          <div className="space-y-4">
            {children}
          </div>
        </DebugOverlay>
      </div>
    </DebugOverlay>
  );
}
```

### Responsive Design
```typescript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

// Mobile-specific behavior
const isMobile = useIsMobile();
return (
  <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
    {/* Conditional spacing */}
  </div>
);
```

## 🚀 Performance Best Practices

### Lazy Loading Features
```typescript
// Lazy load heavy features
const TaskManagement = lazy(() => 
  import('../../features/task-management').then(m => ({ 
    default: m.TaskManagement 
  }))
);

function TeacherDashboard() {
  return (
    <Suspense fallback={<div>Loading tasks...</div>}>
      <TaskManagement />
    </Suspense>
  );
}
```

### Memoization
```typescript
// Memoize expensive calculations
const filteredTasks = useMemo(() => {
  return tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [tasks, searchQuery]);

// Memoize callback functions
const handleTaskComplete = useCallback((taskId: number) => {
  setTasks(prev => prev.map(task => 
    task.id === taskId ? { ...task, completed: true } : task
  ));
}, []);
```

## 🐛 Debugging Tips

### Feature-Specific Debugging
```typescript
// Add feature-specific console groups
console.group('🎯 TaskManagement');
console.log('Tasks loaded:', tasks.length);
console.log('Filtered tasks:', filteredTasks.length);
console.groupEnd();

// Use data attributes for easier element selection
<div data-testid="task-management" data-feature="task-management">
  {/* Feature content */}
</div>
```

### Common Issues and Solutions

1. **Feature not showing up**: Check if it's properly exported in `features/index.ts`
2. **Props not updating**: Ensure parent component is passing updated props
3. **Hooks not working**: Verify hook is called at component top level
4. **Styling issues**: Check Tailwind classes and responsive breakpoints

## 📋 Code Review Checklist

Before submitting a PR, verify:

- [ ] Feature follows the established directory structure
- [ ] **Debug overlays added to all new components**
- [ ] **Debug overlay IDs follow systematic naming convention**
- [ ] TypeScript types are properly defined
- [ ] Components are properly exported
- [ ] No direct cross-feature imports (use shared types instead)
- [ ] Responsive design is implemented
- [ ] Loading and error states are handled
- [ ] Console logs are removed or made conditional
- [ ] Tests are added for new functionality
- [ ] **Debug overlays tested in debug mode**
- [ ] Documentation is updated if needed

## 🎯 Quick Reference Commands

```bash
# Create new feature structure
mkdir -p packages/web-app/src/features/new-feature/{components,hooks,services,types}

# Run specific feature tests
npm test -- --testPathPattern=features/task-management

# Check TypeScript across features
npm run type-check

# Build and test
npm run build
npm run dev
```

---

Keep this workflow handy and development will be smooth and consistent! 🎉
