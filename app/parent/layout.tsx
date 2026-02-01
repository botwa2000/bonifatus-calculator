import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { requireAuth, getUserProfile } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  const profile = await getUserProfile()

  if (profile?.role === 'child') {
    redirect('/student/dashboard')
  }

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  const navItems = [
    { label: 'Dashboard', href: '/parent/children' },
    { label: 'Settings', href: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <AppHeader
        variant="auth"
        navItems={navItems}
        userName={profile?.fullName || user.email}
        userRole={profile?.role || 'parent'}
      />
      <main className="pt-4">{children}</main>
    </div>
  )
}
