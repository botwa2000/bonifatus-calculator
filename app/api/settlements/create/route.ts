import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { getAcceptedChildren } from '@/lib/db/queries/relationships'
import { createSettlement } from '@/lib/db/queries/settlements'

const schema = z.object({
  childId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).max(10),
  method: z.string().min(1).max(50),
  notes: z.string().max(500).optional(),
  splitConfig: z.record(z.string(), z.number()).optional(),
  quickGradeIds: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile()
    if (!profile || profile.role !== 'parent') {
      return NextResponse.json(
        { success: false, error: 'Only parents can create settlements' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Verify parent-child relationship
    const { profiles } = await getAcceptedChildren(profile.id)
    const childIds = profiles.map((p) => p.id)
    if (!childIds.includes(parsed.data.childId)) {
      return NextResponse.json(
        { success: false, error: 'Not connected to this child' },
        { status: 403 }
      )
    }

    const settlementId = await createSettlement({
      parentId: profile.id,
      childId: parsed.data.childId,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      method: parsed.data.method,
      notes: parsed.data.notes,
      splitConfig: parsed.data.splitConfig,
      quickGradeIds: parsed.data.quickGradeIds,
    })

    return NextResponse.json({ success: true, settlementId })
  } catch (error) {
    console.error('[settlements/create] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create settlement' },
      { status: 500 }
    )
  }
}
