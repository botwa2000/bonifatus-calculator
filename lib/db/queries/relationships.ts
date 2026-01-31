import { db } from '@/lib/db/client'
import { parentChildRelationships, parentChildInvites } from '@/drizzle/schema/relationships'
import { userProfiles } from '@/drizzle/schema/users'
import { eq, and, or, gt, lt } from 'drizzle-orm'

export async function getRelationshipsForUser(userId: string) {
  const relationships = await db
    .select()
    .from(parentChildRelationships)
    .where(
      or(
        eq(parentChildRelationships.parentId, userId),
        eq(parentChildRelationships.childId, userId)
      )
    )

  // Collect all profile IDs to fetch
  const profileIds = new Set<string>()
  for (const rel of relationships) {
    profileIds.add(rel.parentId)
    profileIds.add(rel.childId)
  }

  const profiles =
    profileIds.size > 0
      ? await db
          .select()
          .from(userProfiles)
          .where(or(...[...profileIds].map((id) => eq(userProfiles.id, id))))
      : []

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))

  return relationships.map((rel) => ({
    ...rel,
    parent: profileMap[rel.parentId] || null,
    child: profileMap[rel.childId] || null,
  }))
}

export async function getActiveInvites(parentId: string) {
  const now = new Date()
  const cutoff = new Date(Date.now() - 16 * 60 * 1000)

  return db
    .select()
    .from(parentChildInvites)
    .where(
      and(
        eq(parentChildInvites.parentId, parentId),
        eq(parentChildInvites.status, 'pending'),
        gt(parentChildInvites.expiresAt, now),
        gt(parentChildInvites.createdAt, cutoff)
      )
    )
    .orderBy(parentChildInvites.expiresAt)
}

export async function expireOldInvites(parentId: string) {
  const now = new Date()
  const cutoff = new Date(Date.now() - 16 * 60 * 1000)

  await db
    .update(parentChildInvites)
    .set({ status: 'expired' })
    .where(
      and(
        eq(parentChildInvites.parentId, parentId),
        eq(parentChildInvites.status, 'pending'),
        or(lt(parentChildInvites.expiresAt, now), lt(parentChildInvites.createdAt, cutoff))
      )
    )
}

export async function getAcceptedChildren(parentId: string) {
  const relationships = await db
    .select()
    .from(parentChildRelationships)
    .where(
      and(
        eq(parentChildRelationships.parentId, parentId),
        eq(parentChildRelationships.invitationStatus, 'accepted')
      )
    )

  const childIds = relationships.map((r) => r.childId)
  if (childIds.length === 0) return { relationships: [], profiles: [] }

  const profiles = await db
    .select()
    .from(userProfiles)
    .where(or(...childIds.map((id) => eq(userProfiles.id, id))))

  return { relationships, profiles }
}
