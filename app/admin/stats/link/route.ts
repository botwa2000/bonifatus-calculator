/**
 * /admin/stats/link#<token> — one-time sign-in link, minted with
 * POST /api/admin/usage-stats {"action":"login-link"} + X-Admin-Key.
 * GET serves a page that posts the fragment token back; POST redeems it
 * (single use, 10 minutes) and starts a one-hour admin session.
 */
import { getClientIp } from '@/lib/auth/turnstile'
import {
  clearVerifyFails,
  generateSession,
  internalCookie,
  isHttps,
  isVerifyLimited,
  LINK_SESSION_TTL_SEC,
  recordVerifyFail,
  redeemLoginLink,
  sessionCookies,
} from '@/lib/stats/admin-auth'
import { renderLinkPage } from '@/lib/stats/render'
import { page, redirect } from '../_shared'

export const dynamic = 'force-dynamic'

export function GET() {
  return page(200, renderLinkPage())
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers) ?? 'unknown'
  if (await isVerifyLimited(ip)) return page(429, renderLinkPage({ error: true }))

  const form = await req.formData().catch(() => null)
  const token = String(form?.get('token') ?? '').slice(0, 64)
  const tag = await redeemLoginLink(token)
  if (tag) {
    await clearVerifyFails(ip)
    console.warn(`[admin/stats] one-time link login from ${ip}`)
    return redirect('/admin/stats', [
      ...sessionCookies(generateSession(tag, LINK_SESSION_TTL_SEC), isHttps(req)),
      internalCookie(isHttps(req)),
    ])
  }
  await recordVerifyFail(ip)
  return page(401, renderLinkPage({ error: true }))
}
