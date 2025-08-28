# Flexwise Build Instructions

## Project Overview
Flexwise is a React 19 + TypeScript monorepo school management system using Vite, Supabase, and Tailwind CSS.

## Project Structure
```
flexwise-monorepo/
├── packages/
│   ├── react-app/          # Main React application
│   └── shared/             # Shared utilities and types
├── netlify.toml            # Netlify deployment configuration
├── package.json            # Root workspace configuration
└── BUILD_INSTRUCTIONS.md   # This file
```

## Prerequisites
- **Node.js**: Version 22+ (required by Vite and React Router)
- **npm**: Version 10+
- **Git**: For version control

## Environment Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd flexwise-monorepo

# Install all dependencies (uses npm workspaces)
npm install
```

### 2. Environment Variables
Create environment variables for Supabase:
```bash
# Required environment variables:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Setting Environment Variables:**
- **Development**: Create `.env` files in `packages/react-app/`
- **Production (Netlify)**: Set via Netlify dashboard or use DevServerControl tool

## Development Commands

### Start Development Server
```bash
# Start the React app development server
npm run dev

# Alternative: Start specific workspace
npm run dev:react
```
- Runs on `http://localhost:5173`
- Hot reload enabled
- Proxy configured for API calls

### Build Commands
```bash
# Build everything (shared package + React app)
npm run build

# Build only shared package
npm run build:shared

# Build only React app  
npm run build:react
```

### Other Useful Commands
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Clean build artifacts
npm run clean

# Preview production build
npm run preview
```

## Package Details

### Shared Package (`packages/shared/`)
- **Purpose**: Common utilities, types, and domain logic
- **Build Output**: `dist/` (JavaScript + TypeScript declarations)
- **Key Exports**:
  - Supabase client and authentication
  - Academic domain (Klassenbuch functionality)
  - Shared utilities and types

### React App (`packages/react-app/`)
- **Purpose**: Main user interface
- **Build Output**: `dist/` (Static assets for deployment)
- **Key Features**:
  - React 19 with modern hooks
  - TypeScript for type safety
  - Tailwind CSS for styling
  - React Router for navigation
  - Radix UI components

## Deployment

### Netlify Configuration
The project includes `netlify.toml` with:
- **Build Command**: `npm run build`
- **Publish Directory**: `packages/react-app/dist`
- **Node Version**: 22 (required for dependencies)
- **SPA Routing**: Configured for React Router
- **MIME Types**: Proper JavaScript module serving

### Manual Deployment Steps
1. Ensure all environment variables are set in Netlify
2. Push changes to your Git repository
3. Netlify will automatically build and deploy
4. Monitor build logs for any issues

## Common Issues & Solutions

### Build Failures
- **Node Version**: Ensure using Node 22+
- **Dependencies**: Run `npm install` to refresh packages
- **TypeScript Errors**: Check `npm run type-check` for detailed errors
- **Environment Variables**: Verify all required env vars are set

### Development Issues
- **Port Conflicts**: Default port is 5173, change in `vite.config.js` if needed
- **Hot Reload**: Restart dev server if hot reload stops working
- **Import Errors**: Check package aliases in `vite.config.js`

## Architecture Notes

### Monorepo Structure
- Uses npm workspaces for dependency management
- Shared package provides common functionality
- React app consumes shared package via workspace references

### TypeScript Configuration
- Strict type checking enabled
- Vite client types included for `import.meta.env`
- Shared types across packages

### State Management
- React hooks for local state
- Supabase for authentication and data
- Context providers for global state

## Authentication Flow
1. Users login via Supabase Auth
2. User profiles stored in `user_profiles` table
3. Role-based routing (Parent, Teacher, Admin, Student)
4. Session persistence handled by Supabase

## Available Routes
- `/` - Login page
- `/dashboard/parent` - Parent dashboard
- `/dashboard/teacher` - Teacher dashboard with Klassenbuch
- `/dashboard/admin` - Admin dashboard
- `/dashboard/student` - Student dashboard

## Figma Import Guidelines

### CRITICAL: Before Importing Any Figma Design

#### 1. Project Structure Analysis
**ALWAYS** understand the existing codebase first:
```bash
# Check existing components
find packages/react-app/src/components -name "*.jsx" -o -name "*.tsx"

# Check existing pages
find packages/react-app/src/pages -name "*.jsx" -o -name "*.tsx"

# Check shared components
find packages/shared -name "*.tsx" -o -name "*.ts"
```

#### 2. Component Naming & Organization
- **NEVER** create duplicate components
- **ALWAYS** check if similar functionality exists
- **USE** existing design system components from `packages/react-app/src/components/ui/`
- **FOLLOW** existing naming conventions (PascalCase for components)

#### 3. File Placement Rules
```
packages/react-app/src/
├── components/
│   ├── ui/              # Reusable UI components (buttons, inputs, etc.)
│   ├── klassenbuch/     # Domain-specific components
│   └── [feature]/       # Feature-specific components
├── pages/               # Page-level components
└── constants/           # Static data and constants
```

#### 4. Import Strategy
**BEFORE** creating new files:
1. **Check existing UI components**: `ls packages/react-app/src/components/ui/`
2. **Check shared utilities**: `ls packages/shared/`
3. **Grep for similar functionality**: `grep -r "similar-feature" packages/`

#### 5. Asset Handling
- **Images**: Use Builder.io CDN URLs (already configured in project)
- **Icons**: Use Lucide React icons (`import { IconName } from 'lucide-react'`)
- **Fonts**: Use existing Tailwind CSS font classes
- **Colors**: Use existing Tailwind color palette

#### 6. Styling Guidelines
- **USE** Tailwind CSS classes (already configured)
- **AVOID** custom CSS files unless absolutely necessary
- **FOLLOW** existing responsive patterns (`sm:`, `md:`, `lg:`)
- **USE** existing color scheme (grays, blues, etc.)

#### 7. Common Figma Import Mistakes to AVOID

❌ **DON'T DO:**
- Create new button components when `components/ui/button.tsx` exists
- Hardcode colors instead of using Tailwind classes
- Create separate CSS files for component-specific styles
- Import fonts when Tailwind fonts are configured
- Create new input components when `components/ui/input.tsx` exists
- Duplicate existing layout patterns

✅ **DO:**
- Reuse existing components from `components/ui/`
- Extend existing components with new variants
- Use Tailwind utility classes
- Follow existing responsive patterns
- Check shared package for utilities before creating new ones
- Maintain consistent spacing and sizing

#### 8. Pre-Import Checklist
Before creating ANY new component from Figma:

- [ ] Search existing codebase for similar components
- [ ] Check `components/ui/` for reusable elements
- [ ] Verify if functionality exists in shared package
- [ ] Plan component hierarchy and props interface
- [ ] Identify reusable patterns vs one-off designs
- [ ] Map Figma design to existing Tailwind classes

#### 9. Integration Process
1. **Analyze** the Figma design for existing patterns
2. **Map** design elements to existing components
3. **Identify** new components that are actually needed
4. **Create** only net-new functionality
5. **Test** responsive behavior matches existing patterns
6. **Verify** accessibility standards are maintained

#### 10. Design System Consistency
- **Button variants**: Use existing button component with new variants
- **Input types**: Extend existing input component
- **Card layouts**: Use existing card component patterns
- **Navigation**: Follow existing header/navigation patterns
- **Typography**: Use existing Tailwind typography classes
- **Spacing**: Follow existing spacing scale (4, 8, 12, 16, etc.)

### Example: Proper Figma Import Process
```bash
# 1. Research existing code
grep -r "dashboard" packages/react-app/src/
ls packages/react-app/src/components/ui/

# 2. Plan new component
# - Does it extend existing Dashboard?
# - Can I reuse existing Card component?
# - Are the buttons using existing Button component?

# 3. Create only what's needed
# - Reuse components/ui/card.tsx
# - Reuse components/ui/button.tsx
# - Create new DashboardStats.tsx that composes existing components
```

**Remember**: The goal is to EXTEND the existing design system, not replace it!

## Testing the Build
```bash
# Test production build locally
npm run build
npm run preview

# Check build output
ls -la packages/react-app/dist/
```

## Support & Documentation
- **Netlify Docs**: https://docs.netlify.com/
- **Vite Docs**: https://vitejs.dev/
- **React 19 Docs**: https://react.dev/
- **Supabase Docs**: https://supabase.com/docs

## Quick Start Checklist
- [ ] Node.js 22+ installed
- [ ] Repository cloned
- [ ] `npm install` completed
- [ ] Environment variables configured
- [ ] `npm run dev` starts successfully
- [ ] `npm run build` completes without errors
- [ ] Supabase connection working

---

**Note**: This project successfully builds and deploys to Netlify. All TypeScript errors have been resolved and the monorepo structure is properly configured.

<!-- Build fixes applied - Ready for deployment -->
