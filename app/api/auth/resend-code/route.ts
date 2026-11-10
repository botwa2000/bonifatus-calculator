import { NextRequest, NextResponse, after } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes } from '@/drizzle/schema/security'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { getClientIp } from '@/lib/auth/turnstile'
import { sendEmail } from '@/lib/email/service'
import { getVerificationCodeEmail } from '@/lib/email/templates'
import { generateCode } from '@/lib/auth/generate-code'

const CODE_TTL_MIN = 15
const RESEND_COOLDOWN_MS = 3 * 60_000

const resendSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  purpose: z.enum(['email_verification', 'password_reset']).default('email_verification'),
})

/**
 * Mails a new verification code if the id is a pending (unverified) account and the
 * last code is older than the cooldown. Otherwise does nothing.
 */
async function resend(userId: string, ip: string, userAgent: string | null) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user || user.emailVerified) return

  const [recent] = await db
    .select({ id: verificationCodes.id })
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.userId, userId),
        eq(verificationCodes.purpose, 'email_verification'),
        gt(verificationCodes.createdAt, new Date(Date.now() - RESEND_COOLDOWN_MS))
      )
    )
    .limit(1)
  if (recent) return

  const [profile] = await db
    .select({ fullName: userProfiles.fullName })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1)

  await db
    .update(verificationCodes)
    .set({ verifiedAt: new Date() })
    .where(
      and(
        eq(verificationCodes.userId, userId),
        eq(verificationCodes.purpose, 'email_verification'),
        isNull(verificationCodes.verifiedAt)
      )
    )

  const code = generateCode()
  await db.insert(verificationCodes).values({
    userId,
    email: user.email,
    code,
    purpose: 'email_verification',
    expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000),
    ipAddress: ip,
    userAgent,
  })

  const template = getVerificationCodeEmail(code, profile?.fullName || user.email, CODE_TTL_MIN)
  const sent = await sendEmail({
    to: user.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  })
  if (!sent) console.error('[resend-code] email not sent', { userId })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = resendSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { userId, purpose } = parsed.data

    // password_reset resend must come from the forgot-password flow, not arbitrary callers
    if (purpose === 'password_reset') {
      return NextResponse.json(
        { success: false, error: 'Use the forgot-password flow to resend a reset code.' },
        { status: 403 }
      )
    }

    // Same answer whatever the id is (sign-up hands out ids that belong to no account
    // when the email is already registered), and the work happens after the response.
    // Within the cooldown nothing is sent; the previous code is still valid then.
    const ip = getClientIp(request.headers) || '0.0.0.0'
    const userAgent = request.headers.get('user-agent')
    after(() =>
      resend(userId, ip, userAgent).catch((error) => console.error('Resend code error:', error))
    )

    return NextResponse.json({
      success: true,
      message: 'If this sign-up is waiting for confirmation, a new code is on its way.',
    })
  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
