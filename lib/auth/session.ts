import { auth } from '@/auth'
import { db } from '@/lib/db/client'
import { userProfiles } from '@/drizzle/schema/users'
import { users } from '@/drizzle/schema/auth'
import { eq } from 'drizzle-orm'
import { getLocale } from 'next-intl/server'
import { redirect as localeRedirect } from '@/i18n/navigation'
import { headers } from 'next/headers'
import { verifyMobileToken } from '@/lib/auth/mobile-token'

// Server-side redirect that keeps the visitor in the locale of the current request.
async function redirect(href: string): Promise<never> {
  return localeRedirect({ href, locale: await getLocale() })
}

export async function getSession() {
  return await auth()
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    return redirect('/login')
  }
  return session.user
}

export async function getUserProfile() {
  const user = await requireAuthApi()
  if (!user?.id) return null

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1)

  return profile ?? null
}

export async function requireRole(role: 'parent' | 'child') {
  const profile = await getUserProfile()
  if (!profile) {
    return redirect('/login')
  }
  if (profile.role !== role) {
    return redirect(role === 'parent' ? '/student/dashboard' : '/parent/children')
  }
  return profile
}

export async function requireAdmin() {
  const profile = await getUserProfile()
  if (!profile) {
    return redirect('/login')
  }
  if (profile.role !== 'admin') {
    return redirect('/dashboard')
  }
  return profile
}

export async function requireAuthApi() {
  // Check mobile JWT Bearer token first
  const headersList = await headers()
  const authHeader = headersList.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = await verifyMobileToken(token)
    if (payload) {
      return {
        id: payload.userId,
        email: payload.email,
        role: payload.role as 'parent' | 'child' | 'admin',
        name: undefined as string | undefined,
      }
    }
  }
  // Fall back to NextAuth cookie session
  const session = await auth()
  if (!session?.user) {
    return null
  }
  return session.user
}

export async function requireMobileAuth() {
  const headersList = await headers()
  const authHeader = headersList.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyMobileToken(token)
}
