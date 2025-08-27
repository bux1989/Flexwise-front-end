# WeWeb to React Conversion Plan

## Phase 1: Setup & Core Structure
- [x] Analyze existing WeWeb/Vue codebase
- [ ] Create React project with Vite
- [ ] Setup Supabase client
- [ ] Basic routing for core pages
- [ ] Shared components (Header, Navigation)

## Phase 2: Core Pages (Priority 1)
- [ ] Login/Home page (entry point)
- [ ] Dashboard Admin (main features)
- [ ] Dashboard Teacher 
- [ ] Dashboard Student
- [ ] Dashboard Parent

## Phase 3: User Management (Priority 2) 
- [ ] Create parent account
- [ ] Accept parent invite
- [ ] Accept staff invite
- [ ] Parent link student

## Phase 4: Advanced Features (Priority 3)
- [ ] Flex board (scheduling)
- [ ] Course scheduler components
- [ ] Real-time updates

## Technical Decisions
- **Framework**: Vite + React 18
- **Routing**: React Router v6
- **State**: React Context + useState (keep simple)
- **Database**: Keep existing Supabase (self-hosted)
- **Styling**: Tailwind CSS (clean & fast)
- **Build**: Vite (fast development)

## Simplifications
- Remove WeWeb-specific complexity
- Streamline component structure  
- Focus on core functionality
- Drop unused features (test pages, etc.)

## Migration Strategy
1. **Page-by-page conversion** (not component-by-component)
2. **Keep existing database schema** 
3. **Start fresh with clean React code**
4. **Gradually migrate features as needed**
5. **Test each page independently**
