import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { quickGrades } from '@/drizzle/schema/quickGrades'
import { subjects } from '@/drizzle/schema/grades'
import { requireAuthApi } from '@/lib/auth/session'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await db
      .select({
        id: quickGrades.id,
        subjectId: quickGrades.subjectId,
        gradingSystemId: quickGrades.gradingSystemId,
        classLevel: quickGrades.classLevel,
        gradeValue: quickGrades.gradeValue,
        gradeNormalized100: quickGrades.gradeNormalized100,
        gradeQualityTier: quickGrades.gradeQualityTier,
        bonusPoints: quickGrades.bonusPoints,
        note: quickGrades.note,
        gradedAt: quickGrades.gradedAt,
        createdAt: quickGrades.createdAt,
        subjectName: subjects.name,
      })
      .from(quickGrades)
      .leftJoin(subjects, eq(quickGrades.subjectId, subjects.id))
      .where(eq(quickGrades.childId, user.id))
      .orderBy(desc(quickGrades.createdAt))
      .limit(50)

    return NextResponse.json({ success: true, grades: rows })
  } catch (error) {
    console.error('Quick grade list error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while listing quick grades' },
      { status: 500 }
    )
  }
}
