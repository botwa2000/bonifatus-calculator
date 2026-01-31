import { NextResponse } from 'next/server'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import {
  getRelationshipsForUser,
  getActiveInvites,
  expireOldInvites,
} from '@/lib/db/queries/relationships'

export async function GET() {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile()

  try {
    // Expire old invites for parents
    if (profile?.role === 'parent') {
      await expireOldInvites(user.id)
    }

    const relationships = await getRelationshipsForUser(user.id)

    let invites: unknown[] = []
    if (profile?.role === 'parent') {
      invites = await getActiveInvites(user.id)
    }

    const asParent = relationships.filter((r) => r.parentId === user.id)
    const asChild = relationships.filter((r) => r.childId === user.id)

    return NextResponse.json({ success: true, asParent, asChild, invites }, { status: 200 })
  } catch (error) {
    console.error('[connections/list] unexpected error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load connections' },
      { status: 500 }
    )
  }
}
