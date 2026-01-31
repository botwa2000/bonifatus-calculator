import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi } from '@/lib/auth/session'
import { getTermGrade, deleteTermGrade } from '@/lib/db/queries/grades'

const schema = z.object({
  termId: z.string().uuid(),
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

    const term = await getTermGrade(parsed.data.termId)
    if (!term) {
      return NextResponse.json({ success: false, error: 'Term not found' }, { status: 404 })
    }

    if (term.childId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    await deleteTermGrade(parsed.data.termId)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete term error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while deleting term' },
      { status: 500 }
    )
  }
}
