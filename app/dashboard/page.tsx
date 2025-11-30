import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export default async function DashboardRouterPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Not authenticated → send to login and bounce back here after
  if (!session) {
    redirect('/login?redirectTo=/dashboard')
  }

  // Look up the user role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = profile?.role

  if (role === 'parent') {
    redirect('/parent/dashboard')
  }

  if (role === 'child') {
    redirect('/student/dashboard')
  }

  // Fallback: default to student dashboard if role is missing/unknown
  redirect('/student/dashboard')
}
