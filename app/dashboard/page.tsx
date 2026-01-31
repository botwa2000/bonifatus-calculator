import { redirect } from 'next/navigation'
import { requireAuth, getUserProfile } from '@/lib/auth/session'

export default async function DashboardRouterPage() {
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
