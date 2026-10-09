import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { auth } from '@/auth'
import { AppHeader } from '@/components/layout/AppHeader'
import { Breadcrumbs } from '@/components/ratgeber/Breadcrumbs'
import { RatgeberBlocks } from '@/components/ratgeber/RatgeberBlocks'
import { RichText, plainText, sourceAnchor } from '@/components/ratgeber/RichText'
import { JsonLd, articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from '@/components/seo/JsonLd'
import { buildAlternates } from '@/lib/seo/alternates'
import { RATGEBER_INDEX, getRatgeberMeta } from '@/content/ratgeber/index'
import { getRatgeberArticle } from '@/content/ratgeber/registry'

type Params = Promise<{ locale: string; slug: string }>

export function generateStaticParams() {
  return RATGEBER_INDEX.map(({ locale, slug }) => ({ locale, slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const article = getRatgeberMeta(locale, slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.description,
    alternates: buildAlternates(locale, `/ratgeber/${slug}`),
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
  }
}

export default async function RatgeberArticlePage({ params }: { params: Params }) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const article = getRatgeberArticle(locale, slug)
  if (!article) notFound()

  const session = await auth()
  const t = await getTranslations('ratgeber')
  const format = await getFormatter()
  const path = `/ratgeber/${slug}`
  const crumbs = [
    { name: t('breadcrumbHome'), path: '/' },
    { name: t('breadcrumbHub'), path: '/ratgeber' },
    { name: article.title, path },
  ]
  const related = article.related
    .map((s) => getRatgeberMeta(locale, s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <JsonLd
        data={articleJsonLd({
          title: article.title,
          description: article.description,
          locale,
          path,
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(locale, crumbs)} />
      <JsonLd
        data={faqPageJsonLd(
          article.faqs.map((f) => ({ question: f.question, answer: plainText(f.answer) }))
        )}
      />
      <AppHeader variant="public" isAuthed={Boolean(session?.user)} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Breadcrumbs label={t('breadcrumbLabel')} items={crumbs} />

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white leading-tight mb-4">
            {article.title}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <time dateTime={article.updatedAt}>
              {t('updatedOn', {
                date: format.dateTime(new Date(article.updatedAt), { dateStyle: 'long' }),
              })}
            </time>
            {' · '}
            {t('readingTime', { minutes: article.readingTimeMinutes })}
          </p>
        </header>

        <div className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-4 mb-10">
          {article.intro.map((para, i) => (
            <p key={i}>
              <RichText text={para} />
            </p>
          ))}
        </div>

        <nav
          aria-labelledby="toc-title"
          className="mb-12 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-5"
        >
          <p
            id="toc-title"
            className="text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-3"
          >
            {t('toc')}
          </p>
          <ol className="space-y-1.5 text-sm list-decimal pl-5">
            {article.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-primary-700 dark:text-primary-300 hover:underline"
                >
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article>
          {article.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {section.heading}
              </h2>
              <RatgeberBlocks blocks={section.blocks} cta={article.cta} />
            </section>
          ))}

          <section
            id="faq"
            className="scroll-mt-24 mt-14 border-t border-neutral-200 dark:border-neutral-700 pt-10"
          >
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
              {t('faqTitle')}
            </h2>
            <div className="space-y-6">
              {article.faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    <RichText text={faq.answer} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="quellen"
            className="scroll-mt-24 mt-14 border-t border-neutral-200 dark:border-neutral-700 pt-10"
          >
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('sourcesTitle')}
            </h2>
            <ol className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 list-decimal pl-5">
              {article.sources.map((source, i) => (
                <li key={source.url} id={sourceAnchor(i + 1)} className="scroll-mt-24">
                  {source.text}{' '}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-primary-600 dark:text-primary-400 underline underline-offset-2"
                  >
                    {source.url.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        </article>

        {related.length > 0 && (
          <aside className="mt-14 border-t border-neutral-200 dark:border-neutral-700 pt-10">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('relatedTitle')}
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/ratgeber/${r.slug}`}
                    className="block h-full rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:border-primary-400 hover:shadow-md transition-all"
                  >
                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">{r.title}</p>
                    <p className="text-sm text-primary-600 dark:text-primary-400">
                      {t('readArticle')} →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </main>
    </div>
  )
}
