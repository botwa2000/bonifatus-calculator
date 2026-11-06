/** GET /admin/stats — the confidential usage dashboard (email-OTP session required). */
import { hasSession, internalCookie, isHttps } from '@/lib/stats/admin-auth'
import { renderDashboardPage } from '@/lib/stats/render'
import { page, redirect } from './_shared'

export const dynamic = 'force-dynamic'

export function GET(req: Request) {
  if (!hasSession(req)) return redirect('/admin/stats/login')
  // Refreshed on every visit, so this browser never starts counting as a user.
  return page(200, renderDashboardPage(), [internalCookie(isHttps(req))])
}
