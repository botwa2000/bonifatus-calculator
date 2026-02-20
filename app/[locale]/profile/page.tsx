import { requireAuth, getUserProfile } from '@/lib/auth/session'
import { setRequestLocale } from 'next-intl/server'
import { db } from '@/lib/db/client'
import { gradingSystems } from '@/drizzle/schema/grades'
import { eq } from 'drizzle-orm'
import ProfileClient from './profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await requireAuth()
  const profile = await getUserProfile()

  const gs = await db
    .select({ id: gradingSystems.id, name: gradingSystems.name, code: gradingSystems.code })
    .from(gradingSystems)
    .where(eq(gradingSystems.isActive, true))
    .orderBy(gradingSystems.displayOrder)

  return (
    <ProfileClient
      email={user.email || ''}
      fullName={profile?.fullName || ''}
      dateOfBirth={profile?.dateOfBirth || null}
      themePreference={(profile?.themePreference as 'light' | 'dark' | 'system') || 'system'}
      role={(profile?.role as 'parent' | 'child') || 'parent'}
      schoolName={profile?.schoolName || null}
      avatarUrl={profile?.avatarUrl || null}
      defaultGradingSystemId={profile?.defaultGradingSystemId || null}
      defaultClassLevel={profile?.defaultClassLevel || null}
      gradingSystems={gs.map((g) => ({
        id: g.id,
        name: g.name as string | Record<string, string>,
        code: g.code,
      }))}
    />
  )
}
