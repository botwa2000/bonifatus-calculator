import { NextRequest, NextResponse, after } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { accounts, users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes, securityEvents } from '@/drizzle/schema/security'
import { eq, and, gt, isNull, count } from 'drizzle-orm'
import { verifyTurnstileToken, getClientIp } from '@/lib/auth/turnstile'
import { validateMobileToken } from '@/lib/auth/validate-mobile-token'
import { sendEmail } from '@/lib/email/service'
import { getPasswordResetCodeEmail, getPasswordSetupCodeEmail } from '@/lib/email/templates'
import { generateCode } from '@/lib/auth/generate-code'

// Rate limits
const IP_HOURLY_LIMIT = 5
const USER_DAILY_LIMIT = 2 // intentionally low — legitimate users rarely need more than 2/day
const USER_COOLDOWN_MS = 15 * 60_000 // 15 minutes between codes for the same user
const CODE_TTL_MIN = 15

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

/**
 * Looks the address up and, if it has an account and isn't rate-limited, mails a code.
 * Runs after the response has been sent, so neither the answer nor its timing tells
 * the requester whether the address is registered.
 */
async function issueResetCode(email: string, ip: string, userAgent: string | null, source: string) {
  // IP rate limit: max 5 reset emails per IP per hour (guards against enumeration/spam)
  const [ipCount] = await db
    .select({ n: count() })
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.ipAddress, ip),
        eq(verificationCodes.purpose, 'password_reset'),
        gt(verificationCodes.createdAt, new Date(Date.now() - 60 * 60_000))
      )
    )
  if ((ipCount?.n ?? 0) >= IP_HOURLY_LIMIT) {
    await auditLog({
      eventType: 'rate_limit_exceeded',
      severity: 'warning',
      ipAddress: ip,
      userAgent,
      metadata: { reason: 'ip_hourly', email, source, count: ipCount?.n },
    })
    return
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) return

  // Hard daily cap: max 2 reset emails per user per 24 hours, regardless of IP.
  // This is the primary defence against persistent targeted spam — it can't be
  // bypassed by rotating IPs or solving Turnstile from multiple addresses.
  const [dailyCount] = await db
    .select({ n: count() })
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.userId, user.id),
        eq(verificationCodes.purpose, 'password_reset'),
        gt(verificationCodes.createdAt, new Date(Date.now() - 24 * 60 * 60_000))
      )
    )
  if ((dailyCount?.n ?? 0) >= USER_DAILY_LIMIT) {
    await auditLog({
      eventType: 'rate_limit_exceeded',
      severity: 'warning',
      userId: user.id,
      ipAddress: ip,
      userAgent,
      metadata: { reason: 'user_daily', email, source, count: dailyCount?.n },
    })
    return
  }

  // One email per 15 minutes per user. Intentionally does NOT filter by verifiedAt:
  // the invalidation step below marks old codes as verified, and that must not reset
  // the cooldown window.
  const [recentCode] = await db
    .select({ id: verificationCodes.id, createdAt: verificationCodes.createdAt })
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.userId, user.id),
        eq(verificationCodes.purpose, 'password_reset'),
        gt(verificationCodes.createdAt, new Date(Date.now() - USER_COOLDOWN_MS))
      )
    )
    .limit(1)
  if (recentCode) {
    await auditLog({
      eventType: 'rate_limit_exceeded',
      severity: 'warning',
      userId: user.id,
      ipAddress: ip,
      userAgent,
      metadata: { reason: 'user_cooldown', email, source, lastSentAt: recentCode.createdAt },
    })
    return
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
  await db.insert(verificationCodes).values({
    userId: user.id,
    email: user.email,
    code,
    purpose: 'password_reset',
    expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000),
    ipAddress: ip,
    userAgent,
  })

  const [profile] = await db
    .select({ fullName: userProfiles.fullName })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1)
  const name = profile?.fullName || 'User'

  // An account made with Google or Apple has no password to reset: say how they sign
  // in, and let the same code set a password if they want one.
  let template = getPasswordResetCodeEmail(code, name, CODE_TTL_MIN)
  if (!user.password) {
    const linked = await db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(eq(accounts.userId, user.id))
    template = getPasswordSetupCodeEmail(
      code,
      name,
      linked.map((a) => a.provider),
      CODE_TTL_MIN
    )
  }
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
    ipAddress: ip,
    userAgent,
    metadata: { email: user.email, source, hasPassword: !!user.password },
  })
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

    const userAgent = request.headers.get('user-agent')
    after(() =>
      issueResetCode(email, clientIp || '0.0.0.0', userAgent, isMobile ? 'mobile' : 'web').catch(
        (error) => console.error('Forgot password error:', error)
      )
    )

    // Always the same answer, sent before any lookup, to prevent email enumeration.
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
