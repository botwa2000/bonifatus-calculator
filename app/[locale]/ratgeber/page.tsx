import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { auth } from '@/auth'
import { AppHeader } from '@/components/layout/AppHeader'
import { Breadcrumbs } from '@/components/ratgeber/Breadcrumbs'
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd'
import { buildAlternates } from '@/lib/seo/alternates'
import { getRatgeberIndex } from '@/content/ratgeber/index'

type Params = Promise<{ locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  if (getRatgeberIndex(locale).length === 0) return {}
  const t = await getTranslations({ locale, namespace: 'ratgeber' })
  return {
    title: t('hubMetaTitle'),
    description: t('hubDescription'),
    alternates: buildAlternates(locale, '/ratgeber'),
  }
}

export default async function RatgeberHubPage({ params }: { params: Params }) {
  const { locale } = await params
  setRequestLocale(locale)
  // The hub only exists in locales that have articles.
  const articles = getRatgeberIndex(locale)
  if (articles.length === 0) notFound()

  const session = await auth()
  const t = await getTranslations('ratgeber')
  const crumbs = [
    { name: t('breadcrumbHome'), path: '/' },
    { name: t('breadcrumbHub'), path: '/ratgeber' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <JsonLd data={breadcrumbJsonLd(locale, crumbs)} />
      <AppHeader variant="public" isAuthed={Boolean(session?.user)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Breadcrumbs label={t('breadcrumbLabel')} items={crumbs} />
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
            {t('hubTitle')}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl">
            {t('hubIntro')}
          </p>
        </header>

        <ul className="space-y-6">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/ratgeber/${a.slug}`}
                className="block rounded-2xl bg-white dark:bg-neutral-800/60 p-6 sm:p-8 shadow-card hover:shadow-lg border border-transparent hover:border-primary-300 transition-all"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                  {a.title}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4">{a.description}</p>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {t('readArticle')} → · {t('readingTime', { minutes: a.readingTimeMinutes })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
