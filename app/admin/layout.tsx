import { AppHeader } from '@/components/layout/AppHeader'
import { requireAuth, requireAdmin } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Security', href: '/admin/security' },
  { label: 'Settings', href: '/admin/settings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const profile = await requireAdmin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <AppHeader navItems={navItems} userName={profile.fullName || user.email} userRole="admin" />
      <main className="pt-4">{children}</main>
    </div>
  )
}
