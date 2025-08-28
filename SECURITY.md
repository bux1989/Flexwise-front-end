# Supabase Security Guide

## Row Level Security (RLS) Setup

### Enable RLS on All Tables

For each table in your Supabase database, enable Row Level Security:

```sql
-- Enable RLS for user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS for students table (example)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Enable RLS for classes table (example)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Enable RLS for assignments table (example)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
```

### RLS Policy Examples

#### User Profiles Policies

```sql
-- Allow everyone to read public profiles
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Prevent users from deleting profiles (optional)
CREATE POLICY "Profiles cannot be deleted" ON user_profiles
  FOR DELETE USING (false);
```

#### Students Table Policies (Example)

```sql
-- Students can view their own data
CREATE POLICY "Students can view their own data" ON students
  FOR SELECT USING (auth.uid() = user_id);

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view their students" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_teachers ct
      JOIN student_classes sc ON ct.class_id = sc.class_id
      WHERE ct.teacher_id = auth.uid() AND sc.student_id = students.id
    )
  );

-- Parents can view their children's data
CREATE POLICY "Parents can view their children" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = students.id
    )
  );

-- Admins can view all students
CREATE POLICY "Admins can view all students" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );
```

#### Classes Table Policies (Example)

```sql
-- Teachers can view and manage their own classes
CREATE POLICY "Teachers can manage their classes" ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM class_teachers ct
      WHERE ct.class_id = classes.id AND ct.teacher_id = auth.uid()
    )
  );

-- Students can view classes they're enrolled in
CREATE POLICY "Students can view their classes" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM student_classes sc
      WHERE sc.class_id = classes.id AND sc.student_id = auth.uid()
    )
  );
```

## Environment Variables Security

### Frontend Environment Variables (.env)

```env
# ✅ Safe for frontend (anon key has limited permissions)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# ✅ Safe for frontend (Builder.io public key)
VITE_BUILDER_PUBLIC_KEY=your_builder_public_key_here
```

### Backend/Server Environment Variables

```env
# ❌ NEVER expose in frontend - server-side only!
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ❌ Private Builder.io key - server-side only!
BUILDER_PRIVATE_KEY=your_builder_private_key_here

# Database connection string (if using direct connection)
DATABASE_URL=postgresql://user:password@host:port/database
```

## Authentication Security

### JWT Token Handling

Supabase handles JWT tokens automatically, but follow these best practices:

1. **Token Storage**: Tokens are stored in localStorage by default
2. **Auto-refresh**: Supabase automatically refreshes tokens
3. **Secure transmission**: All requests use HTTPS

### Custom Claims (Optional)

Add custom claims to JWT tokens for role-based access:

```sql
-- Create a function to add custom claims
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('request.jwt.claims', true)::json->>'user_role'
  )::text;
$$;

-- Create a function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM user_profiles WHERE user_id = $1;
$$;
```

## Performance Security

### Query Optimization

1. **Use indexes on filtered columns:**
   ```sql
   CREATE INDEX idx_students_user_id ON students(user_id);
   CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
   CREATE INDEX idx_student_classes_student_id ON student_classes(student_id);
   CREATE INDEX idx_student_classes_class_id ON student_classes(class_id);
   ```

2. **Select only required fields:**
   ```javascript
   // ✅ Good - select specific fields
   const { data } = await supabase
     .from('students')
     .select('id, name, email')
     .eq('class_id', classId)

   // ❌ Bad - selects all fields
   const { data } = await supabase
     .from('students')
     .select('*')
     .eq('class_id', classId)
   ```

3. **Use pagination for large datasets:**
   ```javascript
   const { data } = await supabase
     .from('students')
     .select('id, name')
     .range(0, 9) // First 10 results
     .order('name')
   ```

## Data Validation

### Client-side Validation

```typescript
import { z } from 'zod'

const userProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['student', 'teacher', 'parent', 'admin'])
})

// Validate before sending to Supabase
const validateProfile = (data: unknown) => {
  return userProfileSchema.parse(data)
}
```

### Database Constraints

```sql
-- Add constraints at the database level
ALTER TABLE user_profiles
ADD CONSTRAINT check_name_length CHECK (length(name) <= 100);

ALTER TABLE user_profiles
ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE user_profiles
ADD CONSTRAINT check_role_valid CHECK (role IN ('student', 'teacher', 'parent', 'admin'));
```

## Monitoring and Logging

### Enable Supabase Logs

1. Go to your Supabase dashboard
2. Navigate to Logs → API
3. Monitor for:
   - Unusual query patterns
   - Failed authentication attempts
   - RLS policy violations

### Application Logging

```typescript
// Log authentication events
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, {
    userId: session?.user?.id,
    timestamp: new Date().toISOString()
  })
  
  // Send to your logging service
  if (event === 'SIGNED_IN') {
    analytics.track('User Signed In', {
      userId: session?.user?.id,
      method: 'email'
    })
  }
})
```

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Appropriate RLS policies for each user role
- [ ] Service role key never exposed to frontend
- [ ] Database indexes on frequently queried columns
- [ ] Input validation on both client and server
- [ ] Audit logs enabled in Supabase dashboard
- [ ] Regular security reviews of policies
- [ ] Environment variables properly configured
- [ ] HTTPS enforced in production
- [ ] Regular dependency updates

## Emergency Procedures

### Suspected Security Breach

1. **Immediately revoke API keys:**
   - Generate new anon key in Supabase dashboard
   - Update environment variables
   - Deploy new keys

2. **Review audit logs:**
   - Check Supabase logs for unusual activity
   - Review authentication logs
   - Check for unauthorized data access

3. **Update RLS policies:**
   - Temporarily restrict access if needed
   - Review and tighten policies
   - Test thoroughly before re-enabling

4. **Notify users:**
   - Force logout all users
   - Require password reset if needed
   - Communicate transparently about the issue