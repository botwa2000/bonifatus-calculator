import { getUserProfile } from '@/lib/auth/session'
import { setRequestLocale } from 'next-intl/server'
import SettingsClient from './settings-client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const profile = await getUserProfile()

  return <SettingsClient role={(profile?.role as 'parent' | 'child') || 'child'} />
}
