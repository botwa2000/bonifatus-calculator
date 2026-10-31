/**
 * /admin/stats/login — GET shows the email form; POST checks Turnstile, and for
 * an allowed address emails a 6-digit code and sets the pending-code cookie.
 * Unknown addresses get the same response, so the allow-list never leaks.
 */
import { getClientIp, verifyTurnstileToken } from '@/lib/auth/turnstile'
import { sendEmail } from '@/lib/email/service'
import {
  generateOtp,
  hasSession,
  isAllowedEmail,
  isHttps,
  isSendLimited,
  otpCookie,
  recordSend,
} from '@/lib/stats/admin-auth'
import { renderLoginPage, renderOtpPage } from '@/lib/stats/render'
import { page, redirect } from '../_shared'

export const dynamic = 'force-dynamic'

const siteKey = () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function GET(req: Request) {
  if (hasSession(req)) return redirect('/admin/stats')
  return page(200, renderLoginPage({ siteKey: siteKey() }))
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers) ?? 'unknown'
  if (await isSendLimited(ip))
    return page(429, renderLoginPage({ siteKey: siteKey(), rateLimited: true }))

  const form = await req.formData().catch(() => null)
  const email = String(form?.get('email') ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 200)
  const token = String(form?.get('cf-turnstile-response') ?? '')
  const bot = await verifyTurnstileToken(token, ip)
  if (!bot.success) return page(403, renderLoginPage({ siteKey: siteKey(), error: true }))

  await recordSend(ip)
  // Unknown addresses get the same page and the same kind of cookie (for a code
  // nobody receives), so neither body, headers nor timing reveal the allow-list.
  if (!isAllowedEmail(email)) {
    return page(200, renderOtpPage(), [otpCookie(generateOtp().state, isHttps(req))])
  }

  const { code, state } = generateOtp()
  // Not awaited: an allowed address must not answer slower than an unknown one
  // (SMTP takes ~1 s), or response timing would reveal the allow-list.
  sendEmail({
    to: email,
    subject: `Bonifatus stats sign-in code: ${code}`,
    text: `Your Bonifatus stats sign-in code is ${code}. It expires in 10 minutes.

If you did not request it, ignore this email.`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
  <p>Your Bonifatus stats sign-in code:</p>
  <p style="font-size:32px;font-weight:800;letter-spacing:6px;margin:16px 0">${code}</p>
  <p style="color:#666">It expires in 10 minutes. If you did not request it, ignore this email.</p>
</div>`,
  })
    .then((sent) => {
      if (!sent) console.error('[admin/stats] OTP email could not be sent')
    })
    .catch(() => console.error('[admin/stats] OTP email could not be sent'))
  return page(200, renderOtpPage(), [otpCookie(state, isHttps(req))])
}
