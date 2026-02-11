import { requireAuth, getUserProfile } from '@/lib/auth/session'
import { AppHeader } from '@/components/layout/AppHeader'

export const dynamic = 'force-dynamic'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const profile = await getUserProfile()

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Settings', href: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <AppHeader
        variant="auth"
        navItems={navItems}
        userName={profile?.fullName || user.email}
        userRole={profile?.role}
      />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">{children}</main>
    </div>
  )
}
