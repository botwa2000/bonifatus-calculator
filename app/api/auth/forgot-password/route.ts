import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes } from '@/drizzle/schema/security'
import { eq, and, gt, isNull, count } from 'drizzle-orm'
import { verifyTurnstileToken, getClientIp } from '@/lib/auth/turnstile'
import { validateMobileToken } from '@/lib/auth/validate-mobile-token'
import { sendEmail } from '@/lib/email/service'
import { getPasswordResetCodeEmail } from '@/lib/email/templates'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  turnstileToken: z.string().optional(),
})

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { email: rawEmail, turnstileToken } = parsed.data
    const email = rawEmail.toLowerCase()
    const clientIp = getClientIp(request.headers)

    // Skip Turnstile for verified mobile clients only — validate the HMAC signature
    const mobileToken = request.headers.get('X-Mobile-Client-Token')
    const isMobile = validateMobileToken(mobileToken, '/api/auth/forgot-password')
    if (!isMobile) {
      if (!turnstileToken) {
        return NextResponse.json(
          { success: false, error: 'Bot verification required.' },
          { status: 400 }
        )
      }
      const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp)
      if (!turnstileResult.success) {
        return NextResponse.json(
          { success: false, error: 'Bot verification failed. Please try again.' },
          { status: 400 }
        )
      }
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.',
    })

    // IP rate limit: max 5 reset emails per IP per hour (guards against enumeration/spam)
    const ipRateLimitSince = new Date(Date.now() - 60 * 60_000)
    const [ipCount] = await db
      .select({ n: count() })
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.ipAddress, clientIp || '0.0.0.0'),
          eq(verificationCodes.purpose, 'password_reset'),
          gt(verificationCodes.createdAt, ipRateLimitSince)
        )
      )
    if ((ipCount?.n ?? 0) >= 5) return successResponse

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) return successResponse

    const [profile] = await db
      .select({ fullName: userProfiles.fullName })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1)

    // Hard daily cap: max 5 reset emails per user per 24 hours, regardless of IP.
    // This is the primary defence against persistent targeted spam — it can't be
    // bypassed by rotating IPs or solving Turnstile from multiple addresses.
    const dailyLimitSince = new Date(Date.now() - 24 * 60 * 60_000)
    const [dailyCount] = await db
      .select({ n: count() })
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.purpose, 'password_reset'),
          gt(verificationCodes.createdAt, dailyLimitSince)
        )
      )
    if ((dailyCount?.n ?? 0) >= 5) return successResponse

    // Server-side rate limit: one email per 3 minutes per user.
    // Intentionally does NOT filter by verifiedAt — when the invalidation step below
    // marks an old code as verified, that must not reset the cooldown window, otherwise
    // back-to-back requests (at the 60 s boundary) bypass the limit entirely.
    const cooldownSince = new Date(Date.now() - 3 * 60_000)
    const [recentCode] = await db
      .select({ id: verificationCodes.id })
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.purpose, 'password_reset'),
          gt(verificationCodes.createdAt, cooldownSince)
        )
      )
      .limit(1)
    if (recentCode) return successResponse

    // Invalidate old codes
    await db
      .update(verificationCodes)
      .set({ verifiedAt: new Date() })
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.purpose, 'password_reset'),
          isNull(verificationCodes.verifiedAt)
        )
      )

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    const userAgent = request.headers.get('user-agent') || undefined

    await db.insert(verificationCodes).values({
      userId: user.id,
      email: user.email,
      code,
      purpose: 'password_reset',
      expiresAt,
      ipAddress: clientIp || '0.0.0.0',
      userAgent: userAgent || null,
    })

    const template = getPasswordResetCodeEmail(code, profile?.fullName || 'User', 15)
    await sendEmail({
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    // Audit log — helps trace automated/unexpected reset requests
    console.log('[forgot-password] reset email sent', {
      userId: user.id,
      email: user.email,
      source: isMobile ? 'mobile' : 'web',
      ip: clientIp,
      userAgent: request.headers.get('user-agent'),
    })

    return successResponse
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
