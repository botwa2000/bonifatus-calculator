import { NextResponse } from 'next/server'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { getAcceptedChildren } from '@/lib/db/queries/relationships'
import { getUnsettledQuickGrades, getUnsettledSubjectGrades } from '@/lib/db/queries/settlements'

export async function GET() {
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

  try {
    const { profiles } = await getAcceptedChildren(profile.id)

    const children = await Promise.all(
      profiles.map(async (child) => {
        const [quickGrades, subjectGrades] = await Promise.all([
          getUnsettledQuickGrades(child.id),
          getUnsettledSubjectGrades(child.id),
        ])

        // Normalize both types into a common shape
        const grades = [
          ...quickGrades.map((g) => ({
            id: g.id,
            source: 'quick' as const,
            subjectId: g.subjectId,
            subjectName: g.subjectName,
            gradeValue: g.gradeValue,
            bonusPoints: g.bonusPoints,
            note: g.note,
            gradedAt: g.gradedAt,
            createdAt: g.createdAt,
            settlementStatus: g.settlementStatus,
            context: null as string | null,
          })),
          ...subjectGrades.map((g) => ({
            id: g.id,
            source: 'term' as const,
            subjectId: g.subjectId,
            subjectName: g.subjectName,
            gradeValue: g.gradeValue,
            bonusPoints: g.bonusPoints,
            note: null as string | null,
            gradedAt: g.createdAt,
            createdAt: g.createdAt,
            settlementStatus: g.settlementStatus,
            context: `${g.schoolYear} ${g.termType}`,
          })),
        ]

        return {
          childId: child.id,
          childName: child.fullName || 'Child',
          grades,
        }
      })
    )

    return NextResponse.json({ success: true, children })
  } catch (error) {
    console.error('[parent/children/unsettled-grades] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load unsettled grades' },
      { status: 500 }
    )
  }
}
