import { NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth/session'
import { deleteAccount } from '@/lib/db/queries/profile'

export async function POST() {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    await deleteAccount(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while deleting account' },
      { status: 500 }
    )
  }
}
