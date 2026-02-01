import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { quickGrades } from '@/drizzle/schema/quickGrades'
import { gradingSystems, subjects } from '@/drizzle/schema/grades'
import { requireAuthApi } from '@/lib/auth/session'
import { getBonusFactors } from '@/lib/db/queries/config'
import { calculateSingleGradeBonus } from '@/lib/calculator/engine'
import type { CalculatorInput } from '@/lib/calculator/engine'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  subjectId: z.string().uuid(),
  gradingSystemId: z.string().uuid(),
  classLevel: z.number().int().min(1).max(20),
  gradeValue: z.string().min(1),
  note: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = parsed.data

    const [gradingSystem] = await db
      .select()
      .from(gradingSystems)
      .where(and(eq(gradingSystems.id, payload.gradingSystemId), eq(gradingSystems.isActive, true)))
      .limit(1)

    if (!gradingSystem) {
      return NextResponse.json(
        { success: false, error: 'Grading system not found' },
        { status: 404 }
      )
    }

    const [subject] = await db
      .select({ id: subjects.id, isCoreSubject: subjects.isCoreSubject, name: subjects.name })
      .from(subjects)
      .where(eq(subjects.id, payload.subjectId))
      .limit(1)

    if (!subject) {
      return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 })
    }

    const { defaults, overrides } = await getBonusFactors(user.id, null)

    const result = calculateSingleGradeBonus({
      gradingSystem: gradingSystem as CalculatorInput['gradingSystem'],
      factors: {
        defaults: defaults as CalculatorInput['factors']['defaults'],
        overrides: overrides as CalculatorInput['factors']['overrides'],
      },
      classLevel: payload.classLevel,
      subject: {
        subjectId: payload.subjectId,
        grade: payload.gradeValue,
        isCoreSubject: subject.isCoreSubject ?? false,
      },
    })

    const id = crypto.randomUUID()
    await db.insert(quickGrades).values({
      id,
      childId: user.id,
      subjectId: payload.subjectId,
      gradingSystemId: payload.gradingSystemId,
      classLevel: payload.classLevel,
      gradeValue: payload.gradeValue,
      gradeNormalized100: result.normalized,
      gradeQualityTier: result.tier,
      bonusPoints: result.bonus,
      note: payload.note ?? null,
    })

    return NextResponse.json({
      success: true,
      quickGrade: {
        id,
        bonusPoints: result.bonus,
        normalized: result.normalized,
        tier: result.tier,
      },
    })
  } catch (error) {
    console.error('Quick grade save error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while saving quick grade' },
      { status: 500 }
    )
  }
}
