import { redirect } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import { requireAuth, getUserProfile, getSession } from '@/lib/auth/session'
import { normalizeInviteCode } from '@/lib/connections/invite-code'
import { INVITE_PARAM, connectPath } from '@/lib/connections/invite-handoff'

export default async function DashboardRouterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [INVITE_PARAM]?: string }>
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  await requireAuth()
  // A child who signed in or up from a parent's invite link (lib/connections/invite-handoff.ts).
  const invite = normalizeInviteCode(query[INVITE_PARAM])

  // New Google users who haven't completed profile setup yet
  const session = await getSession()
  if (session?.user?.needsSetup) {
    redirect({
      href: invite ? `/auth/google-profile?${INVITE_PARAM}=${invite}` : '/auth/google-profile',
      locale,
    })
  }

  const profile = await getUserProfile()

  if (profile?.role === 'admin') {
    redirect({ href: '/admin/dashboard', locale })
  }

  if (profile?.role === 'parent') {
    redirect({ href: '/parent/children', locale })
  }

  redirect({ href: invite ? connectPath(invite) : '/student/dashboard', locale })
}
