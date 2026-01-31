import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { parentChildInvites } from '@/drizzle/schema/relationships'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  expiresInMinutes: z
    .number()
    .int()
    .min(1)
    .max(60 * 24 * 7)
    .optional(),
})

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile()
  if (!profile || profile.role !== 'parent') {
    return NextResponse.json({ success: false, error: 'Only parents can invite' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid payload', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const expiresInMinutes = Math.min(parsed.data.expiresInMinutes ?? 15, 15)

  // best-effort uniqueness: retry up to 5 times
  let code = generateCode()
  for (let i = 0; i < 5; i += 1) {
    const [existing] = await db
      .select({ id: parentChildInvites.id })
      .from(parentChildInvites)
      .where(and(eq(parentChildInvites.code, code), eq(parentChildInvites.status, 'pending')))
      .limit(1)
    if (!existing) break
    code = generateCode()
  }

  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  try {
    const [invite] = await db
      .insert(parentChildInvites)
      .values({
        parentId: profile.id,
        code,
        status: 'pending',
        expiresAt,
      })
      .returning({
        id: parentChildInvites.id,
        code: parentChildInvites.code,
        expiresAt: parentChildInvites.expiresAt,
        status: parentChildInvites.status,
      })

    return NextResponse.json({ success: true, invite }, { status: 200 })
  } catch (error) {
    console.error('Create invite error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create invite' }, { status: 500 })
  }
}
