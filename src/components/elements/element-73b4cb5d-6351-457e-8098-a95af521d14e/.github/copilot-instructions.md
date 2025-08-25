# Course Scheduler - WeWeb Custom Element

A comprehensive course scheduling system built as a Vue 3 custom element for the WeWeb.io platform. This component provides period and time views, conflict checking, and publishing capabilities for educational institutions.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites and Setup

- Ensure Node.js v20+ is installed (`node --version`)
- Install npm dependencies:

    ```bash
    npm install
    ```

    Takes approximately 50 seconds for fresh install. NEVER CANCEL - set timeout to 2+ minutes.

- Install WeWeb CLI globally (required for building):
    ```bash
    npm install -g @weweb/cli
    ```
    Takes approximately 2 minutes. NEVER CANCEL - set timeout to 5+ minutes.

### Building the Component

- Build the WeWeb component:
    ```bash
    weweb build -- name=course-scheduler type=wwobject
    ```
    Takes less than 2 seconds. This command ALWAYS works and is very fast.
- The build output will be in `dist/manager.js`

### Development Server (LIMITED FUNCTIONALITY)

- **WARNING**: Development server has configuration issues and is NOT functional out of the box
- Running `weweb serve --port=3000` will fail with missing webpack configuration
- **DO NOT** attempt to fix the dev server unless specifically required - focus on component development and building instead

### Code Quality and Formatting

- **Prettier** (WORKS): Check code formatting:

    ```bash
    npx prettier --config prettierrc --check .
    ```

    Fix formatting issues:

    ```bash
    npx prettier --config prettierrc --write .
    ```

- **ESLint** (HAS ISSUES): The current ESLint configuration uses legacy format that has compatibility issues with ESLint v9
    - **DO NOT** spend time fixing ESLint configuration unless specifically required
    - The `.eslintrc` file uses deprecated format - migration to `eslint.config.js` would be needed

### Project Structure Navigation

```
/src/
├── wwElement.vue          # Main WeWeb component entry point
├── components/scheduler/  # Vue components for scheduler UI
│   ├── PeriodGrid.vue    # Period-based view component
│   ├── TimeGrid.vue      # Time-based view component
│   ├── SchedulerToolbar.vue # Toolbar with filters and controls
│   └── PublishDialog.vue # Publishing dialog component
├── views/scheduler/       # Main scheduler views
│   └── SchedulerPage.vue # Primary scheduler interface
├── pinia/scheduler.js     # Pinia store for state management
└── api/scheduler.js       # API communication layer
```

### Key Configuration Files

- `package.json` - npm scripts: `build` (weweb build), `serve` (weweb serve - non-functional)
- `ww-config.js` - WeWeb component configuration and properties
- `AI.md` - Component documentation with full API reference
- `.eslintrc` - ESLint config (legacy format, has compatibility issues)
- `prettierrc` - Prettier formatting configuration

## Validation and Testing

### Manual Component Testing

- **ALWAYS** build the component after making changes: `weweb build -- name=course-scheduler type=wwobject`
- Since this is a WeWeb custom element, it cannot be run standalone - it must be loaded in WeWeb editor
- The component supports both development (mock mode) and production (API mode)
- Test functionality by loading in WeWeb editor development environment

### Known Issues to be Aware Of

- Some Vue template files have HTML comment syntax errors (lines 135-139 in SchedulerPage.vue, line 99 in TimeGrid.vue)
- These syntax errors don't prevent builds but may cause linting issues
- ESLint configuration needs updating for v9 compatibility
- Development server is not functional due to missing webpack configuration

## Component API and Features

### Component Purpose

A flexible course scheduling system for educational institutions with:

- Toggle between Period view (structured time blocks) and Time view (custom time blocks)
- Drag-and-drop interface for creating time-based entries
- Click-to-add interface for period-based entries
- Conflict detection for overlapping resources
- Draft management with save and publish capabilities
- Filtering by teacher, class, and room

### Key Props

Draft schedules
Schedules
Periods
Teachers
School days
live schedule

### Exposed Actions

- `setViewMode(mode)` - Switch between 'period' and 'time' views
- `toggleTeacher(teacherId)` - Toggle teacher selection for filtering
- `setSelectedClass(classId)` - Set selected class for filtering
- `setSelectedRoom(roomId)` - Set selected room for filtering
- `clearFilters()` - Clear all active filters
- `persistDraft()` - Save current draft to server
- `publish()` - Publish current draft

## Common Development Tasks

### Adding New Features

1. Build first to ensure current state works: `weweb build -- name=course-scheduler type=wwobject`
2. Make changes to Vue components in `src/components/scheduler/` or `src/views/scheduler/`
3. Update Pinia store in `src/pinia/scheduler.js` if state management changes needed
4. Update API layer in `src/api/scheduler.js` if backend communication changes needed
5. Always build after changes: `weweb build -- name=course-scheduler type=wwobject`
6. Format code: `npx prettier --config prettierrc --write .`

### Component Architecture

- Uses Vue 3 Composition API
- Pinia for reactive state management
- Axios for HTTP requests
- Supports both mock mode (development) and API mode (production)
- Responsive design works on desktop and mobile
- Keyboard navigation support for accessibility

## Troubleshooting

### Build Issues

- If `weweb: command not found`, run: `npm install -g @weweb/cli`
- If build fails with "arg 'name' not specified", use full command: `weweb build -- name=course-scheduler type=wwobject`

### Development Issues

- **DO NOT** attempt to run `weweb serve` - it's known to be non-functional
- Focus on component building and WeWeb editor integration instead
- For testing, use WeWeb editor development environment

### Code Quality Issues

- Prettier formatting issues can be auto-fixed: `npx prettier --config prettierrc --write .`
- ESLint issues are expected due to version compatibility - ignore unless critical

## Time Expectations

- `npm install`: ~50 seconds (fresh install)
- `npm install -g @weweb/cli`: ~2 minutes
- `weweb build`: <2 seconds (very fast, NEVER CANCEL)
- Prettier formatting check: <10 seconds
- **NEVER CANCEL** any build or install commands - they are designed to complete quickly

## Development Focus

This is a WeWeb custom element, not a standalone application. Focus development on:

1. Vue component functionality and UI
2. Pinia store state management
3. Component build process
4. Integration with WeWeb platform APIs
5. Responsive design and accessibility features
