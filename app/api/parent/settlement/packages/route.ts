import { NextResponse } from 'next/server'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { getAcceptedChildren } from '@/lib/db/queries/relationships'
import { getSettlementPackages } from '@/lib/db/queries/settlements'
import { db } from '@/lib/db/client'
import { userProfiles } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile()
    if (!profile || profile.role !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Only parents can view settlement packages' },
        { status: 403 }
      )
    }

    // Get parent's period preference
    const [parentRow] = await db
      .select({ settlementPeriodUnit: userProfiles.settlementPeriodUnit })
      .from(userProfiles)
      .where(eq(userProfiles.id, profile.id))
      .limit(1)
    const periodUnit = parentRow?.settlementPeriodUnit ?? 'monthly'

    const { relationships, profiles } = await getAcceptedChildren(profile.id)
    const childIds = relationships.map((r) => r.childId)
    const childNameMap = Object.fromEntries(profiles.map((p) => [p.id, p.fullName]))

    const packages = await getSettlementPackages(childIds, childNameMap, periodUnit)

    return NextResponse.json({ success: true, packages, periodUnit })
  } catch (error) {
    console.error('[parent/settlement/packages] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load settlement packages' },
      { status: 500 }
    )
  }
}
