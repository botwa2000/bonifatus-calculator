import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes, securityEvents } from '@/drizzle/schema/security'
import { eq, and, gt, isNull, count } from 'drizzle-orm'
import { verifyTurnstileToken, getClientIp } from '@/lib/auth/turnstile'
import { validateMobileToken } from '@/lib/auth/validate-mobile-token'
import { sendEmail } from '@/lib/email/service'
import { getPasswordResetCodeEmail } from '@/lib/email/templates'
import { generateCode } from '@/lib/auth/generate-code'

// Rate limits
const IP_HOURLY_LIMIT = 5
const USER_DAILY_LIMIT = 2 // intentionally low — legitimate users rarely need more than 2/day
const USER_COOLDOWN_MS = 15 * 60_000 // 15 minutes between codes for the same user

async function auditLog(params: {
  eventType: 'password_reset' | 'rate_limit_exceeded'
  severity: 'info' | 'warning'
  userId?: string | null
  ipAddress: string
  userAgent: string | null
  metadata: Record<string, unknown>
}) {
  try {
    await db.insert(securityEvents).values({
      eventType: params.eventType,
      severity: params.severity,
      userId: params.userId ?? null,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      eventMetadata: params.metadata,
    })
    console.log(`[forgot-password:${params.eventType}]`, {
      severity: params.severity,
      ip: params.ipAddress,
      ...params.metadata,
    })
  } catch {
    // Never let logging break the response path
  }
}

const schema = z.object({
  email: z.string().email('Invalid email address'),
  turnstileToken: z.string().optional(),
})

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
    if ((ipCount?.n ?? 0) >= IP_HOURLY_LIMIT) {
      await auditLog({
        eventType: 'rate_limit_exceeded',
        severity: 'warning',
        ipAddress: clientIp || '0.0.0.0',
        userAgent: request.headers.get('user-agent'),
        metadata: {
          reason: 'ip_hourly',
          email,
          source: isMobile ? 'mobile' : 'web',
          count: ipCount?.n,
        },
      })
      return successResponse
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) return successResponse

    const [profile] = await db
      .select({ fullName: userProfiles.fullName })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1)

    // Hard daily cap: max 2 reset emails per user per 24 hours, regardless of IP.
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
    if ((dailyCount?.n ?? 0) >= USER_DAILY_LIMIT) {
      await auditLog({
        eventType: 'rate_limit_exceeded',
        severity: 'warning',
        userId: user.id,
        ipAddress: clientIp || '0.0.0.0',
        userAgent: request.headers.get('user-agent'),
        metadata: {
          reason: 'user_daily',
          email,
          source: isMobile ? 'mobile' : 'web',
          count: dailyCount?.n,
        },
      })
      return successResponse
    }

    // Server-side rate limit: one email per 15 minutes per user.
    // Intentionally does NOT filter by verifiedAt — when the invalidation step below
    // marks an old code as verified, that must not reset the cooldown window, otherwise
    // back-to-back requests (at the 60 s boundary) bypass the limit entirely.
    const cooldownSince = new Date(Date.now() - USER_COOLDOWN_MS)
    const [recentCode] = await db
      .select({ id: verificationCodes.id, createdAt: verificationCodes.createdAt })
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.purpose, 'password_reset'),
          gt(verificationCodes.createdAt, cooldownSince)
        )
      )
      .limit(1)
    if (recentCode) {
      await auditLog({
        eventType: 'rate_limit_exceeded',
        severity: 'warning',
        userId: user.id,
        ipAddress: clientIp || '0.0.0.0',
        userAgent: request.headers.get('user-agent'),
        metadata: {
          reason: 'user_cooldown',
          email,
          source: isMobile ? 'mobile' : 'web',
          lastSentAt: recentCode.createdAt,
        },
      })
      return successResponse
    }

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

    await auditLog({
      eventType: 'password_reset',
      severity: 'info',
      userId: user.id,
      ipAddress: clientIp || '0.0.0.0',
      userAgent: request.headers.get('user-agent'),
      metadata: { email: user.email, source: isMobile ? 'mobile' : 'web' },
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
