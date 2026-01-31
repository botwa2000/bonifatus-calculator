import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes } from '@/drizzle/schema/security'
import { eq, and, isNull } from 'drizzle-orm'
import { verifyTurnstileToken, getClientIp } from '@/lib/auth/turnstile'
import { sendEmail } from '@/lib/email/service'
import { getPasswordResetCodeEmail } from '@/lib/email/templates'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  turnstileToken: z.string().min(1).optional(),
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

    const { email, turnstileToken } = parsed.data
    const clientIp = getClientIp(request.headers)

    if (turnstileToken) {
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

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) return successResponse

    const [profile] = await db
      .select({ fullName: userProfiles.fullName })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1)

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

    return successResponse
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
