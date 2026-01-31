import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { parentChildRelationships } from '@/drizzle/schema/relationships'
import { eq } from 'drizzle-orm'

const schema = z.object({
  relationshipId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const user = await requireAuthApi()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid payload', details: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const [rel] = await db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.id, parsed.data.relationshipId))
      .limit(1)

    if (!rel) {
      return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 })
    }

    if (rel.parentId !== user.id && rel.childId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    await db.delete(parentChildRelationships).where(eq(parentChildRelationships.id, rel.id))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Remove connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove connection' },
      { status: 500 }
    )
  }
}
