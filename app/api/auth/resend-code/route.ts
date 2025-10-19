/**
 * Resend Verification Code API Route
 * Handles resending verification codes (rate-limited)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { sendVerificationCode, getVerificationCodeStatus } from '@/lib/auth/verification'
import { getClientIp } from '@/lib/auth/turnstile'
import { z } from 'zod'

// Request validation schema
const resendCodeSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  purpose: z.enum(['email_verification', 'password_reset']).default('email_verification'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = resendCodeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { userId, purpose } = validationResult.data

    const supabase = await createServerSupabaseClient()

    // Get user information
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !userData.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'User email not found',
        },
        { status: 404 }
      )
    }

    // Check if there's already an active code
    const status = await getVerificationCodeStatus(userId, purpose)

    if (status.hasActiveCode && status.expiresAt) {
      const now = new Date()
      const timeRemaining = status.expiresAt.getTime() - now.getTime()

      // If code expires in more than 30 seconds, don't allow resend yet
      if (timeRemaining > 30000) {
        const minutesRemaining = Math.ceil(timeRemaining / 60000)
        return NextResponse.json(
          {
            success: false,
            error: `A verification code was already sent. Please wait ${minutesRemaining} minute(s) before requesting a new one.`,
            expiresAt: status.expiresAt,
          },
          { status: 429 }
        )
      }
    }

    // Send new verification code
    const clientIp = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent') || undefined

    const result = await sendVerificationCode(
      userId,
      userData.user.email,
      profile.full_name,
      purpose,
      clientIp,
      userAgent
    )

    if (!result.success) {
      // Check if it's a rate limit error
      if (result.error?.includes('Rate limit')) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send verification code',
        },
        { status: 500 }
      )
    }

    // Log resend action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('log_security_event', {
      p_event_type: 'login_success',
      p_severity: 'info',
      p_user_id: userId,
      p_ip_address: clientIp || null,
      p_user_agent: userAgent || null,
      p_metadata: {
        action: 'resend_verification_code',
        purpose: purpose,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresAt: result.expiresAt,
    })
  } catch (error) {
    console.error('Resend code error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
