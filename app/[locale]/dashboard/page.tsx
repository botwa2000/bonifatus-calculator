import { redirect } from 'next/navigation'
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
    redirect('/auth/google-profile')
  }

  const profile = await getUserProfile()

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  if (profile?.role === 'parent') {
    redirect('/parent/children')
  }

  redirect('/student/dashboard')
}
