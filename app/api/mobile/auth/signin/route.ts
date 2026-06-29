import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'
import { signMobileToken } from '@/lib/auth/mobile-token'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase()

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user?.password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(parsed.data.password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email not verified',
          code: 'EMAIL_NOT_VERIFIED',
          userId: user.id,
          email,
        },
        { status: 403 }
      )
    }

    const [profile] = await db
      .select({ role: userProfiles.role, fullName: userProfiles.fullName })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1)

    const role = (profile?.role ?? 'child') as 'parent' | 'child' | 'admin'

    const token = await signMobileToken({ userId: user.id, role, email })

    return NextResponse.json({
      success: true,
      accessToken: token,
      user: {
        id: user.id,
        email,
        name: profile?.fullName ?? user.name ?? '',
        role,
      },
    })
  } catch (err) {
    console.error('[mobile/auth/signin]', err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
