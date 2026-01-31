import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'

export async function getProfile(userId: string) {
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.id, userId)).limit(1)
  return profile ?? null
}

export async function updateProfile(
  userId: string,
  data: {
    fullName?: string
    dateOfBirth?: string
    themePreference?: 'light' | 'dark' | 'system'
  }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (data.fullName !== undefined) updateData.fullName = data.fullName
  if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth
  if (data.themePreference !== undefined) updateData.themePreference = data.themePreference

  await db.update(userProfiles).set(updateData).where(eq(userProfiles.id, userId))
}

export async function deleteAccount(userId: string) {
  // Soft-delete profile
  await db
    .update(userProfiles)
    .set({ isActive: false, deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(userProfiles.id, userId))

  // Hard-delete auth user (cascades to profile via FK)
  await db.delete(users).where(eq(users.id, userId))
}
