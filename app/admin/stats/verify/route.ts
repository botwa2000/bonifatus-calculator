/** POST /admin/stats/verify — checks the emailed code and starts a 12-hour admin session. */
import { getClientIp } from '@/lib/auth/turnstile'
import {
  clearOtpCookie,
  clearVerifyFails,
  generateSession,
  internalCookie,
  getOtpState,
  isHttps,
  isVerifyLimited,
  recordVerifyFail,
  sessionCookies,
  validateOtp,
} from '@/lib/stats/admin-auth'
import { renderOtpPage } from '@/lib/stats/render'
import { page, redirect } from '../_shared'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ip = getClientIp(req.headers) ?? 'unknown'
  const form = await req.formData().catch(() => null)
  // Only ever echoed back onto the page of whoever typed it.
  const email = String(form?.get('email') ?? '').slice(0, 200)
  if (await isVerifyLimited(ip)) return page(429, renderOtpPage({ rateLimited: true, email }))

  const code = String(form?.get('code') ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)
  const tag = validateOtp(code, getOtpState(req))
  if (tag) {
    await clearVerifyFails(ip)
    console.warn(`[admin/stats] login ok from ${ip}`)
    return redirect('/admin/stats', [
      ...sessionCookies(generateSession(tag), isHttps(req)),
      internalCookie(isHttps(req)),
      clearOtpCookie(),
    ])
  }
  await recordVerifyFail(ip)
  return page(401, renderOtpPage({ error: true, email }))
}
