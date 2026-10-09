import { redirect } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import { requireAuth, getUserProfile, getSession } from '@/lib/auth/session'

export default async function DashboardRouterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireAuth()

  // New Google users who haven't completed profile setup yet
  const session = await getSession()
  if (session?.user?.needsSetup) {
    redirect({ href: '/auth/google-profile', locale })
  }

  const profile = await getUserProfile()

  if (profile?.role === 'admin') {
    redirect({ href: '/admin/dashboard', locale })
  }

  if (profile?.role === 'parent') {
    redirect({ href: '/parent/children', locale })
  }

  redirect({ href: '/student/dashboard', locale })
}
