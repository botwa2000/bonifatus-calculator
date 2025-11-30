import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import ProfileClient from './profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirectTo=/profile')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, theme_preference, role')
    .eq('id', session!.user.id)
    .single()

  return (
    <ProfileClient
      userId={session!.user.id}
      email={session!.user.email || ''}
      fullName={profile?.full_name || ''}
      themePreference={(profile?.theme_preference as 'light' | 'dark' | 'system') || 'system'}
      role={(profile?.role as 'parent' | 'child') || 'parent'}
    />
  )
}
