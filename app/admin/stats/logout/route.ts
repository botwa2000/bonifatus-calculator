/** GET /admin/stats/logout — ends the admin session. */
import { clearOtpCookie, clearSessionCookies } from '@/lib/stats/admin-auth'
import { redirect } from '../_shared'

export const dynamic = 'force-dynamic'

export function GET() {
  return redirect('/admin/stats/login', [...clearSessionCookies(), clearOtpCookie()])
}
