import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes } from '@/drizzle/schema/security'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { getClientIp } from '@/lib/auth/turnstile'
import { sendEmail } from '@/lib/email/service'
import { logSecurityEvent } from '@/lib/db/queries/security'

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { code } = parsed.data
    const clientIp = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent') || undefined

    // Find the most recent unverified email change code for this user
    const [record] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.purpose, 'email_verification'),
          isNull(verificationCodes.verifiedAt)
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1)

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: 'No pending email change request found. Please request a new code.',
        },
        { status: 400 }
      )
    }

    // Check if expired
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check max attempts
    if (record.attemptCount >= record.maxAttempts) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check if code matches
    if (record.code !== code) {
      // Increment attempt count
      await db
        .update(verificationCodes)
        .set({ attemptCount: record.attemptCount + 1 })
        .where(eq(verificationCodes.id, record.id))

      return NextResponse.json(
        { success: false, error: 'Invalid code. Please check the code and try again.' },
        { status: 400 }
      )
    }

    // Get old email before updating
    const [currentUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const oldEmail = currentUser.email
    const newEmail = record.email

    // Mark code as verified
    await db
      .update(verificationCodes)
      .set({ verifiedAt: new Date() })
      .where(eq(verificationCodes.id, record.id))

    // Update user email and mark as verified
    await db
      .update(users)
      .set({ email: newEmail, emailVerified: new Date() })
      .where(eq(users.id, user.id))

    // Get user profile name for the notification email
    const [profile] = await db
      .select({ fullName: userProfiles.fullName })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1)

    const userName = profile?.fullName || 'User'

    // Send notification to old email
    const subject = 'Your Bonifatus Email Has Been Changed'

    const text = `
Hello ${userName},

Your Bonifatus account email has been changed to ${newEmail}.

If you did not make this change, please contact our support team immediately.

Best regards,
The Bonifatus Team

---
Bonifatus - Motivating Academic Excellence
https://bonifatus.com
    `.trim()

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Bonifatus</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Email Address Changed</h2>

              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hello ${userName},
              </p>

              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your Bonifatus account email has been changed to:
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 20px; background-color: #f7fafc; border-radius: 8px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 600; color: #667eea;">
                      ${newEmail}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #e53e3e; font-size: 14px; line-height: 1.6;">
                <strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                Best regards,<br>
                <strong>The Bonifatus Team</strong>
              </p>
              <p style="margin: 20px 0 0; color: #a0aec0; font-size: 12px;">
                Bonifatus - Motivating Academic Excellence<br>
                <a href="https://bonifatus.com" style="color: #667eea; text-decoration: none;">bonifatus.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    await sendEmail({ to: oldEmail, subject, text, html })

    // Log security event
    await logSecurityEvent({
      eventType: 'email_change',
      severity: 'info',
      userId: user.id,
      ipAddress: clientIp || '0.0.0.0',
      userAgent: userAgent || null,
      metadata: { oldEmail, newEmail },
    })

    return NextResponse.json({ success: true, message: 'Email address updated successfully.' })
  } catch (error) {
    console.error('Change email verify error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
