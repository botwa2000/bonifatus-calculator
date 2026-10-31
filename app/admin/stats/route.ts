/** GET /admin/stats — the confidential usage dashboard (email-OTP session required). */
import { hasSession } from '@/lib/stats/admin-auth'
import { renderDashboardPage } from '@/lib/stats/render'
import { page, redirect } from './_shared'

export const dynamic = 'force-dynamic'

export function GET(req: Request) {
  if (!hasSession(req)) return redirect('/admin/stats/login')
  return page(200, renderDashboardPage())
}
