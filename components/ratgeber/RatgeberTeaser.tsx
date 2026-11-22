import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getRatgeberIndex, getRatgeberMeta, ratgeberLocales } from '@/content/ratgeber/index'

/**
 * "Ratgeber für Eltern" block: crawlable links to the hub and a few articles.
 * Where the locale has no articles, it links to the hub in the language that has them
 * (marked with hreflang), so every locale passes link equity to the Ratgeber.
 */
export async function RatgeberTeaser({
  slugs,
  fallback = true,
  className = '',
}: {
  slugs?: string[]
  /** Where the locale has no articles: link to the hub in another language (true) or render nothing. */
  fallback?: boolean
  className?: string
}) {
  const locale = await getLocale()
  const t = await getTranslations('ratgeber')
  const all = getRatgeberIndex(locale)

  if (all.length === 0) {
    const hubLocale = ratgeberLocales()[0]
    if (!fallback || !hubLocale) return null
    return (
      <section
        className={`rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/50 p-6 ${className}`}
      >
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">{t('germanTitle')}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">{t('germanText')}</p>
        <a
          href={`/${hubLocale}/ratgeber`}
          hrefLang={hubLocale}
          className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          {t('germanLink')} →
        </a>
      </section>
    )
  }

  const articles = slugs
    ? slugs
        .map((s) => getRatgeberMeta(locale, s))
        .filter((a): a is NonNullable<typeof a> => Boolean(a))
    : all

  return (
    <section className={className}>
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{t('hubTitle')}</h2>
      <p className="text-neutral-600 dark:text-neutral-300 mb-6">{t('teaserIntro')}</p>
      <ul className="grid sm:grid-cols-2 gap-4">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/ratgeber/${a.slug}`}
              className="block h-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/50 p-5 hover:border-primary-400 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-neutral-900 dark:text-white mb-1">{a.title}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{a.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/ratgeber"
        className="mt-5 inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
      >
        {t('allArticles')} →
      </Link>
    </section>
  )
}
