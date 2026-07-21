import { NextResponse } from 'next/server'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { getAcceptedChildren } from '@/lib/db/queries/relationships'
import {
  getChildQuickGrades,
  getChildTermSummariesForDashboard,
} from '@/lib/db/queries/settlements'

export async function GET() {
  try {
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

    const { relationships, profiles } = await getAcceptedChildren(profile.id)
    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))

    const childrenGrades = await Promise.all(
      relationships.map(async (rel) => {
        const [quickGrades, termSummaries] = await Promise.all([
          getChildQuickGrades(rel.childId),
          getChildTermSummariesForDashboard(rel.childId),
        ])
        // Combine individual quick-grades (notes) with one summary entry per term.
        // This prevents flooding the Kids tab with individual subject lines from test reports.
        const grades = [...quickGrades, ...termSummaries].sort(
          (a, b) => new Date(b.gradedAt ?? 0).getTime() - new Date(a.gradedAt ?? 0).getTime()
        )
        const child = profileMap[rel.childId]
        return {
          childId: rel.childId,
          childName: child?.fullName ?? 'Child',
          grades,
        }
      })
    )

    return NextResponse.json({ success: true, children: childrenGrades })
  } catch (error) {
    console.error('[parent/children/quick-grades] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load children quick grades' },
      { status: 500 }
    )
  }
}
