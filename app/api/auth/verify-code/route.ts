/**
 * Verify Code API Route
 * Handles verification of 6-digit email verification codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { verifyCode } from '@/lib/auth/verification'
import { sendWelcomeEmail } from '@/lib/auth/verification'
import { getClientIp } from '@/lib/auth/turnstile'
import { z } from 'zod'

// Request validation schema
const verifyCodeSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  purpose: z.enum(['email_verification', 'password_reset']).default('email_verification'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = verifyCodeSchema.safeParse(body)

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

    const { userId, code, purpose } = validationResult.data

    // Verify the code
    const verificationResult = await verifyCode(userId, code, purpose)

    if (!verificationResult.success) {
      // Log failed verification attempt
      const supabase = await createServerSupabaseClient()
      const clientIp = getClientIp(request.headers)
      const userAgent = request.headers.get('user-agent') || undefined

      await supabase.rpc('log_security_event', {
        p_event_type: 'login_failure',
        p_severity: 'warning',
        p_user_id: userId,
        p_ip_address: clientIp || null,
        p_user_agent: userAgent || null,
        p_metadata: {
          reason: 'invalid_verification_code',
          purpose: purpose,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: verificationResult.error || 'Invalid or expired code',
        },
        { status: 400 }
      )
    }

    // Code verified successfully
    const supabase = await createServerSupabaseClient()

    // Get user profile to send welcome email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    // Get user email from auth.users
    const { data: userData } = await supabase.auth.admin.getUserById(userId)

    if (purpose === 'email_verification' && profile && userData?.user?.email) {
      // Send welcome email (don't fail the request if this fails)
      await sendWelcomeEmail(
        userData.user.email,
        profile.full_name,
        profile.role as 'parent' | 'child'
      )
    }

    // Log successful verification
    const clientIp = getClientIp(request.headers)
    const userAgent = request.headers.get('user-agent') || undefined

    await supabase.rpc('log_security_event', {
      p_event_type: 'login_success',
      p_severity: 'info',
      p_user_id: userId,
      p_ip_address: clientIp || null,
      p_user_agent: userAgent || null,
      p_metadata: {
        action: 'email_verification',
        purpose: purpose,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
    })
  } catch (error) {
    console.error('Verification error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
