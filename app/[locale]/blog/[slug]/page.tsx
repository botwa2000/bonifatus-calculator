import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { JsonLd, blogPostJsonLd, faqPageJsonLd } from '@/components/seo/JsonLd'
import { getPost, getAllSlugs } from '@/content/blog/registry'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildAlternates } from '@/lib/seo/alternates'
import { routing } from '@/i18n/routing'

export async function generateStaticParams() {
  const slugs = getAllSlugs()
  const params: Array<{ locale: string; slug: string }> = []
  for (const locale of routing.locales) {
    for (const slug of slugs) {
      params.push({ locale, slug })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await getPost(locale, slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    alternates: buildAlternates(locale, `/blog/${slug}`),
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const post = await getPost(locale, slug)
  if (!post) notFound()

  const session = await auth()
  const isAuthed = Boolean(session?.user)
  const t = await getTranslations('blog')

  const headings = post.sections.filter((s) => s.heading)

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <JsonLd
        data={blogPostJsonLd({
          title: post.title,
          description: post.description,
          slug: post.slug,
          publishedAt: post.publishedAt,
          locale,
        })}
      />
      {post.faqs && <JsonLd data={faqPageJsonLd(post.faqs)} />}
      <AppHeader variant="public" isAuthed={isAuthed} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back */}
        <Link
          href="/blog"
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-8 inline-block"
        >
          ← Blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            <time dateTime={post.publishedAt}>
              {t('publishedOn')}{' '}
              {new Date(post.publishedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>·</span>
            <span>
              {post.readingTimeMinutes} {t('minuteRead')}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">{post.description}</p>
        </header>

        <div className="grid md:grid-cols-[1fr_240px] gap-12">
          {/* Article body */}
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            {post.sections.map((section, idx) => (
              <div key={idx}>
                {section.heading && (
                  <h2
                    id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                    className="text-xl font-bold text-neutral-900 dark:text-white mt-8 mb-3"
                  >
                    {section.heading}
                  </h2>
                )}
                {section.body.split('\n\n').map((para, pIdx) => (
                  <p
                    key={pIdx}
                    className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4"
                    dangerouslySetInnerHTML={{
                      __html: para
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>'),
                    }}
                  />
                ))}
              </div>
            ))}

            {/* FAQ section */}
            {post.faqs && post.faqs.length > 0 && (
              <div className="mt-12 border-t pt-8 border-neutral-200 dark:border-neutral-700">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">FAQ</h2>
                <div className="space-y-6">
                  {post.faqs.map((faq, idx) => (
                    <div key={idx}>
                      <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-300">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar: TOC + CTA */}
          <aside className="hidden md:block space-y-8">
            {headings.length > 0 && (
              <div className="sticky top-8 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 uppercase tracking-wider">
                  {t('tableOfContents')}
                </h3>
                <ul className="space-y-2">
                  {headings.map((s) => (
                    <li key={s.heading}>
                      <a
                        href={`#${s.heading!.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {s.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-5 border border-primary-100 dark:border-primary-800">
              <h3 className="font-bold text-neutral-900 dark:text-white mb-2">{t('ctaTitle')}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">{t('ctaDesc')}</p>
              <Link
                href="/register"
                className="block text-center px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
              >
                {t('ctaButton')}
              </Link>
            </div>
          </aside>
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden mt-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">{t('ctaTitle')}</h2>
          <p className="opacity-90 mb-6">{t('ctaDesc')}</p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:shadow-xl transition-all"
          >
            {t('ctaButton')}
          </Link>
        </div>
      </main>
    </div>
  )
}
