import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10

let supabase = null

if (hasValidCredentials) {
  // Use real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Create a mock Supabase client for demo purposes
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: ({ email, password }) => {
        // Demo login - accept any email/password for demo
        if (email && password) {
          return Promise.resolve({ 
            data: { 
              user: { 
                id: 'demo-user', 
                email: email 
              } 
            }, 
            error: null 
          })
        }
        return Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Invalid credentials' } 
        })
      },
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null })
    })
  }
  
  console.log('🔄 Using demo mode - add your Supabase credentials to .env for real functionality')
}

export { supabase }
export const isDemo = !hasValidCredentials
