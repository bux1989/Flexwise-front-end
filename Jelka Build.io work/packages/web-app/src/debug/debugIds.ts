// Auto-generated debug IDs registry
const debugIds = new Map<string, string>();
let idCounter = 1;

/**
 * Generates a consistent debug ID for a component
 * @param componentName - The component name (e.g., "ComprehensiveParentDashboard")
 * @returns Consistent debug ID (e.g., "CPD-001")
 */
export function generateDebugId(componentName: string): string {
  // Check if we already have an ID for this component
  if (debugIds.has(componentName)) {
    return debugIds.get(componentName)!;
  }

  // Generate prefix from component name
  const prefix = generatePrefix(componentName);
  
  // Generate new ID
  const id = `${prefix}-${String(idCounter).padStart(3, '0')}`;
  idCounter++;
  
  // Store and return
  debugIds.set(componentName, id);
  return id;
}

/**
 * Generates a 3-letter prefix from component name
 * @param name - Component name
 * @returns 3-letter uppercase prefix
 */
function generatePrefix(name: string): string {
  // Remove common suffixes and prefixes
  const cleanName = name
    .replace(/^(The|A|An)/, '')
    .replace(/(Component|Page|View|Modal|Dialog|Panel)$/, '')
    .replace(/(Dashboard|Header|Footer|Sidebar)$/, (match) => match.slice(0, 3));

  // Split camelCase and extract meaningful parts
  const words = cleanName.split(/(?=[A-Z])/).filter(word => word.length > 0);
  
  if (words.length === 1) {
    // Single word - take first 3 characters
    return words[0].slice(0, 3).toUpperCase();
  } else if (words.length === 2) {
    // Two words - take first 2 chars of first, 1 char of second
    return (words[0].slice(0, 2) + words[1].slice(0, 1)).toUpperCase();
  } else {
    // Multiple words - take first char of first 3 words
    return words.slice(0, 3).map(word => word.charAt(0)).join('').toUpperCase();
  }
}

/**
 * Get all registered debug IDs
 * @returns Map of component names to debug IDs
 */
export function getAllDebugIds(): Map<string, string> {
  return new Map(debugIds);
}

/**
 * Clear all debug IDs (useful for testing)
 */
export function clearDebugIds(): void {
  debugIds.clear();
  idCounter = 1;
}

// Pre-register common component IDs for consistency
export const COMMON_DEBUG_IDS = {
  Header: generateDebugId('Header'),
  Sidebar: generateDebugId('Sidebar'),
  ComprehensiveParentDashboard: generateDebugId('ComprehensiveParentDashboard'),
  InfoBoard: generateDebugId('InfoBoard'),
  Events: generateDebugId('Events'),
  ChildrenOverview: generateDebugId('ChildrenOverview'),
  ChildDetailView: generateDebugId('ChildDetailView'),
  ParentDashboard: generateDebugId('ParentDashboard'),
  TaskManagement: generateDebugId('TaskManagement'),
  LessonSchedule: generateDebugId('LessonSchedule'),
  AttendanceMatrix: generateDebugId('AttendanceMatrix'),
  PWANotifications: generateDebugId('PWANotifications'),
} as const;
