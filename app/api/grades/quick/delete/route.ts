import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { quickGrades } from '@/drizzle/schema/quickGrades'
import { requireAuthApi } from '@/lib/auth/session'
import { eq, and } from 'drizzle-orm'

const schema = z.object({ id: z.string().uuid() })

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 })
  }

  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await db
      .delete(quickGrades)
      .where(and(eq(quickGrades.id, parsed.data.id), eq(quickGrades.childId, user.id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Quick grade delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while deleting quick grade' },
      { status: 500 }
    )
  }
}
