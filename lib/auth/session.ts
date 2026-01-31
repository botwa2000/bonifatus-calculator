import { auth } from '@/auth'
import { db } from '@/lib/db/client'
import { userProfiles } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function getSession() {
  return await auth()
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  return session.user
}

export async function getUserProfile() {
  const session = await auth()
  if (!session?.user) return null

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, session.user.id))
    .limit(1)

  return profile ?? null
}

export async function requireRole(role: 'parent' | 'child') {
  const profile = await getUserProfile()
  if (!profile) {
    redirect('/login')
  }
  if (profile.role !== role) {
    redirect(role === 'parent' ? '/student/dashboard' : '/parent/children')
  }
  return profile
}

export async function requireAuthApi() {
  const session = await auth()
  if (!session?.user) {
    return null
  }
  return session.user
}
