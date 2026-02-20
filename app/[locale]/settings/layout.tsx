import { AppHeader } from '@/components/layout/AppHeader'
import { requireAuth, getUserProfile } from '@/lib/auth/session'
import { setRequestLocale, getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await requireAuth()
  const profile = await getUserProfile()
  const role = profile?.role || 'child'

  let navItems: { label: string; href: string }[] = []

  if (role === 'admin') {
    const t = await getTranslations('admin')
    navItems = [
      { label: t('navDashboard'), href: '/admin/dashboard' },
      { label: t('navUsers'), href: '/admin/users' },
      { label: t('navSecurity'), href: '/admin/security' },
      { label: t('navSettings'), href: '/admin/settings' },
    ]
  } else if (role === 'parent') {
    const t = await getTranslations('parent')
    navItems = [
      { label: t('navDashboard'), href: '/parent/dashboard' },
      { label: t('navChildren'), href: '/parent/children' },
      { label: t('navRewards'), href: '/parent/rewards' },
      { label: t('navInsights'), href: '/parent/insights' },
      { label: t('navSettings'), href: '/settings' },
    ]
  } else {
    const t = await getTranslations('student')
    navItems = [
      { label: t('navDashboard'), href: '/student/dashboard' },
      { label: t('navCalculator'), href: '/student/calculator' },
      { label: t('navSaved'), href: '/student/saved' },
      { label: t('navInsights'), href: '/student/insights' },
      { label: t('navSettings'), href: '/settings' },
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <AppHeader
        variant="auth"
        navItems={navItems}
        userName={profile?.fullName || user.email}
        userRole={role}
      />
      <main className="pt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">{children}</div>
      </main>
    </div>
  )
}
