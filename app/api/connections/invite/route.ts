import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { parentChildInvites } from '@/drizzle/schema/relationships'
import { eq, and, gt, desc } from 'drizzle-orm'
import { generateInviteCode, INVITE_VALIDITY_MS } from '@/lib/connections/invite-code'
import { noteAction, withActionLog } from '@/lib/stats/with-action-log'

/**
 * A parent has at most one live invite. Opening the invite dialog again returns it, so
 * the link already sent keeps working and live codes don't pile up for guessers.
 * `replace: true` revokes it and issues a new one ("New code").
 * Older apps send `expiresInMinutes`; it is ignored (validity is always 7 days).
 */
const schema = z.object({
  replace: z.boolean().optional(),
  expiresInMinutes: z.number().optional(),
})

const returning = {
  id: parentChildInvites.id,
  code: parentChildInvites.code,
  expiresAt: parentChildInvites.expiresAt,
  status: parentChildInvites.status,
}

function isUniqueViolation(error: unknown) {
  return error instanceof Error && 'code' in error && (error as { code: string }).code === '23505'
}

async function handlePost(request: NextRequest) {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile()
  if (!profile || profile.role !== 'parent') {
    return NextResponse.json({ success: false, error: 'Only parents can invite' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body ?? {})
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid payload', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const live = and(
    eq(parentChildInvites.parentId, profile.id),
    eq(parentChildInvites.status, 'pending'),
    gt(parentChildInvites.expiresAt, new Date())
  )

  try {
    if (parsed.data.replace) {
      await db.update(parentChildInvites).set({ status: 'cancelled' }).where(live)
    } else {
      const [existing] = await db
        .select(returning)
        .from(parentChildInvites)
        .where(live)
        .orderBy(desc(parentChildInvites.createdAt))
        .limit(1)
      if (existing) {
        return noteAction(NextResponse.json({ success: true, invite: existing, reused: true }), {
          reason: 'reused',
        })
      }
    }

    const expiresAt = new Date(Date.now() + INVITE_VALIDITY_MS)
    // 50-bit codes practically never collide; the unique index catches it if one does.
    for (let attempt = 0; ; attempt += 1) {
      try {
        const [invite] = await db
          .insert(parentChildInvites)
          .values({
            parentId: profile.id,
            code: generateInviteCode(),
            status: 'pending',
            expiresAt,
          })
          .returning(returning)
        return noteAction(NextResponse.json({ success: true, invite, reused: false }), {
          reason: parsed.data.replace ? 'replaced' : 'new',
        })
      } catch (error) {
        if (!isUniqueViolation(error) || attempt >= 2) throw error
      }
    }
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create invite' }, { status: 500 })
  }
}

export const POST = withActionLog('invite_create', handlePost, {
  resultId: (b) => (b.invite as { id?: string } | undefined)?.id,
})
