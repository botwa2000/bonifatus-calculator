/** POST /admin/stats/verify — checks the emailed code and starts a 12-hour admin session. */
import { getClientIp } from '@/lib/auth/turnstile'
import {
  clearOtpCookie,
  clearVerifyFails,
  generateSession,
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
  if (await isVerifyLimited(ip)) return page(429, renderOtpPage({ rateLimited: true }))

  const form = await req.formData().catch(() => null)
  const code = String(form?.get('code') ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)
  if (validateOtp(code, getOtpState(req))) {
    await clearVerifyFails(ip)
    console.warn(`[admin/stats] login ok from ${ip}`)
    return redirect('/admin/stats', [
      ...sessionCookies(generateSession(), isHttps(req)),
      clearOtpCookie(),
    ])
  }
  await recordVerifyFail(ip)
  return page(401, renderOtpPage({ error: true }))
}
