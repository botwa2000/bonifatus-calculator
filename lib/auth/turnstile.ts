/**
 * Cloudflare Turnstile Integration
 * Invisible bot protection for forms (privacy-friendly alternative to reCAPTCHA)
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verify Turnstile token on server-side
 * Call this from API routes before processing sensitive operations
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string
): Promise<{
  success: boolean
  error?: string
}> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured')
    // Allow a dev-only bypass when secret is missing locally
    if (process.env.NODE_ENV === 'development') {
      console.warn('Turnstile verification skipped in development mode')
      return { success: true }
    }
    return { success: false, error: 'Turnstile not configured' }
  }

  try {
    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (ip) {
      formData.append('remoteip', ip)
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Turnstile API error: ${response.statusText}`,
      }
    }

    const data = await response.json()

    if (!data.success) {
      console.warn('Turnstile verification failed:', data['error-codes'])
      return {
        success: false,
        error: 'Bot verification failed',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return {
      success: false,
      error: 'Failed to verify bot protection',
    }
  }
}

/**
 * Get client IP address from request headers
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIp(headers: Headers): string | undefined {
  // Check various headers in order of preference
  const ipHeaders = [
    'cf-connecting-ip', // Cloudflare
    'x-real-ip', // Nginx
    'x-forwarded-for', // Standard proxy header
    'x-vercel-forwarded-for', // Vercel
  ]

  for (const header of ipHeaders) {
    const value = headers.get(header)
    if (value) {
      // x-forwarded-for can be a comma-separated list, take the first one
      return value.split(',')[0].trim()
    }
  }

  return undefined
}

/**
 * Middleware helper to verify Turnstile token from request
 */
export async function verifyTurnstileFromRequest(request: Request): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const body = await request.json()
    const token = body.turnstileToken

    if (!token || typeof token !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid Turnstile token',
      }
    }

    const ip = getClientIp(request.headers)
    return await verifyTurnstileToken(token, ip)
  } catch (error) {
    console.error('Error parsing Turnstile token from request:', error)
    return {
      success: false,
      error: 'Invalid request format',
    }
  }
}
