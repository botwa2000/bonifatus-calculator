import { getFormatter, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Breadcrumbs } from '@/components/ratgeber/Breadcrumbs'
import { CalculatorCta } from '@/components/ratgeber/CalculatorCta'
import { RatgeberBlocks } from '@/components/ratgeber/RatgeberBlocks'
import { ZeugnisErinnerungBlock } from '@/components/ratgeber/ZeugnisErinnerungBlock'
import { RichText, plainText, sourceAnchor } from '@/components/ratgeber/RichText'
import { JsonLd, articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from '@/components/seo/JsonLd'
import { LAND_COPY as c } from '@/content/ratgeber/laender/copy'
import { LAND_PAGES } from '@/content/ratgeber/laender'
import type { LandPage } from '@/content/ratgeber/laender/types'

const OVERVIEW = '/ratgeber/halbjahreszeugnis-bedeutung'
const h2 = 'text-2xl font-bold text-neutral-900 dark:text-white mb-4'

/** /de/ratgeber/halbjahreszeugnis-<land>: date, holidays and rules for one Land. */
export async function LandArticle({ page, locale }: { page: LandPage; locale: string }) {
  const t = await getTranslations('ratgeber')
  const format = await getFormatter()
  const crumbs = [
    { name: t('breadcrumbHome'), path: '/' },
    { name: t('breadcrumbHub'), path: '/ratgeber' },
    { name: c.breadcrumbOverview, path: OVERVIEW },
    { name: page.name, path: page.path },
  ]
  // The CTA block is rendered by RatgeberBlocks from the article's cta.
  const cta = c.cta

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: page.title,
          description: page.description,
          locale,
          path: page.path,
          publishedAt: page.publishedAt,
          updatedAt: page.updatedAt,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(locale, crumbs)} />
      <JsonLd
        data={faqPageJsonLd(
          page.faqs.map((f) => ({ question: f.question, answer: plainText(f.answer) }))
        )}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Breadcrumbs label={t('breadcrumbLabel')} items={crumbs} />

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white leading-tight mb-4">
            {page.title}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <time dateTime={page.updatedAt}>
              {t('updatedOn', {
                date: format.dateTime(new Date(page.updatedAt), { dateStyle: 'long' }),
              })}
            </time>
          </p>
        </header>

        <dl className="mb-10 grid sm:grid-cols-2 gap-4">
          {[
            [c.factZeugnis, page.facts.zeugnis],
            [c.factFerien, page.facts.ferien],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 p-5"
            >
              <dt className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300 mb-1">
                {label}
              </dt>
              <dd className="text-lg font-bold text-neutral-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-4 mb-10">
          {page.intro.map((para, i) => (
            <p key={i}>
              <RichText text={para} />
            </p>
          ))}
        </div>

        <ZeugnisErinnerungBlock land={page.slug} className="mb-12" />

        <article>
          <section id="termin" className="scroll-mt-24 mb-10">
            <h2 className={h2}>{c.terminHeading(page.name)}</h2>
            <RatgeberBlocks blocks={page.termin} cta={cta} />
          </section>

          <section id="ferien" className="scroll-mt-24 mb-10">
            <h2 className={h2}>{c.ferienHeading(page.name)}</h2>
            <RatgeberBlocks blocks={page.ferien} cta={cta} />
          </section>

          <section id="besonderheiten" className="scroll-mt-24 mb-10">
            <h2 className={h2}>{page.besonderheiten.heading}</h2>
            <RatgeberBlocks blocks={page.besonderheiten.blocks} cta={cta} />
          </section>

          <section id="naechste-schritte" className="scroll-mt-24 mb-10">
            <h2 className={h2}>{c.nextHeading}</h2>
            <div className="space-y-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <p>
                <RichText text={page.naechsteSchritte} />
              </p>
              <ul className="list-disc pl-6 space-y-2">
                {c.nextSteps.map((item) => (
                  <li key={item.slice(0, 30)}>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            </div>
            <CalculatorCta {...cta} className="my-8" />
          </section>

          <section
            id="faq"
            className="scroll-mt-24 mt-14 border-t border-neutral-200 dark:border-neutral-700 pt-10"
          >
            <h2 className={h2}>{c.faqTitle}</h2>
            <div className="space-y-6">
              {page.faqs.map((faq) => (
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
              {c.sourcesTitle}
            </h2>
            <ol className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 list-decimal pl-5">
              {page.sources.map((source, i) => (
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
            <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">{c.sourcesNote}</p>
          </section>
        </article>

        <nav
          aria-labelledby="andere-laender"
          className="mt-14 border-t border-neutral-200 dark:border-neutral-700 pt-10"
        >
          <Link
            href={OVERVIEW}
            className="inline-block mb-6 font-semibold text-primary-700 dark:text-primary-300 hover:underline"
          >
            ← {c.overviewLink}
          </Link>
          <h2
            id="andere-laender"
            className="text-xl font-bold text-neutral-900 dark:text-white mb-4"
          >
            {c.otherLaender}
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
            {LAND_PAGES.filter((p) => p.slug !== page.slug).map((p) => (
              <li key={p.slug}>
                <Link
                  href={p.path}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </>
  )
}
