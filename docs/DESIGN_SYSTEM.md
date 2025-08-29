# FlexWise Design System

**Version**: 1.0  
**Last Updated**: December 2024  
**Purpose**: Unified design standards for consistent UI across all FlexWise components

---

## 🎨 Color System

### Design Tokens (CSS Custom Properties)
Use these tokens for all components to ensure consistency:

```css
/* Primary Colors */
--background: #ffffff          /* Main backgrounds */
--foreground: oklch(0.145 0 0) /* Primary text */
--card: #ffffff               /* Card backgrounds */
--card-foreground: oklch(0.145 0 0) /* Card text */

/* Secondary Colors */
--muted: #ececf0              /* Subtle backgrounds */
--muted-foreground: #717182   /* Secondary text */
--accent: #e9ebef             /* Hover states */
--accent-foreground: #030213  /* Accent text */

/* Interactive Colors */
--primary: #030213            /* Primary buttons */
--primary-foreground: #ffffff /* Primary button text */
--secondary: oklch(0.95 0.0058 264.53) /* Secondary buttons */
--secondary-foreground: #030213 /* Secondary button text */

/* System Colors */
--destructive: #d4183d        /* Error/danger */
--destructive-foreground: #ffffff /* Error text */
--border: rgba(0, 0, 0, 0.1)  /* All borders */
--input: rgba(0, 0, 0, 0.1)   /* Input borders */
--ring: oklch(0.708 0 0)      /* Focus rings */
```

### Semantic Color Usage

#### ✅ DO - Use Design Tokens
```jsx
<div className="bg-background text-foreground">
<div className="bg-card border border-border">
<p className="text-muted-foreground">
<button className="bg-primary text-primary-foreground">
```

#### ❌ DON'T - Use Hardcoded Colors
```jsx
<div className="bg-gray-50 text-gray-900">     // ❌ Inconsistent
<div className="bg-blue-50 border-blue-200">  // ❌ Not in design system
<p className="text-gray-600">                 // ❌ Custom grays
```

---

## 📝 Typography System

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 
             'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Text Scales
```jsx
/* Headings */
<h1 className="text-3xl font-bold text-foreground">      // Page titles
<h2 className="text-2xl font-bold text-foreground">      // Section titles  
<h3 className="text-lg font-semibold text-foreground">   // Subsections
<h4 className="text-base font-medium text-foreground">   // Card titles

/* Body Text */
<p className="text-sm text-foreground">                  // Primary text
<p className="text-xs text-muted-foreground">            // Secondary text
<span className="text-xs text-muted-foreground">         // Meta information
```

---

## 🏢 Logo & Branding

### Logo Requirements
**Logo must always be present in the header** across all dashboards and components.

#### Standard Logo Implementation
```jsx
<img
  src="https://cdn.builder.io/api/v1/image/assets%2F020295f4dae640e8b44edc48cd1c867a%2Fb0814f7ff5d24c7a9970474123112e62?format=webp&width=800"
  alt="FlexWise"
  className="h-8 w-auto lg:h-10 flex-shrink-0"
/>
```

#### Logo Specifications
- **Source**: Builder.io CDN (no tagline version)
- **Alt Text**: "FlexWise" (concise)
- **Size**: `h-8` on mobile, `lg:h-10` on desktop
- **Width**: `w-auto` to maintain aspect ratio
- **Flex**: `flex-shrink-0` to prevent compression

#### Header Logo Pattern
```jsx
// Standard header with logo
<header className="bg-background border-b border-border">
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-3">
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2F020295f4dae640e8b44edc48cd1c867a%2Fb0814f7ff5d24c7a9970474123112e62?format=webp&width=800"
        alt="FlexWise"
        className="h-8 w-auto lg:h-10 flex-shrink-0"
      />
      <span className="font-semibold text-2xl text-primary">FlexWise</span>
    </div>
    {/* Header actions */}
  </div>
</header>
```

#### ✅ Logo DO's
- Always use the Builder.io CDN source for consistency
- Always include in header of every dashboard/page
- Use responsive sizing (`h-8 lg:h-10`)
- Maintain aspect ratio with `w-auto`
- Keep alt text simple: "FlexWise"

#### ❌ Logo DON'T's
```jsx
// ❌ Don't use local files
<img src="/logo.png" alt="..." />

// ❌ Don't use extended alt text
<img alt="FlexWise - Flexible Tools for Smart Schools" />

// ❌ Don't use fixed width
<img className="h-8 w-20" />

// ❌ Don't omit flex-shrink-0
<img className="h-8 w-auto" />  // Missing flex-shrink-0
```

---

## 🧩 Component Patterns

### Card Pattern
```jsx
<Card className="h-full">
  <CardHeader>
    <CardTitle>Component Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>
```

### Button Patterns
```jsx
// Primary actions
<Button variant="default">Primary Action</Button>

// Secondary actions  
<Button variant="outline">Secondary Action</Button>

// Subtle actions
<Button variant="ghost">Subtle Action</Button>

// Destructive actions
<Button variant="destructive">Delete</Button>
```

### Badge Patterns
```jsx
// Status indicators
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Error</Badge>

// Custom semantic colors
<Badge className="bg-green-50 text-green-700">Success</Badge>
<Badge className="bg-orange-50 text-orange-700">Warning</Badge>
```

---

## 📏 Spacing System

### Container Spacing
```jsx
// Page containers
<div className="container mx-auto px-4 py-6 max-w-7xl">

// Card content
<CardContent className="px-4 lg:px-6 [&:last-child]:pb-4 [&:last-child]:lg:pb-6">

// Navigation
<nav className="px-4 py-3">
```

### Grid Layouts
```jsx
// Dashboard grids
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// Form grids  
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Button groups
<div className="flex items-center gap-2">
```

---

## 🔲 Border & Shadow System

### Borders
```jsx
// Standard borders
className="border border-border"

// Accent borders (left accent)
className="border-l-4 border-l-primary"

// Rounded corners
className="rounded-md"        // Standard
className="rounded-lg"        // Cards
className="rounded-xl"        // Large containers
```

### Shadows
```jsx
// Subtle shadows
className="shadow-sm"

// Standard card shadows  
className="shadow-md"

// No custom box-shadows - use Tailwind utilities
```

---

## 🎭 Icon System

### Icon Guidelines
- **Library**: Lucide React
- **Size**: `h-4 w-4` (standard), `h-3 w-3` (small), `h-5 w-5` (large)
- **Color**: Match parent text color or use semantic colors

```jsx
// Standard usage
<Settings className="h-4 w-4" />

// With semantic colors
<Info className="h-4 w-4 text-blue-500" />
<Check className="h-3 w-3 text-green-600" />
<X className="h-3 w-3 text-red-600" />
```

---

## 🎯 State Patterns

### Interactive States
```jsx
// Hover states
className="hover:bg-accent/50 transition-colors"

// Active states  
className="data-[state=active]:bg-secondary"

// Focus states (automatic with components)
className="focus:outline-none focus:ring-2 focus:ring-ring"
```

### Loading States
```jsx
// Skeleton patterns
<div className="h-4 bg-muted rounded animate-pulse"></div>

// Loading text
<p className="text-muted-foreground">Loading...</p>
```

---

## 📱 Responsive Patterns

### Breakpoint Usage
```jsx
// Mobile first approach
className="block md:hidden"           // Mobile only
className="hidden md:block"           // Desktop only  
className="grid-cols-1 lg:grid-cols-3" // Responsive grids
className="gap-2 md:gap-4 lg:gap-6"   // Responsive spacing
```

---

## ⚡ Animation System

### Transition Classes
```jsx
// Standard transitions
className="transition-colors"         // Color changes
className="transition-all"            // Multiple properties
className="transition-transform"      // Movement

// Duration (use sparingly)
className="duration-200"              // Fast
className="duration-300"              // Standard
```

### Custom Animations (from index.css)
```jsx
className="animate-fade-in"           // Page entrance
className="animate-float-gentle"     // Subtle floating
className="animate-fall-slow"        // Background elements
```

---

## 🚫 Anti-Patterns (What NOT to Do)

### ❌ Color Anti-Patterns
```jsx
// DON'T use hardcoded Tailwind colors
className="bg-gray-50 text-gray-900"
className="bg-blue-100 text-blue-800"  
className="text-slate-600"

// DON'T mix color systems
<div className="bg-background">
  <p className="text-gray-600">  // ❌ Mixed systems
</div>
```

### ❌ Spacing Anti-Patterns
```jsx
// DON'T use arbitrary values
className="p-[13px] m-[7px]"

// DON'T use inconsistent spacing
className="px-3 py-5"  // Use consistent scales
```

### ❌ Component Anti-Patterns
```jsx
// DON'T create custom button styles
<button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded">
// DO use Button component instead
<Button variant="default">
```

---

## ✅ Migration Checklist

When updating existing components:

### Phase 1: Colors
- [ ] Replace `bg-gray-*` with `bg-background/bg-card/bg-muted`
- [ ] Replace `text-gray-*` with `text-foreground/text-muted-foreground`
- [ ] Replace custom blues with semantic colors
- [ ] Update border colors to `border-border`

### Phase 2: Components
- [ ] Use Card/CardHeader/CardContent pattern
- [ ] Replace custom buttons with Button component
- [ ] Use Badge component for status indicators
- [ ] Implement consistent icon patterns

### Phase 3: Layout
- [ ] Use standard container patterns
- [ ] Implement responsive grid systems
- [ ] Apply consistent spacing scales
- [ ] Use standard border/shadow patterns

---

## 🎯 Success Criteria

A component follows the design system when:

1. **Colors**: Only uses design tokens (`bg-background`, `text-foreground`, etc.)
2. **Typography**: Uses standard text scales and font weights
3. **Components**: Uses UI component library patterns
4. **Spacing**: Uses consistent Tailwind spacing scales
5. **Responsive**: Works on mobile and desktop with standard breakpoints
6. **Accessible**: Proper contrast ratios and focus states
7. **Performance**: Uses efficient CSS classes, no custom styles

---

## 📚 Component Library Reference

### Available UI Components
- `Button` - All interactive buttons
- `Card/CardHeader/CardContent` - Container patterns
- `Badge` - Status and label indicators  
- `Input/Label` - Form elements
- `Dialog/Sheet` - Modal patterns
- `Tabs/TabsContent` - Tab interfaces
- `Select/Checkbox` - Form controls
- `Table` - Data display
- `Calendar/Popover` - Date pickers

### Usage
```jsx
import { Button, Card, CardHeader, CardTitle, CardContent } from './ui'
```

---

This design system ensures **visual consistency**, **maintainable code**, and **scalable development** across all FlexWise components.
