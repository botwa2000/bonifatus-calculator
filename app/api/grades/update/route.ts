import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { termGrades, subjectGrades, gradingSystems, subjects } from '@/drizzle/schema/grades'
import { requireAuthApi } from '@/lib/auth/session'
import { getBonusFactors } from '@/lib/db/queries/config'
import {
  calculateBonus,
  type CalculatorInput,
  type CalculatorSubjectResult,
} from '@/lib/calculator/engine'
import { eq, and, inArray } from 'drizzle-orm'

const updateSchema = z.object({
  termId: z.string().uuid(),
  gradingSystemId: z.string().uuid(),
  classLevel: z.number().int().min(1).max(20),
  termType: z.enum(['midterm', 'final', 'semester', 'quarterly']),
  schoolYear: z.string().min(4).max(15),
  termName: z.string().max(50).optional(),
  childId: z.string().uuid().optional(),
  subjects: z
    .array(
      z.object({
        subjectId: z.string().uuid(),
        subjectName: z.string().min(1).max(120).optional(),
        grade: z.string().min(1),
        weight: z.number().min(0.1).max(10).default(1),
      })
    )
    .min(1),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const payload = parsed.data
  const normalizedChildId = payload.childId && payload.childId !== 'null' ? payload.childId : null

  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [existingTerm] = await db
      .select()
      .from(termGrades)
      .where(eq(termGrades.id, payload.termId))
      .limit(1)

    if (!existingTerm) {
      return NextResponse.json({ success: false, error: 'Term not found' }, { status: 404 })
    }

    if (existingTerm.childId !== (normalizedChildId ?? user.id)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

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

    const { defaults, overrides } = await getBonusFactors(user.id, normalizedChildId)

    const subjectIds = payload.subjects.map((s) => s.subjectId)
    const subjectRows = await db
      .select({ id: subjects.id, isCoreSubject: subjects.isCoreSubject })
      .from(subjects)
      .where(inArray(subjects.id, subjectIds))
    const coreMap = new Map(subjectRows.map((s) => [s.id, s.isCoreSubject ?? false]))

    const calc = calculateBonus({
      gradingSystem: gradingSystem as CalculatorInput['gradingSystem'],
      factors: {
        defaults: defaults as CalculatorInput['factors']['defaults'],
        overrides: overrides as CalculatorInput['factors']['overrides'],
      },
      classLevel: payload.classLevel,
      termType: payload.termType,
      subjects: payload.subjects.map((s) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        grade: s.grade,
        weight: s.weight,
        isCoreSubject: coreMap.get(s.subjectId) ?? false,
      })),
    })

    await db.transaction(async (tx) => {
      await tx
        .update(termGrades)
        .set({
          schoolYear: payload.schoolYear,
          termType: payload.termType,
          gradingSystemId: payload.gradingSystemId,
          classLevel: payload.classLevel,
          termName: payload.termName ?? null,
          status: 'submitted',
          totalBonusPoints: calc.total,
          updatedAt: new Date(),
        })
        .where(eq(termGrades.id, payload.termId))

      await tx.delete(subjectGrades).where(eq(subjectGrades.termGradeId, payload.termId))

      const subjectRows = calc.breakdown.map((item: CalculatorSubjectResult, idx: number) => ({
        termGradeId: payload.termId,
        subjectId: payload.subjects[idx]?.subjectId,
        gradeValue: payload.subjects[idx]?.grade,
        gradeNumeric: item.normalized,
        gradeNormalized100: item.normalized,
        gradeQualityTier: item.tier ?? null,
        subjectWeight: payload.subjects[idx]?.weight ?? item.weight ?? 1,
        bonusPoints: item.bonus,
      }))

      await tx.insert(subjectGrades).values(subjectRows)
    })

    return NextResponse.json({
      success: true,
      termId: payload.termId,
      totalBonusPoints: calc.total,
      subjects: calc.breakdown,
    })
  } catch (error) {
    console.error('Update grades error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while updating grades' },
      { status: 500 }
    )
  }
}
