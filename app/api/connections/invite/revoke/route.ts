import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { parentChildInvites } from '@/drizzle/schema/relationships'
import { withActionLog } from '@/lib/stats/with-action-log'

/** The parent cancels one of their own pending invites; the code stops working at once. */
const schema = z.object({ inviteId: z.string().min(1).max(64) })

async function handlePost(request: NextRequest) {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile()
  if (!profile || profile.role !== 'parent') {
    return NextResponse.json({ success: false, error: 'Only parents can revoke' }, { status: 403 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }

  try {
    const [revoked] = await db
      .update(parentChildInvites)
      .set({ status: 'cancelled' })
      .where(
        and(
          eq(parentChildInvites.id, parsed.data.inviteId),
          eq(parentChildInvites.parentId, profile.id),
          eq(parentChildInvites.status, 'pending')
        )
      )
      .returning({ id: parentChildInvites.id })

    // Someone else's invite and an unknown id answer the same way.
    if (!revoked) {
      return NextResponse.json(
        { success: false, error: 'Invite not found or no longer pending' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, inviteId: revoked.id })
  } catch (error) {
    console.error('Revoke invite error:', error)
    return NextResponse.json({ success: false, error: 'Failed to revoke invite' }, { status: 500 })
  }
}

export const POST = withActionLog('invite_revoke', handlePost, {
  resultId: (b) => b.inviteId,
})
