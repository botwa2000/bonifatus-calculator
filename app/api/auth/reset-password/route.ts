import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { verificationCodes } from '@/drizzle/schema/security'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { logSecurityEvent } from '@/lib/db/queries/security'
import { getClientIp } from '@/lib/auth/turnstile'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  newPassword: z.string().min(12, 'Password must be at least 12 characters'),
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

    const { email: rawEmail, code, newPassword } = parsed.data
    const email = rawEmail.toLowerCase()
    const clientIp = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent') || undefined

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code' },
        { status: 400 }
      )
    }
    const userId = user.id

    // Find the active reset code
    const [record] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.code, code),
          eq(verificationCodes.purpose, 'password_reset'),
          isNull(verificationCodes.verifiedAt)
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1)

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code' },
        { status: 400 }
      )
    }

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

    // Mark code verified
    await db
      .update(verificationCodes)
      .set({ verifiedAt: new Date() })
      .where(eq(verificationCodes.id, record.id))

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId))

    await logSecurityEvent({
      eventType: 'password_reset',
      severity: 'info',
      userId,
      ipAddress: clientIp || '0.0.0.0',
      userAgent: userAgent || null,
      metadata: { action: 'password_reset_complete' },
    })

    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
