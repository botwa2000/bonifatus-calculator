import { NextResponse } from 'next/server'
import { requireAuthApi, getUserProfile } from '@/lib/auth/session'
import { getSettlementsForParent, getSettlementsForChild } from '@/lib/db/queries/settlements'

export async function GET() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ success: false, error: 'No profile found' }, { status: 404 })
    }

    if (profile.role === 'parent') {
      const settlements = await getSettlementsForParent(profile.id)
      return NextResponse.json({ success: true, settlements })
    }

    if (profile.role === 'child') {
      const settlements = await getSettlementsForChild(profile.id)
      return NextResponse.json({ success: true, settlements })
    }

    return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 403 })
  } catch (error) {
    console.error('[settlements/list] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load settlements' },
      { status: 500 }
    )
  }
}
