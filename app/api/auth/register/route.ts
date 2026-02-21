import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { verificationCodes } from '@/drizzle/schema/security'
import { eq } from 'drizzle-orm'
import { validatePassword } from '@/lib/auth/password-validation'
import { verifyTurnstileToken, getClientIp } from '@/lib/auth/turnstile'
import { logSecurityEvent } from '@/lib/db/queries/security'
import { sendEmail } from '@/lib/email/service'
import { getVerificationCodeEmail } from '@/lib/email/templates'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  role: z.enum(['parent', 'child']),
  turnstileToken: z.string().min(1, 'Bot verification required'),
})

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = registerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const {
      email: rawEmail,
      password,
      fullName,
      dateOfBirth,
      role,
      turnstileToken,
    } = validationResult.data
    const email = rawEmail.toLowerCase()

    const clientIp = getClientIp(request.headers)
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp)
    if (!turnstileResult.success) {
      return NextResponse.json(
        { success: false, error: 'Bot verification failed. Please try again.' },
        { status: 400 }
      )
    }

    const passwordValidation = await validatePassword(password, { email, name: fullName })
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      )
    }

    const dob = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()
    if (age < 5 || age > 150 || dob > today) {
      return NextResponse.json({ success: false, error: 'Invalid date of birth' }, { status: 400 })
    }

    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const userId = crypto.randomUUID()

    // Create user + profile in transaction
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        name: fullName,
        password: hashedPassword,
      })

      await tx.insert(userProfiles).values({
        id: userId,
        role,
        fullName,
        dateOfBirth,
      })
    })

    // Generate verification code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    const userAgent = request.headers.get('user-agent') || undefined

    await db.insert(verificationCodes).values({
      userId,
      email,
      code,
      purpose: 'email_verification',
      expiresAt,
      ipAddress: clientIp || '0.0.0.0',
      userAgent: userAgent || null,
    })

    // Send verification email
    const emailTemplate = getVerificationCodeEmail(code, fullName, 15)
    const emailSent = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    })

    await logSecurityEvent({
      eventType: 'login_success',
      severity: 'info',
      userId,
      ipAddress: clientIp || '0.0.0.0',
      userAgent: userAgent || null,
      metadata: { action: 'registration', role },
    })

    return NextResponse.json({
      success: true,
      userId,
      email,
      verificationEmailSent: emailSent,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
