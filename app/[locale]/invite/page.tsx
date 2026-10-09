import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Link, redirect } from '@/i18n/navigation'
import { auth } from '@/auth'
import { getUserProfile } from '@/lib/auth/session'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppStoreBadges } from '@/components/app-store-badges'

// Landing page for the parent's invite QR code / link (https://bonifatus.com/invite?code=…),
// e.g. when the code is scanned with the phone's camera instead of inside the app.

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ code?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'invite' })
  return { title: t('metaTitle'), robots: { index: false, follow: false } }
}

export default async function InvitePage({ params, searchParams }: Props) {
  const [{ locale }, { code }] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  if (!code || !/^\d{6}$/.test(code)) notFound()

  const session = await auth()
  const profile = session?.user ? await getUserProfile() : null
  if (profile?.role === 'child') {
    // The child confirms the connection on the Connections tab; the link alone never connects.
    redirect({ href: `/profile?tab=connections&code=${code}`, locale })
  }

  const t = await getTranslations('invite')
  const invitePath = `/invite?code=${code}`
  const isParent = Boolean(profile)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <AppHeader variant="public" isAuthed={Boolean(session?.user)} />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
          {isParent ? t('parentTitle') : t('title')}
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8">
          {isParent ? t('parentText') : t('description')}
        </p>

        <div className="mb-8 rounded-2xl bg-white dark:bg-neutral-800 shadow-card px-6 py-5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('codeLabel')}</p>
          <p className="text-4xl font-extrabold tracking-[0.3em] text-primary-600 dark:text-primary-400 tabular-nums">
            {code}
          </p>
        </div>

        {isParent ? (
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            {t('dashboardButton')}
          </Link>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link
                href={{ pathname: '/login', query: { redirectTo: invitePath } }}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {t('loginButton')}
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100 rounded-lg font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              >
                {t('registerButton')}
              </Link>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{t('appHint')}</p>
            <AppStoreBadges className="items-center" />
          </>
        )}
      </main>
    </div>
  )
}
