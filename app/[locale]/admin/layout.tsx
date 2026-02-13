import { AppHeader } from '@/components/layout/AppHeader'
import { requireAuth, requireAdmin } from '@/lib/auth/session'
import { setRequestLocale, getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const user = await requireAuth()
  const profile = await requireAdmin()

  const navItems = [
    { label: t('navDashboard'), href: '/admin/dashboard' },
    { label: t('navUsers'), href: '/admin/users' },
    { label: t('navSecurity'), href: '/admin/security' },
    { label: t('navSettings'), href: '/admin/settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <AppHeader
        variant="auth"
        navItems={navItems}
        userName={profile.fullName || user.email}
        userRole="admin"
      />
      <main className="pt-4">{children}</main>
    </div>
  )
}
