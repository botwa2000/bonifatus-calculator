import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes } from '@/drizzle/schema/security'
import { eq, and, isNull, desc, gt } from 'drizzle-orm'
import { getClientIp } from '@/lib/auth/turnstile'
import { sendEmail } from '@/lib/email/service'
import { getVerificationCodeEmail, getPasswordResetCodeEmail } from '@/lib/email/templates'

const resendSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  purpose: z.enum(['email_verification', 'password_reset']).default('email_verification'),
})

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
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

    // Get user info
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const [profile] = await db
      .select({ fullName: userProfiles.fullName })
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1)

    if (!profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check for existing active code
    const [activeCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.purpose, purpose),
          isNull(verificationCodes.verifiedAt),
          gt(verificationCodes.expiresAt, new Date())
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1)

    if (activeCode) {
      const timeRemaining = activeCode.expiresAt.getTime() - Date.now()
      if (timeRemaining > 30000) {
        const minutesRemaining = Math.ceil(timeRemaining / 60000)
        return NextResponse.json(
          {
            success: false,
            error: `A verification code was already sent. Please wait ${minutesRemaining} minute(s) before requesting a new one.`,
            expiresAt: activeCode.expiresAt,
          },
          { status: 429 }
        )
      }
    }

    // Invalidate old codes
    await db
      .update(verificationCodes)
      .set({ verifiedAt: new Date() })
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.purpose, purpose),
          isNull(verificationCodes.verifiedAt)
        )
      )

    // Generate new code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    const clientIp = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent') || undefined

    await db.insert(verificationCodes).values({
      userId,
      email: user.email,
      code,
      purpose,
      expiresAt,
      ipAddress: clientIp || '0.0.0.0',
      userAgent: userAgent || null,
    })

    const template =
      purpose === 'password_reset'
        ? getPasswordResetCodeEmail(code, profile.fullName, 15)
        : getVerificationCodeEmail(code, profile.fullName, 15)

    const emailSent = await sendEmail({
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
