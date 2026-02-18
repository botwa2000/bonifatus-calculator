import { requireAuth, getUserProfile } from '@/lib/auth/session'
import { setRequestLocale } from 'next-intl/server'
import ProfileClient from './profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await requireAuth()
  const profile = await getUserProfile()

  return (
    <ProfileClient
      email={user.email || ''}
      fullName={profile?.fullName || ''}
      dateOfBirth={profile?.dateOfBirth || null}
      themePreference={(profile?.themePreference as 'light' | 'dark' | 'system') || 'system'}
      role={(profile?.role as 'parent' | 'child') || 'parent'}
      schoolName={profile?.schoolName || null}
    />
  )
}
