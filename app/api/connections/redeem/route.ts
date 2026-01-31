import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { parentChildInvites, parentChildRelationships } from '@/drizzle/schema/relationships'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  code: z.string().regex(/^[0-9]{6}$/),
})

export async function POST(request: NextRequest) {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile()
  if (!profile || profile.role !== 'child') {
    return NextResponse.json({ success: false, error: 'Only children can redeem' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid code', details: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const [invite] = await db
      .select()
      .from(parentChildInvites)
      .where(
        and(eq(parentChildInvites.code, parsed.data.code), eq(parentChildInvites.status, 'pending'))
      )
      .limit(1)

    if (!invite) {
      return NextResponse.json(
        { success: false, error: 'Invite not found or already used' },
        { status: 404 }
      )
    }

    const now = new Date()

    if (invite.expiresAt.getTime() < Date.now()) {
      await db
        .update(parentChildInvites)
        .set({ status: 'expired' })
        .where(eq(parentChildInvites.id, invite.id))
      return NextResponse.json(
        { success: false, error: 'Invite expired. Ask your parent to generate a new code.' },
        { status: 410 }
      )
    }

    // Check if link already exists
    const [existingLink] = await db
      .select()
      .from(parentChildRelationships)
      .where(
        and(
          eq(parentChildRelationships.parentId, invite.parentId),
          eq(parentChildRelationships.childId, profile.id)
        )
      )
      .limit(1)

    if (existingLink) {
      await db.transaction(async (tx) => {
        await tx
          .update(parentChildRelationships)
          .set({ invitationStatus: 'accepted', respondedAt: now })
          .where(eq(parentChildRelationships.id, existingLink.id))
        await tx
          .update(parentChildInvites)
          .set({ status: 'accepted', childId: profile.id, acceptedAt: now })
          .where(eq(parentChildInvites.id, invite.id))
      })
      return NextResponse.json({ success: true, relationshipId: existingLink.id })
    }

    // Create new relationship
    const relationshipId = crypto.randomUUID()
    await db.transaction(async (tx) => {
      await tx.insert(parentChildRelationships).values({
        id: relationshipId,
        parentId: invite.parentId,
        childId: profile.id,
        invitedBy: invite.parentId,
        invitationStatus: 'accepted',
        invitedAt: invite.createdAt,
        respondedAt: now,
      })
      await tx
        .update(parentChildInvites)
        .set({ status: 'accepted', childId: profile.id, acceptedAt: now })
        .where(eq(parentChildInvites.id, invite.id))
    })

    return NextResponse.json({ success: true, relationshipId })
  } catch (error: unknown) {
    // Handle uniqueness constraint gracefully
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') {
      const [link] = await db
        .select({ id: parentChildRelationships.id })
        .from(parentChildRelationships)
        .where(
          and(
            eq(
              parentChildRelationships.parentId,
              (
                await db
                  .select({ parentId: parentChildInvites.parentId })
                  .from(parentChildInvites)
                  .where(eq(parentChildInvites.code, parsed.data.code))
                  .limit(1)
              )[0]?.parentId ?? ''
            ),
            eq(parentChildRelationships.childId, profile.id)
          )
        )
        .limit(1)

      if (link) {
        return NextResponse.json({ success: true, relationshipId: link.id })
      }
    }

    console.error('Redeem error:', error)
    return NextResponse.json({ success: false, error: 'Failed to redeem code' }, { status: 500 })
  }
}
