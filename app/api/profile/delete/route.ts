import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAuthApi } from '@/lib/auth/session'
import { deleteAccount } from '@/lib/db/queries/profile'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password confirmation is required to delete your account' },
        { status: 400 }
      )
    }

    const [currentUser] = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!currentUser?.password) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, currentUser.password)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 400 })
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
