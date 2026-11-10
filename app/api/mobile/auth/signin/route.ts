import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { userProfiles } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'
import { signMobileToken } from '@/lib/auth/mobile-token'
import { getClientIp } from '@/lib/auth/turnstile'
import { passwordSignIn } from '@/lib/auth/credentials'
import { withActionLog } from '@/lib/stats/with-action-log'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase()
    const result = await passwordSignIn(email, parsed.data.password, {
      ip: getClientIp(request.headers) || '0.0.0.0',
      userAgent: request.headers.get('user-agent'),
      source: 'mobile',
    })
    if (result.status === 'rate_limited') {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many failed attempts. Please try again later.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      )
    }
    if (result.status === 'invalid') {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }
    // Only reachable with the correct password, so it reveals nothing to a guesser.
    if (result.status === 'unverified') {
      return NextResponse.json(
        { success: false, error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' },
        { status: 403 }
      )
    }
    const { user } = result

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

export const POST = withActionLog('signin', handlePost, {
  provider: 'password',
  userId: (b) => (b.user as { id?: string } | undefined)?.id,
})
