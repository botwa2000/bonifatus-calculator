/**
 * Email Verification Code Utilities
 * Handles generation and validation of 6-digit verification codes
 */

import { createServerSupabaseClient } from '@/lib/supabase/client'
import { sendEmail } from '@/lib/email/service'
import { getVerificationCodeEmail, getWelcomeEmail } from '@/lib/email/templates'

/**
 * Generate and send verification code to user's email
 */
export async function sendVerificationCode(
  userId: string,
  email: string,
  userName: string,
  purpose: 'email_verification' | 'password_reset' = 'email_verification',
  ipAddress?: string,
  userAgent?: string
): Promise<{
  success: boolean
  error?: string
  expiresAt?: Date
}> {
  try {
    const supabase = await createServerSupabaseClient()

    // Call database function to create verification code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('create_verification_code', {
      p_user_id: userId,
      p_email: email,
      p_purpose: purpose,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
    })

    if (error) {
      console.error('Error creating verification code:', error)

      // Check if it's a rate limit error
      if (error.message.includes('Rate limit exceeded')) {
        return {
          success: false,
          error: 'Too many verification attempts. Please wait before requesting another code.',
        }
      }

      return {
        success: false,
        error: 'Failed to create verification code',
      }
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return {
        success: false,
        error: 'Failed to generate verification code',
      }
    }

    const codeData = Array.isArray(data) ? data[0] : data
    const { code, expires_at } = codeData

    // Send email with verification code
    console.log('[Verification] Preparing to send verification email to:', email)
    const emailTemplate = getVerificationCodeEmail(code, userName, 15)
    const emailSent = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    })

    if (!emailSent) {
      console.error('[Verification] ✗ Failed to send verification email to:', email)
      return {
        success: false,
        error: 'Failed to send verification email. Please try again.',
      }
    }

    console.log('[Verification] ✓ Verification email sent successfully to:', email)

    return {
      success: true,
      expiresAt: new Date(expires_at),
    }
  } catch (error) {
    console.error('Error in sendVerificationCode:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Verify a code entered by the user
 */
export async function verifyCode(
  userId: string,
  code: string,
  purpose: 'email_verification' | 'password_reset' = 'email_verification'
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Validate code format
    if (!code || !/^\d{6}$/.test(code)) {
      return {
        success: false,
        error: 'Invalid code format. Please enter a 6-digit code.',
      }
    }

    const supabase = await createServerSupabaseClient()

    // Call database function to verify code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('verify_code', {
      p_user_id: userId,
      p_code: code,
      p_purpose: purpose,
    })

    if (error) {
      console.error('Error verifying code:', error)
      return {
        success: false,
        error: 'Failed to verify code',
      }
    }

    // data is a boolean indicating success
    if (!data) {
      return {
        success: false,
        error: 'Invalid or expired code. Please check the code and try again.',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in verifyCode:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get verification code status for a user
 */
export async function getVerificationCodeStatus(
  userId: string,
  purpose: 'email_verification' | 'password_reset' = 'email_verification'
): Promise<{
  hasActiveCode: boolean
  expiresAt?: Date
  attemptCount?: number
  maxAttempts?: number
}> {
  try {
    const supabase = await createServerSupabaseClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_verification_code_status', {
      p_user_id: userId,
      p_purpose: purpose,
    })

    if (error) {
      console.error('Error getting verification code status:', error)
      return { hasActiveCode: false }
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { hasActiveCode: false }
    }

    const status = Array.isArray(data) ? data[0] : data

    return {
      hasActiveCode: status.has_active_code,
      expiresAt: status.expires_at ? new Date(status.expires_at) : undefined,
      attemptCount: status.attempt_count,
      maxAttempts: status.max_attempts,
    }
  } catch (error) {
    console.error('Error in getVerificationCodeStatus:', error)
    return { hasActiveCode: false }
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string,
  userRole: 'parent' | 'child'
): Promise<boolean> {
  try {
    const emailTemplate = getWelcomeEmail(userName, userRole)

    const success = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    })

    return success
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return false
  }
}

/**
 * Calculate time remaining until code expires
 */
export function getTimeRemaining(expiresAt: Date): {
  minutes: number
  seconds: number
  isExpired: boolean
} {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()

  if (diff <= 0) {
    return { minutes: 0, seconds: 0, isExpired: true }
  }

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  return { minutes, seconds, isExpired: false }
}
