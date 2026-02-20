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

const saveSchema = z.object({
  gradingSystemId: z.string().uuid(),
  classLevel: z.number().int().min(1).max(20),
  termType: z.string().min(1).max(30),
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
  const parsed = saveSchema.safeParse(body)

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

    const targetChildId = normalizedChildId ?? user.id
    const termId = crypto.randomUUID()

    await db.transaction(async (tx) => {
      await tx.insert(termGrades).values({
        id: termId,
        childId: targetChildId,
        schoolYear: payload.schoolYear,
        termType: payload.termType,
        gradingSystemId: payload.gradingSystemId,
        classLevel: payload.classLevel,
        termName: payload.termName ?? null,
        status: 'submitted',
        totalBonusPoints: calc.total,
      })

      const subjectRows = calc.breakdown.map((item: CalculatorSubjectResult, idx: number) => ({
        termGradeId: termId,
        subjectId: payload.subjects[idx]?.subjectId,
        gradeValue: payload.subjects[idx]?.grade,
        gradeNumeric: item.numericValue,
        gradeNormalized100: item.normalized,
        gradeQualityTier: item.tier ?? null,
        subjectWeight: payload.subjects[idx]?.weight ?? item.weight ?? 1,
        bonusPoints: item.bonus,
      }))

      await tx.insert(subjectGrades).values(subjectRows)
    })

    return NextResponse.json({
      success: true,
      termId,
      totalBonusPoints: calc.total,
      subjects: calc.breakdown,
    })
  } catch (error) {
    console.error('Save grades error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while saving grades' },
      { status: 500 }
    )
  }
}
