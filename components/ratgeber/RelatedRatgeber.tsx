import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getRatgeberMeta } from '@/content/ratgeber/index'

/** Link card to a Ratgeber article; renders nothing where the article does not exist. */
export async function RelatedRatgeber({ slug }: { slug: string }) {
  const article = getRatgeberMeta(await getLocale(), slug)
  if (!article) return null
  const t = await getTranslations('ratgeber')

  return (
    <Link
      href={`/ratgeber/${slug}`}
      className="mt-8 block rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/50 p-6 hover:border-primary-400 hover:shadow-md transition-all"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
        {t('breadcrumbHub')}
      </p>
      <p className="font-semibold text-neutral-900 dark:text-white mb-1">{article.title}</p>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{article.description}</p>
      <p className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-400">
        {t('readArticle')} →
      </p>
    </Link>
  )
}
