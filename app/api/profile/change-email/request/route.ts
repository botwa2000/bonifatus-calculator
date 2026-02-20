import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthApi } from '@/lib/auth/session'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes } from '@/drizzle/schema/security'
import { eq, and, isNull } from 'drizzle-orm'
import { getClientIp } from '@/lib/auth/turnstile'
import { sendEmail } from '@/lib/email/service'

const schema = z.object({
  newEmail: z.string().email('Invalid email address'),
})

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

    const { newEmail } = parsed.data

    // Get current user email
    const [currentUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check that new email is different from current
    if (currentUser.email.toLowerCase() === newEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'New email must be different from your current email.' },
        { status: 400 }
      )
    }

    // Check that new email is not already in use
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, newEmail.toLowerCase()))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'This email address is already in use.' },
        { status: 409 }
      )
    }

    // Invalidate old email change codes for this user
    await db
      .update(verificationCodes)
      .set({ verifiedAt: new Date() })
      .where(
        and(
          eq(verificationCodes.userId, user.id),
          eq(verificationCodes.purpose, 'email_verification'),
          isNull(verificationCodes.verifiedAt)
        )
      )

    // Generate and store verification code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    const clientIp = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent') || undefined

    await db.insert(verificationCodes).values({
      userId: user.id,
      email: newEmail,
      code,
      purpose: 'email_verification',
      expiresAt,
      ipAddress: clientIp || '0.0.0.0',
      userAgent: userAgent || null,
    })

    // Get user profile name for the email template
    const [profile] = await db
      .select({ fullName: userProfiles.fullName })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1)

    const userName = profile?.fullName || 'User'

    // Send verification code to the new email
    const subject = 'Verify Your New Email Address - Bonifatus'

    const text = `
Hello ${userName},

You requested to change your Bonifatus account email to this address.

Your verification code is: ${code}

This code will expire in 15 minutes.

If you didn't request this change, please ignore this email.

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
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Verify Your New Email</h2>

              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hello ${userName},
              </p>

              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                You requested to change your Bonifatus account email to this address. Please enter the following verification code to confirm:
              </p>

              <!-- Verification Code Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 30px; background-color: #f7fafc; border-radius: 8px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                      ${code}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>15 minutes</strong>.
              </p>

              <p style="margin: 20px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If you didn't request this change, you can safely ignore this email.
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

    const emailSent = await sendEmail({ to: newEmail, subject, text, html })
    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your new email address.',
    })
  } catch (error) {
    console.error('Change email request error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
