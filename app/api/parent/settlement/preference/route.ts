import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { userProfiles } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'

const VALID_UNITS = ['weekly', 'monthly', 'quarterly'] as const
const schema = z.object({
  periodUnit: z.enum(VALID_UNITS),
})

export async function GET() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const profile = await getUserProfile()
    if (!profile || profile.role !== 'parent') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    const [row] = await db
      .select({ settlementPeriodUnit: userProfiles.settlementPeriodUnit })
      .from(userProfiles)
      .where(eq(userProfiles.id, profile.id))
      .limit(1)
    return NextResponse.json({ success: true, periodUnit: row?.settlementPeriodUnit ?? 'monthly' })
  } catch (error) {
    console.error('[settlement/preference GET] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load preference' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const profile = await getUserProfile()
    if (!profile || profile.role !== 'parent') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid periodUnit. Must be weekly, monthly, or quarterly.' },
        { status: 400 }
      )
    }
    await db
      .update(userProfiles)
      .set({ settlementPeriodUnit: parsed.data.periodUnit, updatedAt: new Date() })
      .where(eq(userProfiles.id, profile.id))
    return NextResponse.json({ success: true, periodUnit: parsed.data.periodUnit })
  } catch (error) {
    console.error('[settlement/preference PATCH] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update preference' },
      { status: 500 }
    )
  }
}
