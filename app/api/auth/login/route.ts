/**
 * Login API Route
 * Handles user login with email and password
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { verifyTurnstileToken, getClientIp } from '@/lib/auth/turnstile'
import { z } from 'zod'

// Request validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  turnstileToken: z.string().min(1, 'Bot verification required'),
})

export async function POST(request: NextRequest) {
  const debugEnabled =
    process.env.TURNSTILE_DEBUG === 'true' || process.env.NEXT_PUBLIC_TURNSTILE_DEBUG === 'true'

  try {
    // Parse and validate request body
    const body = await request.json()
    if (debugEnabled) {
      console.info('[login-debug] request body received', {
        email: body?.email,
        hasPassword: Boolean(body?.password),
        hasTurnstileToken: Boolean(body?.turnstileToken),
      })
    }
    const validationResult = loginSchema.safeParse(body)

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

    const { email, password, turnstileToken } = validationResult.data

    // Verify Turnstile token (bot protection)
    const clientIp = getClientIp(request.headers)
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp)
    if (debugEnabled) {
      console.info('[login-debug] turnstile result', {
        success: turnstileResult.success,
        clientIp,
        email,
        error: turnstileResult.error,
        errorCodes: turnstileResult.errorCodes,
      })
    }

    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot verification failed. Please try again.',
        },
        { status: 400 }
      )
    }

    // Sign in with Supabase
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)

      // Log failed login attempt
      const userAgent = request.headers.get('user-agent') || undefined

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('log_security_event', {
        p_event_type: 'login_failure',
        p_severity: 'warning',
        p_user_id: null,
        p_ip_address: clientIp || null,
        p_user_agent: userAgent || null,
        p_metadata: {
          email: email,
          reason: error.message,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Login failed',
        },
        { status: 500 }
      )
    }

    // Log successful login
    const userAgent = request.headers.get('user-agent') || undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('log_security_event', {
      p_event_type: 'login_success',
      p_severity: 'info',
      p_user_id: data.user.id,
      p_ip_address: clientIp || null,
      p_user_agent: userAgent || null,
      p_metadata: {
        action: 'login',
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    if (debugEnabled) {
      console.error('[login-debug] unexpected error', error)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
