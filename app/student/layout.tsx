import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirectTo=/student/dashboard')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role === 'parent') {
    redirect('/parent/dashboard')
  }

  const navItems = [
    { label: 'Dashboard', href: '/student/dashboard' },
    { label: 'Calculator', href: '/student/dashboard#calculator' },
    { label: 'Saved', href: '/student/dashboard#saved' },
    { label: 'Insights', href: '/student/dashboard#insights' },
    { label: 'Profile & connections', href: '/student/profile' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <AppHeader
        navItems={navItems}
        userName={profile?.full_name || session.user.email}
        userRole={profile?.role || 'student'}
      />
      <main className="pt-4">{children}</main>
    </div>
  )
}
