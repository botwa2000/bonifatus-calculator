import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { pointValueConfig } from '@/drizzle/schema/payments'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { eq, and, isNull } from 'drizzle-orm'

const upsertSchema = z.object({
  pointValueCents: z.number().int().min(1),
  currency: z.string().min(1).max(10),
  cashPayoutPct: z.number().int().min(0).max(100),
  investmentPct: z.number().int().min(0).max(100),
  childId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile()
    if (!profile || profile.role !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Only parents can access point value config' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const childIdParam = searchParams.get('childId')
    const childId = childIdParam && childIdParam !== 'null' ? childIdParam : null

    const whereCondition = childId
      ? and(eq(pointValueConfig.parentId, user.id), eq(pointValueConfig.childId, childId))
      : and(eq(pointValueConfig.parentId, user.id), isNull(pointValueConfig.childId))

    const [config] = await db.select().from(pointValueConfig).where(whereCondition).limit(1)

    return NextResponse.json({ success: true, config: config || null })
  } catch (error) {
    console.error('[payments/point-value] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load point value config' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile()
    if (!profile || profile.role !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Only parents can update point value config' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = upsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { pointValueCents, currency, cashPayoutPct, investmentPct, childId } = parsed.data
    const normalizedChildId = childId && childId !== 'null' ? childId : null

    // Check if config already exists
    const whereCondition = normalizedChildId
      ? and(eq(pointValueConfig.parentId, user.id), eq(pointValueConfig.childId, normalizedChildId))
      : and(eq(pointValueConfig.parentId, user.id), isNull(pointValueConfig.childId))

    const [existing] = await db.select().from(pointValueConfig).where(whereCondition).limit(1)

    if (existing) {
      // Update
      const [updated] = await db
        .update(pointValueConfig)
        .set({
          pointValueCents,
          currency,
          cashPayoutPct,
          investmentPct,
          updatedAt: new Date(),
        })
        .where(eq(pointValueConfig.id, existing.id))
        .returning()

      return NextResponse.json({ success: true, config: updated })
    } else {
      // Insert
      const [created] = await db
        .insert(pointValueConfig)
        .values({
          parentId: user.id,
          childId: normalizedChildId,
          pointValueCents,
          currency,
          cashPayoutPct,
          investmentPct,
        })
        .returning()

      return NextResponse.json({ success: true, config: created })
    }
  } catch (error) {
    console.error('[payments/point-value] PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save point value config' },
      { status: 500 }
    )
  }
}
