import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { securityEvents } from '@/drizzle/schema/security'
import { eq, and, gt, count } from 'drizzle-orm'
import { signMobileToken } from '@/lib/auth/mobile-token'
import { getClientIp } from '@/lib/auth/turnstile'
import { logSecurityEvent } from '@/lib/db/queries/security'

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
    const clientIp = getClientIp(request.headers) || '0.0.0.0'
    const userAgent = request.headers.get('user-agent') || undefined

    // IP-based rate limiting: max 10 failed logins per IP per 15 minutes
    const rateLimitSince = new Date(Date.now() - 15 * 60_000)
    const [ipFailures] = await db
      .select({ n: count() })
      .from(securityEvents)
      .where(
        and(
          eq(securityEvents.ipAddress, clientIp),
          eq(securityEvents.eventType, 'login_failure'),
          gt(securityEvents.createdAt, rateLimitSince)
        )
      )
    if ((ipFailures?.n ?? 0) >= 10) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user?.password) {
      await logSecurityEvent({
        eventType: 'login_failure',
        severity: 'warning',
        ipAddress: clientIp,
        userAgent: userAgent || null,
        metadata: { reason: 'user_not_found', source: 'mobile' },
      })
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(parsed.data.password, user.password)
    if (!isValid) {
      await logSecurityEvent({
        eventType: 'login_failure',
        severity: 'warning',
        userId: user.id,
        ipAddress: clientIp,
        userAgent: userAgent || null,
        metadata: { reason: 'wrong_password', source: 'mobile' },
      })
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
