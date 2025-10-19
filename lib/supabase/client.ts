/**
 * Supabase Client Configuration
 * Production-grade client setup for browser and server environments
 */

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

/**
 * Browser Client
 * Use in Client Components and Client-Side code
 * Automatically handles session management
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      // Persist session in cookies for better security
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') return null
          return localStorage.getItem(key)
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return
          localStorage.setItem(key, value)
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(key)
        },
      },
      // Auto refresh tokens before expiration
      autoRefreshToken: true,
      // Persist session across page reloads
      persistSession: true,
      // Detect session from URL after OAuth redirect
      detectSessionInUrl: true,
    },
  })
}

/**
 * Server Client (App Router)
 * Use in Server Components, Server Actions, and Route Handlers
 * Handles cookies properly in Next.js 15 App Router
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Cookie setting can fail in Server Components
          // This is expected - ignore in those contexts
        }
      },
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  })
}

/**
 * Get current session (server-side)
 * Returns null if no session exists
 */
export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    return null
  }

  return session
}

/**
 * Get current user (server-side)
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return user
}

/**
 * Get user profile (server-side)
 * Returns null if not authenticated or profile doesn't exist
 */
export async function getUserProfile() {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()

  if (!user) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (supabase as any)
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error getting user profile:', error)
    return null
  }

  return profile
}

/**
 * Require authentication (server-side)
 * Throws error if not authenticated - use in protected Server Components
 */
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Require specific role (server-side)
 * Throws error if not authenticated or wrong role
 */
export async function requireRole(role: 'parent' | 'child') {
  const profile = await getUserProfile()

  if (!profile) {
    throw new Error('Authentication required')
  }

  if (profile.role !== role) {
    throw new Error(`Insufficient permissions - requires ${role} role`)
  }

  return profile
}
