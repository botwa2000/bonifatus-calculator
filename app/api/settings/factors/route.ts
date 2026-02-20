import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { userBonusFactors } from '@/drizzle/schema/bonuses'
import { requireAuthApi } from '@/lib/auth/session'
import { getBonusFactors } from '@/lib/db/queries/config'
import { eq, and, isNull } from 'drizzle-orm'

const VALID_FACTOR_TYPES = ['grade_tier', 'term_type', 'class_level'] as const
const VALID_GRADE_TIER_KEYS = ['best', 'second', 'third', 'below'] as const
const VALID_TERM_TYPE_KEYS = [
  'semester_1',
  'semester_2',
  'midterm',
  'final',
  'quarterly',
  'trimester',
] as const
const VALID_CLASS_LEVEL_KEYS = Array.from({ length: 13 }, (_, i) => `class_${i + 1}`)

function isValidFactorKey(factorType: string, factorKey: string): boolean {
  switch (factorType) {
    case 'grade_tier':
      return (VALID_GRADE_TIER_KEYS as readonly string[]).includes(factorKey)
    case 'term_type':
      return (VALID_TERM_TYPE_KEYS as readonly string[]).includes(factorKey)
    case 'class_level':
      return VALID_CLASS_LEVEL_KEYS.includes(factorKey)
    default:
      return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const childIdParam = searchParams.get('childId')
    const childId = childIdParam && childIdParam !== 'null' ? childIdParam : null

    const { defaults, overrides } = await getBonusFactors(user.id, childId)

    return NextResponse.json({ success: true, defaults, overrides }, { status: 200 })
  } catch (error) {
    console.error('[settings/factors] GET error', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while loading factors' },
      { status: 500 }
    )
  }
}

const putSchema = z.object({
  factors: z
    .array(
      z.object({
        factorType: z.enum(VALID_FACTOR_TYPES),
        factorKey: z.string().min(1).max(30),
        factorValue: z.number().finite(),
      })
    )
    .min(1),
  childId: z.string().uuid().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = putSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { factors, childId } = parsed.data
    const normalizedChildId = childId && childId !== 'null' ? childId : null

    // Validate each factor key against its type
    for (const factor of factors) {
      if (!isValidFactorKey(factor.factorType, factor.factorKey)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid factor key "${factor.factorKey}" for type "${factor.factorType}"`,
          },
          { status: 400 }
        )
      }
    }

    await db.transaction(async (tx) => {
      // Delete all existing overrides for this user + childId combination
      if (normalizedChildId) {
        await tx
          .delete(userBonusFactors)
          .where(
            and(
              eq(userBonusFactors.userId, user.id),
              eq(userBonusFactors.childId, normalizedChildId)
            )
          )
      } else {
        await tx
          .delete(userBonusFactors)
          .where(and(eq(userBonusFactors.userId, user.id), isNull(userBonusFactors.childId)))
      }

      // Insert new factor overrides
      if (factors.length > 0) {
        await tx.insert(userBonusFactors).values(
          factors.map((f) => ({
            userId: user.id,
            childId: normalizedChildId,
            factorType: f.factorType,
            factorKey: f.factorKey,
            factorValue: f.factorValue,
          }))
        )
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[settings/factors] PUT error', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while saving factors' },
      { status: 500 }
    )
  }
}
