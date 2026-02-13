import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { requireAuth, getUserProfile } from '@/lib/auth/session'

export default async function DashboardRouterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireAuth()
  const profile = await getUserProfile()

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  if (profile?.role === 'parent') {
    redirect('/parent/children')
  }

  redirect('/student/dashboard')
}
