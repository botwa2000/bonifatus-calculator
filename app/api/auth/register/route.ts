import { NextRequest, NextResponse, after } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { accounts, users } from '@/drizzle/schema/auth'
import { userProfiles } from '@/drizzle/schema/users'
import { rateLimitTracking, verificationCodes } from '@/drizzle/schema/security'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { validatePassword } from '@/lib/auth/password-validation'
import { verifyTurnstileToken, getClientIp } from '@/lib/auth/turnstile'
import { validateMobileToken } from '@/lib/auth/validate-mobile-token'
import { logSecurityEvent } from '@/lib/db/queries/security'
import { sendEmail } from '@/lib/email/service'
import { getAccountExistsEmail, getVerificationCodeEmail } from '@/lib/email/templates'
import { generateCode } from '@/lib/auth/generate-code'
import { noteAction, withActionLog } from '@/lib/stats/with-action-log'

const CODE_TTL_MIN = 15
const RESEND_COOLDOWN_MS = 3 * 60_000
/** At most one "you already have an account" email per account per day. */
const NOTICE_INTERVAL_MS = 24 * 60 * 60_000

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional(),
  role: z.enum(['parent', 'child']),
  turnstileToken: z.string().optional(),
  schoolTown: z.string().max(200).optional(),
  schoolName: z.string().max(200).optional(),
  semesterCount: z.number().int().min(1).max(4).optional(),
  programLength: z.number().int().min(1).max(20).optional(),
})

async function displayName(userId: string, fallback: string) {
  const [profile] = await db
    .select({ fullName: userProfiles.fullName })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1)
  return profile?.fullName || fallback
}

/** Issues a fresh email-verification code for a pending account and mails it. */
async function sendVerificationCode(
  userId: string,
  email: string,
  ip: string,
  userAgent: string | null,
  opts: { respectCooldown: boolean }
) {
  try {
    if (opts.respectCooldown) {
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
        .orderBy(desc(verificationCodes.createdAt))
        .limit(1)
      if (recent) return
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
    }
    const code = generateCode()
    await db.insert(verificationCodes).values({
      userId,
      email,
      code,
      purpose: 'email_verification',
      expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000),
      ipAddress: ip,
      userAgent,
    })
    const t = getVerificationCodeEmail(code, await displayName(userId, email), CODE_TTL_MIN)
    const sent = await sendEmail({ to: email, subject: t.subject, text: t.text, html: t.html })
    if (!sent) console.error('[register] verification email not sent', { userId })
  } catch (err) {
    console.error('[register] sending verification code failed:', (err as Error).message)
  }
}

/** Lets the owner of an existing account know someone tried to sign up with their address. */
async function notifyAccountExists(userId: string, hasPassword: boolean) {
  try {
    const identifier = 'register_notice:' + userId
    const [recent] = await db
      .select({ id: rateLimitTracking.id })
      .from(rateLimitTracking)
      .where(
        and(
          eq(rateLimitTracking.identifier, identifier),
          gt(rateLimitTracking.lastAttemptAt, new Date(Date.now() - NOTICE_INTERVAL_MS))
        )
      )
      .limit(1)
    if (recent) return
    await db.delete(rateLimitTracking).where(eq(rateLimitTracking.identifier, identifier))
    await db
      .insert(rateLimitTracking)
      .values({ identifier, actionType: 'register', windowStart: new Date() })

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user) return
    const linked = await db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(eq(accounts.userId, userId))
    const t = getAccountExistsEmail(await displayName(userId, 'there'), {
      hasPassword,
      providers: linked.map((a) => a.provider),
    })
    await sendEmail({ to: user.email, subject: t.subject, text: t.text, html: t.html })
  } catch (err) {
    console.error('[register] account-exists notice failed:', (err as Error).message)
  }
}

async function handlePost(request: NextRequest) {
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
      fullName: fullNameField,
      name: nameField,
      dateOfBirth: dateOfBirthField,
      role,
      turnstileToken,
      schoolTown,
      schoolName,
      semesterCount,
      programLength,
    } = validationResult.data

    const fullName = (fullNameField || nameField || '').trim()
    const dateOfBirth = dateOfBirthField || null
    const email = rawEmail.toLowerCase()

    const clientIp = getClientIp(request.headers)
    const mobileToken = request.headers.get('X-Mobile-Client-Token')
    const isMobile = validateMobileToken(mobileToken, '/api/auth/register')
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

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      if (Number.isNaN(dob.getTime()) || age < 5 || age > 150 || dob > today) {
        return NextResponse.json(
          { success: false, error: 'Invalid date of birth' },
          { status: 400 }
        )
      }
    }

    const userAgent = request.headers.get('user-agent') || null
    const ip = clientIp || '0.0.0.0'
    const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000)
    // Hashing happens on every path so the response time doesn't depend on the outcome.
    const hashedPassword = await bcrypt.hash(password, 12)

    // The response is identical whether or not the address already has an account.
    // Only what lands in that mailbox differs, and it is sent after the response.
    const accepted = (userId: string) =>
      NextResponse.json({ success: true, userId, email, expiresAt: expiresAt.toISOString() })

    const [existing] = await db
      .select({ id: users.id, emailVerified: users.emailVerified, password: users.password })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing?.emailVerified) {
      // Tell the owner, not the requester. The id handed back belongs to no account,
      // so the verify screen simply never accepts a code for it.
      after(() => notifyAccountExists(existing.id, existing.password !== null))
      return noteAction(accepted(crypto.randomUUID()), { userId: existing.id, outcome: 'invalid' })
    }

    if (existing) {
      // Sign-up started earlier but never confirmed. Keep it as it is: replacing it would
      // let anyone cancel someone else's pending sign-up, or set its password before the
      // owner confirms. Send the code again (respecting the resend cooldown) instead.
      after(() =>
        sendVerificationCode(existing.id, email, ip, userAgent, { respectCooldown: true })
      )
      return accepted(existing.id)
    }

    const userId = crypto.randomUUID()
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        name: fullName,
        password: hashedPassword,
      })

      const profileBase = { id: userId, role, fullName }
      const profileExtra = {
        ...(dateOfBirth ? { dateOfBirth } : {}),
        ...(role === 'child'
          ? {
              schoolTown: schoolTown ?? null,
              schoolName: schoolName ?? null,
              semesterCount: semesterCount ?? 2,
              programLength: programLength ?? 13,
            }
          : {}),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.insert(userProfiles).values({ ...profileBase, ...profileExtra } as any)
    })

    after(async () => {
      await sendVerificationCode(userId, email, ip, userAgent, { respectCooldown: false })
      await logSecurityEvent({
        eventType: 'login_success',
        severity: 'info',
        userId,
        ipAddress: ip,
        userAgent,
        metadata: { action: 'registration', role },
      }).catch((err) => console.error('[register] security log failed:', (err as Error).message))
    })

    return accepted(userId)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

export const POST = withActionLog('signup', handlePost, {
  provider: 'password',
  userId: (b) => b.userId,
})
