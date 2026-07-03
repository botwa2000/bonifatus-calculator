import { createHmac, timingSafeEqual } from 'crypto'

const MOBILE_APP_SECRET = process.env.MOBILE_APP_SECRET ?? 'dev-secret-replace-in-prod'
const TOKEN_MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes — reject replayed tokens

if (process.env.NODE_ENV === 'production' && MOBILE_APP_SECRET === 'dev-secret-replace-in-prod') {
  console.error(
    '[security] MOBILE_APP_SECRET is using the insecure default. Set it in Vercel env vars.'
  )
}

/**
 * Validates the X-Mobile-Client-Token header sent by the Bonifatus Flutter app.
 *
 * Header format:  <hmac_hex>:<timestamp_ms>:<deviceId>
 * HMAC payload:   <deviceId>:<timestamp_ms>:<request_path>
 * Algorithm:      HMAC-SHA256, key = MOBILE_APP_SECRET
 *
 * Rejects tokens older than 5 minutes to prevent replay attacks.
 */
export function validateMobileToken(token: string | null | undefined, path: string): boolean {
  if (!token) return false

  const firstColon = token.indexOf(':')
  const secondColon = token.indexOf(':', firstColon + 1)
  if (firstColon === -1 || secondColon === -1) return false

  const providedHmac = token.slice(0, firstColon)
  const timestamp = token.slice(firstColon + 1, secondColon)
  const deviceId = token.slice(secondColon + 1)

  if (!providedHmac || !timestamp || !deviceId) return false

  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() - ts) > TOKEN_MAX_AGE_MS) return false

  const payload = `${deviceId}:${timestamp}:${path}`
  const computed = createHmac('sha256', MOBILE_APP_SECRET).update(payload).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(providedHmac, 'hex'))
  } catch {
    return false
  }
}
