import { NextRequest, NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth/session'
import { getBonusFactors } from '@/lib/db/queries/config'

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
    console.error('[grades/factors] unexpected error', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while loading factors' },
      { status: 500 }
    )
  }
}
