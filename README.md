# FlexWise Migration Documentation

## Overview
This repository has been migrated from WeWeb to a modern monorepo structure using Builder.io with Supabase integration, supporting both Vue 3 and React 19.

## Repository Structure

```
packages/
├── shared/                 # Shared utilities and types
│   ├── lib/
│   │   ├── supabaseClient.ts    # Typed Supabase client
│   │   └── index.ts             # Main exports
│   ├── utils/
│   │   └── index.ts             # Utility functions
│   ├── supabase-types.ts        # Generated database types
│   └── package.json
├── vue-app/               # Vue 3 application
│   ├── src/
│   │   ├── api/               # Supabase queries and API calls
│   │   ├── components/        # Vue components
│   │   ├── composables/       # Vue hooks (useAuth, useUserProfile)
│   │   ├── layouts/           # Layout components
│   │   ├── pages/             # Page components
│   │   ├── router/            # Vue Router configuration
│   │   ├── store/             # Pinia stores
│   │   ├── lib/               # App-specific utilities
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── react-app/             # React 19 application
    ├── src/
    │   ├── components/        # React components
    │   ├── contexts/          # React contexts (AuthContext)
    │   ├── hooks/             # React hooks (useUserProfile)
    │   ├── pages/             # Page components
    │   ├── lib/               # App-specific utilities
    │   └── types/             # TypeScript types
    ├── package.json
    └── vite.config.ts
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Service role key should ONLY be used in server-side code, never exposed to the browser
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up Supabase:**
   - Create a Supabase project
   - Add your Supabase URL and anon key to `.env`
   - Generate database types:
     ```bash
     npm run supabase:types
     ```

3. **Run applications:**
   ```bash
   # Vue app (port 3000)
   npm run dev:vue
   
   # React app (port 3001)
   npm run dev:react
   ```

4. **Build for production:**
   ```bash
   npm run build:all
   ```

## Supabase Integration

### Database Setup

1. **Create user_profiles table:**
   ```sql
   create table user_profiles (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references auth.users(id) on delete cascade not null,
     name text,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
     unique(user_id)
   );
   ```

2. **Enable Row Level Security (RLS):**
   ```sql
   alter table user_profiles enable row level security;
   ```

3. **Create RLS policies:**
   ```sql
   -- Allow users to read all profiles
   create policy "Public profiles are viewable by everyone" on user_profiles
     for select using (true);

   -- Allow users to insert their own profile
   create policy "Users can insert their own profile" on user_profiles
     for insert with check (auth.uid() = user_id);

   -- Allow users to update their own profile
   create policy "Users can update their own profile" on user_profiles
     for update using (auth.uid() = user_id);
   ```

### Authentication Hooks

Both Vue and React apps include authentication hooks:

**Vue (composables/useAuth.ts):**
```vue
<script setup>
import { useAuth } from '@/composables/useAuth'

const { user, isAuthenticated, signIn, signOut } = useAuth()
</script>
```

**React (contexts/AuthContext.tsx):**
```jsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, signIn, signOut } = useAuth()
  // ...
}
```

### User Profile Hooks

**Vue (composables/useUserProfile.ts):**
```vue
<script setup>
import { useUserProfile } from '@/composables/useUserProfile'

const { profile, loading, updateProfile } = useUserProfile()
</script>
```

**React (hooks/useUserProfile.ts):**
```jsx
import { useUserProfile } from '@/hooks/useUserProfile'

function ProfileComponent() {
  const { profile, loading, updateProfile } = useUserProfile()
  // ...
}
```

## Builder.io Integration

### Custom Components

The `UserNameBlock` component is available in both apps and can be registered with Builder.io:

**Vue Component (components/UserNameBlock.vue):**
```vue
<template>
  <div class="user-name-block">
    <div v-if="profile?.name">{{ profile.name }}</div>
    <div v-else-if="user?.email">{{ user.email }}</div>
    <div v-else>{{ fallbackText }}</div>
  </div>
</template>

<script setup>
defineProps(['fallbackText'])
// Uses useAuth and useUserProfile hooks
</script>
```

**React Component (components/UserNameBlock.tsx):**
```jsx
export default function UserNameBlock({ fallbackText = 'Guest' }) {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  
  if (profile?.name) return <span>{profile.name}</span>
  if (user?.email) return <span>{user.email}</span>
  return <span>{fallbackText}</span>
}
```

### Registering with Builder.io

```javascript
import { Builder } from '@builder.io/react' // or '@builder.io/vue'
import UserNameBlock from './components/UserNameBlock'

Builder.registerComponent(UserNameBlock, {
  name: 'UserNameBlock',
  inputs: [
    {
      name: 'fallbackText',
      type: 'string',
      defaultValue: 'Guest User',
      helperText: 'Text to show when user name is not available'
    }
  ]
})
```

## Security Best Practices

1. **Environment Variables:**
   - Keep anon key in frontend `.env`
   - Service role key only in server-side code
   - Never commit `.env` to version control

2. **Row Level Security:**
   - Enable RLS on all tables
   - Write specific policies for each table
   - Test policies thoroughly

3. **Performance:**
   - Use `.single()` when expecting one row
   - Index columns like `user_id`
   - Select only required fields
   - Use pagination for large datasets

## Migration Notes

### Removed WeWeb Dependencies

The following WeWeb-specific items have been removed:
- All `ww-*` prefixed packages and components
- WeWeb-specific environment variables
- WeWeb routing and page structure
- WeWeb-specific build processes

### Preserved Features

- Supabase integration (upgraded and typed)
- Component-based architecture
- Authentication flow
- User profile management

## Next Steps

1. **Database Schema:** Review and migrate your existing Supabase schema
2. **Components:** Migrate existing components to the new structure
3. **Builder.io:** Register custom components for visual editing
4. **Testing:** Add tests for critical paths
5. **Deployment:** Set up CI/CD for both applications

## Support

For questions about this migration, please refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Builder.io Documentation](https://www.builder.io/c/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [React 19 Documentation](https://react.dev/)