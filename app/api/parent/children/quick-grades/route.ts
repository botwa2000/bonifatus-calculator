import { NextResponse } from 'next/server'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { getAcceptedChildren } from '@/lib/db/queries/relationships'
import {
  getChildQuickGrades,
  getChildTermSubjectGradesForDashboard,
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
        const [quickGrades, termGrades] = await Promise.all([
          getChildQuickGrades(rel.childId),
          getChildTermSubjectGradesForDashboard(rel.childId),
        ])
        // Combine both grade sources; term grades fill the gap for children who
        // have calculator results but no ongoing quick grades yet
        const grades = [...quickGrades, ...termGrades].sort(
          (a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
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
