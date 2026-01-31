import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireAuthApi } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { eq } from 'drizzle-orm'

const schema = z.object({
  newPassword: z.string().min(12),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 12 characters' },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
    await db.update(users).set({ password: hashed }).where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update password error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error while updating password' },
      { status: 500 }
    )
  }
}
