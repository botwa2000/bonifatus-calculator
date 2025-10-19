/**
 * Registration API Route
 * Handles user registration with email and password
 * Validates input, checks Turnstile, creates account, sends verification code
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { validatePassword } from '@/lib/auth/password-validation'
import { verifyTurnstileToken, getClientIp } from '@/lib/auth/turnstile'
import { sendVerificationCode } from '@/lib/auth/verification'
import { z } from 'zod'

// Request validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  role: z.enum(['parent', 'child']),
  turnstileToken: z.string().min(1, 'Bot verification required'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = registerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { email, password, fullName, dateOfBirth, role, turnstileToken } = validationResult.data

    // Verify Turnstile token (bot protection)
    const clientIp = getClientIp(request.headers)
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp)

    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot verification failed. Please try again.',
        },
        { status: 400 }
      )
    }

    // Validate password strength and check for breaches
    const passwordValidation = await validatePassword(password, {
      email,
      name: fullName,
    })

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

    // Validate age (must be at least 5 years old, max 150 years)
    const dob = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()

    if (age < 5 || age > 150 || dob > today) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date of birth',
        },
        { status: 400 }
      )
    }

    // Check if child is under 13 (COPPA compliance - will require parental consent)
    const isUnder13 = age < 13
    if (role === 'child' && isUnder13) {
      // Note: Parental consent will be required in the next step
      // For now, we'll allow registration but flag for consent requirement
    }

    // Create Supabase auth user
    const supabase = await createServerSupabaseClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation will be handled by our custom verification code system
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
        data: {
          full_name: fullName,
          date_of_birth: dateOfBirth,
          role: role,
        },
      },
    })

    if (authError) {
      console.error('Supabase auth error:', authError)

      // Handle specific errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this email already exists',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create account. Please try again.',
        },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create account',
        },
        { status: 500 }
      )
    }

    // Send verification code
    const userAgent = request.headers.get('user-agent') || undefined
    const verificationResult = await sendVerificationCode(
      authData.user.id,
      email,
      fullName,
      'email_verification',
      clientIp,
      userAgent
    )

    if (!verificationResult.success) {
      // Account created but verification email failed
      // Log this but don't fail the request - user can resend code
      console.error('Failed to send verification code:', verificationResult.error)

      return NextResponse.json({
        success: true,
        userId: authData.user.id,
        email: email,
        verificationEmailSent: false,
        warning: 'Account created but verification email failed. Please use resend option.',
      })
    }

    // Log security event
    await supabase.rpc('log_security_event', {
      p_event_type: 'login_success',
      p_severity: 'info',
      p_user_id: authData.user.id,
      p_ip_address: clientIp || null,
      p_user_agent: userAgent || null,
      p_metadata: {
        action: 'registration',
        role: role,
      },
    })

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      email: email,
      verificationEmailSent: true,
      expiresAt: verificationResult.expiresAt,
      requiresParentalConsent: role === 'child' && isUnder13,
    })
  } catch (error) {
    console.error('Registration error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
