import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes } from '@/drizzle/schema/security'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { logSecurityEvent } from '@/lib/db/queries/security'
import { getClientIp } from '@/lib/auth/turnstile'
import { sendEmail } from '@/lib/email/service'
import { getWelcomeEmail } from '@/lib/email/templates'

const verifySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  purpose: z.enum(['email_verification', 'password_reset']).default('email_verification'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = verifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { userId, code, purpose } = parsed.data
    const clientIp = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent') || undefined

    // Find the active verification code
    const [record] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.code, code),
          eq(verificationCodes.purpose, purpose),
          isNull(verificationCodes.verifiedAt)
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1)

    if (!record) {
      await logSecurityEvent({
        eventType: 'login_failure',
        severity: 'warning',
        userId,
        ipAddress: clientIp || '0.0.0.0',
        userAgent: userAgent || null,
        metadata: { reason: 'invalid_verification_code', purpose },
      })
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code. Please check the code and try again.' },
        { status: 400 }
      )
    }

    // Increment attempt count
    await db
      .update(verificationCodes)
      .set({ attemptCount: record.attemptCount + 1 })
      .where(eq(verificationCodes.id, record.id))

    if (record.attemptCount >= record.maxAttempts) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Request a new code.' },
        { status: 400 }
      )
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Code has expired. Request a new one.' },
        { status: 400 }
      )
    }

    // Mark code as verified
    await db
      .update(verificationCodes)
      .set({ verifiedAt: new Date() })
      .where(eq(verificationCodes.id, record.id))

    // Set emailVerified on user
    if (purpose === 'email_verification') {
      await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId))
    }

    // Send welcome email
    if (purpose === 'email_verification') {
      const [profile] = await db
        .select({ fullName: userProfiles.fullName, role: userProfiles.role })
        .from(userProfiles)
        .where(eq(userProfiles.id, userId))
        .limit(1)

      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (profile && user) {
        const template = getWelcomeEmail(profile.fullName, profile.role)
        await sendEmail({
          to: user.email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        })
      }
    }

    await logSecurityEvent({
      eventType: 'login_success',
      severity: 'info',
      userId,
      ipAddress: clientIp || '0.0.0.0',
      userAgent: userAgent || null,
      metadata: { action: 'email_verification', purpose },
    })

    return NextResponse.json({ success: true, message: 'Verification successful' })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
