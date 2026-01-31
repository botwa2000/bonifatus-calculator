import { NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth/session'
import { getUserGrades } from '@/lib/db/queries/grades'

export async function GET() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const terms = await getUserGrades(user.id)
    return NextResponse.json({ success: true, terms }, { status: 200 })
  } catch (err) {
    console.error('[grades/list] unexpected error', err)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while loading grades' },
      { status: 500 }
    )
  }
}
