import { NextResponse } from 'next/server'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { getAcceptedChildren } from '@/lib/db/queries/relationships'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { or, eq } from 'drizzle-orm'

export async function GET() {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile()
  if (!profile || profile.role !== 'parent') {
    return NextResponse.json(
      { success: false, error: 'Only parents can view this data' },
      { status: 403 }
    )
  }

  try {
    const { relationships, profiles } = await getAcceptedChildren(profile.id)

    if (profiles.length === 0) {
      return NextResponse.json({ success: true, children: [] })
    }

    const childIds = profiles.map((p) => p.id)

    const userEmails = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(or(...childIds.map((id) => eq(users.id, id))))

    const emailMap = Object.fromEntries(userEmails.map((u) => [u.id, u.email]))
    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
    const connectedSinceMap = Object.fromEntries(relationships.map((r) => [r.childId, r.createdAt]))

    const children = childIds.map((id) => {
      const p = profileMap[id]
      return {
        childId: id,
        childName: p.fullName,
        email: emailMap[id] ?? null,
        dateOfBirth: p.dateOfBirth,
        avatarUrl: p.avatarUrl ?? null,
        schoolName: p.schoolName ?? null,
        connectedSince: connectedSinceMap[id] ?? null,
      }
    })

    return NextResponse.json({ success: true, children })
  } catch (error) {
    console.error('[parent/children/profiles] unexpected error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load children profiles' },
      { status: 500 }
    )
  }
}
