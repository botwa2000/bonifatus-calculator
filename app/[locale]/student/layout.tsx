import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { requireAuth, getUserProfile } from '@/lib/auth/session'
import { setRequestLocale, getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('student')
  const user = await requireAuth()
  const profile = await getUserProfile()

  if (profile?.role === 'parent') {
    redirect('/parent/children')
  }

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  const navItems = [
    { label: t('navDashboard'), href: '/student/dashboard' },
    { label: t('navCalculator'), href: '/student/calculator' },
    { label: t('navSaved'), href: '/student/saved' },
    { label: t('navInsights'), href: '/student/insights' },
    { label: t('navProfile'), href: '/student/profile' },
    { label: t('navSettings'), href: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <AppHeader
        variant="auth"
        navItems={navItems}
        userName={profile?.fullName || user.email}
        userRole={profile?.role || 'student'}
      />
      <main className="pt-4">{children}</main>
    </div>
  )
}
