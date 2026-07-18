import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { auth } from '@/auth'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })
  return {
    title: t('compareTitle'),
    description: t('compareDescription'),
    alternates: { canonical: '/compare' },
  }
}

const COMPARISONS = [
  {
    href: '/compare/apps-that-reward-good-grades' as const,
    titleKey: 'compareAppsTitle' as const,
    descKey: 'compareAppsDescription' as const,
    emoji: '🏆',
  },
]

export default async function CompareIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('compare')
  const tSeo = await getTranslations('seo')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <AppHeader variant="public" isAuthed={isAuthed} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('indexTitle')}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            {t('indexSubtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {COMPARISONS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="block p-8 bg-white dark:bg-neutral-800/50 rounded-2xl shadow-card hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {c.emoji}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    {tSeo(c.titleKey)}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-3">
                    {tSeo(c.descKey)}
                  </p>
                  <span className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                    {t('viewComparison')} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
